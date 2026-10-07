const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });

let dbClient = null;
let dbType = 'sqlite'; // fallback default

const initDB = async () => {
  if (dbClient) return { dbClient, dbType };

  const dbHost = process.env.DB_HOST || 'localhost';
  const dbUser = process.env.DB_USER || 'root';
  const dbPassword = process.env.DB_PASSWORD || '';
  const dbName = process.env.DB_NAME || 'student_feedback_db';
  const dbPort = parseInt(process.env.DB_PORT || '3306', 10);

  // 1. Try MySQL Connection first if specified
  if (process.env.USE_MYSQL === 'true' || process.env.USE_SQLITE_FALLBACK !== 'only') {
    try {
      const mysql = require('mysql2/promise');
      // Create connection without db to create DB if needed
      const tempConn = await mysql.createConnection({
        host: dbHost,
        user: dbUser,
        password: dbPassword,
        port: dbPort
      });
      await tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
      await tempConn.end();

      // Create connection pool
      const pool = mysql.createPool({
        host: dbHost,
        user: dbUser,
        password: dbPassword,
        database: dbName,
        port: dbPort,
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
      console.warn('[DB] MySQL connection failed or MySQL not running:', mysqlErr.message);
      console.log('[DB] Falling back to SQLite database...');
    }
  }

  // 2. Fallback to SQLite using sqlite3
  const sqlite3 = require('sqlite3').verbose();
  const dbPath = path.join(__dirname, 'feedback.sqlite');

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
    const [rows, fields] = await dbClient.query(sql, params);
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
