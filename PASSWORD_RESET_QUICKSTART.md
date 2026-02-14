# Password Reset - Quick Start Testing Guide

## 🚀 Quick Test (5 Minutes)

### Prerequisites
```bash
# 1. Start backend
cd backend
npm run start:dev

# 2. Start frontend (new terminal)
cd frontend
npm run dev
```

### Test Steps

#### Step 1: Request Password Reset
1. Open browser: `http://localhost:3000/auth/login`
2. Click **"Forgot your password?"**
3. Enter email: `admin@serviceflow.com`
4. Click **"Send Reset Link"**
5. ✅ Should see success message

#### Step 2: Get Reset Token
1. Check backend console/terminal
2. Look for line: `[PASSWORD RESET] Token for admin@serviceflow.com: abc123...`
3. Look for line: `[PASSWORD RESET] Reset link: http://localhost:3000/auth/reset-password?token=abc123...`
4. Copy the full reset link

#### Step 3: Reset Password
1. Paste reset link in browser
2. ✅ Should see "Verifying reset token..."
3. ✅ Should show form with email: `admin@serviceflow.com`
4. Enter new password: `NewPassword123!`
5. Confirm password: `NewPassword123!`
6. ✅ All 5 password strength indicators should be green
7. Click **"Reset Password"**
8. ✅ Should see success message
9. Click **"Continue to Login"**

#### Step 4: Login with New Password
1. Email: `admin@serviceflow.com`
2. Password: `NewPassword123!` (the NEW password)
3. Click **"Login"**
4. ✅ Should login successfully and redirect to admin dashboard

#### Step 5: Verify Old Password Doesn't Work
1. Logout
2. Try to login with old password: `Password123!`
3. ✅ Should fail with error

---

## 🧪 Test Different Scenarios

### Test 1: Invalid Email (No Enumeration)
```
1. Go to /auth/forgot-password
2. Enter: nonexistent@example.com
3. Click "Send Reset Link"
✅ Should show SAME success message
✅ Should NOT reveal email doesn't exist
✅ No token in console
```

### Test 2: Expired Token
```
1. Request reset for admin@serviceflow.com
2. Wait 16 minutes (or manually update DB)
3. Try to use the reset link
✅ Should show "Invalid or expired reset token"
```

### Test 3: Weak Password
```
1. Get valid reset link
2. Enter password: "weak"
3. Try to submit
✅ Should show validation errors
✅ Password strength indicators should be red
```

### Test 4: Passwords Don't Match
```
1. Get valid reset link
2. New password: "ValidPassword123!"
3. Confirm password: "DifferentPassword123!"
4. Try to submit
✅ Should show "Passwords do not match" error
```

### Test 5: Token Reuse
```
1. Request reset
2. Use token to reset password successfully
3. Try to use SAME token again
✅ Should show "Invalid or expired reset token"
```

### Test 6: Rate Limiting
```
1. Go to /auth/forgot-password
2. Submit email 4 times rapidly
✅ First 3 should succeed
✅ 4th should return 429 Too Many Requests
```

---

## 🔍 Database Verification

### Check Token Created
```sql
-- After requesting reset
SELECT * FROM password_reset_tokens 
WHERE user_id = (SELECT id FROM users WHERE email = 'admin@serviceflow.com')
ORDER BY created_at DESC 
LIMIT 1;

-- Should show:
-- ✓ tokenHash (64 hex chars)
-- ✓ expiresAt (~15 min from now)
-- ✓ usedAt (NULL)
-- ✓ ipAddress
-- ✓ userAgent
```

### Check Token Used
```sql
-- After completing reset
SELECT * FROM password_reset_tokens 
WHERE user_id = (SELECT id FROM users WHERE email = 'admin@serviceflow.com')
ORDER BY created_at DESC 
LIMIT 1;

-- Should show:
-- ✓ usedAt (now has timestamp)
```

### Check Sessions Revoked
```sql
-- After completing reset
SELECT * FROM user_sessions 
WHERE user_id = (SELECT id FROM users WHERE email = 'admin@serviceflow.com');

-- Should show:
-- ✓ All sessions have revokedAt timestamp
```

### Check Audit Logs
```sql
-- Check audit logs
SELECT action, action_detail, created_at 
FROM admin_audit_logs 
WHERE actor_email = 'admin@serviceflow.com'
ORDER BY created_at DESC 
LIMIT 5;

-- Should show:
-- ✓ PASSWORD_RESET_REQUESTED
-- ✓ PASSWORD_RESET_COMPLETED
```

