import * as service from './auth.service';

export const register = (req: any, res: any) => {
  service.register(req.body.username, req.body.password);
  res.json({ success: true });
};

export const login = (req: any, res: any) => {
  try {
    const result = service.login(req.body.username, req.body.password);
    res.json(result);
  } catch (e: any) {
    res.status(401).json({ error: e.message });
  }
};