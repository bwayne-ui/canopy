import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { toNum } from '@/lib/utils';

export async function GET(_req: Request, { params }: { params: { investorId: string } }) {
  const investor = await prisma.investor.findUnique({
    where: { investorId: params.investorId },
  });

  if (!investor) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const d = (v: any) => v ? toNum(v) : null;

  const recentActivity = [
    { id: `a-${investor.investorId}-1`, action: 'Issued', subject: `capital call notice to ${investor.name}`, timestamp: '5h ago', user: 'Investor Services', icon: 'transaction', href: '#' },
    { id: `a-${investor.investorId}-2`, action: 'Received', subject: `wire from ${investor.name}`, timestamp: 'Yesterday', user: 'Treasury', icon: 'transaction', href: '#' },
    { id: `a-${investor.investorId}-3`, action: 'Uploaded', subject: `subscription docs for ${investor.name}`, timestamp: '3d ago', user: 'Compliance', icon: 'uploaded', href: '#' },
    { id: `a-${investor.investorId}-4`, action: 'Sent', subject: `K-1 package to ${investor.contactName ?? 'primary contact'}`, timestamp: '1w ago', user: 'Tax', icon: 'communication', href: '#' },
    ...(investor.entityName ? [{ id: `a-${investor.investorId}-5`, action: 'Funded', subject: `commitment to ${investor.entityName}`, timestamp: '2w ago', user: 'Investor Services', icon: 'completed', href: '#' }] : []),
    { id: `a-${investor.investorId}-6`, action: 'Completed', subject: `KYC refresh for ${investor.name}`, timestamp: '3w ago', user: 'Compliance', icon: 'completed', href: '#' },
    { id: `a-${investor.investorId}-7`, action: 'Scheduled', subject: 'annual investor review', timestamp: '1mo ago', user: 'IR', icon: 'scheduled', href: '#' },
  ];

  return NextResponse.json({
    investor: {
      id: investor.id,
      investorId: investor.investorId,
      name: investor.name,
      investorType: investor.investorType,
      domicile: investor.domicile,
      entityName: investor.entityName,
      status: investor.status,
      contactName: investor.contactName,
      contactEmail: investor.contactEmail,
      commitmentMm: d(investor.commitmentMm),
      calledCapitalMm: d(investor.calledCapitalMm),
      distributedMm: d(investor.distributedMm),
      navMm: d(investor.navMm),
      taxExempt: investor.taxExempt,
      erisa: investor.erisa,
      k1Status: investor.k1Status,
      createdAt: investor.createdAt.toISOString(),
      updatedAt: investor.updatedAt.toISOString(),
    },
    recentActivity,
  });
}
