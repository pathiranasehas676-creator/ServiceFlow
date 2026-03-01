-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "FilePurpose" ADD VALUE 'ID_SELFIE';
ALTER TYPE "FilePurpose" ADD VALUE 'ID_LIVENESS';

-- AlterTable
ALTER TABLE "id_verifications" ADD COLUMN     "livenessKey" VARCHAR(500),
ADD COLUMN     "livenessSize" INTEGER;

-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "arrivalIp" VARCHAR(45),
ADD COLUMN     "arrivalUserAgent" TEXT;

-- AlterTable
ALTER TABLE "worker_performance" ADD COLUMN     "cancellationCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "noShowCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reliabilityScore" DOUBLE PRECISION NOT NULL DEFAULT 100.0;

-- AlterTable
ALTER TABLE "worker_profiles" ADD COLUMN     "isSuspended" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "suspendedAt" TIMESTAMP(3),
ADD COLUMN     "suspensionReason" TEXT;
