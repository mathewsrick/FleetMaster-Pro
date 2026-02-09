import fs from 'fs';
import initSqlJs from 'sql.js';
import { ENV } from '../config/env';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';

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
  fs.writeFileSync(dbPath, data);
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

// ---- SCHEMA DEFINITION ----
dbHelpers.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'ADMIN_FLOTA',
    isConfirmed INTEGER DEFAULT 0,
    confirmationToken TEXT,
    resetToken TEXT,
    lastActivity TEXT,
    createdAt TEXT,
    isBlocked INTEGER DEFAULT 0,
    mustChangePassword INTEGER DEFAULT 0
  )
`);

dbHelpers.exec(`
  CREATE TABLE IF NOT EXISTS roles (
    slug TEXT PRIMARY KEY,
    name TEXT,
    description TEXT,
    permissions TEXT,
    level INTEGER,
    isSystemRole INTEGER DEFAULT 0
  )
`);

dbHelpers.exec(`
  CREATE TABLE IF NOT EXISTS features (
    key TEXT PRIMARY KEY,
    name TEXT,
    description TEXT,
    category TEXT
  )
`);

dbHelpers.exec(`
  CREATE TABLE IF NOT EXISTS plans_config (
    key TEXT PRIMARY KEY,
    name TEXT,
    priceMonthly REAL,
    priceYearly REAL,
    trialDays INTEGER DEFAULT 5,
    maxVehicles INTEGER,
    maxDrivers INTEGER,
    hasExcelReports INTEGER,
    hasCustomApi INTEGER,
    maxHistoryDays INTEGER,
    maxRangeDays INTEGER,
    isActive INTEGER DEFAULT 1
  )
`);

dbHelpers.exec(`
  CREATE TABLE IF NOT EXISTS plan_features (
    planKey TEXT,
    featureKey TEXT,
    PRIMARY KEY(planKey, featureKey)
  )
`);

dbHelpers.exec(`
  CREATE TABLE IF NOT EXISTS global_banners (
    id TEXT PRIMARY KEY,
    message TEXT,
    type TEXT,
    isActive INTEGER DEFAULT 0,
    startDate TEXT,
    endDate TEXT,
    targetPlan TEXT DEFAULT 'all'
  )
`);

dbHelpers.exec(`
  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    userId TEXT,
    action TEXT,
    targetType TEXT,
    targetId TEXT,
    details TEXT,
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

dbHelpers.exec(`CREATE TABLE IF NOT EXISTS drivers (id TEXT PRIMARY KEY, userId TEXT, firstName TEXT, lastName TEXT, email TEXT, phone TEXT, idNumber TEXT, licensePhoto TEXT, idPhoto TEXT)`);
dbHelpers.exec(`CREATE TABLE IF NOT EXISTS vehicles (id TEXT PRIMARY KEY, userId TEXT, year INTEGER, licensePlate TEXT, model TEXT, color TEXT, purchaseDate TEXT, insurance TEXT, insuranceNumber TEXT, soatExpiration TEXT, techExpiration TEXT, rentaValue REAL, driverId TEXT, photos TEXT)`);
dbHelpers.exec(`CREATE TABLE IF NOT EXISTS payments (id TEXT PRIMARY KEY, userId TEXT, amount REAL, date TEXT, driverId TEXT, vehicleId TEXT, type TEXT DEFAULT 'renta', arrearId TEXT)`);
dbHelpers.exec(`CREATE TABLE IF NOT EXISTS expenses (id TEXT PRIMARY KEY, userId TEXT, description TEXT, amount REAL, date TEXT, vehicleId TEXT)`);
dbHelpers.exec(`CREATE TABLE IF NOT EXISTS arrears (id TEXT PRIMARY KEY, userId TEXT, amountOwed REAL, status TEXT DEFAULT 'pending', driverId TEXT, vehicleId TEXT, dueDate TEXT, originPaymentId TEXT)`);

// ---- SEEDERS LOGIC ----

