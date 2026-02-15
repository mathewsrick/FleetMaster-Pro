import * as service from './driver.service';
export const getAll = async (req, res) => {
    res.json(await service.getAll(req.user.userId, req.query));
};
export const create = async (req, res) => {
    try {
        const driver = await service.create(req.user.userId, req.body);
        res.status(201).json(driver);
    }
    catch (error) {
        if (error.code === 'PLAN_LIMIT_DRIVERS') {
            return res.status(403).json(error);
        }
        res.status(500).json({ error: 'INTERNAL_ERROR', message: error.message });
    }
};
export const update = async (req, res) => {
    await service.update(req.user.userId, req.params.id, req.body);
    res.json({ success: true });
};
export const remove = async (req, res) => {
    await service.remove(req.user.userId, req.params.id);
    res.status(204).end();
};
