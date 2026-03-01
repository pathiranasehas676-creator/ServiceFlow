# Password Reset Flow - Visual Guide

## 🔄 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PASSWORD RESET FLOW                              │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   USER       │
│  (Browser)   │
└──────┬───────┘
       │
       │ 1. Clicks "Forgot Password?" on login page
       │
       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  FORGOT PASSWORD PAGE (/auth/forgot-password)                            │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  Enter Email: [user@example.com]                               │     │
│  │  [Send Reset Link]                                             │     │
│  └────────────────────────────────────────────────────────────────┘     │
└───────────────────────────────┬──────────────────────────────────────────┘
                                │
                                │ 2. POST /auth/forgot-password
                                │    { email: "user@example.com" }
                                ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  BACKEND - AuthService.forgotPassword()                                  │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  ✓ Find user by email                                          │     │
│  │  ✓ Invalidate existing reset tokens                            │     │
│  │  ✓ Generate secure 32-byte random token                        │     │
│  │  ✓ Hash token with SHA-256                                     │     │
│  │  ✓ Store in database (expires in 15 min)                       │     │
│  │  ✓ Create audit log entry                                      │     │
│  │  ✓ Log reset link to console (dev mode)                        │     │
│  │  ✓ Return generic success message                              │     │
│  └────────────────────────────────────────────────────────────────┘     │
└───────────────────────────────┬──────────────────────────────────────────┘
                                │
                                │ 3. Response: { message: "Check your email..." }
                                ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  SUCCESS PAGE                                                             │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  ✓ Check Your Email                                            │     │
│  │  If an account exists with user@example.com,                   │     │
│  │  you will receive a reset link shortly.                        │     │
│  │                                                                 │     │
│  │  The link expires in 15 minutes.                               │     │
│  └────────────────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────────────┘

                                │
                                │ 4. User checks console (dev) or email (prod)
                                │    Gets link: /auth/reset-password?token=abc123...
                                ▼

┌──────────────────────────────────────────────────────────────────────────┐
│  RESET PASSWORD PAGE (/auth/reset-password?token=abc123...)              │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  Verifying token...                                            │     │
│  └────────────────────────────────────────────────────────────────┘     │
└───────────────────────────────┬──────────────────────────────────────────┘
                                │
                                │ 5. POST /auth/verify-reset-token
                                │    { token: "abc123..." }
                                ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  BACKEND - AuthService.verifyResetToken()                                │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  ✓ Hash token                                                  │     │
│  │  ✓ Find token in database                                      │     │
│  │  ✓ Check not expired                                           │     │
│  │  ✓ Check not already used                                      │     │
│  │  ✓ Return user email                                           │     │
│  └────────────────────────────────────────────────────────────────┘     │
└───────────────────────────────┬──────────────────────────────────────────┘
                                │
                                │ 6. Response: { valid: true, email: "user@..." }
                                ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  RESET PASSWORD FORM                                                      │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  Reset password for: user@example.com                          │     │
│  │                                                                 │     │
│  │  New Password: [••••••••••]  👁                                │     │
│  │  ✓ At least 8 characters                                       │     │
│  │  ✓ Lowercase letter                                            │     │
│  │  ✓ Uppercase letter                                            │     │
│  │  ✓ Number                                                      │     │
│  │  ✓ Special character                                           │     │
│  │                                                                 │     │
│  │  Confirm Password: [••••••••••]  👁                            │     │
│  │                                                                 │     │
│  │  [Reset Password]                                              │     │
│  └────────────────────────────────────────────────────────────────┘     │
└───────────────────────────────┬──────────────────────────────────────────┘
                                │
                                │ 7. POST /auth/reset-password
                                │    { token: "abc123...", newPassword: "..." }
                                ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  BACKEND - AuthService.resetPassword()                                   │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  ✓ Validate token (hash, find, check expiry, check used)      │     │
│  │  ✓ Hash new password with argon2                              │     │
│  │                                                                 │     │
│  │  BEGIN TRANSACTION                                             │     │
│  │    ✓ Update user password                                     │     │
│  │    ✓ Reset failed login attempts to 0                         │     │
│  │    ✓ Clear account lockout                                    │     │
│  │    ✓ Mark token as used                                       │     │
│  │    ✓ Revoke ALL active sessions                               │     │
│  │    ✓ Create audit log entry                                   │     │
│  │  COMMIT                                                        │     │
│  │                                                                 │     │
│  │  ✓ Send security notification                                 │     │
│  │  ✓ Create security alert                                      │     │
│  │  ✓ Return success message                                     │     │
│  └────────────────────────────────────────────────────────────────┘     │
└───────────────────────────────┬──────────────────────────────────────────┘
                                │
                                │ 8. Response: { message: "Password reset..." }
                                ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  SUCCESS PAGE                                                             │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  ✓ Password Reset Successful                                   │     │
