import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  mapClerkSubscriptionStatus,
  mapClerkPaymentStatus,
  mapClerkPaymentType,
  mapPlan,
} from "@/lib/utils/clerk-enum-mappers";

export async function POST(req: NextRequest) {
  try {
    console.log("[Clerk Webhook] Incoming request");
    const evt = await verifyWebhook(req, {
      signingSecret: process.env.CLERK_BILLING_WEBHOOK_SIGNING_SECRET!,
    });
    console.log(`[Clerk Webhook] Event type: ${evt.type}`);
    console.log(
      `[Clerk Webhook] Full event payload:`,
      JSON.stringify(evt, null, 2),
    );

    // Handle all subscriptionItem events for accurate status
    if (evt.type.startsWith("subscriptionItem.")) {
      const item = evt.data as any;
      console.log(
        `[Clerk Webhook] subscriptionItem payload:`,
        JSON.stringify(item, null, 2),
      );
      const subId = item.subscription_id;
      const userId = item.payer?.user_id;
      if (!userId || !subId) {
        console.log("[Clerk Webhook] Missing userId or subscriptionId", {
          item,
        });
        return new Response("Missing userId or subscriptionId", {
          status: 200,
        });
      }
      const user = await prisma.user.findUnique({
        where: { clerkUserId: userId },
      });
      if (!user) {
        console.log("[Clerk Webhook] User not found for subscriptionItem", {
          userId,
        });
        return new Response("User not found", { status: 200 });
      }
      let planSlug =
        item?.plan?.slug || item?.plan?.name || item?.plan || "free";
      planSlug = typeof planSlug === "string" ? planSlug.toLowerCase() : "free";
      const periodStart = item?.period_start
        ? new Date(item.period_start)
        : null;
      const periodEnd = item?.period_end ? new Date(item.period_end) : null;
      const status = mapClerkSubscriptionStatus(item.status);
      console.log(`[Clerk Webhook] Upserting subscriptionItem:`, {
        id: item.id,
        userId: user.id,
        subscriptionId: subId,
        planKey: planSlug,
        planType: mapPlan(planSlug),
        status,
        periodStart,
        periodEnd,
      });
      // Ensure the parent Subscription row exists to satisfy FK constraints.
      try {
        await prisma.subscription.upsert({
          where: { id: subId },
          update: { updatedAt: new Date() },
          create: {
            id: subId,
            userId: user.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      } catch (err) {
        console.log(
          "[Clerk Webhook] Failed to ensure Subscription exists before upserting item",
          err,
        );
        // Continue and let the subsequent upsert surface any issues
      }
      await prisma.subscriptionItem.upsert({
        where: { id: item.id },
        update: {
          userId: user.id,
          subscriptionId: subId,
          planKey: planSlug,
          planType: mapPlan(planSlug),
          status,
          periodStart,
          periodEnd,
          updatedAt: new Date(),
        },
        create: {
          id: item.id,
          userId: user.id,
          subscriptionId: subId,
          planKey: planSlug,
          planType: mapPlan(planSlug),
          status,
          periodStart,
          periodEnd,
          createdAt: new Date(item.created_at ?? Date.now()),
          updatedAt: new Date(),
        },
      });
      return new Response("SubscriptionItem event processed", { status: 200 });
    }

    // Handle subscription events (only upsert the Subscription row, not the items)
    if (
      evt.type === "subscription.created" ||
      evt.type === "subscription.updated" ||
      evt.type === "subscription.active" ||
      evt.type === "subscription.pastDue"
    ) {
      const sub = evt.data as any;
      console.log("[Clerk Webhook] Subscription payload:", sub);

      const clerkUserId: string | undefined =
        sub?.payer?.user_id ?? sub?.payer_id;

      if (!clerkUserId) {
        console.log("[Clerk Webhook] Missing clerk user id", { sub });
        return new Response("Missing clerk user id", { status: 200 });
      }

      const user = await prisma.user.findUnique({
        where: { clerkUserId },
      });

      if (!user) {
        console.log("[Clerk Webhook] User not found", { clerkUserId });
        return new Response("User not found", { status: 200 });
      }

      try {
        await prisma.subscription.upsert({
          where: { userId: user.id },
          update: {
            updatedAt: new Date(),
          },
          create: {
            id: sub.id, // Clerk subscription ID
            userId: user.id,
            createdAt: new Date(sub.created_at ?? Date.now()),
            updatedAt: new Date(),
          },
        });
      } catch (err) {
        console.log("[Clerk Webhook] Prisma subscription upsert error", err);
        throw err;
      }
    }

    // PAYMENT EVENTS (OPTIONAL, FOR HISTORY / ANALYTICS)
    if (
      evt.type === "paymentAttempt.created" ||
      evt.type === "paymentAttempt.updated"
    ) {
      const attempt = evt.data as any;

      const clerkUserId: string | undefined =
        attempt?.payer?.user_id ?? attempt?.payer_id;

      if (!clerkUserId) {
        console.log("[Clerk Webhook] Missing clerk user id (payment)", {
          attempt,
        });
        return new Response("Missing clerk user id", { status: 200 });
      }

      const user = await prisma.user.findUnique({
        where: { clerkUserId },
      });

      if (!user) {
        console.log("[Clerk Webhook] User not found (payment)", {
          clerkUserId,
        });
        return new Response("User not found", { status: 200 });
      }

      const amount: number | null =
        attempt?.totals?.grand_total?.amount ?? null;

      const hasSubscription =
        Array.isArray(attempt.subscription_items) &&
        attempt.subscription_items.length > 0;

      try {
        await prisma.payment.upsert({
          where: { id: attempt.id },
          update: {
            status: mapClerkPaymentStatus(attempt.status),
            type: mapClerkPaymentType(hasSubscription),
            amount,
          },
          create: {
            id: attempt.id,
            userId: user.id,
            status: mapClerkPaymentStatus(attempt.status),
            type: mapClerkPaymentType(hasSubscription),
            amount,
            createdAt: new Date(attempt.created_at ?? Date.now()),
          },
        });
      } catch (err) {
        console.log("[Clerk Webhook] Prisma payment upsert error", err);
        throw err;
      }
    }

    return new Response("Billing webhook processed", { status: 200 });
  } catch (error) {
    console.error("[Clerk Webhook] Handler error:", error);
    return new Response("Invalid webhook", { status: 400 });
  }
}
