import * as service from './superadmin.service';

export const getGlobalStats = async (req: any, res: any) => {
  try {
    const data = await service.getDashboardData();
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const listFleets = async (req: any, res: any) => {
  try {
    const fleets = await service.getFleets(req.query.search || '');
    res.json(fleets);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const toggleFleet = async (req: any, res: any) => {
  try {
    await service.updateFleetStatus(req.user.userId, req.body.fleetId, req.body.isBlocked);
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

export const getPlansConfig = async (req: any, res: any) => {
  try {
    const data = await service.getPlansAndFeatures();
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const updatePlan = async (req: any, res: any) => {
  try {
    await service.updatePlanConfig(req.user.userId, req.params.key, req.body);
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

export const listStaff = async (req: any, res: any) => {
  try {
    const staff = await service.getStaff();
    res.json(staff);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const postBanner = async (req: any, res: any) => {
  try {
    await service.createGlobalBanner(req.user.userId, req.body);
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};