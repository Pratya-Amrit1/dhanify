import {
  endOfMonth,
  endOfWeek,
  endOfYear,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";
import { toZonedTime } from "date-fns-tz";

export enum KpiTimeRange {
  THIS_WEEK = "THIS_WEEK",
  THIS_MONTH = "THIS_MONTH",
  THIS_YEAR = "THIS_YEAR",
  ALL_TIME = "ALL_TIME",
}

const DEFAULT_TIMEZONE = "UTC";
const WEEK_START = 1; // Monday

export function getKpiDateRange(
  timeRange: KpiTimeRange,
  timezone: string = DEFAULT_TIMEZONE,
) {
  if (timeRange === KpiTimeRange.ALL_TIME) {
    return undefined;
  }

  const zonedNow = toZonedTime(new Date(), timezone);

  let start: Date;
  let end: Date;

  switch (timeRange) {
    case KpiTimeRange.THIS_WEEK: {
      /**
       * Align dashboard KPIs with AI tooling by using full
       * week boundaries in the user's timezone.
       */
      start = startOfWeek(zonedNow, { weekStartsOn: WEEK_START });
      end = endOfWeek(zonedNow, { weekStartsOn: WEEK_START });
      break;
    }

    case KpiTimeRange.THIS_MONTH: {
      start = startOfMonth(zonedNow);
      end = endOfMonth(zonedNow);
      break;
    }

    case KpiTimeRange.THIS_YEAR: {
      start = startOfYear(zonedNow);
      end = endOfYear(zonedNow);
      break;
    }

    default:
      return undefined;
  }

  return {
    gte: toZonedTime(start, timezone),
    lte: toZonedTime(end, timezone),
  };
}
