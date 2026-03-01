
-- CreateEnum
CREATE TYPE "JobCancelReason" AS ENUM ('CUSTOMER_CANCEL', 'STAFF_CANCEL', 'WORKER_CANCEL', 'NO_SHOW', 'UNSAFE_LOCATION', 'OTHER');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'RESOLVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DisputeResolution" AS ENUM ('FULL_PAY', 'PARTIAL_PAY', 'NO_PAY', 'CANCEL_JOB');

-- CreateEnum
CREATE TYPE "PermissionOverrideMode" AS ENUM ('GRANT', 'REVOKE');

-- CreateEnum
CREATE TYPE "JobPaymentType" AS ENUM ('FIXED', 'HOURLY');

-- CreateEnum
CREATE TYPE "JobPostMode" AS ENUM ('PUBLIC', 'DIRECT_ASSIGN');

-- CreateEnum
CREATE TYPE "ProofPolicyType" AS ENUM ('NONE', 'REQUIRED');

-- CreateEnum
CREATE TYPE "JobPriority" AS ENUM ('NORMAL', 'URGENT');

-- CreateEnum
CREATE TYPE "ProofType" AS ENUM ('BEFORE', 'AFTER', 'GENERAL');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'REGISTER';
ALTER TYPE "AuditAction" ADD VALUE 'EMAIL_VERIFIED';
ALTER TYPE "AuditAction" ADD VALUE 'VERIFICATION_APPROVED';
ALTER TYPE "AuditAction" ADD VALUE 'VERIFICATION_REJECTED';
ALTER TYPE "AuditAction" ADD VALUE 'RISK_FLAGGED';
ALTER TYPE "AuditAction" ADD VALUE 'JOB_CREATE';
ALTER TYPE "AuditAction" ADD VALUE 'JOB_UPDATE';
ALTER TYPE "AuditAction" ADD VALUE 'JOB_DELETE';
ALTER TYPE "AuditAction" ADD VALUE 'JOB_CANCEL';
ALTER TYPE "AuditAction" ADD VALUE 'DISPUTE_OPEN';
ALTER TYPE "AuditAction" ADD VALUE 'DISPUTE_RESOLVE';
ALTER TYPE "AuditAction" ADD VALUE 'STAFF_PERMISSIONS_UPDATE';
ALTER TYPE "AuditAction" ADD VALUE 'PERMISSION_OVERRIDE_UPDATE';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "FilePurpose" ADD VALUE 'JOB_ATTACHMENT';
ALTER TYPE "FilePurpose" ADD VALUE 'DISPUTE_ATTACHMENT';

-- AlterEnum
ALTER TYPE "JobStatus" ADD VALUE 'ASSIGNED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'VERIFICATION_STATUS';
ALTER TYPE "NotificationType" ADD VALUE 'TICKET_UPDATE';
ALTER TYPE "NotificationType" ADD VALUE 'NEW_JOB_POSTED';
ALTER TYPE "NotificationType" ADD VALUE 'JOB_CANCELLED';
ALTER TYPE "NotificationType" ADD VALUE 'DISPUTE_OPENED';
ALTER TYPE "NotificationType" ADD VALUE 'DISPUTE_RESOLVED';
ALTER TYPE "NotificationType" ADD VALUE 'DISPUTE_MESSAGE';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TransactionType" ADD VALUE 'HOLD';
ALTER TYPE "TransactionType" ADD VALUE 'RELEASE';
ALTER TYPE "TransactionType" ADD VALUE 'JOB_CREDIT';
ALTER TYPE "TransactionType" ADD VALUE 'JOB_DEBIT';
ALTER TYPE "TransactionType" ADD VALUE 'FEE_CHARGE';
ALTER TYPE "TransactionType" ADD VALUE 'FEE_REFUND';
ALTER TYPE "TransactionType" ADD VALUE 'LATE_CANCEL_FEE';

