import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getBooksForMonth, getUserJoinYearMonth, type BookshelfBook } from "@/lib/bookshelf";

export type MonthlyBookshelf = {
  year: number;
  month: number;
  books: BookshelfBook[];
};

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const now = new Date();
  const join = await getUserJoinYearMonth(userId);

  if (req.nextUrl.searchParams.get("all") === "true") {
    const months: MonthlyBookshelf[] = [];
    let y = join.joinYear, m = join.joinMonth;
    const nowY = now.getFullYear(), nowM = now.getMonth() + 1;

    while (y < nowY || (y === nowY && m <= nowM)) {
      const books = await getBooksForMonth(userId, y, m);
      months.push({ year: y, month: m, books });
      m++;
      if (m > 12) { m = 1; y++; }
    }

    return NextResponse.json({ months, ...join });
  }

  const year = parseInt(req.nextUrl.searchParams.get("year") ?? String(now.getFullYear()));
  const month = parseInt(req.nextUrl.searchParams.get("month") ?? String(now.getMonth() + 1));
  const books = await getBooksForMonth(userId, year, month);

  return NextResponse.json({ year, month, books, ...join });
}
