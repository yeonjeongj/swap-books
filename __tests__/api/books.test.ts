import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/books/route'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

beforeEach(() => {
  vi.resetAllMocks()
  process.env.KAKAO_CLIENT_ID = 'test-key'
})

describe('GET /api/books', () => {
  it('returns 400 when q param is missing', async () => {
    const req = new NextRequest('http://localhost/api/books')
    const res = await GET(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('q is required')
  })

  it('returns 500 when KAKAO_CLIENT_ID is not set', async () => {
    delete process.env.KAKAO_CLIENT_ID
    const req = new NextRequest('http://localhost/api/books?q=test')
    const res = await GET(req)
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('Kakao API key is not configured')
  })

  it('returns 502 when Kakao API responds with non-ok status', async () => {
    mockFetch.mockResolvedValue({ ok: false })
    const req = new NextRequest('http://localhost/api/books?q=test')
    const res = await GET(req)
    expect(res.status).toBe(502)
    const body = await res.json()
    expect(body.error).toBe('Book search failed')
  })

  it('returns 500 when fetch throws a network error', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))
    const req = new NextRequest('http://localhost/api/books?q=test')
    const res = await GET(req)
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('Internal server error')
  })

  it('returns 200 with Kakao API data on success', async () => {
    const kakaoData = { documents: [{ title: '해리포터', authors: ['J.K. 롤링'] }] }
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(kakaoData) })
    const req = new NextRequest('http://localhost/api/books?q=해리포터')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual(kakaoData)
  })
})
