import * as repo from './superadmin.repository.js';
import { prisma } from '../../shared/db.js';
import { UPLOADS_ROOT } from '../../shared/multer.config.js';
import { v4 as uuid } from 'uuid';
import fs from 'fs';
import path from 'path';

export const getGlobalStats = async (req: any, res: any) => {
  try {
    const stats = await repo.getSaaSStats();
    res.json({
      ...stats,
      serverUptime: (process as any).uptime()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getUsers = async (req: any, res: any) => {
  try {
    const filter = req.query.search || '';
    const fleets = await repo.findAllFleets(filter);
    res.json(fleets);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const grantLicense = async (req: any, res: any) => {
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
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteUser = async (req: any, res: any) => {
  try {
    const { id } = req.params;

    if (id === req.user.userId) {
      return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    if (user.role === 'SUPERADMIN') {
      return res.status(403).json({ error: 'No se puede eliminar un SuperAdmin' });
    }

    const photos = await repo.deleteUserCascade(id);

    // Borrado best-effort de las fotos en disco (incluyen documentos de identidad).
    const allowedPrefixes: { prefix: string; subfolder: string }[] = [
      { prefix: '/api/public/uploads/vehicles/', subfolder: 'vehicles' },
      { prefix: '/api/public/uploads/drivers/', subfolder: 'drivers' }
    ];

    let deletedFiles = 0;
    await Promise.all(photos.map(async (url: string) => {
      const match = allowedPrefixes.find(p => url.startsWith(p.prefix));
      if (!match) return;

      // basename evita path traversal.
      const filePath = path.join(UPLOADS_ROOT, match.subfolder, path.basename(url));
      try {
        await fs.promises.unlink(filePath);
        deletedFiles++;
      } catch (error: any) {
        if (error?.code !== 'ENOENT') {
          console.error('[superadmin] Error al eliminar archivo', { filePath, error: error?.message });
        }
      }
    }));

    console.log('[superadmin] Usuario eliminado', { by: req.user.userId, id, email: user.email });

    res.json({ success: true, deletedFiles });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};