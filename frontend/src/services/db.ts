import { Vehicle, Driver, Payment, Expense, Arrear, User, PaginatedResponse } from '@/types/types';

const getApiBase = () => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL + '/api';
    }
  } catch (e) {}
  return '/api';
};

const API_BASE = getApiBase();

// Convertir fecha de dd/mm/yyyy a yyyy-mm-dd (ISO format para backend)
export const formatDateToISO = (dateStr: string): string => {
  if (!dateStr) return '';
  // Si ya está en formato ISO (yyyy-mm-dd), retornar tal cual
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  
  // Si está en formato dd/mm/yyyy, convertir a ISO
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return dateStr;
};

// Convertir fecha de yyyy-mm-dd (ISO) a dd/mm/yyyy para mostrar
export const formatDateToDisplay = (dateStr: string): string => {
  if (!dateStr) return '';
  
  // Si está en formato ISO (yyyy-mm-dd), parsear directamente sin timezone
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }
  
  // Fallback para otros formatos
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}/${month}/${year}`;
};

// Obtener fecha actual en formato dd/mm/yyyy
export const getTodayDateDisplay = (): string => {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = today.getFullYear();
  return `${day}/${month}/${year}`;
};

// Formato para mostrar en reportes (incluye hora)
export const formatDateDisplay = (dateStr: string) => {
  if (!dateStr) return 'N/A';
  
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  
  // Usar UTC para evitar problemas de timezone con la fecha
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();
  const hour = String(d.getUTCHours()).padStart(2, '0');
  const minute = String(d.getUTCMinutes()).padStart(2, '0');
  
  return `${day}/${month}/${year} ${hour}:${minute}`;
};

const getAuth = () => {
  const auth = localStorage.getItem('fmp_auth');
  return auth ? JSON.parse(auth) : null;
};

const request = async <T>(url: string, method: string = 'GET', body?: any): Promise<T> => {
  const auth = getAuth();
  const token = auth?.token;

  const isFormData = body instanceof FormData;

  const response = await fetch(`${API_BASE}${url}`, {
    method,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      Authorization: token ? `Bearer ${token}` : ''
    },
    body: isFormData ? body : (body ? JSON.stringify(body) : undefined)
  });

  let data: any = null;
  try { data = await response.json(); } catch {}
  if (!response.ok) throw { status: response.status, data };
  return data;
};

export const db = {
  init: () => {},
  login: (credentials: { identifier: string; password: string }) => request<any>('/auth/login', 'POST', credentials),
  refreshAuth: async () => {
    const data = await request<any>('/auth/refresh', 'GET');
    const newState = { isAuthenticated: true, user: data.user, token: data.token, accountStatus: data.accountStatus };
    localStorage.setItem('fmp_auth', JSON.stringify(newState));
    return newState;
  },
  register: (credentials: { email: string; username: string; password: string }) => request<any>('/auth/register', 'POST', credentials),
  confirm: (token: string) => request<any>(`/auth/confirm/${token}`, 'GET'),
  requestReset: (identifier: string) => request('/auth/request-reset', 'POST', { identifier }),
  resetPassword: (token: string, newPass: string) => request('/auth/reset-password', 'POST', { token, newPass }),
  
  // Wompi Payment
  initWompiPayment: (plan: string, duration: string) => request<any>('/wompi/initialize', 'POST', { plan, duration }),
  checkWompiStatus: (id: string) => request<any>(`/wompi/verify/${id}`, 'GET'),
  
  purchasePlan: (plan: string, duration: 'monthly' | 'semiannual' | 'yearly') => request<any>('/subscription/purchase', 'POST', { plan, duration }),

  submitContactForm: (data: { name: string; email: string; message: string }) => request('/contact', 'POST', data),

  uploadVehiclePhotos: (files: File[]) => {
    const formData = new FormData();
    files.forEach(file => formData.append('photos', file));
    return request<{ urls: string[] }>('/uploads/vehicles', 'POST', formData);
  },
  uploadDriverDocument: (file: File) => {
    const formData = new FormData();
    formData.append('document', file);
    return request<{ url: string }>('/uploads/drivers', 'POST', formData);
  },

  getAdminStats: () => request<any>('/superadmin/stats'),
  getAdminUsers: (search?: string) => request<User[]>(`/superadmin/users${search ? `?search=${encodeURIComponent(search)}` : ''}`),

  getVehicles: (page = 1, limit = 100) => request<PaginatedResponse<Vehicle>>(`/vehicles?page=${page}&limit=${limit}`),
  saveVehicle: (v: Vehicle) => request('/vehicles', 'POST', v),
  deleteVehicle: (id: string) => request(`/vehicles/${id}`, 'DELETE'),
  getDrivers: (page = 1, limit = 100) => request<PaginatedResponse<Driver>>(`/drivers?page=${page}&limit=${limit}`),
  saveDriver: (d: Driver, isEdit: boolean) => isEdit ? request(`/drivers/${d.id}`, 'PUT', d) : request('/drivers', 'POST', d),
  deleteDriver: (id: string) => request(`/drivers/${id}`, 'DELETE'),
  
  getPayments: (params: { page?: number, limit?: number, startDate?: string, endDate?: string, search?: string } = {}) => {
    const q = new URLSearchParams(params as any).toString();
    return request<PaginatedResponse<Payment>>(`/payments?${q}`);
  },
  
  savePayment: (p: Payment) => request('/payments', 'POST', p),
  deletePayment: (id: string) => request(`/payments/${id}`, 'DELETE'),
  payArrear: (arrearId: string, data: { amount: number; date: string }) => request(`/arrears/${arrearId}/pay`, 'POST', data),
  getPaymentsByDriver: (driverId: string) => request<Payment[]>(`/payments/driver/${driverId}`),
  
  getExpenses: (params: { page?: number, limit?: number, startDate?: string, endDate?: string, search?: string } = {}) => {
    const q = new URLSearchParams(params as any).toString();
    return request<PaginatedResponse<Expense>>(`/expenses?${q}`);
  },
  
  saveExpense: (e: Expense) => request('/expenses', 'POST', e),
  deleteExpense: (id: string) => request(`/expenses/${id}`, 'DELETE'),
  getArrears: () => request<Arrear[]>('/arrears'),
  getArrearsByDriver: (driverId: string) => request<Arrear[]>(`/arrears/driver/${driverId}`),
  assignDriver: (driverId: string, vehicleId: string | null) => request('/assign', 'POST', { driverId, vehicleId })
};