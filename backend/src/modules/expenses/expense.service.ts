import * as repo from './expense.repository';

export const getAll = async (userId: string) => {
  return await repo.findAll(userId);
};

export const updateOrCreate = async (userId: string, data: any) => {
  const existing = await repo.findById(data.id);

  const expense = {
    ...data,
    userId
  };

  if (existing) {
    await repo.update(userId, expense);
  } else {
    await repo.create(expense);
  }
};

export const remove = async (userId: string, id: string) => {
  await repo.remove(userId, id);
};
