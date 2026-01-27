export type SubscriptionStatus = 'active' | 'inactive';

export interface Subscription {
    id: string;
    userId: string | null;
    plan: string;
    price: number | null;
    startDate: Date | null;
    dueDate: Date | null;
    status: SubscriptionStatus;
}