# Request Management System - Manual Testing Checklist

## Prerequisites
- [ ] Backend server running on `http://localhost:3001`
- [ ] Frontend server running on `http://localhost:3000`
- [ ] Database seeded with test data
- [ ] Admin user account created
- [ ] Staff user account created
- [ ] Worker accounts with various request states

## Test Environment Setup

### Create Test Data
```sql
-- Create test workers with different verification statuses
-- Create test jobs in PROOF_SUBMITTED status
-- Create test payout requests in various statuses
-- Create test ID verifications in PENDING status
-- Create test support tickets with messages
```

## 1. Proof Approvals Testing

### 1.1 List View
- [ ] Navigate to `/admin/requests` and verify Proof Approvals tab is active by default
- [ ] Verify table displays: Job title, Worker name/email, Service, Amount, Proof count, Status, Updated time
- [ ] Verify default filter shows only PROOF_SUBMITTED jobs
- [ ] Verify pagination works correctly (if >20 results)
- [ ] Verify "Showing X to Y of Z results" text is accurate

### 1.2 Search & Filters
- [ ] Search by job title - verify results update
- [ ] Search by worker name - verify results update
- [ ] Search by worker email - verify results update
- [ ] Change status filter to "Approved" - verify only approved jobs shown
- [ ] Change status filter to "All Statuses" - verify all jobs shown
- [ ] Clear search - verify full list returns

### 1.3 View Details
- [ ] Click "Eye" icon on a proof request
- [ ] Verify modal shows: Job details, Worker info, Service, Amount, Status, Description
- [ ] Verify proof images are displayed (or placeholders if not loaded)
- [ ] Verify image captions are shown if available
- [ ] Close modal and verify it closes properly

### 1.4 Approve Proof
- [ ] Click "Approve" button on a PROOF_SUBMITTED job
- [ ] Verify approve dialog opens
- [ ] Add optional note and click "Approve"
- [ ] Verify success toast appears
- [ ] Verify job status changes to APPROVED in list
- [ ] Verify job disappears from PROOF_SUBMITTED filter
- [ ] Check database: Verify wallet was credited
- [ ] Check database: Verify transaction record created
- [ ] Check database: Verify audit log entry created
- [ ] Check database: Verify job status history entry created

### 1.5 Reject Proof
- [ ] Click "Reject" button on a PROOF_SUBMITTED job
- [ ] Verify reject dialog opens
- [ ] Try to submit without reason - verify validation error
- [ ] Add rejection reason and optional note
- [ ] Click "Reject"
- [ ] Verify success toast appears
- [ ] Verify job status changes back to ACCEPTED
- [ ] Check database: Verify `rejectionReason` field is populated
- [ ] Check database: Verify `resubmitDeadline` is set to 48h from now
- [ ] Check database: Verify audit log entry created

### 1.6 Error Handling
- [ ] Try to approve an already approved job - verify error message
- [ ] Try to approve a job that doesn't exist - verify 404 error
- [ ] Disconnect network and try to approve - verify error toast

## 2. Payout Requests Testing

### 2.1 List View
- [ ] Switch to "Payout Requests" tab
- [ ] Verify table displays: Worker, Amount, Type, Bank details (masked), Status, Requested time
- [ ] Verify default filter shows only PENDING payouts
- [ ] Verify bank account numbers are masked (****1234)
- [ ] Verify pagination works correctly

### 2.2 Search & Filters
- [ ] Search by worker name - verify results update
- [ ] Search by worker email - verify results update
- [ ] Filter by "Approved" status - verify only approved payouts shown
- [ ] Filter by "Paid" status - verify only paid payouts shown
- [ ] Filter by "Rejected" status - verify only rejected payouts shown

### 2.3 View Details
- [ ] Click "Eye" icon on a payout request
- [ ] Verify modal shows: Worker info, Amount, Type, Status
- [ ] Verify bank details section shows: Bank name, Account name, Masked account number, Branch code
- [ ] Verify rejection reason is shown if payout was rejected
- [ ] Close modal

