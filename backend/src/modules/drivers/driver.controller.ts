import * as service from './driver.service';

export const getAll = async (req: any, res: any) => {
  res.json(await service.getAll(req.userId));
};

export const create = async (req: any, res: any) => {
  const driver = await service.create(req.userId, req.body);
  res.status(201).json(driver);
};

export const update = async (req: any, res: any) => {
  await service.update(req.userId, req.params.id, req.body);
  res.json({ success: true });
};

export const remove = async (req: any, res: any) => {
  await service.remove(req.userId, req.params.id);
  res.status(204).end();
};