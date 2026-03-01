# Staff Support Panel - Manual Test Checklist

## Backend API Tests

### 1. Get All Tickets (GET /api/v1/staff/support)
- [ ] Returns paginated list of tickets
- [ ] Includes user name, email, subject, status, createdAt
- [ ] Includes message count (_count.messages)
- [ ] Filter by status works (OPEN, IN_PROGRESS, RESOLVED, CLOSED)
- [ ] Search by user email works
- [ ] Search by subject works
- [ ] Search by ticket number works
- [ ] Pagination works (page, limit)
- [ ] Only accessible by STAFF or ADMIN roles
- [ ] Returns 401 for unauthenticated users
- [ ] Returns 403 for WORKER role

### 2. Get Ticket Details (GET /api/v1/staff/support/:id)
- [ ] Returns full ticket details
- [ ] Includes complete message thread ordered by createdAt ASC
- [ ] Includes user profile summary
- [ ] Each message includes sender info (id, fullName, role)
- [ ] Returns 404 for non-existent ticket
- [ ] Only accessible by STAFF or ADMIN roles

### 3. Reply to Ticket (POST /api/v1/staff/support/:id/reply)
- [ ] Creates new ticket_message record
- [ ] Auto-updates status from OPEN to IN_PROGRESS
- [ ] Does not change status if already IN_PROGRESS, RESOLVED, or CLOSED
- [ ] Creates admin_audit_log entry
- [ ] Sends notification to ticket creator
- [ ] Returns 400 if message is empty
- [ ] Returns 400 if message exceeds 2000 characters
- [ ] Returns 404 for non-existent ticket
- [ ] Rate limiting works (check throttler config)
- [ ] Only accessible by STAFF or ADMIN roles

### 4. Update Status (POST /api/v1/staff/support/:id/status)
- [ ] Updates ticket status successfully
- [ ] Sets resolvedAt when status = RESOLVED
- [ ] Sets closedAt when status = CLOSED
- [ ] Creates admin_audit_log entry with oldValue and newValue
- [ ] Sends notification to ticket creator
- [ ] Returns 400 for invalid status
- [ ] Returns 404 for non-existent ticket
- [ ] Only accessible by STAFF or ADMIN roles

## Frontend UI Tests

### Support List Page (/staff/support)

#### Layout & Display
- [ ] Page title "Support Tickets" displays
- [ ] Search input renders correctly
- [ ] Status filter dropdown renders with all options
- [ ] Table displays with correct columns
- [ ] Ticket number displays in monospace font
- [ ] User name and email display correctly
- [ ] Subject truncates if too long
- [ ] Status badge shows correct color:
  - OPEN → Yellow
  - IN_PROGRESS → Blue
  - RESOLVED → Green
  - CLOSED → Gray
- [ ] Message count badge displays
- [ ] Created date shows relative time (e.g., "2 hours ago")
- [ ] View button renders for each ticket

#### Functionality
- [ ] Search updates results (debounced)
- [ ] Status filter updates results
- [ ] Clicking "View" navigates to detail page
- [ ] Pagination controls display when > 1 page
- [ ] Previous button disabled on page 1
- [ ] Next button disabled on last page
- [ ] Loading skeleton shows while fetching
- [ ] Error state displays on API failure
- [ ] Empty state shows when no tickets found

### Ticket Detail Page (/staff/support/[id])

#### Layout & Display
- [ ] Back button navigates to list page
- [ ] Ticket number displays in header
- [ ] Subject displays in header
- [ ] Left sidebar shows ticket info
- [ ] Status dropdown displays current status
- [ ] Customer name and email display
- [ ] Customer role badge displays
- [ ] Created date shows relative time
- [ ] Last updated date shows relative time
- [ ] Description displays if present
- [ ] Message thread displays in chronological order
- [ ] Staff messages align right with blue background
- [ ] User messages align left with gray background
- [ ] Each message shows sender name, role badge (if staff), and timestamp
- [ ] Reply textarea renders at bottom
- [ ] Character count shows (0/2000)
- [ ] Send button renders

#### Functionality
- [ ] Status dropdown updates ticket status
- [ ] Status change shows success toast
- [ ] Status change updates UI optimistically
- [ ] Reply textarea accepts input
- [ ] Character count updates as user types
- [ ] Send button disabled when empty
- [ ] Send button disabled when > 2000 chars
- [ ] Clicking Send creates new message
- [ ] New message appears in thread immediately (optimistic update)
- [ ] Reply textarea clears after sending
- [ ] Success toast shows after reply
- [ ] Error toast shows on failure
- [ ] Messages auto-scroll to bottom
- [ ] Loading spinner shows while fetching
- [ ] Error state displays on API failure

## Security Tests

### Authentication
- [ ] Unauthenticated requests return 401
- [ ] Expired JWT returns 401
- [ ] Invalid JWT returns 401

