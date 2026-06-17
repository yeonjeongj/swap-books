import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/reading-notes/route'

const mockAuth = vi.hoisted(() => vi.fn())
vi.mock('@/lib/auth', () => ({ auth: mockAuth }))

const mockFrom = vi.hoisted(() => vi.fn())
vi.mock('@/lib/supabase', () => ({ supabase: { from: mockFrom } }))

const SESSION = { user: { id: 'user-1' } }
const SWAP = {
  requester_id: 'user-1',
  receiver_id: 'user-2',
  status: 'accepted',
  offered_book_id: 'book-1',
  wanted_book_id: 'book-2',
}

function chain(result: object) {
  const c: Record<string, unknown> = {}
  for (const m of ['select', 'eq', 'order', 'insert']) c[m] = vi.fn(() => c)
  c.single = vi.fn(() => Promise.resolve(result))
  c.then = (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve)
  return c
}

beforeEach(() => vi.resetAllMocks())

describe('GET /api/reading-notes', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await GET(new NextRequest('http://localhost/api/reading-notes?swapId=s1'))
    expect(res.status).toBe(401)
  })

  it('returns 400 when swapId is missing', async () => {
    mockAuth.mockResolvedValue(SESSION)
    const res = await GET(new NextRequest('http://localhost/api/reading-notes'))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('swapId is required')
  })

  it('returns 404 when swap is not found', async () => {
    mockAuth.mockResolvedValue(SESSION)
    mockFrom.mockReturnValue(chain({ data: null, error: { message: 'not found' } }))
    const res = await GET(new NextRequest('http://localhost/api/reading-notes?swapId=s1'))
    expect(res.status).toBe(404)
  })

  it('returns 403 when user is not a participant', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'outsider' } })
    mockFrom.mockReturnValue(chain({ data: { requester_id: 'user-1', receiver_id: 'user-2' }, error: null }))
    const res = await GET(new NextRequest('http://localhost/api/reading-notes?swapId=s1'))
    expect(res.status).toBe(403)
  })

  it('returns reading notes for a participant', async () => {
    mockAuth.mockResolvedValue(SESSION)
    const notes = [{ id: 'n1', page: 10, quote: '인용구' }]
    mockFrom
      .mockReturnValueOnce(chain({ data: { requester_id: 'user-1', receiver_id: 'user-2' }, error: null }))
      .mockReturnValueOnce(chain({ data: notes, error: null }))
    const res = await GET(new NextRequest('http://localhost/api/reading-notes?swapId=s1'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(notes)
  })
})

describe('POST /api/reading-notes', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/reading-notes', {
      method: 'POST',
      body: JSON.stringify({ swapId: 's1', bookId: 'book-1', page: 10 }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 when required fields are missing', async () => {
    mockAuth.mockResolvedValue(SESSION)
    const req = new NextRequest('http://localhost/api/reading-notes', {
      method: 'POST',
      body: JSON.stringify({ swapId: 's1', bookId: 'book-1' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/swapId, bookId/)
  })

  it('returns 400 when page is negative', async () => {
    mockAuth.mockResolvedValue(SESSION)
    const req = new NextRequest('http://localhost/api/reading-notes', {
      method: 'POST',
      body: JSON.stringify({ swapId: 's1', bookId: 'book-1', page: -1 }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when page is a float', async () => {
    mockAuth.mockResolvedValue(SESSION)
    const req = new NextRequest('http://localhost/api/reading-notes', {
      method: 'POST',
      body: JSON.stringify({ swapId: 's1', bookId: 'book-1', page: 1.5 }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 404 when swap is not found', async () => {
    mockAuth.mockResolvedValue(SESSION)
    mockFrom.mockReturnValue(chain({ data: null, error: { message: 'not found' } }))
    const req = new NextRequest('http://localhost/api/reading-notes', {
      method: 'POST',
      body: JSON.stringify({ swapId: 's1', bookId: 'book-1', page: 10 }),
    })
    const res = await POST(req)
    expect(res.status).toBe(404)
  })

  it('returns 403 when user is not a participant', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'outsider' } })
    mockFrom.mockReturnValue(chain({ data: SWAP, error: null }))
    const req = new NextRequest('http://localhost/api/reading-notes', {
      method: 'POST',
      body: JSON.stringify({ swapId: 's1', bookId: 'book-1', page: 10 }),
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it('returns 400 when book is not part of the swap', async () => {
    mockAuth.mockResolvedValue(SESSION)
    mockFrom.mockReturnValue(chain({ data: SWAP, error: null }))
    const req = new NextRequest('http://localhost/api/reading-notes', {
      method: 'POST',
      body: JSON.stringify({ swapId: 's1', bookId: 'unrelated-book', page: 10 }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Book is not part of this swap')
  })

  it('returns 422 when swap is not in accepted status', async () => {
    mockAuth.mockResolvedValue(SESSION)
    mockFrom.mockReturnValue(chain({ data: { ...SWAP, status: 'pending' }, error: null }))
    const req = new NextRequest('http://localhost/api/reading-notes', {
      method: 'POST',
      body: JSON.stringify({ swapId: 's1', bookId: 'book-1', page: 10 }),
    })
    const res = await POST(req)
    expect(res.status).toBe(422)
  })

  it('returns 201 on success', async () => {
    mockAuth.mockResolvedValue(SESSION)
    const note = { id: 'n1', page: 10, quote: null }
    mockFrom
      .mockReturnValueOnce(chain({ data: SWAP, error: null }))
      .mockReturnValueOnce(chain({ data: note, error: null }))
    const req = new NextRequest('http://localhost/api/reading-notes', {
      method: 'POST',
      body: JSON.stringify({ swapId: 's1', bookId: 'book-1', page: 10 }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual(note)
  })
})
