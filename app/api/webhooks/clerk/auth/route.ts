import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
// This route handles auth-related webhooks (user.*).

/* -------------------- helpers -------------------- */

function getFirstName(
  firstName: string | null | undefined,
  emailAddresses: { email_address?: string | null }[] | undefined,
): string | null {
  if (firstName && firstName.trim()) return firstName;

  const email =
    emailAddresses?.find((e) => e.email_address)?.email_address ?? null;
  if (!email) return null;

  const localPart = email.split("@")[0];
  if (!localPart) return null;

  const cleaned = localPart.replace(/[._-]+/g, " ");
  const [token] = cleaned.split(" ").filter(Boolean);
  if (!token) return null;

  return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
}

/* -------------------- webhook -------------------- */

export async function POST(req: NextRequest) {
  try {
    const isDev = process.env.NODE_ENV !== "production";

    if (isDev) {
      console.log("Webhook received"); // Log that a request was received
    }

    const evt = await verifyWebhook(req, {
      // Secret for your AUTH (user/session) webhook endpoint
      signingSecret: process.env.CLERK_WEBHOOK_SIGNING_SECRET!,
    });
    if (isDev) {
      console.log("Webhook verified:", evt.type); // Log the event type
      console.log("Event data:", evt.data); // Log full data for debugging
    }

    /* ================= USER EVENTS ================= */

    if (evt.type === "user.created") {
      const { id, email_addresses, first_name, last_name, image_url } =
        evt.data;
      if (isDev) {
        console.log(
          "Creating new user:",
          id,
          email_addresses[0]?.email_address,
        );
      }

      const derivedFirstName = getFirstName(first_name, email_addresses);
      const email = email_addresses[0]?.email_address ?? "";

      // Check if a user with the same email already exists
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        // Update the existing user's clerkUserId and other fields
        await prisma.user.update({
          where: { email },
          data: {
            clerkUserId: id,
            firstName: derivedFirstName,
            lastName: last_name,
            imageUrl: image_url,
          },
        });
        if (isDev) {
          console.log("User updated with clerkUserId:", id);
        }
      } else {
        // Create a new user
        await prisma.user.create({
          data: {
            clerkUserId: id,
            email,
            firstName: derivedFirstName,
            lastName: last_name,
            imageUrl: image_url,
          },
        });
        if (isDev) {
          console.log("User created successfully:", id);
        }
      }
    }

    if (evt.type === "user.updated") {
      const { id, email_addresses, first_name, last_name, image_url } =
        evt.data;
      if (isDev) {
        console.log("Updating user:", id);
      }

      const derivedFirstName = getFirstName(first_name, email_addresses);

      await prisma.user.upsert({
        where: { clerkUserId: id },
        update: {
          email: email_addresses[0]?.email_address ?? "",
          firstName: derivedFirstName,
          lastName: last_name,
          imageUrl: image_url,
        },
        create: {
          clerkUserId: id,
          email: email_addresses[0]?.email_address ?? "",
          firstName: derivedFirstName,
          lastName: last_name,
          imageUrl: image_url,
        },
      });
      if (isDev) {
        console.log("User updated successfully:", id);
      }
    }

    if (evt.type === "user.deleted") {
      const { id } = evt.data;
      if (isDev) {
        console.log("Deleting user:", id);
      }

      if (id) {
        await prisma.user
          .delete({
            where: { clerkUserId: id },
          })
          .catch(() => {
            if (isDev) {
              console.log("User already deleted:", id);
            }
          });
        if (isDev) {
          console.log("User deleted successfully:", id);
        }
      }
    }

    if (isDev) {
      console.log("Webhook processing finished");
    }
    return new Response("Webhook processed", { status: 200 });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Webhook verification failed:", err);
    }
    return new Response("Invalid webhook", { status: 400 });
  }
}
