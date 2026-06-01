import BookCovers from "./BookCovers";

const EXCHANGE = {
  left: {
    reader: "Reader Julian",
    title: "The Secret History",
    author: "Donna Tartt",
    tags: ["Classic", "Hardcover"],
    coverColor: "#3a4430",
    quote:
      "Beauty is terror. Whatever we call beautiful, we quiver before it.",
    reason:
      "고전의 아름다움과 공포가 공존하는 이 책은 읽는 내내 긴장을 놓을 수 없었습니다. 함께 나누고 싶어졌어요.",
    userNickname: "Reader Julian",
  },
  right: {
    reader: "Reader Amara",
    title: "On Earth We're Briefly Gorgeous",
    author: "Ocean Vuong",
    tags: ["Contemporary", "Paperback"],
    coverColor: "#6b7a52",
    quote: "Let me begin again.",
    reason:
      "단 세 단어로 책 전체의 감정을 담아낸 문장입니다. 이 책은 언어 자체가 시입니다.",
    userNickname: "Reader Amara",
  },
};

function Tag({ label }: { label: string }) {
  return (
    <span className="text-[10px] tracking-[0.18em] uppercase border border-neutral/25 px-2 py-0.5 text-neutral/50">
      {label}
    </span>
  );
}



export default function CurrentSwap() {
  const { left, right } = EXCHANGE;

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

      {/* Book exchange */}
      <section className="w-full max-w-2xl px-8 mt-12">
        {/* Reader labels */}
        <div className="flex gap-6 mb-3">
          <p className="flex-1 text-[10px] tracking-[0.2em] uppercase text-neutral/40">
            {left.reader}
          </p>
          <div className="flex-shrink-0 w-5" />
          <p className="flex-1 text-[10px] tracking-[0.2em] uppercase text-neutral/40">
            {right.reader}
          </p>
        </div>

        <BookCovers left={left} right={right} />

        {/* Book info */}
        <div className="flex gap-6 mt-4">
          <div className="flex-1">
            <h2 className="font-headline text-xl text-neutral leading-snug">
              {left.title}
            </h2>
            <p className="text-neutral/45 text-sm mt-1 font-body">{left.author}</p>
            <div className="flex gap-2 mt-3 flex-wrap">
              {left.tags.map((tag) => (
                <Tag key={tag} label={tag} />
              ))}
            </div>
          </div>
          <div className="flex-shrink-0 w-5" />
          <div className="flex-1">
            <h2 className="font-headline text-xl text-neutral leading-snug">
              {right.title}
            </h2>
            <p className="text-neutral/45 text-sm mt-1 font-body">{right.author}</p>
            <div className="flex gap-2 mt-3 flex-wrap">
              {right.tags.map((tag) => (
                <Tag key={tag} label={tag} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <button className="mt-16 bg-tertiary text-secondary text-[11px] tracking-[0.3em] uppercase px-14 py-4 hover:bg-primary transition-colors">
        Join Exchange
      </button>

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