### 2.4 Approve Payout
- [ ] Click "Approve" button on a PENDING payout
- [ ] Add optional note and click "Approve"
- [ ] Verify success toast appears
- [ ] Verify payout status changes to APPROVED
- [ ] Verify "Mark Paid" button appears
- [ ] Check database: Verify `reviewedBy` and `reviewedAt` are set
- [ ] Check database: Verify audit log entry created

### 2.5 Reject Payout
- [ ] Click "Reject" button on a PENDING payout
- [ ] Try to submit without reason - verify validation error
- [ ] Add rejection reason and click "Reject"
- [ ] Verify success toast appears
- [ ] Verify payout status changes to REJECTED
- [ ] Check database: Verify funds returned to available balance
- [ ] Check database: Verify pending balance decreased
- [ ] Check database: Verify audit log entry created

### 2.6 Mark as Paid
- [ ] Click "Mark Paid" button on an APPROVED payout
- [ ] Try to submit without receipt file key - verify validation error
- [ ] Enter receipt file key (e.g., "receipts/test-receipt.pdf")
- [ ] Enter optional transaction reference
- [ ] Click "Mark as Paid"
- [ ] Verify success toast appears
- [ ] Verify payout status changes to PAID
- [ ] Check database: Verify `paidAt` timestamp is set
- [ ] Check database: Verify `PayoutReceipt` record created
- [ ] Check database: Verify pending balance decreased
- [ ] Check database: Verify transaction record created (DEBIT type)
- [ ] Check database: Verify audit log entry created

### 2.7 Error Handling
- [ ] Try to approve an already approved payout - verify error
- [ ] Try to mark a PENDING payout as paid - verify error (must be approved first)
- [ ] Try to reject an already rejected payout - verify error

## 3. ID Verifications Testing

### 3.1 List View
- [ ] Switch to "ID Verifications" tab
- [ ] Verify table displays: Worker, Document type, Document number, Status, Submitted time
- [ ] Verify default filter shows only PENDING verifications
- [ ] Verify document types are shown as badges

### 3.2 Search & Filters
- [ ] Search by worker name - verify results update
- [ ] Search by worker email - verify results update
- [ ] Filter by "Approved" status
- [ ] Filter by "Rejected" status
- [ ] Filter by "All Statuses"

### 3.3 View Details
- [ ] Click "Eye" icon on a verification request
- [ ] Verify modal shows: Worker info, Document type, Document number, Status
- [ ] Verify ID document placeholders are shown (front and back if available)
- [ ] Verify rejection reason is shown if verification was rejected
- [ ] Close modal

### 3.4 Approve Verification
- [ ] Click "Approve" button on a PENDING verification
- [ ] Add optional note and click "Approve"
- [ ] Verify success toast appears
- [ ] Verify verification status changes to APPROVED
- [ ] Check database: Verify `IdVerification.status` = APPROVED
- [ ] Check database: Verify `WorkerProfile.verificationStatus` = APPROVED
- [ ] Check database: Verify `WorkerProfile.verifiedAt` is set
- [ ] Check database: Verify audit log entry created

### 3.5 Reject Verification
- [ ] Click "Reject" button on a PENDING verification
- [ ] Try to submit without reason - verify validation error
- [ ] Add rejection reason (e.g., "Document is blurry") and click "Reject"
- [ ] Verify success toast appears
- [ ] Verify verification status changes to REJECTED
- [ ] Check database: Verify `IdVerification.status` = REJECTED
- [ ] Check database: Verify `WorkerProfile.verificationStatus` = REJECTED
- [ ] Check database: Verify `rejectionReason` is populated
- [ ] Check database: Verify audit log entry created

### 3.6 Error Handling
- [ ] Try to approve an already approved verification - verify error
- [ ] Try to approve a non-existent verification - verify 404 error

## 4. Support Tickets Testing

