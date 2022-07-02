// https://stackoverflow.com/a/66702014
export type ConcreteConstructor<T extends abstract new (...args: any) => any> = (T extends abstract new (...args: infer A) => infer R
    ? new (...args: A) => R
    : never) &
    T;

export const paymentStatuses = ['WAITING', 'CONFIRMING', 'CONFIRMED', 'SENDING', 'FINISHED', 'PARTIALLY_PAID', 'FAILED', 'EXPIRED'] as const;
export type PaymentStatusType = typeof paymentStatuses[number];
