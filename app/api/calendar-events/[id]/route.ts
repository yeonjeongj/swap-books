import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function PATCH(
  req: NextRequest,
  ctx: RouteContext<"/api/calendar-events/[id]">
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { title, time } = body;
  if (!title?.trim()) return NextResponse.json({ error: "title is required" }, { status: 400 });

  const { data: existing, error: fetchError } = await supabase
    .from("calendar_events")
    .select("user_id")
    .eq("id", id)
    .single();

  if (fetchError || !existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.user_id !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await supabase
    .from("calendar_events")
    .update({ title: title.trim(), time: time ?? null })
    .eq("id", id)
    .select("id, title, date, time, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/calendar-events/[id]">
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  const { data: existing, error: fetchError } = await supabase
    .from("calendar_events")
    .select("user_id")
    .eq("id", id)
    .single();

  if (fetchError || !existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.user_id !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { error } = await supabase.from("calendar_events").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
