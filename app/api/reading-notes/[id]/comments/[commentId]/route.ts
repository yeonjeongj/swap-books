import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/reading-notes/[id]/comments/[commentId]">
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { commentId } = await ctx.params;

  const { data: comment } = await supabase
    .from("reading_note_comments")
    .select("id, author_id")
    .eq("id", commentId)
    .single();

  if (!comment) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  if (comment.author_id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase
    .from("reading_note_comments")
    .delete()
    .eq("id", commentId);

  if (error) {
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
