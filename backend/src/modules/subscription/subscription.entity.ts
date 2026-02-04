
export type SubscriptionStatus = 'active' | 'inactive';

export interface Subscription {
    id: string;
    userId: string | null;
    plan: string;
    price: number | null;
    startDate: string | null;
    dueDate: string | null;
    status: SubscriptionStatus;
    duration?: string;
}
