import nodemailer from "nodemailer";

export interface IEmailService {
  sendClaimEmail(to: string, recipientName: string, claimUrl: string): Promise<void>;
  sendReminderEmail(to: string, recipientName: string, claimUrl: string): Promise<void>;
}

function claimEmailHtml(recipientName: string, claimUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your ScholarX Certificate is Ready</title>
  <style>
    body { margin: 0; padding: 0; background: #F8F6F1; font-family: Inter, Arial, sans-serif; }
    .container { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: #1E3A5F; padding: 36px 40px; text-align: center; }
    .header h1 { color: #C9A84C; font-size: 22px; margin: 0; letter-spacing: 1px; }
    .body { padding: 36px 40px; }
    .body p { color: #444; font-size: 15px; line-height: 1.7; margin: 0 0 16px; }
    .cta { display: block; background: #1E3A5F; color: #C9A84C !important; text-decoration: none; text-align: center; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 700; margin: 28px 0; }
    .note { font-size: 12px; color: #aaa; margin-top: 24px; }
    .footer { background: #F8F6F1; padding: 20px 40px; text-align: center; font-size: 12px; color: #bbb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>ScholarX — Your Certificate is Ready 🎓</h1></div>
    <div class="body">
      <p>Hi <strong>${recipientName}</strong>,</p>
      <p>Congratulations! You've successfully completed your ScholarX program. Your verified digital certificate is ready to be claimed.</p>
      <p>Click the button below to view, download, and share your certificate:</p>
      <a class="cta" href="${claimUrl}">Claim My Certificate →</a>
      <p class="note">This link expires in <strong>30 days</strong>. If you have questions, reply to this email or contact support@scholarx.lk.</p>
    </div>
    <div class="footer">ScholarX · Sri Lanka &nbsp;|&nbsp; <a href="https://scholarx.lk" style="color:#aaa;">scholarx.lk</a></div>
  </div>
</body>
</html>`;
}

function reminderEmailHtml(recipientName: string, claimUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Don't forget your ScholarX Certificate</title>
  <style>
    body { margin: 0; padding: 0; background: #F8F6F1; font-family: Inter, Arial, sans-serif; }
    .container { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: #1E3A5F; padding: 36px 40px; text-align: center; }
    .header h1 { color: #C9A84C; font-size: 20px; margin: 0; }
    .body { padding: 36px 40px; }
    .body p { color: #444; font-size: 15px; line-height: 1.7; margin: 0 0 16px; }
    .cta { display: block; background: #1E3A5F; color: #C9A84C !important; text-decoration: none; text-align: center; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 700; margin: 28px 0; }
    .footer { background: #F8F6F1; padding: 20px 40px; text-align: center; font-size: 12px; color: #bbb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>Reminder: Your Certificate is Waiting 📜</h1></div>
    <div class="body">
      <p>Hi <strong>${recipientName}</strong>,</p>
      <p>We noticed you haven't claimed your ScholarX certificate yet. It's ready and waiting for you!</p>
      <a class="cta" href="${claimUrl}">Claim My Certificate →</a>
      <p>Your link will expire soon — claim it before it does.</p>
    </div>
    <div class="footer">ScholarX · Sri Lanka &nbsp;|&nbsp; <a href="https://scholarx.lk" style="color:#aaa;">scholarx.lk</a></div>
  </div>
</body>
</html>`;
}

/**
 * CertificateEmailService
 *
 * Sends branded claim and reminder emails for certificates using nodemailer.
 * Configured via environment variables: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM.
 */
export class CertificateEmailService implements IEmailService {
  private readonly transporter: nodemailer.Transporter;
  private readonly from: string;

  constructor() {
    this.from = process.env.SMTP_FROM ?? "ScholarX <noreply@scholarx.lk>";
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? "smtp.resend.com",
      port: parseInt(process.env.SMTP_PORT ?? "587", 10),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendClaimEmail(
    to: string,
    recipientName: string,
    claimUrl: string,
  ): Promise<void> {
    await this.transporter.sendMail({
      from: this.from,
      to,
      subject: `🎓 Your ScholarX Certificate is Ready — Claim it Now`,
      html: claimEmailHtml(recipientName, claimUrl),
    });
  }

  async sendReminderEmail(
    to: string,
    recipientName: string,
    claimUrl: string,
  ): Promise<void> {
    await this.transporter.sendMail({
      from: this.from,
      to,
      subject: `📜 Reminder: Your ScholarX Certificate is Waiting`,
      html: reminderEmailHtml(recipientName, claimUrl),
    });
  }
}
