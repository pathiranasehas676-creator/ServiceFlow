# Request Management System - Architecture Overview

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  /admin/requests (Main Page)                                     │   │
│  │  ┌──────────┬──────────┬──────────┬──────────┐                  │   │
│  │  │  Proofs  │ Payouts  │   IDs    │ Tickets  │ (Tabs)           │   │
│  │  └──────────┴──────────┴──────────┴──────────┘                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│           │              │              │              │                 │
│           ▼              ▼              ▼              ▼                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │   Proof     │ │   Payout    │ │Verification │ │   Ticket    │      │
│  │ Approvals   │ │  Requests   │ │  Requests   │ │    Tab      │      │
│  │    Tab      │ │     Tab     │ │     Tab     │ │             │      │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘      │
│           │              │              │              │                 │
│           └──────────────┴──────────────┴──────────────┘                │
│                              │                                           │
│                              ▼                                           │
│                   ┌──────────────────────┐                              │
│                   │  React Query Hooks   │                              │
│                   │  (use-requests.ts)   │                              │
│                   └──────────────────────┘                              │
│                              │                                           │
└──────────────────────────────┼───────────────────────────────────────────┘
                               │
                               │ HTTP/REST API
                               │
┌──────────────────────────────┼───────────────────────────────────────────┐
│                              ▼                                            │
│                   ┌──────────────────────┐                               │
│                   │  API Gateway         │                               │
│                   │  (NestJS)            │                               │
│                   └──────────────────────┘                               │
│                              │                                            │
│                              ▼                                            │
│                   ┌──────────────────────┐                               │
│                   │  Auth Middleware     │                               │
│                   │  - JWT Validation    │                               │
│                   │  - RBAC Guards       │                               │
│                   │  - Permissions       │                               │
│                   └──────────────────────┘                               │
│                              │                                            │
│                              ▼                                            │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │           RequestsController (requests.controller.ts)             │  │
│  │  ┌──────────┬──────────┬──────────┬──────────┐                   │  │
│  │  │  Proofs  │ Payouts  │   IDs    │ Tickets  │ (Endpoints)       │  │
│  │  └──────────┴──────────┴──────────┴──────────┘                   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                              │                                            │
│                              ▼                                            │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │            RequestsService (requests.service.ts)                  │  │
│  │                                                                    │  │
│  │  ┌──────────────────┐  ┌──────────────────┐                      │  │
│  │  │ Proof Approval   │  │ Payout Approval  │                      │  │
│  │  │ - Approve        │  │ - Approve        │                      │  │
│  │  │ - Reject         │  │ - Reject         │                      │  │
│  │  │ - Credit Wallet  │  │ - Mark Paid      │                      │  │
│  │  └──────────────────┘  └──────────────────┘                      │  │
│  │                                                                    │  │
│  │  ┌──────────────────┐  ┌──────────────────┐                      │  │
│  │  │ ID Verification  │  │ Support Tickets  │                      │  │
│  │  │ - Approve        │  │ - Reply          │                      │  │
│  │  │ - Reject         │  │ - Close          │                      │  │
│  │  │ - Update Profile │  │ - Update Status  │                      │  │
│  │  └──────────────────┘  └──────────────────┘                      │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                              │                                            │
│                              ▼                                            │
│                   ┌──────────────────────┐                               │
│                   │   Prisma Service     │                               │
│                   │   (ORM Layer)        │                               │
│                   └──────────────────────┘                               │
│                              │                                            │
└──────────────────────────────┼────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                      DATABASE (PostgreSQL)                                │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │    Job      │  │   Payout    │  │     ID      │  │   Support   │   │
│  │             │  │   Request   │  │Verification │  │   Ticket    │   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │
│                                                                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │   Wallet    │  │ Transaction │  │   Worker    │  │    User     │   │
│  │             │  │             │  │   Profile   │  │             │   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │              AdminAuditLog (Append-Only)                         │   │
│  │  - All approve/reject/update actions                             │   │
│  │  - Actor, timestamp, old/new values                              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### 1. Proof Approval Flow

```
Worker                Admin                 Backend                Database
  │                     │                      │                      │
  │  Submit Proof       │                      │                      │
  ├────────────────────►│                      │                      │
  │                     │                      │                      │
  │                     │  View Proof Request  │                      │
  │                     ├─────────────────────►│                      │
  │                     │                      │  Query Job + Proofs  │
  │                     │                      ├─────────────────────►│
  │                     │                      │◄─────────────────────┤
  │                     │◄─────────────────────┤                      │
  │                     │                      │                      │
  │                     │  Approve Proof       │                      │
  │                     ├─────────────────────►│                      │
  │                     │                      │  BEGIN TRANSACTION   │
  │                     │                      ├─────────────────────►│
  │                     │                      │  1. Update Job       │
  │                     │                      ├─────────────────────►│
  │                     │                      │  2. Credit Wallet    │
  │                     │                      ├─────────────────────►│
  │                     │                      │  3. Create Txn       │
  │                     │                      ├─────────────────────►│
  │                     │                      │  4. Create Audit Log │
  │                     │                      ├─────────────────────►│
  │                     │                      │  COMMIT              │
  │                     │                      ├─────────────────────►│
  │                     │◄─────────────────────┤                      │
  │  Notification       │                      │                      │
  │◄────────────────────┤                      │                      │
```

