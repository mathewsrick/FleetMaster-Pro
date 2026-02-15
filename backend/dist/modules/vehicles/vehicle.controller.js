import * as service from './vehicle.service';
export const getAll = async (req, res) => {
    const vehicles = await service.getAll(req.user.userId, req.query);
    res.json(vehicles);
};
export const save = async (req, res) => {
    try {
        await service.save(req.user.userId, req.body);
        res.json({ success: true });
    }
    catch (error) {
        res.status(403).json({ error: error.message });
    }
};
export const remove = async (req, res) => {
    await service.remove?.(req.user.userId, req.params.id);
    res.json({ success: true });
};
