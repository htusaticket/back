/*
  Warnings:

  - The values [GUEST,MODERATOR] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "UserPlan" AS ENUM ('PRO', 'ELITE', 'LEVEL_UP', 'HIRING_HUB', 'SKILL_BUILDER');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('NOT_MARKED', 'PRESENT', 'LATE', 'ABSENT');

-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('SUPERADMIN', 'ADMIN', 'USER', 'JOB_UPLOADER');
ALTER TABLE "public"."users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'USER';
COMMIT;

-- AlterTable
ALTER TABLE "class_enrollments" ADD COLUMN     "attendance_marked_at" TIMESTAMP(3),
ADD COLUMN     "attendance_status" "AttendanceStatus" NOT NULL DEFAULT 'NOT_MARKED';

-- AlterTable
ALTER TABLE "strikes" ADD COLUMN     "is_manual" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "class_session_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "admin_notes" TEXT,
ADD COLUMN     "end_date" TIMESTAMP(3),
ADD COLUMN     "plan" "UserPlan" DEFAULT 'PRO',
ADD COLUMN     "start_date" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "system_config" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "max_strikes_for_suspension" INTEGER NOT NULL DEFAULT 3,
    "suspension_duration_days" INTEGER NOT NULL DEFAULT 7,
    "job_board_enabled" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "class_enrollments_attendance_status_idx" ON "class_enrollments"("attendance_status");
