// agent/mcp/canopy-db/server.ts
// Stdio MCP server exposing the Canopy Prisma database to Claude Code and the Agent SDK.
// Read-only by default. Mutations are not exposed; they go through app/api/agent/invoke instead.
//
// Run: npx tsx agent/mcp/canopy-db/server.ts
//
// This file is intentionally light: it imports the singleton Prisma client from lib/db.ts
// (rather than instantiating its own) so the agent and the UI share the exact same connection
// pool and types.

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { prisma } from '../../../lib/db';
import { tools, dispatch } from './tools';

const MODE = process.env.CANOPY_MCP_MODE ?? 'read-only';

async function main() {
  const server = new Server(
    { name: 'canopy-db', version: '0.1.0' },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const { name, arguments: args } = req.params;
    if (MODE === 'read-only' && name.startsWith('write_')) {
      throw new Error(`Tool ${name} disabled in read-only mode. Use /api/agent/invoke for mutations.`);
    }
    const result = await dispatch(prisma, name, args ?? {});
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`canopy-db MCP server up — mode=${MODE}`);
}

main().catch((err) => {
  console.error('canopy-db fatal:', err);
  process.exit(1);
});
