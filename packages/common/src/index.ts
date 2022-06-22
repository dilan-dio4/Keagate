export * from './fetch';
export * from './currencies';

export const paymentStatuses = ["WAITING", "CONFIRMING", "CONFIRMED", "SENDING", "FINISHED", "PARTIALLY_PAID", "FAILED", "EXPIRED"] as const;
export type PaymentStatusType = typeof paymentStatuses[number];