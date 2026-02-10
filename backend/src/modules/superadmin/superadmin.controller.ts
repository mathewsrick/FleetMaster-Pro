import * as repo from './superadmin.repository';

export const getGlobalStats = async (req: any, res: any) => {
  try {
    const stats = await repo.getSaaSStats();
    res.json({
      ...stats,
      serverUptime: (process as any).uptime()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getUsers = async (req: any, res: any) => {
  try {
    const filter = req.query.search || '';
    const fleets = await repo.findAllFleets(filter);
    res.json(fleets);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};