### 2. Payout Workflow

```
Worker                Admin                 Backend                Database
  │                     │                      │                      │
  │  Request Payout     │                      │                      │
  ├────────────────────►│                      │                      │
  │                     │                      │  Create Payout       │
  │                     │                      │  (PENDING)           │
  │                     │                      ├─────────────────────►│
  │                     │                      │                      │
  │                     │  Approve Payout      │                      │
  │                     ├─────────────────────►│                      │
  │                     │                      │  Update Status       │
  │                     │                      │  (APPROVED)          │
  │                     │                      ├─────────────────────►│
  │                     │                      │                      │
  │                     │  Mark as Paid        │                      │
  │                     │  (with receipt)      │                      │
  │                     ├─────────────────────►│                      │
  │                     │                      │  BEGIN TRANSACTION   │
  │                     │                      ├─────────────────────►│
  │                     │                      │  1. Update Payout    │
  │                     │                      ├─────────────────────►│
  │                     │                      │  2. Create Receipt   │
  │                     │                      ├─────────────────────►│
  │                     │                      │  3. Deduct Balance   │
  │                     │                      ├─────────────────────►│
  │                     │                      │  4. Create Txn       │
  │                     │                      ├─────────────────────►│
  │                     │                      │  5. Create Audit Log │
  │                     │                      ├─────────────────────►│
  │                     │                      │  COMMIT              │
  │                     │                      ├─────────────────────►│
  │  Notification       │                      │                      │
  │◄────────────────────┤                      │                      │
```

## Component Hierarchy

```
AdminRequestsPage
├── Tabs
│   ├── ProofApprovalsTab
│   │   ├── SearchInput
│   │   ├── StatusFilter
│   │   ├── DataTable
│   │   │   ├── TableRow (multiple)
│   │   │   │   ├── ViewButton
│   │   │   │   ├── ApproveButton
│   │   │   │   └── RejectButton
│   │   │   └── Pagination
│   │   ├── ViewDetailsDialog
│   │   ├── ApproveDialog
│   │   └── RejectDialog
│   │
│   ├── PayoutRequestsTab
│   │   ├── SearchInput
│   │   ├── StatusFilter
│   │   ├── DataTable
│   │   │   ├── TableRow (multiple)
│   │   │   │   ├── ViewButton
│   │   │   │   ├── ApproveButton
│   │   │   │   ├── RejectButton
│   │   │   │   └── MarkPaidButton
│   │   │   └── Pagination
│   │   ├── ViewDetailsDialog
│   │   ├── ApproveDialog
│   │   ├── RejectDialog
│   │   └── MarkPaidDialog
│   │
│   ├── VerificationRequestsTab
│   │   ├── SearchInput
│   │   ├── StatusFilter
│   │   ├── DataTable
│   │   │   ├── TableRow (multiple)
│   │   │   │   ├── ViewButton
│   │   │   │   ├── ApproveButton
│   │   │   │   └── RejectButton
│   │   │   └── Pagination
│   │   ├── ViewDetailsDialog
│   │   ├── ApproveDialog
│   │   └── RejectDialog
│   │
│   └── SupportTicketsTab
│       ├── SearchInput
│       ├── StatusFilter
│       ├── DataTable
│       │   ├── TableRow (multiple)
│       │   │   ├── ViewButton
│       │   │   ├── ReplyButton
│       │   │   └── CloseButton
│       │   └── Pagination
│       ├── ViewDetailsDialog
│       │   └── MessageThread
│       │       └── Message (multiple)
│       ├── ReplyDialog
│       └── CloseDialog
```

## State Management

```
React Query Cache
├── ['admin', 'requests', 'proofs', params]
│   └── { data: ProofRequest[], meta: PaginationMeta }
│
├── ['admin', 'requests', 'payouts', params]
│   └── { data: PayoutRequest[], meta: PaginationMeta }
│
├── ['admin', 'requests', 'verifications', params]
│   └── { data: VerificationRequest[], meta: PaginationMeta }
│
└── ['admin', 'requests', 'tickets', params]
    └── { data: SupportTicket[], meta: PaginationMeta }

Component State (per tab)
├── page (number)
├── status (string)
├── searchQuery (string)
├── selectedItem (object | null)
├── actionDialog ('approve' | 'reject' | 'mark-paid' | 'reply' | 'close' | null)
└── form fields (reason, note, receiptKey, etc.)
```

## Security Layers

