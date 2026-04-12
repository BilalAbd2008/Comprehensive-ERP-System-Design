import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createHash } from 'crypto';
import { defaultAdminUser, defaultAssets, defaultJournalEntries } from './defaultState.js';
import { getPool, initDatabase, withTransaction } from './database.js';

dotenv.config();

const app = express();
const port = Number(process.env.BACKEND_PORT || 3001);
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

app.use(
  cors({
    origin: [frontendOrigin, 'http://127.0.0.1:5173'],
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));

function hashPassword(password) {
  return createHash('sha256').update(password).digest('hex');
}

function formatAccountCategory(account) {
  const code = String(account || '').trim().split(' ')[0];
  const prefix = code.charAt(0);

  switch (prefix) {
    case '1':
      return 'asset';
    case '2':
      return 'liability';
    case '3':
      return 'equity';
    case '4':
      return 'revenue';
    case '5':
      return 'expense';
    default:
      return 'expense';
  }
}

function computeAccountBalances(entries) {
  const balances = new Map();

  const ensureBalance = (account) => {
    if (!balances.has(account)) {
      balances.set(account, {
        code: account.split(' ')[0] || account,
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

  return Array.from(balances.values()).sort((a, b) => a.code.localeCompare(b.code));
}

function normalizeAsset(row) {
  return {
    id: String(row.id),
    tagId: row.tag_id,
    type: row.type,
    age: Number(row.age),
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
    Number(asset.weight),
    Number(asset.fairValue),
    asset.lastUpdated,
  ]);
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

async function getState() {
  const pool = getPool();
  const [assetRows] = await pool.query(
    'SELECT id, tag_id, type, age, weight, fair_value, last_updated FROM biological_assets ORDER BY created_at ASC, tag_id ASC'
  );
  const [journalRows] = await pool.query(
    'SELECT id, entry_date, description, debit_account, debit_asset_id, debit_amount, credit_account, credit_asset_id, credit_amount FROM journal_entries ORDER BY entry_date ASC, created_at ASC, id ASC'
  );

  const biologicalAssets = assetRows.map(normalizeAsset);
  const journalEntries = journalRows.map(normalizeJournalEntry);

  return {
    biologicalAssets,
    journalEntries,
    accountBalances: computeAccountBalances(journalEntries),
  };
}

async function replaceState(biologicalAssets, journalEntries) {
  await withTransaction(async (connection) => {
    await connection.query('DELETE FROM journal_entries');
    await connection.query('DELETE FROM biological_assets');

    if (biologicalAssets.length > 0) {
      await connection.query(
        'INSERT INTO biological_assets (id, tag_id, type, age, weight, fair_value, last_updated) VALUES ?',
        [toAssetValues(biologicalAssets)]
      );
    }

    if (journalEntries.length > 0) {
      await connection.query(
        'INSERT INTO journal_entries (id, entry_date, description, debit_account, debit_asset_id, debit_amount, credit_account, credit_asset_id, credit_amount) VALUES ?',
        [toJournalValues(journalEntries)]
      );
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
    'INSERT INTO journal_entries (id, entry_date, description, debit_account, debit_asset_id, debit_amount, credit_account, credit_asset_id, credit_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
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
    ]
  );

  return payload;
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/state', async (_req, res, next) => {
  try {
    res.json(await getState());
  } catch (error) {
    next(error);
  }
});

app.put('/api/state', async (req, res, next) => {
  try {
    const biologicalAssets = Array.isArray(req.body?.biologicalAssets) ? req.body.biologicalAssets : [];
    const journalEntries = Array.isArray(req.body?.journalEntries) ? req.body.journalEntries : [];
    res.json(await replaceState(biologicalAssets, journalEntries));
  } catch (error) {
    next(error);
  }
});

app.delete('/api/state', async (_req, res, next) => {
  try {
    res.json(await replaceState([], []));
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const username = String(req.body?.username || '').trim();
    const password = String(req.body?.password || '');

    const [rows] = await getPool().query(
      'SELECT id, username, password_hash, full_name, role FROM users WHERE username = ? LIMIT 1',
      [username]
    );

    if (!rows.length || rows[0].password_hash !== hashPassword(password)) {
      return res.status(401).json({ message: 'Username atau password salah' });
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

app.post('/api/assets', async (req, res, next) => {
  try {
    const id = String(req.body?.id || Date.now());
    const tagId = String(req.body?.tagId || '').trim();
    const type = req.body?.type;
    const age = Number(req.body?.age || 0);
    const weight = Number(req.body?.weight || 0);
    const fairValue = Number(req.body?.fairValue || weight * 100000);
    const lastUpdated = req.body?.lastUpdated || new Date().toISOString().split('T')[0];

    if (!tagId) {
      return res.status(400).json({ message: 'tagId wajib diisi' });
    }

    const entryId = String(Number(id) + 1);
    const journalEntry = {
      id: entryId,
      date: lastUpdated,
      description: `Pembelian ${type} ${tagId}`,
      debitAccount: '1-3000 Aset Biologis',
      debitAssetId: id,
      debitAmount: fairValue,
      creditAccount: '1-1100 Kas',
      creditAmount: fairValue,
    };

    await withTransaction(async (connection) => {
      await connection.query(
        'INSERT INTO biological_assets (id, tag_id, type, age, weight, fair_value, last_updated) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, tagId, type, age, weight, fairValue, lastUpdated]
      );
      await connection.query(
        'INSERT INTO journal_entries (id, entry_date, description, debit_account, debit_asset_id, debit_amount, credit_account, credit_asset_id, credit_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
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
        ]
      );
    });

    res.json(await getState());
  } catch (error) {
    next(error);
  }
});

app.patch('/api/assets/:id/weight', async (req, res, next) => {
  try {
    const assetId = String(req.params.id);
    const newWeight = Number(req.body?.weight);

    const [rows] = await getPool().query(
      'SELECT id, tag_id, type, age, weight, fair_value, last_updated FROM biological_assets WHERE id = ? LIMIT 1',
      [assetId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'Aset tidak ditemukan' });
    }

    const asset = normalizeAsset(rows[0]);
    const oldFairValue = asset.fairValue;
    const updatedFairValue = newWeight * 100000;
    const difference = updatedFairValue - oldFairValue;
    const today = new Date().toISOString().split('T')[0];

    await withTransaction(async (connection) => {
      await connection.query(
        'UPDATE biological_assets SET weight = ?, fair_value = ?, last_updated = ? WHERE id = ?',
        [newWeight, updatedFairValue, today, assetId]
      );

      if (difference !== 0) {
        await connection.query(
          'INSERT INTO journal_entries (id, entry_date, description, debit_account, debit_asset_id, debit_amount, credit_account, credit_asset_id, credit_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            String(Date.now()),
            today,
            `Penyesuaian Nilai Wajar ${asset.tagId} (${asset.weight}kg → ${newWeight}kg)`,
            difference > 0 ? '1-3000 Aset Biologis' : '5-2000 Kerugian Nilai Wajar',
            assetId,
            Math.abs(difference),
            difference > 0 ? '4-2000 Keuntungan Nilai Wajar' : '1-3000 Aset Biologis',
            difference < 0 ? assetId : null,
            Math.abs(difference),
          ]
        );
      }
    });

    res.json(await getState());
  } catch (error) {
    next(error);
  }
});

app.delete('/api/assets/:id', async (req, res, next) => {
  try {
    const assetId = String(req.params.id);

    const [rows] = await getPool().query(
      'SELECT id, tag_id, type, age, weight, fair_value, last_updated FROM biological_assets WHERE id = ? LIMIT 1',
      [assetId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'Aset tidak ditemukan' });
    }

    const asset = normalizeAsset(rows[0]);
    const today = new Date().toISOString().split('T')[0];

    await withTransaction(async (connection) => {
      await connection.query(
        'INSERT INTO journal_entries (id, entry_date, description, debit_account, debit_asset_id, debit_amount, credit_account, credit_asset_id, credit_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          String(Date.now()),
          today,
          `Penghapusan ${asset.type} ${asset.tagId} (Penjualan/Kematian)`,
          '5-3000 Harga Pokok Penjualan',
          null,
          asset.fairValue,
          '1-3000 Aset Biologis',
          assetId,
          asset.fairValue,
        ]
      );

      await connection.query('DELETE FROM biological_assets WHERE id = ?', [assetId]);
    });

    res.json(await getState());
  } catch (error) {
    next(error);
  }
});

app.post('/api/journal-entries', async (req, res, next) => {
  try {
    await addJournalEntry(req.body || {});
    res.json(await getState());
  } catch (error) {
    next(error);
  }
});

app.get('/api/journal-entries', async (_req, res, next) => {
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
    message: error?.message || 'Terjadi kesalahan pada server',
  });
});

async function bootstrap() {
  await initDatabase({
    defaultAssets,
    defaultJournalEntries,
    defaultAdminUser,
  });

  app.listen(port, () => {
    console.log(`ERP backend running on http://localhost:${port}`);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start backend:', error);
  process.exit(1);
});
