# ServiceFlow Database Documentation

## 📊 Database Overview

**Database**: PostgreSQL 16+  
**ORM**: Prisma  
**Primary Keys**: UUID  
**Money Storage**: Integer cents (avoid float precision issues)  
**Timestamps**: Automatic `createdAt` and `updatedAt`

---

## 🗂️ Entity Relationship Summary

### Core Entities (18 tables)

1. **users** - Core user accounts (all roles)
2. **refresh_tokens** - JWT refresh token management
3. **worker_profiles** - Worker-specific data
4. **bank_details** - Worker banking information (encrypted)
5. **id_verifications** - Government ID verification records
6. **services** - Service catalog
7. **jobs** - Job postings and assignments
8. **job_status_history** - Immutable job status tracking
9. **job_proofs** - Proof of completion images
10. **ratings** - Job completion ratings
11. **wallets** - User wallet balances
12. **transactions** - Wallet transaction history
13. **payout_requests** - Worker payout requests
14. **payout_receipts** - Admin payout receipts
15. **support_tickets** - Customer support tickets
16. **ticket_messages** - Ticket conversation threads
17. **notifications** - User notifications
18. **admin_audit_logs** - Immutable admin action logs
19. **system_config** - System configuration key-value store

---

## 📋 Enums

```typescript
UserRole: USER | WORKER | STAFF | ADMIN
VerificationStatus: NOT_SUBMITTED | PENDING | APPROVED | REJECTED
JobStatus: POSTED | ACCEPTED | ARRIVED | PROOF_SUBMITTED | APPROVED | COMPLETED | CANCELLED
TransactionType: CREDIT | DEBIT | REFUND | ADJUSTMENT
PayoutStatus: PENDING | APPROVED | PROCESSING | PAID | REJECTED | FAILED
TicketStatus: OPEN | IN_PROGRESS | RESOLVED | CLOSED
TicketPriority: LOW | MEDIUM | HIGH | URGENT
NotificationType: JOB_ASSIGNED | JOB_ACCEPTED | PROOF_APPROVED | PROOF_REJECTED | PAYOUT_APPROVED | PAYOUT_PAID | TICKET_REPLY | SYSTEM_ALERT
AuditAction: CREATE | UPDATE | DELETE | APPROVE | REJECT | LOGIN | LOGOUT | EXPORT
```

---

## 🔐 Security Features

### 1. Password Hashing
- **Algorithm**: Argon2 (implemented in application layer)
- **Storage**: `passwordHash` field (VARCHAR 255)

### 2. Refresh Token Security
- **Storage**: Hashed tokens only (`tokenHash`)
- **Rotation**: `replacedBy` field for token rotation
- **Revocation**: `revoked` boolean + `revokedAt` timestamp
- **Device Tracking**: `ipAddress`, `userAgent`, `deviceId`

### 3. Account Lockout
- **Fields**: `failedLoginAttempts`, `lockoutUntil`
- **Logic**: Implemented in application layer

### 4. Bank Details Encryption
- **Field**: `accountNumber` (VARCHAR 255)
- **⚠️ CRITICAL**: Encrypt in application layer before storing
- **Recommendation**: Use AES-256-GCM with key rotation

### 5. Soft Delete
- **Fields**: `deletedAt` (DateTime?)
- **Applied to**: users, services
- **Note**: Historical references remain intact

### 6. Audit Logs
- **Immutability**: No updates or deletes allowed
- **Append-only**: Only INSERT operations
- **Denormalization**: `actorEmail` stored for history

---

## 🔍 Indexing Strategy

### High-Priority Indexes (Already in Schema)

```sql
-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_active ON users(role, is_active);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Worker Profiles
CREATE INDEX idx_worker_profiles_verification_status ON worker_profiles(verification_status);
CREATE INDEX idx_worker_profiles_online_available ON worker_profiles(is_online, is_available);
CREATE INDEX idx_worker_profiles_district ON worker_profiles(district);
CREATE INDEX idx_worker_profiles_rating ON worker_profiles(rating);

-- Jobs
CREATE INDEX idx_jobs_status_created ON jobs(status, created_at);
CREATE INDEX idx_jobs_service_status ON jobs(service_id, status);
CREATE INDEX idx_jobs_worker_status ON jobs(worker_id, status);
CREATE INDEX idx_jobs_district_status ON jobs(district, status);

-- ID Verifications
CREATE INDEX idx_id_verifications_status_submitted ON id_verifications(status, submitted_at);

-- Payout Requests
CREATE INDEX idx_payout_requests_wallet_status ON payout_requests(wallet_id, status);
CREATE INDEX idx_payout_requests_status_created ON payout_requests(status, created_at);

-- Support Tickets
CREATE INDEX idx_support_tickets_status_created ON support_tickets(status, created_at);

-- Audit Logs
CREATE INDEX idx_audit_logs_actor_created ON admin_audit_logs(actor_id, created_at);
CREATE INDEX idx_audit_logs_entity ON admin_audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action_created ON admin_audit_logs(action, created_at);
CREATE INDEX idx_audit_logs_created ON admin_audit_logs(created_at);

-- Notifications
CREATE INDEX idx_notifications_user_read_created ON notifications(user_id, is_read, created_at);

-- Transactions
CREATE INDEX idx_transactions_wallet_created ON transactions(wallet_id, created_at);
CREATE INDEX idx_transactions_reference ON transactions(reference_type, reference_id);
```

