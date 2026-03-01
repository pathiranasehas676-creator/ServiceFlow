# Worker Support Ticket System - Manual Test Checklist

## Backend API Tests

### 1. List My Tickets (GET /api/v1/worker/support)
- [ ] Returns only tickets created by the authenticated worker
- [ ] Returns paginated list with correct structure
- [ ] Includes ticket number, subject, status, dates
- [ ] Includes message count (_count.messages)
- [ ] Filter by status works (OPEN, IN_PROGRESS, RESOLVED, CLOSED)
- [ ] Search by subject works (case-insensitive)
- [ ] Pagination works (page, limit)
- [ ] Only accessible by WORKER or ADMIN roles
- [ ] Returns 401 for unauthenticated users
- [ ] Returns 403 for non-WORKER/ADMIN roles

### 2. Create Ticket (POST /api/v1/worker/support)
- [ ] Creates new support_tickets record with status OPEN
- [ ] Creates initial ticket_messages record
- [ ] Generates unique ticket number (TKT-XXXXXX)
- [ ] Sets createdBy to current user ID
- [ ] Creates admin_audit_log entry
- [ ] Sends notifications to all STAFF/ADMIN users
- [ ] Validates subject (min 3, max 120 chars)
- [ ] Validates description (min 10, max 2000 chars)
- [ ] Returns 400 for invalid input
- [ ] Rate limiting works (5 tickets per minute)
- [ ] Only accessible by WORKER or ADMIN roles

### 3. Get My Ticket Details (GET /api/v1/worker/support/:id)
- [ ] Returns full ticket details with message thread
- [ ] Messages ordered by createdAt ASC
- [ ] Includes sender info for each message
- [ ] Ownership check: only returns if ticket.createdBy === userId
- [ ] Returns 404 for non-existent ticket
- [ ] Returns 403 if trying to view another worker's ticket
- [ ] Only accessible by WORKER or ADMIN roles

### 4. Reply to Ticket (POST /api/v1/worker/support/:id/reply)
- [ ] Creates new ticket_message record
- [ ] Ownership check: only allows reply to own tickets
- [ ] Returns 403 if trying to reply to another worker's ticket
- [ ] Returns 400 if ticket is CLOSED
- [ ] Auto-updates status from RESOLVED to IN_PROGRESS
- [ ] Does not change status if OPEN or IN_PROGRESS
- [ ] Creates admin_audit_log entry
- [ ] Sends notifications to all STAFF/ADMIN users
- [ ] Validates message (min 1, max 2000 chars)
- [ ] Returns 400 for invalid input
- [ ] Rate limiting works (10 replies per minute)
- [ ] Only accessible by WORKER or ADMIN roles

### 5. Close Ticket (POST /api/v1/worker/support/:id/close)
- [ ] Updates ticket status to CLOSED
- [ ] Sets closedAt timestamp
- [ ] Ownership check: only allows closing own tickets
- [ ] Returns 403 if trying to close another worker's ticket
- [ ] Creates admin_audit_log entry with old/new values
- [ ] Sends notifications to all STAFF/ADMIN users
- [ ] Returns ticket if already CLOSED (idempotent)
- [ ] Only accessible by WORKER or ADMIN roles

## Frontend UI Tests

### Worker Support List Page (/worker/support)

#### Layout & Display
- [ ] Page title "Support" displays
- [ ] "New Ticket" button renders
- [ ] Search input renders correctly
- [ ] Status filter dropdown renders with all options
- [ ] Table displays with correct columns
- [ ] Ticket number displays in monospace font
- [ ] Subject displays and truncates if too long
- [ ] Status badge shows correct color:
  - OPEN → Yellow
  - IN_PROGRESS → Blue
  - RESOLVED → Green
  - CLOSED → Gray
- [ ] Message count badge displays
- [ ] Updated date shows relative time
- [ ] View button renders for each ticket
- [ ] Empty state shows when no tickets
- [ ] Empty state message encourages creating ticket

