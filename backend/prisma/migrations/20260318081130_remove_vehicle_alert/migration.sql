-- DropForeignKey
ALTER TABLE "VehicleAlert" DROP CONSTRAINT "VehicleAlert_userId_fkey";

-- DropForeignKey
ALTER TABLE "VehicleAlert" DROP CONSTRAINT "VehicleAlert_vehicleId_fkey";

-- DropTable
DROP TABLE "VehicleAlert";
