import * as service from './auth.service';
export const register = async (req, res) => {
    try {
        const { email, username, password } = req.body;
        await service.register(email, username, password);
        res.json({ success: true });
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
};
export const login = async (req, res) => {
    try {
        const { identifier, password } = req.body;
        const result = await service.login(identifier, password);
        res.json(result);
    }
    catch (e) {
        res.status(401).json({
            error: e.message,
            accountStatus: e.accountStatus ?? null
        });
    }
};
export const refresh = async (req, res) => {
    try {
        const userId = req.user.userId;
        const result = await service.refresh(userId);
        res.json(result);
    }
    catch (e) {
        res.status(401).json({ error: e.message });
    }
};
export const confirm = async (req, res) => {
    try {
        await service.confirmAccount(req.params.token);
        res.json({ success: true, message: 'Cuenta confirmada con éxito.' });
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
};
export const requestReset = async (req, res) => {
    try {
        await service.requestPasswordReset(req.body.identifier);
        res.json({ success: true, message: 'Código de recuperación enviado.' });
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
};
export const resetPassword = async (req, res) => {
    try {
        await service.resetPassword(req.body.token, req.body.newPass);
        res.json({ success: true, message: 'Contraseña actualizada correctamente.' });
    }
    catch (e) {
        res.status(400).json({ error: e.message });
    }
};
//# sourceMappingURL=auth.controller.js.map