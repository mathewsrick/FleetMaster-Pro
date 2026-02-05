import { dbHelpers } from '../../shared/db';

export const getGlobalStats = async (req: any, res: any) => {
  const totalUsers = dbHelpers.prepare('SELECT COUNT(*) as count FROM users WHERE role = "USER"').get().count;
  const activeSubs = dbHelpers.prepare('SELECT COUNT(*) as count FROM subscription_keys WHERE status = "active"').get().count;
  const totalRevenue = dbHelpers.prepare('SELECT SUM(price) as sum FROM subscription_keys').get().sum || 0;
  
  res.json({
    totalUsers,
    activeSubs,
    totalRevenue,
    // Cast process to any to avoid TS errors when process.uptime is not recognized
    serverUptime: (process as any).uptime()
  });
};

export const getUsers = async (req: any, res: any) => {
  const users = dbHelpers.prepare(`
    SELECT id, username, isConfirmed, role, lastActivity, createdAt
    FROM users 
    WHERE role = "USER"
    ORDER BY lastActivity DESC
  `).all();
  res.json(users);
};