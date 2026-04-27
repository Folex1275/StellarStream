import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:3001";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const slug = (await params).slug;
  if (!slug) {
    return NextResponse.json({ error: "Missing split link identifier." }, { status: 400 });
  }

  // Forward any unlock token the client already holds
  const authHeader = req.headers.get("authorization") ?? "";

  const upstream = await fetch(
    `${BACKEND}/api/v3/split-links/${encodeURIComponent(slug)}`,
    { headers: authHeader ? { authorization: authHeader } : {} },
  ).catch(() => null);

  if (!upstream) {
    return NextResponse.json({ error: "Backend unavailable." }, { status: 502 });
  }

  const body = await upstream.json();

  // Bubble up 401 passwordProtected flag transparently
  if (upstream.status === 401 && body.passwordProtected) {
    return NextResponse.json(
      { error: body.error, passwordProtected: true },
      { status: 401 },
    );
  }

  return NextResponse.json(body, { status: upstream.status });
}
