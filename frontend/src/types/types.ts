export type PlanType = 'free_trial' | 'basico' | 'pro' | 'enterprise';
export type UserRole = 'USER' | 'SUPERADMIN';

export interface PlanLimits {
  maxVehicles: number;
  maxDrivers: number;
  hasExcelReports: boolean;
  hasCustomApi: boolean;
  maxHistoryDays: number | null;
  maxRangeDays: number | null;
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
  hasFullCoverage?: boolean; // 🆕 Tiene seguro todo riesgo
  fullCoverageExpiration?: string; // 🆕 Vencimiento seguro todo riesgo
  rentaValue: number;
  driverId: string | null;
  driverName?: string; 
  photos?: string[];
}

export type VehiclePayload = {
  id: string
  year: number
  licensePlate: string
  model: string
  color: string
  purchaseDate?: string | null
  insurance?: string | null
  insuranceNumber?: string | null
  soatExpiration?: string | null
  techExpiration?: string | null
  hasFullCoverage?: boolean | null // 🆕 Seguro todo riesgo
  fullCoverageExpiration?: string | null // 🆕 Vencimiento seguro todo riesgo
  rentaValue: number
  driverId?: string | null
  photos: string[]
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
  licenseExpiration?: string; // 🆕 Vencimiento de licencia de conducción
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
  generateArrear?: boolean; // 🔑 Flag para generar mora en pagos parciales
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