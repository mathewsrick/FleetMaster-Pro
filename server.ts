
import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import initSqlJs from 'sql.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const dbPath = process.env.DATABASE_PATH || 'fleet.db';
const port = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'fleet-master-secret-2025';

// Inicialización de SQL.js
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

// Wrapper para emular comportamiento de better-sqlite3 y facilitar mantenimiento
const dbHelpers = {
  exec: (sql: string) => {
    db.run(sql);
    saveDb();
  },
  prepare: (sql: string) => {
    const stmt = db.prepare(sql);
    return {
      all: (params: any[] = []) => {
        stmt.bind(params);
        const rows = [];
        while (stmt.step()) rows.push(stmt.getAsObject());
        stmt.free();
        return rows;
      },
      get: (params: any[] = []) => {
        stmt.bind(params);
        const row = stmt.step() ? stmt.getAsObject() : undefined;
        stmt.free();
        return row;
      },
      run: (params: any[] = []) => {
        db.run(sql, params);
        saveDb();
      }
    };
  }
};

// Esquema
// --- ESQUEMA ---

dbHelpers.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    password TEXT
  )
`);

dbHelpers.exec(`
  CREATE TABLE IF NOT EXISTS drivers (
    id TEXT PRIMARY KEY,
    userId TEXT,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    phone TEXT,
    idNumber TEXT
  )
`);

dbHelpers.exec(`
  CREATE TABLE IF NOT EXISTS vehicles (
    id TEXT PRIMARY KEY,
    userId TEXT,
    year INTEGER,
    licensePlate TEXT,
    model TEXT,
    color TEXT,
    purchaseDate TEXT,
    insurance TEXT,
    insuranceNumber TEXT,
    soatExpiration TEXT,
    techExpiration TEXT,
    canonValue REAL,
    driverId TEXT
  )
`);

dbHelpers.exec(`
  CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    userId TEXT,
    amount REAL,
    date TEXT,
    driverId TEXT,
    vehicleId TEXT,
    type TEXT DEFAULT 'canon',
    arrearId TEXT
  )
`);

dbHelpers.exec(`
  CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    userId TEXT,
    description TEXT,
    amount REAL,
    date TEXT,
    vehicleId TEXT
  )
`);

dbHelpers.exec(`
  CREATE TABLE IF NOT EXISTS arrears (
    id TEXT PRIMARY KEY,
    userId TEXT,
    amountOwed REAL,
    status TEXT DEFAULT 'pending',
    driverId TEXT,
    vehicleId TEXT,
    dueDate TEXT,
    originPaymentId TEXT
  )
`);

// Fix: Cast cors and express.json to any to avoid type mismatches with express app overloads
app.use(cors() as any);
app.use(express.json() as any);
// Servir archivos estáticos de dist
app.use(express.static(path.join(__dirname, 'dist')));

// Fix: Define authenticate as any to prevent RequestHandler version conflicts in route definitions
const authenticate: any = (req: any, res: any, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// --- AUTH ---
app.post('/api/auth/register', (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  try {
    const id = uuidv4();
    dbHelpers.prepare('INSERT INTO users (id, username, password) VALUES (?, ?, ?)').run([id, username, hashedPassword]);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: 'Username already exists' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user: any = dbHelpers.prepare('SELECT * FROM users WHERE username = ?').get([username]);
  if (user && bcrypt.compareSync(password, user.password)) {
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, username: user.username } });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// --- VEHICLES ---
app.get('/api/vehicles', authenticate, (req: any, res) => {
  const rows = dbHelpers.prepare('SELECT * FROM vehicles WHERE userId = ?').all([req.userId]);
  res.json(rows);
});

app.post('/api/vehicles', authenticate, (req: any, res) => {
  const v = req.body;
  const existing = dbHelpers.prepare('SELECT id FROM vehicles WHERE id = ?').get([v.id]);
  if (existing) {
    dbHelpers.prepare(`
      UPDATE vehicles SET year=?, licensePlate=?, model=?, color=?, purchaseDate=?, 
      insurance=?, insuranceNumber=?, soatExpiration=?, techExpiration=?, 
      canonValue=?, driverId=? WHERE id = ? AND userId = ?
    `).run([v.year, v.licensePlate, v.model, v.color, v.purchaseDate, v.insurance, v.insuranceNumber, v.soatExpiration, v.techExpiration, v.canonValue, v.driverId, v.id, req.userId]);
  } else {
    dbHelpers.prepare(`
      INSERT INTO vehicles (id, userId, year, licensePlate, model, color, purchaseDate, insurance, insuranceNumber, soatExpiration, techExpiration, canonValue, driverId)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run([v.id, req.userId, v.year, v.licensePlate, v.model, v.color, v.purchaseDate, v.insurance, v.insuranceNumber, v.soatExpiration, v.techExpiration, v.canonValue, v.driverId]);
  }
  res.json({ success: true });
});