### Composite Index Recommendations

```sql
-- For worker job search with filters
CREATE INDEX idx_jobs_composite_search ON jobs(status, district, service_id, created_at);

-- For admin dashboard queries
CREATE INDEX idx_jobs_admin_dashboard ON jobs(status, created_at DESC) WHERE status IN ('PROOF_SUBMITTED', 'POSTED');

-- For wallet balance queries
CREATE INDEX idx_wallets_balance ON wallets(available_balance_cents DESC);
```

---

## 🚀 Migration & Setup Commands

### 1. Install Dependencies

```bash
cd backend
npm install prisma @prisma/client argon2
npm install -D ts-node @types/node
```

### 2. Environment Setup

Create `.env` file:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/serviceflow?schema=public"
```

### 3. Generate Prisma Client

```bash
npx prisma generate
```

### 4. Create Initial Migration

```bash
npx prisma migrate dev --name init
```

### 5. Run Seed Script

```bash
npx prisma db seed
```

Or manually:

```bash
npx ts-node prisma/seed.ts
```

### 6. Reset Database (Development Only)

```bash
npx prisma migrate reset
```

This will:
1. Drop the database
2. Create a new database
3. Run all migrations
4. Run seed script

---

## 📊 Key Relationships Explained

### User → Worker Profile (1:0..1)
- One user can have zero or one worker profile
- Worker profile is created when user upgrades to WORKER role
- Cascade delete: If user is deleted, worker profile is also deleted

### Worker Profile → Bank Details (1:0..1)
- One worker can have zero or one bank account
- Required for payout processing
- Cascade delete with worker profile

### Job → Job Status History (1:many)
- **Immutable**: Never update or delete status history
- Tracks complete job lifecycle
- Used for analytics and dispute resolution

### Wallet → Transactions (1:many)
- All balance changes must create a transaction record
- `balanceAfterCents` provides audit trail
- Never delete transactions

### Payout Request → Payout Receipt (1:0..1)
- Receipt uploaded by admin after payment
- Proof of payment for worker

### Support Ticket → Ticket Messages (1:many)
- Threaded conversation
- `isInternal` flag for staff-only notes

---

## 💰 Money Handling

### Storage Format
- **All amounts in cents** (integer)
- Example: $150.00 = 15000 cents
- Avoids floating-point precision errors

### Conversion Helpers

```typescript
// Application layer helpers
function centsToD ollars(cents: number): number {
  return cents / 100;
}

