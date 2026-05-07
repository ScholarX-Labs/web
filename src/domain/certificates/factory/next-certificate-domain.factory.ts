import { NextCertificateService } from "@/domain/certificates/application/certificate.service";
import { CompletionWriterService } from "@/domain/certificates/application/completion-writer.service";
import { NextCertificatesRepository } from "@/domain/certificates/infrastructure/db/next-certificates.repository";

export interface NextCertificateDomainServices {
  certificates: NextCertificateService;
  completions: CompletionWriterService;
}

export const createNextCertificateDomain = (): NextCertificateDomainServices => {
  const repository = new NextCertificatesRepository();

  return {
    certificates: new NextCertificateService(repository),
    completions: new CompletionWriterService(repository),
  };
};
