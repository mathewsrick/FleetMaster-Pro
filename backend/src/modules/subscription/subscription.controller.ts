import * as service from './subscription.service';

export const activate = (req: any, res: any) => {
  try {
    const result = service.activate(
      req.user.userId,
      req.body.key
    );

    res.json({
      success: true,
      ...result
    });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};

export const generateKey = (req: any, res: any) => {
  try {
    const key = service.generateKey(req.body.plan);
    res.status(201).json(key);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
};