-- AlterTable
ALTER TABLE "Tenant"
ADD COLUMN "recordRetentionYears" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN "healthDataRetentionYears" INTEGER NOT NULL DEFAULT 20,
ADD COLUMN "disposalMode" TEXT NOT NULL DEFAULT 'ANONYMIZE',
ADD COLUMN "disposalWindowDays" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN "requireDocumentShareConsent" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "PortalAccount"
ADD COLUMN "revokedAt" TIMESTAMP(3),
ADD COLUMN "revokedReason" TEXT;
