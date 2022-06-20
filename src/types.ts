import { TLiteral, TUnion } from '@sinclair/typebox';

export type PaymentStatus = "WAITING" | "CONFIRMING" | "CONFIRMED" | "SENDING" | "FINISHED" | "PARTIALLY_PAID" | "FAILED" | "EXPIRED";

type IntoStringUnion<T> = { [K in keyof T]: T[K] extends string ? TLiteral<T[K]> : never }

export function StringUnion<T extends string[]>(values: [...T]): TUnion<IntoStringUnion<T>> {
    return { enum: values } as any
}