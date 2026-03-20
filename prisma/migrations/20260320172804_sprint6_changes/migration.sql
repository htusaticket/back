-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'UPGRADE_REQUEST';

-- AlterTable
ALTER TABLE "job_offers" ADD COLUMN     "contact_email" TEXT,
ADD COLUMN     "social" TEXT,
ADD COLUMN     "website" TEXT,
ALTER COLUMN "location" SET DEFAULT '',
ALTER COLUMN "salary_range" SET DEFAULT '',
ALTER COLUMN "type" SET DEFAULT 'Setter',
ALTER COLUMN "description" SET DEFAULT '';
