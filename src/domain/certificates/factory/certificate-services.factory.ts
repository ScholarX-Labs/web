/**
 * Certificate domain factory.
 *
 * Wires all ports, adapters, repositories, and application services together.
 * Route handlers and server actions call this factory — they never import
 * infrastructure or SDK types directly.
 *
 * Environment selection:
 * - CERTIFICATE_QUEUE_ADAPTER=noop   → NoopCertificateQueueAdapter (default in dev/test)
 * - CERTIFICATE_QUEUE_ADAPTER=azure  → AzureServiceBusCertificateQueueAdapter
 * - CERTIFICATE_STORAGE_ADAPTER=memory → MemoryCertificateStorageAdapter
 * - CERTIFICATE_STORAGE_ADAPTER=azure  → AzureBlobCertificateStorageAdapter (default in prod)
 * - CERTIFICATE_RENDERER_ADAPTER=fake       → FakeCertificateRendererAdapter (default in dev/test)
 * - CERTIFICATE_RENDERER_ADAPTER=playwright → PlaywrightCertificateRendererAdapter (default in prod)
 */
import { DrizzleCertificateRepository } from "../infrastructure/db/drizzle-certificate.repository";
import { DrizzleCertificateArtifactRepository } from "../infrastructure/db/drizzle-certificate-artifact.repository";
import { DrizzleCertificateEventRepository } from "../infrastructure/db/drizzle-certificate-event.repository";
import { DrizzleCertificateQueueRepository } from "../infrastructure/db/drizzle-certificate-queue.repository";
import { NoopCertificateQueueAdapter } from "../infrastructure/fake/noop-certificate-queue.adapter";
import { MemoryCertificateStorageAdapter } from "../infrastructure/fake/memory-certificate-storage.adapter";
import { FakeCertificateRendererAdapter } from "../infrastructure/fake/fake-certificate-renderer.adapter";
import { CertificateIssueService } from "../application/certificate-issue.service";
import { CertificateVerificationQueryService } from "../application/certificate-verification-query.service";
import { CertificateDownloadQueryService } from "../application/certificate-download-query.service";
import { CertificateRevocationService } from "../application/certificate-revocation.service";
import { CertificateArtifactGenerationService } from "../application/certificate-artifact-generation.service";
import type { ICertificateQueuePort } from "../contracts/certificate-queue.port";
import type { ICertificateStoragePort } from "../contracts/certificate-storage.port";
import type { ICertificateRendererPort } from "../contracts/certificate-renderer.port";

// ---------------------------------------------------------------------------
// Domain services interface
// ---------------------------------------------------------------------------

export interface CertificateDomainServices {
  issueService: CertificateIssueService;
  verificationQuery: CertificateVerificationQueryService;
  downloadQuery: CertificateDownloadQueryService;
  revocationService: CertificateRevocationService;
}

export interface CertificateWorkerServices {
  generationService: CertificateArtifactGenerationService;
}

// ---------------------------------------------------------------------------
// Factory helpers
// ---------------------------------------------------------------------------

function buildQueuePort(): ICertificateQueuePort {
  const adapter = process.env.CERTIFICATE_QUEUE_ADAPTER ?? "noop";

  if (adapter === "azure") {
    // Lazy require prevents Azure SDK from being bundled by Next.js
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { AzureServiceBusCertificateQueueAdapter } = require(
      "../infrastructure/azure/azure-service-bus-certificate-queue.adapter",
    );
    return new AzureServiceBusCertificateQueueAdapter();
  }

  return new NoopCertificateQueueAdapter();
}

function buildStoragePort(): ICertificateStoragePort {
  const adapter =
    process.env.CERTIFICATE_STORAGE_ADAPTER ??
    (process.env.NODE_ENV === "production" ? "azure" : "memory");

  if (adapter === "azure") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { AzureBlobCertificateStorageAdapter } = require(
      "../infrastructure/azure/azure-blob-certificate-storage.adapter",
    );
    return new AzureBlobCertificateStorageAdapter();
  }

  return new MemoryCertificateStorageAdapter();
}

function buildRendererPort(): ICertificateRendererPort {
  const adapter =
    process.env.CERTIFICATE_RENDERER_ADAPTER ??
    (process.env.NODE_ENV === "production" ? "playwright" : "fake");

  if (adapter === "playwright") {
    // Only available in the worker container
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PlaywrightCertificateRendererAdapter } = require(
      "../infrastructure/rendering/playwright-certificate-renderer.adapter",
    );
    return new PlaywrightCertificateRendererAdapter();
  }

  return new FakeCertificateRendererAdapter();
}

// ---------------------------------------------------------------------------
// Public factory functions
// ---------------------------------------------------------------------------

/**
 * Create all certificate domain services for use in route handlers and server actions.
 * Does NOT include the renderer (renderer is worker-only).
 */
export function createCertificateDomain(): CertificateDomainServices {
  const certRepo = new DrizzleCertificateRepository();
  const artifactRepo = new DrizzleCertificateArtifactRepository();
  const eventRepo = new DrizzleCertificateEventRepository();
  const queueRepo = new DrizzleCertificateQueueRepository();
  const queuePort = buildQueuePort();
  const storagePort = buildStoragePort();

  return {
    issueService: new CertificateIssueService(
      certRepo,
      artifactRepo,
      eventRepo,
      queueRepo,
      queuePort,
    ),
    verificationQuery: new CertificateVerificationQueryService(
      certRepo,
      artifactRepo,
      eventRepo,
    ),
    downloadQuery: new CertificateDownloadQueryService(
      certRepo,
      artifactRepo,
      eventRepo,
      storagePort,
    ),
    revocationService: new CertificateRevocationService(certRepo, eventRepo),
  };
}

/**
 * Create services for the worker process.
 * Includes the renderer — ONLY call from worker entrypoints.
 */
export function createCertificateWorkerDomain(): CertificateWorkerServices {
  const certRepo = new DrizzleCertificateRepository();
  const artifactRepo = new DrizzleCertificateArtifactRepository();
  const eventRepo = new DrizzleCertificateEventRepository();
  const renderer = buildRendererPort();
  const storagePort = buildStoragePort();

  return {
    generationService: new CertificateArtifactGenerationService(
      certRepo,
      artifactRepo,
      eventRepo,
      renderer,
      storagePort,
    ),
  };
}
