import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('=== Checkmarx API Route Called ===');
  
  try {
    console.log('Parsing request body...');
    const requestBody = await request.json();
    console.log('Request body received:', {
      hasBearer: !!requestBody.bearerToken,
      bearerTokenLength: requestBody.bearerToken?.length || 0,
      checkmarxBaseUrl: requestBody.checkmarxBaseUrl,
      scanId: requestBody.scanId
    });

    const { bearerToken, checkmarxBaseUrl, scanId } = requestBody;

    if (!bearerToken || !checkmarxBaseUrl || !scanId) {
      console.log('Missing required parameters:', {
        bearerToken: !!bearerToken,
        checkmarxBaseUrl: !!checkmarxBaseUrl,
        scanId: !!scanId
      });
      return NextResponse.json(
        { error: 'Missing required parameters: bearerToken, checkmarxBaseUrl, or scanId' },
        { status: 400 }
      );
    }

    const apiUrl = `${checkmarxBaseUrl}/api/scans/${scanId}/configuration`;
    console.log('Making request to Checkmarx API:', apiUrl);
    console.log('Request headers:', {
      'Authorization': `Bearer ${bearerToken.substring(0, 10)}...`,
      'Content-Type': 'application/json'
    });

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Checkmarx API response status:', response.status);
    console.log('Checkmarx API response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Checkmarx API error response:', errorText);
      return NextResponse.json(
        { error: `Failed to fetch scan ${scanId}: ${response.status} ${response.statusText}`, details: errorText },
        { status: response.status }
      );
    }

    console.log('Parsing Checkmarx API response...');
    const data = await response.json();
    console.log('Successfully parsed response, data keys:', Object.keys(data));
    
    return NextResponse.json(data);

  } catch (error) {
    console.error('=== API Error Details ===');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    
    if (error instanceof SyntaxError) {
      console.error('JSON parsing error - likely invalid JSON in request or response');
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error?.message || 'Unknown error',
        type: error?.constructor?.name || 'Unknown'
      },
      { status: 500 }
    );
  }
}
