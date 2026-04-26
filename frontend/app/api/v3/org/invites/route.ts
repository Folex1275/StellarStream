import { NextRequest, NextResponse } from "next/server";
import {
  createInvite,
  hasPendingInvite,
  listPendingInvites,
  revokeInvite,
  type CollaboratorRole,
} from "@/lib/server/org-invite-store";

interface CreateInvitePayload {
  orgId: string;
  recipient: string;
  role: CollaboratorRole;
}

interface RevokeInvitePayload {
  orgId: string;
  inviteId: string;
}

const VALID_ROLES: CollaboratorRole[] = ["Admin", "Accountant", "Viewer"];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STELLAR_ADDRESS_REGEX = /^G[A-Z2-7]{55}$/;

function isValidRecipient(value: string): boolean {
  const normalized = value.trim();
  return (
    EMAIL_REGEX.test(normalized) ||
    STELLAR_ADDRESS_REGEX.test(normalized.toUpperCase())
  );
}

export async function GET(req: NextRequest) {
  const orgId = req.nextUrl.searchParams.get("orgId");

  if (!orgId) {
    return NextResponse.json({ error: "orgId is required" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, invites: listPendingInvites(orgId) });
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as CreateInvitePayload;

  if (!body.orgId) {
    return NextResponse.json({ error: "orgId is required" }, { status: 400 });
  }

  if (!body.recipient || !isValidRecipient(body.recipient)) {
    return NextResponse.json(
      { error: "recipient must be a valid email or G-address" },
      { status: 400 },
    );
  }

  if (!VALID_ROLES.includes(body.role)) {
    return NextResponse.json({ error: "invalid role" }, { status: 400 });
  }

  if (hasPendingInvite(body.orgId, body.recipient)) {
    return NextResponse.json(
      { error: "recipient already has a pending invite" },
      { status: 409 },
    );
  }

  const invite = createInvite(body.orgId, body.recipient, body.role);
  return NextResponse.json({ ok: true, invite }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const body = (await req.json()) as RevokeInvitePayload;

  if (!body.orgId || !body.inviteId) {
    return NextResponse.json(
      { error: "orgId and inviteId are required" },
      { status: 400 },
    );
  }

  const revoked = revokeInvite(body.orgId, body.inviteId);

  if (!revoked) {
    return NextResponse.json({ error: "invite not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, revoked }, { status: 200 });
}
