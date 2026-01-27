
import { Vehicle, Driver, Payment, Expense, Arrear, AuthState } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Utilidad de Fecha DD-MM-YY
export const formatDateDisplay = (dateStr: string) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = String(d.getUTCFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
};

const getAuthToken = () => {
  const auth = localStorage.getItem('fmp_auth');
  if (!auth) return null;
  const { token } = JSON.parse(auth);
  return token;
};

const request = async <T>(url: string, method: string = 'GET', body?: any): Promise<T> => {
  const token = getAuthToken();
  try {
    const response = await fetch(`${API_BASE}${url}`, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    
    if (response.status === 401) {
      localStorage.removeItem('fmp_auth');
      window.location.reload();
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || 'API request failed');
    }

    return method === 'DELETE' ? {} as T : await response.json();
  } catch (error) {
    console.error(`API Error on ${url}:`, error);
    throw error;
  }
};

export const db = {
  init: () => {}, // No op en cliente
  
  // Auth
  login: (credentials: any) => request<any>('/auth/login', 'POST', credentials),
  register: (credentials: any) => request<any>('/auth/register', 'POST', credentials),

  // Vehicles
  getVehicles: () => request<Vehicle[]>('/vehicles'),
  saveVehicle: (v: Vehicle) => request('/vehicles', 'POST', v),
  deleteVehicle: (id: string) => request(`/vehicles/${id}`, 'DELETE'),

  // Drivers
  getDrivers: () => request<Driver[]>('/drivers'),
  saveDriver: (d: Driver, isEdit: boolean) =>
    isEdit
      ? request(`/drivers/${d.id}`, 'PUT', d)
      : request('/drivers', 'POST', d),

  deleteDriver: (id: string) =>
    request(`/drivers/${id}`, 'DELETE'),

  // Payments
  getPayments: () => request<Payment[]>('/payments'),
  savePayment: (p: Payment) => request('/payments', 'POST', p),
  payArrear: (arrearId: string, data: { amount: number; date: string }) => request(`/arrears/${arrearId}/pay`, 'POST', data),
  deletePayment: (id: string) => request(`/payments/${id}`, 'DELETE'),
  getPaymentsByDriver: (driverId: string) => request<Payment[]>(`/payments/driver/${driverId}`),

  // Expenses
  getExpenses: () => request<Expense[]>('/expenses'),
  saveExpense: (e: Expense) => request('/expenses', 'POST', e),
  deleteExpense: (id: string) => request(`/expenses/${id}`, 'DELETE'),

  // Arrears
  getArrears: () => request<Arrear[]>('/arrears'),
  getArrearsByDriver: (driverId: string) => request<Arrear[]>(`/arrears/driver/${driverId}`),

  // Utilities
  assignDriver: (driverId: string, vehicleId: string | null) => request('/assign', 'POST', { driverId, vehicleId })
};
