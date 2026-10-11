const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });

let dbClient = null;
let dbType = 'sqlite'; // fallback default

const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

const initDB = async () => {
  if (dbClient) return { dbClient, dbType };

  const dbHost = process.env.DB_HOST || 'localhost';
  const dbUser = process.env.DB_USER || 'root';
  const dbPassword = process.env.DB_PASSWORD || '';
  const dbName = process.env.DB_NAME || 'student_feedback_db';
  const dbPort = parseInt(process.env.DB_PORT || '3306', 10);

  // If on Vercel and DB_HOST is localhost, skip MySQL attempt immediately (no local MySQL in AWS Lambda)
  const isLocalhost = dbHost === 'localhost' || dbHost === '127.0.0.1';
  const shouldTryMySQL = (process.env.USE_MYSQL === 'true' || process.env.USE_SQLITE_FALLBACK !== 'only') && !(isVercel && isLocalhost);

  // 1. Try MySQL Connection if configured and reachable
  if (shouldTryMySQL) {
    try {
      const mysql = require('mysql2/promise');
      
      // Determine SSL settings (needed for TiDB Cloud, Aiven, PlanetScale, Railway, Clever Cloud)
      const isCloudHost = !isLocalhost;
      const useSSL = process.env.DB_SSL === 'true' || (process.env.DB_SSL !== 'false' && isCloudHost);
      const sslOption = useSSL ? { rejectUnauthorized: false } : undefined;

      const connectionConfig = {
        host: dbHost,
        user: dbUser,
        password: dbPassword,
        port: dbPort,
        connectTimeout: 5000
      };
      if (sslOption) connectionConfig.ssl = sslOption;

      // Try creating DB if user has privileges
      try {
        const tempConn = await mysql.createConnection(connectionConfig);
        await tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
        await tempConn.end();
      } catch (dbCreateErr) {
        // Some cloud providers pre-allocate DB and disallow CREATE DATABASE, so we ignore and proceed
      }

      // Create connection pool
      const pool = mysql.createPool({
        ...connectionConfig,
        database: dbName,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });

      // Test query
      await pool.query('SELECT 1');
      dbClient = pool;
      dbType = 'mysql';
      console.log(`[DB] Successfully connected to MySQL database "${dbName}" at ${dbHost}:${dbPort}`);
      return { dbClient, dbType };
    } catch (mysqlErr) {
      console.warn('[DB] MySQL connection failed or not reachable:', mysqlErr.message);
      console.log('[DB] Falling back to SQLite database...');
    }
  } else if (isVercel && isLocalhost) {
    console.log('[DB] Running on Vercel with DB_HOST=localhost. Using writable serverless SQLite storage in /tmp...');
  }

  // 2. Fallback to SQLite using sqlite3
  const sqlite3 = require('sqlite3').verbose();
  
  // On Vercel Lambda, the filesystem is read-only except /tmp
  const dbPath = isVercel
    ? path.join('/tmp', 'feedback.sqlite')
    : path.join(__dirname, 'feedback.sqlite');

  // If running on Vercel and seed SQLite exists locally, copy to /tmp if not yet present
  if (isVercel && !fs.existsSync(dbPath)) {
    const localSeedDb = path.join(__dirname, 'feedback.sqlite');
    if (fs.existsSync(localSeedDb)) {
      try {
        fs.copyFileSync(localSeedDb, dbPath);
        console.log('[DB] Copied pre-existing SQLite database to /tmp/feedback.sqlite');
      } catch (copyErr) {
        console.warn('[DB] Could not copy SQLite database to /tmp:', copyErr.message);
      }
    }
  }

  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('[DB] SQLite Connection error:', err.message);
        return reject(err);
      }
      dbClient = db;
      dbType = 'sqlite';
      console.log(`[DB] Successfully initialized SQLite database at "${dbPath}"`);
      resolve({ dbClient, dbType });
    });
  });
};

// Unified Query Execution Helper
const query = async (sql, params = []) => {
  if (!dbClient) {
    await initDB();
  }

  if (dbType === 'mysql') {
    const [rows] = await dbClient.query(sql, params);
    return {
      rows: Array.isArray(rows) ? rows : [],
      insertId: rows.insertId,
      affectedRows: rows.affectedRows
    };
  } else {
    // SQLite query execution
    return new Promise((resolve, reject) => {
      const isSelect = sql.trim().toLowerCase().startsWith('select') || sql.trim().toLowerCase().startsWith('pragma');
      
      if (isSelect) {
        dbClient.all(sql, params, (err, rows) => {
          if (err) return reject(err);
          resolve({ rows: rows || [], insertId: null, affectedRows: 0 });
        });
      } else {
        dbClient.run(sql, params, function (err) {
          if (err) return reject(err);
          resolve({
            rows: [],
            insertId: this.lastID,
            affectedRows: this.changes
          });
        });
      }
    });
  }
};

module.exports = {
  initDB,
  query,
  getDBType: () => dbType
};
