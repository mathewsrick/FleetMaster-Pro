import * as service from './expense.service';

export const getAll = async (req: any, res: any) => {
  res.json(await service.getAll(req.user.userId));
};

export const save = async (req: any, res: any) => {
  await service.updateOrCreate(req.user.userId, req.body);
  res.json({ success: true });
};

export const remove = async (req: any, res: any) => {
  await service.remove(req.user.userId, req.params.id);
  res.json({ success: true });
};
