-- AlterTable
ALTER TABLE "bank_details" ADD COLUMN     "deleteReason" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedById" UUID;

-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "deleteReason" TEXT,
ADD COLUMN     "deletedById" UUID;

-- AlterTable
ALTER TABLE "payout_requests" ADD COLUMN     "deleteReason" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedById" UUID;

-- AlterTable
ALTER TABLE "services" ADD COLUMN     "deleteReason" TEXT,
ADD COLUMN     "deletedById" UUID;

-- AlterTable
ALTER TABLE "support_tickets" ADD COLUMN     "deleteReason" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedById" UUID,
ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "deleteReason" TEXT,
ADD COLUMN     "deletedById" UUID;

-- AlterTable
ALTER TABLE "worker_profiles" ADD COLUMN     "deleteReason" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedById" UUID;

-- CreateTable
CREATE TABLE "error_logs" (
    "id" UUID NOT NULL,
    "severity" VARCHAR(20) NOT NULL DEFAULT 'high',
    "source" VARCHAR(50) NOT NULL DEFAULT 'backend',
    "message" TEXT NOT NULL,
    "stack" TEXT,
    "path" VARCHAR(500),
    "method" VARCHAR(10),
    "userId" UUID,
    "ipAddress" VARCHAR(45),
    "userAgent" TEXT,
    "safePayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "error_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "error_logs_severity_createdAt_idx" ON "error_logs"("severity", "createdAt");

-- CreateIndex
CREATE INDEX "error_logs_source_idx" ON "error_logs"("source");

-- CreateIndex
CREATE INDEX "error_logs_userId_idx" ON "error_logs"("userId");

-- AddForeignKey
ALTER TABLE "error_logs" ADD CONSTRAINT "error_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
