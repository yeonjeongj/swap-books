import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/swaps/incoming/route'

const mockAuth = vi.hoisted(() => vi.fn())
vi.mock('@/lib/auth', () => ({ auth: mockAuth }))

const mockFrom = vi.hoisted(() => vi.fn())
vi.mock('@/lib/supabase', () => ({ supabase: { from: mockFrom } }))

const SESSION = { user: { id: 'user-1' } }

function chain(result: object) {
  const c: Record<string, unknown> = {}
  for (const m of ['select', 'eq', 'order']) c[m] = vi.fn(() => c)
  c.then = (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve)
  return c
}

beforeEach(() => vi.resetAllMocks())

describe('GET /api/swaps/incoming', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns empty array when there are no incoming requests', async () => {
    mockAuth.mockResolvedValue(SESSION)
    mockFrom.mockReturnValue(chain({ data: null, error: null }))
    const res = await GET()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
  })

  it('returns pending incoming swap requests with nested data', async () => {
    mockAuth.mockResolvedValue(SESSION)
    const incoming = [
      {
        id: 's1',
        status: 'pending',
        offered_book: { id: 'b1', title: '책', author: '저자', cover_image: null },
        requester: { id: 'user-2', nickname: '요청자', avatar_url: null },
      },
    ]
    mockFrom.mockReturnValue(chain({ data: incoming, error: null }))
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveLength(1)
    expect(body[0].offered_book).toBeDefined()
    expect(body[0].requester).toBeDefined()
  })

  it('returns only pending requests (filters by status=pending)', async () => {
    mockAuth.mockResolvedValue(SESSION)
    const c = chain({ data: [], error: null })
    mockFrom.mockReturnValue(c)
    await GET()
    // Verify the eq('status', 'pending') call was made
    expect(c.eq).toHaveBeenCalledWith('status', 'pending')
  })
})
