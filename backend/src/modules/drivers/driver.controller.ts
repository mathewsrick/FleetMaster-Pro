import * as service from './driver.service';

export const getAll = async (req: any, res: any) => {
  res.json(await service.getAll(req.user.userId, req.query));
};

export const create = async (req: any, res: any) => {
  try {
    const driver = await service.create(req.user.userId, req.body);
    res.status(201).json(driver);
  } catch (error: any) {
    if (error.code === 'PLAN_LIMIT_DRIVERS') {
      return res.status(403).json(error);
    }
    res.status(500).json({ error: 'INTERNAL_ERROR', message: error.message });
  }
};

export const update = async (req: any, res: any) => {
  await service.update(req.user.userId, req.params.id, req.body);
  res.json({ success: true });
};

export const remove = async (req: any, res: any) => {
  await service.remove(req.user.userId, req.params.id);
  res.status(204).end();
};