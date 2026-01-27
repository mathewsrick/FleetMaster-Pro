import * as service from './vehicle.service';

export const getAll = async (req: any, res: any) => {
  const vehicles = await service.getAll(req.userId);
  res.json(vehicles);
};

export const save = async (req: any, res: any) => {
  await service.save(req.userId, req.body);
  res.json({ success: true });
};

export const remove = async (req: any, res: any) => {
  await service.remove?.(req.userId, req.params.id);
  res.json({ success: true });
};