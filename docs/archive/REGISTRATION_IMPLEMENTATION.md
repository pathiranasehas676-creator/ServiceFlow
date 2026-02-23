# Self-Registration & Email Verification Implementation

## Overview
Implemented a complete self-registration flow with mandatory email verification.

## Features
- **Self-Registration**: Users can sign up with email, password, and full name. Default role is `WORKER`.
- **Email Verification**: User receives a verification link via email (simulated in console).
- **Login Restriction**: Users cannot login until email is verified (configurable via `REQUIRE_EMAIL_VERIFICATION`).
- **Resend Verification**: Users can request a new verification link if expired or lost.
- **Audit Logging**: Registration and verification actions are logged.
- **Rate Limiting**: Protection against abuse.

## Configuration
Add to `.env`:
```
REQUIRE_EMAIL_VERIFICATION=true  # Set to "false" to disable login block
FRONTEND_URL=http://localhost:3000
```

## API Endpoints
- `POST /api/v1/auth/register` - Create account
- `POST /api/v1/auth/verify-email` - Verify email with token
- `POST /api/v1/auth/resend-verification` - Resend verification email

## Frontend Pages
- `/auth/register` - Registration form
- `/auth/verify-email?token=...` - Verification processing page
- `/auth/resend-verification` - Resend link form
- `/auth/login` - Updated to handle verification errors

## Testing
1. Navigate to `/auth/register`.
2. Fill out the form and submit.
3. Check backend console for verification link: `[EMAIL VERIFICATION] Link: ...`
4. Copy link and open in browser.
5. Verify success message.
6. Login with new credentials.

## Database Schema Changes
- `User` model: Added `emailVerifiedAt` (DateTime, nullable).
- `VerificationToken` model: New table for storing hashed verification tokens.

## Security
- Tokens are hashed (SHA-256) before storage.
- Tokens expire in 24 hours.
- Tokens are single-use.
- Email enumeration on "resend" is prevented (always returns success message).

## Known Issues
- If you encounter `EPERM` errors when running `npx prisma generate`, ensure the backend server is stopped.
- Run `npx prisma generate` after pulling this code to ensure Prisma Client types are updated.
- You must restart the backend server for schema changes to take effect.
