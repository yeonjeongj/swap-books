import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, PATCH, DELETE } from '@/app/api/swaps/[id]/route'

const mockAuth = vi.hoisted(() => vi.fn())
vi.mock('@/lib/auth', () => ({ auth: mockAuth }))

const mockFrom = vi.hoisted(() => vi.fn())
vi.mock('@/lib/supabase', () => ({ supabase: { from: mockFrom } }))

const SESSION = { user: { id: 'user-1' } }
const CTX = { params: Promise.resolve({ id: 'swap-1' }) }

function chain(result: object) {
  const c: Record<string, unknown> = {}
  for (const m of ['select', 'eq', 'or', 'update', 'delete', 'insert']) c[m] = vi.fn(() => c)
  c.single = vi.fn(() => Promise.resolve(result))
  c.then = (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve)
  return c
}

beforeEach(() => vi.resetAllMocks())

describe('GET /api/swaps/[id]', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await GET(new NextRequest('http://localhost/api/swaps/swap-1'), CTX as never)
    expect(res.status).toBe(401)
  })

  it('returns 404 when swap is not found or not accessible', async () => {
    mockAuth.mockResolvedValue(SESSION)
    mockFrom.mockReturnValue(chain({ data: null, error: { message: 'not found' } }))
    const res = await GET(new NextRequest('http://localhost/api/swaps/swap-1'), CTX as never)
    expect(res.status).toBe(404)
  })

  it('returns swap data when user is a participant', async () => {
    mockAuth.mockResolvedValue(SESSION)
    const swap = { id: 'swap-1', requester_id: 'user-1', is_public: false, offered_book: {}, wanted_book: null }
    mockFrom.mockReturnValue(chain({ data: swap, error: null }))
    const res = await GET(new NextRequest('http://localhost/api/swaps/swap-1'), CTX as never)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(swap)
  })
})

describe('PATCH /api/swaps/[id] — field update', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/swaps/swap-1', {
      method: 'PATCH',
      body: JSON.stringify({ requesterMessage: '안녕' }),
    })
    const res = await PATCH(req, CTX as never)
    expect(res.status).toBe(401)
  })

  it('returns 400 when body has nothing to update', async () => {
    mockAuth.mockResolvedValue(SESSION)
    const req = new NextRequest('http://localhost/api/swaps/swap-1', {
      method: 'PATCH',
      body: JSON.stringify({}),
    })
    const res = await PATCH(req, CTX as never)
    expect(res.status).toBe(400)
  })

  it('returns 403 when non-requester tries to edit fields', async () => {
    mockAuth.mockResolvedValue(SESSION)
    const existing = {
      status: 'pending', requester_id: 'other-user', receiver_id: null,
      is_public: true, wanted_book_id: null,
    }
    mockFrom.mockReturnValue(chain({ data: existing, error: null }))
    const req = new NextRequest('http://localhost/api/swaps/swap-1', {
      method: 'PATCH',
      body: JSON.stringify({ requesterMessage: '안녕' }),
    })
    const res = await PATCH(req, CTX as never)
    expect(res.status).toBe(403)
  })

  it('returns 422 when trying to edit a non-pending or private request', async () => {
    mockAuth.mockResolvedValue(SESSION)
    const existing = {
      status: 'accepted', requester_id: 'user-1', receiver_id: 'user-2',
      is_public: true, wanted_book_id: null,
    }
    mockFrom.mockReturnValue(chain({ data: existing, error: null }))
    const req = new NextRequest('http://localhost/api/swaps/swap-1', {
      method: 'PATCH',
      body: JSON.stringify({ requesterMessage: '안녕' }),
    })
    const res = await PATCH(req, CTX as never)
    expect(res.status).toBe(422)
  })

  it('updates requesterMessage successfully', async () => {
    mockAuth.mockResolvedValue(SESSION)
    const existing = {
      status: 'pending', requester_id: 'user-1', receiver_id: null,
      is_public: true, wanted_book_id: null,
    }
    const updated = { ...existing, requester_message: '안녕' }
    mockFrom
      .mockReturnValueOnce(chain({ data: existing, error: null }))
      .mockReturnValueOnce(chain({ data: updated, error: null }))
    const req = new NextRequest('http://localhost/api/swaps/swap-1', {
      method: 'PATCH',
      body: JSON.stringify({ requesterMessage: '안녕' }),
    })
    const res = await PATCH(req, CTX as never)
    expect(res.status).toBe(200)
  })

  it('returns 403 when changing offeredBookId to a book not owned by user', async () => {
    mockAuth.mockResolvedValue(SESSION)
    const existing = {
      status: 'pending', requester_id: 'user-1', receiver_id: null,
      is_public: true, wanted_book_id: null,
    }
    mockFrom
      .mockReturnValueOnce(chain({ data: existing, error: null }))
      .mockReturnValueOnce(chain({ data: { user_id: 'other-user' }, error: null }))
    const req = new NextRequest('http://localhost/api/swaps/swap-1', {
      method: 'PATCH',
      body: JSON.stringify({ offeredBookId: 'other-book' }),
    })
    const res = await PATCH(req, CTX as never)
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('You do not own that book')
  })
})

