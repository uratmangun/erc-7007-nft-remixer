import { NextRequest } from 'next/server';
import ky from 'ky';

// Validate chain name against supported chains
const SUPPORTED_CHAINS = ['ethereum', 'polygon', 'arbitrum', 'optimism', 'base'];

export async function GET(
  request: NextRequest,
  { params }: { params: { chain: string; contract: string } }
) {
  const { chain, contract } = params;
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get('limit') || '3';

  // Validate chain name
  if (!SUPPORTED_CHAINS.includes(chain)) {
    return Response.json(
      { error: `Unsupported chain. Must be one of: ${SUPPORTED_CHAINS.join(', ')}` },
      { status: 400 }
    );
  }

  try {
    const response = await ky.get(
      `https://api.opensea.io/api/v2/chain/${chain}/contract/${contract}/nfts`,
      {
        searchParams: {
          limit
        },
        headers: {
          'accept': 'application/json',
          'x-api-key': process.env.OPENSEA_API_KEY || ''
        }
      }
    ).json();

    return Response.json(response);
  } catch (error) {
    console.error('Error fetching NFTs:', error);
    return Response.json(
      { error: 'Failed to fetch NFTs' },
      { status: 500 }
    );
  }
}
