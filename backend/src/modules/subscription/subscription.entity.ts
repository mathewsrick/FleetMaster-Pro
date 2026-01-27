export type SubscriptionStatus = 'active' | 'inactive';

export interface Subscription {
    id: string;
    userId: string | null;
    plan: string;
    startDate: Date | null;
    dueDate: Date | null;
    status: SubscriptionStatus;
}