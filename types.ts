
export interface User {
  id: string;
  username: string;
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

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

