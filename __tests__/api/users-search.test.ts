import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/users/search/route'

const mockAuth = vi.hoisted(() => vi.fn())
vi.mock('@/lib/auth', () => ({ auth: mockAuth }))

const mockFrom = vi.hoisted(() => vi.fn())
vi.mock('@/lib/supabase', () => ({ supabase: { from: mockFrom } }))

const SESSION = { user: { id: 'user-1' } }

function chain(result: object) {
  const c: Record<string, unknown> = {}
  for (const m of ['select', 'ilike', 'neq', 'limit']) c[m] = vi.fn(() => c)
  c.then = (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve)
  return c
}

beforeEach(() => vi.resetAllMocks())

describe('GET /api/users/search', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/users/search?q=test')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 when q param is missing', async () => {
    mockAuth.mockResolvedValue(SESSION)
    const req = new NextRequest('http://localhost/api/users/search')
    const res = await GET(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('q is required')
  })

  it('returns 400 when q param is whitespace only', async () => {
    mockAuth.mockResolvedValue(SESSION)
    const req = new NextRequest('http://localhost/api/users/search?q=   ')
    const res = await GET(req)
    expect(res.status).toBe(400)
  })

  it('returns matching users excluding self', async () => {
    mockAuth.mockResolvedValue(SESSION)
    const users = [{ id: 'user-2', nickname: '테스터', avatar_url: null }]
    mockFrom.mockReturnValue(chain({ data: users, error: null }))
    const req = new NextRequest('http://localhost/api/users/search?q=테스')
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(users)
  })

  it('returns empty array when no matches found', async () => {
    mockAuth.mockResolvedValue(SESSION)
    mockFrom.mockReturnValue(chain({ data: [], error: null }))
    const req = new NextRequest('http://localhost/api/users/search?q=없는유저')
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
  })
})
