import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { PATCH, DELETE } from '@/app/api/calendar-events/[id]/route'

const mockAuth = vi.hoisted(() => vi.fn())
vi.mock('@/lib/auth', () => ({ auth: mockAuth }))

const mockFrom = vi.hoisted(() => vi.fn())
vi.mock('@/lib/supabase', () => ({ supabase: { from: mockFrom } }))

const SESSION = { user: { id: 'user-1' } }
const CTX = { params: Promise.resolve({ id: 'event-1' }) }

function chain(result: object) {
  const c: Record<string, unknown> = {}
  for (const m of ['select', 'eq', 'update', 'delete']) c[m] = vi.fn(() => c)
  c.single = vi.fn(() => Promise.resolve(result))
  c.then = (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve)
  return c
}

beforeEach(() => vi.resetAllMocks())

describe('PATCH /api/calendar-events/[id]', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/calendar-events/event-1', {
      method: 'PATCH',
      body: JSON.stringify({ title: '새 제목' }),
    })
    const res = await PATCH(req, CTX as never)
    expect(res.status).toBe(401)
  })

  it('returns 400 when title is empty', async () => {
    mockAuth.mockResolvedValue(SESSION)
    const req = new NextRequest('http://localhost/api/calendar-events/event-1', {
      method: 'PATCH',
      body: JSON.stringify({ title: '' }),
    })
    const res = await PATCH(req, CTX as never)
    expect(res.status).toBe(400)
  })

  it('returns 404 when event does not exist', async () => {
    mockAuth.mockResolvedValue(SESSION)
    mockFrom.mockReturnValue(chain({ data: null, error: { message: 'not found' } }))
    const req = new NextRequest('http://localhost/api/calendar-events/event-1', {
      method: 'PATCH',
      body: JSON.stringify({ title: '새 제목' }),
    })
    const res = await PATCH(req, CTX as never)
    expect(res.status).toBe(404)
  })

  it('returns 403 when user does not own the event', async () => {
    mockAuth.mockResolvedValue(SESSION)
    mockFrom.mockReturnValue(chain({ data: { user_id: 'other-user' }, error: null }))
    const req = new NextRequest('http://localhost/api/calendar-events/event-1', {
      method: 'PATCH',
      body: JSON.stringify({ title: '새 제목' }),
    })
    const res = await PATCH(req, CTX as never)
    expect(res.status).toBe(403)
  })

  it('returns 200 with updated event on success', async () => {
    mockAuth.mockResolvedValue(SESSION)
    const updated = { id: 'event-1', title: '새 제목', date: '2024-06-10', time: null }
    mockFrom
      .mockReturnValueOnce(chain({ data: { user_id: 'user-1' }, error: null }))
      .mockReturnValueOnce(chain({ data: updated, error: null }))
    const req = new NextRequest('http://localhost/api/calendar-events/event-1', {
      method: 'PATCH',
      body: JSON.stringify({ title: '새 제목' }),
    })
    const res = await PATCH(req, CTX as never)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(updated)
  })
})

describe('DELETE /api/calendar-events/[id]', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/calendar-events/event-1', { method: 'DELETE' })
    const res = await DELETE(req, CTX as never)
    expect(res.status).toBe(401)
  })

  it('returns 404 when event does not exist', async () => {
    mockAuth.mockResolvedValue(SESSION)
    mockFrom.mockReturnValue(chain({ data: null, error: { message: 'not found' } }))
    const req = new NextRequest('http://localhost/api/calendar-events/event-1', { method: 'DELETE' })
    const res = await DELETE(req, CTX as never)
    expect(res.status).toBe(404)
  })

  it('returns 403 when user does not own the event', async () => {
    mockAuth.mockResolvedValue(SESSION)
    mockFrom.mockReturnValue(chain({ data: { user_id: 'other-user' }, error: null }))
    const req = new NextRequest('http://localhost/api/calendar-events/event-1', { method: 'DELETE' })
    const res = await DELETE(req, CTX as never)
    expect(res.status).toBe(403)
  })

  it('returns 204 on successful deletion', async () => {
    mockAuth.mockResolvedValue(SESSION)
    mockFrom
      .mockReturnValueOnce(chain({ data: { user_id: 'user-1' }, error: null }))
      .mockReturnValueOnce(chain({ data: null, error: null }))
    const req = new NextRequest('http://localhost/api/calendar-events/event-1', { method: 'DELETE' })
    const res = await DELETE(req, CTX as never)
    expect(res.status).toBe(204)
  })
})
