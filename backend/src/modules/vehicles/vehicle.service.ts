import * as repo from './vehicle.repository';

export const getAll = async (userId: string) => {
  return await repo.findAll(userId);
};

export const save = async (userId: string, data: any) => {
  const existing = await repo.findById(data.id);

  const vehicle = {
    ...data,
    userId
  };

  if (existing) {
    await repo.update(userId, vehicle);
  } else {
    await repo.create(vehicle);
  }
};

export const remove = async (userId: string, id: string) => {
  await repo.remove(userId, id);
};