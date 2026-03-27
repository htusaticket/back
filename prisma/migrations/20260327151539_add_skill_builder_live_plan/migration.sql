-- AlterEnum
ALTER TYPE "UserPlan" ADD VALUE 'SKILL_BUILDER_LIVE';

-- AlterTable
ALTER TABLE "daily_challenges" ADD COLUMN     "visible_for_skill_builder_live" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "modules" ADD COLUMN     "visible_for_skill_builder_live" BOOLEAN NOT NULL DEFAULT false;
