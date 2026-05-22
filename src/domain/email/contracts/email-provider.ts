import type {
  EmailProviderName,
  EmailProviderRequest,
  EmailProviderResult,
} from "./email-types";

export interface EmailProvider {
  readonly name: EmailProviderName;
  send(request: EmailProviderRequest): Promise<EmailProviderResult>;
  checkHealth(): Promise<"healthy" | "degraded" | "unavailable">;
}
