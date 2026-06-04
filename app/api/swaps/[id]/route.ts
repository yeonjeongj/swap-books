import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/swaps/[id]">
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  const { data, error } = await supabase
    .from("swap_requests")
    .select(
      `*, offered_book:user_books!offered_book_id(id, title, author, cover_image), wanted_book:user_books!wanted_book_id(id, title, author, cover_image)`
    )
    .eq("id", id)
    .or(
      `requester_id.eq.${session.user.id},receiver_id.eq.${session.user.id},is_public.eq.true`
    )
    .single();

  if (error) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pending: ["accepted", "rejected", "expired"],
  accepted: ["completed"],
};

export async function PATCH(
  req: NextRequest,
  ctx: RouteContext<"/api/swaps/[id]">
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

  const { status } = body;
  if (!status) {
    return NextResponse.json({ error: "status is required" }, { status: 400 });
  }

  const { data: existing, error: fetchError } = await supabase
    .from("swap_requests")
    .select("status, requester_id, receiver_id, is_public, wanted_book_id")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isRequester = existing.requester_id === session.user.id;
  const isReceiver = existing.receiver_id === session.user.id;
  const isPublicPending =
    existing.is_public && !existing.receiver_id && existing.status === "pending";

  if (!isRequester && !isReceiver && !isPublicPending) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const allowed = ALLOWED_TRANSITIONS[existing.status] ?? [];
  if (!allowed.includes(status)) {
    return NextResponse.json(
      { error: `Cannot transition from '${existing.status}' to '${status}'` },
      { status: 422 }
    );
  }

  if (
    (status === "accepted" || status === "rejected") &&
    !isReceiver &&
    !isPublicPending
  ) {
    return NextResponse.json(
      { error: "Only the receiver can accept or reject this swap request" },
      { status: 403 }
    );
  }

  if (status === "accepted" && isRequester && !isPublicPending) {
    return NextResponse.json(
      { error: "You cannot accept your own swap request" },
      { status: 400 }
    );
  }

  const updatePayload: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === "accepted") {
    if (isPublicPending) {
      updatePayload.receiver_id = session.user.id;
    }
    const finalWantedBookId = body.wantedBookId || existing.wanted_book_id;
    if (!finalWantedBookId) {
      return NextResponse.json(
        { error: "wantedBookId is required to accept the swap" },
        { status: 400 }
      );
    }
    if (body.wantedBookId) {
      const { data: book } = await supabase
        .from("user_books")
        .select("user_id")
        .eq("id", body.wantedBookId)
        .single();
      if (!book || book.user_id !== session.user.id) {
        return NextResponse.json(
          { error: "You do not own the wanted book" },
          { status: 403 }
        );
      }
      updatePayload.wanted_book_id = body.wantedBookId;
    }
    updatePayload.receiver_message = body.receiverMessage ?? null;
  }

  const { data, error } = await supabase
    .from("swap_requests")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
