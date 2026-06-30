import "server-only";
import { supabase } from "@/lib/supabase";

export type NoteWithComments = {
  id: string;
  book_id: string;
  page: number;
  quote: string | null;
  image_url: string | null;
  created_at: string;
  author: { nickname: string } | null;
  reading_note_comments: {
    id: string;
    text: string;
    parent_id: string | null;
    author: { nickname: string } | null;
  }[];
};

export type BookSection = {
  book: {
    id: string;
    title: string;
    author: string;
    publisher: string | null;
    cover_image: string | null;
  };
  recorderNickname: string;
  notes: NoteWithComments[];
};

export type ExportData =
  | { kind: "solo"; section: BookSection }
  | {
      kind: "swap";
      swapCreatedAt: string;
      requesterNickname: string;
      receiverNickname: string;
      requesterSection: BookSection;
      receiverSection: BookSection;
    };

const NOTE_SELECT = `
  id, book_id, page, quote, image_url, created_at,
  author:users!author_id(nickname),
  reading_note_comments(id, text, parent_id, author:users!author_id(nickname))
` as const;

export async function buildExportData(
  userId: string,
  opts: { swapId: string } | { userBookId: string }
): Promise<ExportData> {
  if ("swapId" in opts) {
    return buildSwapExportData(userId, opts.swapId);
  }
  return buildSoloExportData(userId, opts.userBookId);
}

async function buildSwapExportData(userId: string, swapId: string): Promise<ExportData> {
  const { data: swap, error: swapError } = await supabase
    .from("swap_requests")
    .select(`
      id, created_at, requester_id, receiver_id,
      offered_book:user_books!offered_book_id(id, title, author, publisher, cover_image),
      wanted_book:user_books!wanted_book_id(id, title, author, publisher, cover_image),
      requester:users!requester_id(nickname),
      receiver:users!receiver_id(nickname)
    `)
    .eq("id", swapId)
    .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
    .single();

  if (swapError || !swap) throw new Error("Swap not found or access denied");

  const offeredBook = Array.isArray(swap.offered_book) ? swap.offered_book[0] : swap.offered_book;
  const wantedBook = Array.isArray(swap.wanted_book) ? swap.wanted_book[0] : swap.wanted_book;
  const requester = Array.isArray(swap.requester) ? swap.requester[0] : swap.requester;
  const receiver = Array.isArray(swap.receiver) ? swap.receiver[0] : swap.receiver;

  if (!offeredBook || !wantedBook) throw new Error("Swap books not found");

  const { data: notes } = await supabase
    .from("reading_notes")
    .select(NOTE_SELECT)
    .eq("swap_request_id", swapId)
    .order("page", { ascending: true });

  const allNotes = (notes ?? []) as unknown as NoteWithComments[];

  // requester reads wanted_book, receiver reads offered_book
  const requesterNotes = allNotes.filter((n) => n.book_id === wantedBook.id);
  const receiverNotes = allNotes.filter((n) => n.book_id === offeredBook.id);

  return {
    kind: "swap",
    swapCreatedAt: swap.created_at,
    requesterNickname: requester?.nickname ?? "알 수 없음",
    receiverNickname: receiver?.nickname ?? "알 수 없음",
    requesterSection: {
      book: wantedBook,
      recorderNickname: requester?.nickname ?? "알 수 없음",
      notes: requesterNotes,
    },
    receiverSection: {
      book: offeredBook,
      recorderNickname: receiver?.nickname ?? "알 수 없음",
      notes: receiverNotes,
    },
  };
}

async function buildSoloExportData(userId: string, userBookId: string): Promise<ExportData> {
  const { data: book, error: bookError } = await supabase
    .from("user_books")
    .select("id, title, author, publisher, cover_image")
    .eq("id", userBookId)
    .eq("user_id", userId)
    .single();

  if (bookError || !book) throw new Error("Book not found or access denied");

  const [{ data: userRow }, { data: notes }] = await Promise.all([
    supabase.from("users").select("nickname").eq("id", userId).single(),
    supabase
      .from("reading_notes")
      .select(NOTE_SELECT)
      .eq("book_id", userBookId)
      .is("swap_request_id", null)
      .order("page", { ascending: true }),
  ]);

  return {
    kind: "solo",
    section: {
      book,
      recorderNickname: userRow?.nickname ?? "알 수 없음",
      notes: (notes ?? []) as unknown as NoteWithComments[],
    },
  };
}
