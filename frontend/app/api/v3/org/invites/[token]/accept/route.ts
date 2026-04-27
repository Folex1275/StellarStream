import { NextRequest, NextResponse } from "next/server";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * POST /api/v3/org/invites/[token]/accept
 * ═══════════════════════════════════════════════════════════════════════════
 * Accept an invitation after wallet verification
 * Verifies SEP-10 signature and adds user to organization
 */

interface AcceptInvitePayload {
  address: string;
  nonce: string;
  signature: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const token = params.token;

  try {
    const body = (await req.json()) as AcceptInvitePayload;

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    if (!body.address || !body.nonce || !body.signature) {
      return NextResponse.json(
        { error: "Address, nonce, and signature are required" },
        { status: 400 }
      );
    }

    // Step 1: Verify the signature matches the nonce
    // This would typically call backend verification endpoint
    const verifyResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"}/api/v1/auth/verify`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: body.address,
          nonce: body.nonce,
          signature: body.signature,
        }),
      }
    );

    if (!verifyResponse.ok) {
      return NextResponse.json(
        { error: "Wallet verification failed" },
        { status: 401 }
      );
    }

    const verifyData = await verifyResponse.json();

    // Step 2: Fetch invite details to validate
    // TODO: Query database for actual invite record
    const invite = {
      id: token,
      orgId: "org_demo_123",
      recipient: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5V3VF", // Example
      role: "Accountant" as const,
    };

    // Step 3: Verify the wallet address matches the invite recipient
    if (
      body.address.toLowerCase() !==
      invite.recipient.toLowerCase()
    ) {
      return NextResponse.json(
        {
          error: "Wallet address does not match invitation recipient",
        },
        { status: 403 }
      );
    }

    // Step 4: Add user to organization
    // TODO: Create org member record in database with assigned role
    // This would include:
    // - Creating a member record
    // - Assigning the role from the invite
    // - Recording the acceptance timestamp
    // - Invalidating the invite token

    // For now, return success
    return NextResponse.json(
      {
        ok: true,
        message: "Invitation accepted successfully",
        data: {
          orgId: invite.orgId,
          role: invite.role,
          joinedAt: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error accepting invite:", error);
    return NextResponse.json(
      { error: "Failed to accept invitation" },
      { status: 500 }
    );
  }
}
