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

  const { error } = await supabase
    .from("user_books")
    .delete()
    .eq("id", id)
    .eq("user_id", session.user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
