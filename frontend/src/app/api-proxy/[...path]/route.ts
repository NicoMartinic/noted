import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

async function proxy(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathname = path.join('/');
  const search = request.nextUrl.search;
  const backendUrl = `${BACKEND_URL}/api/${pathname}/${search}`;

  const reqHeaders = new Headers(request.headers);
  reqHeaders.delete('host');
  // Remove content-length — we re-read the body as ArrayBuffer so
  // the length may differ from the original header (chunked, gzip, etc.)
  // fetch() will set the correct value based on the actual body passed.
  reqHeaders.delete('content-length');
  reqHeaders.delete('transfer-encoding');

  let body: BodyInit | null = null;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    body = await request.arrayBuffer();
  }

  const backendRes = await fetch(backendUrl, {
    method: request.method,
    headers: reqHeaders,
    body,
    redirect: 'manual',
  });

  const resHeaders = new Headers();
  backendRes.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'content-encoding') return;

    if (key.toLowerCase() === 'set-cookie') {
      const fixed = value
        .replace(/;\s*domain=[^;]+/gi, '')   // bind to proxy origin, not backend:8000
        .replace(/;\s*secure/gi, '')          // allow HTTP in dev
        .replace(/;\s*path=[^;]+/gi, '')      // strip original path (/api/auth/...)
        .concat('; Path=/');                  // set Path=/ so cookie sent for all routes
      resHeaders.append(key, fixed);
      return;
    }

    resHeaders.append(key, value);
  });

  return new NextResponse(backendRes.body, {
    status: backendRes.status,
    headers: resHeaders,
  });
}

export const GET     = proxy;
export const POST    = proxy;
export const PUT     = proxy;
export const PATCH   = proxy;
export const DELETE  = proxy;
export const OPTIONS = proxy;
