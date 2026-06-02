import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("user_books")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

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

  const { isbn, title, author, publisher, coverImage, quote, reason } = body;
  if (!title?.trim() || !author?.trim()) {
    return NextResponse.json(
      { error: "title and author are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("user_books")
    .insert({
      user_id: session.user.id,
      isbn: isbn ?? null,
      title: title.trim(),
      author: author.trim(),
      publisher: publisher ?? null,
      cover_image: coverImage ?? null,
      quote: quote ?? null,
      reason: reason ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
