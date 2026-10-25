import { prisma } from '../../shared/db.js';

export const getSaaSStats = async () => {
  const [totalUsers, activeSubs, totalVehicles, mrr] = await Promise.all([
    prisma.user.count({ where: { role: 'USER' } }),
    prisma.subscriptionKey.count({ where: { status: 'active' } }),
    prisma.vehicle.count(),
    prisma.subscriptionKey.aggregate({
      where: { status: 'active' },
      _sum: { price: true }
    })
  ]);

  return { 
    totalUsers, 
    activeSubs, 
    mrr: Number(mrr._sum.price || 0), 
    totalVehicles 
  };
};

export const deleteUserCascade = async (userId: string): Promise<string[]> => {
  return prisma.$transaction(async (tx: any) => {
    const drivers = await tx.driver.findMany({
      where: { userId },
      select: { licensePhoto: true, idPhoto: true }
    });
    const vehicles = await tx.vehicle.findMany({
      where: { userId },
      select: { photos: true }
    });

    await tx.subscriptionKey.deleteMany({ where: { userId } });
    await tx.user.delete({ where: { id: userId } });

    const photos: string[] = [];
    for (const driver of drivers) {
      if (driver.licensePhoto) photos.push(driver.licensePhoto);
      if (driver.idPhoto) photos.push(driver.idPhoto);
    }
    for (const vehicle of vehicles) {
      for (const photo of vehicle.photos || []) {
        if (photo) photos.push(photo);
      }
    }

    return photos;
  });
};

export const findAllFleets = async (filter: string) => {
  const where: any = { role: 'USER' };
  if (filter) {
    where.OR = [
      { username: { contains: filter, mode: 'insensitive' } },
      { email: { contains: filter, mode: 'insensitive' } }
    ];
  }

  const fleets = await prisma.user.findMany({
    where,
    include: {
      subscriptions: { where: { status: 'active' }, take: 1, orderBy: { dueDate: 'desc' } },
      _count: { select: { vehicles: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  return fleets.map((f: typeof fleets[number]) => ({
    id: f.id,
    username: f.username,
    email: f.email,
    isConfirmed: f.isConfirmed,
    lastActivity: f.lastActivity,
    createdAt: f.createdAt,
    plan: f.subscriptions[0]?.plan || 'free_trial',
    dueDate: f.subscriptions[0]?.dueDate || null,
    vehicleCount: f._count.vehicles
  }));
};