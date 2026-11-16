-- CreateEnum
CREATE TYPE "ExpenseComponent" AS ENUM ('motor', 'frenos', 'suspension', 'llantas', 'embrague_transmision', 'electrico_bateria', 'aceite_filtros', 'refrigeracion', 'direccion', 'carroceria', 'vidrios_luces', 'otro');

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "component" "ExpenseComponent";

-- CreateTable
CREATE TABLE "VehicleAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "startedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMPTZ(6),

    CONSTRAINT "VehicleAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportRun" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "sentAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VehicleAssignment_vehicleId_startedAt_idx" ON "VehicleAssignment"("vehicleId", "startedAt");

-- CreateIndex
CREATE INDEX "VehicleAssignment_driverId_idx" ON "VehicleAssignment"("driverId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportRun_userId_period_kind_key" ON "ReportRun"("userId", "period", "kind");

-- AddForeignKey
ALTER TABLE "VehicleAssignment" ADD CONSTRAINT "VehicleAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleAssignment" ADD CONSTRAINT "VehicleAssignment_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleAssignment" ADD CONSTRAINT "VehicleAssignment_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportRun" ADD CONSTRAINT "ReportRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: one open row per driver currently linked to a vehicle.
-- startedAt = earliest payment date of that driver+vehicle pair, else now().
INSERT INTO "VehicleAssignment" ("id", "userId", "vehicleId", "driverId", "startedAt")
SELECT
    gen_random_uuid()::text,
    d."userId",
    d."vehicleId",
    d."id",
    COALESCE(
        (
            SELECT MIN(p."date")
            FROM "Payment" p
            WHERE p."driverId" = d."id"
              AND p."vehicleId" = d."vehicleId"
        ),
        NOW()
    )
FROM "Driver" d
WHERE d."vehicleId" IS NOT NULL;
