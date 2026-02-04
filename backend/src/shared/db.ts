
import fs from 'fs';
import initSqlJs from 'sql.js';
import { ENV } from '../config/env';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../../storage', ENV.DATABASE_PATH);
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const SQL = await initSqlJs();
let db: any;

if (fs.existsSync(dbPath)) {
  const filebuffer = fs.readFileSync(dbPath);
  db = new SQL.Database(filebuffer);
} else {
  db = new SQL.Database();
}

const saveDb = () => {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
};

export const dbHelpers = {
  exec: (sql: string) => {
    db.run(sql);
    saveDb();
  },
  prepare: (sql: string) => {
    const stmt = db.prepare(sql);
    return {
      all: (params: any[] = []) => {
        const safeParams = params.map(p => p === undefined ? null : p);
        stmt.bind(safeParams);
        const rows = [];
        while (stmt.step()) rows.push(stmt.getAsObject());
        stmt.free();
        return rows;
      },
      get: (params: any[] = []) => {
        const safeParams = params.map(p => p === undefined ? null : p);
        stmt.bind(safeParams);
        const row = stmt.step() ? stmt.getAsObject() : undefined;
        stmt.free();
        return row;
      },
      run: (params: any[] = []) => {
        const safeParams = params.map(p => p === undefined ? null : p);
        db.run(sql, safeParams);
        saveDb();
      }
    };
  }
};

// ---- SCHEMA ----
dbHelpers.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'USER',
    isConfirmed INTEGER DEFAULT 0,
    confirmationToken TEXT,
    resetToken TEXT,
    lastActivity TEXT,
    createdAt TEXT
  )
`);

dbHelpers.exec(`
  CREATE TABLE IF NOT EXISTS subscription_keys (
    id TEXT PRIMARY KEY,
    userId TEXT,
    plan TEXT,
    price REAL,
    startDate TEXT,
    dueDate TEXT,
    status TEXT DEFAULT 'active'
  )
`);

// ... Tablas de drivers, vehicles, payments, expenses, arrears se mantienen igual ...
dbHelpers.exec(`CREATE TABLE IF NOT EXISTS drivers (id TEXT PRIMARY KEY, userId TEXT, firstName TEXT NOT NULL, lastName TEXT NOT NULL, phone TEXT, idNumber TEXT)`);
dbHelpers.exec(`CREATE TABLE IF NOT EXISTS vehicles (id TEXT PRIMARY KEY, userId TEXT, year INTEGER, licensePlate TEXT, model TEXT, color TEXT, purchaseDate TEXT, insurance TEXT, insuranceNumber TEXT, soatExpiration TEXT, techExpiration TEXT, canonValue REAL, driverId TEXT)`);
dbHelpers.exec(`CREATE TABLE IF NOT EXISTS payments (id TEXT PRIMARY KEY, userId TEXT, amount REAL, date TEXT, driverId TEXT, vehicleId TEXT, type TEXT DEFAULT 'canon', arrearId TEXT)`);
dbHelpers.exec(`CREATE TABLE IF NOT EXISTS expenses (id TEXT PRIMARY KEY, userId TEXT, description TEXT, amount REAL, date TEXT, vehicleId TEXT)`);
dbHelpers.exec(`CREATE TABLE IF NOT EXISTS arrears (id TEXT PRIMARY KEY, userId TEXT, amountOwed REAL, status TEXT DEFAULT 'pending', driverId TEXT, vehicleId TEXT, dueDate TEXT, originPaymentId TEXT)`);

// Insertar SuperAdmin por defecto si no existe
const adminExists = dbHelpers.prepare('SELECT id FROM users WHERE username = ?').get(['rmatheus']);
if (!adminExists) {
  const hashedPassword = bcrypt.hashSync('4994818', 10);
  dbHelpers.prepare(`
    INSERT INTO users (id, username, password, role, isConfirmed, createdAt)
    VALUES (?, ?, ?, 'SUPERADMIN', 1, ?)
  `).run(['admin-uuid-001', 'rmatheus', hashedPassword, new Date().toISOString()]);
  console.log('✅ SuperAdmin rmatheus creado.');
}