### 4.1 List View
- [ ] Switch to "Support Tickets" tab
- [ ] Verify table displays: Ticket #, Subject, User, Priority, Message count, Status, Updated time
- [ ] Verify default filter shows only OPEN tickets
- [ ] Verify priority badges are color-coded (LOW=secondary, MEDIUM=outline, HIGH=default, URGENT=destructive)
- [ ] Verify message count icon and number are shown

### 4.2 Search & Filters
- [ ] Search by ticket number - verify results update
- [ ] Search by subject - verify results update
- [ ] Search by user name - verify results update
- [ ] Filter by "In Progress" status
- [ ] Filter by "Resolved" status
- [ ] Filter by "Closed" status
- [ ] Filter by "All Statuses"

### 4.3 View Details
- [ ] Click "Eye" icon on a ticket
- [ ] Verify modal shows: Ticket number, Subject, User info, Category, Priority, Status
- [ ] Verify message thread is displayed in chronological order
- [ ] Verify each message shows: Sender name, Role badge, Timestamp, Content
- [ ] Verify scroll area works for long message threads
- [ ] Close modal

### 4.4 Reply to Ticket
- [ ] Click "Reply" button on an OPEN ticket
- [ ] Try to submit without message - verify validation error
- [ ] Type a reply message
- [ ] Check "Internal note" checkbox
- [ ] Click "Send Reply"
- [ ] Verify success toast appears
- [ ] Verify message count increases
- [ ] Check database: Verify `TicketMessage` record created
- [ ] Check database: Verify `isInternal` flag is set correctly
- [ ] Check database: Verify audit log entry created
- [ ] Verify ticket status changes to IN_PROGRESS if it was CLOSED

### 4.5 Close Ticket
- [ ] Click "Close Ticket" button on an OPEN ticket
- [ ] Verify confirmation dialog appears
- [ ] Click "Close Ticket"
- [ ] Verify success toast appears
- [ ] Verify ticket status changes to CLOSED
- [ ] Verify "Reply" and "Close" buttons are hidden for closed tickets
- [ ] Check database: Verify `closedAt` timestamp is set
- [ ] Check database: Verify audit log entry created

### 4.6 Error Handling
- [ ] Try to close an already closed ticket - verify error
- [ ] Try to reply to a non-existent ticket - verify 404 error

## 5. Cross-Tab Testing

### 5.1 Tab Switching
- [ ] Switch between all 4 tabs rapidly - verify no errors
- [ ] Verify each tab maintains its own state (filters, search, page)
- [ ] Verify tab content loads correctly each time

### 5.2 Data Refresh
- [ ] Approve a proof in tab 1
- [ ] Switch to another tab and back - verify data is refreshed
- [ ] Verify React Query cache invalidation works correctly

## 6. Permissions & Security Testing

### 6.1 RBAC
- [ ] Login as ADMIN - verify access to all request types
- [ ] Login as STAFF - verify access to all request types
- [ ] Login as WORKER - verify no access to `/admin/requests` (should redirect or 403)
- [ ] Login as USER - verify no access to `/admin/requests`

### 6.2 Permission-Specific Actions
- [ ] Create a STAFF user without `APPROVE_PROOFS` permission
- [ ] Verify they can view proofs but cannot approve/reject
- [ ] Create a STAFF user without `APPROVE_PAYOUTS` permission
- [ ] Verify they can view payouts but cannot approve/reject/mark-paid

### 6.3 Audit Logs
- [ ] Perform various actions (approve, reject, reply, close)
- [ ] Query `AdminAuditLog` table
- [ ] Verify all actions are logged with:
  - Correct `actorId`
  - Correct `action` (APPROVE, REJECT, UPDATE)
  - Correct `entityType` and `entityId`
  - `oldValue` and `newValue` JSON
  - Timestamp

## 7. Edge Cases & Error Scenarios

### 7.1 Concurrent Actions
- [ ] Open same proof in two browser tabs
- [ ] Approve in tab 1
- [ ] Try to approve in tab 2 - verify error handling

### 7.2 Network Issues
- [ ] Disconnect network
- [ ] Try to perform any action
- [ ] Verify error toast appears
- [ ] Reconnect network
- [ ] Verify retry works

