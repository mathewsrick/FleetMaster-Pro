import { v4 as uuid } from 'uuid';
import * as repo from './driver.repository';

export const getAll = (userId: string) => {
  return repo.findAll(userId);
};

export const create = (userId: string, data: any) => {
  const driver = {
    id: uuid(),
    userId,
    ...data
  };

  repo.create(driver);
  return driver;
};

export const update = (userId: string, id: string, data: any) => {
  repo.update(userId, id, data);
};

export const remove = (userId: string, id: string) => {
  repo.unassignVehicles(userId, id);
  repo.remove(userId, id);
};