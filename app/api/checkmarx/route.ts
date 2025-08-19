import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { bearerToken, checkmarxBaseUrl, scanId } = await request.json();

    if (!bearerToken || !checkmarxBaseUrl || !scanId) {
      return NextResponse.json(
        { error: 'Missing required parameters: bearerToken, checkmarxBaseUrl, or scanId' },
        { status: 400 }
      );
    }

    const response = await fetch(`${checkmarxBaseUrl}/api/scans/${scanId}/configuration`, {
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch scan ${scanId}: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
