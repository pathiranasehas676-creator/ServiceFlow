/*
  Warnings:

  - The values [FULL_PAY,PARTIAL_PAY,NO_PAY,CANCEL_JOB] on the enum `DisputeResolution` will be removed. If these variants are still used in the database, this will fail.
  - The values [JOB_ATTACHMENT] on the enum `FilePurpose` will be removed. If these variants are still used in the database, this will fail.
  - The values [CUSTOMER_CANCEL,STAFF_CANCEL,WORKER_CANCEL,NO_SHOW,UNSAFE_LOCATION] on the enum `JobCancelReason` will be removed. If these variants are still used in the database, this will fail.
  - The values [ASSIGNED] on the enum `JobStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [PAYOUT_STATUS,COMMENT_REPLY,ADMIN_ALERT_SECURITY,SESSION_REVOKED,PASSWORD_CHANGED,VERIFICATION_STATUS,NEW_JOB_POSTED,DISPUTE_RESOLVED,DISPUTE_MESSAGE] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.
  - The values [PROCESSING,FAILED] on the enum `PayoutStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [REVOKE] on the enum `PermissionOverrideMode` will be removed. If these variants are still used in the database, this will fail.
  - The values [URGENT] on the enum `TicketPriority` will be removed. If these variants are still used in the database, this will fail.
  - The values [DEBIT,REFUND,HOLD,RELEASE,JOB_CREDIT,JOB_DEBIT,FEE_CHARGE,FEE_REFUND,LATE_CANCEL_FEE] on the enum `TransactionType` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'BLACKLISTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'USER_SUSPEND';
ALTER TYPE "AuditAction" ADD VALUE 'USER_UNSUSPEND';
ALTER TYPE "AuditAction" ADD VALUE 'USER_BLACKLIST';
ALTER TYPE "AuditAction" ADD VALUE 'BANK_UPDATE';

-- AlterEnum
BEGIN;
CREATE TYPE "DisputeResolution_new" AS ENUM ('REFUND', 'RELEASE_PAYMENT', 'SPLIT');
ALTER TABLE "disputes" ALTER COLUMN "resolution" TYPE "DisputeResolution_new" USING ("resolution"::text::"DisputeResolution_new");
ALTER TYPE "DisputeResolution" RENAME TO "DisputeResolution_old";
ALTER TYPE "DisputeResolution_new" RENAME TO "DisputeResolution";
DROP TYPE "DisputeResolution_old";
COMMIT;

-- AlterEnum
ALTER TYPE "DisputeStatus" ADD VALUE 'CLOSED';

-- AlterEnum
BEGIN;
CREATE TYPE "FilePurpose_new" AS ENUM ('ID_FRONT', 'ID_BACK', 'ID_SELFIE', 'ID_LIVENESS', 'JOB_PROOF', 'PAYOUT_RECEIPT', 'PROFILE_PHOTO', 'DISPUTE_ATTACHMENT', 'OTHER');
ALTER TABLE "file_objects" ALTER COLUMN "purpose" TYPE "FilePurpose_new" USING ("purpose"::text::"FilePurpose_new");
ALTER TYPE "FilePurpose" RENAME TO "FilePurpose_old";
ALTER TYPE "FilePurpose_new" RENAME TO "FilePurpose";
DROP TYPE "FilePurpose_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "JobCancelReason_new" AS ENUM ('WORKER_NO_SHOW', 'CLIENT_CANCELLED', 'WORKER_CANCELLED', 'ADMIN_CANCELLED', 'OTHER');
ALTER TABLE "jobs" ALTER COLUMN "cancelReason" TYPE "JobCancelReason_new" USING ("cancelReason"::text::"JobCancelReason_new");
ALTER TYPE "JobCancelReason" RENAME TO "JobCancelReason_old";
ALTER TYPE "JobCancelReason_new" RENAME TO "JobCancelReason";
DROP TYPE "JobCancelReason_old";
COMMIT;

-- AlterEnum
ALTER TYPE "JobPostMode" ADD VALUE 'PRIVATE';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "JobPriority" ADD VALUE 'HIGH';
ALTER TYPE "JobPriority" ADD VALUE 'LOW';

-- AlterEnum
BEGIN;
CREATE TYPE "JobStatus_new" AS ENUM ('POSTED', 'ACCEPTED', 'ARRIVED', 'PROOF_SUBMITTED', 'APPROVED', 'COMPLETED', 'REJECTED', 'CANCELLED');
ALTER TABLE "jobs" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "jobs" ALTER COLUMN "status" TYPE "JobStatus_new" USING ("status"::text::"JobStatus_new");
ALTER TABLE "job_status_history" ALTER COLUMN "fromStatus" TYPE "JobStatus_new" USING ("fromStatus"::text::"JobStatus_new");
ALTER TABLE "job_status_history" ALTER COLUMN "toStatus" TYPE "JobStatus_new" USING ("toStatus"::text::"JobStatus_new");
ALTER TYPE "JobStatus" RENAME TO "JobStatus_old";
ALTER TYPE "JobStatus_new" RENAME TO "JobStatus";
DROP TYPE "JobStatus_old";
ALTER TABLE "jobs" ALTER COLUMN "status" SET DEFAULT 'POSTED';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('INFO', 'WARNING', 'ERROR', 'SUCCESS', 'JOB_ASSIGNED', 'JOB_UPDATE', 'JOB_CANCELLED', 'PROOF_DECISION', 'PAYOUT_UPDATE', 'VERIFICATION_UPDATE', 'DISPUTE_OPENED', 'TICKET_UPDATE');
ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "NotificationType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "PayoutStatus_new" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'REJECTED');
ALTER TABLE "payout_requests" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "payout_requests" ALTER COLUMN "status" TYPE "PayoutStatus_new" USING ("status"::text::"PayoutStatus_new");
ALTER TABLE "payout_status_history" ALTER COLUMN "fromStatus" TYPE "PayoutStatus_new" USING ("fromStatus"::text::"PayoutStatus_new");
ALTER TABLE "payout_status_history" ALTER COLUMN "toStatus" TYPE "PayoutStatus_new" USING ("toStatus"::text::"PayoutStatus_new");
ALTER TYPE "PayoutStatus" RENAME TO "PayoutStatus_old";
ALTER TYPE "PayoutStatus_new" RENAME TO "PayoutStatus";
DROP TYPE "PayoutStatus_old";
ALTER TABLE "payout_requests" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "PermissionOverrideMode_new" AS ENUM ('GRANT', 'DENY');
ALTER TABLE "user_permissions" ALTER COLUMN "mode" DROP DEFAULT;
ALTER TABLE "user_permissions" ALTER COLUMN "mode" TYPE "PermissionOverrideMode_new" USING ("mode"::text::"PermissionOverrideMode_new");
ALTER TYPE "PermissionOverrideMode" RENAME TO "PermissionOverrideMode_old";
ALTER TYPE "PermissionOverrideMode_new" RENAME TO "PermissionOverrideMode";
DROP TYPE "PermissionOverrideMode_old";
ALTER TABLE "user_permissions" ALTER COLUMN "mode" SET DEFAULT 'GRANT';
COMMIT;

-- AlterEnum
ALTER TYPE "ProofPolicyType" ADD VALUE 'OPTIONAL';

-- AlterEnum
ALTER TYPE "ProofType" ADD VALUE 'GPS';

-- AlterEnum
BEGIN;
CREATE TYPE "TicketPriority_new" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
ALTER TABLE "support_tickets" ALTER COLUMN "priority" DROP DEFAULT;
ALTER TABLE "support_tickets" ALTER COLUMN "priority" TYPE "TicketPriority_new" USING ("priority"::text::"TicketPriority_new");
ALTER TYPE "TicketPriority" RENAME TO "TicketPriority_old";
ALTER TYPE "TicketPriority_new" RENAME TO "TicketPriority";
DROP TYPE "TicketPriority_old";
ALTER TABLE "support_tickets" ALTER COLUMN "priority" SET DEFAULT 'MEDIUM';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "TransactionType_new" AS ENUM ('EARNING', 'PAYOUT', 'ADJUSTMENT', 'DEPOSIT', 'CREDIT');
ALTER TABLE "transactions" ALTER COLUMN "type" TYPE "TransactionType_new" USING ("type"::text::"TransactionType_new");
ALTER TYPE "TransactionType" RENAME TO "TransactionType_old";
ALTER TYPE "TransactionType_new" RENAME TO "TransactionType";
DROP TYPE "TransactionType_old";
COMMIT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "bank_details_history" (
    "id" UUID NOT NULL,
    "bankDetailsId" UUID NOT NULL,
    "accountNumberHash" VARCHAR(255),
    "accountName" VARCHAR(255),
    "bankName" VARCHAR(255),
    "changedById" UUID,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_details_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bank_details_history_bankDetailsId_idx" ON "bank_details_history"("bankDetailsId");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- AddForeignKey
ALTER TABLE "bank_details_history" ADD CONSTRAINT "bank_details_history_bankDetailsId_fkey" FOREIGN KEY ("bankDetailsId") REFERENCES "bank_details"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_details_history" ADD CONSTRAINT "bank_details_history_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
