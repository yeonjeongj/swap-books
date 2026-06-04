import Link from "next/link";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import BookCovers, { type BookSide } from "./BookCovers";

const COVER_COLORS = ["#3a4430", "#6b7a52", "#4a5a3a", "#7a6a52", "#5a4a3a"];

type AcceptedSwap = {
  id: string;
  requester_message: string | null;
  receiver_message: string | null;
  offered_book: { id: string; title: string; author: string; cover_image: string | null } | null;
  wanted_book: { id: string; title: string; author: string; cover_image: string | null } | null;
  requester: { id: string; nickname: string | null } | null;
  receiver: { id: string; nickname: string | null } | null;
};

export default async function CurrentSwap() {
  const session = await auth();
  let swaps: AcceptedSwap[] = [];

  if (session?.user?.id) {
    const { data } = await supabase
      .from("swap_requests")
      .select(
        `id, requester_message, receiver_message,
        offered_book:user_books!offered_book_id(id, title, author, cover_image),
        wanted_book:user_books!wanted_book_id(id, title, author, cover_image),
        requester:users!requester_id(id, nickname),
        receiver:users!receiver_id(id, nickname)`
      )
      .or(`requester_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`)
      .eq("status", "accepted")
      .order("created_at", { ascending: false });
    swaps = (data ?? []) as unknown as AcceptedSwap[];
  }

  return (
    <div className="flex flex-col items-center w-full">
      {/* Section heading */}
      <section className="flex flex-col items-center pt-16 pb-4 px-6 text-center">
        <p className="text-primary text-[10px] tracking-[0.28em] uppercase font-body">
          Curated Dialogues
        </p>
        <h1 className="font-headline text-5xl text-neutral mt-3">
          Current Exchange
        </h1>
        <div className="w-14 h-px bg-neutral/20 mt-5" />
      </section>

      {/* Swap list */}
      <div className="w-full max-w-2xl px-8 mt-12 flex flex-col gap-16">
        {swaps.length === 0 ? (
          <p className="text-center text-sm font-body text-neutral/35">데이터가 없습니다</p>
        ) : (
          swaps.map((swap, i) => {
            const left: BookSide = {
              title: swap.offered_book?.title ?? "",
              cover_image: swap.offered_book?.cover_image ?? null,
              coverColor: COVER_COLORS[i * 2 % COVER_COLORS.length],
              nickname: swap.requester?.nickname ?? "독자",
              message: swap.requester_message,
            };
            const right: BookSide = {
              title: swap.wanted_book?.title ?? "",
              cover_image: swap.wanted_book?.cover_image ?? null,
              coverColor: COVER_COLORS[(i * 2 + 1) % COVER_COLORS.length],
              nickname: swap.receiver?.nickname ?? "독자",
              message: swap.receiver_message,
            };

            return (
              <div key={swap.id}>
                {/* Reader labels */}
                <div className="flex gap-6 mb-3">
                  <p className="flex-1 text-[10px] tracking-[0.2em] uppercase text-neutral/40 truncate">
                    {left.nickname}
                  </p>
                  <div className="flex-shrink-0 w-5" />
                  <p className="flex-1 text-[10px] tracking-[0.2em] uppercase text-neutral/40 truncate">
                    {right.nickname}
                  </p>
                </div>

                <BookCovers left={left} right={right} />

                {/* Book info */}
                <div className="flex gap-6 mt-4">
                  <div className="flex-1">
                    <h2 className="font-headline text-xl text-neutral leading-snug">{left.title}</h2>
                    {swap.offered_book?.author && (
                      <p className="text-neutral/45 text-sm mt-1 font-body">{swap.offered_book.author}</p>
                    )}
                  </div>
                  <div className="flex-shrink-0 w-5" />
                  <div className="flex-1">
                    <h2 className="font-headline text-xl text-neutral leading-snug">{right.title}</h2>
                    {swap.wanted_book?.author && (
                      <p className="text-neutral/45 text-sm mt-1 font-body">{swap.wanted_book.author}</p>
                    )}
                  </div>
                </div>

                {/* CTA */}
                <div className="flex justify-center mt-8">
                  <Link
                    href={`/swap/${swap.id}`}
                    className="bg-tertiary text-secondary text-[11px] tracking-[0.3em] uppercase px-14 py-4 hover:bg-primary transition-colors"
                  >
                    교환독서 상세 바로가기
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quote */}
      <section className="w-full max-w-xl px-8 py-28 text-center">
        <blockquote className="font-headline italic text-[1.35rem] text-neutral leading-relaxed">
          &ldquo;A book is a conversation that spans across time and space. When
          we exchange stories, we exchange parts of our world.&rdquo;
        </blockquote>
        <p className="text-[10px] tracking-[0.25em] uppercase text-neutral/40 mt-6 font-body">
          — The Bibliophile&apos;s Manifesto
        </p>
      </section>
    </div>
  );
}
