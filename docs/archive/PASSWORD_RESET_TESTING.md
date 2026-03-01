# Password Reset Flow - Manual Testing Checklist

## Test Environment Setup
- [ ] Backend server running on `http://localhost:3001`
- [ ] Frontend server running on `http://localhost:3000`
- [ ] Database accessible and seeded with test users
- [ ] Email Provider configured (check `EMAIL_PROVIDER` in `.env`)
- [ ] Console logs visible for viewing reset tokens (if using `ethereal` or dev mode fallback)

## Test Credentials
Use these seeded accounts for testing:
- **Admin**: `admin@serviceflow.com` / `Password123!`
- **Staff**: `staff@serviceflow.com` / `Password123!`
- **Worker**: `john.worker@example.com` / `Password123!`

---

## 1. FORGOT PASSWORD FLOW

### 1.1 Valid Email - Happy Path
- [ ] Navigate to `/auth/login`
- [ ] Click "Forgot your password?" link
- [ ] Verify redirect to `/auth/forgot-password`
- [ ] Enter valid email: `admin@serviceflow.com`
- [ ] Click "Send Reset Link"
- [ ] **Expected**: Success message appears
- [ ] **Expected**: Message says "Check Your Email"
- [ ] **Expected**: Email address is displayed in success message
- [ ] **Expected**: Console shows reset token (dev mode)
- [ ] **Expected**: Console shows reset link with token
- [ ] Copy the reset link from console for next tests

### 1.2 Invalid/Non-existent Email
- [ ] Navigate to `/auth/forgot-password`
- [ ] Enter non-existent email: `nonexistent@example.com`
- [ ] Click "Send Reset Link"
- [ ] **Expected**: Same success message (no email enumeration)
- [ ] **Expected**: No error revealing email doesn't exist
- [ ] **Expected**: No token generated in console
- [ ] **Expected**: Response time similar to valid email (no timing attack)

### 1.3 Empty Email
- [ ] Navigate to `/auth/forgot-password`
- [ ] Leave email field empty
- [ ] Click "Send Reset Link"
- [ ] **Expected**: Button disabled or HTML5 validation error
- [ ] **Expected**: No API request sent

### 1.4 Invalid Email Format
- [ ] Navigate to `/auth/forgot-password`
- [ ] Enter invalid format: `notanemail`
- [ ] Click "Send Reset Link"
- [ ] **Expected**: HTML5 validation error
- [ ] **Expected**: No API request sent

### 1.5 Rate Limiting
- [ ] Navigate to `/auth/forgot-password`
- [ ] Submit valid email 4 times rapidly
- [ ] **Expected**: First 3 requests succeed
- [ ] **Expected**: 4th request returns 429 Too Many Requests
- [ ] Wait 60 seconds
- [ ] Submit again
- [ ] **Expected**: Request succeeds

### 1.6 Multiple Requests for Same User
- [ ] Request reset for `admin@serviceflow.com`
- [ ] Note the first token from console
- [ ] Immediately request reset again for same email
- [ ] Note the second token from console
- [ ] **Expected**: Second token is different
- [ ] **Expected**: First token should be invalidated (verify in next section)

### 1.7 UI/UX Elements
- [ ] Verify "Back to Login" button works
- [ ] Verify "Try a different email" button resets form
- [ ] Verify loading state shows during submission
- [ ] Verify email icon appears in success message
- [ ] Verify 15-minute expiry mentioned in success message

---

## 2. RESET PASSWORD FLOW

### 2.1 Valid Token - Happy Path
- [ ] Get reset link from console (from test 1.1)
- [ ] Navigate to the reset link
- [ ] **Expected**: Page shows "Verifying reset token..." briefly
- [ ] **Expected**: Form appears with user's email displayed
- [ ] Enter new password: `NewPassword123!`
- [ ] Enter confirm password: `NewPassword123!`
- [ ] **Expected**: Password strength indicators show all green
- [ ] Click "Reset Password"
- [ ] **Expected**: Success message appears
- [ ] **Expected**: "Password Reset Successful" title shown
- [ ] **Expected**: Message mentions sessions signed out
- [ ] Click "Continue to Login"
- [ ] **Expected**: Redirect to `/auth/login`
- [ ] Login with email and NEW password
- [ ] **Expected**: Login succeeds
- [ ] Logout
- [ ] Try to login with OLD password
- [ ] **Expected**: Login fails

### 2.2 Invalid/Expired Token
- [ ] Navigate to `/auth/reset-password?token=invalidtoken123`
- [ ] **Expected**: "Invalid Reset Link" error shown
- [ ] **Expected**: Red alert icon displayed
- [ ] **Expected**: "Request New Reset Link" button shown
- [ ] **Expected**: "Back to Login" button shown

