-- CreateEnum
CREATE TYPE "ModuleStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "modules" ADD COLUMN     "status" "ModuleStatus" NOT NULL DEFAULT 'PUBLISHED';
