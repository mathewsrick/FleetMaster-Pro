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