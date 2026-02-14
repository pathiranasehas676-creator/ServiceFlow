/**
 * Email Template for Password Reset
 * 
 * This is a stub template. In production, integrate with:
 * - SendGrid
 * - AWS SES
 * - Nodemailer with SMTP
 * - Postmark
 */

export interface PasswordResetEmailData {
    email: string;
    fullName: string;
    resetToken: string;
    expiresInMinutes: number;
}

export function generatePasswordResetEmail(data: PasswordResetEmailData): {
    to: string;
    subject: string;
    html: string;
    text: string;
} {
    const { email, fullName, resetToken, expiresInMinutes } = data;

    // In production, use environment variable for frontend URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/auth/reset-password?token=${resetToken}`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password - ServiceFlow</title>
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
    .token-box {
      background-color: #f3f4f6;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 16px;
      margin: 20px 0;
      font-family: 'Courier New', monospace;
      word-break: break-all;
      font-size: 14px;
    }
    .warning {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 12px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #6b7280;
      text-align: center;
    }
    .security-tips {
      background-color: #f9fafb;
      border-radius: 6px;
      padding: 16px;
      margin: 20px 0;
    }
    .security-tips h3 {
      margin-top: 0;
      font-size: 14px;
      color: #374151;
    }
    .security-tips ul {
      margin: 0;
      padding-left: 20px;
      font-size: 13px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🔐 ServiceFlow</div>
      <h1 style="color: #111827; margin-top: 10px;">Reset Your Password</h1>
    </div>

    <div class="content">
      <p>Hi ${fullName},</p>
      
      <p>We received a request to reset your password for your ServiceFlow account (<strong>${email}</strong>).</p>
      
      <p>Click the button below to reset your password:</p>
      
      <div style="text-align: center;">
        <a href="${resetLink}" class="button">Reset Password</a>
      </div>
      
      <p style="font-size: 14px; color: #6b7280;">Or copy and paste this link into your browser:</p>
      <div class="token-box">${resetLink}</div>

      <div class="warning">
        <strong>⏰ This link will expire in ${expiresInMinutes} minutes.</strong>
      </div>

      <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>

      <div class="security-tips">
        <h3>🛡️ Security Tips:</h3>
        <ul>
          <li>Never share your password with anyone</li>
          <li>Use a unique password for ServiceFlow</li>
          <li>Enable two-factor authentication for extra security</li>
          <li>If you see suspicious activity, contact support immediately</li>
        </ul>
      </div>
    </div>

    <div class="footer">
      <p>This is an automated email from ServiceFlow. Please do not reply to this email.</p>
      <p>If you need help, contact us at support@serviceflow.com</p>
      <p>&copy; ${new Date().getFullYear()} ServiceFlow. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;

    const text = `
Reset Your Password - ServiceFlow

Hi ${fullName},

We received a request to reset your password for your ServiceFlow account (${email}).

Click the link below to reset your password:
${resetLink}

This link will expire in ${expiresInMinutes} minutes.

If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.

Security Tips:
- Never share your password with anyone
- Use a unique password for ServiceFlow
- Enable two-factor authentication for extra security
- If you see suspicious activity, contact support immediately

---
This is an automated email from ServiceFlow. Please do not reply to this email.
If you need help, contact us at support@serviceflow.com

© ${new Date().getFullYear()} ServiceFlow. All rights reserved.
  `.trim();

    return {
        to: email,
        subject: 'Reset Your Password - ServiceFlow',
        html,
        text,
    };
}

/**
 * Example integration with SendGrid:
 * 
 * import sgMail from '@sendgrid/mail';
 * 
 * sgMail.setApiKey(process.env.SENDGRID_API_KEY);
 * 
 * export async function sendPasswordResetEmail(data: PasswordResetEmailData) {
 *   const emailContent = generatePasswordResetEmail(data);
 *   
 *   await sgMail.send({
 *     to: emailContent.to,
 *     from: 'noreply@serviceflow.com',
 *     subject: emailContent.subject,
 *     text: emailContent.text,
 *     html: emailContent.html,
 *   });
 * }
 */

/**
 * Example integration with Nodemailer:
 * 
 * import nodemailer from 'nodemailer';
 * 
 * const transporter = nodemailer.createTransport({
 *   host: process.env.SMTP_HOST,
 *   port: parseInt(process.env.SMTP_PORT || '587'),
 *   secure: false,
 *   auth: {
 *     user: process.env.SMTP_USER,
 *     pass: process.env.SMTP_PASS,
 *   },
 * });
 * 
 * export async function sendPasswordResetEmail(data: PasswordResetEmailData) {
 *   const emailContent = generatePasswordResetEmail(data);
 *   
 *   await transporter.sendMail({
 *     from: '"ServiceFlow" <noreply@serviceflow.com>',
 *     to: emailContent.to,
 *     subject: emailContent.subject,
 *     text: emailContent.text,
 *     html: emailContent.html,
 *   });
 * }
 */