### 2.3 Missing Token
- [ ] Navigate to `/auth/reset-password` (no token parameter)
- [ ] **Expected**: Error message "No reset token provided"
- [ ] **Expected**: Invalid token UI shown

### 2.4 Expired Token (15 minutes)
**Note**: This test requires waiting 15 minutes or manually updating DB
- [ ] Request password reset
- [ ] Wait 16 minutes (or update `expiresAt` in DB to past time)
- [ ] Try to use the reset link
- [ ] **Expected**: "Invalid or expired reset token" error

### 2.5 Already Used Token
- [ ] Request password reset for `staff@serviceflow.com`
- [ ] Use the token to reset password successfully
- [ ] Try to use the SAME token again
- [ ] **Expected**: "Invalid or expired reset token" error
- [ ] **Expected**: Cannot reuse token

### 2.6 Password Validation

#### 2.6.1 Too Short
- [ ] Navigate to valid reset link
- [ ] Enter password: `Short1!`
- [ ] Enter confirm: `Short1!`
- [ ] Click "Reset Password"
- [ ] **Expected**: Error "Password must be at least 8 characters long"

#### 2.6.2 No Uppercase
- [ ] Enter password: `lowercase123!`
- [ ] Enter confirm: `lowercase123!`
- [ ] Click "Reset Password"
- [ ] **Expected**: Error about missing uppercase letter

#### 2.6.3 No Lowercase
- [ ] Enter password: `UPPERCASE123!`
- [ ] Enter confirm: `UPPERCASE123!`
- [ ] Click "Reset Password"
- [ ] **Expected**: Error about missing lowercase letter

#### 2.6.4 No Number
- [ ] Enter password: `NoNumbers!`
- [ ] Enter confirm: `NoNumbers!`
- [ ] Click "Reset Password"
- [ ] **Expected**: Error about missing number

#### 2.6.5 No Special Character
- [ ] Enter password: `NoSpecial123`
- [ ] Enter confirm: `NoSpecial123`
- [ ] Click "Reset Password"
- [ ] **Expected**: Error about missing special character

#### 2.6.6 Passwords Don't Match
- [ ] Enter password: `ValidPassword123!`
- [ ] Enter confirm: `DifferentPassword123!`
- [ ] Click "Reset Password"
- [ ] **Expected**: Error "Passwords do not match"

### 2.7 Password Strength Indicator
- [ ] Navigate to valid reset link
- [ ] Start typing password: `a`
- [ ] **Expected**: Only "Lowercase letter" shows green
- [ ] Type: `aA`
- [ ] **Expected**: "Lowercase" and "Uppercase" show green
- [ ] Type: `aA1`
- [ ] **Expected**: Above + "Number" shows green
- [ ] Type: `aA1!`
- [ ] **Expected**: Above + "Special character" shows green
- [ ] Type: `aA1!1234`
- [ ] **Expected**: All 5 indicators show green

### 2.8 Show/Hide Password
- [ ] Navigate to valid reset link
- [ ] Enter password in "New Password" field
- [ ] **Expected**: Password hidden by default (dots)
- [ ] Click eye icon
- [ ] **Expected**: Password visible
- [ ] Click eye icon again
- [ ] **Expected**: Password hidden
- [ ] Repeat for "Confirm Password" field

### 2.9 UI/UX Elements
- [ ] Verify email address displayed in description
- [ ] Verify "Cancel" button redirects to login
- [ ] Verify loading state during submission
- [ ] Verify lock icon on submit button
- [ ] Verify password requirements text shown
- [ ] Verify all strength indicators visible

---

## 3. SECURITY TESTS

### 3.1 Session Invalidation
- [ ] Login as `admin@serviceflow.com` with old password
- [ ] Open browser DevTools → Application → Local Storage
- [ ] Note the auth token
- [ ] In another tab, request password reset
- [ ] Complete password reset
- [ ] Go back to first tab (still logged in)
- [ ] Try to make an authenticated request (e.g., view dashboard)
- [ ] **Expected**: Session should be invalid
- [ ] **Expected**: Redirect to login

### 3.2 Token Reuse Prevention
- [ ] Request reset for `worker@example.com`
- [ ] Use token to reset password
- [ ] Try to use same token again
- [ ] **Expected**: Token marked as used in DB
- [ ] **Expected**: Error shown

### 3.3 Token Invalidation on New Request
- [ ] Request reset for `staff@serviceflow.com`
- [ ] Note token #1 from console
- [ ] Before using it, request reset again
- [ ] Note token #2 from console
- [ ] Try to use token #1
- [ ] **Expected**: Token #1 is invalid
- [ ] Use token #2
- [ ] **Expected**: Token #2 works

