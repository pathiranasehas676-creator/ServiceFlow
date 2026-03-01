# Job Cancellation & Dispute System Audit

## Existing Status

| Feature | Status | File Path(s) | Notes |
|---------|--------|--------------|-------|
| Job Status Flow | PARTIAL | `prisma/schema.prisma`, `jobs.service.ts` | `CANCELLED` status exists, but lacks lifecycle data (reason, note). |
| Wallet System | DONE | `wallet.service.ts` | Idempotent credit/debit/hold/release logic exists. |
| Transaction Types | PARTIAL | `prisma/schema.prisma` | Basic types exist, but specific ones (e.g., `LATE_CANCEL_FEE`) are missing. |
| Admin Requests Inbox | PARTIAL | `requests.service.ts`, `RequestsPage.tsx` | Well-structured tabs for proofs/payouts. Missing Disputes. |
| Audit Logging | DONE | `prisma/schema.prisma` | `AdminAuditLog` model is robust and append-only. |
| Role-Based Access | DONE | `auth/guards/roles.guard.ts` | RBAC is implemented and used in controllers. |
| Ownership Checks | PARTIAL | `jobs.service.ts` | Exists for accepting jobs, needs enforcement for cancellation/disputes. |
| File Storage | DONE | `storage.service.ts` | MinIO integration exists for proofs and IDs. |

## Implementation Gaps

1. **Job Cancellation**:
   - `Job` model needs fields: `cancelledById`, `cancelReason`, `cancelNote`, `cancelledFeeCents`.
   - Missing worker cancellation window logic (`cancelBeforeHours`).
   - Need worker and admin cancellation endpoints with notification triggers.

2. **Disputes**:
   - Entirely missing models: `Dispute`, `DisputeMessage`, `DisputeAttachment`.
   - Need a new tab in Admin Requests Inbox.
   - Need worker dispute initiation UI and detail view.

3. **Financial Integrity**:
   - Need to expand `TransactionType` enum.
   - Need atomic resolution logic in `RequestsService`.
   - Idempotency keys must be unique per resolution event.

4. **UI/UX**:
   - Admin: Add "Disputes" tab to `/admin/requests`.
   - Worker: Add "Cancel" and "Dispute" buttons to `/worker/jobs/[id]`.
   - Worker: Create `/worker/disputes` list and detail page.
