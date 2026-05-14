import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createHash } from "crypto";
import {
  defaultAdminUser,
  defaultAssets,
  defaultFairValuePerKg,
  defaultJournalEntries,
} from "./defaultState.js";
import { getPool, initDatabase, withTransaction } from "./database.js";

dotenv.config();

const app = express();
const port = Number(process.env.BACKEND_PORT || 3001);
const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

app.use(
  cors({
    origin: [frontendOrigin, "http://127.0.0.1:5173"],
    credentials: true,
  }),
);
app.use(express.json({ limit: "2mb" }));

function hashPassword(password) {
  return createHash("sha256").update(password).digest("hex");
}

function formatAccountCategory(account) {
  const code = String(account || "")
    .trim()
    .split(" ")[0];
  const prefix = code.charAt(0);

  switch (prefix) {
    case "1":
      return "asset";
    case "2":
      return "liability";
    case "3":
      return "equity";
    case "4":
      return "revenue";
    case "5":
      return "expense";
    default:
      return "expense";
  }
}

function computeAccountBalances(entries) {
  const balances = new Map();

  const ensureBalance = (account) => {
    if (!balances.has(account)) {
      balances.set(account, {
        code: account.split(" ")[0] || account,
        name: account,
        debit: 0,
        credit: 0,
        category: formatAccountCategory(account),
      });
    }
    return balances.get(account);
  };

  for (const entry of entries) {
    const debit = ensureBalance(entry.debitAccount);
    debit.debit += Number(entry.debitAmount || 0);

    const credit = ensureBalance(entry.creditAccount);
    credit.credit += Number(entry.creditAmount || 0);
  }

  return Array.from(balances.values()).sort((a, b) =>
    a.code.localeCompare(b.code),
  );
}

function normalizeAsset(row) {
  return {
    id: String(row.id),
    tagId: row.tag_id,
    type: row.type,
    age: Number(row.age),
    ageUpdatedAt: row.age_updated_at,
    weight: Number(row.weight),
    fairValue: Number(row.fair_value),
    purchasePrice: row.purchase_price ? Number(row.purchase_price) : undefined,
    profit: row.profit ? Number(row.profit) : undefined,
    loss: row.loss ? Number(row.loss) : undefined,
    lastUpdated: row.last_updated,
    updatedBy: row.updated_by,
    createdBy: row.created_by,
  };
}

function normalizeJournalEntry(row) {
  return {
    id: String(row.id),
    date: row.entry_date,
    description: row.description,
    debitAccount: row.debit_account,
    debitAssetId: row.debit_asset_id ?? undefined,
    debitAmount: Number(row.debit_amount),
    creditAccount: row.credit_account,
    creditAssetId: row.credit_asset_id ?? undefined,
    creditAmount: Number(row.credit_amount),
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
  };
}

