export type PlanType = 'free_trial' | 'basico' | 'pro' | 'enterprise';
export type UserRole = 'USER' | 'SUPERADMIN';

export interface PlanLimits {
  maxVehicles: number;
  maxDrivers: number;
  hasExcelReports: boolean;
  hasCustomApi: boolean;
  maxHistoryDays: number | null; // null = ilimitado
  maxRangeDays: number | null;    // null = ilimitado
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  isConfirmed: boolean;
  lastActivity?: string;
}

export interface AccountStatus {
  accessLevel: 'FULL' | 'LIMITED' | 'BLOCKED';
  reason: 'ACTIVE_SUBSCRIPTION' | 'TRIAL' | 'TRIAL_EXPIRED' | 'UNCONFIRMED';
  plan: PlanType;
  daysRemaining: number;
  limits: PlanLimits;
  warning?: string | null;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  accountStatus?: AccountStatus | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface Vehicle {
  id: string;
  userId: string;
  year: number;
  licensePlate: string;
  model: string;
  color: string;
  purchaseDate: string;
  insurance: string;
  insuranceNumber: string;
  soatExpiration: string;
  techExpiration: string;
  canonValue: number;
  driverId: string | null;
}

export interface Driver {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone: string;
  idNumber: string;
  vehicleId: string | null;
}

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  date: string;
  driverId: string;
  vehicleId: string;
  type: 'canon' | 'arrear_payment';
  arrearId?: string | null;
  isPartial?: boolean;
}

export interface Expense {
  id: string;
  userId: string;
  description: string;
  amount: number;
  date: string;
  vehicleId: string;
}

export interface Arrear {
  id: string;
  userId: string;
  amountOwed: number;
  status: 'pending' | 'paid';
  driverId: string;
  vehicleId: string;
  dueDate: string;
  originPaymentId?: string;
}