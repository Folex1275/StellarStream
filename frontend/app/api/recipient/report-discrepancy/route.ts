import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

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

export async function POST(request: NextRequest) {
    const auth = verifyToken(request);
    if (!auth) {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        );
    }

    try {
        const { disbursementId, issue, description } = await request.json();

        if (!disbursementId || !issue) {
            return NextResponse.json(
                { error: 'disbursementId and issue are required' },
                { status: 400 }
            );
        }

        // In production, this would:
        // 1. Validate the disbursement belongs to the authenticated user
        // 2. Create a discrepancy report record
        // 3. Send notification to the sending organization
        // 4. Log the report for audit purposes

        console.log('Discrepancy reported:', {
            recipientAddress: auth.address,
            disbursementId,
            issue,
            description,
            timestamp: new Date().toISOString()
        });

        return NextResponse.json({
            success: true,
            message: 'Discrepancy report submitted successfully'
        });
    } catch (error) {
        console.error('Failed to report discrepancy:', error);
        return NextResponse.json(
            { error: 'Failed to submit discrepancy report' },
            { status: 500 }
        );
    }
}