export default function Footer() {
  return (
    <footer style={{ backgroundColor: "#f5f5f5", borderTop: "1px solid #e5e5e5" }}>
      <div className="max-w-3xl mx-auto px-5 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <p
              style={{
                fontFamily: "var(--font-fredoka)",
                fontWeight: 700,
                fontSize: "1.25rem",
                color: "#030505",
              }}
            >
              Swap Books
            </p>
            <span
              style={{
                fontSize: "0.625rem",
                fontWeight: 700,
                backgroundColor: "#f7a8c7",
                border: "1px solid #030505",
                borderRadius: "9999px",
                padding: "1px 7px",
                letterSpacing: "0.04em",
                color: "#030505",
              }}
            >
              BETA
            </span>
          </div>
          <p style={{ color: "#888888", fontSize: "0.75rem", marginTop: "2px" }}>
            우리만의 교환독서 · © 2026 SwapBooks
          </p>
          <div className="flex items-center gap-3 mt-2">
            <a
              href="#"
              style={{ color: "#aaaaaa", fontSize: "0.6875rem", textDecoration: "none" }}
              className="hover:text-[#555555] transition-colors"
            >
              개인정보처리방침
            </a>
            <span style={{ color: "#dddddd", fontSize: "0.6875rem" }}>·</span>
            <a
              href="#"
              style={{ color: "#aaaaaa", fontSize: "0.6875rem", textDecoration: "none" }}
              className="hover:text-[#555555] transition-colors"
            >
              이용약관
            </a>
          </div>
        </div>

        {/* Social / contact */}
        <div className="flex items-center gap-2">
          {/* Instagram */}
          <a
            href="https://www.instagram.com/s.wap_books?igsh=bTI0MjJxMGd3dWJp&utm_source=qr"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="SwapBooks Instagram"
            style={iconBtnStyle}
            className="hover:bg-[#f4d23d] transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
            </svg>
          </a>

          {/* KakaoTalk open chat (연결 예정) */}
          <a
            href="#"
            aria-label="SwapBooks KakaoTalk 오픈채팅"
            style={iconBtnStyle}
            className="hover:bg-[#f4d23d] transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 3C6.477 3 2 6.71 2 11.25c0 2.83 1.64 5.33 4.12 6.88l-.97 3.57a.375.375 0 0 0 .55.42l4.17-2.76c.68.09 1.38.14 2.13.14 5.523 0 10-3.71 10-8.25S17.523 3 12 3z" />
            </svg>
          </a>

          {/* Email (연결 예정) */}
          <a
            href="#"
            aria-label="이메일 문의"
            style={iconBtnStyle}
            className="hover:bg-[#f4d23d] transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <polyline points="2,4 12,13 22,4" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}

const iconBtnStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 34,
  height: 34,
  border: "1.5px solid #030505",
  borderRadius: "9999px",
  backgroundColor: "#ffffff",
  color: "#030505",
  textDecoration: "none",
  flexShrink: 0,
};
