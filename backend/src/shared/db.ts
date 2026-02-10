import * as PrismaModule from '@prisma/client';
import bcrypt from 'bcryptjs';

const { PrismaClient } = PrismaModule as any;

export const prisma = new PrismaClient();

export const runSeeders = async () => {
  console.log('--- STARTING DATABASE SEEDERS ---');

  try {
    const adminIdentifier = 'rmatheus';
    const existingAdmin = await prisma.user.findUnique({ where: { username: adminIdentifier } });

    if (!existingAdmin) {
      const hashedPassword = bcrypt.hashSync('Rmath327', 12);
      await prisma.user.create({
        data: {
          id: 'system-admin-001',
          username: adminIdentifier,
          email: 'admin@fleetmaster.pro',
          password: hashedPassword,
          role: 'SUPERADMIN',
          isConfirmed: true,
          createdAt: new Date()
        }
      });
      console.log(`✓ SuperAdmin created: ${adminIdentifier}`);
    }

    console.log('--- SEEDERS COMPLETED SUCCESSFULLY ---');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
  }
};