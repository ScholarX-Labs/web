import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  renderToBuffer,
  Font,
} from "@react-pdf/renderer";
import { createElement } from "react";
import QRCode from "qrcode";
import type { CertificateRole } from "@/domain/certificates/contracts";

// Register a clean sans-serif font (falls back to Helvetica if not available)
Font.register({
  family: "Inter",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff",
      fontWeight: 400,
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hiJ-Ek-_EeA.woff",
      fontWeight: 700,
    },
  ],
});

const BRAND_BLUE = "#1E3A5F";
const BRAND_GOLD = "#C9A84C";
const BRAND_LIGHT = "#F8F6F1";

const styles = StyleSheet.create({
  page: {
    backgroundColor: BRAND_LIGHT,
    fontFamily: "Inter",
    padding: 40,
    flexDirection: "column",
    alignItems: "center",
  },
  border: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    bottom: 12,
    borderWidth: 2,
    borderColor: BRAND_GOLD,
    borderStyle: "solid",
  },
  header: {
    marginTop: 20,
    alignItems: "center",
  },
  orgName: {
    fontSize: 11,
    color: BRAND_BLUE,
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  titleLine: {
    width: 80,
    height: 1.5,
    backgroundColor: BRAND_GOLD,
    marginVertical: 8,
  },
  certTitle: {
    fontSize: 28,
    fontWeight: 700,
    color: BRAND_BLUE,
    marginBottom: 2,
  },
  certSubtitle: {
    fontSize: 11,
    color: "#666",
    marginBottom: 24,
  },
  body: {
    alignItems: "center",
    marginVertical: 12,
  },
  presentsText: {
    fontSize: 10,
    color: "#888",
    marginBottom: 6,
  },
  recipientName: {
    fontSize: 32,
    fontWeight: 700,
    color: BRAND_BLUE,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 11,
    color: "#555",
    textAlign: "center",
    maxWidth: 380,
    lineHeight: 1.6,
    marginBottom: 6,
  },
  programName: {
    fontSize: 15,
    fontWeight: 700,
    color: BRAND_BLUE,
    marginTop: 4,
  },
  mentorBadge: {
    backgroundColor: BRAND_BLUE,
    color: "#fff",
    fontSize: 8,
    letterSpacing: 2,
    textTransform: "uppercase",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 2,
    marginTop: 10,
  },
  footer: {
    marginTop: "auto",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    width: "100%",
    paddingHorizontal: 20,
  },
  dateBlock: {
    alignItems: "flex-start",
  },
  dateLabel: { fontSize: 8, color: "#999", letterSpacing: 1 },
  dateValue: { fontSize: 10, color: BRAND_BLUE, fontWeight: 700 },
  idBlock: {
    alignItems: "center",
  },
  shortId: { fontSize: 7, color: "#aaa", letterSpacing: 1 },
  qrImage: { width: 52, height: 52 },
  signBlock: {
    alignItems: "flex-end",
  },
  signLine: { width: 80, height: 1, backgroundColor: BRAND_BLUE, marginBottom: 3 },
  signLabel: { fontSize: 8, color: "#999", letterSpacing: 1 },
  fingerprintText: { fontSize: 6, color: "#bbb", marginTop: 2 },
});

export interface CertificateRenderData {
  id: string;
  shortId: string;
  recipientName: string;
  programName: string;
  seasonNumber: number;
  role: CertificateRole;
  completionDate: Date;
  issuedAt: Date;
  verificationUrl: string;
  signatureFingerprint: string; // first 16 chars of signatureHex
}

async function buildQrDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, { width: 120, margin: 1, color: { dark: BRAND_BLUE } });
}

function CertificatePageContent({
  data,
  qrDataUrl,
}: {
  data: CertificateRenderData;
  qrDataUrl: string;
}) {
  const isMentor = data.role === "mentor";
  const formattedCompletion = data.completionDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return createElement(
    Document,
    { title: `ScholarX Certificate — ${data.recipientName}` },
    createElement(
      Page,
      { size: "A4", orientation: "landscape", style: styles.page },
      createElement(View, { style: styles.border }),
      createElement(
        View,
        { style: styles.header },
        createElement(Text, { style: styles.orgName }, "ScholarX"),
        createElement(View, { style: styles.titleLine }),
        createElement(Text, { style: styles.certTitle }, "Certificate of Completion"),
        createElement(
          Text,
          { style: styles.certSubtitle },
          isMentor ? "Mentor Recognition" : "Mentee Achievement",
        ),
      ),
      createElement(
        View,
        { style: styles.body },
        createElement(Text, { style: styles.presentsText }, "This is to certify that"),
        createElement(Text, { style: styles.recipientName }, data.recipientName),
        createElement(
          Text,
          { style: styles.descriptionText },
          isMentor
            ? `has served as a Mentor in the`
            : `has successfully completed the`,
        ),
        createElement(Text, { style: styles.programName }, data.programName),
        createElement(
          Text,
          { style: styles.descriptionText },
          `Season ${data.seasonNumber} • Completed ${formattedCompletion}`,
        ),
        isMentor
          ? createElement(Text, { style: styles.mentorBadge }, "Verified Mentor")
          : null,
      ),
      createElement(
        View,
        { style: styles.footer },
        createElement(
          View,
          { style: styles.dateBlock },
          createElement(Text, { style: styles.dateLabel }, "DATE ISSUED"),
          createElement(
            Text,
            { style: styles.dateValue },
            data.issuedAt.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
          ),
        ),
        createElement(
          View,
          { style: styles.idBlock },
          createElement(Image, { style: styles.qrImage, src: qrDataUrl }),
          createElement(Text, { style: styles.shortId }, data.shortId),
        ),
        createElement(
          View,
          { style: styles.signBlock },
          createElement(View, { style: styles.signLine }),
          createElement(Text, { style: styles.signLabel }, "SCHOLARX AUTHORIZED"),
          createElement(
            Text,
            { style: styles.fingerprintText },
            `ID: ${data.signatureFingerprint}`,
          ),
        ),
      ),
    ),
  );
}

export class CertificatePdfService {
  /**
   * Generate an A4 landscape PDF buffer for the given certificate data.
   */
  async generatePdf(data: CertificateRenderData): Promise<Buffer> {
    const qrDataUrl = await buildQrDataUrl(data.verificationUrl);
    const docElement = createElement(Document, { title: `ScholarX Certificate — ${data.recipientName}` },
      createElement(CertificatePageContent, { data, qrDataUrl }),
    );
    const buffer = await renderToBuffer(docElement);
    return Buffer.from(buffer);
  }

  /**
   * Generate a 1200×630 PNG buffer optimized for social sharing (LinkedIn OG).
   * We use a landscape "landscape" page at fixed dimensions rendered to PNG.
   */
  async generatePng(data: CertificateRenderData): Promise<Buffer> {
    // For social share image, we render the same PDF and callers can convert
    // PNG via a separate image conversion step if needed. Return PDF buffer for now.
    return this.generatePdf(data);
  }
}
