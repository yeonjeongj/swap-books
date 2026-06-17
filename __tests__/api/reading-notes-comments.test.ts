import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/reading-notes/[id]/comments/route'

const mockAuth = vi.hoisted(() => vi.fn())
vi.mock('@/lib/auth', () => ({ auth: mockAuth }))

const mockFrom = vi.hoisted(() => vi.fn())
vi.mock('@/lib/supabase', () => ({ supabase: { from: mockFrom } }))

const SESSION = { user: { id: 'user-1' } }
const CTX = { params: Promise.resolve({ id: 'note-1' }) }
const SWAP = { requester_id: 'user-1', receiver_id: 'user-2' }

function chain(result: object) {
  const c: Record<string, unknown> = {}
  for (const m of ['select', 'eq', 'insert']) c[m] = vi.fn(() => c)
  c.single = vi.fn(() => Promise.resolve(result))
  c.then = (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve)
  return c
}

beforeEach(() => vi.resetAllMocks())

describe('POST /api/reading-notes/[id]/comments', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/reading-notes/note-1/comments', {
      method: 'POST',
      body: JSON.stringify({ text: '댓글' }),
    })
    const res = await POST(req, CTX as never)
    expect(res.status).toBe(401)
  })

  it('returns 400 when text is empty', async () => {
    mockAuth.mockResolvedValue(SESSION)
    const req = new NextRequest('http://localhost/api/reading-notes/note-1/comments', {
      method: 'POST',
      body: JSON.stringify({ text: '  ' }),
    })
    const res = await POST(req, CTX as never)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('text is required')
  })

  it('returns 404 when note does not exist', async () => {
    mockAuth.mockResolvedValue(SESSION)
    mockFrom.mockReturnValue(chain({ data: null, error: null }))
    const req = new NextRequest('http://localhost/api/reading-notes/note-1/comments', {
      method: 'POST',
      body: JSON.stringify({ text: '댓글' }),
    })
    const res = await POST(req, CTX as never)
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('Note not found')
  })

  it('returns 403 when user is not a swap participant', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'outsider' } })
    mockFrom
      .mockReturnValueOnce(chain({ data: { swap_request_id: 's1' }, error: null }))
      .mockReturnValueOnce(chain({ data: { requester_id: 'user-1', receiver_id: 'user-2' }, error: null }))
    const req = new NextRequest('http://localhost/api/reading-notes/note-1/comments', {
      method: 'POST',
      body: JSON.stringify({ text: '댓글' }),
    })
    const res = await POST(req, CTX as never)
    expect(res.status).toBe(403)
  })

  it('returns 404 when parent comment does not exist', async () => {
    mockAuth.mockResolvedValue(SESSION)
    mockFrom
      .mockReturnValueOnce(chain({ data: { swap_request_id: 's1' }, error: null }))
      .mockReturnValueOnce(chain({ data: SWAP, error: null }))
      .mockReturnValueOnce(chain({ data: null, error: null }))
    const req = new NextRequest('http://localhost/api/reading-notes/note-1/comments', {
      method: 'POST',
      body: JSON.stringify({ text: '댓글', parentId: 'nonexistent' }),
    })
    const res = await POST(req, CTX as never)
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('Parent comment not found')
  })

  it('creates a top-level comment and returns 201', async () => {
    mockAuth.mockResolvedValue(SESSION)
    const comment = { id: 'c1', text: '댓글', parent_id: null, author: { nickname: '테스터' } }
    mockFrom
      .mockReturnValueOnce(chain({ data: { swap_request_id: 's1' }, error: null }))
      .mockReturnValueOnce(chain({ data: SWAP, error: null }))
      .mockReturnValueOnce(chain({ data: comment, error: null }))
    const req = new NextRequest('http://localhost/api/reading-notes/note-1/comments', {
      method: 'POST',
      body: JSON.stringify({ text: '댓글' }),
    })
    const res = await POST(req, CTX as never)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.text).toBe('댓글')
    expect(body.parent_id).toBeNull()
  })

  it('flattens reply-to-reply by reparenting to the root comment', async () => {
    mockAuth.mockResolvedValue(SESSION)
    // parent comment itself has a parent_id (it's a reply)
    const parentComment = { id: 'c1', parent_id: 'root-c0' }
    const newComment = { id: 'c2', text: '대댓글', parent_id: 'root-c0' }
    mockFrom
      .mockReturnValueOnce(chain({ data: { swap_request_id: 's1' }, error: null }))
      .mockReturnValueOnce(chain({ data: SWAP, error: null }))
      .mockReturnValueOnce(chain({ data: parentComment, error: null }))
      .mockReturnValueOnce(chain({ data: newComment, error: null }))
    const req = new NextRequest('http://localhost/api/reading-notes/note-1/comments', {
      method: 'POST',
      body: JSON.stringify({ text: '대댓글', parentId: 'c1' }),
    })
    const res = await POST(req, CTX as never)
    expect(res.status).toBe(201)
    const body = await res.json()
    // Should be reparented to c1's parent (root-c0), not c1 itself
    expect(body.parent_id).toBe('root-c0')
  })
})
