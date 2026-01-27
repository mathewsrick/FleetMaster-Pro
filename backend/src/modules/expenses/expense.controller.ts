import * as service from './expense.service';

export const getAll = async (req: any, res: any) => {
  res.json(await service.getAll(req.userId));
};

export const save = async (req: any, res: any) => {
  await service.updateOrCreate(req.userId, req.body);
  res.json({ success: true });
};

export const remove = async (req: any, res: any) => {
  await service.remove(req.userId, req.params.id);
  res.json({ success: true });
};
