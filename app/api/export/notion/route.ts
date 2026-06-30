import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { buildExportData } from "@/lib/export/buildExportData";
import { createNotionPage } from "@/lib/export/notionGenerator";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const swapId = req.nextUrl.searchParams.get("swapId");
  const userBookId = req.nextUrl.searchParams.get("userBookId");

  if (!swapId && !userBookId) {
    return NextResponse.json({ error: "swapId 또는 userBookId가 필요합니다" }, { status: 400 });
  }

  const { data: integration } = await supabase
    .from("notion_integrations")
    .select("access_token")
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (!integration) {
    return NextResponse.json({ error: "notion_not_connected" }, { status: 403 });
  }

  try {
    const exportData = await buildExportData(
      session.user.id,
      swapId ? { swapId } : { userBookId: userBookId! }
    );

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://swap-books.vercel.app";
    const pageUrl = await createNotionPage(integration.access_token, exportData, appUrl);

    return NextResponse.json({ pageUrl });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
