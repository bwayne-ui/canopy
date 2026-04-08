// agent/mcp/canopy-db/tools.ts
// Tool definitions exposed by the canopy-db MCP server.
// Each tool maps to a Prisma read query and reuses lib/utils.ts toNum() to coerce Decimals.

import type { PrismaClient } from '@prisma/client';
import { toNum } from '../../../lib/utils';

export const tools = [
  {
    name: 'list_clients',
    description: 'List all GP clients with summary metrics.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_client',
    description: 'Get a single client by id or name.',
    inputSchema: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' } } },
  },
  {
    name: 'list_entities',
    description: 'List fund entities. Optional filter by clientName or strategy.',
    inputSchema: {
      type: 'object',
      properties: {
        clientName: { type: 'string' },
        strategy: { type: 'string' },
      },
    },
  },
  {
    name: 'get_entity',
    description: 'Get a single entity by entityId.',
    inputSchema: { type: 'object', properties: { entityId: { type: 'string' } }, required: ['entityId'] },
  },
  {
    name: 'query_nav',
    description: 'Return current NAV components for an entity.',
    inputSchema: { type: 'object', properties: { entityId: { type: 'string' } }, required: ['entityId'] },
  },
  {
    name: 'list_investors',
    description: 'List investors. Optional filter by entityName.',
    inputSchema: { type: 'object', properties: { entityName: { type: 'string' } } },
  },
  {
    name: 'list_securities',
    description: 'List portfolio securities. Optional filter by issuer.',
    inputSchema: { type: 'object', properties: { issuer: { type: 'string' } } },
  },
  {
    name: 'query_cash_flows',
    description: 'Query cash flows. Optional date range and entity filter.',
    inputSchema: {
      type: 'object',
      properties: {
        entityName: { type: 'string' },
        from: { type: 'string', description: 'YYYY-MM-DD' },
        to: { type: 'string', description: 'YYYY-MM-DD' },
      },
    },
  },
  {
    name: 'list_treasury_accounts',
    description: 'List treasury accounts. Optional filter by entityName.',
    inputSchema: { type: 'object', properties: { entityName: { type: 'string' } } },
  },
  {
    name: 'list_task_assignments',
    description: 'List task assignments. Optional filter by status or entityName.',
    inputSchema: {
      type: 'object',
      properties: { status: { type: 'string' }, entityName: { type: 'string' } },
    },
  },
  {
    name: 'list_rules',
    description: 'List the active rule graph.',
    inputSchema: { type: 'object', properties: {} },
  },
];

export async function dispatch(prisma: PrismaClient, name: string, args: Record<string, unknown>) {
  switch (name) {
    case 'list_clients': {
      const rows = await prisma.client.findMany({ orderBy: { name: 'asc' } });
      return rows.map((c) => ({
        id: c.id,
        name: c.name,
        primaryStrategy: c.primaryStrategy,
        totalEntities: c.totalEntities,
        totalNavMm: toNum(c.totalNavMm),
        marginPct: toNum(c.marginPct),
      }));
    }
    case 'get_client': {
      const where = args.id ? { id: args.id as string } : { name: args.name as string };
      return prisma.client.findFirst({ where, include: { entities: true } });
    }
    case 'list_entities': {
      const where: Record<string, unknown> = {};
      if (args.strategy) where.strategy = args.strategy;
      if (args.clientName) where.client = { name: args.clientName as string };
      const rows = await prisma.entity.findMany({ where, include: { client: true } });
      return rows.map((e) => ({
        entityId: e.entityId,
        name: e.name,
        clientName: e.client.name,
        strategy: e.strategy,
        navMm: toNum(e.navMm),
        commitmentMm: toNum(e.commitmentMm),
        netIrrPct: e.netIrrPct ? toNum(e.netIrrPct) : null,
      }));
    }
    case 'get_entity': {
      return prisma.entity.findUnique({ where: { entityId: args.entityId as string }, include: { client: true } });
    }
    case 'query_nav': {
      const e = await prisma.entity.findUnique({ where: { entityId: args.entityId as string } });
      if (!e) throw new Error(`No entity ${args.entityId}`);
      return {
        entityId: e.entityId,
        navMm: toNum(e.navMm),
        commitmentMm: toNum(e.commitmentMm),
        calledCapitalMm: toNum(e.calledCapitalMm),
        distributedCapitalMm: toNum(e.distributedCapitalMm),
        unfundedMm: toNum(e.unfundedMm),
      };
    }
    case 'list_investors': {
      const where = args.entityName ? { entityName: args.entityName as string } : {};
      const rows = await prisma.investor.findMany({ where });
      return rows.map((i) => ({
        investorId: i.investorId,
        name: i.name,
        investorType: i.investorType,
        commitmentMm: toNum(i.commitmentMm),
        navMm: i.navMm ? toNum(i.navMm) : null,
        status: i.status,
      }));
    }
    case 'list_securities': {
      const where = args.issuer ? { issuer: args.issuer as string } : {};
      const rows = await prisma.security.findMany({ where });
      return rows.map((s) => ({
        securityId: s.securityId,
        name: s.name,
        ticker: s.ticker,
        marketValue: s.marketValue ? toNum(s.marketValue) : null,
        sector: s.sector,
      }));
    }
    case 'query_cash_flows': {
      const where: Record<string, unknown> = {};
      if (args.entityName) where.entityName = args.entityName;
      if (args.from || args.to) {
        where.transactionDate = {};
        if (args.from) (where.transactionDate as Record<string, unknown>).gte = new Date(args.from as string);
        if (args.to) (where.transactionDate as Record<string, unknown>).lte = new Date(args.to as string);
      }
      const rows = await prisma.cashFlow.findMany({ where, orderBy: { transactionDate: 'desc' }, take: 500 });
      return rows.map((cf) => ({
        cashFlowId: cf.cashFlowId,
        flowType: cf.flowType,
        category: cf.category,
        amount: toNum(cf.amount),
        accountName: cf.accountName,
        entityName: cf.entityName,
        transactionDate: cf.transactionDate.toISOString().split('T')[0],
      }));
    }
    case 'list_treasury_accounts': {
      const where = args.entityName ? { entityName: args.entityName as string } : {};
      const rows = await prisma.treasuryAccount.findMany({ where });
      return rows.map((a) => ({
        accountId: a.accountId,
        accountName: a.accountName,
        institution: a.institution,
        currentBalance: toNum(a.currentBalance),
        entityName: a.entityName,
      }));
    }
    case 'list_task_assignments': {
      const where: Record<string, unknown> = {};
      if (args.status) where.status = args.status;
      if (args.entityName) where.entityName = args.entityName;
      const rows = await prisma.taskAssignment.findMany({ where, include: { taskDefinition: true }, take: 500 });
      return rows.map((t) => ({
        id: t.id,
        taskName: t.taskDefinition.name,
        entityName: t.entityName,
        status: t.status,
        dueDate: t.dueDate.toISOString().split('T')[0],
        priority: t.priority,
      }));
    }
    case 'list_rules': {
      const rows = await prisma.rule.findMany({ orderBy: { priority: 'asc' } });
      return rows.map((r) => ({
        ruleId: r.ruleId,
        name: r.name,
        category: r.category,
        formula: r.formula,
      }));
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