export const runSeeders = () => {
  console.log('--- STARTING SYSTEM SEEDERS ---');

  // 1. Roles
  const roles = [
    ['superadmin', 'SUPERADMIN', 'Administrador de la plataforma completa', '*', 1, 1],
    ['support', 'SUPPORT', 'Equipo de soporte técnico', 'view:flotas,view:metrics,view:users,reset:passwords,view:logs', 2, 1],
    ['admin-flota', 'ADMIN_FLOTA', 'Administrador de una flota específica', 'manage:own_fleet,manage:own_users,manage:own_vehicles,view:own_reports', 3, 0]
  ];
  roles.forEach(r => {
    const exists = dbHelpers.prepare('SELECT slug FROM roles WHERE slug = ?').get([r[0]]);
    if (!exists) {
      dbHelpers.prepare('INSERT INTO roles (slug, name, description, permissions, level, isSystemRole) VALUES (?, ?, ?, ?, ?, ?)').run(r);
      console.log(`✓ Role created: ${r[0]}`);
    }
  });

  // 2. Features
  const features = [
    ['vehicle_management', 'Gestión de Vehículos', 'CRUD completo de vehículos de la flota', 'core'],
    ['basic_reports', 'Reportes Básicos', 'Reportes predefinidos estándar', 'reports'],
    ['custom_reports', 'Reportes Personalizados', 'Crear reportes personalizados con filtros avanzados', 'reports'],
    ['api_access', 'Acceso API', 'Acceso a la API REST para integraciones', 'integrations'],
    ['priority_support', 'Soporte Prioritario', 'Soporte técnico con respuesta en 2 horas', 'support'],
    ['driver_management', 'Gestión de Conductores', 'Administración de conductores y licencias', 'core'],
    ['driver_payments', 'Pagos de Conductores', 'Gestión de pagos y liquidaciones de conductores', 'financial'],
    ['arrears_management', 'Gestión de Arrears', 'Control y seguimiento de pagos atrasados y deudas', 'financial'],
    ['advanced_analytics', 'Analítica Avanzada', 'Dashboard con KPIs y métricas avanzadas', 'analytics'],
    ['integrations', 'Integraciones', 'Conectar con sistemas externos (ERP, CRM, etc)', 'integrations']
  ];
  features.forEach(f => {
    const exists = dbHelpers.prepare('SELECT key FROM features WHERE key = ?').get([f[0]]);
    if (!exists) {
      dbHelpers.prepare('INSERT INTO features (key, name, description, category) VALUES (?, ?, ?, ?)').run(f);
      console.log(`✓ Feature created: ${f[0]}`);
    }
  });

  // 3. Plans
  const plans = [
    ['free_trial', 'Free Trial', 0, 0, 5, 1, 1, 0, 0, 30, 0],
    ['basico', 'Básico', 59900, 599000, 0, 3, 5, 0, 0, 30, 0],
    ['pro', 'Pro', 95900, 959000, 0, 6, 10, 1, 0, 0, 90],
    ['enterprise', 'Enterprise', 145900, 1459000, 0, 999, 999, 1, 1, 0, 0]
  ];
  plans.forEach(p => {
    const exists = dbHelpers.prepare('SELECT key FROM plans_config WHERE key = ?').get([p[0]]);
    if (!exists) {
      dbHelpers.prepare(`
        INSERT INTO plans_config (key, name, priceMonthly, priceYearly, trialDays, maxVehicles, maxDrivers, hasExcelReports, hasCustomApi, maxHistoryDays, maxRangeDays)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(p);
      console.log(`✓ Plan created: ${p[0]}`);
    }
  });

  // 4. Default SuperAdmin
  const adminIdentifier = 'rmatheus';
  const adminExists = dbHelpers.prepare('SELECT id FROM users WHERE username = ?').get([adminIdentifier]);
  if (!adminExists) {
    const hashedPassword = bcrypt.hashSync('Rmath327', 12);
    dbHelpers.prepare(`
      INSERT INTO users (id, username, email, password, role, isConfirmed, createdAt, mustChangePassword)
      VALUES (?, ?, ?, ?, 'SUPERADMIN', 1, ?, 1)
    `).run([uuid(), adminIdentifier, 'admin@fleetmaster.pro', hashedPassword, new Date().toISOString()]);
    console.log(`✓ Default SuperAdmin created: ${adminIdentifier}`);
  }

  console.log('--- SYSTEM SEEDERS COMPLETED ---');
};

// Ejecutar seeders inmediatamente al importar
runSeeders();