function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}
```

### Wallet Balance Rules

```typescript
availableBalanceCents: Immediately withdrawable
pendingBalanceCents: Locked until job completion
totalEarnedCents: Lifetime earnings (never decreases)
```

---

## 🔒 Data Constraints

### Unique Constraints
- `users.email` - Unique
- `users.phoneNumber` - Unique (nullable)
- `services.name` - Unique
- `supportTickets.ticketNumber` - Unique
- `refreshTokens.tokenHash` - Unique

### Required Fields
- All `id` fields (UUID, auto-generated)
- All `createdAt` fields (auto-generated)
- User: email, passwordHash, fullName, role
- Job: title, description, serviceId, location, priceCents
- Transaction: walletId, type, amountCents

### Cascading Deletes
- User → RefreshTokens (CASCADE)
- User → WorkerProfile (CASCADE)
- WorkerProfile → BankDetails (CASCADE)
- WorkerProfile → IdVerifications (CASCADE)
- Job → JobStatusHistory (CASCADE)
- Job → JobProofs (CASCADE)
- SupportTicket → TicketMessages (CASCADE)

---

## 📈 Query Optimization Examples

### 1. Available Jobs for Worker

```typescript
const availableJobs = await prisma.job.findMany({
  where: {
    status: 'POSTED',
    district: workerDistrict,
    deletedAt: null,
  },
  include: {
    service: true,
    creator: {
      select: { fullName: true, email: true },
    },
  },
  orderBy: { createdAt: 'desc' },
  take: 20,
});
```

**Indexes Used**: `idx_jobs_district_status`, `idx_jobs_status_created`

### 2. Pending Verifications for Admin

```typescript
const pendingVerifications = await prisma.idVerification.findMany({
  where: {
    status: 'PENDING',
  },
  include: {
    workerProfile: {
      include: {
        user: {
          select: { fullName: true, email: true },
        },
      },
    },
  },
  orderBy: { submittedAt: 'asc' },
});
```

**Indexes Used**: `idx_id_verifications_status_submitted`

### 3. Worker Wallet Summary

```typescript
const walletSummary = await prisma.wallet.findUnique({
  where: { userId: workerId },
  include: {
    transactions: {
      orderBy: { createdAt: 'desc' },
      take: 10,
    },
    payoutRequests: {
      where: { status: { in: ['PENDING', 'APPROVED'] } },
    },
  },
});
```

**Indexes Used**: `idx_wallets_user_id`, `idx_transactions_wallet_created`

### 4. Admin Audit Trail

```typescript
const auditLogs = await prisma.adminAuditLog.findMany({
  where: {
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
    action: { in: ['APPROVE', 'REJECT'] },
  },
  include: {
    actor: {
      select: { fullName: true, email: true },
    },
  },
  orderBy: { createdAt: 'desc' },
  take: 100,
});
```

**Indexes Used**: `idx_audit_logs_action_created`, `idx_audit_logs_created`

---

## 🧪 Testing Queries

### Check Database Connection

```typescript
await prisma.$queryRaw`SELECT 1`;
```

### Count Records

```typescript
const counts = {
  users: await prisma.user.count(),
  jobs: await prisma.job.count(),
  transactions: await prisma.transaction.count(),
};
```

### Verify Indexes

```sql
SELECT
  tablename,
  indexname,
  indexdef
FROM
  pg_indexes
WHERE
  schemaname = 'public'
ORDER BY
  tablename,
  indexname;
```

---

## 🛡️ Security Best Practices

### 1. Never Store Plain Text
- ✅ Passwords: Hash with Argon2
- ✅ Refresh Tokens: Hash before storing
- ✅ Bank Account Numbers: Encrypt with AES-256

### 2. Audit Everything
- Log all admin actions to `admin_audit_logs`
- Include IP address and user agent
- Store before/after values for updates

### 3. Soft Delete Strategy
- Use `deletedAt` for users and services
- Keep historical references intact
- Filter `deletedAt IS NULL` in queries

### 4. Rate Limiting (Application Layer)
- Track failed login attempts
- Implement account lockout
- Use `failedLoginAttempts` and `lockoutUntil`

### 5. Data Validation
- Use Prisma schema constraints
- Add application-layer validation (class-validator)
- Validate before database operations

---

## 📝 Maintenance Tasks

### Weekly
- Review audit logs for suspicious activity
- Check for orphaned records
- Monitor database size growth

### Monthly
- Analyze slow queries
- Update statistics: `ANALYZE;`
- Review and optimize indexes

### Quarterly
- Archive old audit logs (>90 days)
- Clean up revoked refresh tokens (>30 days)
- Review and update system configuration

---

## 🔄 Migration Strategy

### Development
```bash
npx prisma migrate dev --name description_of_change
```

### Production
```bash
# 1. Generate migration
npx prisma migrate dev --create-only --name description

# 2. Review generated SQL in prisma/migrations/

# 3. Deploy to production
npx prisma migrate deploy
```

### Rollback (if needed)
```bash
# Manually revert using SQL
psql -U user -d serviceflow -f prisma/migrations/XXXXXX_rollback.sql
```

---

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Best Practices](https://wiki.postgresql.org/wiki/Don%27t_Do_This)
- [Argon2 Password Hashing](https://github.com/ranisalt/node-argon2)

---

## ✅ Checklist for Production

- [ ] Database backups configured (daily)
- [ ] Connection pooling enabled (PgBouncer)
- [ ] SSL/TLS enabled for database connections
- [ ] Bank account numbers encrypted
- [ ] Audit logs retention policy defined
- [ ] Monitoring and alerting configured
- [ ] Indexes reviewed and optimized
- [ ] Query performance tested under load
- [ ] Disaster recovery plan documented
- [ ] Data retention policy implemented
