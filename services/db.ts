
import { Vehicle, Driver, Payment, Expense, Arrear } from '../types';

const getApiBase = () => {
  try {
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
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = String(d.getUTCFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
};

const getAuth = () => {
  const auth = localStorage.getItem('fmp_auth');
  return auth ? JSON.parse(auth) : null;
};

const request = async <T>(
  url: string,
  method: string = 'GET',
  body?: any
): Promise<T> => {
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
  try {
    data = await response.json();
  } catch {}

  if (!response.ok) {
    throw { status: response.status, data };
  }

  return data;
};

export const db = {
  init: () => {},
  login: (credentials: any) => request<any>('/auth/login', 'POST', credentials),
  register: (credentials: any) => request<any>('/auth/register', 'POST', credentials),
  getVehicles: () => request<Vehicle[]>('/vehicles'),
  saveVehicle: (v: Vehicle) => request('/vehicles', 'POST', v),
  deleteVehicle: (id: string) => request(`/vehicles/${id}`, 'DELETE'),
  getDrivers: () => request<Driver[]>('/drivers'),
  saveDriver: (d: Driver, isEdit: boolean) =>
    isEdit ? request(`/drivers/${d.id}`, 'PUT', d) : request('/drivers', 'POST', d),
  deleteDriver: (id: string) => request(`/drivers/${id}`, 'DELETE'),
  getPayments: () => request<Payment[]>('/payments'),
  savePayment: (p: Payment) => request('/payments', 'POST', p),
  payArrear: (arrearId: string, data: { amount: number; date: string }) => request(`/arrears/${arrearId}/pay`, 'POST', data),
  getPaymentsByDriver: (driverId: string) => request<Payment[]>(`/payments/driver/${driverId}`),
  getExpenses: () => request<Expense[]>('/expenses'),
  saveExpense: (e: Expense) => request('/expenses', 'POST', e),
  deleteExpense: (id: string) => request(`/expenses/${id}`, 'DELETE'),
  getArrears: () => request<Arrear[]>('/arrears'),
  getArrearsByDriver: (driverId: string) => request<Arrear[]>(`/arrears/driver/${driverId}`),
  assignDriver: (driverId: string, vehicleId: string | null) => request('/assign', 'POST', { driverId, vehicleId })
};
