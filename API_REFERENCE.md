# Request Management API Reference

## Base URL
```
http://localhost:3001/api/v1/admin/requests
```

## Authentication
All endpoints require:
- Valid JWT token in `Authorization: Bearer <token>` header
- User role: `ADMIN` or `STAFF`
- Appropriate permissions (see each endpoint)

## Common Response Format

### Success Response
```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

### Error Response
```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Bad Request"
}
```

---

## Proof Approvals

### Get Proof Requests
```http
GET /proofs
```

**Query Parameters:**
- `page` (number, optional, default: 1)
- `limit` (number, optional, default: 20)
- `status` (string, optional, default: "PROOF_SUBMITTED")
  - Values: `PROOF_SUBMITTED`, `APPROVED`, `all`
- `q` (string, optional) - Search by job title, worker name, or email

**Required Permission:** `VIEW_JOBS`

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Clean office building",
      "description": "...",
      "status": "PROOF_SUBMITTED",
      "priceCents": 5000,
      "worker": {
        "id": "uuid",
        "user": {
          "id": "uuid",
          "fullName": "John Doe",
          "email": "john@example.com",
          "phoneNumber": "+1234567890"
        }
      },
      "service": {
        "name": "Cleaning",
        "category": "Maintenance"
      },
      "proofs": [
        {
          "id": "uuid",
          "imageUrl": "https://...",
          "caption": "Before photo",
          "sequenceOrder": 0
        }
      ],
      "updatedAt": "2024-02-14T10:00:00Z",
      "createdAt": "2024-02-14T09:00:00Z"
    }
  ],
  "meta": { ... }
}
```

### Approve Proof
```http
POST /proofs/:id/approve
```

**Required Permission:** `APPROVE_PROOFS`

**Request Body:**
```json
{
  "note": "Looks good, approved" // optional
}
```

**Response:**
```json
{
  "id": "uuid",
  "status": "APPROVED",
  "completedAt": "2024-02-14T10:30:00Z",
  ...
}
```

**Side Effects:**
- Job status → `APPROVED`
- Worker wallet credited with job amount
- Transaction record created
- Job status history entry created
- Audit log entry created

### Reject Proof
```http
POST /proofs/:id/reject
```

**Required Permission:** `APPROVE_PROOFS`

**Request Body:**
```json
{
  "reason": "Images are blurry, please resubmit", // required
  "note": "Internal note" // optional
}
```

**Response:**
```json
{
  "id": "uuid",
  "status": "ACCEPTED",
  "rejectionReason": "Images are blurry, please resubmit",
  "resubmitDeadline": "2024-02-16T10:30:00Z", // 48 hours from now
  ...
}
```

**Side Effects:**
- Job status → `ACCEPTED` (allows resubmission)
- Rejection reason stored
- Resubmit deadline set to 48 hours
- Job status history entry created
- Audit log entry created

---

## Payout Requests

### Get Payout Requests
```http
GET /payouts
```

**Query Parameters:**
- `page` (number, optional, default: 1)
- `limit` (number, optional, default: 20)
- `status` (string, optional, default: "PENDING")
  - Values: `PENDING`, `APPROVED`, `PAID`, `REJECTED`, `all`
- `q` (string, optional) - Search by worker name or email

**Required Permission:** `VIEW_PAYOUTS`

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "amountCents": 10000,
      "status": "PENDING",
      "type": "WEEKLY",
      "wallet": {
        "user": {
          "id": "uuid",
          "fullName": "John Doe",
          "email": "john@example.com",
          "workerProfile": {
            "bankDetails": {
              "bankName": "ABC Bank",
              "accountName": "John Doe",
              "accountNumberLast4": "1234",
              "branchCode": "001"
            }
          }
        }
      },
      "reviewedAt": null,
      "rejectionReason": null,
      "createdAt": "2024-02-14T09:00:00Z"
    }
  ],
  "meta": { ... }
}
```

### Approve Payout
```http
POST /payouts/:id/approve
```

**Required Permission:** `APPROVE_PAYOUTS`

**Request Body:**
```json
{
  "note": "Approved for processing" // optional
}
```

**Response:**
```json
{
  "id": "uuid",
  "status": "APPROVED",
  "reviewedBy": "admin-uuid",
  "reviewedAt": "2024-02-14T10:30:00Z",
  "adminNote": "Approved for processing",
  ...
}
```

**Side Effects:**
- Payout status → `APPROVED`
- Reviewed by and timestamp set
- Audit log entry created

### Reject Payout
```http
POST /payouts/:id/reject
```

**Required Permission:** `APPROVE_PAYOUTS`

**Request Body:**
```json
{
  "reason": "Insufficient verification", // required
  "note": "Internal note" // optional
}
```

**Response:**
```json
{
  "id": "uuid",
  "status": "REJECTED",
  "reviewedBy": "admin-uuid",
  "reviewedAt": "2024-02-14T10:30:00Z",
  "rejectionReason": "Insufficient verification",
  ...
}
```

**Side Effects:**
- Payout status → `REJECTED`
- Funds returned to available balance (atomic)
- Pending balance decreased
- Audit log entry created

### Mark Payout as Paid
```http
POST /payouts/:id/mark-paid
```

**Required Permission:** `APPROVE_PAYOUTS`

**Request Body:**
```json
{
  "receiptFileKey": "receipts/payout-123.pdf", // required
  "transactionRef": "TXN-2024-001" // optional
}
```

**Response:**
```json
{
  "id": "uuid",
  "status": "PAID",
  "paidAt": "2024-02-14T11:00:00Z",
  "transactionRef": "TXN-2024-001",
  "receipt": {
    "id": "uuid",
    "receiptKey": "receipts/payout-123.pdf",
    "uploadedBy": "admin-uuid",
    "uploadedAt": "2024-02-14T11:00:00Z"
  },
  ...
}
```

**Side Effects:**
- Payout status → `PAID`
- Receipt record created
- Pending balance decreased (atomic)
- Transaction record created (DEBIT type)
- Audit log entry created

---

## ID Verifications

### Get Verification Requests
```http
GET /verifications
```

**Query Parameters:**
- `page` (number, optional, default: 1)
- `limit` (number, optional, default: 20)
- `status` (string, optional, default: "PENDING")
  - Values: `PENDING`, `APPROVED`, `REJECTED`, `all`
- `q` (string, optional) - Search by worker name or email

**Required Permission:** `MANAGE_USERS`

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "documentType": "NATIONAL_ID",
      "documentNumber": "ID-123456",
      "frontImageKey": "ids/front-123.jpg",
      "backImageKey": "ids/back-123.jpg",
      "status": "PENDING",
      "workerProfile": {
        "user": {
          "id": "uuid",
          "fullName": "John Doe",
          "email": "john@example.com",
          "phoneNumber": "+1234567890"
        }
      },
      "submittedAt": "2024-02-14T09:00:00Z",
      "reviewedAt": null,
      "rejectionReason": null
    }
  ],
  "meta": { ... }
}
```

