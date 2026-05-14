import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const databaseName = process.env.MYSQL_DATABASE || "hers_farm_erp";
const mysqlHost = process.env.MYSQL_HOST || "127.0.0.1";
const mysqlPort = Number(process.env.MYSQL_PORT || 3306);
const mysqlUser = process.env.MYSQL_USER || "root";
const mysqlPassword = process.env.MYSQL_PASSWORD || "";

let pool;

function poolConfig(withDatabase = true) {
  return {
    host: mysqlHost,
    port: mysqlPort,
    user: mysqlUser,
    password: mysqlPassword,
    database: withDatabase ? databaseName : undefined,
    waitForConnections: true,
    connectionLimit: 10,
    decimalNumbers: true,
    dateStrings: true,
  };
}

async function ensureDatabaseExists() {
  const connection = await mysql.createConnection(poolConfig(false));
  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  await connection.end();
}

async function runMigrations() {
  const createAdminUsersTable = `
    CREATE TABLE IF NOT EXISTS admin_users (
      id VARCHAR(64) PRIMARY KEY,
      username VARCHAR(100) NOT NULL UNIQUE,
      full_name VARCHAR(150) NOT NULL,
      email VARCHAR(100) NULL,
      role ENUM('admin', 'manager', 'operator') NOT NULL DEFAULT 'operator',
      is_active BOOLEAN NOT NULL DEFAULT true,
      password_hash VARCHAR(255) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_by VARCHAR(100) NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      updated_by VARCHAR(100) NULL,
      INDEX idx_username (username),
      INDEX idx_role (role)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;

  const createAssetsTable = `
    CREATE TABLE IF NOT EXISTS biological_assets (
      id VARCHAR(64) PRIMARY KEY,
      tag_id VARCHAR(50) NOT NULL UNIQUE,
      type ENUM('Domba', 'Kambing') NOT NULL,
      age INT NOT NULL DEFAULT 0,
      age_updated_at DATE NOT NULL,
      weight DECIMAL(12,2) NOT NULL DEFAULT 0,
      fair_value DECIMAL(18,2) NOT NULL DEFAULT 0,
      purchase_price DECIMAL(18,2) NULL,
      profit DECIMAL(18,2) NULL DEFAULT 0,
      loss DECIMAL(18,2) NULL DEFAULT 0,
      last_updated DATE NOT NULL,
      created_by VARCHAR(100) NULL,
      updated_by VARCHAR(100) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_tag_id (tag_id),
      INDEX idx_type (type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;

  const createJournalTable = `
    CREATE TABLE IF NOT EXISTS journal_entries (
      id VARCHAR(64) PRIMARY KEY,
      entry_date DATE NOT NULL,
      description TEXT NOT NULL,
      debit_account VARCHAR(255) NOT NULL,
      debit_asset_id VARCHAR(64) NULL,
      debit_amount DECIMAL(18,2) NOT NULL,
      credit_account VARCHAR(255) NOT NULL,
      credit_asset_id VARCHAR(64) NULL,
      credit_amount DECIMAL(18,2) NOT NULL,
      created_by VARCHAR(100) NULL,
      updated_by VARCHAR(100) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_journal_entry_date (entry_date),
      INDEX idx_journal_debit_asset (debit_asset_id),
      INDEX idx_journal_credit_asset (credit_asset_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;

  const createJournalDocumentsTable = `
    CREATE TABLE IF NOT EXISTS journal_documents (
      id VARCHAR(64) PRIMARY KEY,
      journal_entry_id VARCHAR(64) NOT NULL,
      document_side ENUM('debit', 'credit', 'general') NOT NULL DEFAULT 'general',
      file_name VARCHAR(255) NOT NULL,
      file_data LONGBLOB NOT NULL,
      file_type VARCHAR(50) NULL,
      uploaded_by VARCHAR(100) NULL,
      uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_journal_entry_id (journal_entry_id),
      FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;

  const createChartOfAccountsTable = `
    CREATE TABLE IF NOT EXISTS chart_of_accounts (
      code VARCHAR(50) PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      parent_code VARCHAR(50) NULL,
      category ENUM('asset', 'liability', 'equity', 'revenue', 'expense') NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_by VARCHAR(100) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_category (category),
      INDEX idx_parent_code (parent_code)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;

  const createSettingsTable = `
    CREATE TABLE IF NOT EXISTS app_settings (
      setting_key VARCHAR(100) PRIMARY KEY,
      setting_value TEXT NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;

  const createMonthlyBackupsTable = `
    CREATE TABLE IF NOT EXISTS monthly_backups (
      id INT AUTO_INCREMENT PRIMARY KEY,
      period VARCHAR(7) NOT NULL UNIQUE,
      snapshot_json LONGTEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_period (period)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;

  // Create tables in order
  await pool.query(createAdminUsersTable);
  await pool.query(createAssetsTable);
  await pool.query(createJournalTable);
  await pool.query(createJournalDocumentsTable);
  await pool.query(createChartOfAccountsTable);
  await pool.query(createSettingsTable);
  await pool.query(createMonthlyBackupsTable);

  // Add missing columns to existing tables if needed
  const [assetColumns] = await pool.query(
    "SELECT COUNT(*) AS total FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'biological_assets' AND COLUMN_NAME = 'purchase_price'",
    [databaseName],
  );

  if (assetColumns[0].total === 0) {
    await pool.query(
      "ALTER TABLE biological_assets ADD COLUMN purchase_price DECIMAL(18,2) NULL AFTER fair_value",
    );
    await pool.query(
      "ALTER TABLE biological_assets ADD COLUMN profit DECIMAL(18,2) NULL DEFAULT 0 AFTER purchase_price",
    );
    await pool.query(
      "ALTER TABLE biological_assets ADD COLUMN loss DECIMAL(18,2) NULL DEFAULT 0 AFTER profit",
    );
    await pool.query(
      "ALTER TABLE biological_assets ADD COLUMN created_by VARCHAR(100) NULL AFTER last_updated",
    );
    await pool.query(
      "ALTER TABLE biological_assets ADD COLUMN updated_by VARCHAR(100) NULL AFTER created_by",
    );
  }

  const [journalColumns] = await pool.query(
    "SELECT COUNT(*) AS total FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'journal_entries' AND COLUMN_NAME = 'created_by'",
    [databaseName],
  );

  if (journalColumns[0].total === 0) {
    await pool.query(
      "ALTER TABLE journal_entries ADD COLUMN created_by VARCHAR(100) NULL",
    );
    await pool.query(
      "ALTER TABLE journal_entries ADD COLUMN updated_by VARCHAR(100) NULL",
    );
    await pool.query(
      "ALTER TABLE journal_entries ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
    );
  }

  const [documentSideColumns] = await pool.query(
    "SELECT COUNT(*) AS total FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'journal_documents' AND COLUMN_NAME = 'document_side'",
    [databaseName],
  );

  if (documentSideColumns[0].total === 0) {
    await pool.query(
      "ALTER TABLE journal_documents ADD COLUMN document_side ENUM('debit', 'credit', 'general') NOT NULL DEFAULT 'general' AFTER journal_entry_id",
    );
  }
}

async function seedDefaults(
  defaultAssets,
  defaultAdminUser,
  defaultFairValuePerKg,
  defaultJournalEntries = [],
  defaultJournalDocuments = [],
) {
  const { createHash } = await import("crypto");

  // Seed admin user
  const [adminRows] = await pool.query(
    "SELECT COUNT(*) AS total FROM admin_users WHERE username = ?",
    [defaultAdminUser.username],
  );
  if (adminRows[0].total === 0) {
    const passwordHash = createHash("sha256")
      .update(defaultAdminUser.password)
      .digest("hex");
    await pool.query(
      "INSERT INTO admin_users (id, username, full_name, email, role, is_active, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        "1",
        defaultAdminUser.username,
        "Admin Utama",
        "admin@hers.farm",
        "admin",
        true,
        passwordHash,
      ],
    );
  }

  // Seed biological assets
  const [assetRows] = await pool.query(
    "SELECT COUNT(*) AS total FROM biological_assets",
  );
  if (
    assetRows[0].total === 0 &&
    Array.isArray(defaultAssets) &&
    defaultAssets.length > 0
  ) {
    const values = defaultAssets.map((asset) => [
      asset.id,
      asset.tagId,
      asset.type,
      asset.age,
      asset.ageUpdatedAt || asset.lastUpdated,
      asset.weight,
      asset.fairValue,
      asset.purchasePrice || asset.fairValue,
      asset.profit || 0,
      asset.loss || 0,
      asset.lastUpdated,
      null,
      null,
    ]);
    await pool.query(
      "INSERT INTO biological_assets (id, tag_id, type, age, age_updated_at, weight, fair_value, purchase_price, profit, loss, last_updated, created_by, updated_by) VALUES ?",
      [values],
    );
  }

  // Seed default chart of accounts
  const [coaRows] = await pool.query(
    "SELECT COUNT(*) AS total FROM chart_of_accounts",
  );
  if (coaRows[0].total === 0) {
    const defaultCOA = [
      // Assets
      ["1-1100", "Kas", null, "asset", true],
      ["1-1200", "Bank", null, "asset", true],
      ["1-12001", "Bank BCA", "1-1200", "asset", true],
      ["1-12002", "Bank Mandiri", "1-1200", "asset", true],
      ["1-2100", "Persediaan Pakan", null, "asset", true],
      ["1-3000", "Aset Biologis", null, "asset", true],
      ["1-4100", "Aset Tetap - Kandang", null, "asset", true],
      ["1-4200", "Akumulasi Penyusutan", null, "asset", true],
      // Liabilities
      ["2-1000", "Hutang Usaha", null, "liability", true],
      // Equity
      ["3-1000", "Modal Disetor", null, "equity", true],
      ["3-2000", "Laba Ditahan", null, "equity", true],
      // Revenue
      ["4-1000", "Pendapatan Penjualan", null, "revenue", true],
      ["4-2000", "Keuntungan Nilai Wajar", null, "revenue", true],
      ["4-3000", "Pendapatan Lain-lain", null, "revenue", true],
      // Expenses
      ["5-1000", "Beban Gaji", null, "expense", true],
      ["5-2000", "Beban Pakan", null, "expense", true],
      ["5-3000", "Harga Pokok Penjualan", null, "expense", true],
      ["5-4000", "Kerugian Nilai Wajar", null, "expense", true],
      ["5-5000", "Beban Lain-lain", null, "expense", true],
      ["5-6000", "Beban Penyusutan", null, "expense", true],
    ];

    for (const [code, name, parentCode, category, isActive] of defaultCOA) {
      await pool.query(
        "INSERT INTO chart_of_accounts (code, name, parent_code, category, is_active) VALUES (?, ?, ?, ?, ?)",
        [code, name, parentCode, category, isActive],
      );
    }
  }

  // Seed journal entries
  const [journalRows] = await pool.query(
    "SELECT COUNT(*) AS total FROM journal_entries",
  );
  if (
    journalRows[0].total === 0 &&
    Array.isArray(defaultJournalEntries) &&
    defaultJournalEntries.length > 0
  ) {
    for (let i = 0; i < defaultJournalEntries.length; i++) {
      const entry = defaultJournalEntries[i];
      const id = String(entry.id || i + 1);
      await pool.query(
        "INSERT INTO journal_entries (id, entry_date, description, debit_account, debit_amount, credit_account, credit_amount, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          id,
          entry.entryDate,
          entry.description,
          entry.debitAccount,
          entry.debitAmount,
          entry.creditAccount,
          entry.creditAmount,
          entry.createdBy || "system",
        ],
      );
    }
  }

  // Seed journal documents
  const [documentRows] = await pool.query(
    "SELECT COUNT(*) AS total FROM journal_documents",
  );
  if (
    documentRows[0].total === 0 &&
    Array.isArray(defaultJournalDocuments) &&
    defaultJournalDocuments.length > 0
  ) {
    for (const document of defaultJournalDocuments) {
      await pool.query(
        "INSERT INTO journal_documents (id, journal_entry_id, document_side, file_name, file_data, file_type, uploaded_by, uploaded_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())",
        [
          document.id,
          document.journalEntryId,
          document.documentSide || "general",
          document.fileName,
          document.fileData,
          document.fileType || null,
          document.uploadedBy || "system",
        ],
      );
    }
  }

  // Seed app settings
  const [settingRows] = await pool.query(
    "SELECT COUNT(*) AS total FROM app_settings WHERE setting_key = 'fair_value_per_kg'",
  );
  if (settingRows[0].total === 0) {
    await pool.query(
      "INSERT INTO app_settings (setting_key, setting_value) VALUES ('fair_value_per_kg', ?)",
      [String(defaultFairValuePerKg || 100000)],
    );
  }
}

export async function initDatabase({
  defaultAssets = [],
  defaultAdminUser,
  defaultFairValuePerKg = 100000,
  defaultJournalEntries = [],
  defaultJournalDocuments = [],
} = {}) {
  await ensureDatabaseExists();
  pool = mysql.createPool(poolConfig(true));
  await runMigrations();
  await seedDefaults(
    defaultAssets,
    defaultAdminUser,
    defaultFairValuePerKg,
    defaultJournalEntries,
    defaultJournalDocuments,
  );
  return pool;
}

export function getPool() {
  if (!pool) {
    throw new Error("Database is not initialized yet.");
  }
  return pool;
}

export async function withTransaction(work) {
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
