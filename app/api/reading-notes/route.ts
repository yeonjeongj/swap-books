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
      `*, author:users!author_id(nickname), reading_note_comments(id, author_id, text, created_at, parent_id, author:users!author_id(nickname))`
    )
    .eq("swap_request_id", swapId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching reading notes:", error);
    return NextResponse.json(
      { error: "Failed to fetch reading notes" },
      { status: 500 }
    );
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

  const { swapId, bookId, page, quote, imageUrl, comment } = body;
  if (
    !swapId ||
    !bookId ||
    typeof page !== "number" ||
    page < 0 ||
    !Number.isInteger(page)
  ) {
    return NextResponse.json(
      { error: "swapId, bookId, and a valid integer page are required" },
      { status: 400 }
    );
  }

  const { data: swap, error: swapError } = await supabase
    .from("swap_requests")
    .select("requester_id, receiver_id, status, offered_book_id, wanted_book_id")
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

  if (bookId !== swap.offered_book_id && bookId !== swap.wanted_book_id) {
    return NextResponse.json(
      { error: "Book is not part of this swap" },
      { status: 400 }
    );
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
      quote: quote?.trim() || null,
      image_url: imageUrl ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating reading note:", error);
    return NextResponse.json(
      { error: "Failed to create reading note" },
      { status: 500 }
    );
  }

  if (comment?.trim()) {
    await supabase.from("reading_note_comments").insert({
      note_id: data.id,
      author_id: session.user.id,
      text: comment.trim(),
      parent_id: null,
    });
  }

  return NextResponse.json(data, { status: 201 });
}
