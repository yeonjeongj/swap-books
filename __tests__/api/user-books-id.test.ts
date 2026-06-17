import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { DELETE } from '@/app/api/user-books/[id]/route'

const mockAuth = vi.hoisted(() => vi.fn())
vi.mock('@/lib/auth', () => ({ auth: mockAuth }))

const mockFrom = vi.hoisted(() => vi.fn())
vi.mock('@/lib/supabase', () => ({ supabase: { from: mockFrom } }))

const SESSION = { user: { id: 'user-1' } }
const CTX = { params: Promise.resolve({ id: 'book-1' }) }

function chain(result: object) {
  const c: Record<string, unknown> = {}
  for (const m of ['select', 'eq', 'or', 'in', 'delete']) c[m] = vi.fn(() => c)
  c.single = vi.fn(() => Promise.resolve(result))
  c.then = (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve)
  return c
}

beforeEach(() => vi.resetAllMocks())

describe('DELETE /api/user-books/[id]', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/user-books/book-1', { method: 'DELETE' })
    const res = await DELETE(req, CTX as never)
    expect(res.status).toBe(401)
  })

  it('returns 409 when the book is involved in an active swap', async () => {
    mockAuth.mockResolvedValue(SESSION)
    // First call: swap_requests count > 0
    const swapChain = chain({ count: 1, data: null, error: null })
    mockFrom.mockReturnValueOnce(swapChain)
    const req = new NextRequest('http://localhost/api/user-books/book-1', { method: 'DELETE' })
    const res = await DELETE(req, CTX as never)
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error).toBe('교환독서를 한 책은 삭제할 수 없습니다')
  })

  it('returns 404 when book is not found or not owned by user', async () => {
    mockAuth.mockResolvedValue(SESSION)
    const swapChain = chain({ count: 0, data: null, error: null })
    const deleteChain = chain({ data: [], error: null })
    mockFrom.mockReturnValueOnce(swapChain).mockReturnValueOnce(deleteChain)
    const req = new NextRequest('http://localhost/api/user-books/book-1', { method: 'DELETE' })
    const res = await DELETE(req, CTX as never)
    expect(res.status).toBe(404)
  })

  it('returns 204 on successful deletion', async () => {
    mockAuth.mockResolvedValue(SESSION)
    const swapChain = chain({ count: 0, data: null, error: null })
    const deleteChain = chain({ data: [{ id: 'book-1' }], error: null })
    mockFrom.mockReturnValueOnce(swapChain).mockReturnValueOnce(deleteChain)
    const req = new NextRequest('http://localhost/api/user-books/book-1', { method: 'DELETE' })
    const res = await DELETE(req, CTX as never)
    expect(res.status).toBe(204)
  })
})