#### Create Ticket Modal
- [ ] Modal opens when clicking "New Ticket"
- [ ] Subject input renders with character counter
- [ ] Description textarea renders with character counter
- [ ] Cancel button closes modal
- [ ] Create button disabled when subject < 3 chars
- [ ] Create button disabled when description < 10 chars
- [ ] Create button disabled when subject > 120 chars
- [ ] Create button disabled when description > 2000 chars
- [ ] Character counters update as user types
- [ ] Success toast shows on successful creation
- [ ] Error toast shows on failure
- [ ] Modal closes on successful creation
- [ ] Form fields clear after creation
- [ ] Loading state shows during creation

#### Functionality
- [ ] Search updates results
- [ ] Status filter updates results
- [ ] Clicking "View" navigates to detail page
- [ ] Pagination controls display when > 1 page
- [ ] Previous button disabled on page 1
- [ ] Next button disabled on last page
- [ ] Loading skeleton shows while fetching
- [ ] Error state displays on API failure
- [ ] List refreshes after creating ticket

### Worker Ticket Detail Page (/worker/support/[id])

#### Layout & Display
- [ ] Back button navigates to list page
- [ ] Ticket number displays in header
- [ ] Subject displays in header
- [ ] Status badge displays in header
- [ ] Close Ticket button shows if not closed
- [ ] Close Ticket button hidden if already closed
- [ ] Left sidebar shows ticket info
- [ ] Status badge displays current status
- [ ] Created date shows relative time
- [ ] Last updated date shows relative time
- [ ] Description displays if present
- [ ] Polling indicator shows (15 second message)
- [ ] Message thread displays in chronological order
- [ ] Worker messages align right with primary color
- [ ] Staff messages align left with muted color
- [ ] Each message shows sender name
- [ ] "You" displays for worker's own messages
- [ ] "Support Team" badge shows for staff messages
- [ ] Message timestamps show relative time
- [ ] Reply textarea renders at bottom
- [ ] Character count shows (0/2000)
- [ ] Send button renders
- [ ] Closed state message shows if ticket closed

#### Functionality
- [ ] Messages auto-scroll to bottom on load
- [ ] Messages auto-scroll when new message arrives
- [ ] Polling works (updates every 15 seconds)
- [ ] New messages from staff appear automatically
- [ ] Reply textarea accepts input
- [ ] Character count updates as user types
- [ ] Send button disabled when empty
- [ ] Send button disabled when > 2000 chars
- [ ] Clicking Send creates new message
- [ ] New message appears in thread immediately
- [ ] Reply textarea clears after sending
- [ ] Success toast shows after reply
- [ ] Error toast shows on failure
- [ ] Reply box disabled if ticket is CLOSED
- [ ] Close Ticket button opens confirmation dialog
- [ ] Confirmation dialog has Cancel and Close buttons
- [ ] Clicking Cancel closes dialog without action
- [ ] Clicking Close Ticket closes the ticket
- [ ] Success toast shows after closing
- [ ] UI updates to show CLOSED status
- [ ] Reply box becomes disabled after closing
- [ ] Loading spinner shows while fetching
- [ ] Error state displays on API failure

## Security Tests

### Authentication
- [ ] Unauthenticated requests return 401
- [ ] Expired JWT returns 401
- [ ] Invalid JWT returns 401

### Authorization (RBAC)
- [ ] WORKER role can access all worker/support endpoints
- [ ] ADMIN role can access all worker/support endpoints
- [ ] STAFF role cannot access worker/support endpoints (403)
- [ ] USER role cannot access worker/support endpoints (403)

### Ownership Checks
- [ ] Worker A cannot view Worker B's tickets (403)
- [ ] Worker A cannot reply to Worker B's tickets (403)
- [ ] Worker A cannot close Worker B's tickets (403)
- [ ] Admin can view any worker's tickets
- [ ] Admin can reply to any worker's tickets
- [ ] Admin can close any worker's tickets

### Input Validation
- [ ] Subject length validated (min 3, max 120)
- [ ] Description length validated (min 10, max 2000)
- [ ] Message length validated (min 1, max 2000)
- [ ] Ticket ID validated (UUID format)
- [ ] XSS protection (HTML in messages escaped)
- [ ] SQL injection protection (parameterized queries)

### Rate Limiting
- [ ] Create endpoint limited to 5 per minute
- [ ] Reply endpoint limited to 10 per minute
- [ ] Excessive requests return 429

## Audit Logging

