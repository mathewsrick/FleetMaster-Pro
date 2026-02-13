import * as service from './assignment.service';
export const assign = async (req, res) => {
    try {
        const { driverId, vehicleId } = req.body;
        if (!driverId) {
            return res.status(400).json({ error: 'driverId is required' });
        }
        const result = await service.assignDriverToVehicle(req.user.userId, driverId, vehicleId);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Error al asignar conductor', message: error.message });
    }
};
//# sourceMappingURL=assignment.controller.js.map