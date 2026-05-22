import { EmailDeliveryService } from "../application/email-delivery.service";
import { ConsoleEmailMetricsSink } from "../application/email-metrics";
import {
  DefaultEmailFallbackPolicy,
  DefaultEmailRetryPolicy,
} from "../application/email-policies";
import { DbEmailRateLimiter } from "../application/email-rate-limiter";
import { DbProviderCircuitBreaker } from "../application/provider-circuit-breaker";
import type { EmailProvider } from "../contracts/email-provider";
import type { EmailDeliveryRepository } from "../contracts/email-delivery.repository";
import type { EmailServiceConfig } from "../contracts/email-types";
import {
  ConsoleEmailLogger,
  SystemClock,
} from "../application/email-delivery.service";
import { DrizzleEmailDeliveryRepository } from "../infrastructure/db/drizzle-email-delivery.repository";
import { loadEmailServiceConfigFromEnv } from "../infrastructure/email-config";
import { NodemailerEmailProvider } from "../infrastructure/providers/nodemailer-email-provider";

type CreateEmailDeliveryServiceInput = {
  config: EmailServiceConfig;
  repository: EmailDeliveryRepository;
  providers: EmailProvider[];
};

export function createEmailDeliveryService(
  input: CreateEmailDeliveryServiceInput,
): EmailDeliveryService {
  return new EmailDeliveryService({
    config: input.config,
    repository: input.repository,
    providers: input.providers,
    retryPolicy: new DefaultEmailRetryPolicy(input.config),
    fallbackPolicy: new DefaultEmailFallbackPolicy(input.config.fallbackEnabled),
    circuitBreaker: new DbProviderCircuitBreaker(input.config.circuitBreaker),
    rateLimiter: new DbEmailRateLimiter(input.config.rateLimits),
    metrics: new ConsoleEmailMetricsSink(),
    clock: new SystemClock(),
    logger: new ConsoleEmailLogger(),
  });
}

let singleton: EmailDeliveryService | null = null;

export function createDefaultEmailDeliveryService(): EmailDeliveryService {
  if (singleton) return singleton;

  const config = loadEmailServiceConfigFromEnv();
  singleton = createEmailDeliveryService({
    config,
    repository: new DrizzleEmailDeliveryRepository(),
    providers: config.providers.map((provider) => new NodemailerEmailProvider(provider)),
  });
  return singleton;
}
