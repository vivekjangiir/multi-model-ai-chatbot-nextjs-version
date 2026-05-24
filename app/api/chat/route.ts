import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = process.env.NVIDIA_BASE_URL ?? 'https://integrate.api.nvidia.com/v1';
const ENV_KEY  = process.env.NVIDIA_API_KEY ?? '';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  // Resolve API key: caller header takes priority, then .env
  const callerAuth = req.headers.get('x-nvidia-key') ?? '';
  const apiKey = callerAuth.startsWith('nvapi-') ? callerAuth : ENV_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'No API key. Set NVIDIA_API_KEY in .env.local or enter it in the chat UI.' },
      { status: 401 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const upstream = `${BASE_URL}/chat/completions`;
  const isStream = body.stream === true;

  try {
    const upstreamRes = await fetch(upstream, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!upstreamRes.ok) {
      const errText = await upstreamRes.text();
      return new NextResponse(errText, {
        status: upstreamRes.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (isStream && upstreamRes.body) {
      // Pass SSE stream straight through to the browser
      return new NextResponse(upstreamRes.body, {
        status: 200,
        headers: {
          'Content-Type':     'text/event-stream',
          'Cache-Control':    'no-cache',
          'X-Accel-Buffering':'no',
          Connection:         'keep-alive',
        },
      });
    }

    // Non-streaming
    const data = await upstreamRes.text();
    return new NextResponse(data, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Upstream error: ${msg}` }, { status: 502 });
  }
}
