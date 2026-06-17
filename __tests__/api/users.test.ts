import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '@/app/api/users/route'

const mockAuth = vi.hoisted(() => vi.fn())
vi.mock('@/lib/auth', () => ({ auth: mockAuth }))

const mockFrom = vi.hoisted(() => vi.fn())
vi.mock('@/lib/supabase', () => ({ supabase: { from: mockFrom } }))

const SESSION = { user: { id: 'user-1', email: 'test@example.com' } }

function chain(result: object) {
  const c: Record<string, unknown> = {}
  for (const m of ['select', 'eq', 'upsert']) c[m] = vi.fn(() => c)
  c.single = vi.fn(() => Promise.resolve(result))
  c.then = (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve)
  return c
}

beforeEach(() => vi.resetAllMocks())

describe('GET /api/users', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns null when user does not exist yet (PGRST116)', async () => {
    mockAuth.mockResolvedValue(SESSION)
    mockFrom.mockReturnValue(chain({ data: null, error: { code: 'PGRST116', message: 'not found' } }))
    const res = await GET()
    expect(res.status).toBe(200)
    expect(await res.json()).toBeNull()
  })

  it('returns user data when found', async () => {
    mockAuth.mockResolvedValue(SESSION)
    const user = { id: 'user-1', nickname: '테스터', avatar_url: null }
    mockFrom.mockReturnValue(chain({ data: user, error: null }))
    const res = await GET()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(user)
  })
})

describe('POST /api/users', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const req = new Request('http://localhost/api/users', {
      method: 'POST',
      body: JSON.stringify({ nickname: '테스터' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid JSON', async () => {
    mockAuth.mockResolvedValue(SESSION)
    const req = new Request('http://localhost/api/users', { method: 'POST', body: 'bad' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when nickname is empty', async () => {
    mockAuth.mockResolvedValue(SESSION)
    const req = new Request('http://localhost/api/users', {
      method: 'POST',
      body: JSON.stringify({ nickname: '  ' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('nickname is required')
  })

  it('returns 200 with upserted user on success', async () => {
    mockAuth.mockResolvedValue(SESSION)
    const user = { id: 'user-1', nickname: '테스터', email: 'test@example.com' }
    mockFrom.mockReturnValue(chain({ data: user, error: null }))
    const req = new Request('http://localhost/api/users', {
      method: 'POST',
      body: JSON.stringify({ nickname: '테스터' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(user)
  })
})
