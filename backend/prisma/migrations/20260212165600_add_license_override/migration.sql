-- CreateTable
CREATE TABLE "LicenseOverride" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "reason" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LicenseOverride_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LicenseOverride_userId_idx" ON "LicenseOverride"("userId");

-- AddForeignKey
ALTER TABLE "LicenseOverride" ADD CONSTRAINT "LicenseOverride_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
