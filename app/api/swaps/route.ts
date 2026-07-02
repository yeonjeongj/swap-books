import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = req.nextUrl.searchParams.get("status");

  let query = supabase
    .from("swap_requests")
    .select("*")
    .or(`requester_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`)
    .order("created_at", { ascending: false });

  if (status === "active") {
    query = query.in("status", ["pending", "accepted"]);
  } else if (status === "completed") {
    query = query.in("status", ["completed", "rejected", "expired"]);
  }

  const { data, error } = await query;

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

  const { offeredBookId, receiverId, wantedBookId, isPublic, requesterMessage } = body;
  if (!offeredBookId) {
    return NextResponse.json(
      { error: "offeredBookId is required" },
      { status: 400 }
    );
  }
  if (!isPublic && !receiverId) {
    return NextResponse.json(
      { error: "receiverId is required for private swap requests" },
      { status: 400 }
    );
  }
  if (typeof requesterMessage !== "string" || !requesterMessage.trim()) {
    return NextResponse.json(
      { error: "requesterMessage is required" },
      { status: 400 }
    );
  }

  const { data: book, error: bookError } = await supabase
    .from("user_books")
    .select("user_id")
    .eq("id", offeredBookId)
    .single();

  if (bookError || !book) {
    return NextResponse.json({ error: "Offered book not found" }, { status: 404 });
  }

  if (book.user_id !== session.user.id) {
    return NextResponse.json(
      { error: "You do not own the offered book" },
      { status: 403 }
    );
  }

  const { data, error } = await supabase
    .from("swap_requests")
    .insert({
      requester_id: session.user.id,
      offered_book_id: offeredBookId,
      receiver_id: receiverId ?? null,
      wanted_book_id: wantedBookId ?? null,
      is_public: isPublic ?? false,
      requester_message: requesterMessage ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
