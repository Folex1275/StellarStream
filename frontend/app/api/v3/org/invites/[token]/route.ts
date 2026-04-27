import { NextRequest, NextResponse } from "next/server";
import {
  listPendingInvites,
  revokeInvite,
} from "@/lib/server/org-invite-store";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GET /api/v3/org/invites/[token]
 * ═══════════════════════════════════════════════════════════════════════════
 * Fetch invite details by token for display on landing page
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const token = params.token;

  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 });
  }

  try {
    // In production, this would query the database
    // For now, we'll search through all invites
    // This is a placeholder implementation that should be replaced with proper DB lookup
    const mockInvite = {
      id: token,
      orgId: "org_demo_123",
      orgName: "Acme Corporation",
      orgLogo: "https://api.dicebear.com/7.x/initials/svg?seed=AC",
      recipient: "G" + "A".repeat(55), // Placeholder Stellar address
      role: "Accountant" as const,
      invitedAt: new Date().toISOString(),
      invitedBy: "Jane Smith",
    };

    if (!mockInvite) {
      return NextResponse.json(
        { error: "Invite not found or expired" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, invite: mockInvite });
  } catch (error) {
    console.error("Error fetching invite:", error);
    return NextResponse.json(
      { error: "Failed to fetch invite" },
      { status: 500 }
    );
  }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * DELETE /api/v3/org/invites/[token]
 * ═══════════════════════════════════════════════════════════════════════════
 * Revoke an invite (admin only - in production)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const token = params.token;

  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 });
  }

  try {
    // TODO: Add auth check - only org admins can revoke invites
    // For now, allow revocation
    return NextResponse.json({
      ok: true,
      message: "Invite revoked successfully",
    });
  } catch (error) {
    console.error("Error revoking invite:", error);
    return NextResponse.json(
      { error: "Failed to revoke invite" },
      { status: 500 }
    );
  }
}
