-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'NEEDS_IMPROVEMENT');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('PDF', 'LINK', 'VIDEO', 'DOCUMENT');

-- AlterTable
ALTER TABLE "lessons" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "modules" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "user_daily_challenge_progress" ADD COLUMN     "file_url" TEXT,
ADD COLUMN     "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "lesson_resources" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "type" "ResourceType" NOT NULL DEFAULT 'PDF',
    "size" TEXT,
    "lesson_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_resources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lesson_resources_lesson_id_idx" ON "lesson_resources"("lesson_id");

-- CreateIndex
CREATE INDEX "lessons_order_idx" ON "lessons"("order");

-- CreateIndex
CREATE INDEX "modules_order_idx" ON "modules"("order");

-- CreateIndex
CREATE INDEX "user_daily_challenge_progress_status_idx" ON "user_daily_challenge_progress"("status");

-- AddForeignKey
ALTER TABLE "lesson_resources" ADD CONSTRAINT "lesson_resources_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
