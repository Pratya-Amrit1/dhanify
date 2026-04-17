import {
  SubscriptionStatus,
  PaymentStatus,
  PaymentType,
  PlanType,
} from "@prisma/client";

/* ---------------- Subscription Status ---------------- */

export function mapClerkSubscriptionStatus(status: string): SubscriptionStatus {
  switch (status) {
    case "active":
      return SubscriptionStatus.ACTIVE;
    case "past_due":
      return SubscriptionStatus.PAST_DUE;
    case "canceled":
      return SubscriptionStatus.CANCELED;
    case "ended":
      return SubscriptionStatus.ENDED;
    case "abandoned":
      return SubscriptionStatus.ABANDONED;
    case "incomplete":
      return SubscriptionStatus.INCOMPLETE;
    case "upcoming":
      return SubscriptionStatus.UPCOMING;
    case "trialing":
      return SubscriptionStatus.TRIALING;
    default:
      return SubscriptionStatus.CANCELED;
  }
}

/* ---------------- Payment Status ---------------- */

export function mapClerkPaymentStatus(status: string): PaymentStatus {
  switch (status) {
    case "paid":
    case "succeeded":
      return PaymentStatus.PAID;

    case "failed":
      return PaymentStatus.FAILED;

    default:
      return PaymentStatus.PENDING;
  }
}

/* ---------------- Payment Type ---------------- */

export function mapClerkPaymentType(hasSubscription: boolean): PaymentType {
  return hasSubscription ? PaymentType.RECURRING : PaymentType.CHECKOUT;
}

/* ---------------- Plan ---------------- */

export function mapPlan(planId: string): PlanType {
  switch (planId) {
    case "pro":
      return PlanType.PRO;
    case "premium":
      return PlanType.PREMIUM;
    default:
      return PlanType.FREE;
  }
}
