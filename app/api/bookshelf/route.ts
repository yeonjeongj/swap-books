import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getBooksForMonth, getAllMonthsBookshelves, getUserJoinYearMonth } from "@/lib/bookshelf";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const now = new Date();
  const join = await getUserJoinYearMonth(userId);

  if (req.nextUrl.searchParams.get("all") === "true") {
    const months = await getAllMonthsBookshelves(userId, join.joinYear, join.joinMonth);
    return NextResponse.json({ months, ...join });
  }

  const year = parseInt(req.nextUrl.searchParams.get("year") ?? String(now.getFullYear()));
  const month = parseInt(req.nextUrl.searchParams.get("month") ?? String(now.getMonth() + 1));
  const books = await getBooksForMonth(userId, year, month);

  return NextResponse.json({ year, month, books, ...join });
}
