# Email Service Setup

The ServiceFlow application includes a modular email service that supports multiple providers for development and production environments.

## Supported Providers

- **Ethereal Email** (Default for Dev): Generates random test accounts and provides a preview URL in the console. No setup required.
- **Mailtrap** (Recommended for Dev): Captures all emails in a virtual inbox. Requires account.
- **SendGrid** (Production): Reliable transactional email service. Requires API Key.
- **AWS SES** (Production): Scalable email service (Not fully implemented, falls back to console log currently).

## Configuration

Set the `EMAIL_PROVIDER` in your `.env` file:

```bash
EMAIL_PROVIDER=ethereal  # or mailtrap, sendgrid
```

### Ethereal (Development)
No configuration needed. It will auto-generate credentials if not provided.
Check the console logs for "Preview URL" after an email action.

### Mailtrap (Development)
1. Sign up at [Mailtrap.io](https://mailtrap.io).
2. Create an inbox.
3. Copy SMTP settings to `.env`:
   ```bash
   EMAIL_PROVIDER=mailtrap
   MAILTRAP_HOST=sandbox.smtp.mailtrap.io
   MAILTRAP_PORT=2525
   MAILTRAP_USER=your_username
   MAILTRAP_PASS=your_password
   ```

### SendGrid (Production)
1. Sign up at [SendGrid](https://sendgrid.com).
2. Create an API Key with "Mail Send" permissions.
3. Configure `.env`:
   ```bash
   EMAIL_PROVIDER=sendgrid
   SENDGRID_API_KEY=SG.your_api_key_here
   EMAIL_FROM=verified_sender@yourdomain.com
   ```

## Testing Configuration

### Smoke Test Endpoint (Admin Only)

Send a POST request to verify your settings:

```http
POST /api/v1/admin/email/test
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json

{
  "to": "test@example.com"
}
```

Response:
```json
{
  "message": "Test email sent successfully to test@example.com"
}
```

### Manual Testing via Flow
1. **Registration**: Register a new user. Check console/inbox for verification link.
2. **Forgot Password**: Go to `/auth/forgot-password`, enter email. Check console/inbox for reset link.
3. **Resend Verification**: Go to `/auth/resend-verification`.

## Troubleshooting

- **Check Logs**: The application logs detailed information about email attempts.
- **Spam Folder**: Check spam folders if using real providers.
- **API Key**: Ensure SendGrid API key has correct permissions and sender identity is verified.
- **EPERM Error**: If you see filesystem errors, ensure no other process is locking files (though unlikely for email service).