### Authorization (RBAC)
- [ ] WORKER role cannot access any staff/support endpoints
- [ ] STAFF role can access all endpoints
- [ ] ADMIN role can access all endpoints
- [ ] USER role cannot access any staff/support endpoints

### Input Validation
- [ ] Message length validated (max 2000)
- [ ] Status enum validated (only valid statuses accepted)
- [ ] Ticket ID validated (UUID format)
- [ ] XSS protection (HTML in messages escaped)
- [ ] SQL injection protection (parameterized queries)

### Rate Limiting
- [ ] Reply endpoint rate limited (check throttler config)
- [ ] Excessive requests return 429

## Audit Logging

### Verify admin_audit_logs entries created for:
- [ ] Reply to ticket (action: UPDATE, entityType: SupportTicket)
- [ ] Status change (action: UPDATE, with oldValue and newValue)
- [ ] Includes actorId (staff member ID)
- [ ] Includes actionDetail (human-readable description)
- [ ] Includes entityId (ticket ID)
- [ ] Includes timestamp (createdAt)

## Notifications

### Verify notifications created for:
- [ ] Staff reply (type: TICKET_UPDATE, title: "New Reply on Ticket")
- [ ] Status change (type: TICKET_UPDATE, title: "Ticket Status Updated")
- [ ] Notification sent to ticket creator (userId)
- [ ] Notification includes entityType and entityId
- [ ] Email notification sent (check email service logs)

## Database Tests

### Verify schema:
- [ ] support_tickets table has description column
- [ ] ticket_messages table exists with all required fields
- [ ] Foreign key constraints work (cascade delete)
- [ ] Indexes exist on:
  - support_tickets(status, createdAt)
  - support_tickets(createdBy)
  - ticket_messages(ticketId, createdAt)

## Edge Cases

- [ ] Ticket with no messages displays correctly
- [ ] Ticket with 100+ messages loads and scrolls
- [ ] Very long subject truncates properly
- [ ] Very long message content wraps correctly
- [ ] Special characters in message display correctly
- [ ] Emoji in messages display correctly
- [ ] Concurrent replies don't cause race conditions
- [ ] Concurrent status updates don't cause race conditions

## Performance

- [ ] List page loads in < 1 second
- [ ] Detail page loads in < 1 second
- [ ] Reply submits in < 500ms
- [ ] Status update submits in < 500ms
- [ ] Pagination doesn't reload entire dataset
- [ ] Search debounced to avoid excessive API calls

## Browser Compatibility

- [ ] Works in Chrome
- [ ] Works in Firefox
- [ ] Works in Safari
- [ ] Works in Edge
- [ ] Responsive on mobile (< 768px)
- [ ] Responsive on tablet (768px - 1024px)
- [ ] Responsive on desktop (> 1024px)

## Accessibility

- [ ] Keyboard navigation works
- [ ] Screen reader announces status changes
- [ ] Form inputs have proper labels
- [ ] Buttons have descriptive text
- [ ] Color contrast meets WCAG AA standards
- [ ] Focus indicators visible

---

## Test Data Setup

### Create test tickets:
```sql
-- Create a test user (if not exists)
INSERT INTO users (id, email, password_hash, full_name, role)
VALUES ('test-user-id', 'testuser@example.com', 'hashed-password', 'Test User', 'WORKER');

-- Create test tickets
INSERT INTO support_tickets (id, ticket_number, created_by, subject, description, status, priority, created_at, updated_at)
VALUES 
  ('ticket-1', 'TKT-001', 'test-user-id', 'Cannot upload proof', 'I am unable to upload job proof images', 'OPEN', 'HIGH', NOW(), NOW()),
  ('ticket-2', 'TKT-002', 'test-user-id', 'Payment not received', 'My payout request was approved but I have not received payment', 'IN_PROGRESS', 'URGENT', NOW(), NOW()),
  ('ticket-3', 'TKT-003', 'test-user-id', 'Profile verification issue', 'My ID verification was rejected without reason', 'RESOLVED', 'MEDIUM', NOW(), NOW());

-- Create test messages
INSERT INTO ticket_messages (id, ticket_id, sender_id, content, created_at)
VALUES 
  ('msg-1', 'ticket-1', 'test-user-id', 'I keep getting an error when trying to upload images', NOW()),
  ('msg-2', 'ticket-2', 'test-user-id', 'It has been 3 days since approval', NOW());
```

### Create test staff user:
```sql
INSERT INTO users (id, email, password_hash, full_name, role)
VALUES ('staff-user-id', 'staff@serviceflow.com', 'hashed-password', 'Staff Member', 'STAFF');
```

---

## Known Issues / Notes

- [ ] Document any issues found during testing
- [ ] Document any deviations from requirements
- [ ] Document any performance concerns
- [ ] Document any UX improvements needed
