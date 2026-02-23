-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "InviteDeliveryMethod" AS ENUM ('WHATSAPP', 'EMAIL');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'INVITE_SENT';
ALTER TYPE "AuditAction" ADD VALUE 'REQUEST_ACCESS';

-- AlterEnum
ALTER TYPE "JobCancelReason" ADD VALUE 'NO_SHOW';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'NEW_JOB_POSTED';
ALTER TYPE "NotificationType" ADD VALUE 'PAYOUT_STATUS';
ALTER TYPE "NotificationType" ADD VALUE 'DISPUTE_RESOLVED';
ALTER TYPE "NotificationType" ADD VALUE 'PASSWORD_CHANGED';
ALTER TYPE "NotificationType" ADD VALUE 'SESSION_REVOKED';
ALTER TYPE "NotificationType" ADD VALUE 'COMMENT_REPLY';
ALTER TYPE "NotificationType" ADD VALUE 'DISPUTE_MESSAGE';
ALTER TYPE "NotificationType" ADD VALUE 'ADMIN_ALERT_SECURITY';
ALTER TYPE "NotificationType" ADD VALUE 'VERIFICATION_STATUS';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PayoutStatus" ADD VALUE 'PROCESSING';
ALTER TYPE "PayoutStatus" ADD VALUE 'FAILED';

-- AlterEnum
ALTER TYPE "PermissionOverrideMode" ADD VALUE 'REVOKE';

-- AlterEnum
ALTER TYPE "TicketPriority" ADD VALUE 'URGENT';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TransactionType" ADD VALUE 'DEBIT';
ALTER TYPE "TransactionType" ADD VALUE 'JOB_CREDIT';
ALTER TYPE "TransactionType" ADD VALUE 'REFUND';
ALTER TYPE "TransactionType" ADD VALUE 'HOLD';
ALTER TYPE "TransactionType" ADD VALUE 'RELEASE';
ALTER TYPE "TransactionType" ADD VALUE 'JOB_DEBIT';
ALTER TYPE "TransactionType" ADD VALUE 'FEE_CHARGE';
ALTER TYPE "TransactionType" ADD VALUE 'FEE_REFUND';
ALTER TYPE "TransactionType" ADD VALUE 'LATE_CANCEL_FEE';

-- CreateTable
CREATE TABLE "registration_requests" (
    "id" UUID NOT NULL,
    "fullName" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "nic" VARCHAR(50),
    "status" "RegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" UUID,
    "reviewedAt" TIMESTAMP(3),
    "reviewReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registration_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invite_tokens" (
    "id" UUID NOT NULL,
    "requestId" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "tokenHash" VARCHAR(255) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "deliveryMethod" "InviteDeliveryMethod" NOT NULL,
    "sentAt" TIMESTAMP(3),
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invite_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "registration_requests_status_createdAt_idx" ON "registration_requests"("status", "createdAt");

-- CreateIndex
CREATE INDEX "registration_requests_email_idx" ON "registration_requests"("email");

-- CreateIndex
CREATE INDEX "registration_requests_phone_idx" ON "registration_requests"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "invite_tokens_requestId_key" ON "invite_tokens"("requestId");

-- CreateIndex
CREATE INDEX "invite_tokens_requestId_idx" ON "invite_tokens"("requestId");

-- CreateIndex
CREATE INDEX "invite_tokens_expiresAt_idx" ON "invite_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "invite_tokens_usedAt_idx" ON "invite_tokens"("usedAt");

-- CreateIndex
CREATE INDEX "invite_tokens_deliveryMethod_idx" ON "invite_tokens"("deliveryMethod");

-- AddForeignKey
ALTER TABLE "registration_requests" ADD CONSTRAINT "registration_requests_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invite_tokens" ADD CONSTRAINT "invite_tokens_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "registration_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invite_tokens" ADD CONSTRAINT "invite_tokens_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
