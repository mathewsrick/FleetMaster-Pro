export type SubscriptionStatus = 'active' | 'inactive' | 'expired';

export interface Subscription {
    id: string;
    userId: string | null;
    plan: string;
    price: number | null;
    months: number;
    startDate: string | null;
    dueDate: string | null;
    status: SubscriptionStatus;
    duration?: string;
}