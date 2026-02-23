-- AlterTable
ALTER TABLE "Driver" ADD COLUMN     "idExpiration" TIMESTAMP(3),
ADD COLUMN     "licenseExpiration" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "fullCoverageExpiration" TIMESTAMP(3),
ADD COLUMN     "hasFullCoverage" BOOLEAN DEFAULT false;
