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
  fullCoverageInsurer?: string; // 🆕 Aseguradora del seguro todo riesgo
  fullCoverageEmergencyNumber?: string; // 🆕 Número de emergencia del seguro
  rentaValue: number;
  driver?: {
    id: string;
    name: string;
  };
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
  fullCoverageInsurer?: string | null // 🆕 Aseguradora del seguro todo riesgo
  fullCoverageEmergencyNumber?: string | null // 🆕 Número de emergencia
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

export type ExpenseType = 'reparacion' | 'repuesto' | 'combustible' | 'mantenimiento' | 'seguro' | 'impuesto' | 'multa' | 'lavado' | 'otro';

export type ExpenseComponent =
  | 'motor'
  | 'frenos'
  | 'suspension'
  | 'llantas'
  | 'embrague_transmision'
  | 'electrico_bateria'
  | 'aceite_filtros'
  | 'refrigeracion'
  | 'direccion'
  | 'carroceria'
  | 'vidrios_luces'
  | 'otro';

export interface Expense {
  id: string;
  userId: string;
  description?: string;
  amount: number;
  date: string;
  vehicleId: string;
  type: ExpenseType;
  component?: ExpenseComponent | null; // 🆕 Componente afectado (mantenimientos)
  mileage?: number; // 🆕 Kilometraje opcional para rastrear mantenimientos
}

/** Tipos de gasto que exigen clasificar el componente afectado. */
export const EXPENSE_COMPONENT_TYPES: ExpenseType[] = ['reparacion', 'repuesto', 'mantenimiento'];

export const EXPENSE_COMPONENT_OPTIONS: Array<{ value: ExpenseComponent; label: string; icon: string }> = [
  { value: 'motor', label: 'Motor', icon: 'fa-gears' },
  { value: 'frenos', label: 'Frenos', icon: 'fa-circle-stop' },
  { value: 'suspension', label: 'Suspensión', icon: 'fa-arrows-up-down' },
  { value: 'llantas', label: 'Llantas', icon: 'fa-circle-notch' },
  { value: 'embrague_transmision', label: 'Embrague / Transmisión', icon: 'fa-gear' },
  { value: 'electrico_bateria', label: 'Eléctrico / Batería', icon: 'fa-bolt' },
  { value: 'aceite_filtros', label: 'Aceite / Filtros', icon: 'fa-oil-can' },
  { value: 'refrigeracion', label: 'Refrigeración', icon: 'fa-temperature-low' },
  { value: 'direccion', label: 'Dirección', icon: 'fa-compass' },
  { value: 'carroceria', label: 'Carrocería', icon: 'fa-car-side' },
  { value: 'vidrios_luces', label: 'Vidrios / Luces', icon: 'fa-lightbulb' },
  { value: 'otro', label: 'Otro', icon: 'fa-box' },
];

export const expenseComponentLabel = (component?: string | null): string =>
  EXPENSE_COMPONENT_OPTIONS.find((option) => option.value === component)?.label || 'Sin componente';

export interface Arrear {
  id: string;
  userId: string;
  amountOwed: number;
  status: 'pending' | 'paid';
  driverId: string;
  vehicleId: string;
  dueDate: string;
  originPaymentId?: string;
  description?: string; // 🆕 Descripción opcional de la mora
}

/* ------------------------------------------------------------------ */
/* Reportes analíticos (/api/reports)                                 */
/* ------------------------------------------------------------------ */

export interface ReportRangeParams {
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
}

export interface ReportRangeInfo {
  startDate: string;
  endDate: string;
  start: string;
  endExclusive: string;
  label: string;
  month?: string;
}

export interface ReportWeekRange {
  startDate: string;
  endDate: string;
}

export interface ReportAmountByType {
  type: string;
  amount: number;
}

export interface FleetSummaryReport {
  range: ReportRangeInfo;
  weeks: number;
  income: {
    total: number;
    renta: number;
    abonos: number;
    other: number;
  };
  expenses: {
    total: number;
    byType: ReportAmountByType[];
  };
  net: number;
  marginPct: number;
  expectedRent: number;
  collectionRatePct: number;
  pendingDebt: number;
  vehicles: {
    total: number;
    assigned: number;
    idle: number;
  };
}

export interface VehicleProfitabilityRow {
  vehicleId: string;
  licensePlate: string;
  model: string;
  year: number;
  driverName: string | null;
  rentaValue: number;
  income: {
    total: number;
    renta: number;
    abonos: number;
    other: number;
  };
  expenses: {
    total: number;
    byType: ReportAmountByType[];
  };
  net: number;
  marginPct: number;
  km: number;
  costPerKm: number | null;
  assignedWeeks: number;
  idleWeeks: number;
  netNegative: boolean;
  rankByExpense: number;
  rankByNet: number;
}

export interface VehicleProfitabilityReport {
  range: ReportRangeInfo;
  weeks: ReportWeekRange[];
  vehicles: VehicleProfitabilityRow[];
}

export type DriverWeekStatus = 'completa' | 'parcial' | 'sin_pago';

export interface DriverWeekDetail {
  weekStart: string;
  weekEnd: string;
  expected: number;
  paid: number;
  balance: number;
  status: DriverWeekStatus;
}

export interface DriverBehaviorRow {
  driverId: string;
  driverName: string;
  active: boolean;
  vehiclePlates: string[];
  expected: number;
  rentaPaid: number;
  compliancePct: number;
  weeks: {
    total: number;
    full: number;
    partial: number;
    unpaid: number;
  };
  arrearPayments: {
    amount: number;
    count: number;
  };
  arrearsGenerated: number;
  arrearsRecordedInPeriod: number;
  arrearsRecordedCount: number;
  debtPaid: number;
  currentPendingDebt: number;
  unpaidStreak: number;
  score: number;
  label: string;
  weekDetails: DriverWeekDetail[];
}

export interface DriverBehaviorReport {
  range: ReportRangeInfo;
  weeks: ReportWeekRange[];
  drivers: DriverBehaviorRow[];
}

export interface MaintenanceComponentStat {
  component: string;
  count: number;
  amount: number;
}

export interface MaintenanceDescriptionStat {
  description: string;
  count: number;
  amount: number;
}

export interface MaintenanceRepeatedComponent {
  component: string;
  count: number;
  daysBetween: number;
  kmBetween: number | null;
  firstDate: string;
  lastDate: string;
  amount: number;
}

export interface MaintenanceVehicleRow {
  vehicleId: string;
  licensePlate: string;
  repairCount: number;
  expenseCount: number;
  totalSpend: number;
  spendByComponent: MaintenanceComponentStat[];
  repeatedComponents: MaintenanceRepeatedComponent[];
}

export interface MaintenanceDriverRow {
  driverId: string;
  driverName: string;
  weeksAssigned: number;
  km: number;
  expenseCount: number;
  totalSpend: number;
  spendPerWeek: number | null;
  spendPerKm: number | null;
  wearIndex: number | null;
  wearLabel: string;
}

export interface MaintenanceReport {
  range: ReportRangeInfo;
  fleet: {
    totalSpend: number;
    expenseCount: number;
    assignedWeeks: number;
    km: number;
    spendPerWeek: number | null;
    spendPerKm: number | null;
    topComponents: MaintenanceComponentStat[];
    topDescriptions: MaintenanceDescriptionStat[];
  };
  vehicles: MaintenanceVehicleRow[];
  drivers: MaintenanceDriverRow[];
}