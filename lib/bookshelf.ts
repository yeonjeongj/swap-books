import "server-only";
import { supabase } from "@/lib/supabase";

export type BookStatus = "registered" | "noted" | "swapping" | "swapped";

export type BookshelfBook = {
  id: string;
  title: string;
  author: string;
  status: BookStatus;
};

export async function getBooksForMonth(
  userId: string,
  year: number,
  month: number
): Promise<BookshelfBook[]> {
  const pad = (n: number) => String(n).padStart(2, "0");
  const monthStart = `${year}-${pad(month)}-01T00:00:00.000Z`;
  const lastDay = new Date(year, month, 0).getDate();
  const monthEnd = `${year}-${pad(month)}-${pad(lastDay)}T23:59:59.999Z`;

  const { data: books } = await supabase
    .from("user_books")
    .select("id, title, author")
    .eq("user_id", userId)
    .gte("created_at", monthStart)
    .lte("created_at", monthEnd);

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

  return books.map((book) => {
    let status: BookStatus = "registered";
    if (swappedSet.has(book.id)) status = "swapped";
    else if (swappingSet.has(book.id)) status = "swapping";
    else if (notedSet.has(book.id)) status = "noted";
    return { ...book, status };
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
