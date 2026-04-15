-- AlterTable: add optional logo URL for system branding (used in student front, admin, emails)
ALTER TABLE "system_config" ADD COLUMN "logo_url" TEXT;
