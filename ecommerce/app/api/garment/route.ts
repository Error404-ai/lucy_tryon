import { NextRequest, NextResponse } from "next/server";

const GPU_URL =
  process.env.GPU_SERVER_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const gpuRes = await fetch(`${GPU_URL}/garment`, {
      method: "POST",
      body: formData,
    signal: AbortSignal.timeout(30_000),
    });
    if (!gpuRes.ok) {
      return NextResponse.json({ error: `Garment update failed: ${gpuRes.status}` }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[/api/garment] FULL ERROR:", err);
    console.error("[/api/garment] GPU_URL was:", GPU_URL);
    return NextResponse.json(
      { error: `Garment proxy failed: ${msg}` },
      { status: 500 }
    );
  }}