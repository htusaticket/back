-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'SECTION_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'SECTION_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'SECTION_DELETED';
ALTER TYPE "AuditAction" ADD VALUE 'SECTIONS_REORDERED';

-- AlterTable
ALTER TABLE "lessons" ADD COLUMN     "section_id" INTEGER;

-- CreateTable
CREATE TABLE "module_sections" (
    "id" SERIAL NOT NULL,
    "module_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "module_sections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "module_sections_module_id_idx" ON "module_sections"("module_id");

-- CreateIndex
CREATE INDEX "module_sections_module_id_order_idx" ON "module_sections"("module_id", "order");

-- CreateIndex
CREATE INDEX "lessons_section_id_idx" ON "lessons"("section_id");

-- AddForeignKey
ALTER TABLE "module_sections" ADD CONSTRAINT "module_sections_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "module_sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;
