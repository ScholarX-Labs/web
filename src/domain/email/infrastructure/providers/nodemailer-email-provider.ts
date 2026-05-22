import nodemailer, { type Transporter } from "nodemailer";
import type { EmailProvider } from "../../contracts/email-provider";
import type {
  EmailProviderConfig,
  EmailProviderRequest,
  EmailProviderResult,
} from "../../contracts/email-types";
import { classifyEmailError } from "../../application/email-error-classifier";

export class NodemailerEmailProvider implements EmailProvider {
  readonly name;
  private transporter: Transporter | null = null;

  constructor(private readonly config: EmailProviderConfig) {
    this.name = config.name;
  }

  async send(request: EmailProviderRequest): Promise<EmailProviderResult> {
    try {
      const info = await this.getTransporter().sendMail({
        from: request.from,
        to: request.to,
        replyTo: request.replyTo,
        subject: request.subject,
        text: request.text,
        html: request.html,
      });

      return {
        accepted: true,
        providerMessageId: info.messageId,
        rawAcceptedAt: new Date(),
      };
    } catch (error) {
      return {
        accepted: false,
        ...classifyEmailError(error),
      };
    }
  }

  async checkHealth(): Promise<"healthy" | "degraded" | "unavailable"> {
    try {
      await this.getTransporter().verify();
      return "healthy";
    } catch {
      return "unavailable";
    }
  }

  private getTransporter(): Transporter {
    if (this.transporter) return this.transporter;

    this.transporter = nodemailer.createTransport({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      connectionTimeout: this.config.timeoutMs,
      greetingTimeout: this.config.timeoutMs,
      socketTimeout: this.config.timeoutMs,
      auth: {
        user: this.config.username,
        pass: this.config.password,
      },
    });

    return this.transporter;
  }
}
