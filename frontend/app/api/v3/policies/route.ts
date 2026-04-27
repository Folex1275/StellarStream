import { NextRequest, NextResponse } from "next/server";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PolicyConditionField = "totalAmount" | "recipientCount" | "token";
export type PolicyConditionOp    = "gt" | "gte" | "lt" | "lte" | "eq";

export interface PolicyCondition {
  field: PolicyConditionField;
  op:    PolicyConditionOp;
  value: number | string;
}

export interface SplitPolicy {
  id:           string;
  name:         string;
  description?: string;
  /** All conditions must match for the policy to trigger */
  conditions:   PolicyCondition[];
  /** Number of approvals required when this policy triggers */
  requiredApprovals: number;
  enabled:      boolean;
  createdAt:    string; // ISO
  updatedAt:    string; // ISO
}

// ─── Mock store (replace with DB-backed backend call) ─────────────────────────

let POLICIES: SplitPolicy[] = [
  {
    id: "pol-001",
    name: "Large USDC Split",
    description: "Any USDC split over 10,000 requires 3 approvals",
    conditions: [
      { field: "totalAmount", op: "gt", value: 10_000 },
      { field: "token",       op: "eq", value: "USDC" },
    ],
    requiredApprovals: 3,
    enabled: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
  },
  {
    id: "pol-002",
    name: "High Recipient Count",
    description: "Splits with more than 20 recipients require 2 approvals",
    conditions: [
      { field: "recipientCount", op: "gt", value: 20 },
    ],
    requiredApprovals: 2,
    enabled: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
];

// ─── GET /api/v3/policies ─────────────────────────────────────────────────────

export async function GET() {
  return NextResponse.json(POLICIES);
}

// ─── POST /api/v3/policies ────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Omit<SplitPolicy, "id" | "createdAt" | "updatedAt">;

  if (!body.name || !Array.isArray(body.conditions) || !body.requiredApprovals) {
    return NextResponse.json({ error: "Invalid policy payload" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const policy: SplitPolicy = {
    ...body,
    id:        `pol-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  };

  POLICIES = [policy, ...POLICIES];

  // TODO: forward to backend validator:
  // await fetch(`${process.env.BACKEND_URL}/api/v3/policies`, { method: "POST", body: JSON.stringify(policy) })

  return NextResponse.json(policy, { status: 201 });
}

// ─── PATCH /api/v3/policies ───────────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  const body = (await req.json()) as Partial<SplitPolicy> & { id: string };

  if (!body.id) {
    return NextResponse.json({ error: "Missing policy id" }, { status: 400 });
  }

  POLICIES = POLICIES.map((p) =>
    p.id === body.id ? { ...p, ...body, updatedAt: new Date().toISOString() } : p,
  );

  const updated = POLICIES.find((p) => p.id === body.id);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // TODO: sync to backend validator
  return NextResponse.json(updated);
}

// ─── DELETE /api/v3/policies ──────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  const { id } = (await req.json()) as { id: string };
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  POLICIES = POLICIES.filter((p) => p.id !== id);

  // TODO: sync to backend validator
  return NextResponse.json({ ok: true });
}