│  │                                                                 │     │
│  │  Your password has been successfully reset.                    │     │
│  │  All active sessions have been signed out for security.        │     │
│  │                                                                 │     │
│  │  [Continue to Login]                                           │     │
│  └────────────────────────────────────────────────────────────────┘     │
└───────────────────────────────┬──────────────────────────────────────────┘
                                │
                                │ 9. Redirect to /auth/login
                                ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  LOGIN PAGE                                                               │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  Email: [user@example.com]                                     │     │
│  │  Password: [NewPassword123!]  ← NEW PASSWORD                   │     │
│  │  [Login]                                                       │     │
│  └────────────────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 🔒 Security Checkpoints

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SECURITY LAYER 1: Email Enumeration Prevention                         │
│  ────────────────────────────────────────────────────────────────────   │
│  ✓ Always return success message (even if email doesn't exist)          │
│  ✓ Simulate 200ms delay for non-existent emails                         │
│  ✓ No indication whether email exists or not                            │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  SECURITY LAYER 2: Token Security                                       │
│  ────────────────────────────────────────────────────────────────────   │
│  ✓ 32-byte cryptographically secure random token (256-bit entropy)      │
│  ✓ Token hashed with SHA-256 before storage                             │
│  ✓ Never store plaintext tokens in database                             │
│  ✓ Token expires in 15 minutes                                          │
│  ✓ Single-use tokens (marked as used after consumption)                 │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  SECURITY LAYER 3: Rate Limiting                                        │
│  ────────────────────────────────────────────────────────────────────   │
│  ✓ Forgot password: 3 requests/minute                                   │
│  ✓ Verify token: 5 requests/minute                                      │
│  ✓ Reset password: 3 requests/minute                                    │
│  ✓ Prevents brute force attacks                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  SECURITY LAYER 4: Password Strength                                    │
│  ────────────────────────────────────────────────────────────────────   │
│  ✓ Minimum 8 characters                                                 │
│  ✓ Must contain uppercase letter (A-Z)                                  │
│  ✓ Must contain lowercase letter (a-z)                                  │
│  ✓ Must contain number (0-9)                                            │
│  ✓ Must contain special character (@$!%*?&)                             │
│  ✓ Validated on both client and server                                  │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  SECURITY LAYER 5: Session Invalidation                                 │
│  ────────────────────────────────────────────────────────────────────   │
│  ✓ All active sessions revoked on password reset                        │
│  ✓ Prevents session hijacking after password change                     │
│  ✓ Forces re-authentication on all devices                              │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  SECURITY LAYER 6: Audit & Monitoring                                   │
│  ────────────────────────────────────────────────────────────────────   │
│  ✓ PASSWORD_RESET_REQUESTED logged with IP and user agent               │
│  ✓ PASSWORD_RESET_COMPLETED logged with IP and user agent               │
│  ✓ Security notification sent to user                                   │
│  ✓ Security alert created (MEDIUM severity)                             │
│  ✓ Immutable audit trail for compliance                                 │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Database State Changes

```
BEFORE PASSWORD RESET REQUEST
────────────────────────────────────────────────────────────────────────

users table:
┌──────────┬─────────────────┬──────────────┬──────────────┬──────────────┐
│ id       │ email           │ passwordHash │ failedLogins │ lockoutUntil │
├──────────┼─────────────────┼──────────────┼──────────────┼──────────────┤
│ user-123 │ user@email.com  │ $argon2...   │ 0            │ NULL         │
└──────────┴─────────────────┴──────────────┴──────────────┴──────────────┘

password_reset_tokens table:
┌──────────┬─────────┬───────────┬───────────┬────────┐
│ id       │ userId  │ tokenHash │ expiresAt │ usedAt │
├──────────┼─────────┼───────────┼───────────┼────────┤
│ (empty)  │         │           │           │        │
└──────────┴─────────┴───────────┴───────────┴────────┘

user_sessions table:
┌──────────┬─────────┬──────────────────┬───────────┐
│ id       │ userId  │ refreshTokenHash │ revokedAt │
├──────────┼─────────┼──────────────────┼───────────┤
│ sess-1   │ user-123│ $sha256...       │ NULL      │
│ sess-2   │ user-123│ $sha256...       │ NULL      │
└──────────┴─────────┴──────────────────┴───────────┘


AFTER FORGOT PASSWORD REQUEST
────────────────────────────────────────────────────────────────────────

password_reset_tokens table:
┌──────────┬─────────┬───────────────┬─────────────────────┬────────┐
│ id       │ userId  │ tokenHash     │ expiresAt           │ usedAt │
├──────────┼─────────┼───────────────┼─────────────────────┼────────┤
│ token-1  │ user-123│ $sha256(abc..)│ 2024-02-14 03:00:00 │ NULL   │
└──────────┴─────────┴───────────────┴─────────────────────┴────────┘

admin_audit_logs table:
┌──────────┬─────────┬──────────────────────────┬────────────┐
│ id       │ actorId │ action                   │ createdAt  │
├──────────┼─────────┼──────────────────────────┼────────────┤
│ log-1    │ user-123│ PASSWORD_RESET_REQUESTED │ 2024-02-14 │
└──────────┴─────────┴──────────────────────────┴────────────┘


AFTER PASSWORD RESET COMPLETION
────────────────────────────────────────────────────────────────────────

users table:
┌──────────┬─────────────────┬──────────────────┬──────────────┬──────────────┐
│ id       │ email           │ passwordHash     │ failedLogins │ lockoutUntil │
├──────────┼─────────────────┼──────────────────┼──────────────┼──────────────┤
│ user-123 │ user@email.com  │ $argon2(NEW)...  │ 0            │ NULL         │
└──────────┴─────────────────┴──────────────────┴──────────────┴──────────────┘
                                    ↑ CHANGED

password_reset_tokens table:
┌──────────┬─────────┬───────────────┬─────────────────────┬─────────────────────┐
│ id       │ userId  │ tokenHash     │ expiresAt           │ usedAt              │
├──────────┼─────────┼───────────────┼─────────────────────┼─────────────────────┤
│ token-1  │ user-123│ $sha256(abc..)│ 2024-02-14 03:00:00 │ 2024-02-14 02:50:00 │
└──────────┴─────────┴───────────────┴─────────────────────┴─────────────────────┘
                                                                    ↑ MARKED AS USED

user_sessions table:
┌──────────┬─────────┬──────────────────┬─────────────────────┐
│ id       │ userId  │ refreshTokenHash │ revokedAt           │
├──────────┼─────────┼──────────────────┼─────────────────────┤
│ sess-1   │ user-123│ $sha256...       │ 2024-02-14 02:50:00 │
│ sess-2   │ user-123│ $sha256...       │ 2024-02-14 02:50:00 │
└──────────┴─────────┴──────────────────┴─────────────────────┘
                                                 ↑ ALL SESSIONS REVOKED

admin_audit_logs table:
┌──────────┬─────────┬──────────────────────────┬────────────┐
│ id       │ actorId │ action                   │ createdAt  │
├──────────┼─────────┼──────────────────────────┼────────────┤
│ log-1    │ user-123│ PASSWORD_RESET_REQUESTED │ 2024-02-14 │
│ log-2    │ user-123│ PASSWORD_RESET_COMPLETED │ 2024-02-14 │
└──────────┴─────────┴──────────────────────────┴────────────┘
                                                       ↑ NEW ENTRY

notifications table:
┌──────────┬─────────┬──────────────────┬─────────────────────────────┐
│ id       │ userId  │ type             │ message                     │
├──────────┼─────────┼──────────────────┼─────────────────────────────┤
│ notif-1  │ user-123│ PASSWORD_CHANGED │ Password reset successful...│
└──────────┴─────────┴──────────────────┴─────────────────────────────┘
                                                       ↑ NEW NOTIFICATION

security_alerts table:
┌──────────┬─────────┬──────────────────┬──────────┬─────────────────┐
│ id       │ userId  │ type             │ severity │ description     │
├──────────┼─────────┼──────────────────┼──────────┼─────────────────┤
│ alert-1  │ user-123│ PASSWORD_RESET   │ MEDIUM   │ Password reset..│
└──────────┴─────────┴──────────────────┴──────────┴─────────────────┘
                                                       ↑ NEW ALERT
```

---

## 🎯 Quick Reference

### API Endpoints
```
POST /api/v1/auth/forgot-password
POST /api/v1/auth/verify-reset-token
POST /api/v1/auth/reset-password
```

### Frontend Routes
```
/auth/forgot-password
/auth/reset-password?token=...
```

### Token Lifecycle
```
Generated → Hashed → Stored → Verified → Used → Invalidated
   (32B)    (SHA256)  (15min)   (once)   (mark) (can't reuse)
```

### Password Requirements
```
✓ Length: ≥ 8 characters
✓ Uppercase: A-Z
✓ Lowercase: a-z
✓ Number: 0-9
✓ Special: @$!%*?&
```

---

**Visual Guide Version**: 1.0  
**Last Updated**: 2026-02-14