app.delete('/api/vehicles/:id', authenticate, (req: any, res) => {
  dbHelpers.prepare('DELETE FROM vehicles WHERE id = ? AND userId = ?').run([req.params.id, req.userId]);
  res.json({ success: true });
});

// --- PAYMENTS & AUTO-ARREARS ---
app.get('/api/payments', authenticate, (req: any, res) => {
  const rows = dbHelpers.prepare('SELECT * FROM payments WHERE userId = ? ORDER BY date DESC').all([req.userId]);
  res.json(rows);
});

// =====================================================
// NUEVOS ENDPOINTS (NO EXISTEN EN EL ORIGINAL)
// NO USAN TRANSACTIONS
// NO ROMPEN EL FRONT
// =====================================================


// -----------------------------------------------------
// 1. PAGOS POR CONDUCTOR (usado por historial)
// GET /api/payments/driver/:driverId
// -----------------------------------------------------
app.get('/api/payments/driver/:driverId', authenticate, (req: any, res) => {
  const rows = dbHelpers.prepare(`
    SELECT * FROM payments
    WHERE driverId = ? AND userId = ?
    ORDER BY date DESC
  `).all([req.params.driverId, req.userId]);

  res.json(rows);
});


// -----------------------------------------------------
// 2. MORAS POR CONDUCTOR
// GET /api/arrears/driver/:driverId
// -----------------------------------------------------
app.get('/api/arrears/driver/:driverId', authenticate, (req: any, res) => {
  const rows = dbHelpers.prepare(`
    SELECT * FROM arrears
    WHERE driverId = ? AND userId = ?
    ORDER BY dueDate ASC
  `).all([req.params.driverId, req.userId]);

  res.json(rows);
});


// -----------------------------------------------------
// 3. PAGO DE MORA DIRECTO (SIN TRANSACCIONES)
// POST /api/arrears/:id/pay
// -----------------------------------------------------
app.post('/api/arrears/:id/pay', authenticate, (req: any, res) => {
  const { amount, date } = req.body;
  const arrearId = req.params.id;

  const arrear: any = dbHelpers.prepare(`
    SELECT * FROM arrears WHERE id = ? AND userId = ?
  `).get([arrearId, req.userId]);

  if (!arrear) {
    return res.status(404).json({ error: 'Arrear not found' });
  }

  // Actualizar mora
  if (amount >= arrear.amountOwed) {
    dbHelpers.prepare(`
      UPDATE arrears SET status = 'paid', amountOwed = 0 WHERE id = ?
    `).run([arrearId]);
  } else {
    dbHelpers.prepare(`
      UPDATE arrears SET amountOwed = amountOwed - ? WHERE id = ?
    `).run([amount, arrearId]);
  }

  // Registrar pago
  dbHelpers.prepare(`
    INSERT INTO payments (
      id, userId, amount, date,
      driverId, vehicleId, type, arrearId
    ) VALUES (?, ?, ?, ?, ?, ?, 'arrear_payment', ?)
  `).run([
    uuidv4(),
    req.userId,
    amount,
    date,
    arrear.driverId,
    arrear.vehicleId,
    arrearId
  ]);

  res.json({ success: true });
});


// -----------------------------------------------------
// 4. PAGO AVANZADO (CANON O MORA)
// NO REEMPLAZA /api/payments
// ES OPCIONAL PARA EL FRONT
// POST /api/payments/advanced
// -----------------------------------------------------
app.post('/api/payments/advanced', authenticate, (req: any, res) => {
  const p = req.body;

  // Registrar pago
  dbHelpers.prepare(`
    INSERT INTO payments (
      id, userId, amount, date,
      driverId, vehicleId, type, arrearId
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run([
    p.id,
    req.userId,
    p.amount,
    p.date,
    p.driverId,
    p.vehicleId,
    p.type || 'canon',
    p.arrearId || null
  ]);

  // Si es CANON y es parcial → generar mora
  if (!p.type || p.type === 'canon') {
    const vehicle: any = dbHelpers.prepare(`
      SELECT canonValue FROM vehicles WHERE id = ?
    `).get([p.vehicleId]);

    if (vehicle && p.amount < vehicle.canonValue) {
      dbHelpers.prepare(`
        DELETE FROM arrears WHERE originPaymentId = ?
      `).run([p.id]);

      dbHelpers.prepare(`
        INSERT INTO arrears (
          id, userId, amountOwed, status,
          driverId, vehicleId, dueDate, originPaymentId
        ) VALUES (?, ?, ?, 'pending', ?, ?, ?, ?)
      `).run([
        uuidv4(),
        req.userId,
        vehicle.canonValue - p.amount,
        p.driverId,
        p.vehicleId,
        p.date,
        p.id
      ]);
    }
  }

  res.json({ success: true });
});

app.post('/api/payments', authenticate, (req: any, res) => {
  const p = req.body;

  // Transacción manual para sql.js
  try {
    const vehicle: any = dbHelpers
      .prepare('SELECT canonValue FROM vehicles WHERE id = ?')
      .get([p.vehicleId]);

    dbHelpers.prepare(
      'DELETE FROM arrears WHERE originPaymentId = ?'
    ).run([p.id]);

    const existing = dbHelpers
      .prepare('SELECT id FROM payments WHERE id = ?')
      .get([p.id]);

    if (existing) {
      dbHelpers.prepare(
        'UPDATE payments SET amount=?, date=?, driverId=?, vehicleId=? WHERE id=? AND userId=?'
      ).run([p.amount, p.date, p.driverId, p.vehicleId, p.id, req.userId]);
    } else {
      dbHelpers.prepare(
        'INSERT INTO payments (id, userId, amount, date, driverId, vehicleId) VALUES (?, ?, ?, ?, ?, ?)'
      ).run([p.id, req.userId, p.amount, p.date, p.driverId, p.vehicleId]);
    }

    if (vehicle && p.amount < vehicle.canonValue) {
      const debt = vehicle.canonValue - p.amount;
      dbHelpers.prepare(`
        INSERT INTO arrears (
          id, userId, amountOwed, status, driverId, vehicleId, dueDate, originPaymentId
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run([
        uuidv4(),
        req.userId,
        debt,
        'pending',
        p.driverId,
        p.vehicleId,
        p.date,
        p.id
      ]);
    }

    saveDb();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Payment transaction failed' });
  }
});

