
# Data Integrity Features - Test Checklist

## A. Soft Delete Implementation

### 1. Backend Endpoints
- [ ] **Soft Delete User**
  - **Action**: `POST /api/v1/admin/users/{userId}/soft-delete`
  - **Payload**: `{ "reason": "Test deletion" }`
  - **Expected**: 200 OK. Response includes `deletedAt` timestamp.
  - **Verify**: Fetch user details. `isActive` should be `false`. `deletedAt` should be present.
- [ ] **Restore User**
  - **Action**: `POST /api/v1/admin/users/{userId}/restore`
  - **Expected**: 200 OK. `deletedAt` is null. `isActive` is true.
- [ ] **Soft Delete Job**
  - **Action**: `POST /api/v1/admin/jobs/{jobId}/soft-delete`
  - **Payload**: `{ "reason": "Spam job" }`
  - **Expected**: 200 OK.
  - **Verify**: Job status should NOT change to cancelled automatically (unless implemented), but `deletedAt` is set. Queries filtering `deletedAt` should exclude it.
- [ ] **Data Persistence**
  - **Verify**: The record is NOT removed from PostgreSQL. Check DB directly. `deletedById` matches Admin ID.

### 2. Audit Logging
- [ ] **Verify Log Entry**
  - **Action**: Perform soft delete.
  - **Check**: `GET /api/v1/admin/audit-logs` (or DB check `admin_audit_logs` table).
  - **Expect**: Action `DELETE`, Entity `User` (or Job), `newValue` contains reason.

### 3. Edge Cases
- [ ] **Double Delete**: Attempt to soft delete an already deleted entity. Expect 400 Bad Request.
- [ ] **Restore Active**: Attempt to restore non-deleted entity. Expect 400 Bad Request.
- [ ] **Invalid Entity**: `POST /api/v1/admin/invalid-entity/id...`. Expect 400 Bad Request.

## B. Error Reporting System

### 1. Database Logging
- [ ] **Trigger 500 Error**
  - **Action**: Call a non-existent route or mock an endpoint to throw `InternalServerErrorException`. (e.g. modify query to fail).
  - **Verify**: `error_logs` table contains new entry.
  - **Check**: `severity` = 'high', `path` is correct.
- [ ] **Trigger 400 Error**
  - **Action**: Send invalid payload to an endpoint (e.g. missing required field).
  - **Verify**: `error_logs` table contains entry with `severity` = 'low'.

### 2. Sanitization
- [ ] **Sensitive Data**
  - **Action**: Send login request with `{ email, password: "secret_password" }` that fails (e.g. 500). (Or 400).
    *Note: Login 401 usually doesn't log body in global filter if caught by guard? If exception filter catches, check `safePayload`.*
  - **Verify**: In DB `safePayload`, `password` field is `[REDACTED]`.

### 3. Frontend Admin UI
- [ ] **Page Load**
  - **Action**: Navigate to `/admin/system/errors`.
  - **Verify**: List loads without error. Empty state or list of errors.
- [ ] **Filtering**
  - **Action**: Filter by `High` severity.
  - **Verify**: Only high severity logs shown.
- [ ] **Detail View**
  - **Action**: Click "Eye" icon on a log.
  - **Verify**: Drawer opens. Stack trace is visible. Context (IP, User Agent) is visible.

### 4. Integration
- [ ] **System Resilience**: Ensure logging failure (e.g. DB down) doesn't crash the app (catch block in `logErrorToDb`).
