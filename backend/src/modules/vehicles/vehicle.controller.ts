import * as service from './vehicle.service.js';

export const getAll = async (req: any, res: any) => {
  const vehicles = await service.getAll(req.user.userId, req.query);
  res.json(vehicles);
};

export const save = async (req: any, res: any) => {
  try {
    await service.save(req.user.userId, req.body);
    res.json({ success: true });
  } catch (error: any) {
    res.status(403).json({ error: error.message });
  }
};

export const remove = async (req: any, res: any) => {
  await service.remove?.(req.user.userId, req.params.id);
  res.json({ success: true });
};