import { Prisma } from "@prisma/client";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfYear,
  endOfYear,
  subMonths,
  subWeeks,
  subYears,
} from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { clerkClient } from "@clerk/nextjs/server";

/* ----------------------------------------
   Constants
----------------------------------------- */
export const DEFAULT_TIMEZONE = "UTC";
const WEEK_START = 1; // Monday

/* ----------------------------------------
   Decimal helper
----------------------------------------- */
export function decimalToNumber(
  value: Prisma.Decimal | number | null | undefined,
) {
  if (value instanceof Prisma.Decimal) {
    return Number(value.toString());
  }
  return value ?? 0;
}

/* ----------------------------------------
   Timezone resolution (Clerk-safe)
----------------------------------------- */
export async function resolveUserTimezone(
  clerkUserId?: string | null,
): Promise<string> {
  if (!clerkUserId) return DEFAULT_TIMEZONE;

  try {
    const client = await clerkClient();
    const user = await client.users.getUser(clerkUserId);

    return (
      getTimezoneFromMetadata(user.publicMetadata) ??
      getTimezoneFromMetadata(user.privateMetadata) ??
      getTimezoneFromMetadata(user.unsafeMetadata) ??
      DEFAULT_TIMEZONE
    );
  } catch (error) {
    console.warn("⚠️ Failed to resolve timezone", error);
    return DEFAULT_TIMEZONE;
  }
}

function getTimezoneFromMetadata(
  metadata?: Record<string, unknown>,
): string | undefined {
  const tz = metadata?.timezone;
  return typeof tz === "string" && tz.length > 0 ? tz : undefined;
}

/* ----------------------------------------
   Date range helpers
----------------------------------------- */
export function resolvePresetRange({
  timeframe,
  timezone,
}: {
  timeframe:
    | "THIS_WEEK"
    | "THIS_MONTH"
    | "THIS_YEAR"
    | "LAST_WEEK"
    | "LAST_MONTH"
    | "LAST_YEAR";
  timezone: string;
}) {
  const now = toZonedTime(new Date(), timezone);
  let start: Date;
  let end: Date;

  switch (timeframe) {
    case "THIS_WEEK":
      start = startOfWeek(now, { weekStartsOn: WEEK_START });
      end = endOfWeek(now, { weekStartsOn: WEEK_START });
      break;

    case "THIS_MONTH":
      start = startOfMonth(now);
      end = endOfMonth(now);
      break;

    case "THIS_YEAR":
      start = startOfYear(now);
      end = endOfYear(now);
      break;

    case "LAST_WEEK":
      end = now;
      start = subWeeks(end, 1);
      break;

    case "LAST_MONTH":
      start = startOfMonth(subMonths(now, 1));
      end = endOfMonth(subMonths(now, 1));
      break;

    case "LAST_YEAR":
      end = now;
      start = subYears(end, 1);
      break;

    default:
      throw new Error("Unsupported timeframe");
  }

  return {
    start: toZonedTime(start, timezone),
    end: toZonedTime(end, timezone),
  };
}

export function resolveCustomRange({
  startDate,
  endDate,
  timezone,
}: {
  startDate?: string;
  endDate?: string;
  timezone: string;
}) {
  if (!startDate || !endDate) {
    throw new Error("CUSTOM timeframe requires startDate and endDate");
  }

  const start = toZonedTime(new Date(startDate), timezone);
  const end = toZonedTime(new Date(endDate), timezone);

  if (start > end) {
    throw new Error("startDate cannot be after endDate");
  }

  return { start, end };
}
