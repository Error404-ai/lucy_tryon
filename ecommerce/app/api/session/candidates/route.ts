import { NextRequest, NextResponse } from "next/server";
const GPU_URL = process.env.GPU_SERVER_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const session_id = searchParams.get("session_id");
    const offset = searchParams.get("offset") ?? "0";
    if (!session_id) return NextResponse.json([]);
    const gpuRes = await fetch(
      `${GPU_URL}/candidates?session_id=${session_id}&offset=${offset}`,
      { signal: AbortSignal.timeout(5_000) }
    );
    if (!gpuRes.ok) return NextResponse.json([]);
    return NextResponse.json(await gpuRes.json());
  } catch {
    return NextResponse.json([]);
  }
}