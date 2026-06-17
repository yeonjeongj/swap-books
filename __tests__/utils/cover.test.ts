import { describe, it, expect } from 'vitest'
import { highResCover } from '@/lib/utils/cover'

describe('highResCover', () => {
  it('returns null for null input', () => {
    expect(highResCover(null)).toBeNull()
  })

  it('extracts fname from a search1.kakaocdn.net thumb URL', () => {
    const fname = 'https://t1.kakaocdn.net/book_covers/full-res.jpg'
    const url = `https://search1.kakaocdn.net/thumb/R120x174.q85/?fname=${encodeURIComponent(fname)}`
    expect(highResCover(url)).toBe(fname)
  })

  it('extracts fname from a k.kakaocdn.net thumb URL', () => {
    const fname = 'https://t1.kakaocdn.net/book_covers/another.jpg'
    const url = `https://k.kakaocdn.net/thumb/R120x174/?fname=${encodeURIComponent(fname)}`
    expect(highResCover(url)).toBe(fname)
  })

  it('returns the URL unchanged for non-Kakao CDN URLs', () => {
    const url = 'https://example.com/image.jpg'
    expect(highResCover(url)).toBe(url)
  })

  it('returns the URL unchanged for a Kakao CDN URL without /thumb/ in the path', () => {
    const url = 'https://search1.kakaocdn.net/images/cover.jpg'
    expect(highResCover(url)).toBe(url)
  })

  it('returns the URL unchanged when fname param is missing', () => {
    const url = 'https://search1.kakaocdn.net/thumb/R120x174.q85/'
    expect(highResCover(url)).toBe(url)
  })

  it('returns the URL unchanged for an invalid URL string', () => {
    expect(highResCover('not-a-url')).toBe('not-a-url')
  })
})
