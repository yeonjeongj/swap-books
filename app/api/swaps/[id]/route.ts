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
    .select("*")
    .eq("id", id)
    .or(`requester_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`)
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
    .select("status, requester_id, receiver_id")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isParticipant =
    existing.requester_id === session.user.id ||
    existing.receiver_id === session.user.id;
  if (!isParticipant) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const allowed = ALLOWED_TRANSITIONS[existing.status] ?? [];
  if (!allowed.includes(status)) {
    return NextResponse.json(
      { error: `Cannot transition from '${existing.status}' to '${status}'` },
      { status: 422 }
    );
  }

  const { data, error } = await supabase
    .from("swap_requests")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
