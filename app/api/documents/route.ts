import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const docs = await prisma.document.findMany({ orderBy: { uploadDate: 'desc' } });
  return NextResponse.json({
    items: docs.map((d) => ({
      id: d.id, documentId: d.documentId, name: d.name, documentType: d.documentType,
      entityName: d.entityName, clientName: d.clientName, status: d.status,
      uploadedBy: d.uploadedBy, uploadDate: d.uploadDate.toISOString().split('T')[0],
      version: d.version, confidentiality: d.confidentiality,
    })),
  });
}
