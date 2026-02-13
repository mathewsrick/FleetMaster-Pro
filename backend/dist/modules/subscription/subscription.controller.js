import * as service from './subscription.service';
export const activate = async (req, res) => {
    try {
        const result = await service.activate(req.user.userId, req.body.key);
        res.json({
            success: true,
            ...result
        });
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
};
export const purchase = async (req, res) => {
    try {
        const { plan, duration } = req.body;
        if (!plan || !duration) {
            return res.status(400).json({ error: 'Plan y duración son requeridos.' });
        }
        const result = await service.purchasePlan(req.user.userId, plan, duration);
        res.json({ success: true, ...result });
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
};
export const generateKey = async (req, res) => {
    try {
        const key = await service.generateKey(req.body.plan, req.body.price);
        res.status(201).json(key);
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
};
//# sourceMappingURL=subscription.controller.js.map