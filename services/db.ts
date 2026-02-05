import { Vehicle, Driver, Payment, Expense, Arrear, User, PaginatedResponse } from '../types';

const getApiBase = () => {
  try {
    const meta = import.meta as any;
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }
  } catch (e) {}
  return '/api';
};

const API_BASE = getApiBase();

export const formatDateDisplay = (dateStr: string) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleString('es-ES', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' });
};

const getAuth = () => {
  const auth = localStorage.getItem('fmp_auth');
  return auth ? JSON.parse(auth) : null;
};

const request = async <T>(url: string, method: string = 'GET', body?: any): Promise<T> => {
  const auth = getAuth();
  const token = auth?.token;

  const response = await fetch(`${API_BASE}${url}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : ''
    },
    body: body ? JSON.stringify(body) : undefined
  });

  let data: any = null;
  try { data = await response.json(); } catch {}
  if (!response.ok) throw { status: response.status, data };
  return data;
};

export const db = {
  init: () => {},
  login: (credentials: { identifier: string; password: string }) => request<any>('/auth/login', 'POST', credentials),
  register: (credentials: { email: string; username: string; password: string }) => request<any>('/auth/register', 'POST', credentials),
  confirm: (token: string) => request<any>(`/auth/confirm/${token}`, 'GET'),
  requestReset: (identifier: string) => request('/auth/request-reset', 'POST', { identifier }),
  resetPassword: (token: string, newPass: string) => request('/auth/reset-password', 'POST', { token, newPass }),

  getAdminStats: () => request<any>('/superadmin/stats'),
  getAdminUsers: () => request<User[]>('/superadmin/users'),

  getVehicles: (page = 1, limit = 100) => request<Vehicle[]>(`/vehicles?page=${page}&limit=${limit}`),
  saveVehicle: (v: Vehicle) => request('/vehicles', 'POST', v),
  getDrivers: (page = 1, limit = 100) => request<Driver[]>(`/drivers?page=${page}&limit=${limit}`),
  saveDriver: (d: Driver, isEdit: boolean) => isEdit ? request(`/drivers/${d.id}`, 'PUT', d) : request('/drivers', 'POST', d),
  deleteDriver: (id: string) => request(`/drivers/${id}`, 'DELETE'),

  getPayments: (params: { page?: number, limit?: number, startDate?: string, endDate?: string } = {}) => {
    const q = new URLSearchParams(params as any).toString();
    return request<PaginatedResponse<Payment>>(`/payments?${q}`);
  },

  savePayment: (p: Payment) => request('/payments', 'POST', p),
  payArrear: (arrearId: string, data: { amount: number; date: string }) => request(`/arrears/${arrearId}/pay`, 'POST', data),
  getPaymentsByDriver: (driverId: string) => request<Payment[]>(`/payments/driver/${driverId}`),

  getExpenses: (params: { page?: number, limit?: number, startDate?: string, endDate?: string } = {}) => {
    const q = new URLSearchParams(params as any).toString();
    return request<PaginatedResponse<Expense>>(`/expenses?${q}`);
  },

  saveExpense: (e: Expense) => request('/expenses', 'POST', e),
  getArrears: () => request<Arrear[]>('/arrears'),
  getArrearsByDriver: (driverId: string) => request<Arrear[]>(`/arrears/driver/${driverId}`),
  assignDriver: (driverId: string, vehicleId: string | null) => request('/assign', 'POST', { driverId, vehicleId })
};