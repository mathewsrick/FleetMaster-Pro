export type PlanType = 'free_trial' | 'basico' | 'pro' | 'enterprise' | 'custom';
export type UserRole = 'SUPERADMIN' | 'SUPPORT' | 'ADMIN_FLOTA';

export interface PlanLimits {
  maxVehicles: number;
  maxDrivers: number;
  hasExcelReports: boolean;
  hasCustomApi: boolean;
  maxHistoryDays: number | null;
  maxRangeDays: number | null;
}

export interface SystemFeature {
  key: string;
  name: string;
  description: string;
  category: string;
}

export interface SystemPlan {
  id: string;
  name: string;
  key: PlanType;
  priceMonthly: number;
  priceYearly: number;
  trialDays: number;
  isActive: boolean;
  limits: PlanLimits;
  features: string[]; // Keys of enabled features
}

export interface GlobalBanner {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  isActive: boolean;
  startDate: string;
  endDate: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  username: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  createdAt: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  isConfirmed: boolean;
  lastActivity?: string;
  createdAt?: string;
  isBlocked?: boolean;
}

export interface AccountStatus {
  accessLevel: 'FULL' | 'LIMITED' | 'BLOCKED';
  reason: 'ACTIVE_SUBSCRIPTION' | 'TRIAL' | 'TRIAL_EXPIRED' | 'UNCONFIRMED' | 'ADMIN_BLOCKED';
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
  rentaValue: number;
  driverId: string | null;
  driverName?: string; 
  photos?: string[];
}

export interface Driver {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  idNumber: string;
  vehicleId: string | null;
  vehiclePlate?: string; 
  licensePhoto?: string; 
  idPhoto?: string;
  totalDebt?: number; 
}

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  date: string;
  driverId: string;
  vehicleId: string;
  type: 'renta' | 'arrear_payment';
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