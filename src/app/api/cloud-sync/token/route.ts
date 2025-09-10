import { NextRequest, NextResponse } from 'next/server';

interface TokenRequest {
  serviceId: string;
  code: string;
  redirectUri: string;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

interface CloudServiceConfig {
  id: string;
  tokenUrl: string;
}

const CLOUD_SERVICES: Record<string, CloudServiceConfig> = {
  'google-drive': {
    id: 'google-drive',
    tokenUrl: 'https://oauth2.googleapis.com/token'
  },
  'dropbox': {
    id: 'dropbox',
    tokenUrl: 'https://api.dropboxapi.com/oauth2/token'
  },
  'onedrive': {
    id: 'onedrive',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token'
  },
  'box': {
    id: 'box',
    tokenUrl: 'https://api.box.com/oauth2/token'
  }
};

function isDemoMode(): boolean {
  return !process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
         process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID === 'your_google_client_id_here' ||
         process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.startsWith('mock-');
}

function getClientId(serviceId: string): string {
  const clientIds: Record<string, string> = {
    'google-drive': process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
    'dropbox': process.env.NEXT_PUBLIC_DROPBOX_CLIENT_ID || '',
    'onedrive': process.env.NEXT_PUBLIC_ONEDRIVE_CLIENT_ID || '',
    'box': process.env.NEXT_PUBLIC_BOX_CLIENT_ID || ''
  };
  return clientIds[serviceId] || '';
}

function getClientSecret(serviceId: string): string {
  const secrets: Record<string, string> = {
    'google-drive': process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET || '',
    'dropbox': process.env.NEXT_PUBLIC_DROPBOX_CLIENT_SECRET || '',
    'onedrive': process.env.NEXT_PUBLIC_ONEDRIVE_CLIENT_SECRET || '',
    'box': process.env.NEXT_PUBLIC_BOX_CLIENT_SECRET || ''
  };
  return secrets[serviceId] || '';
}

export async function POST(request: NextRequest) {
  try {
    const body: TokenRequest = await request.json();
    const { serviceId, code, redirectUri } = body;

    const service = CLOUD_SERVICES[serviceId];
    if (!service) {
      return NextResponse.json({ error: 'Unknown cloud service' }, { status: 400 });
    }

    // Check if we're in demo mode
    if (isDemoMode() || code === 'demo_auth_code') {
      console.log('Demo mode token exchange');
      const demoToken: TokenResponse = {
        access_token: `demo_access_token_${serviceId}_${Date.now()}`,
        refresh_token: `demo_refresh_token_${serviceId}_${Date.now()}`,
        expires_in: 3600,
        token_type: 'Bearer'
      };
      return NextResponse.json(demoToken);
    }

    const clientId = getClientId(serviceId);
    const clientSecret = getClientSecret(serviceId);

    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: 'Missing client credentials' }, { status: 500 });
    }

    console.log('Server-side token exchange request:', {
      serviceId,
      tokenUrl: service.tokenUrl,
      redirectUri
    });

    const response = await fetch(service.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri
      })
    });

    console.log('Server-side token exchange response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
        console.error('Server-side token exchange error response body:', errorText);
      } catch (e) {
        console.error('Failed to read error response body:', e);
      }
      return NextResponse.json(
        { error: `Token exchange failed: ${response.status} ${response.statusText} - ${errorText}` },
        { status: response.status }
      );
    }

    const tokenData: TokenResponse = await response.json();
    console.log('Server-side token exchange success');

    return NextResponse.json(tokenData);
  } catch (error) {
    console.error('Server-side token exchange error:', error);
    return NextResponse.json(
      { error: 'Internal server error during token exchange' },
      { status: 500 }
    );
  }
}