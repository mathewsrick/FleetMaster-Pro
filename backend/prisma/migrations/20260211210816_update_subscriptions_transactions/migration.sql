-- AlterTable
ALTER TABLE "SubscriptionKey" ADD COLUMN     "transactionRef" TEXT;

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "plan" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "wompiId" TEXT,
    "paymentMethod" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_reference_key" ON "Transaction"("reference");

-- CreateIndex
CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
