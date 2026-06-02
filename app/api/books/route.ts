import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q) {
    return NextResponse.json({ error: "q is required" }, { status: 400 });
  }

  const apiKey = process.env.KAKAO_CLIENT_ID;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Kakao API key is not configured" },
      { status: 500 }
    );
  }

  const url = `https://dapi.kakao.com/v3/search/book?query=${encodeURIComponent(q)}&size=10`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `KakaoAK ${apiKey}` },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Book search failed" }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