### 3.4 Audit Logging
- [ ] Request password reset for `admin@serviceflow.com`
- [ ] Check `admin_audit_logs` table in database
- [ ] **Expected**: Entry with action `PASSWORD_RESET_REQUESTED`
- [ ] **Expected**: IP address logged
- [ ] **Expected**: User agent logged
- [ ] Complete password reset
- [ ] Check audit logs again
- [ ] **Expected**: Entry with action `PASSWORD_RESET_COMPLETED`

### 3.5 Security Notification
- [ ] Complete password reset for a user
- [ ] Check `notifications` table in database
- [ ] **Expected**: Notification created for user
- [ ] **Expected**: Type is `PASSWORD_CHANGED`
- [ ] **Expected**: Message mentions sessions signed out

### 3.6 Security Alert
- [ ] Complete password reset
- [ ] Check `security_alerts` table in database
- [ ] **Expected**: Alert created with type `PASSWORD_RESET`
- [ ] **Expected**: Severity is `MEDIUM`
- [ ] **Expected**: User ID, IP, and user agent logged

### 3.7 Failed Login Attempts Reset
- [ ] Attempt login with wrong password 3 times for a user
- [ ] Check `users` table → `failedLoginAttempts` should be 3
- [ ] Request and complete password reset
- [ ] Check `users` table → `failedLoginAttempts`
- [ ] **Expected**: Reset to 0

### 3.8 Account Lockout Cleared
- [ ] Attempt login with wrong password 5 times (trigger lockout)
- [ ] Check `users` table → `lockoutUntil` should be set
- [ ] Request and complete password reset
- [ ] Check `users` table → `lockoutUntil`
- [ ] **Expected**: Set to NULL
- [ ] Try to login with new password
- [ ] **Expected**: Login succeeds (no lockout)

---

## 4. DATABASE VERIFICATION

### 4.1 PasswordResetToken Table
After requesting reset:
- [ ] Query: `SELECT * FROM password_reset_tokens ORDER BY created_at DESC LIMIT 1`
- [ ] **Expected**: New record exists
- [ ] **Expected**: `tokenHash` is SHA-256 hash (64 hex chars)
- [ ] **Expected**: `expiresAt` is ~15 minutes from now
- [ ] **Expected**: `usedAt` is NULL
- [ ] **Expected**: `ipAddress` is logged
- [ ] **Expected**: `userAgent` is logged

After using token:
- [ ] Query same table
- [ ] **Expected**: `usedAt` is now set to current timestamp

### 4.2 User Table Updates
After password reset:
- [ ] Query: `SELECT password_hash, failed_login_attempts, lockout_until FROM users WHERE email = 'test@example.com'`
- [ ] **Expected**: `passwordHash` is different (new hash)
- [ ] **Expected**: `failedLoginAttempts` is 0
- [ ] **Expected**: `lockoutUntil` is NULL

### 4.3 UserSession Table
Before reset:
- [ ] Login and note session ID
- [ ] Query: `SELECT * FROM user_sessions WHERE user_id = 'user-uuid' AND revoked_at IS NULL`
- [ ] **Expected**: Active session exists

After reset:
- [ ] Query same
- [ ] **Expected**: All sessions have `revokedAt` set
- [ ] **Expected**: No active sessions remain

---

## 5. API ENDPOINT TESTS

### 5.1 POST /auth/forgot-password

#### Valid Request
```bash
curl -X POST http://localhost:3001/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@serviceflow.com"}'
```
- [ ] **Expected**: 200 OK
- [ ] **Expected**: Response: `{"message":"If an account with that email exists..."}`

#### Invalid Email Format
```bash
curl -X POST http://localhost:3001/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"notanemail"}'
```
- [ ] **Expected**: 400 Bad Request
- [ ] **Expected**: Validation error

#### Missing Email
```bash
curl -X POST http://localhost:3001/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{}'
```
- [ ] **Expected**: 400 Bad Request

### 5.2 POST /auth/verify-reset-token

#### Valid Token
```bash
curl -X POST http://localhost:3001/api/v1/auth/verify-reset-token \
  -H "Content-Type: application/json" \
  -d '{"token":"<valid-token-from-console>"}'
```
- [ ] **Expected**: 200 OK
- [ ] **Expected**: Response: `{"valid":true,"email":"admin@serviceflow.com"}`

#### Invalid Token
```bash
curl -X POST http://localhost:3001/api/v1/auth/verify-reset-token \
  -H "Content-Type: application/json" \
  -d '{"token":"invalidtoken123"}'
```
- [ ] **Expected**: 400 Bad Request
- [ ] **Expected**: Error: "Invalid or expired reset token"

### 5.3 POST /auth/reset-password

