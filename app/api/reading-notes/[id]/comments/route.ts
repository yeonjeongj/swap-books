import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function POST(
  req: NextRequest,
  ctx: RouteContext<"/api/reading-notes/[id]/comments">
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: noteId } = await ctx.params;

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { text, parentId } = body;
  if (!text?.trim()) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const { data: note } = await supabase
    .from("reading_notes")
    .select("swap_request_id")
    .eq("id", noteId)
    .single();

  if (!note) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  const { data: swap } = await supabase
    .from("swap_requests")
    .select("requester_id, receiver_id")
    .eq("id", note.swap_request_id)
    .single();

  if (
    !swap ||
    (swap.requester_id !== session.user.id && swap.receiver_id !== session.user.id)
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Enforce max 1 level of nesting: if the target parent is itself a reply, reparent to the root.
  let effectiveParentId: string | null = parentId ?? null;
  if (parentId) {
    const { data: parent } = await supabase
      .from("reading_note_comments")
      .select("id, parent_id")
      .eq("id", parentId)
      .eq("note_id", noteId)
      .single();

    if (!parent) {
      return NextResponse.json({ error: "Parent comment not found" }, { status: 404 });
    }
    effectiveParentId = parent.parent_id ?? parentId;
  }

  const { data, error } = await supabase
    .from("reading_note_comments")
    .insert({
      note_id: noteId,
      author_id: session.user.id,
      text: text.trim(),
      parent_id: effectiveParentId,
    })
    .select("id, author_id, text, created_at, parent_id, author:users!author_id(nickname)")
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
