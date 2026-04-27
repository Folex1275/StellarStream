import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:3001";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const slug = (await params).slug;
  const body = await req.json().catch(() => ({}));

  const upstream = await fetch(
    `${BACKEND}/api/v3/split-links/${encodeURIComponent(slug)}/unlock`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    },
  ).catch(() => null);

  if (!upstream) {
    return NextResponse.json({ error: "Backend unavailable." }, { status: 502 });
  }

  const json = await upstream.json();
  return NextResponse.json(json, { status: upstream.status });
}