### Verify admin_audit_logs entries created for:
- [ ] Create ticket (action: CREATE, entityType: SupportTicket)
- [ ] Reply to ticket (action: UPDATE, entityType: SupportTicket)
- [ ] Close ticket (action: UPDATE, with oldValue and newValue)
- [ ] Includes actorId (worker ID)
- [ ] Includes actionDetail (human-readable description)
- [ ] Includes entityId (ticket ID)
- [ ] Includes timestamp (createdAt)

## Notifications

### Verify notifications created for:
- [ ] Worker creates ticket → All STAFF/ADMIN notified
- [ ] Worker replies → All STAFF/ADMIN notified
- [ ] Worker closes ticket → All STAFF/ADMIN notified
- [ ] Staff replies → Worker notified (from staff support panel)
- [ ] Notification includes entityType and entityId
- [ ] Email notification sent (check email service logs)

## Integration Tests (Worker ↔ Staff)

### Test Flow 1: Worker Creates → Staff Replies → Worker Sees Update
1. [ ] Worker creates ticket at /worker/support
2. [ ] Ticket appears in worker's list
3. [ ] Staff sees ticket at /staff/support
4. [ ] Staff opens ticket and replies
5. [ ] Worker's detail page shows staff reply after polling (max 15s)
6. [ ] Worker notification created

### Test Flow 2: Staff Replies → Worker Replies Back
1. [ ] Staff replies to ticket
2. [ ] Worker sees reply via polling
3. [ ] Worker replies back
4. [ ] Staff sees worker reply at /staff/support/[id]
5. [ ] Staff notification created

### Test Flow 3: Worker Closes Ticket
1. [ ] Worker opens ticket detail page
2. [ ] Worker clicks "Close Ticket"
3. [ ] Confirmation dialog appears
4. [ ] Worker confirms closure
5. [ ] Ticket status changes to CLOSED
6. [ ] Reply box becomes disabled
7. [ ] Staff sees CLOSED status
8. [ ] Worker cannot reply anymore (400 error)

### Test Flow 4: Status Changes
1. [ ] Ticket created with status OPEN
2. [ ] Staff replies → status changes to IN_PROGRESS
3. [ ] Staff marks as RESOLVED
4. [ ] Worker replies → status changes back to IN_PROGRESS
5. [ ] Worker closes → status changes to CLOSED

## Edge Cases

- [ ] Ticket with no messages displays correctly
- [ ] Ticket with 100+ messages loads and scrolls
- [ ] Very long subject truncates properly
- [ ] Very long message content wraps correctly
- [ ] Special characters in message display correctly
- [ ] Emoji in messages display correctly
- [ ] Concurrent replies don't cause race conditions
- [ ] Polling doesn't cause memory leaks
- [ ] Closing already closed ticket is idempotent
- [ ] Replying to closed ticket returns proper error

## Performance

- [ ] List page loads in < 1 second
- [ ] Detail page loads in < 1 second
- [ ] Create ticket submits in < 500ms
- [ ] Reply submits in < 500ms
- [ ] Close ticket submits in < 500ms
- [ ] Polling doesn't degrade performance over time
- [ ] Pagination doesn't reload entire dataset

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
- [ ] Modal can be closed with Escape key

---

## Test Data Setup

### Create test worker user:
```sql
INSERT INTO users (id, email, password_hash, full_name, role, is_active)
VALUES ('worker-test-id', 'worker@test.com', 'hashed-password', 'Test Worker', 'WORKER', true);
```

### Create test staff user:
```sql
INSERT INTO users (id, email, password_hash, full_name, role, is_active)
VALUES ('staff-test-id', 'staff@test.com', 'hashed-password', 'Test Staff', 'STAFF', true);
```

---

## Known Issues / Notes

- [ ] Document any issues found during testing
- [ ] Document any deviations from requirements
- [ ] Document any performance concerns
- [ ] Document any UX improvements needed

---

## Success Criteria

✅ All backend endpoints working with proper security
✅ Worker can only access own tickets
✅ Polling updates work within 15 seconds
✅ Staff and worker can communicate via tickets
✅ Rate limiting prevents abuse
✅ Audit logs capture all actions
✅ Notifications sent to appropriate users
✅ UI is responsive and user-friendly
✅ No security vulnerabilities
