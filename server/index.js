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
    lastUpdated: row.last_updated,
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
    asset.lastUpdated,
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
    "SELECT id, tag_id, type, age, age_updated_at, weight, fair_value, last_updated FROM biological_assets ORDER BY created_at ASC, tag_id ASC",
  );
  const [journalRows] = await pool.query(
    "SELECT id, entry_date, description, debit_account, debit_asset_id, debit_amount, credit_account, credit_asset_id, credit_amount FROM journal_entries ORDER BY entry_date ASC, created_at ASC, id ASC",
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
        "INSERT INTO biological_assets (id, tag_id, type, age, age_updated_at, weight, fair_value, last_updated) VALUES ?",
        [toAssetValues(biologicalAssets)],
      );
    }

    if (journalEntries.length > 0) {
      await connection.query(
        "INSERT INTO journal_entries (id, entry_date, description, debit_account, debit_asset_id, debit_amount, credit_account, credit_asset_id, credit_amount) VALUES ?",
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

    const [rows] = await getPool().query(
      "SELECT id, username, password_hash, full_name, role FROM users WHERE username = ? LIMIT 1",
      [username],
    );

    if (!rows.length || rows[0].password_hash !== hashPassword(password)) {
      return res.status(401).json({ message: "Username atau password salah" });
    }

    res.json({
      user: {
        id: rows[0].id,
        username: rows[0].username,
        fullName: rows[0].full_name,
        role: rows[0].role,
      },
    });
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
    const fairValuePerKg = await getFairValuePerKg();
    const fairValue = Number(req.body?.fairValue || weight * fairValuePerKg);
    const lastUpdated =
      req.body?.lastUpdated || new Date().toISOString().split("T")[0];

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
    };

    await withTransaction(async (connection) => {
      await connection.query(
        "INSERT INTO biological_assets (id, tag_id, type, age, age_updated_at, weight, fair_value, last_updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [id, tagId, type, age, ageUpdatedAt, weight, fairValue, lastUpdated],
      );
      await connection.query(
        "INSERT INTO journal_entries (id, entry_date, description, debit_account, debit_asset_id, debit_amount, credit_account, credit_asset_id, credit_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
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
        "UPDATE biological_assets SET weight = ?, fair_value = ?, last_updated = ? WHERE id = ?",
        [newWeight, updatedFairValue, today, assetId],
      );

      if (difference !== 0) {
        await connection.query(
          "INSERT INTO journal_entries (id, entry_date, description, debit_account, debit_asset_id, debit_amount, credit_account, credit_asset_id, credit_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            String(Date.now()),
            today,
            `Penyesuaian Nilai Wajar ${asset.tagId} (${asset.weight}kg → ${newWeight}kg)`,
            difference > 0
              ? "1-3000 Aset Biologis"
              : "5-2000 Kerugian Nilai Wajar",
            assetId,
            Math.abs(difference),
            difference > 0
              ? "4-2000 Keuntungan Nilai Wajar"
              : "1-3000 Aset Biologis",
            difference < 0 ? assetId : null,
            Math.abs(difference),
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
        "INSERT INTO journal_entries (id, entry_date, description, debit_account, debit_asset_id, debit_amount, credit_account, credit_asset_id, credit_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
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
    await addJournalEntry(req.body || {});
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
    };

    await getPool().query(
      "UPDATE journal_entries SET entry_date = ?, description = ?, debit_account = ?, debit_asset_id = ?, debit_amount = ?, credit_account = ?, credit_asset_id = ?, credit_amount = ? WHERE id = ?",
      [
        payload.date,
        payload.description,
        payload.debitAccount,
        payload.debitAssetId,
        payload.debitAmount,
        payload.creditAccount,
        payload.creditAssetId,
        payload.creditAmount,
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
