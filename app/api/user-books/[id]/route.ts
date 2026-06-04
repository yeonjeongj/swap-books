import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/user-books/[id]">
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  const { count } = await supabase
    .from("swap_requests")
    .select("id", { count: "exact", head: true })
    .or(`offered_book_id.eq.${id},wanted_book_id.eq.${id}`);

  if (count && count > 0) {
    return NextResponse.json(
      { error: "교환독서를 한 책은 삭제할 수 없습니다" },
      { status: 409 }
    );
  }

  const { data, error } = await supabase
    .from("user_books")
    .delete()
    .eq("id", id)
    .eq("user_id", session.user.id)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json(
      { error: "Book not found or unauthorized" },
      { status: 404 }
    );
  }

  return new NextResponse(null, { status: 204 });
}
