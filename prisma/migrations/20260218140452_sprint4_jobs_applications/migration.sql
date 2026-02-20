/*
  Warnings:

  - The `status` column on the `job_applications` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED');

-- AlterTable
ALTER TABLE "job_applications" ADD COLUMN     "notes" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" "ApplicationStatus" NOT NULL DEFAULT 'APPLIED';

-- CreateIndex
CREATE INDEX "job_applications_user_id_status_idx" ON "job_applications"("user_id", "status");

-- CreateIndex
CREATE INDEX "job_offers_is_active_idx" ON "job_offers"("is_active");

-- CreateIndex
CREATE INDEX "job_offers_type_idx" ON "job_offers"("type");
