import { NextRequest, NextResponse } from "next/server";

interface UploadLogoPayload {
  orgId: string;
  fileName: string;
  mimeType: string;
  fileData: string;
  provider: "s3" | "ipfs";
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as UploadLogoPayload;

  if (!body.orgId || !body.fileData || !body.provider) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (!body.fileData.startsWith("data:image/")) {
    return NextResponse.json({ error: "Only image uploads are supported" }, { status: 400 });
  }

  // Demo storage strategy:
  // - S3 mode returns a stable CDN-like URL pattern.
  // - IPFS mode returns an ipfs:// URI.
  // For local frontend demo purposes, we keep the data URL as a renderable fallback.
  const hash = Buffer.from(`${body.orgId}:${body.fileName}:${Date.now()}`).toString("base64url");
  const logoUrl =
    body.provider === "ipfs"
      ? `ipfs://${hash}`
      : `https://cdn.stellarstream.local/orgs/${encodeURIComponent(body.orgId)}/logo/${hash}`;

  return NextResponse.json(
    {
      ok: true,
      provider: body.provider,
      logoUrl,
      previewUrl: body.fileData,
      mimeType: body.mimeType,
    },
    { status: 201 },
  );
}
