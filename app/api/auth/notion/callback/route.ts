import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

const NOTION_TOKEN_URL = "https://api.notion.com/v1/oauth/token";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state"); // 원본 페이지 경로

  if (!code) {
    const redirectTo = state ?? "/my";
    return NextResponse.redirect(new URL(`${redirectTo}?notion_error=1`, req.url));
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/notion/callback`;
  const credentials = Buffer.from(
    `${process.env.NOTION_CLIENT_ID}:${process.env.NOTION_CLIENT_SECRET}`
  ).toString("base64");

  const tokenRes = await fetch(NOTION_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  const redirectTo = state ?? "/my";

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL(`${redirectTo}?notion_error=1`, req.url));
  }

  const token = await tokenRes.json();

  await supabase.from("notion_integrations").upsert(
    {
      user_id: session.user.id,
      access_token: token.access_token,
      workspace_id: token.workspace_id,
      workspace_name: token.workspace_name ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  return NextResponse.redirect(new URL(`${redirectTo}?notion_ready=1`, req.url));
}
