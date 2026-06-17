import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/swaps/route'

const mockAuth = vi.hoisted(() => vi.fn())
vi.mock('@/lib/auth', () => ({ auth: mockAuth }))

const mockFrom = vi.hoisted(() => vi.fn())
vi.mock('@/lib/supabase', () => ({ supabase: { from: mockFrom } }))

const SESSION = { user: { id: 'user-1' } }

function chain(result: object) {
  const c: Record<string, unknown> = {}
  for (const m of ['select', 'eq', 'or', 'in', 'order', 'insert']) c[m] = vi.fn(() => c)
  c.single = vi.fn(() => Promise.resolve(result))
  c.then = (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve)
  return c
}

beforeEach(() => vi.resetAllMocks())

describe('GET /api/swaps', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await GET(new NextRequest('http://localhost/api/swaps'))
    expect(res.status).toBe(401)
  })

  it('returns user swaps', async () => {
    mockAuth.mockResolvedValue(SESSION)
    const swaps = [{ id: 's1', status: 'pending' }]
    mockFrom.mockReturnValue(chain({ data: swaps, error: null }))
    const res = await GET(new NextRequest('http://localhost/api/swaps'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(swaps)
  })

  it('filters swaps by status=active', async () => {
    mockAuth.mockResolvedValue(SESSION)
    const activeChain = chain({ data: [], error: null })
    mockFrom.mockReturnValue(activeChain)
    await GET(new NextRequest('http://localhost/api/swaps?status=active'))
    expect(activeChain.in).toHaveBeenCalledWith('status', ['pending', 'accepted'])
  })

  it('filters swaps by status=completed', async () => {
    mockAuth.mockResolvedValue(SESSION)
    const completedChain = chain({ data: [], error: null })
    mockFrom.mockReturnValue(completedChain)
    await GET(new NextRequest('http://localhost/api/swaps?status=completed'))
    expect(completedChain.in).toHaveBeenCalledWith('status', ['completed', 'rejected', 'expired'])
  })
})

describe('POST /api/swaps', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/swaps', {
      method: 'POST',
      body: JSON.stringify({ offeredBookId: 'b1' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 when offeredBookId is missing', async () => {
    mockAuth.mockResolvedValue(SESSION)
    const req = new NextRequest('http://localhost/api/swaps', {
      method: 'POST',
      body: JSON.stringify({ receiverId: 'user-2', isPublic: false }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('offeredBookId is required')
  })

  it('returns 400 when private swap is missing receiverId', async () => {
    mockAuth.mockResolvedValue(SESSION)
    const req = new NextRequest('http://localhost/api/swaps', {
      method: 'POST',
      body: JSON.stringify({ offeredBookId: 'b1', isPublic: false }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('receiverId is required for private swap requests')
  })

  it('returns 404 when offered book does not exist', async () => {
    mockAuth.mockResolvedValue(SESSION)
    mockFrom.mockReturnValue(chain({ data: null, error: { message: 'not found' } }))
    const req = new NextRequest('http://localhost/api/swaps', {
      method: 'POST',
      body: JSON.stringify({ offeredBookId: 'b1', isPublic: true }),
    })
    const res = await POST(req)
    expect(res.status).toBe(404)
  })

  it('returns 403 when user does not own the offered book', async () => {
    mockAuth.mockResolvedValue(SESSION)
    mockFrom.mockReturnValue(chain({ data: { user_id: 'other-user' }, error: null }))
    const req = new NextRequest('http://localhost/api/swaps', {
      method: 'POST',
      body: JSON.stringify({ offeredBookId: 'b1', isPublic: true }),
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it('returns 201 on successful public swap creation', async () => {
    mockAuth.mockResolvedValue(SESSION)
    const newSwap = { id: 's1', requester_id: 'user-1', status: 'pending', is_public: true }
    // First call: user_books ownership check; second call: insert swap
    mockFrom
      .mockReturnValueOnce(chain({ data: { user_id: 'user-1' }, error: null }))
      .mockReturnValueOnce(chain({ data: newSwap, error: null }))
    const req = new NextRequest('http://localhost/api/swaps', {
      method: 'POST',
      body: JSON.stringify({ offeredBookId: 'b1', isPublic: true }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual(newSwap)
  })
})
