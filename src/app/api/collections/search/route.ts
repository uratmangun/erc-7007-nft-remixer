import ky from 'ky';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const prefix = searchParams.get('prefix') || '';

  try {
    const response = await ky.get(
      'https://api.reservoir.tools/collections/search/v1?chains=1&chains=137&chains=42161&chains=10&chains=8453',
      {
        searchParams: {
          prefix,
          excludeSpam: 'true',
          excludeNsfw: 'true',
          limit: '3'
        },
        headers: {
          'x-api-key': process.env.RESERVOIR_API_KEY || '',
          'accept': '*/*'
        }
      }
    ).json();

    return Response.json(response);
  } catch (error) {
    console.error('Error fetching collections:', error);
    return Response.json(
      { error: 'Failed to fetch collections' },
      { status: 500 }
    );
  }
}
