import { NextRequest, NextResponse } from "next/server";

export interface RecipientMetadata {
  address: string;
  taxId: string;
}

export interface SplitMetadataPayload {
  splitId: string;
  recipients: RecipientMetadata[];
}

/**
 * POST /api/v3/split/metadata
 *
 * Stores off-chain Tax ID / internal note metadata for split recipients.
 * This data is never written to the public ledger.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json()) as SplitMetadataPayload;

  if (!body.splitId || !Array.isArray(body.recipients)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // TODO: forward to the backend analytics layer:
  // await fetch(`${process.env.BACKEND_URL}/api/v3/split/metadata`, {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  //   body: JSON.stringify(body),
  // });

  return NextResponse.json({ ok: true, splitId: body.splitId }, { status: 201 });
}
