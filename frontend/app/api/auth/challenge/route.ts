import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { address } = await request.json();

        if (!address || !address.startsWith('G') || address.length < 56) {
            return NextResponse.json(
                { error: 'Valid Stellar address required' },
                { status: 400 }
            );
        }

        // Generate a random nonce
        const nonce = require('crypto').randomBytes(32).toString('hex');

        // In a real implementation, you'd store this nonce in a database with expiration
        // For now, we'll just return it

        return NextResponse.json({ nonce });
    } catch (error) {
        console.error('Challenge generation failed:', error);
        return NextResponse.json(
            { error: 'Failed to generate challenge' },
            { status: 500 }
        );
    }
}