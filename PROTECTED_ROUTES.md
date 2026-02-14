# CSRF Protection

The application implements CSRF protection using the "Double Submit Cookie" pattern (via Signed Cookie).

## Mechanism

1.  **Token Generation**:
    -   Endpoint: `GET /api/v1/auth/csrf`
    -   Response: JSON `{ "csrfToken": "..." }`
    -   Cookie: `_csrf` (HttpOnly, Signed, Secure in Prod) containing the token.

2.  **Validation**:
    -   Client reads the token from the JSON response (or memory if fetched earlier).
    -   Client sends header `X-CSRF-Token` with the token value on unsafe requests.
    -   Server (`CsrfGuard`) verifies that `X-CSRF-Token` header matches the `_csrf` signed cookie.

## Protected Routes

The following endpoints require valid CSRF headers:

### Auth
-   `POST /api/v1/auth/change-password`
-   `POST /api/v1/auth/reset-password`

### Admin Payouts
-   `PATCH /api/v1/admin/payouts/:id/approve`
-   `PATCH /api/v1/admin/payouts/:id/reject`
-   `PATCH /api/v1/admin/payouts/:id/pay`

### Worker Payouts
-   `POST /api/v1/worker/payouts` (Request Payout)

### Admin Requests (Inbox)
All mutating operations in `RequestsController` are protected:
-   `POST /api/v1/admin/requests/proofs/:id/approve`
-   `POST /api/v1/admin/requests/proofs/:id/reject`
-   `POST /api/v1/admin/requests/payouts/:id/approve`
-   `POST /api/v1/admin/requests/payouts/:id/reject`
-   `POST /api/v1/admin/requests/payouts/:id/mark-paid`
-   `POST /api/v1/admin/requests/verifications/:id/approve`
-   `POST /api/v1/admin/requests/verifications/:id/reject`
-   `POST /api/v1/admin/requests/tickets/:id/reply`
-   `POST /api/v1/admin/requests/tickets/:id/close`

## Frontend Integration

The API Client (`src/lib/apiClient.ts`) automatically fetches the CSRF token on the first unsafe request and attaches the `X-CSRF-Token` header.
