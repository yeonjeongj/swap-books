"use client";

import Popup from "./ui/Popup";

function SearchIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

type Props = {
  onClose: () => void;
};

export default function RegisterBookPopup({ onClose }: Props) {
  return (
    <Popup onClose={onClose}>
      <div className="px-7 pt-7 pb-8">
        <p className="text-[10px] tracking-[0.2em] uppercase text-primary font-body mb-1">
          Book Exchange
        </p>
        <h2 className="font-headline text-xl text-neutral mb-6">교환하기</h2>

        <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label htmlFor="book-search" className="text-[10px] tracking-[0.15em] uppercase text-neutral/45 font-body block mb-1.5">
              책 검색
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral/35 pointer-events-none">
                <SearchIcon />
              </div>
              <input
                id="book-search"
                type="text"
                placeholder="제목 또는 저자를 검색하세요"
                className="w-full border border-neutral/15 bg-white/60 pl-8 pr-3 py-2 text-sm font-body text-neutral placeholder:text-neutral/30 focus:outline-none focus:border-neutral/40 transition-colors"
              />
            </div>
          </div>

          <div>
            <label htmlFor="favorite-quote" className="text-[10px] tracking-[0.15em] uppercase text-neutral/45 font-body block mb-1.5">
              좋아하는 문구
              <span className="ml-1.5 normal-case tracking-normal text-[9px] text-neutral/30">
                Optional
              </span>
            </label>
            <textarea
              id="favorite-quote"
              rows={2}
              placeholder="책에서 마음에 드는 문구를 적어주세요"
              className="w-full border border-neutral/15 bg-white/60 px-3 py-2 text-sm font-body text-neutral placeholder:text-neutral/30 focus:outline-none focus:border-neutral/40 transition-colors resize-none"
            />
          </div>

          <div>
            <label htmlFor="recommendation-reason" className="text-[10px] tracking-[0.15em] uppercase text-neutral/45 font-body block mb-1.5">
              추천하는 이유
              <span className="ml-1.5 normal-case tracking-normal text-[9px] text-neutral/30">
                Optional
              </span>
            </label>
            <textarea
              id="recommendation-reason"
              rows={2}
              placeholder="이 책을 추천하는 이유를 적어주세요"
              className="w-full border border-neutral/15 bg-white/60 px-3 py-2 text-sm font-body text-neutral placeholder:text-neutral/30 focus:outline-none focus:border-neutral/40 transition-colors resize-none"
            />
          </div>

          <div>
            <label htmlFor="partner-nickname" className="text-[10px] tracking-[0.15em] uppercase text-neutral/45 font-body block mb-1.5">
              교환할 상대의 닉네임 검색
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral/35 pointer-events-none">
                <SearchIcon />
              </div>
              <input
                id="partner-nickname"
                type="text"
                placeholder="닉네임을 입력하세요"
                className="w-full border border-neutral/15 bg-white/60 pl-8 pr-3 py-2 text-sm font-body text-neutral placeholder:text-neutral/30 focus:outline-none focus:border-neutral/40 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            className="mt-1 w-full bg-primary text-secondary text-[10px] tracking-[0.2em] uppercase py-3 font-body hover:bg-tertiary transition-colors"
          >
            교환하기
          </button>
        </form>
      </div>
    </Popup>
  );
}
