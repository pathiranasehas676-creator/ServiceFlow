/**
 * Email Template for Email Verification
 */

export interface EmailVerificationData {
  email: string;
  fullName: string;
  verificationToken: string;
  expiresInHours: number;
}

export function generateEmailVerification(data: EmailVerificationData): {
  to: string;
  subject: string;
  html: string;
  text: string;
} {
  const { email, fullName, verificationToken, expiresInHours } = data;

  // In production, use environment variable for frontend URL
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const verificationLink = `${frontendUrl}/auth/verify-email?token=${verificationToken}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email - ServiceFlow</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #2563eb;
    }
    .content {
      margin-bottom: 30px;
    }
    .button {
      display: inline-block;
      padding: 14px 28px;
      background-color: #2563eb;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      text-align: center;
      margin: 20px 0;
    }
    .button:hover {
      background-color: #1d4ed8;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #6b7280;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">✅ ServiceFlow</div>
      <h1 style="color: #111827; margin-top: 10px;">Verify Your Email</h1>
    </div>

    <div class="content">
      <p>Hi ${fullName},</p>
      
      <p>Thank you for registering with ServiceFlow! To complete your registration and secure your account, please verify your email address.</p>
      
      <p>Click the button below to verify your email:</p>
      
      <div style="text-align: center;">
        <a href="${verificationLink}" class="button">Verify Email</a>
      </div>
      
      <p style="font-size: 14px; color: #6b7280;">Or copy and paste this link into your browser:</p>
      <div style="background-color: #f3f4f6; padding: 10px; border-radius: 4px; font-family: monospace; word-break: break-all;">${verificationLink}</div>

      <p><strong>This link will expire in ${expiresInHours} hours.</strong></p>

      <p>If you didn't create an account with ServiceFlow, you can safely ignore this email.</p>
    </div>

    <div class="footer">
      <p>This is an automated email from ServiceFlow. Please do not reply to this email.</p>
      <p>&copy; ${new Date().getFullYear()} ServiceFlow. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Verify Your Email - ServiceFlow

Hi ${fullName},

Thank you for registering with ServiceFlow! To complete your registration and secure your account, please verify your email address.

Click the link below to verify your email:
${verificationLink}

This link will expire in ${expiresInHours} hours.

If you didn't create an account with ServiceFlow, you can safely ignore this email.

---
This is an automated email from ServiceFlow. Please do not reply to this email.
© ${new Date().getFullYear()} ServiceFlow. All rights reserved.
  `.trim();

  return {
    to: email,
    subject: 'Verify Your Email - ServiceFlow',
    html,
    text,
  };
}
