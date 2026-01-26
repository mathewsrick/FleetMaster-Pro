import * as service from './vehicle.service';

export const getAll = (req: any, res: any) => {
  res.json(service.getAll(req.userId));
};

export const save = (req: any, res: any) => {
  service.save(req.userId, req.body);
  res.json({ success: true });
};

export const remove = (req: any, res: any) => {
  service.remove?.(req.userId, req.params.id);
  res.json({ success: true });
};