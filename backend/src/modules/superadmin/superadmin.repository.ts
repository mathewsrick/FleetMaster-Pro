
import { dbHelpers } from '../../shared/db';

export const getSaaSStats = () => {
  const totalUsers = dbHelpers.prepare('SELECT COUNT(*) as count FROM users WHERE role = "ADMIN_FLOTA"').get().count;
  const activeSubs = dbHelpers.prepare('SELECT COUNT(*) as count FROM subscription_keys WHERE status = "active"').get().count;
  const trialUsers = dbHelpers.prepare(`
    SELECT COUNT(*) as count FROM users u 
    LEFT JOIN subscription_keys sk ON u.id = sk.userId 
    WHERE sk.id IS NULL AND u.role = "ADMIN_FLOTA"
  `).get().count;
  
  const mrr = dbHelpers.prepare(`
    SELECT SUM(p.priceMonthly) as sum 
    FROM subscription_keys sk 
    JOIN plans_config p ON sk.plan = p.key 
    WHERE sk.status = 'active'
  `).get().sum || 0;

  const totalVehicles = dbHelpers.prepare('SELECT COUNT(*) as count FROM vehicles').get().count;

  return { totalUsers, activeSubs, trialUsers, mrr, totalVehicles };
};

export const findAllFleets = (filter: string) => {
  let query = `
    SELECT u.id, u.username, u.email, u.isConfirmed, u.isBlocked, u.lastActivity, u.createdAt,
           sk.plan, sk.dueDate,
           (SELECT COUNT(*) FROM vehicles WHERE userId = u.id) as vehicleCount
    FROM users u
    LEFT JOIN subscription_keys sk ON u.id = sk.userId AND sk.status = 'active'
    WHERE u.role = 'ADMIN_FLOTA'
  `;
  if (filter) query += ` AND (u.username LIKE '%${filter}%' OR u.email LIKE '%${filter}%')`;
  query += ` ORDER BY u.createdAt DESC`;
  
  return dbHelpers.prepare(query).all();
};

export const findAllPlans = () => {
  const plans = dbHelpers.prepare("SELECT * FROM plans_config").all();
  return plans.map((p: any) => ({
    ...p,
    limits: {
      maxVehicles: p.maxVehicles,
      maxDrivers: p.maxDrivers,
      hasExcelReports: !!p.hasExcelReports,
      hasCustomApi: !!p.hasCustomApi,
      maxHistoryDays: p.maxHistoryDays,
      maxRangeDays: p.maxRangeDays
    },
    features: dbHelpers.prepare("SELECT featureKey FROM plan_features WHERE planKey = ?").all([p.key]).map((f: any) => f.featureKey)
  }));
};

export const findAllFeatures = () => dbHelpers.prepare("SELECT * FROM features").all();

export const findAuditLogs = (limit: number) => {
  return dbHelpers.prepare(`
    SELECT a.*, u.username 
    FROM audit_logs a 
    JOIN users u ON a.userId = u.id 
    ORDER BY a.createdAt DESC LIMIT ?
  `).all([limit]);
};

export const findStaffUsers = () => {
  return dbHelpers.prepare(`
    SELECT id, username, email, role, lastActivity, createdAt, isBlocked
    FROM users 
    WHERE role IN ('SUPERADMIN', 'SUPPORT')
    ORDER BY role ASC
  `).all();
};

export const createAuditEntry = (log: any) => {
  dbHelpers.prepare(`
    INSERT INTO audit_logs (id, userId, action, targetType, targetId, details, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run([log.id, log.userId, log.action, log.targetType, log.targetId, log.details, log.createdAt]);
};

export const updatePlanFeatures = (planKey: string, featureKeys: string[]) => {
  dbHelpers.prepare("DELETE FROM plan_features WHERE planKey = ?").run([planKey]);
  featureKeys.forEach(fKey => {
    dbHelpers.prepare("INSERT INTO plan_features (planKey, featureKey) VALUES (?, ?)").run([planKey, fKey]);
  });
};

export const findActiveBanners = () => {
  const now = new Date().toISOString();
  return dbHelpers.prepare(`
    SELECT * FROM global_banners 
    WHERE isActive = 1 AND startDate <= ? AND endDate >= ?
  `).all([now, now]);
};
