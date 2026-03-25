import { NextRequest, NextResponse } from "next/server";
const GPU_URL = process.env.GPU_SERVER_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const gpuRes = await fetch(`${GPU_URL}/candidate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5_000),
    });
    if (!gpuRes.ok) return NextResponse.json({ error: `GPU ${gpuRes.status}` }, { status: 502 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}