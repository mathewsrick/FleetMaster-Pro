import * as service from './auth.service.js';

export const register = async (req: any, res: any) => {
  try {
    const { email, username, password } = req.body;
    await service.register(email, username, password);
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

export const login = async (req: any, res: any) => {
  try {
    const { identifier, password } = req.body;
    const result = await service.login(identifier, password);
    res.json(result);
  } catch (e: any) {
    res.status(401).json({
      error: e.message,
      accountStatus: e.accountStatus ?? null
    });
  }
};

export const refresh = async (req: any, res: any) => {
  try {
    const userId = req.user.userId;
    const result = await service.refresh(userId);
    res.json(result);
  } catch (e: any) {
    res.status(401).json({ error: e.message });
  }
};

export const confirm = async (req: any, res: any) => {
  try {
    await service.confirmAccount(req.params.token);
    res.json({ success: true, message: 'Cuenta confirmada con éxito.' });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

export const requestReset = async (req: any, res: any) => {
  try {
    await service.requestPasswordReset(req.body.identifier);
    res.json({ success: true, message: 'Código de recuperación enviado.' });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

export const resetPassword = async (req: any, res: any) => {
  try {
    await service.resetPassword(req.body.token, req.body.newPass);
    res.json({ success: true, message: 'Contraseña actualizada correctamente.' });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};