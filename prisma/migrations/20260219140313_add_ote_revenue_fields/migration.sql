-- AlterTable
ALTER TABLE "job_offers" ADD COLUMN     "ote_max" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "ote_min" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "revenue" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "job_offers_ote_max_idx" ON "job_offers"("ote_max");

-- CreateIndex
CREATE INDEX "job_offers_revenue_idx" ON "job_offers"("revenue");
