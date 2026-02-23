import * as repo from './expense.repository.js';

const PLAN_RESTRICTIONS: any = {
  free_trial: { maxHistoryDays: 30, maxRangeDays: null },
  basico: { maxHistoryDays: 30, maxRangeDays: null },
  pro: { maxHistoryDays: null, maxRangeDays: 90 },
  enterprise: { maxHistoryDays: null, maxRangeDays: null }
};

export const getAll = async (userId: string, query: any, plan: string) => {
  const page = parseInt(query.page) || 1;
  const limit = Math.min(parseInt(query.limit) || 10, 100); // 🔒 Límite máximo de 100
  let startDate = query.startDate;
  let endDate = query.endDate;
  const vehicleId = query.vehicleId || '';
  const type = query.type || '';
  // 🔒 Sanitizar búsqueda (max 100 caracteres, remover caracteres especiales)
  const search = query.search 
    ? String(query.search).trim().slice(0, 100).replace(/[<>]/g, '')
    : '';

  const restriction = PLAN_RESTRICTIONS[plan] || PLAN_RESTRICTIONS.free_trial;

  if (restriction.maxHistoryDays) {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() - restriction.maxHistoryDays);
    const minDateStr = minDate.toISOString().split('T')[0];
    if (!startDate || startDate < minDateStr) startDate = minDateStr;
  }

  if (restriction.maxRangeDays && startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
    if (diffDays > restriction.maxRangeDays) {
      throw new Error(`Su plan Pro permite un rango máximo de ${restriction.maxRangeDays} días de búsqueda.`);
    }
  }

  const result = await repo.findAll(userId, { page, limit, startDate, endDate, search, vehicleId, type });
  return { ...result, page, limit };
};

export const updateOrCreate = async (userId: string, data: any) => {
  const existing = await repo.findById(data.id);
  const expense = { ...data, userId };
  if (existing) {
    await repo.update(userId, expense);
  } else {
    await repo.create(expense);
  }
};

export const remove = async (userId: string, id: string) => {
  await repo.remove(userId, id);
};