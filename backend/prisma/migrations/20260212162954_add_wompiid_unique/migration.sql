/*
  Warnings:

  - A unique constraint covering the columns `[wompiId]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Transaction_wompiId_key" ON "Transaction"("wompiId");
