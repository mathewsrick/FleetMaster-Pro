-- AlterTable
ALTER TABLE "Expense" ADD COLUMN "mileage" INTEGER;

-- CreateTable
CREATE TABLE "VehicleAlert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "frequencyDays" INTEGER NOT NULL DEFAULT 30,
    "lastNotified" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehicleAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VehicleAlert_userId_isEnabled_idx" ON "VehicleAlert"("userId", "isEnabled");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleAlert_vehicleId_alertType_key" ON "VehicleAlert"("vehicleId", "alertType");

-- AddForeignKey
ALTER TABLE "VehicleAlert" ADD CONSTRAINT "VehicleAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleAlert" ADD CONSTRAINT "VehicleAlert_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
