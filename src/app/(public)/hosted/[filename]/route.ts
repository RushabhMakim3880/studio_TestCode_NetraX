
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(
  req: NextRequest,
  { params }: { params: { filename: string } }
) {
  const filename = params.filename;

  // Basic security check to prevent path traversal
  if (!filename || filename.includes('..')) {
    return new NextResponse('Invalid filename', { status: 400 });
  }

  try {
    const filePath = path.join(process.cwd(), 'hosted_pages', filename);
    
    // Check if file exists
    await fs.access(filePath);

    const fileContent = await fs.readFile(filePath, 'utf-8');
    
    return new NextResponse(fileContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error(`Failed to serve hosted page ${filename}:`, error);
    // Return a 404 if the file is not found or any other error occurs
    return new NextResponse('Page not found', { status: 404 });
  }
}
