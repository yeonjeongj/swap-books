import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/swaps/incoming/route'

const mockAuth = vi.hoisted(() => vi.fn())
vi.mock('@/lib/auth', () => ({ auth: mockAuth }))

const mockFrom = vi.hoisted(() => vi.fn())
vi.mock('@/lib/supabase', () => ({ supabase: { from: mockFrom } }))

const SESSION = { user: { id: 'user-1' } }

function chain(result: object) {
  const c: Record<string, unknown> = {}
  for (const m of ['select', 'eq', 'neq', 'in', 'gte', 'or', 'order']) c[m] = vi.fn(() => c)
  c.then = (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve)
  return c
}

function emptyRun() {
  // incoming, rejected, acceptedSwaps, completed — no accepted swaps means no notes/comments calls
  mockFrom
    .mockReturnValueOnce(chain({ data: [], error: null }))
    .mockReturnValueOnce(chain({ data: [], error: null }))
    .mockReturnValueOnce(chain({ data: [], error: null }))
    .mockReturnValueOnce(chain({ data: [], error: null }))
}

beforeEach(() => vi.resetAllMocks())

describe('GET /api/swaps/incoming', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns empty lists for all notification types when there is nothing to show', async () => {
    mockAuth.mockResolvedValue(SESSION)
    emptyRun()
    const res = await GET()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ incoming: [], rejected: [], activity: [], completed: [] })
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
    mockFrom
      .mockReturnValueOnce(chain({ data: incoming, error: null }))
      .mockReturnValueOnce(chain({ data: [], error: null }))
      .mockReturnValueOnce(chain({ data: [], error: null }))
      .mockReturnValueOnce(chain({ data: [], error: null }))
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.incoming).toHaveLength(1)
    expect(body.incoming[0].offered_book).toBeDefined()
    expect(body.incoming[0].requester).toBeDefined()
  })

  it('returns only pending requests (filters by status=pending)', async () => {
    mockAuth.mockResolvedValue(SESSION)
    const incomingChain = chain({ data: [], error: null })
    mockFrom
      .mockReturnValueOnce(incomingChain)
      .mockReturnValueOnce(chain({ data: [], error: null }))
      .mockReturnValueOnce(chain({ data: [], error: null }))
      .mockReturnValueOnce(chain({ data: [], error: null }))
    await GET()
    expect(incomingChain.eq).toHaveBeenCalledWith('status', 'pending')
  })

  it('returns recently rejected outgoing requests with nested data', async () => {
    mockAuth.mockResolvedValue(SESSION)
    const rejected = [
      {
        id: 's2',
        status: 'rejected',
        updated_at: new Date().toISOString(),
        offered_book: { id: 'b1', title: '책', author: '저자', cover_image: null },
        receiver: { id: 'user-3', nickname: '수신자', avatar_url: null },
      },
    ]
    mockFrom
      .mockReturnValueOnce(chain({ data: [], error: null }))
      .mockReturnValueOnce(chain({ data: rejected, error: null }))
      .mockReturnValueOnce(chain({ data: [], error: null }))
      .mockReturnValueOnce(chain({ data: [], error: null }))
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.rejected).toHaveLength(1)
    expect(body.rejected[0].receiver).toBeDefined()
  })

  it('filters rejected requests by status=rejected and a recency cutoff', async () => {
    mockAuth.mockResolvedValue(SESSION)
    const rejectedChain = chain({ data: [], error: null })
    mockFrom
      .mockReturnValueOnce(chain({ data: [], error: null }))
      .mockReturnValueOnce(rejectedChain)
      .mockReturnValueOnce(chain({ data: [], error: null }))
      .mockReturnValueOnce(chain({ data: [], error: null }))
    await GET()
    expect(rejectedChain.eq).toHaveBeenCalledWith('status', 'rejected')
    expect(rejectedChain.gte).toHaveBeenCalledWith('updated_at', expect.any(String))
  })

  it('groups note/comment activity from the partner within a 30-minute burst', async () => {
    mockAuth.mockResolvedValue(SESSION)
    const acceptedSwap = {
      id: 'swap-1',
      requester_id: 'user-1',
      receiver_id: 'user-2',
      offered_book: { id: 'b1', title: '헤르만 헤세의 문장들', author: '헤세', cover_image: null },
      requester: { id: 'user-1', nickname: '나', avatar_url: null },
      receiver: { id: 'user-2', nickname: '상대방', avatar_url: null },
    }
    const now = Date.now()
    const notes = [
      { id: 'n1', author_id: 'user-2', created_at: new Date(now).toISOString(), swap_request_id: 'swap-1' },
      { id: 'n2', author_id: 'user-2', created_at: new Date(now - 10 * 60 * 1000).toISOString(), swap_request_id: 'swap-1' },
    ]
    const comments = [
      {
        id: 'c1',
        author_id: 'user-2',
        created_at: new Date(now - 20 * 60 * 1000).toISOString(),
        note: { swap_request_id: 'swap-1' },
      },
      // Outside the 30-minute burst window from the latest event — should not be counted
      {
        id: 'c2',
        author_id: 'user-2',
        created_at: new Date(now - 90 * 60 * 1000).toISOString(),
        note: { swap_request_id: 'swap-1' },
      },
    ]
    const commentsChain = chain({ data: comments, error: null })
    mockFrom
      .mockReturnValueOnce(chain({ data: [], error: null })) // incoming
      .mockReturnValueOnce(chain({ data: [], error: null })) // rejected
      .mockReturnValueOnce(chain({ data: [acceptedSwap], error: null })) // accepted swaps
      .mockReturnValueOnce(chain({ data: [], error: null })) // completed
      .mockReturnValueOnce(chain({ data: notes, error: null })) // reading_notes
      .mockReturnValueOnce(commentsChain) // reading_note_comments
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.activity).toHaveLength(1)
    expect(body.activity[0].count).toBe(3) // n1, n2, c1 within 30 min of each other; c2 excluded
    expect(body.activity[0].offered_book.title).toBe('헤르만 헤세의 문장들')
    expect(body.activity[0].partner.nickname).toBe('상대방')
    // The comments query must filter by swap ids at the DB level (not just in application code)
    expect(commentsChain.in).toHaveBeenCalledWith('note.swap_request_id', ['swap-1'])
  })

  it('only surfaces completed notifications when the other participant completed it', async () => {
    mockAuth.mockResolvedValue(SESSION)
    const completedByMe = {
      id: 'swap-2',
      requester_id: 'user-1',
      receiver_id: 'user-2',
      updated_at: new Date().toISOString(),
      completed_by: 'user-1',
      offered_book: { id: 'b2', title: '책2', author: '저자2', cover_image: null },
      requester: { id: 'user-1', nickname: '나', avatar_url: null },
      receiver: { id: 'user-2', nickname: '상대방', avatar_url: null },
    }
    const completedByPartner = {
      id: 'swap-3',
      requester_id: 'user-1',
      receiver_id: 'user-2',
      updated_at: new Date().toISOString(),
      completed_by: 'user-2',
      offered_book: { id: 'b3', title: '책3', author: '저자3', cover_image: null },
      requester: { id: 'user-1', nickname: '나', avatar_url: null },
      receiver: { id: 'user-2', nickname: '상대방', avatar_url: null },
    }
    mockFrom
      .mockReturnValueOnce(chain({ data: [], error: null })) // incoming
      .mockReturnValueOnce(chain({ data: [], error: null })) // rejected
      .mockReturnValueOnce(chain({ data: [], error: null })) // accepted swaps
      .mockReturnValueOnce(chain({ data: [completedByMe, completedByPartner], error: null })) // completed
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.completed).toHaveLength(1)
    expect(body.completed[0].swap_id).toBe('swap-3')
    expect(body.completed[0].partner.nickname).toBe('상대방')
  })
})
