import { NextRequest, NextResponse } from "next/server";

// app/api/v3/split/templates/route.ts
// Issue #783 — Split-Template Library API

export interface SplitTemplateRecipient {
  address: string;
  percentage: number;
}

export interface SplitTemplate {
  id: string;
  name: string;
  recipients: SplitTemplateRecipient[];
  createdAt: string;
}

export interface SaveTemplatePayload {
  name: string;
  recipients: SplitTemplateRecipient[];
}

/**
 * POST /api/v3/split/templates
 * Saves a split configuration as a reusable template.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json()) as SaveTemplatePayload;

  if (
    !body.name?.trim() ||
    !Array.isArray(body.recipients) ||
    body.recipients.length === 0
  ) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const total = body.recipients.reduce((sum, r) => sum + r.percentage, 0);
  if (Math.abs(total - 100) > 0.01) {
    return NextResponse.json(
      { error: "Recipient percentages must sum to 100" },
      { status: 422 },
    );
  }

  // TODO: persist to backend Templates table:
  // await fetch(`${process.env.BACKEND_URL}/api/v3/split/templates`, {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify(body),
  // });

  const template: SplitTemplate = {
    id: crypto.randomUUID(),
    name: body.name.trim(),
    recipients: body.recipients,
    createdAt: new Date().toISOString(),
  };

  return NextResponse.json(template, { status: 201 });
}