-- DropForeignKey
ALTER TABLE "admin_audit_logs" DROP CONSTRAINT "admin_audit_logs_actorId_fkey";

-- DropForeignKey
ALTER TABLE "file_objects" DROP CONSTRAINT "file_objects_idVerificationId_fkey";

-- DropForeignKey
ALTER TABLE "file_objects" DROP CONSTRAINT "file_objects_uploadedByUserId_fkey";

-- DropForeignKey
ALTER TABLE "jobs" DROP CONSTRAINT "jobs_createdBy_fkey";

-- DropIndex
DROP INDEX "file_objects_objectKey_idx";

-- DropIndex
DROP INDEX "file_objects_objectKey_key";

-- DropIndex
DROP INDEX "file_objects_purpose_idVerificationId_idx";

-- DropIndex
DROP INDEX "file_objects_purpose_jobId_idx";

-- DropIndex
DROP INDEX "file_objects_uploadedByUserId_idx";

-- DropIndex
DROP INDEX "login_attempts_email_createdAt_idx";

-- DropIndex
DROP INDEX "login_attempts_ipAddress_createdAt_idx";

-- DropIndex
DROP INDEX "password_reset_tokens_expiresAt_idx";

-- DropIndex
DROP INDEX "permissions_name_key";

-- DropIndex
DROP INDEX "two_factor_challenges_userId_expiresAt_idx";

-- DropIndex
DROP INDEX "user_sessions_refreshTokenHash_idx";

-- DropIndex
DROP INDEX "verification_tokens_expiresAt_idx";

-- DropIndex
DROP INDEX "worker_profiles_district_idx";

-- DropIndex
DROP INDEX "worker_profiles_isOnline_isAvailable_idx";

-- DropIndex
DROP INDEX "worker_profiles_rating_idx";

-- DropIndex
DROP INDEX "worker_profiles_userId_idx";

-- DropIndex
DROP INDEX "worker_profiles_verificationStatus_idx";

-- AlterTable
ALTER TABLE "bank_details" ADD COLUMN     "accountNumberAuthTag" VARCHAR(255),
ADD COLUMN     "accountNumberHash" VARCHAR(255),
ADD COLUMN     "bankVerifiedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "file_objects" DROP COLUMN "bucket",
DROP COLUMN "idVerificationId",
DROP COLUMN "objectKey",
DROP COLUMN "uploadedByUserId",
ADD COLUMN     "key" VARCHAR(500) NOT NULL,
ADD COLUMN     "uploadedBy" UUID NOT NULL,
ADD COLUMN     "url" VARCHAR(1000) NOT NULL,
ADD COLUMN     "verificationId" UUID;

-- AlterTable
ALTER TABLE "job_proofs" ADD COLUMN     "proofType" "ProofType" NOT NULL DEFAULT 'GENERAL';

-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "arrivalWindowMinutes" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "cancelAllowed" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "cancelBeforeHours" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "cancelNote" TEXT,
ADD COLUMN     "cancelReason" "JobCancelReason",
ADD COLUMN     "cancelledById" UUID,
ADD COLUMN     "cancelledFeeCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "directAssignWorkerId" UUID,
ADD COLUMN     "disputeWindowDays" INTEGER NOT NULL DEFAULT 7,
ADD COLUMN     "districtRestricted" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "estimatedHours" INTEGER,
ADD COLUMN     "executionDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "geofenceRadiusM" INTEGER NOT NULL DEFAULT 150,
ADD COLUMN     "hourlyRateCents" INTEGER,
ADD COLUMN     "lateCancelFeeCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "maxHours" INTEGER,
ADD COLUMN     "minProofImages" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "minWorkerRating" DOUBLE PRECISION,
ADD COLUMN     "mustFinishBy" TIMESTAMP(3),
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "notifyWorkers" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paymentType" "JobPaymentType" NOT NULL DEFAULT 'FIXED',
ADD COLUMN     "platformFeeCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "postMode" "JobPostMode" NOT NULL DEFAULT 'PUBLIC',
ADD COLUMN     "priority" "JobPriority" NOT NULL DEFAULT 'NORMAL',
ADD COLUMN     "proofPolicy" "ProofPolicyType" NOT NULL DEFAULT 'REQUIRED',
ADD COLUMN     "requireArrival" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "requireBeforeAfter" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "requireGpsPhoto" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "timeSlot" VARCHAR(100),
ADD COLUMN     "totalCostCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "verifiedOnly" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "login_attempts" DROP COLUMN "createdAt",
ADD COLUMN     "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "email" SET DATA TYPE TEXT,
ALTER COLUMN "ipAddress" SET NOT NULL,
ALTER COLUMN "ipAddress" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "readAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "password_reset_tokens" ALTER COLUMN "tokenHash" SET DATA TYPE TEXT,
ALTER COLUMN "ipAddress" SET DATA TYPE TEXT,
ALTER COLUMN "userAgent" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "payout_requests" ADD COLUMN     "paymentReference" VARCHAR(255);

