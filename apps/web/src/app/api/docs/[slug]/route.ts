import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params;

    // Security: only allow specific doc files
    const allowedDocs = [
      '00-architecture',
      '01-prerequisites',
      '02-installation',
      '03-environment-setup',
      '04-database-setup',
      '05-running-project',
      '06-deployment',
      'README',
    ];

    if (!allowedDocs.includes(slug)) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Read from packages/docs
    const docsPath = path.join(process.cwd(), '..', '..', 'packages', 'docs', `${slug}.md`);

    if (!fs.existsSync(docsPath)) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const content = fs.readFileSync(docsPath, 'utf-8');

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Error reading doc:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
