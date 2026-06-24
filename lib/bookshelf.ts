import "server-only";
import { supabase } from "@/lib/supabase";

export type BookStatus = "registered" | "noted" | "swapping" | "swapped";

export type BookshelfBook = {
  id: string;
  title: string;
  author: string;
  status: BookStatus;
};

export type MonthlyBookshelf = {
  year: number;
  month: number;
  books: BookshelfBook[];
};

function toMonthKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function resolveStatus(
  bookId: string,
  notedSet: Set<string>,
  swappingSet: Set<string>,
  swappedSet: Set<string>
): BookStatus {
  if (swappedSet.has(bookId)) return "swapped";
  if (swappingSet.has(bookId)) return "swapping";
  if (notedSet.has(bookId)) return "noted";
  return "registered";
}

export async function getBooksForMonth(
  userId: string,
  year: number,
  month: number
): Promise<BookshelfBook[]> {
  const pad = (n: number) => String(n).padStart(2, "0");
  const monthStart = `${year}-${pad(month)}-01T00:00:00.000Z`;
  const lastDay = new Date(year, month, 0).getDate();
  const monthEnd = `${year}-${pad(month)}-${pad(lastDay)}T23:59:59.999Z`;

  const { data: books, error: booksError } = await supabase
    .from("user_books")
    .select("id, title, author")
    .eq("user_id", userId)
    .gte("created_at", monthStart)
    .lte("created_at", monthEnd);

  if (booksError) console.error("[getBooksForMonth] user_books error:", booksError);
  if (!books || books.length === 0) return [];

  const bookIds = books.map((b) => b.id);
  const idList = bookIds.join(",");

  const [notesRes, swapsRes] = await Promise.all([
    supabase
      .from("reading_notes")
      .select("book_id")
      .in("book_id", bookIds)
      .is("swap_request_id", null),
    supabase
      .from("swap_requests")
      .select("offered_book_id, wanted_book_id, status")
      .or(`offered_book_id.in.(${idList}),wanted_book_id.in.(${idList})`)
      .in("status", ["pending", "accepted", "completed"]),
  ]);

  if (notesRes.error) console.error("[getBooksForMonth] reading_notes error:", notesRes.error);
  if (swapsRes.error) console.error("[getBooksForMonth] swap_requests error:", swapsRes.error);

  const notedSet = new Set((notesRes.data ?? []).map((n) => n.book_id));
  const swappingSet = new Set<string>();
  const swappedSet = new Set<string>();

  for (const swap of swapsRes.data ?? []) {
    for (const id of [swap.offered_book_id, swap.wanted_book_id]) {
      if (!id || !bookIds.includes(id)) continue;
      if (swap.status === "completed") swappedSet.add(id);
      else swappingSet.add(id);
    }
  }

  return books.map((book) => ({
    ...book,
    status: resolveStatus(book.id, notedSet, swappingSet, swappedSet),
  }));
}

// Fetches all months in 3 queries instead of 3×N (avoids N+1)
export async function getAllMonthsBookshelves(
  userId: string,
  joinYear: number,
  joinMonth: number
): Promise<MonthlyBookshelf[]> {
  const now = new Date();
  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth() + 1;

  const joinStart = `${joinYear}-${String(joinMonth).padStart(2, "0")}-01T00:00:00.000Z`;

  const [booksRes, notesRes, swapsRes] = await Promise.all([
    supabase
      .from("user_books")
      .select("id, title, author, created_at")
      .eq("user_id", userId)
      .gte("created_at", joinStart)
      .order("created_at", { ascending: true }),
    supabase
      .from("reading_notes")
      .select("book_id")
      .is("swap_request_id", null),
    supabase
      .from("swap_requests")
      .select("offered_book_id, wanted_book_id, status")
      .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
      .in("status", ["pending", "accepted", "completed"]),
  ]);

  if (booksRes.error) console.error("[getAllMonthsBookshelves] user_books error:", booksRes.error);
  if (notesRes.error) console.error("[getAllMonthsBookshelves] reading_notes error:", notesRes.error);
  if (swapsRes.error) console.error("[getAllMonthsBookshelves] swap_requests error:", swapsRes.error);

  const allBooks = booksRes.data ?? [];
  const userBookIds = new Set(allBooks.map((b) => b.id));

  const notedSet = new Set((notesRes.data ?? []).map((n) => n.book_id));
  const swappingSet = new Set<string>();
  const swappedSet = new Set<string>();

  for (const swap of swapsRes.data ?? []) {
    for (const id of [swap.offered_book_id, swap.wanted_book_id]) {
      if (!id || !userBookIds.has(id)) continue;
      if (swap.status === "completed") swappedSet.add(id);
      else swappingSet.add(id);
    }
  }

  // Build month slots from joinMonth to now
  const monthMap = new Map<string, BookshelfBook[]>();
  let y = joinYear, m = joinMonth;
  while (y < nowYear || (y === nowYear && m <= nowMonth)) {
    monthMap.set(toMonthKey(y, m), []);
    m++;
    if (m > 12) { m = 1; y++; }
  }

  // Assign each book to its registration month
  for (const book of allBooks) {
    const d = new Date(book.created_at);
    const key = toMonthKey(d.getFullYear(), d.getMonth() + 1);
    if (!monthMap.has(key)) continue;
    monthMap.get(key)!.push({
      id: book.id,
      title: book.title,
      author: book.author,
      status: resolveStatus(book.id, notedSet, swappingSet, swappedSet),
    });
  }

  return Array.from(monthMap.entries()).map(([key, books]) => {
    const [ky, km] = key.split("-").map(Number);
    return { year: ky, month: km, books };
  });
}

export async function getUserJoinYearMonth(
  userId: string
): Promise<{ joinYear: number; joinMonth: number }> {
  const now = new Date();
  const fallback = { joinYear: now.getFullYear(), joinMonth: now.getMonth() + 1 };

  const { data: user } = await supabase
    .from("users")
    .select("created_at")
    .eq("id", userId)
    .single();

  if (user?.created_at) {
    const d = new Date(user.created_at);
    return { joinYear: d.getFullYear(), joinMonth: d.getMonth() + 1 };
  }

  const { data: book } = await supabase
    .from("user_books")
    .select("created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (book?.created_at) {
    const d = new Date(book.created_at);
    return { joinYear: d.getFullYear(), joinMonth: d.getMonth() + 1 };
  }

  return fallback;
}