```
Request Flow with Security Checks
────────────────────────────────

1. HTTP Request
   │
   ▼
2. JWT Authentication Guard
   │ ✓ Valid token?
   │ ✓ Not expired?
   │ ✓ Valid signature?
   │
   ▼
3. Roles Guard
   │ ✓ User has ADMIN or STAFF role?
   │
   ▼
4. Permissions Guard
   │ ✓ User has required permission?
   │   (VIEW_JOBS, APPROVE_PROOFS, etc.)
   │
   ▼
5. Controller Method
   │ ✓ Input validation (DTOs)
   │
   ▼
6. Service Layer
   │ ✓ Business logic validation
   │ ✓ State transition checks
   │ ✓ Ownership verification
   │
   ▼
7. Database Transaction
   │ ✓ Atomic operations
   │ ✓ Audit log creation
   │
   ▼
8. Response
```

## Database Transaction Patterns

### Proof Approval Transaction
```sql
BEGIN;
  -- 1. Update job status
  UPDATE jobs SET status = 'APPROVED', completed_at = NOW() WHERE id = ?;
  
  -- 2. Create status history
  INSERT INTO job_status_history (...) VALUES (...);
  
  -- 3. Credit wallet
  UPDATE wallets SET available_balance = available_balance + ? WHERE id = ?;
  
  -- 4. Create transaction record
  INSERT INTO transactions (type, amount, ...) VALUES ('CREDIT', ?, ...);
  
  -- 5. Create audit log
  INSERT INTO admin_audit_logs (...) VALUES (...);
COMMIT;
```

### Payout Mark Paid Transaction
```sql
BEGIN;
  -- 1. Update payout status
  UPDATE payout_requests SET status = 'PAID', paid_at = NOW() WHERE id = ?;
  
  -- 2. Create receipt
  INSERT INTO payout_receipts (...) VALUES (...);
  
  -- 3. Deduct from pending balance
  UPDATE wallets SET pending_balance = pending_balance - ? WHERE id = ?;
  
  -- 4. Create transaction record
  INSERT INTO transactions (type, amount, ...) VALUES ('DEBIT', ?, ...);
  
  -- 5. Create audit log
  INSERT INTO admin_audit_logs (...) VALUES (...);
COMMIT;
```

## Error Handling Strategy

```
Error Propagation Chain
───────────────────────

Backend:
  Database Error
       │
       ▼
  Prisma Exception
       │
       ▼
  Service Layer
       │ Transform to business error
       ▼
  Controller
       │ Map to HTTP status
       ▼
  Global Exception Filter
       │ Sanitize error message
       ▼
  HTTP Response

Frontend:
  HTTP Error Response
       │
       ▼
  React Query
       │ Retry logic (3x)
       ▼
  onError Callback
       │ Extract error message
       ▼
  Toast Notification
       │
       ▼
  User sees friendly error
```

## Performance Optimization Points

1. **Database Level**
   - Indexes on frequently queried fields
   - Efficient joins with Prisma includes
   - Pagination with skip/take

2. **Backend Level**
   - Response caching (future)
   - Query result memoization
   - Batch operations (future)

3. **Frontend Level**
   - React Query caching
   - Optimistic updates
   - Lazy loading of tabs
   - Debounced search (future)

4. **Network Level**
   - HTTP/2 multiplexing
   - Compression (gzip)
   - CDN for static assets (production)

## Monitoring & Observability

```
Audit Trail
───────────
AdminAuditLog table captures:
- Who (actorId, actorEmail)
- What (action, entityType, entityId)
- When (createdAt)
- Where (ipAddress, userAgent)
- Changes (oldValue, newValue as JSON)

Metrics to Track (Future)
─────────────────────────
- Average approval time per request type
- Rejection rates
- Admin response time
- Request volume by hour/day
- Most active admins
- Most common rejection reasons
```

## Deployment Architecture

```
Production Environment
──────────────────────

┌─────────────────────────────────────────┐
│           Load Balancer (Nginx)          │
│              SSL Termination             │
└─────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌──────────────┐        ┌──────────────┐
│   Frontend   │        │   Backend    │
│  (Next.js)   │        │  (NestJS)    │
│   Port 3000  │        │   Port 3001  │
└──────────────┘        └──────────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
                    ▼                       ▼
            ┌──────────────┐        ┌──────────────┐
            │  PostgreSQL  │        │    MinIO     │
            │   Port 5432  │        │   Port 9000  │
            └──────────────┘        └──────────────┘
```

## Future Enhancements Roadmap

**Phase 1: Core Improvements**
- Bulk actions (select multiple, approve/reject all)
- Advanced filters (date range, amount range)
- CSV export functionality

**Phase 2: Real-time Features**
- WebSocket notifications for new requests
- Live updates when other admins take actions
- Real-time message threads in tickets

**Phase 3: Analytics & Reporting**
- Request processing dashboard
- SLA tracking and alerts
- Performance metrics per admin
- Trend analysis

**Phase 4: Automation**
- Auto-approve based on rules
- Auto-escalate tickets
- Scheduled reports
- Email notifications

**Phase 5: Advanced Features**
- AI-assisted rejection reason suggestions
- Fraud detection for payouts
- Document OCR for ID verification
- Chatbot for ticket responses
