import * as service from './assignment.service';

export const assign = async (req: any, res: any) => {
  try {
    const { driverId, vehicleId } = req.body;
    if (!driverId) {
      return res.status(400).json({ error: 'driverId is required' });
    }

    const result = await service.assignDriverToVehicle(req.user.userId, driverId, vehicleId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Error al asignar conductor', message: error.message });
  }
};