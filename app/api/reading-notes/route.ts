import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const swapId = req.nextUrl.searchParams.get("swapId");
  if (!swapId) {
    return NextResponse.json({ error: "swapId is required" }, { status: 400 });
  }

  const { data: swap, error: swapError } = await supabase
    .from("swap_requests")
    .select("requester_id, receiver_id")
    .eq("id", swapId)
    .single();

  if (swapError || !swap) {
    return NextResponse.json({ error: "Swap not found" }, { status: 404 });
  }

  const isParticipant =
    swap.requester_id === session.user.id ||
    swap.receiver_id === session.user.id;
  if (!isParticipant) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("reading_notes")
    .select(
      `*, reading_note_comments(id, author_id, text, created_at)`
    )
    .eq("swap_request_id", swapId)
    .order("created_at", { ascending: true });

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

  const { swapId, bookId, page, quote } = body;
  if (!swapId || !bookId || !page || !quote?.trim()) {
    return NextResponse.json(
      { error: "swapId, bookId, page, and quote are required" },
      { status: 400 }
    );
  }

  const { data: swap, error: swapError } = await supabase
    .from("swap_requests")
    .select("requester_id, receiver_id, status")
    .eq("id", swapId)
    .single();

  if (swapError || !swap) {
    return NextResponse.json({ error: "Swap not found" }, { status: 404 });
  }

  const isParticipant =
    swap.requester_id === session.user.id ||
    swap.receiver_id === session.user.id;
  if (!isParticipant) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (swap.status !== "accepted") {
    return NextResponse.json(
      { error: "Notes can only be added to accepted swaps" },
      { status: 422 }
    );
  }

  const { data, error } = await supabase
    .from("reading_notes")
    .insert({
      author_id: session.user.id,
      swap_request_id: swapId,
      book_id: bookId,
      page,
      quote: quote.trim(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
