import * as service from './driver.service';

export const getAll = (req: any, res: any) => {
  res.json(service.getAll(req.userId));
};

export const create = (req: any, res: any) => {
  const driver = service.create(req.userId, req.body);
  res.status(201).json(driver);
};

export const update = (req: any, res: any) => {
  service.update(req.userId, req.params.id, req.body);
  res.json({ success: true });
};

export const remove = (req: any, res: any) => {
  service.remove(req.userId, req.params.id);
  res.status(204).end();
};