import * as repo from './superadmin.repository';
import { prisma } from '../../shared/db';
import { v4 as uuid } from 'uuid';
export const getGlobalStats = async (req, res) => {
    try {
        const stats = await repo.getSaaSStats();
        res.json({
            ...stats,
            serverUptime: process.uptime()
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
export const getUsers = async (req, res) => {
    try {
        const filter = req.query.search || '';
        const fleets = await repo.findAllFleets(filter);
        res.json(fleets);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
export const grantLicense = async (req, res) => {
    try {
        const { userId, plan, expiresAt, reason } = req.body;
        const superAdminId = req.user.userId;
        if (!userId || !plan) {
            return res.status(400).json({ error: 'UserID y Plan son obligatorios.' });
        }
        // Eliminar overrides previos del mismo usuario para evitar conflictos
        await prisma.licenseOverride.deleteMany({ where: { userId } });
        const override = await prisma.licenseOverride.create({
            data: {
                id: uuid(),
                userId,
                plan,
                reason: reason || 'Concedido por SuperAdmin',
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                createdBy: superAdminId
            }
        });
        res.json({ success: true, override });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
//# sourceMappingURL=superadmin.controller.js.map