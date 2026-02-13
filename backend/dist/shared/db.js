import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
export const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
export const runSeeders = async () => {
    console.log('--- STARTING DATABASE SEEDERS ---');
    try {
        // 🔒 Seguridad: Solo crear superadmin si se especifica en variables de entorno
        // Para crear el primer superadmin en producción, ejecutar manualmente o usar script
        const shouldCreateAdmin = process.env.CREATE_SUPERADMIN === 'true';
        const adminUsername = process.env.ADMIN_USERNAME;
        const adminPassword = process.env.ADMIN_PASSWORD;
        const adminEmail = process.env.ADMIN_EMAIL;
        if (shouldCreateAdmin && adminUsername && adminPassword && adminEmail) {
            const existingAdmin = await prisma.user.findUnique({
                where: { username: adminUsername }
            });
            if (!existingAdmin) {
                const hashedPassword = bcrypt.hashSync(adminPassword, 12);
                await prisma.user.create({
                    data: {
                        id: 'system-admin-001',
                        username: adminUsername,
                        email: adminEmail,
                        password: hashedPassword,
                        role: 'SUPERADMIN',
                        isConfirmed: true,
                        createdAt: new Date()
                    }
                });
                console.log(`✓ SuperAdmin created: ${adminUsername}`);
            }
        }
        else {
            console.log('ℹ️  No superadmin creation requested (set CREATE_SUPERADMIN=true in .env)');
        }
        console.log('--- SEEDERS COMPLETED SUCCESSFULLY ---');
    }
    catch (error) {
        console.error('❌ Error during seeding:', error);
    }
};
//# sourceMappingURL=db.js.map