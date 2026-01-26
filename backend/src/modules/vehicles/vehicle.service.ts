import * as repo from './vehicle.repository';

export const getAll = (userId: string) => {
  return repo.findAll(userId);
};

export const save = (userId: string, data: any) => {
  const existing = repo.findById(data.id);

  const vehicle = {
    ...data,
    userId
  };

  if (existing) {
    repo.update(userId, vehicle);
  } else {
    repo.create(vehicle);
  }
};

export const remove = (userId: string, id: string) => {
  repo.remove(userId, id);
};