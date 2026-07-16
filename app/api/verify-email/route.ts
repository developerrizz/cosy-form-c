import { NextRequest, NextResponse } from "next/server";

const SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL ?? "";
const BYPASS =
  process.env.CONTRACT_EMAIL_VERIFY_BYPASS === "1" ||
  process.env.CONTRACT_EMAIL_VERIFY_BYPASS === "true";

type Body = {
  action?: string;
  email?: string;
  code?: string;
};

export async function POST(req: NextRequest) {
  if (BYPASS) {
    return NextResponse.json({ ok: true, bypass: true });
  }

  if (!SCRIPT_URL.trim()) {
    return NextResponse.json(
      { error: "GOOGLE_SCRIPT_URL not configured" },
      { status: 503 },
    );
  }

  try {
    const body = (await req.json()) as Body;
    const action = body.action;
    const email = typeof body.email === "string" ? body.email.trim() : "";
    if (!email || (action !== "send" && action !== "verify")) {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    }

    const payload = {
      type: "emailVerify",
      action,
      email,
      ...(action === "verify" && typeof body.code === "string"
        ? { code: body.code.trim() }
        : {}),
    };

    const res = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = { raw: text };
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: "upstream", detail: data },
        { status: 502 },
      );
    }

    return NextResponse.json(
      typeof data === "object" && data !== null ? data : { ok: true },
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
