/**
 * API Route: Federation Address Resolution
 * Resolves Stellar federation addresses using stellar-sdk
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json(
      { error: 'Missing address parameter' },
      { status: 400 }
    );
  }

  // Validate federation address format
  const federationRegex = /^[a-zA-Z0-9._-]+\*[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!federationRegex.test(address)) {
    return NextResponse.json(
      { error: 'Invalid federation address format. Expected: user*domain.com' },
      { status: 400 }
    );
  }

  try {
    // Dynamic import of stellar-sdk to avoid bundling issues
    const { FederationServer } = await import('stellar-sdk');
    
    // Resolve the federation address
    const record = await FederationServer.resolve(address);

    return NextResponse.json({
      account_id: record.account_id,
      stellar_address: record.stellar_address,
      memo_type: record.memo_type,
      memo: record.memo,
    });
  } catch (error) {
    console.error('Federation resolution error:', error);
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to resolve federation address',
        address,
      },
      { status: 404 }
    );
  }
}