### Check Notification Created
```sql
-- Check notification
SELECT type, title, message 
FROM notifications 
WHERE user_id = (SELECT id FROM users WHERE email = 'admin@serviceflow.com')
ORDER BY created_at DESC 
LIMIT 1;

-- Should show:
-- ✓ type: PASSWORD_CHANGED
-- ✓ title: "Password Reset Successful"
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Cannot find module '@/components/ui/...'"
**Solution**: Install missing UI components
```bash
cd frontend
npx shadcn-ui@latest add button input label card alert
```

### Issue 2: Reset link doesn't appear in console
**Solution**: Check backend terminal, not frontend. Look for `[PASSWORD RESET]` prefix.

### Issue 3: Token verification fails immediately
**Solution**: 
- Check token wasn't already used
- Check token hasn't expired (15 min limit)
- Verify you copied the full token from console

### Issue 4: 429 Rate Limit Error
**Solution**: Wait 60 seconds before trying again. Rate limits reset every minute.

### Issue 5: Password validation fails
**Solution**: Ensure password has:
- At least 8 characters
- One uppercase (A-Z)
- One lowercase (a-z)
- One number (0-9)
- One special character (@$!%*?&)

### Issue 6: Sessions not revoked
**Solution**: Check database directly. If sessions still active, there may be a transaction issue.

---

## 📋 Quick Checklist

Before marking as complete, verify:

- [ ] Can request password reset
- [ ] Token appears in backend console
- [ ] Reset link works
- [ ] Password validation works (all 5 requirements)
- [ ] Password strength indicator updates in real-time
- [ ] Show/hide password works
- [ ] Can reset password successfully
- [ ] Old password no longer works
- [ ] New password works for login
- [ ] Token can't be reused
- [ ] All sessions revoked after reset
- [ ] Audit logs created
- [ ] Notification created
- [ ] Security alert created
- [ ] Rate limiting works (3 req/min)
- [ ] Invalid email shows generic message (no enumeration)
- [ ] Expired token shows error
- [ ] UI is responsive on mobile
- [ ] No console errors

---

## 🎯 Expected Console Output

### Backend Console (after forgot password request):
```
[PASSWORD RESET] Token for admin@serviceflow.com: a1b2c3d4e5f6...
[PASSWORD RESET] Reset link: http://localhost:3000/auth/reset-password?token=a1b2c3d4e5f6...
```

### Backend Console (after reset completion):
```
(No specific output, but check audit logs in database)
```

### Frontend Console:
```
(Should be clean, no errors)
```

---

## 🔐 Security Verification

### Verify Email Enumeration Prevention
```bash
# Test with valid email
curl -X POST http://localhost:3001/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@serviceflow.com"}' \
  -w "\nTime: %{time_total}s\n"

# Test with invalid email
curl -X POST http://localhost:3001/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"nonexistent@example.com"}' \
  -w "\nTime: %{time_total}s\n"

# ✅ Both should:
# - Return same message
# - Take similar time (~0.2s difference max)
```

### Verify Token Hashing
```sql
-- Check token is hashed, not plaintext
SELECT token_hash FROM password_reset_tokens LIMIT 1;

-- ✅ Should be 64 hex characters (SHA-256 hash)
-- ✅ Should NOT match the token from console
```

### Verify Rate Limiting
```bash
# Send 4 requests rapidly
for i in {1..4}; do
  curl -X POST http://localhost:3001/api/v1/auth/forgot-password \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@serviceflow.com"}'
  echo ""
done

# ✅ First 3 should return 200
# ✅ 4th should return 429
```

---

## 📞 Need Help?

### Check Logs
```bash
# Backend logs
cd backend
npm run start:dev
# Watch for errors

# Frontend logs
cd frontend
npm run dev
# Check browser console
```

### Check Database
```bash
# Connect to PostgreSQL
psql -U postgres -d serviceflow

# Check tables
\dt

# Query reset tokens
SELECT * FROM password_reset_tokens ORDER BY created_at DESC LIMIT 5;
```

### Common Commands
```bash
# Restart backend
cd backend
npm run start:dev

# Restart frontend
cd frontend
npm run dev

# Clear database and reseed
cd backend
npx prisma migrate reset
npm run seed
```

---

**Quick Start Guide Version**: 1.0  
**Estimated Testing Time**: 5-10 minutes  
**Last Updated**: 2026-02-14
