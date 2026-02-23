-- CreateEnum
CREATE TYPE "ExpenseType" AS ENUM ('reparacion', 'repuesto', 'combustible', 'mantenimiento', 'seguro', 'impuesto', 'multa', 'lavado', 'otro');

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "type" "ExpenseType" NOT NULL DEFAULT 'reparacion';

-- CreateIndex
CREATE INDEX "Expense_vehicleId_type_idx" ON "Expense"("vehicleId", "type");
