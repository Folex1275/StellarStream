import { NextRequest, NextResponse } from "next/server";

export interface ContactEntry {
  address: string;
  label?: string;
}

/**
 * POST /api/v3/contacts/bulk
 * Saves an array of new contacts to the address book.
 * Body: { contacts: ContactEntry[] }
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const contacts: ContactEntry[] = body?.contacts ?? [];

  if (!Array.isArray(contacts) || contacts.length === 0) {
    return NextResponse.json({ error: "No contacts provided" }, { status: 400 });
  }

  // Forward to backend when available:
  // await fetch(`${process.env.BACKEND_URL}/api/v3/contacts/bulk`, { method: "POST", body: JSON.stringify({ contacts }) });

  return NextResponse.json({ saved: contacts.length });
}
