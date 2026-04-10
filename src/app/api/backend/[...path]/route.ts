import { randomUUID } from "crypto";
import { getSession } from "@/lib/dal";
import { createInternalAuthHeaders } from "@/lib/server/internal-auth-bridge";
import { NextRequest, NextResponse } from "next/server";

const DEFAULT_BACKEND_ORIGIN = "http://localhost:3001";
const HOP_BY_HOP_RESPONSE_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "content-encoding",
]);
const BLOCKED_REQUEST_HEADERS = new Set([
  "host",
  "connection",
  "content-length",
  "cookie",
  "authorization",
  "x-forwarded-for",
  "x-forwarded-proto",
  "x-forwarded-host",
]);

const getBackendOrigin = (): string => {
  const origin = process.env.BACKEND_API_URL ?? DEFAULT_BACKEND_ORIGIN;
  return origin.replace(/\/$/, "");
};

const buildTargetUrl = (request: NextRequest, path: string[]): string => {
  const suffix = path.join("/");
  const search = request.nextUrl.search;
  const backendOrigin = getBackendOrigin();
  return `${backendOrigin}/${suffix}${search}`;
};

const buildForwardHeaders = (
  request: NextRequest,
  identityHeaders?: HeadersInit,
): Headers => {
  const outgoing = new Headers();

  request.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    if (BLOCKED_REQUEST_HEADERS.has(lowerKey)) return;
    if (lowerKey.startsWith("x-internal-")) return;
    outgoing.set(key, value);
  });

  const requestId = request.headers.get("x-request-id") ?? randomUUID();
  outgoing.set("x-request-id", requestId);

  if (identityHeaders) {
    const authHeaders = new Headers(identityHeaders);
    authHeaders.forEach((value, key) => {
      outgoing.set(key, value);
    });
  }

  return outgoing;
};

const filterResponseHeaders = (headers: Headers): Headers => {
  const filtered = new Headers();

  headers.forEach((value, key) => {
    if (HOP_BY_HOP_RESPONSE_HEADERS.has(key.toLowerCase())) {
      return;
    }
    filtered.set(key, value);
  });

  return filtered;
};

const methodHasBody = (method: string): boolean =>
  method === "POST" || method === "PUT" || method === "PATCH";

const proxyToBackend = async (
  request: NextRequest,
  path: string[],
): Promise<NextResponse> => {
  const session = await getSession();
  const identityHeaders = session?.user?.id
    ? createInternalAuthHeaders({
        userId: session.user.id,
        sessionId: session.session.id,
      })
    : undefined;

  const targetUrl = buildTargetUrl(request, path);
  const body = methodHasBody(request.method) ? await request.text() : undefined;

  const backendResponse = await fetch(targetUrl, {
    method: request.method,
    headers: buildForwardHeaders(request, identityHeaders),
    body,
    redirect: "manual",
    cache: "no-store",
  });

  return new NextResponse(backendResponse.body, {
    status: backendResponse.status,
    headers: filterResponseHeaders(backendResponse.headers),
  });
};

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyToBackend(request, path);
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyToBackend(request, path);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyToBackend(request, path);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyToBackend(request, path);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyToBackend(request, path);
}
