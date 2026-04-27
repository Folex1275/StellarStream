import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

// Mock data for demonstration - in production this would query the backend
const mockDisbursements = [
    {
        id: '1',
        senderAddress: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
        totalAmount: '1000.00',
        asset: 'USDC',
        txHash: 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890',
        createdAt: '2024-01-15T10:30:00Z',
        recipient: {
            amount: '250.00',
            status: 'SENT'
        }
    },
    {
        id: '2',
        senderAddress: 'GBZ5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVO',
        totalAmount: '500.00',
        asset: 'XLM',
        txHash: 'b2c3d4e5f67890123456789012345678901234567890123456789012345678901',
        createdAt: '2024-01-10T14:20:00Z',
        recipient: {
            amount: '125.00',
            status: 'SENT'
        }
    }
];

function verifyToken(request: NextRequest): { address: string } | null {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return null;
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, JWT_SECRET) as any;

        if (decoded.type !== 'recipient') {
            return null;
        }

        return { address: decoded.sub };
    } catch (error) {
        return null;
    }
}

export async function GET(request: NextRequest) {
    const auth = verifyToken(request);
    if (!auth) {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        );
    }

    try {
        // In production, this would query the backend API
        // For now, return mock data filtered by the authenticated address
        const disbursements = mockDisbursements; // In reality, filter by auth.address

        return NextResponse.json({
            success: true,
            disbursements
        });
    } catch (error) {
        console.error('Failed to fetch disbursements:', error);
        return NextResponse.json(
            { error: 'Failed to fetch disbursements' },
            { status: 500 }
        );
    }
}