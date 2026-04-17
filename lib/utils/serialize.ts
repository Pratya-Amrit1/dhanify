import { Prisma } from "@prisma/client";

export function serialize<T>(value: T): any {
  if (value === null || value === undefined) return value;

  if (value instanceof Prisma.Decimal) return value.toNumber();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "bigint") return Number(value);

  if (Array.isArray(value)) return value.map(serialize);

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, serialize(v)]),
    );
  }

  return value;
}
