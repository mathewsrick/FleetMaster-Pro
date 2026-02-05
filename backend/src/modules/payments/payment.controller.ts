import * as service from './payment.service';

export const getAll = async (req: any, res: any) => {
  // Extraer el plan directamente del token decodificado en el middleware de auth
  // que suele inyectarse en req.user
  const plan = req.user.plan || 'free_trial';

  try {
    const result = await service.getAll(req.user.userId, req.query, plan);
    res.json(result);
  } catch (error: any) {
    res.status(403).json({ error: error.message });
  }
};

export const byDriver = async (req: any, res: any) =>
  res.json(await service.getByDriver(req.user.userId, req.params.driverId));

export const create = async (req: any, res: any) => {
  await service.create(req.user.userId, req.body);
  res.json({ success: true });
};

export const remove = async (req: any, res: any) => {
  await service.remove(req.user.userId, req.params.id);
  res.status(204).end();
};
