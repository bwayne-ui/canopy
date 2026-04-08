import { invoke } from '@/lib/agent-client';

// GET /api/agent/stream?skill=...&user=...&input=<json>
// Server-Sent Events stream of agent output. Stub implementation: emits the
// invoke result as a single SSE event. Wires to real SDK streaming once
// ANTHROPIC_API_KEY is set and the SDK call in lib/agent-client invoke() is enabled.

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const skill = searchParams.get('skill') ?? '';
  const user = searchParams.get('user') ?? 'anonymous';
  const inputRaw = searchParams.get('input') ?? '{}';
  let input: Record<string, unknown> = {};
  try { input = JSON.parse(inputRaw); } catch { /* leave empty */ }

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (event: string, data: unknown) =>
        controller.enqueue(enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));

      send('start', { skill, user, ts: new Date().toISOString() });
      const result = await invoke({ skill, input, user });
      send('result', result);
      send('end', {});
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
