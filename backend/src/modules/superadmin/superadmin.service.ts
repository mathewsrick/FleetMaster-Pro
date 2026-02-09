
import * as repo from './superadmin.repository';
import { v4 as uuid } from 'uuid';
import { dbHelpers } from '../../shared/db';

export const getDashboardData = async () => {
  const stats = repo.getSaaSStats();
  const recentLogs = repo.findAuditLogs(10);
  const activeBanners = repo.findActiveBanners();
  
  return {
    ...stats,
    recentLogs,
    activeBanners,
    serverUptime: (process as any).uptime()
  };
};

export const getFleets = async (query: string) => repo.findAllFleets(query);

export const updateFleetStatus = async (adminId: string, fleetId: string, isBlocked: boolean) => {
  dbHelpers.prepare("UPDATE users SET isBlocked = ? WHERE id = ?").run([isBlocked ? 1 : 0, fleetId]);
  
  repo.createAuditEntry({
    id: uuid(),
    userId: adminId,
    action: isBlocked ? 'BLOCK_FLEET' : 'UNBLOCK_FLEET',
    targetType: 'FLEET',
    targetId: fleetId,
    details: isBlocked ? 'Flota suspendida por el administrador' : 'Flota reactivada',
    createdAt: new Date().toISOString()
  });
};

export const getPlansAndFeatures = async () => {
  const plans = repo.findAllPlans();
  const features = repo.findAllFeatures();
  return { plans, features };
};

export const updatePlanConfig = async (adminId: string, planKey: string, data: any) => {
  const { name, priceMonthly, priceYearly, features, limits, isActive } = data;
  
  dbHelpers.prepare(`
    UPDATE plans_config SET 
      name = ?, priceMonthly = ?, priceYearly = ?, 
      maxVehicles = ?, maxDrivers = ?, hasExcelReports = ?, 
      hasCustomApi = ?, maxHistoryDays = ?, maxRangeDays = ?, isActive = ?
    WHERE key = ?
  `).run([
    name, priceMonthly, priceYearly, 
    limits.maxVehicles, limits.maxDrivers, limits.hasExcelReports ? 1 : 0,
    limits.hasCustomApi ? 1 : 0, limits.maxHistoryDays, limits.maxRangeDays, 
    isActive ? 1 : 0, planKey
  ]);

  if (features) {
    repo.updatePlanFeatures(planKey, features);
  }

  repo.createAuditEntry({
    id: uuid(),
    userId: adminId,
    action: 'UPDATE_PLAN',
    targetType: 'PLAN',
    targetId: planKey,
    details: `Configuración y features del plan ${planKey} actualizados`,
    createdAt: new Date().toISOString()
  });
};

export const getStaff = async () => repo.findStaffUsers();

export const manageStaff = async (adminId: string, data: any) => {
  const { id, username, email, role, action } = data;
  
  if (action === 'create') {
    // Lógica simplificada de creación
  } else if (action === 'toggle_block') {
    const user = dbHelpers.prepare("SELECT isBlocked FROM users WHERE id = ?").get([id]);
    dbHelpers.prepare("UPDATE users SET isBlocked = ? WHERE id = ?").run([user.isBlocked ? 0 : 1, id]);
  }

  repo.createAuditEntry({
    id: uuid(),
    userId: adminId,
    action: 'MANAGE_STAFF',
    targetType: 'USER',
    targetId: id || username,
    details: `Acción staff: ${action}`,
    createdAt: new Date().toISOString()
  });
};

export const createGlobalBanner = async (adminId: string, data: any) => {
  const id = uuid();
  dbHelpers.prepare(`
    INSERT INTO global_banners (id, message, type, isActive, startDate, endDate, targetPlan)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run([id, data.message, data.type, 1, data.startDate, data.endDate, data.targetPlan || 'all']);

  repo.createAuditEntry({
    id: uuid(),
    userId: adminId,
    action: 'CREATE_BANNER',
    targetType: 'BANNER',
    targetId: id,
    details: `Nuevo aviso global publicado`,
    createdAt: new Date().toISOString()
  });
};
