import { NextRequest, NextResponse } from 'next/server';
import { stat, createReadStream } from 'fs';
import { join } from 'path';
import { promisify } from 'util';

const statAsync = promisify(stat);

export async function GET(request: NextRequest, { params }: { params: { filename: string } }) {
  try {
    const { filename } = params;

    // Security: Only allow specific files
    const allowedFiles = [
      'AI-File-Cleanup-1.0.0.exe',
      'AI-File-Cleanup-1.0.0.msi',
      'AI-File-Cleanup-1.0.0-Portable.exe',
      'AI-File-Cleanup-1.0.0-win.zip',
    ];

    if (!allowedFiles.includes(filename)) {
      return new NextResponse('File not found', { status: 404 });
    }

    const filePath = join(process.cwd(), 'public', 'downloads', filename);

    // Check if file exists and get stats
    let fileStats;
    try {
      fileStats = await statAsync(filePath);
    } catch {
      return new NextResponse('File not found', { status: 404 });
    }

    // Determine content type
    let contentType = 'application/octet-stream';
    if (filename.endsWith('.msi')) {
      contentType = 'application/x-msi';
    } else if (filename.endsWith('.exe')) {
      contentType = 'application/x-msdownload';
    } else if (filename.endsWith('.zip')) {
      contentType = 'application/zip';
    }

    // Create a readable stream
    const stream = createReadStream(filePath);

    // Convert Node.js stream to Web ReadableStream
    const webStream = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk: string | Buffer) => {
          controller.enqueue(
            new Uint8Array(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
          );
        });
        stream.on('end', () => {
          controller.close();
        });
        stream.on('error', (err) => {
          controller.error(err);
        });
      },
      cancel() {
        stream.destroy();
      },
    });

    // Return the file with proper headers
    return new NextResponse(webStream, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': fileStats.size.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
