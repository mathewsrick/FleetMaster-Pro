import { prisma } from '../src/shared/db';

async function HardReset() {
  console.log('⚠️  VERIFICANDO ENTORNO...\n');

  const dbUrl = process.env.DATABASE_URL || '';
  const nodeEnv = process.env.NODE_ENV;

  // 🔒 1️⃣ Solo permitir en desarrollo
//   if (nodeEnv !== 'development') {
//     throw new Error('❌ Este script SOLO puede ejecutarse en NODE_ENV=development');
//   }

  // 🔒 2️⃣ Solo permitir localhost
  if (!dbUrl.includes('localhost') && !dbUrl.includes('127.0.0.1')) {
    throw new Error('❌ Este script SOLO puede ejecutarse contra base de datos LOCAL');
  }

  console.log('✅ Entorno válido');
  console.log('📦 DATABASE_URL:', dbUrl);
  console.log('\n🧹 Iniciando limpieza controlada...\n');

  try {
    // Usuarios que se conservarán
    const usersToKeep = await prisma.user.findMany({
      where: {
        OR: [
          { role: 'SUPERADMIN' },
          { username: 'admin' } // ajusta si tu admin es otro
        ]
      },
      select: { id: true }
    });

    const keepIds = usersToKeep.map(u => u.id);

    console.log('👤 Usuarios preservados:', keepIds);

    // Borrado en orden correcto
    await prisma.payment.deleteMany();

    await prisma.expense.deleteMany();

    await prisma.arrear.deleteMany();

    await prisma.vehicle.deleteMany();

    await prisma.driver.deleteMany();

    await prisma.subscriptionKey.deleteMany();

    await prisma.licenseOverride.deleteMany();

    await prisma.transaction.deleteMany();

    console.log('\n✅ Limpieza completada correctamente.');
  } catch (error) {
    console.error('❌ Error durante reset:', error);
  } finally {
    await prisma.$disconnect();
  }
}

HardReset();