#### Valid Request
```bash
curl -X POST http://localhost:3001/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token":"<valid-token>",
    "newPassword":"NewPassword123!"
  }'
```
- [ ] **Expected**: 200 OK
- [ ] **Expected**: Response: `{"message":"Password has been reset successfully..."}`

#### Weak Password
```bash
curl -X POST http://localhost:3001/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token":"<valid-token>",
    "newPassword":"weak"
  }'
```
- [ ] **Expected**: 400 Bad Request
- [ ] **Expected**: Validation error about password requirements

---

## 6. EDGE CASES

### 6.1 Concurrent Reset Requests
- [ ] Open two browser tabs
- [ ] Request reset in Tab 1
- [ ] Immediately request reset in Tab 2 (same email)
- [ ] **Expected**: Both requests succeed
- [ ] **Expected**: Only second token is valid
- [ ] **Expected**: First token invalidated

### 6.2 Reset During Active Session
- [ ] Login as user
- [ ] Keep session active
- [ ] In another browser, request and complete password reset
- [ ] Go back to first browser
- [ ] Try to navigate or make request
- [ ] **Expected**: Session invalid, redirect to login

### 6.3 Special Characters in Password
- [ ] Use password with all allowed special characters: `P@ss$w!rd%123*`
- [ ] **Expected**: Accepted
- [ ] Login with this password
- [ ] **Expected**: Login succeeds

### 6.4 Very Long Password
- [ ] Use 100-character password (meeting all requirements)
- [ ] **Expected**: Accepted
- [ ] Login with this password
- [ ] **Expected**: Login succeeds

### 6.5 Unicode in Password
- [ ] Try password with unicode: `Pässwörd123!`
- [ ] **Expected**: Accepted (argon2 handles unicode)
- [ ] Login with this password
- [ ] **Expected**: Login succeeds

---

## 7. CROSS-BROWSER TESTING

Test on multiple browsers:
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari (if on Mac)
- [ ] Edge

For each browser:
- [ ] Complete full forgot password flow
- [ ] Complete full reset password flow
- [ ] Verify UI renders correctly
- [ ] Verify form validation works
- [ ] Verify show/hide password works

---

## 8. MOBILE RESPONSIVENESS

Test on mobile viewport (375px width):
- [ ] Forgot password page renders correctly
- [ ] Reset password page renders correctly
- [ ] Forms are usable on mobile
- [ ] Buttons are tappable
- [ ] Text is readable
- [ ] No horizontal scrolling

---

## 9. ACCESSIBILITY

### 9.1 Keyboard Navigation
- [ ] Tab through forgot password form
- [ ] **Expected**: Can focus all inputs and buttons
- [ ] Submit form with Enter key
- [ ] **Expected**: Form submits

### 9.2 Screen Reader
- [ ] Use screen reader (NVDA, JAWS, or VoiceOver)
- [ ] Navigate forgot password page
- [ ] **Expected**: All labels read correctly
- [ ] **Expected**: Error messages announced
- [ ] **Expected**: Success messages announced

### 9.3 Focus Indicators
- [ ] Tab through forms
- [ ] **Expected**: Clear focus indicators on all elements
- [ ] **Expected**: Focus order is logical

---

## 10. PERFORMANCE

### 10.1 Response Times
- [ ] Measure forgot password API response time
- [ ] **Expected**: < 500ms for valid email
- [ ] **Expected**: ~200ms for invalid email (simulated delay)
- [ ] Measure reset password API response time
- [ ] **Expected**: < 1 second

### 10.2 Frontend Load Times
- [ ] Measure forgot password page load
- [ ] **Expected**: < 2 seconds
- [ ] Measure reset password page load
- [ ] **Expected**: < 2 seconds

---

## SUMMARY CHECKLIST

- [ ] All happy path scenarios work
- [ ] All error scenarios handled gracefully
- [ ] Rate limiting prevents abuse
- [ ] Email enumeration prevented
- [ ] Timing attacks mitigated
- [ ] Tokens properly hashed in database
- [ ] Tokens expire after 15 minutes
- [ ] Tokens can only be used once
- [ ] All sessions invalidated on reset
- [ ] Audit logs created for all actions
- [ ] Security notifications sent
- [ ] Password validation enforced
- [ ] UI/UX is intuitive
- [ ] Mobile responsive
- [ ] Accessible
- [ ] Cross-browser compatible
- [ ] No console errors
- [ ] No security warnings

---

## BUGS FOUND

Document any bugs found during testing:

| # | Description | Severity | Steps to Reproduce | Status |
|---|-------------|----------|-------------------|--------|
| 1 |             |          |                   |        |
| 2 |             |          |                   |        |

---

**Testing Completed By**: _______________  
**Date**: _______________  
**Environment**: Development / Staging / Production  
**Overall Status**: ✅ PASS / ❌ FAIL
