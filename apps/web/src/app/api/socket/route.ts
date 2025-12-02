import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const apiUrl = process.env.API_BASE_URL || 'http://localhost:3001';
  
  // Proxy WebSocket upgrade requests to the API server
  const url = new URL(request.url);
  const targetUrl = `${apiUrl}${url.pathname}${url.search}`;
  
  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        ...Object.fromEntries(request.headers),
        'Host': new URL(apiUrl).host,
      },
    });
    
    return new Response(response.body, {
      status: response.status,
      headers: response.headers,
    });
  } catch (error) {
    console.error('Socket proxy error:', error);
    return new Response('Socket proxy error', { status: 502 });
  }
}
