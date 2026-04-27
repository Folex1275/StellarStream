import { NextRequest, NextResponse } from "next/server";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * POST /api/v3/org/invites/challenge
 * ═══════════════════════════════════════════════════════════════════════════
 * Generate a challenge (nonce) for SEP-10 wallet verification
 * Called before accepting an invitation
 */

interface ChallengePayload {
  inviteToken: string;
  address: string;
}

function generateNonce(length: number = 32): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ChallengePayload;

    if (!body.address) {
      return NextResponse.json(
        { error: "Address is required" },
        { status: 400 }
      );
    }

    if (!body.inviteToken) {
      return NextResponse.json(
        { error: "Invite token is required" },
        { status: 400 }
      );
    }

    // Generate nonce for signing
    const nonce = generateNonce(32);
    const challenge = generateNonce(16);

    // TODO: Store nonce in Redis with 5-minute TTL
    // Key format: `invite:challenge:{address}:{token}`
    // Value: { nonce, challenge, createdAt }
    // This ensures the nonce can only be used with the matching address and token

    // In production environment setup:
    // const redis = new Redis(process.env.REDIS_URL);
    // await redis.setex(
    //   `invite:challenge:${body.address}:${body.inviteToken}`,
    //   300, // 5 minutes TTL
    //   JSON.stringify({ nonce, challenge })
    // );

    return NextResponse.json(
      {
        ok: true,
        nonce,
        challenge,
        expiresIn: 300, // 5 minutes in seconds
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error generating challenge:", error);
    return NextResponse.json(
      { error: "Failed to generate challenge" },
      { status: 500 }
    );
  }
}
