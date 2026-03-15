import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

type EmailProps = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  from?: string;
  replyTo?: string;
};

type SendEmailResult = {
  ok: boolean;
  messageId?: string;
};

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) {
    return transporter;
  }

  const host = process.env.SMTP_HOST!;
  const port = Number.parseInt(process.env.SMTP_PORT ?? "587", 10);
  const user = process.env.SMTP_EMAIL!;
  const pass = process.env.SMTP_PASSWORD!;
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });

  return transporter;
}

async function sendEmail({
  to,
  subject,
  text,
  html,
  from,
  replyTo,
}: EmailProps): Promise<SendEmailResult> {
  const smtpFrom = process.env.SMTP_FROM ?? process.env.SMTP_EMAIL!;

  const maskedRecipient = maskRecipient(to);

  try {
    const info = await getTransporter().sendMail({
      from: from ?? smtpFrom,
      to,
      subject,
      text,
      html,
      replyTo,
    });

    return {
      ok: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("[sendEmail] delivery failed", {
      subject,
      recipient: maskedRecipient,
    });

    throw new Error("Email delivery failed", { cause: error });
  }
}

function maskRecipient(email: string): string {
  const [localPart, domain] = email.split("@");

  if (!localPart || !domain) {
    return "***";
  }

  const firstChar = localPart[0] ?? "*";
  return `${firstChar}***@${domain}`;
}

export { sendEmail };