-- AlterTable
ALTER TABLE "permissions" ADD COLUMN     "code" VARCHAR(100) NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "group" VARCHAR(50) NOT NULL;

-- AlterTable
ALTER TABLE "two_factor_challenges" ALTER COLUMN "otpHash" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "user_sessions" DROP COLUMN "deviceName",
ALTER COLUMN "refreshTokenHash" SET DATA TYPE TEXT,
ALTER COLUMN "rotatedToId" SET DATA TYPE TEXT,
ALTER COLUMN "ipAddress" SET DATA TYPE TEXT,
ALTER COLUMN "lastUsedAt" DROP NOT NULL,
ALTER COLUMN "lastUsedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "riskFlags" JSONB,
ADD COLUMN     "verificationLevel" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "verificationScore" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "verification_tokens" DROP COLUMN "ipAddress",
DROP COLUMN "userAgent",
ALTER COLUMN "tokenHash" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "worker_profiles" DROP COLUMN "completedJobs",
DROP COLUMN "district",
DROP COLUMN "isAvailable",
DROP COLUMN "latitude",
DROP COLUMN "longitude",
DROP COLUMN "rating",
DROP COLUMN "totalJobs",
DROP COLUMN "verifiedAt",
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "completionScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "fullName" VARCHAR(255),
ADD COLUMN     "hourlyRateCents" INTEGER,
ADD COLUMN     "lastComputedAt" TIMESTAMP(3),
ADD COLUMN     "missingProfileItems" JSONB,
ADD COLUMN     "nicNumber" VARCHAR(50),
ADD COLUMN     "profilePhotoFileKey" VARCHAR(500),
DROP COLUMN "skills",
ADD COLUMN     "skills" JSONB;

