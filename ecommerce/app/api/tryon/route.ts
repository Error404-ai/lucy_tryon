import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const awsUrl = process.env.AWS_TRYON_URL;
  if (!awsUrl) {
    return NextResponse.json(
      { error: "AWS_TRYON_URL is not set in environment variables" },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();

    const response = await fetch(`${awsUrl}/tryon`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      // Allow up to 30s for generation
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("AWS server error:", err);
      return NextResponse.json(
        { error: "Generation failed on server" },
        { status: 500 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Try-on API error:", error);
    return NextResponse.json(
      { error: "Failed to connect to generation server" },
      { status: 500 }
    );
  }
}

