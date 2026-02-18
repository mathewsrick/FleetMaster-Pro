-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Vehicle_userId_deletedAt_idx" ON "Vehicle"("userId", "deletedAt");