-- CreateTable
CREATE TABLE "verification_history" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "previousStatus" VARCHAR(50),
    "newStatus" VARCHAR(50),
    "reason" TEXT,
    "adminId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disputes" (
    "id" UUID NOT NULL,
    "jobId" UUID NOT NULL,
    "openedById" UUID NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "reason" TEXT NOT NULL,
    "resolution" "DisputeResolution",
    "resolutionNote" TEXT,
    "reviewedById" UUID,
    "resolutionTransactionId" UUID,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispute_messages" (
    "id" UUID NOT NULL,
    "disputeId" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dispute_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispute_attachments" (
    "id" UUID NOT NULL,
    "disputeId" UUID NOT NULL,
    "fileKey" VARCHAR(500) NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "size" INTEGER NOT NULL,
    "originalName" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dispute_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_attachments" (
    "id" UUID NOT NULL,
    "jobId" UUID NOT NULL,
    "fileKey" VARCHAR(500) NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "size" INTEGER NOT NULL,
    "originalName" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payout_status_history" (
    "id" UUID NOT NULL,
    "payoutRequestId" UUID NOT NULL,
    "fromStatus" "PayoutStatus",
    "toStatus" "PayoutStatus" NOT NULL,
    "actorId" UUID NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payout_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_permissions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "permissionId" UUID NOT NULL,
    "mode" "PermissionOverrideMode" NOT NULL DEFAULT 'GRANT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_request_logs" (
    "id" UUID NOT NULL,
    "method" VARCHAR(10) NOT NULL,
    "path" VARCHAR(500) NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "role" VARCHAR(50),
    "userId" UUID,
    "ipAddress" VARCHAR(45),
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_request_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "verification_history_userId_idx" ON "verification_history"("userId");

-- CreateIndex
CREATE INDEX "verification_history_createdAt_idx" ON "verification_history"("createdAt");

-- CreateIndex
CREATE INDEX "disputes_status_createdAt_idx" ON "disputes"("status", "createdAt");

-- CreateIndex
CREATE INDEX "disputes_jobId_idx" ON "disputes"("jobId");

-- CreateIndex
CREATE INDEX "dispute_messages_disputeId_createdAt_idx" ON "dispute_messages"("disputeId", "createdAt");

-- CreateIndex
CREATE INDEX "dispute_attachments_disputeId_idx" ON "dispute_attachments"("disputeId");

-- CreateIndex
CREATE INDEX "job_attachments_jobId_idx" ON "job_attachments"("jobId");

-- CreateIndex
CREATE INDEX "payout_status_history_payoutRequestId_idx" ON "payout_status_history"("payoutRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "user_permissions_userId_permissionId_key" ON "user_permissions"("userId", "permissionId");

-- CreateIndex
CREATE INDEX "api_request_logs_createdAt_idx" ON "api_request_logs"("createdAt");

-- CreateIndex
CREATE INDEX "api_request_logs_path_idx" ON "api_request_logs"("path");

-- CreateIndex
CREATE INDEX "api_request_logs_statusCode_idx" ON "api_request_logs"("statusCode");

-- CreateIndex
CREATE INDEX "api_request_logs_userId_idx" ON "api_request_logs"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "bank_details_accountNumberHash_key" ON "bank_details"("accountNumberHash");

-- CreateIndex
CREATE INDEX "file_objects_uploadedBy_idx" ON "file_objects"("uploadedBy");

-- CreateIndex
CREATE INDEX "jobs_postMode_status_idx" ON "jobs"("postMode", "status");

-- CreateIndex
CREATE INDEX "jobs_executionDate_idx" ON "jobs"("executionDate");

-- CreateIndex
CREATE INDEX "login_attempts_email_idx" ON "login_attempts"("email");

-- CreateIndex
CREATE INDEX "login_attempts_ipAddress_idx" ON "login_attempts"("ipAddress");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

-- CreateIndex
CREATE INDEX "two_factor_challenges_userId_idx" ON "two_factor_challenges"("userId");

-- CreateIndex
CREATE INDEX "users_verificationLevel_idx" ON "users"("verificationLevel");

-- CreateIndex
CREATE INDEX "users_verificationScore_idx" ON "users"("verificationScore");

-- AddForeignKey
ALTER TABLE "verification_history" ADD CONSTRAINT "verification_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_openedById_fkey" FOREIGN KEY ("openedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_messages" ADD CONSTRAINT "dispute_messages_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "disputes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_messages" ADD CONSTRAINT "dispute_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_attachments" ADD CONSTRAINT "dispute_attachments_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "disputes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_attachments" ADD CONSTRAINT "job_attachments_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_status_history" ADD CONSTRAINT "payout_status_history_payoutRequestId_fkey" FOREIGN KEY ("payoutRequestId") REFERENCES "payout_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_objects" ADD CONSTRAINT "file_objects_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_objects" ADD CONSTRAINT "file_objects_verificationId_fkey" FOREIGN KEY ("verificationId") REFERENCES "id_verifications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_request_logs" ADD CONSTRAINT "api_request_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
