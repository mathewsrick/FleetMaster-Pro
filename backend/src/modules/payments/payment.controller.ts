import * as service from './payment.service';

export const getAll = (req: any, res: any) =>
  res.json(service.getAll(req.userId));

export const byDriver = (req: any, res: any) =>
  res.json(service.getByDriver(req.userId, req.params.driverId));

export const create = (req: any, res: any) => {
  service.create(req.userId, req.body);
  res.json({ success: true });
};

export const remove = (req: any, res: any) => {
  service.remove(req.userId, req.params.id);
  res.status(204).end();
}