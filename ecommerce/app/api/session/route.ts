import { NextRequest, NextResponse } from "next/server";

const GPU_URL =
  process.env.GPU_SERVER_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const gpuRes = await fetch(`${GPU_URL}/offer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });
    if (!gpuRes.ok) {
      const text = await gpuRes.text().catch(() => "(no body)");
      return NextResponse.json({ error: `GPU server returned ${gpuRes.status}` }, { status: 502 });
    }
    return NextResponse.json(await gpuRes.json());
  }  catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[/api/session] FULL ERROR:", err);
    console.error("[/api/session] GPU_URL was:", GPU_URL);
    return NextResponse.json(
      { error: `Signaling failed: ${msg}` },
      { status: 500 }
    );
  }}