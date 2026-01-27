import * as service from './vehicle.service';

export const getAll = async (req: any, res: any) => {
  const vehicles = await service.getAll(req.user.userId);
  res.json(vehicles);
};

export const save = async (req: any, res: any) => {
  await service.save(req.user.userId, req.body);
  res.json({ success: true });
};

export const remove = async (req: any, res: any) => {
  await service.remove?.(req.user.userId, req.params.id);
  res.json({ success: true });
};