### 7.3 Invalid Data
- [ ] Try to approve a job with no proofs - verify error
- [ ] Try to mark payout paid with empty receipt key - verify validation
- [ ] Try to reject without reason - verify validation

### 7.4 Large Datasets
- [ ] Create 100+ proof requests
- [ ] Verify pagination works correctly
- [ ] Verify search performance is acceptable
- [ ] Verify no UI lag or freezing

## 8. UI/UX Testing

### 8.1 Responsive Design
- [ ] Test on desktop (1920x1080)
- [ ] Test on tablet (768x1024)
- [ ] Test on mobile (375x667)
- [ ] Verify tables are scrollable on small screens
- [ ] Verify modals are properly sized on all devices

### 8.2 Loading States
- [ ] Verify skeleton loaders appear while data is loading
- [ ] Verify buttons show spinner during async operations
- [ ] Verify buttons are disabled during async operations

### 8.3 Empty States
- [ ] Filter to a status with no results
- [ ] Verify "No X found" message appears
- [ ] Verify message is centered and styled correctly

### 8.4 Accessibility
- [ ] Navigate using keyboard only (Tab, Enter, Esc)
- [ ] Verify all interactive elements are focusable
- [ ] Verify modals trap focus correctly
- [ ] Verify Esc key closes modals

## 9. Performance Testing

### 9.1 Initial Load
- [ ] Clear browser cache
- [ ] Navigate to `/admin/requests`
- [ ] Measure time to first meaningful paint
- [ ] Verify < 2 seconds on good connection

### 9.2 Subsequent Loads
- [ ] Switch between tabs
- [ ] Verify React Query cache is used (instant load)
- [ ] Verify no unnecessary API calls

### 9.3 Search Performance
- [ ] Type in search box
- [ ] Verify debouncing (if implemented)
- [ ] Verify search completes in < 500ms

## 10. Integration Testing

### 10.1 End-to-End Workflow: Proof Approval
1. [ ] Worker submits job proof
2. [ ] Admin sees proof in PROOF_SUBMITTED filter
3. [ ] Admin approves proof
4. [ ] Worker wallet is credited
5. [ ] Worker sees updated balance
6. [ ] Transaction appears in worker's transaction history
7. [ ] Audit log entry is created

### 10.2 End-to-End Workflow: Payout
1. [ ] Worker requests payout
2. [ ] Admin sees payout in PENDING filter
3. [ ] Admin approves payout
4. [ ] Admin marks payout as paid with receipt
5. [ ] Worker sees payout as PAID
6. [ ] Worker's pending balance is reduced
7. [ ] Transaction record is created
8. [ ] Audit log entries are created

### 10.3 End-to-End Workflow: ID Verification
1. [ ] Worker submits ID documents
2. [ ] Admin sees verification in PENDING filter
3. [ ] Admin approves verification
4. [ ] Worker profile verification status updates
5. [ ] Worker can now request payouts (if previously blocked)
6. [ ] Audit log entry is created

### 10.4 End-to-End Workflow: Support Ticket
1. [ ] User creates support ticket
2. [ ] Admin sees ticket in OPEN filter
3. [ ] Admin replies to ticket
4. [ ] User receives notification (if implemented)
5. [ ] User replies back
6. [ ] Admin sees updated message count
7. [ ] Admin closes ticket
8. [ ] Ticket moves to CLOSED status
9. [ ] Audit log entries are created

## Test Results Summary

| Category | Total Tests | Passed | Failed | Notes |
|----------|-------------|--------|--------|-------|
| Proof Approvals | | | | |
| Payout Requests | | | | |
| ID Verifications | | | | |
| Support Tickets | | | | |
| Cross-Tab | | | | |
| Permissions | | | | |
| Edge Cases | | | | |
| UI/UX | | | | |
| Performance | | | | |
| Integration | | | | |
| **TOTAL** | | | | |

## Critical Issues Found
1. 
2. 
3. 

## Minor Issues Found
1. 
2. 
3. 

## Recommendations
1. 
2. 
3. 
