import * as repo from './expense.repository';

export const getAll = (userId: string) => {
  return repo.findAll(userId);
};

export const updateOrCreate = (userId: string, data: any) => {
  const existing = repo.findById(data.id);

  const expense = {
    ...data,
    userId
  };

  if (existing) {
    repo.update(userId, expense);
  } else {
    repo.create(expense);
  }
};

export const remove = (userId: string, id: string) => {
  repo.remove(userId, id);
};
