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
  try {
    await service.updateOrCreate(req.user.userId, req.body);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error saving expense:', error);
    res.status(500).json({ 
      error: error.message || 'Error al guardar el gasto',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const remove = async (req: any, res: any) => {
  try {
    await service.remove(req.user.userId, req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error removing expense:', error);
    res.status(500).json({ 
      error: error.message || 'Error al eliminar el gasto'
    });
  }
};
