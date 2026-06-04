import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("swap_requests")
    .select(
      `id, status, is_public, created_at, requester_id, requester_message,
      offered_book:user_books!offered_book_id(id, title, author, cover_image),
      requester:users!requester_id(id, nickname, avatar_url)`
    )
    .eq("receiver_id", session.user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