### Approve Verification
```http
POST /verifications/:id/approve
```

**Required Permission:** `MANAGE_USERS`

**Request Body:**
```json
{
  "note": "ID verified successfully" // optional
}
```

**Response:**
```json
{
  "id": "uuid",
  "status": "APPROVED",
  "reviewedBy": "admin-uuid",
  "reviewedAt": "2024-02-14T10:30:00Z",
  "adminNotes": "ID verified successfully",
  ...
}
```

**Side Effects:**
- Verification status → `APPROVED`
- Worker profile verification status → `APPROVED` (atomic)
- Worker profile `verifiedAt` timestamp set
- Audit log entry created

### Reject Verification
```http
POST /verifications/:id/reject
```

**Required Permission:** `MANAGE_USERS`

**Request Body:**
```json
{
  "reason": "Document is expired", // required
  "note": "Internal note" // optional
}
```

**Response:**
```json
{
  "id": "uuid",
  "status": "REJECTED",
  "reviewedBy": "admin-uuid",
  "reviewedAt": "2024-02-14T10:30:00Z",
  "rejectionReason": "Document is expired",
  ...
}
```

**Side Effects:**
- Verification status → `REJECTED`
- Worker profile verification status → `REJECTED` (atomic)
- Audit log entry created

---

## Support Tickets

### Get Support Tickets
```http
GET /tickets
```

**Query Parameters:**
- `page` (number, optional, default: 1)
- `limit` (number, optional, default: 20)
- `status` (string, optional, default: "OPEN")
  - Values: `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`, `all`
- `q` (string, optional) - Search by ticket number, subject, or user

**Required Permission:** `VIEW_SUPPORT`

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "ticketNumber": "TKT-2024-001",
      "subject": "Cannot upload proof",
      "category": "Technical",
      "priority": "HIGH",
      "status": "OPEN",
      "creator": {
        "id": "uuid",
        "fullName": "John Doe",
        "email": "john@example.com",
        "phoneNumber": "+1234567890"
      },
      "messages": [
        {
          "id": "uuid",
          "content": "Latest message...",
          "sender": {
            "fullName": "Admin",
            "role": "ADMIN"
          },
          "createdAt": "2024-02-14T10:00:00Z"
        }
      ],
      "_count": {
        "messages": 3
      },
      "createdAt": "2024-02-14T09:00:00Z",
      "updatedAt": "2024-02-14T10:00:00Z"
    }
  ],
  "meta": { ... }
}
```

### Reply to Ticket
```http
POST /tickets/:id/reply
```

**Required Permission:** `VIEW_SUPPORT`

**Request Body:**
```json
{
  "message": "Thank you for reporting this issue...", // required
  "isInternal": false // optional, default: false
}
```

**Response:**
```json
{
  "id": "uuid",
  "ticketId": "ticket-uuid",
  "senderId": "admin-uuid",
  "content": "Thank you for reporting this issue...",
  "isInternal": false,
  "sender": {
    "fullName": "Admin",
    "role": "ADMIN"
  },
  "createdAt": "2024-02-14T10:30:00Z"
}
```

**Side Effects:**
- Message created
- If ticket was CLOSED, status → `IN_PROGRESS`
- Audit log entry created

### Close Ticket
```http
POST /tickets/:id/close
```

**Required Permission:** `VIEW_SUPPORT`

**Request Body:** None

**Response:**
```json
{
  "id": "uuid",
  "status": "CLOSED",
  "closedAt": "2024-02-14T11:00:00Z",
  ...
}
```

**Side Effects:**
- Ticket status → `CLOSED`
- Closed timestamp set
- Audit log entry created

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request (invalid input, invalid state transition) |
| 401 | Unauthorized (missing or invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found (resource doesn't exist) |
| 500 | Internal Server Error |

## Rate Limiting

All endpoints are subject to rate limiting:
- 100 requests per minute per user
- 1000 requests per hour per user

## Pagination

Default pagination:
- `limit`: 20 items per page
- `page`: 1 (first page)
- Maximum `limit`: 100

## Filtering

Status filters accept:
- Specific status values (e.g., `PENDING`, `APPROVED`)
- `all` - Returns all statuses

## Search

Search is case-insensitive and uses partial matching:
- Searches across multiple fields (name, email, title, etc.)
- Uses PostgreSQL `ILIKE` operator
- Minimum 1 character required
