import { NextRequest, NextResponse } from "next/server";

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
]);

function resolvePostHogHost(): string | null {
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? process.env.POSTHOG_HOST;
  if (!host) return null;
  const trimmed = host.trim();
  return trimmed.length > 0 ? trimmed.replace(/\/+$/, "") : null;
}

async function proxyToPostHog(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
): Promise<NextResponse> {
  const host = resolvePostHogHost();
  if (!host) {
    return NextResponse.json(
      { ok: false, error: "posthog_host_not_configured" },
      { status: 500 },
    );
  }

  const { path = [] } = await context.params;
  const upstreamUrl = new URL(`${host}/${path.join("/")}`);
  upstreamUrl.search = request.nextUrl.search;

  const headers = new Headers(request.headers);
  for (const header of HOP_BY_HOP_HEADERS) {
    headers.delete(header);
  }

  const upstreamResponse = await fetch(upstreamUrl, {
    method: request.method,
    headers,
    body: request.body,
    redirect: "manual",
    // Required for streaming request bodies in Node runtime.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    duplex: "half",
  });

  const responseHeaders = new Headers(upstreamResponse.headers);
  for (const header of HOP_BY_HOP_HEADERS) {
    responseHeaders.delete(header);
  }

  return new NextResponse(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders,
  });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  return proxyToPostHog(request, context);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  return proxyToPostHog(request, context);
}
