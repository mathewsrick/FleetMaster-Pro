export type PaymentType = 'canon' | 'arrear_payment' | 'other';

export interface Payment {
    id: string;
    userId: string;
    amount: number;
    date: Date;
    driverId?: string;
    vehicleId?: string;
    type: PaymentType;
    arrearId?: string;
}