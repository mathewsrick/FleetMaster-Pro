import { v4 as uuid } from 'uuid';
import * as repo from './driver.repository';

export const getAll = async (userId: string) => {
  return await repo.findAll(userId);
};

export const create = async (userId: string, data: any) => {
  const driver = {
    id: uuid(),
    userId,
    ...data
  };

  await repo.create(driver);
  return driver;
};

export const update = async (userId: string, id: string, data: any) => {
  await repo.update(userId, id, data);
};

export const remove = async (userId: string, id: string) => {
  await repo.unassignVehicles(userId, id);
  await repo.remove(userId, id);
};