function normalizeAdminUser(row) {
  return {
    id: String(row.id),
    username: row.username,
    fullName: row.full_name,
    email: row.email,
    role: row.role,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}

function normalizeJournalDocument(row) {
  return {
    id: String(row.id),
    journalEntryId: String(row.journal_entry_id),
    fileName: row.file_name,
    fileData: row.file_data,
    fileType: row.file_type,
    uploadedAt: row.uploaded_at,
    uploadedBy: row.uploaded_by,
  };
}

function normalizeChartOfAccount(row) {
  return {
    code: row.code,
    name: row.name,
    parentCode: row.parent_code,
    category: row.category,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}

function toAssetValues(assets) {
  return assets.map((asset) => [
    String(asset.id),
    asset.tagId,
    asset.type,
    Number(asset.age),
    asset.ageUpdatedAt || asset.lastUpdated,
    Number(asset.weight),
    Number(asset.fairValue),
    asset.purchasePrice ? Number(asset.purchasePrice) : null,
    asset.profit ? Number(asset.profit) : 0,
    asset.loss ? Number(asset.loss) : 0,
    asset.lastUpdated,
    asset.createdBy || "system",
    asset.updatedBy || null,
  ]);
}

async function getFairValuePerKg() {
  const [rows] = await getPool().query(
    "SELECT setting_value FROM app_settings WHERE setting_key = 'fair_value_per_kg' LIMIT 1",
  );
  if (!rows.length) return defaultFairValuePerKg;
  const parsed = Number(rows[0].setting_value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultFairValuePerKg;
}

async function setFairValuePerKg(value, connection = null) {
  const queryRunner = connection || getPool();
  await queryRunner.query(
    "INSERT INTO app_settings (setting_key, setting_value) VALUES ('fair_value_per_kg', ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)",
    [String(value)],
  );
}

function toJournalValues(entries) {
  return entries.map((entry) => [
    String(entry.id),
    entry.date,
    entry.description,
    entry.debitAccount,
    entry.debitAssetId || null,
    Number(entry.debitAmount),
    entry.creditAccount,
    entry.creditAssetId || null,
    Number(entry.creditAmount),
    entry.createdBy || "system",
    entry.updatedBy || null,
  ]);
}

function getCurrentPeriod(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function calculateBalances(journalEntries) {
  const balances = {};

  journalEntries.forEach((entry) => {
    if (!balances[entry.debitAccount]) balances[entry.debitAccount] = 0;
    if (!balances[entry.creditAccount]) balances[entry.creditAccount] = 0;
    balances[entry.debitAccount] += Number(entry.debitAmount || 0);
    balances[entry.creditAccount] -= Number(entry.creditAmount || 0);
  });

  return balances;
}

function calculateWbsSummary(journalEntries, biologicalAssets) {
  const balances = calculateBalances(journalEntries);

  let pendapatanPenjualan = 0;
  let keuntunganNilaiWajar = 0;
  let pendapatanLain = 0;
  let hpp = 0;
  let bebanGaji = 0;
  let bebanPakan = 0;
  let bebanPenyusutan = 0;
  let bebanLain = 0;

  journalEntries.forEach((entry) => {
    if (entry.creditAccount.includes("Pendapatan Penjualan")) pendapatanPenjualan += Number(entry.creditAmount || 0);
    if (entry.creditAccount.includes("Keuntungan Nilai Wajar")) keuntunganNilaiWajar += Number(entry.creditAmount || 0);
    if (entry.creditAccount.includes("Pendapatan Lain-lain")) pendapatanLain += Number(entry.creditAmount || 0);
    if (entry.debitAccount.includes("Harga Pokok Penjualan")) hpp += Number(entry.debitAmount || 0);
    if (entry.debitAccount.includes("Beban Gaji")) bebanGaji += Number(entry.debitAmount || 0);
    if (entry.debitAccount.includes("Beban Pakan")) bebanPakan += Number(entry.debitAmount || 0);
    if (entry.debitAccount.includes("Beban Penyusutan")) bebanPenyusutan += Number(entry.debitAmount || 0);
    if (entry.debitAccount.includes("Beban Lain-lain")) bebanLain += Number(entry.debitAmount || 0);
  });

  const kas = balances["1-1100 Kas"] || 0;
  const bank = balances["1-1200 Bank"] || 0;
  const persediaanPakan = balances["1-2100 Persediaan Pakan"] || 0;
  const asetBiologis = balances["1-3000 Aset Biologis"] || 0;
  const asetTetap = balances["1-4100 Aset Tetap - Kandang"] || 0;
  const akumulasiPenyusutan = Math.abs(balances["1-4200 Akumulasi Penyusutan"] || 0);

  const wbsaTotalAsetLancar = kas + bank + persediaanPakan;
  const wbsaTotalAsetTidakLancar = asetBiologis + (asetTetap - akumulasiPenyusutan);
  const wbsaTotalAset = wbsaTotalAsetLancar + wbsaTotalAsetTidakLancar;

  const hutangUsaha = Math.abs(balances["2-1000 Hutang Usaha"] || 0);
  const modalDisetor = Math.abs(balances["3-1000 Modal Disetor"] || 0);

  const wplLabaBersih =
    pendapatanPenjualan + keuntunganNilaiWajar + pendapatanLain - hpp - bebanGaji - bebanPakan - bebanPenyusutan - bebanLain;

  const wbslTotalLiabilitas = hutangUsaha;
  const wbslTotalEkuitas = modalDisetor + wplLabaBersih;
  const wbslTotalLiabilitasEkuitas = wbslTotalLiabilitas + wbslTotalEkuitas;

  return {
    wbsa: {
      kas,
      bank,
      persediaanPakan,
      asetBiologis,
      totalAsetLancar: wbsaTotalAsetLancar,
      totalAsetTidakLancar: wbsaTotalAsetTidakLancar,
      totalAset: wbsaTotalAset,
      jumlahAsetBiologis: biologicalAssets.length,
    },
    wbsl: {
      hutangUsaha,
      modalDisetor,
      labaDitahan: wplLabaBersih,
      totalLiabilitas: wbslTotalLiabilitas,
      totalEkuitas: wbslTotalEkuitas,
      totalLiabilitasEkuitas: wbslTotalLiabilitasEkuitas,
      isBalanced: Math.abs(wbsaTotalAset - wbslTotalLiabilitasEkuitas) < 1,
    },
    wpl: {
      pendapatanPenjualan,
      keuntunganNilaiWajar,
      pendapatanLain,
      hpp,
      bebanGaji,
      bebanPakan,
      bebanPenyusutan,
      bebanLain,
      labaBersih: wplLabaBersih,
    },
  };
}

async function ensureMonthlyBackup({ force = false } = {}) {
  const period = getCurrentPeriod();
  const [rows] = await getPool().query(
    "SELECT id FROM monthly_backups WHERE period = ? LIMIT 1",
    [period],
  );

  if (rows.length > 0 && !force) {
    return { period, created: false };
  }

  const state = await getState();
  const snapshot = {
    period,
    savedAt: new Date().toISOString(),
    fairValuePerKg: state.fairValuePerKg,
    biologicalAssets: state.biologicalAssets,
    journalEntries: state.journalEntries,
    accountBalances: state.accountBalances,
    wbsSummary: calculateWbsSummary(state.journalEntries, state.biologicalAssets),
  };

  await getPool().query(
    "INSERT INTO monthly_backups (period, snapshot_json) VALUES (?, ?) ON DUPLICATE KEY UPDATE snapshot_json = VALUES(snapshot_json)",
    [period, JSON.stringify(snapshot)],
  );

  return { period, created: true };
}

async function getState() {
  const pool = getPool();
  const [assetRows] = await pool.query(
    "SELECT id, tag_id, type, age, age_updated_at, weight, fair_value, purchase_price, profit, loss, last_updated, created_by, updated_by FROM biological_assets ORDER BY created_at ASC, tag_id ASC",
  );
  const [journalRows] = await pool.query(
    "SELECT id, entry_date, description, debit_account, debit_asset_id, debit_amount, credit_account, credit_asset_id, credit_amount, created_by, updated_by, created_at FROM journal_entries ORDER BY entry_date ASC, created_at ASC, id ASC",
  );

  const biologicalAssets = assetRows.map(normalizeAsset);
  const journalEntries = journalRows.map(normalizeJournalEntry);

  return {
    biologicalAssets,
    journalEntries,
    accountBalances: computeAccountBalances(journalEntries),
    fairValuePerKg: await getFairValuePerKg(),
  };
}

async function replaceState(biologicalAssets, journalEntries, fairValuePerKg) {
  await withTransaction(async (connection) => {
    await connection.query("DELETE FROM journal_entries");
    await connection.query("DELETE FROM biological_assets");

    if (biologicalAssets.length > 0) {
      await connection.query(
        "INSERT INTO biological_assets (id, tag_id, type, age, age_updated_at, weight, fair_value, purchase_price, profit, loss, last_updated, created_by, updated_by) VALUES ?",
        [toAssetValues(biologicalAssets)],
      );
    }

    if (journalEntries.length > 0) {
      await connection.query(
        "INSERT INTO journal_entries (id, entry_date, description, debit_account, debit_asset_id, debit_amount, credit_account, credit_asset_id, credit_amount, created_by, updated_by) VALUES ?",
        [toJournalValues(journalEntries)],
      );
    }

    if (Number.isFinite(Number(fairValuePerKg)) && Number(fairValuePerKg) > 0) {
      await setFairValuePerKg(Number(fairValuePerKg), connection);
    }
  });

  return getState();
}

async function addJournalEntry(entry) {
  const id = String(entry.id || Date.now());
  const payload = {
    id,
    date: entry.date,
    description: entry.description,
    debitAccount: entry.debitAccount,
    debitAssetId: entry.debitAssetId || null,
    debitAmount: Number(entry.debitAmount),
    creditAccount: entry.creditAccount,
    creditAssetId: entry.creditAssetId || null,
    creditAmount: Number(entry.creditAmount),
  };

  await getPool().query(
    "INSERT INTO journal_entries (id, entry_date, description, debit_account, debit_asset_id, debit_amount, credit_account, credit_asset_id, credit_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      payload.id,
      payload.date,
      payload.description,
      payload.debitAccount,
      payload.debitAssetId,
      payload.debitAmount,
      payload.creditAccount,
      payload.creditAssetId,
      payload.creditAmount,
    ],
  );

  return payload;
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/state", async (_req, res, next) => {
  try {
    res.json(await getState());
  } catch (error) {
    next(error);
  }
});

app.put("/api/state", async (req, res, next) => {
  try {
    const biologicalAssets = Array.isArray(req.body?.biologicalAssets)
      ? req.body.biologicalAssets
      : [];
    const journalEntries = Array.isArray(req.body?.journalEntries)
      ? req.body.journalEntries
      : [];
    const fairValuePerKg = Number(req.body?.fairValuePerKg);
    const state = await replaceState(biologicalAssets, journalEntries, fairValuePerKg);
    await ensureMonthlyBackup();
    res.json(state);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/state", async (_req, res, next) => {
  try {
    const state = await replaceState([], []);
    await ensureMonthlyBackup();
    res.json(state);
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/login", async (req, res, next) => {
  try {
    const username = String(req.body?.username || "").trim();
    const password = String(req.body?.password || "");

    // Try admin_users table first
    const [adminRows] = await getPool().query(
      "SELECT id, username, password_hash, full_name, email, role, is_active FROM admin_users WHERE username = ? AND is_active = true LIMIT 1",
      [username],
    );

    if (adminRows.length > 0) {
      const admin = adminRows[0];
      const passwordHash = hashPassword(password);
      if (admin.password_hash === passwordHash) {
        return res.json({
          user: {
            id: admin.id,
            username: admin.username,
            fullName: admin.full_name,
            email: admin.email,
            role: admin.role,
            isActive: Boolean(admin.is_active),
            createdAt: admin.created_at,
          },
        });
      }
    }

    return res.status(401).json({ message: "Username atau password salah" });
  } catch (error) {
    next(error);
  }
});

app.post("/api/assets", async (req, res, next) => {
  try {
    const id = String(req.body?.id || Date.now());
    const tagId = String(req.body?.tagId || "").trim();
    const type = req.body?.type;
    const age = Number(req.body?.age || 0);
    const ageUpdatedAt = req.body?.ageUpdatedAt || new Date().toISOString().split("T")[0];
    const weight = Number(req.body?.weight || 0);
    const purchasePrice = Number(req.body?.purchasePrice || 0);
    const fairValuePerKg = await getFairValuePerKg();
    const fairValue = Number(req.body?.fairValue || weight * fairValuePerKg);
    const lastUpdated = req.body?.lastUpdated || new Date().toISOString().split("T")[0];
    const createdBy = req.body?.createdBy || "system";

    if (!tagId) {
      return res.status(400).json({ message: "tagId wajib diisi" });
    }

    const entryId = String(Number(id) + 1);
    const journalEntry = {
      id: entryId,
      date: lastUpdated,
      description: `Pembelian ${type} ${tagId}`,
      debitAccount: "1-3000 Aset Biologis",
      debitAssetId: id,
      debitAmount: fairValue,
      creditAccount: "1-1100 Kas",
      creditAmount: fairValue,
      createdBy,
    };

    await withTransaction(async (connection) => {
      await connection.query(
        "INSERT INTO biological_assets (id, tag_id, type, age, age_updated_at, weight, fair_value, purchase_price, profit, loss, last_updated, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [id, tagId, type, age, ageUpdatedAt, weight, fairValue, purchasePrice, 0, 0, lastUpdated, createdBy],
      );
      await connection.query(
        "INSERT INTO journal_entries (id, entry_date, description, debit_account, debit_asset_id, debit_amount, credit_account, credit_asset_id, credit_amount, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          journalEntry.id,
          journalEntry.date,
          journalEntry.description,
          journalEntry.debitAccount,
          journalEntry.debitAssetId,
          journalEntry.debitAmount,
          journalEntry.creditAccount,
          null,
          journalEntry.creditAmount,
          journalEntry.createdBy,
        ],
      );
    });

    const state = await getState();
    await ensureMonthlyBackup();
    res.json(state);
  } catch (error) {
    next(error);
  }
});

app.patch("/api/assets/:id/weight", async (req, res, next) => {
  try {
    const assetId = String(req.params.id);
    const newWeight = Number(req.body?.weight);
    const updatedBy = req.body?.updatedBy || "system";

    const [rows] = await getPool().query(
      "SELECT id, tag_id, type, age, age_updated_at, weight, fair_value, last_updated FROM biological_assets WHERE id = ? LIMIT 1",
      [assetId],
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Aset tidak ditemukan" });
    }

    const asset = normalizeAsset(rows[0]);
    const fairValuePerKg = await getFairValuePerKg();
    const oldFairValue = asset.fairValue;
    const updatedFairValue = newWeight * fairValuePerKg;
    const difference = updatedFairValue - oldFairValue;
    const today = new Date().toISOString().split("T")[0];

    await withTransaction(async (connection) => {
      await connection.query(
        "UPDATE biological_assets SET weight = ?, fair_value = ?, last_updated = ?, updated_by = ? WHERE id = ?",
        [newWeight, updatedFairValue, today, updatedBy, assetId],
      );

      if (difference !== 0) {
        await connection.query(
          "INSERT INTO journal_entries (id, entry_date, description, debit_account, debit_asset_id, debit_amount, credit_account, credit_asset_id, credit_amount, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            String(Date.now()),
            today,
            `Penyesuaian Nilai Wajar ${asset.tagId} (${asset.weight}kg → ${newWeight}kg)`,
            difference > 0
              ? "1-3000 Aset Biologis"
              : "5-4000 Kerugian Nilai Wajar",
            assetId,
            Math.abs(difference),
            difference > 0
              ? "4-2000 Keuntungan Nilai Wajar"
              : "1-3000 Aset Biologis",
            difference < 0 ? assetId : null,
            Math.abs(difference),
            updatedBy,
          ],
        );
      }
    });

    const state = await getState();
    await ensureMonthlyBackup();
    res.json(state);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/assets/:id", async (req, res, next) => {
  try {
    const assetId = String(req.params.id);
    const deletedBy = req.body?.deletedBy || "system";

    const [rows] = await getPool().query(
      "SELECT id, tag_id, type, age, age_updated_at, weight, fair_value, last_updated FROM biological_assets WHERE id = ? LIMIT 1",
      [assetId],
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Aset tidak ditemukan" });
    }

    const asset = normalizeAsset(rows[0]);
    const today = new Date().toISOString().split("T")[0];

    await withTransaction(async (connection) => {
      await connection.query(
        "INSERT INTO journal_entries (id, entry_date, description, debit_account, debit_asset_id, debit_amount, credit_account, credit_asset_id, credit_amount, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          String(Date.now()),
          today,
          `Penghapusan ${asset.type} ${asset.tagId} (Penjualan/Kematian)`,
          "5-3000 Harga Pokok Penjualan",
          null,
          asset.fairValue,
          "1-3000 Aset Biologis",
          assetId,
          asset.fairValue,
          deletedBy,
        ],
      );

      await connection.query("DELETE FROM biological_assets WHERE id = ?", [
        assetId,
      ]);
    });

    const state = await getState();
    await ensureMonthlyBackup();
    res.json(state);
  } catch (error) {
    next(error);
  }
});

app.post("/api/journal-entries", async (req, res, next) => {
  try {
    const id = String(req.body?.id || Date.now());
    const date = req.body?.date;
    const description = req.body?.description;
    const debitAccount = req.body?.debitAccount;
    const debitAssetId = req.body?.debitAssetId || null;
    const debitAmount = Number(req.body?.debitAmount || 0);
    const creditAccount = req.body?.creditAccount;
    const creditAssetId = req.body?.creditAssetId || null;
    const creditAmount = Number(req.body?.creditAmount || 0);
    const createdBy = req.body?.createdBy || "system";

    await getPool().query(
      "INSERT INTO journal_entries (id, entry_date, description, debit_account, debit_asset_id, debit_amount, credit_account, credit_asset_id, credit_amount, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        id,
        date,
        description,
        debitAccount,
        debitAssetId,
        debitAmount,
        creditAccount,
        creditAssetId,
        creditAmount,
        createdBy,
      ],
    );

    const state = await getState();
    await ensureMonthlyBackup();
    res.json(state);
  } catch (error) {
    next(error);
  }
});

app.put("/api/journal-entries/:id", async (req, res, next) => {
  try {
    const journalId = String(req.params.id);
    const payload = {
      date: req.body?.date,
      description: req.body?.description,
      debitAccount: req.body?.debitAccount,
      debitAssetId: req.body?.debitAssetId || null,
      debitAmount: Number(req.body?.debitAmount || 0),
      creditAccount: req.body?.creditAccount,
      creditAssetId: req.body?.creditAssetId || null,
      creditAmount: Number(req.body?.creditAmount || 0),
      updatedBy: req.body?.updatedBy || "system",
    };

    await getPool().query(
      "UPDATE journal_entries SET entry_date = ?, description = ?, debit_account = ?, debit_asset_id = ?, debit_amount = ?, credit_account = ?, credit_asset_id = ?, credit_amount = ?, updated_by = ? WHERE id = ?",
      [
        payload.date,
        payload.description,
        payload.debitAccount,
        payload.debitAssetId,
        payload.debitAmount,
        payload.creditAccount,
        payload.creditAssetId,
        payload.creditAmount,
        payload.updatedBy,
        journalId,
      ],
    );

    const state = await getState();
    await ensureMonthlyBackup();
    res.json(state);
  } catch (error) {
    next(error);
  }
});

app.post("/api/backups/monthly", async (req, res, next) => {
  try {
    const force = Boolean(req.body?.force);
    const result = await ensureMonthlyBackup({ force });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

app.get("/api/backups/monthly", async (_req, res, next) => {
  try {
    const [rows] = await getPool().query(
      "SELECT id, period, snapshot_json, created_at, updated_at FROM monthly_backups ORDER BY period DESC",
    );

    const backups = rows.map((row) => {
      let snapshot = null;
      try {
        snapshot = JSON.parse(row.snapshot_json);
      } catch {
        snapshot = null;
      }

      return {
        id: row.id,
        period: row.period,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        snapshot,
      };
    });

    res.json({ backups });
  } catch (error) {
    next(error);
  }
});

app.get("/api/journal-entries", async (_req, res, next) => {
  try {
    const state = await getState();
    res.json({ journalEntries: state.journalEntries });
  } catch (error) {
    next(error);
  }
});

// ========== ADMIN USERS ENDPOINTS ==========
app.get("/api/admin-users", async (_req, res, next) => {
  try {
    const [rows] = await getPool().query(
      "SELECT id, username, full_name, email, role, is_active, created_at, created_by FROM admin_users ORDER BY created_at ASC",
    );
    const admins = rows.map(normalizeAdminUser);
    res.json({ admins });
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin-users", async (req, res, next) => {
  try {
    const id = String(req.body?.id || Date.now());
    const username = String(req.body?.username || "").trim();
    const fullName = String(req.body?.fullName || "").trim();
    const email = req.body?.email || null;
    const role = req.body?.role || "operator";
    const isActive = req.body?.isActive !== false;

    if (!username || !fullName) {
      return res.status(400).json({ message: "Username dan nama lengkap wajib diisi" });
    }

    const passwordHash = hashPassword("admin123");
    await getPool().query(
      "INSERT INTO admin_users (id, username, full_name, email, role, is_active, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [id, username, fullName, email, role, isActive, passwordHash],
    );

    const [newRow] = await getPool().query(
      "SELECT id, username, full_name, email, role, is_active, created_at, created_by FROM admin_users WHERE id = ?",
      [id],
    );

    res.json({ admin: normalizeAdminUser(newRow[0]) });
  } catch (error) {
    next(error);
  }
});

app.put("/api/admin-users/:id", async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const fullName = req.body?.fullName;
    const email = req.body?.email;
    const role = req.body?.role;
    const isActive = req.body?.isActive;

    const updates = [];
    const values = [];

    if (fullName !== undefined) {
      updates.push("full_name = ?");
      values.push(fullName);
    }
    if (email !== undefined) {
      updates.push("email = ?");
      values.push(email);
    }
    if (role !== undefined) {
      updates.push("role = ?");
      values.push(role);
    }
    if (isActive !== undefined) {
      updates.push("is_active = ?");
      values.push(isActive);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "Tidak ada field yang diupdate" });
    }

    values.push(id);
    await getPool().query(
      `UPDATE admin_users SET ${updates.join(", ")} WHERE id = ?`,
      values,
    );

    const [updatedRow] = await getPool().query(
      "SELECT id, username, full_name, email, role, is_active, created_at, created_by FROM admin_users WHERE id = ?",
      [id],
    );

    res.json({ admin: normalizeAdminUser(updatedRow[0]) });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/admin-users/:id", async (req, res, next) => {
  try {
    const id = String(req.params.id);
    await getPool().query("DELETE FROM admin_users WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// ========== JOURNAL DOCUMENTS ENDPOINTS ==========
app.post("/api/journal-documents", async (req, res, next) => {
  try {
    const id = String(req.body?.id || Date.now());
    const journalEntryId = String(req.body?.journalEntryId || "");
    const fileName = String(req.body?.fileName || "").trim();
    const fileData = req.body?.fileData || "";
    const fileType = req.body?.fileType || "";

    if (!journalEntryId || !fileName || !fileData) {
      return res.status(400).json({ message: "Semua field wajib diisi" });
    }

    await getPool().query(
      "INSERT INTO journal_documents (id, journal_entry_id, file_name, file_data, file_type, uploaded_at) VALUES (?, ?, ?, ?, ?, NOW())",
      [id, journalEntryId, fileName, fileData, fileType],
    );

    const [newRow] = await getPool().query(
      "SELECT id, journal_entry_id, file_name, file_data, file_type, uploaded_at, uploaded_by FROM journal_documents WHERE id = ?",
      [id],
    );

    res.json({ document: normalizeJournalDocument(newRow[0]) });
  } catch (error) {
    next(error);
  }
});

app.get("/api/journal-documents/:journalEntryId", async (req, res, next) => {
  try {
    const journalEntryId = String(req.params.journalEntryId || "");
    const [rows] = await getPool().query(
      "SELECT id, journal_entry_id, file_name, file_data, file_type, uploaded_at, uploaded_by FROM journal_documents WHERE journal_entry_id = ? ORDER BY uploaded_at DESC",
      [journalEntryId],
    );

    const documents = rows.map(normalizeJournalDocument);
    res.json({ documents });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/journal-documents/:id", async (req, res, next) => {
  try {
    const id = String(req.params.id);
    await getPool().query("DELETE FROM journal_documents WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// ========== CHART OF ACCOUNTS ENDPOINTS ==========
app.get("/api/chart-of-accounts", async (_req, res, next) => {
  try {
    const [rows] = await getPool().query(
      "SELECT code, name, parent_code, category, is_active, created_at, created_by FROM chart_of_accounts ORDER BY code ASC",
    );

    const accounts = rows.map(normalizeChartOfAccount);
    res.json({ chartOfAccounts: accounts });
  } catch (error) {
    next(error);
  }
});

app.post("/api/chart-of-accounts", async (req, res, next) => {
  try {
    const code = String(req.body?.code || "").trim();
    const name = String(req.body?.name || "").trim();
    const parentCode = req.body?.parentCode || null;
    const category = req.body?.category || "expense";
    const isActive = req.body?.isActive !== false;

    if (!code || !name) {
      return res.status(400).json({ message: "Kode dan nama akun wajib diisi" });
    }

    await getPool().query(
      "INSERT INTO chart_of_accounts (code, name, parent_code, category, is_active) VALUES (?, ?, ?, ?, ?)",
      [code, name, parentCode, category, isActive],
    );

    const [newRow] = await getPool().query(
      "SELECT code, name, parent_code, category, is_active, created_at, created_by FROM chart_of_accounts WHERE code = ?",
      [code],
    );

    res.json({ account: normalizeChartOfAccount(newRow[0]) });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/chart-of-accounts/:code", async (req, res, next) => {
  try {
    const code = String(req.params.code || "");

    // Check if used in journal entries
    const [usageRows] = await getPool().query(
      "SELECT COUNT(*) AS count FROM journal_entries WHERE debit_account LIKE ? OR credit_account LIKE ?",
      [`%${code}%`, `%${code}%`],
    );

    if (usageRows[0].count > 0) {
      return res.status(400).json({ message: "Tidak bisa hapus akun yang sudah digunakan dalam jurnal" });
    }

    await getPool().query("DELETE FROM chart_of_accounts WHERE code = ?", [code]);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({
    message: error?.message || "Terjadi kesalahan pada server",
  });
});

async function bootstrap() {
  await initDatabase({
    defaultAssets,
    defaultFairValuePerKg,
    defaultJournalEntries,
    defaultAdminUser,
  });

  await ensureMonthlyBackup();

  app.listen(port, () => {
    console.log(`ERP backend running on http://localhost:${port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start backend:", error);
  process.exit(1);
});
