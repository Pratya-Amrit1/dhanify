import "server-only";
import { prisma } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { ErrorCode } from "../../constants/error-codes";

/* ---------- USER ---------- */
export const requireUser = async () => {
  const { userId, isAuthenticated } = await auth();
  if (!isAuthenticated || !userId) {
    throw new Error(ErrorCode.UNAUTHORIZED);
  }

  let user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      throw new Error(ErrorCode.USER_NOT_FOUND);
    }
    
    const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";

    user = await prisma.user.upsert({
      where: { email },
      update: {
        clerkUserId: clerkUser.id,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        imageUrl: clerkUser.imageUrl,
      },
      create: {
        clerkUserId: clerkUser.id,
        email,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        imageUrl: clerkUser.imageUrl,
      }
    });
  }

  return user;
};
