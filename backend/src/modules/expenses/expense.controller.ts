import * as service from './expense.service.js';

export const getAll = async (req: any, res: any) => {
  const plan = req.user.plan || 'free_trial';
  try {
    const result = await service.getAll(req.user.userId, req.query, plan);
    res.json(result);
  } catch (error: any) {
    res.status(403).json({ error: error.message });
  }
};

export const save = async (req: any, res: any) => {
  await service.updateOrCreate(req.user.userId, req.body);
  res.json({ success: true });
};

export const remove = async (req: any, res: any) => {
  await service.remove(req.user.userId, req.params.id);
  res.json({ success: true });
};