// --- EXPENSES ---
app.get('/api/expenses', authenticate, (req: any, res) => {
  const rows = dbHelpers.prepare('SELECT * FROM expenses WHERE userId = ? ORDER BY date DESC').all([req.userId]);
  res.json(rows);
});

app.post('/api/expenses', authenticate, (req: any, res) => {
  const e = req.body;
  const existing = dbHelpers.prepare('SELECT id FROM expenses WHERE id = ?').get([e.id]);
  if (existing) {
    dbHelpers.prepare('UPDATE expenses SET description=?, amount=?, date=?, vehicleId=? WHERE id=? AND userId=?')
      .run([e.description, e.amount, e.date, e.vehicleId, e.id, req.userId]);
  } else {
    dbHelpers.prepare('INSERT INTO expenses (id, userId, description, amount, date, vehicleId) VALUES (?, ?, ?, ?, ?, ?)')
      .run([e.id, req.userId, e.description, e.amount, e.date, e.vehicleId]);
  }
  res.json({ success: true });
});

// --- ARREARS ---
app.get('/api/arrears', authenticate, (req: any, res) => {
  const rows = dbHelpers.prepare('SELECT * FROM arrears WHERE userId = ?').all([req.userId]);
  res.json(rows);
});

// --- ASSIGN ---
app.post('/api/assign', authenticate, (req: any, res) => {
  const { driverId, vehicleId } = req.body;

  try {
    dbHelpers.prepare(
      'UPDATE vehicles SET driverId = NULL WHERE driverId = ? AND userId = ?'
    ).run([driverId, req.userId]);

    if (vehicleId) {
      dbHelpers.prepare(
        'UPDATE vehicles SET driverId = ? WHERE id = ? AND userId = ?'
      ).run([driverId, vehicleId, req.userId]);
    }

    saveDb();
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Assignment failed' });
  }
});

// --- DRIVERS (REST CORRECTO) ---

app.get('/api/drivers', authenticate, (req: any, res) => {
  const rows = dbHelpers
    .prepare('SELECT * FROM drivers WHERE userId = ?')
    .all([req.userId]);
  res.json(rows);
});

app.post('/api/drivers', authenticate, (req: any, res) => {
  const d = req.body;

  dbHelpers.prepare(`
    INSERT INTO drivers (id, userId, firstName, lastName, phone, idNumber)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run([
    d.id,
    req.userId,
    d.firstName,
    d.lastName,
    d.phone,
    d.idNumber,
  ]);

  res.status(201).json(d);
});

app.put('/api/drivers/:id', authenticate, (req: any, res) => {
  const d = req.body;

  dbHelpers.prepare(`
    UPDATE drivers
    SET firstName=?, lastName=?, phone=?, idNumber=?
    WHERE id=? AND userId=?
  `).run([
    d.firstName,
    d.lastName,
    d.phone,
    d.idNumber,
    req.params.id,
    req.userId,
  ]);

  res.json(d);
});

app.delete('/api/drivers/:id', authenticate, (req: any, res) => {
  // desasignar vehículo primero
  dbHelpers.prepare(
    'UPDATE vehicles SET driverId = NULL WHERE driverId = ? AND userId = ?'
  ).run([req.params.id, req.userId]);

  dbHelpers.prepare(
    'DELETE FROM drivers WHERE id = ? AND userId = ?'
  ).run([req.params.id, req.userId]);

  res.status(204).end();
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
app.listen(port, () => console.log(`🚀 FLEETMASTER PRO 1.1 (SQL.JS) ONLINE - Puerto: ${port}`));
