import * as service from './expense.service';
export const getAll = async (req, res) => {
    const plan = req.user.plan || 'free_trial';
    try {
        const result = await service.getAll(req.user.userId, req.query, plan);
        res.json(result);
    }
    catch (error) {
        res.status(403).json({ error: error.message });
    }
};
export const save = async (req, res) => {
    await service.updateOrCreate(req.user.userId, req.body);
    res.json({ success: true });
};
export const remove = async (req, res) => {
    await service.remove(req.user.userId, req.params.id);
    res.json({ success: true });
};
