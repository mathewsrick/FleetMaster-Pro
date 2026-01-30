import * as service from './auth.service';

export const register = async (req: any, res: any) => {
  await service.register(req.body.username, req.body.password);
  res.json({ success: true });
};

export const login = async (req: any, res: any) => {
  try {
    const result = await service.login(req.body.username, req.body.password);
    res.json(result);
  } catch (e: any) {
    res.status(401).json({
      error: e.message,
      accountStatus: e.accountStatus ?? null
    });
  }
};