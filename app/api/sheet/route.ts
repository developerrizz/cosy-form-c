import { NextRequest, NextResponse } from "next/server";

const SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL ?? "";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id || !SCRIPT_URL) return NextResponse.json({ result: "skip" });
  try {
    const res = await fetch(`${SCRIPT_URL}?id=${encodeURIComponent(id)}`, { cache: "no-store" });
    const data: unknown = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ result: "error" }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  if (!SCRIPT_URL.trim()) {
    return NextResponse.json({ error: "GOOGLE_SCRIPT_URL not configured" }, { status: 503 });
  }
  try {
    const body: unknown = await req.json();
    await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "upstream" }, { status: 502 });
  }
}
