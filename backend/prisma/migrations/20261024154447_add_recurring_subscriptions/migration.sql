-- CreateEnum
CREATE TYPE "RecurringStatus" AS ENUM ('active', 'past_due', 'suspended', 'canceled');

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "recurringSubscriptionId" TEXT;

-- CreateTable
CREATE TABLE "RecurringSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "wompiPaymentSourceId" INTEGER NOT NULL,
    "paymentMethodType" TEXT NOT NULL,
    "status" "RecurringStatus" NOT NULL DEFAULT 'active',
    "nextChargeAt" TIMESTAMP(3),
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RecurringSubscription_userId_key" ON "RecurringSubscription"("userId");

-- CreateIndex
CREATE INDEX "RecurringSubscription_status_nextChargeAt_idx" ON "RecurringSubscription"("status", "nextChargeAt");

-- CreateIndex
CREATE INDEX "Transaction_recurringSubscriptionId_idx" ON "Transaction"("recurringSubscriptionId");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_recurringSubscriptionId_fkey" FOREIGN KEY ("recurringSubscriptionId") REFERENCES "RecurringSubscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringSubscription" ADD CONSTRAINT "RecurringSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
