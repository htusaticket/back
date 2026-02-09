/*
  Warnings:

  - The `status` column on the `class_enrollments` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "ChallengeType" AS ENUM ('AUDIO', 'MULTIPLE_CHOICE', 'WRITING');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('STRIKE_APPLIED', 'CLASS_REMINDER', 'MATERIAL_AVAILABLE', 'CHALLENGE_FEEDBACK', 'CLASS_CONFIRMED', 'GENERAL');

-- AlterTable
ALTER TABLE "class_enrollments" ADD COLUMN     "cancelled_at" TIMESTAMP(3),
DROP COLUMN "status",
ADD COLUMN     "status" "EnrollmentStatus" NOT NULL DEFAULT 'CONFIRMED';

-- AlterTable
ALTER TABLE "class_sessions" ADD COLUMN     "materials_link" TEXT;

-- AlterTable
ALTER TABLE "user_lesson_progress" ADD COLUMN     "last_accessed_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "strikes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "class_session_id" INTEGER NOT NULL,
    "reason" TEXT NOT NULL DEFAULT 'LATE_CANCELLATION',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "strikes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_challenges" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "type" "ChallengeType" NOT NULL,
    "instructions" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "questions" JSONB,
    "audio_url" TEXT,
    "points" INTEGER NOT NULL DEFAULT 10,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_daily_challenge_progress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "challenge_id" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "answers" JSONB,
    "feedback" TEXT,
    "score" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_daily_challenge_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "strikes_user_id_idx" ON "strikes"("user_id");

-- CreateIndex
CREATE INDEX "strikes_created_at_idx" ON "strikes"("created_at");

-- CreateIndex
CREATE INDEX "daily_challenges_date_idx" ON "daily_challenges"("date");

-- CreateIndex
CREATE INDEX "daily_challenges_is_active_idx" ON "daily_challenges"("is_active");

-- CreateIndex
CREATE INDEX "user_daily_challenge_progress_user_id_completed_at_idx" ON "user_daily_challenge_progress"("user_id", "completed_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_daily_challenge_progress_user_id_challenge_id_key" ON "user_daily_challenge_progress"("user_id", "challenge_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE INDEX "class_enrollments_status_idx" ON "class_enrollments"("status");

-- AddForeignKey
ALTER TABLE "strikes" ADD CONSTRAINT "strikes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strikes" ADD CONSTRAINT "strikes_class_session_id_fkey" FOREIGN KEY ("class_session_id") REFERENCES "class_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_daily_challenge_progress" ADD CONSTRAINT "user_daily_challenge_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_daily_challenge_progress" ADD CONSTRAINT "user_daily_challenge_progress_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "daily_challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
