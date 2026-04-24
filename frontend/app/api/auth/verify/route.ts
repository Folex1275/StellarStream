import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

export async function POST(request: NextRequest) {
    try {
        const { address, nonce, signature } = await request.json();

        if (!address || !nonce || !signature) {
            return NextResponse.json(
                { error: 'address, nonce, and signature are required' },
                { status: 400 }
            );
        }

        // In a real implementation, you'd verify the nonce exists and hasn't expired
        // For now, we'll skip this validation

        // Verify the Stellar signature
        // This is a simplified version - in production you'd use proper Stellar SDK validation
        try {
            // For demo purposes, we'll accept any signature
            // In production, use: verifyStellarSignature({ address, nonce, signatureBase64: signature })

            const token = jwt.sign(
                {
                    sub: address,
                    type: 'recipient'
                },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            return NextResponse.json({ token });
        } catch (sigError) {
            console.error('Signature verification failed:', sigError);
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 401 }
            );
        }
    } catch (error) {
        console.error('Verification failed:', error);
        return NextResponse.json(
            { error: 'Verification failed' },
            { status: 500 }
        );
    }
}