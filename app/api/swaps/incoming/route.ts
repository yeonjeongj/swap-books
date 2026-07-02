import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

const REJECTED_VISIBLE_MS = 24 * 60 * 60 * 1000;
const ACTIVITY_VISIBLE_MS = 24 * 60 * 60 * 1000;
const ACTIVITY_GROUP_GAP_MS = 30 * 60 * 1000;
const COMPLETED_VISIBLE_MS = 24 * 60 * 60 * 1000;

type NicknameUser = { id: string; nickname: string | null; avatar_url: string | null };
type SwapParticipant = {
  id: string;
  requester_id: string;
  receiver_id: string | null;
  offered_book: { id: string; title: string; author: string; cover_image: string | null } | null;
  requester: NicknameUser | null;
  receiver: NicknameUser | null;
};

function latestBurstCount(timestampsDesc: number[]): number {
  let count = 1;
  for (let i = 1; i < timestampsDesc.length; i++) {
    if (timestampsDesc[i - 1] - timestampsDesc[i] > ACTIVITY_GROUP_GAP_MS) break;
    count++;
  }
  return count;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const myId = session.user.id;

  const rejectedSince = new Date(Date.now() - REJECTED_VISIBLE_MS).toISOString();
  const activitySince = new Date(Date.now() - ACTIVITY_VISIBLE_MS).toISOString();
  const completedSince = new Date(Date.now() - COMPLETED_VISIBLE_MS).toISOString();

  const [incomingResult, rejectedResult, acceptedSwapsResult, completedResult] = await Promise.all([
    supabase
      .from("swap_requests")
      .select(
        `id, status, is_public, created_at, requester_id, requester_message,
        offered_book:user_books!offered_book_id(id, title, author, cover_image),
        requester:users!requester_id(id, nickname, avatar_url)`
      )
      .eq("receiver_id", myId)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
    supabase
      .from("swap_requests")
      .select(
        `id, status, updated_at,
        offered_book:user_books!offered_book_id(id, title, author, cover_image),
        receiver:users!receiver_id(id, nickname, avatar_url)`
      )
      .eq("requester_id", myId)
      .eq("status", "rejected")
      .gte("updated_at", rejectedSince)
      .order("updated_at", { ascending: false }),
    supabase
      .from("swap_requests")
      .select(
        `id, requester_id, receiver_id,
        offered_book:user_books!offered_book_id(id, title, author, cover_image),
        requester:users!requester_id(id, nickname, avatar_url),
        receiver:users!receiver_id(id, nickname, avatar_url)`
      )
      .or(`requester_id.eq.${myId},receiver_id.eq.${myId}`)
      .eq("status", "accepted"),
    supabase
      .from("swap_requests")
      .select(
        `id, requester_id, receiver_id, updated_at, completed_by,
        offered_book:user_books!offered_book_id(id, title, author, cover_image),
        requester:users!requester_id(id, nickname, avatar_url),
        receiver:users!receiver_id(id, nickname, avatar_url)`
      )
      .or(`requester_id.eq.${myId},receiver_id.eq.${myId}`)
      .eq("status", "completed")
      .gte("updated_at", completedSince)
      .order("updated_at", { ascending: false }),
  ]);

  if (incomingResult.error) {
    return NextResponse.json({ error: incomingResult.error.message }, { status: 500 });
  }
  if (rejectedResult.error) {
    return NextResponse.json({ error: rejectedResult.error.message }, { status: 500 });
  }
  if (acceptedSwapsResult.error) {
    return NextResponse.json({ error: acceptedSwapsResult.error.message }, { status: 500 });
  }
  if (completedResult.error) {
    return NextResponse.json({ error: completedResult.error.message }, { status: 500 });
  }

  const acceptedSwaps = (acceptedSwapsResult.data ?? []) as unknown as SwapParticipant[];
  const swapIds = acceptedSwaps.map((s) => s.id);

  let activity: {
    id: string;
    swap_id: string;
    count: number;
    latest_at: string;
    offered_book: SwapParticipant["offered_book"];
    partner: NicknameUser | null;
  }[] = [];

  if (swapIds.length > 0) {
    const [notesResult, commentsResult] = await Promise.all([
      supabase
        .from("reading_notes")
        .select("id, author_id, created_at, swap_request_id")
        .in("swap_request_id", swapIds)
        .neq("author_id", myId)
        .gte("created_at", activitySince),
      supabase
        .from("reading_note_comments")
        .select("id, author_id, created_at, note:reading_notes!note_id!inner(swap_request_id)")
        .neq("author_id", myId)
        .gte("created_at", activitySince)
        .in("note.swap_request_id", swapIds),
    ]);

    if (notesResult.error) {
      return NextResponse.json({ error: notesResult.error.message }, { status: 500 });
    }
    if (commentsResult.error) {
      return NextResponse.json({ error: commentsResult.error.message }, { status: 500 });
    }

    const eventsBySwap = new Map<string, number[]>();
    for (const note of notesResult.data ?? []) {
      const list = eventsBySwap.get(note.swap_request_id) ?? [];
      list.push(new Date(note.created_at).getTime());
      eventsBySwap.set(note.swap_request_id, list);
    }
    for (const comment of commentsResult.data ?? []) {
      const noteRelation = comment.note as unknown as { swap_request_id: string } | { swap_request_id: string }[] | null;
      const swapId = Array.isArray(noteRelation) ? noteRelation[0]?.swap_request_id : noteRelation?.swap_request_id;
      if (!swapId || !swapIds.includes(swapId)) continue;
      const list = eventsBySwap.get(swapId) ?? [];
      list.push(new Date(comment.created_at).getTime());
      eventsBySwap.set(swapId, list);
    }

    activity = acceptedSwaps
      .map((swap) => {
        const timestamps = (eventsBySwap.get(swap.id) ?? []).sort((a, b) => b - a);
        if (timestamps.length === 0) return null;
        const partner = swap.requester_id === myId ? swap.receiver : swap.requester;
        return {
          id: swap.id,
          swap_id: swap.id,
          count: latestBurstCount(timestamps),
          latest_at: new Date(timestamps[0]).toISOString(),
          offered_book: swap.offered_book,
          partner,
        };
      })
      .filter((a): a is NonNullable<typeof a> => a !== null)
      .sort((a, b) => new Date(b.latest_at).getTime() - new Date(a.latest_at).getTime());
  }

  const completed = (completedResult.data ?? [])
    .filter((swap) => swap.completed_by && swap.completed_by !== myId)
    .map((swap) => ({
      id: swap.id,
      swap_id: swap.id,
      updated_at: swap.updated_at,
      offered_book: swap.offered_book,
      partner: swap.requester_id === myId ? swap.receiver : swap.requester,
    }));

  return NextResponse.json({
    incoming: incomingResult.data ?? [],
    rejected: rejectedResult.data ?? [],
    activity,
    completed,
  });
}