describe('PATCH /api/swaps/[id] — status transitions', () => {
  it('returns 422 when transition is not allowed (pending → completed)', async () => {
    mockAuth.mockResolvedValue(SESSION)
    const existing = {
      status: 'pending', requester_id: 'other-user', receiver_id: 'user-1',
      is_public: false, wanted_book_id: null,
    }
    mockFrom.mockReturnValue(chain({ data: existing, error: null }))
    const req = new NextRequest('http://localhost/api/swaps/swap-1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'completed' }),
    })
    const res = await PATCH(req, CTX as never)
    expect(res.status).toBe(422)
  })

  it('returns 403 when non-receiver tries to accept a private swap', async () => {
    mockAuth.mockResolvedValue(SESSION)
    const existing = {
      status: 'pending', requester_id: 'user-1', receiver_id: 'other-user',
      is_public: false, wanted_book_id: null,
    }
    mockFrom.mockReturnValue(chain({ data: existing, error: null }))
    const req = new NextRequest('http://localhost/api/swaps/swap-1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'accepted' }),
    })
    const res = await PATCH(req, CTX as never)
    expect(res.status).toBe(403)
  })

  it('returns 200 when receiver rejects a pending swap', async () => {
    mockAuth.mockResolvedValue(SESSION)
    const existing = {
      status: 'pending', requester_id: 'other-user', receiver_id: 'user-1',
      is_public: false, wanted_book_id: 'book-2',
    }
    const updated = { ...existing, status: 'rejected' }
    mockFrom
      .mockReturnValueOnce(chain({ data: existing, error: null }))
      .mockReturnValueOnce(chain({ data: updated, error: null }))
    const req = new NextRequest('http://localhost/api/swaps/swap-1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'rejected' }),
    })
    const res = await PATCH(req, CTX as never)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('rejected')
  })
})

describe('DELETE /api/swaps/[id]', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/swaps/swap-1', { method: 'DELETE' })
    const res = await DELETE(req, CTX as never)
    expect(res.status).toBe(401)
  })

  it('returns 404 when swap does not exist', async () => {
    mockAuth.mockResolvedValue(SESSION)
    mockFrom.mockReturnValue(chain({ data: null, error: { message: 'not found' } }))
    const req = new NextRequest('http://localhost/api/swaps/swap-1', { method: 'DELETE' })
    const res = await DELETE(req, CTX as never)
    expect(res.status).toBe(404)
  })

  it('returns 403 when user is not the requester', async () => {
    mockAuth.mockResolvedValue(SESSION)
    mockFrom.mockReturnValue(chain({
      data: { requester_id: 'other-user', is_public: true, status: 'pending' },
      error: null,
    }))
    const req = new NextRequest('http://localhost/api/swaps/swap-1', { method: 'DELETE' })
    const res = await DELETE(req, CTX as never)
    expect(res.status).toBe(403)
  })

  it('returns 422 when swap is not a pending public request', async () => {
    mockAuth.mockResolvedValue(SESSION)
    mockFrom.mockReturnValue(chain({
      data: { requester_id: 'user-1', is_public: false, status: 'pending' },
      error: null,
    }))
    const req = new NextRequest('http://localhost/api/swaps/swap-1', { method: 'DELETE' })
    const res = await DELETE(req, CTX as never)
    expect(res.status).toBe(422)
  })

  it('returns 204 on successful deletion', async () => {
    mockAuth.mockResolvedValue(SESSION)
    mockFrom
      .mockReturnValueOnce(chain({ data: { requester_id: 'user-1', is_public: true, status: 'pending' }, error: null }))
      .mockReturnValueOnce(chain({ data: null, error: null }))
    const req = new NextRequest('http://localhost/api/swaps/swap-1', { method: 'DELETE' })
    const res = await DELETE(req, CTX as never)
    expect(res.status).toBe(204)
  })
})
