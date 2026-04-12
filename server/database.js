import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const databaseName = process.env.MYSQL_DATABASE || 'hers_farm_erp';
const mysqlHost = process.env.MYSQL_HOST || '127.0.0.1';
const mysqlPort = Number(process.env.MYSQL_PORT || 3306);
const mysqlUser = process.env.MYSQL_USER || 'root';
const mysqlPassword = process.env.MYSQL_PASSWORD || '';

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
    `CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await connection.end();
}

async function runMigrations() {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(100) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(150) NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'admin',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;

  const createAssetsTable = `
    CREATE TABLE IF NOT EXISTS biological_assets (
      id VARCHAR(64) PRIMARY KEY,
      tag_id VARCHAR(50) NOT NULL UNIQUE,
      type ENUM('Domba', 'Kambing') NOT NULL,
      age INT NOT NULL DEFAULT 0,
      weight DECIMAL(12,2) NOT NULL DEFAULT 0,
      fair_value DECIMAL(18,2) NOT NULL DEFAULT 0,
      last_updated DATE NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_journal_entry_date (entry_date),
      INDEX idx_journal_debit_asset (debit_asset_id),
      INDEX idx_journal_credit_asset (credit_asset_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;

  await pool.query(createUsersTable);
  await pool.query(createAssetsTable);
  await pool.query(createJournalTable);
}

async function seedDefaults(defaultAssets, defaultAdminUser) {
  const [userRows] = await pool.query('SELECT COUNT(*) AS total FROM users');
  if (userRows[0].total === 0) {
    const { createHash } = await import('crypto');
    const passwordHash = createHash('sha256').update(defaultAdminUser.password).digest('hex');
    await pool.query(
      'INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)',
      [defaultAdminUser.username, passwordHash, 'Administrator', 'admin']
    );
  }

  const [assetRows] = await pool.query('SELECT COUNT(*) AS total FROM biological_assets');
  if (assetRows[0].total === 0 && Array.isArray(defaultAssets) && defaultAssets.length > 0) {
    const values = defaultAssets.map((asset) => [
      asset.id,
      asset.tagId,
      asset.type,
      asset.age,
      asset.weight,
      asset.fairValue,
      asset.lastUpdated,
    ]);
    await pool.query(
      'INSERT INTO biological_assets (id, tag_id, type, age, weight, fair_value, last_updated) VALUES ?',
      [values]
    );
  }
}

export async function initDatabase({ defaultAssets = [], defaultAdminUser } = {}) {
  await ensureDatabaseExists();
  pool = mysql.createPool(poolConfig(true));
  await runMigrations();
  await seedDefaults(defaultAssets, defaultAdminUser);
  return pool;
}

export function getPool() {
  if (!pool) {
    throw new Error('Database is not initialized yet.');
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
