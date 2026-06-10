import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const year = req.nextUrl.searchParams.get("year");
  const month = req.nextUrl.searchParams.get("month");

  let query = supabase
    .from("calendar_events")
    .select("id, title, date, time, created_at")
    .eq("user_id", session.user.id)
    .order("date", { ascending: true })
    .order("created_at", { ascending: true });

  if (year && month) {
    const y = parseInt(year);
    const m = parseInt(month);
    const from = `${y}-${String(m).padStart(2, "0")}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    const to = `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    query = query.gte("date", from).lte("date", to);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { title, date, time } = body;
  if (!title?.trim()) return NextResponse.json({ error: "title is required" }, { status: 400 });
  if (!date) return NextResponse.json({ error: "date is required" }, { status: 400 });

  const { data, error } = await supabase
    .from("calendar_events")
    .insert({ user_id: session.user.id, title: title.trim(), date, time: time ?? null })
    .select("id, title, date, time, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
