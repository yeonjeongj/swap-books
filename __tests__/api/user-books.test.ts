import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/user-books/route'

const mockAuth = vi.hoisted(() => vi.fn())
vi.mock('@/lib/auth', () => ({ auth: mockAuth }))

const mockFrom = vi.hoisted(() => vi.fn())
vi.mock('@/lib/supabase', () => ({ supabase: { from: mockFrom } }))

const SESSION = { user: { id: 'user-1' } }

function chain(result: object) {
  const c: Record<string, unknown> = {}
  for (const m of ['select', 'eq', 'order', 'insert']) c[m] = vi.fn(() => c)
  c.single = vi.fn(() => Promise.resolve(result))
  c.then = (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve)
  return c
}

beforeEach(() => vi.resetAllMocks())

describe('GET /api/user-books', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns the user\'s books', async () => {
    mockAuth.mockResolvedValue(SESSION)
    const books = [{ id: 'b1', title: '책1' }]
    mockFrom.mockReturnValue(chain({ data: books, error: null }))
    const res = await GET()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(books)
  })
})

describe('POST /api/user-books', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/user-books', {
      method: 'POST',
      body: JSON.stringify({ title: '책', author: '저자' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid JSON', async () => {
    mockAuth.mockResolvedValue(SESSION)
    const req = new NextRequest('http://localhost/api/user-books', {
      method: 'POST',
      body: 'not-json',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when title is missing', async () => {
    mockAuth.mockResolvedValue(SESSION)
    const req = new NextRequest('http://localhost/api/user-books', {
      method: 'POST',
      body: JSON.stringify({ author: '저자' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/title and author/)
  })

  it('returns 400 when author is empty string', async () => {
    mockAuth.mockResolvedValue(SESSION)
    const req = new NextRequest('http://localhost/api/user-books', {
      method: 'POST',
      body: JSON.stringify({ title: '책', author: '  ' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 201 on success with required fields', async () => {
    mockAuth.mockResolvedValue(SESSION)
    const inserted = { id: 'b1', title: '책', author: '저자', user_id: 'user-1' }
    mockFrom.mockReturnValue(chain({ data: inserted, error: null }))
    const req = new NextRequest('http://localhost/api/user-books', {
      method: 'POST',
      body: JSON.stringify({ title: '책', author: '저자' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual(inserted)
  })

  it('returns 201 on success with all optional fields', async () => {
    mockAuth.mockResolvedValue(SESSION)
    const inserted = { id: 'b2', title: '책', author: '저자', isbn: '12345', rating: 4 }
    mockFrom.mockReturnValue(chain({ data: inserted, error: null }))
    const req = new NextRequest('http://localhost/api/user-books', {
      method: 'POST',
      body: JSON.stringify({ title: '책', author: '저자', isbn: '12345', publisher: '출판사', rating: 4 }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
  })
})
