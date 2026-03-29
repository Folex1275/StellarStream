import { NextRequest, NextResponse } from "next/server";
import { getOrganizationMetadata, setOrganizationMetadata } from "@/lib/server/org-metadata-store";

interface UpsertOrgMetadataPayload {
  orgId: string;
  logo_url?: string;
  logo_provider?: "s3" | "ipfs";
  logo_preview_url?: string;
}

export async function GET(req: NextRequest) {
  const orgId = req.nextUrl.searchParams.get("orgId");

  if (!orgId) {
    return NextResponse.json({ error: "orgId is required" }, { status: 400 });
  }

  const metadata = getOrganizationMetadata(orgId);
  return NextResponse.json({ ok: true, metadata });
}

export async function PUT(req: NextRequest) {
  const body = (await req.json()) as UpsertOrgMetadataPayload;

  if (!body.orgId) {
    return NextResponse.json({ error: "orgId is required" }, { status: 400 });
  }

  const metadata = setOrganizationMetadata(body.orgId, {
    logo_url: body.logo_preview_url || body.logo_url,
    logo_provider: body.logo_provider,
  });

  return NextResponse.json({ ok: true, metadata }, { status: 200 });
}
