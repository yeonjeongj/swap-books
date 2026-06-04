/**
 * Kakao Books API thumbnails are served through a resizing CDN at R120x174.
 * The original full-res image is in the `fname` query param on t1.kakaocdn.net.
 * This function extracts it; falls back to the input URL unchanged.
 */
export function highResCover(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (
      (parsed.hostname === "search1.kakaocdn.net" || parsed.hostname === "k.kakaocdn.net") &&
      parsed.pathname.includes("/thumb/")
    ) {
      const fname = parsed.searchParams.get("fname");
      if (fname) return decodeURIComponent(fname);
    }
  } catch {
    // not a valid URL
  }
  return url;
}
