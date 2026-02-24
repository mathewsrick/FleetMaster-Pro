import * as service from './driver.service.js';

export const getAll = async (req: any, res: any) => {
  res.json(await service.getAll(req.user.userId, req.query));
};

export const create = async (req: any, res: any) => {
  try {
    const driver = await service.create(req.user.userId, req.body);
    res.status(201).json(driver);
  } catch (error: any) {
    // Manejo de errores específicos
    if (error.code === 'PLAN_LIMIT_DRIVERS') {
      return res.status(403).json(error);
    }
    
    if (error.code === 'DUPLICATE_DRIVER') {
      return res.status(409).json(error);
    }

    // Errores de Prisma - constraint violations
    if (error.code === 'P2002') {
      return res.status(409).json({ 
        code: 'DUPLICATE_ENTRY',
        message: 'Ya existe un conductor con esos datos. Por favor, verifica la información e intenta nuevamente.'
      });
    }

    if (error.code === 'P2003') {
      return res.status(400).json({ 
        code: 'INVALID_REFERENCE',
        message: 'El vehículo seleccionado no existe o no está disponible.'
      });
    }

    // Error genérico
    console.error('Error al crear conductor:', error);
    res.status(500).json({ 
      code: 'INTERNAL_ERROR', 
      message: 'Ocurrió un error al crear el conductor. Por favor, intenta nuevamente.'
    });
  }
};

export const update = async (req: any, res: any) => {
  try {
    await service.update(req.user.userId, req.params.id, req.body);
    res.json({ success: true });
  } catch (error: any) {
    // Errores de Prisma
    if (error.code === 'P2002') {
      return res.status(409).json({ 
        code: 'DUPLICATE_ENTRY',
        message: 'Ya existe un conductor con esos datos.'
      });
    }

    if (error.code === 'P2003') {
      return res.status(400).json({ 
        code: 'INVALID_REFERENCE',
        message: 'El vehículo seleccionado no existe o no está disponible.'
      });
    }

    if (error.code === 'P2025') {
      return res.status(404).json({ 
        code: 'NOT_FOUND',
        message: 'Conductor no encontrado.'
      });
    }

    console.error('Error al actualizar conductor:', error);
    res.status(500).json({ 
      code: 'INTERNAL_ERROR',
      message: 'Ocurrió un error al actualizar el conductor. Por favor, intenta nuevamente.'
    });
  }
};

export const remove = async (req: any, res: any) => {
  await service.remove(req.user.userId, req.params.id);
  res.status(204).end();
};