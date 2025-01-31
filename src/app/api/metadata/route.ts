import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import ky from 'ky';

export async function GET(request: NextRequest) {
  try {
    const tokenUri = request.nextUrl.searchParams.get('uri');
    if (!tokenUri) {
      return NextResponse.json(
        { error: 'Missing token URI' },
        { status: 400 }
      );
    }

    const resolvedUri = tokenUri.startsWith('ipfs://') 
      ? tokenUri.replace('ipfs://', 'https://ipfs.io/ipfs/')
      : tokenUri;

    const metadata = await ky.get(resolvedUri).json();
    return NextResponse.json(metadata);

  } catch (error) {
    console.error('Metadata fetch error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch metadata' },
      { status: 500 }
    );
  }
}
