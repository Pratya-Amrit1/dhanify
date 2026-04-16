/*
  Warnings:

  - You are about to drop the column `trialEnd` on the `SubscriptionItem` table. All the data in the column will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SubscriptionStatus" ADD VALUE 'ENDED';
ALTER TYPE "SubscriptionStatus" ADD VALUE 'ABANDONED';
ALTER TYPE "SubscriptionStatus" ADD VALUE 'INCOMPLETE';
ALTER TYPE "SubscriptionStatus" ADD VALUE 'UPCOMING';
ALTER TYPE "SubscriptionStatus" ADD VALUE 'FREE_TRIAL';

-- AlterTable
ALTER TABLE "SubscriptionItem" DROP COLUMN "trialEnd",
ADD COLUMN     "isFreeTrial" BOOLEAN NOT NULL DEFAULT false;
