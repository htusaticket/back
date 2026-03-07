/*
  Warnings:

  - You are about to drop the column `max_strikes_for_suspension` on the `system_config` table. All the data in the column will be lost.
  - You are about to drop the column `suspension_duration_days` on the `system_config` table. All the data in the column will be lost.
  - You are about to drop the column `end_date` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `plan` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `start_date` on the `users` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'NEW_REGISTRATION';
ALTER TYPE "NotificationType" ADD VALUE 'PLAN_EXPIRED';
ALTER TYPE "NotificationType" ADD VALUE 'REGISTRATION_APPROVED';

-- AlterTable
ALTER TABLE "daily_challenges" ADD COLUMN     "visible_for_skill_builder" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "modules" ADD COLUMN     "visible_for_skill_builder" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "system_config" DROP COLUMN "max_strikes_for_suspension",
DROP COLUMN "suspension_duration_days",
ADD COLUMN     "academy_enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "late_cancellation_hours" INTEGER NOT NULL DEFAULT 24,
ADD COLUMN     "max_strikes_for_punishment" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "punishment_duration_days" INTEGER NOT NULL DEFAULT 14;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "end_date",
DROP COLUMN "plan",
DROP COLUMN "start_date",
ADD COLUMN     "is_punished" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "punished_until" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan" "UserPlan" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "has_paid" BOOLEAN NOT NULL DEFAULT false,
    "paid_at" TIMESTAMP(3),
    "payment_note" TEXT,
    "assigned_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- CreateIndex
CREATE INDEX "subscriptions_end_date_idx" ON "subscriptions"("end_date");

-- CreateIndex
CREATE INDEX "users_is_punished_idx" ON "users"("is_punished");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
