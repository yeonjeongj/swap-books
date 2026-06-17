import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/calendar-events/route'

const mockAuth = vi.hoisted(() => vi.fn())
vi.mock('@/lib/auth', () => ({ auth: mockAuth }))

const mockFrom = vi.hoisted(() => vi.fn())
vi.mock('@/lib/supabase', () => ({ supabase: { from: mockFrom } }))

const SESSION = { user: { id: 'user-1' } }

function chain(result: object) {
  const c: Record<string, unknown> = {}
  for (const m of ['select', 'eq', 'order', 'gte', 'lte', 'insert']) c[m] = vi.fn(() => c)
  c.single = vi.fn(() => Promise.resolve(result))
  c.then = (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve)
  return c
}

beforeEach(() => vi.resetAllMocks())

describe('GET /api/calendar-events', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await GET(new NextRequest('http://localhost/api/calendar-events'))
    expect(res.status).toBe(401)
  })

  it('returns all events when no year/month provided', async () => {
    mockAuth.mockResolvedValue(SESSION)
    const events = [{ id: 'e1', title: '독서', date: '2024-06-10' }]
    mockFrom.mockReturnValue(chain({ data: events, error: null }))
    const res = await GET(new NextRequest('http://localhost/api/calendar-events'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(events)
  })

  it('applies date range filter when year and month are provided', async () => {
    mockAuth.mockResolvedValue(SESSION)
    const c = chain({ data: [], error: null })
    mockFrom.mockReturnValue(c)
    await GET(new NextRequest('http://localhost/api/calendar-events?year=2024&month=6'))
    expect(c.gte).toHaveBeenCalledWith('date', '2024-06-01')
    expect(c.lte).toHaveBeenCalledWith('date', '2024-06-30')
  })
})

describe('POST /api/calendar-events', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/calendar-events', {
      method: 'POST',
      body: JSON.stringify({ title: '독서', date: '2024-06-10' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 when title is empty', async () => {
    mockAuth.mockResolvedValue(SESSION)
    const req = new NextRequest('http://localhost/api/calendar-events', {
      method: 'POST',
      body: JSON.stringify({ title: '', date: '2024-06-10' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('title is required')
  })

  it('returns 400 when date is missing', async () => {
    mockAuth.mockResolvedValue(SESSION)
    const req = new NextRequest('http://localhost/api/calendar-events', {
      method: 'POST',
      body: JSON.stringify({ title: '독서' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('date is required')
  })

  it('returns 201 without time on success', async () => {
    mockAuth.mockResolvedValue(SESSION)
    const event = { id: 'e1', title: '독서', date: '2024-06-10', time: null }
    mockFrom.mockReturnValue(chain({ data: event, error: null }))
    const req = new NextRequest('http://localhost/api/calendar-events', {
      method: 'POST',
      body: JSON.stringify({ title: '독서', date: '2024-06-10' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual(event)
  })

  it('returns 201 with time on success', async () => {
    mockAuth.mockResolvedValue(SESSION)
    const event = { id: 'e1', title: '독서', date: '2024-06-10', time: '14:00' }
    mockFrom.mockReturnValue(chain({ data: event, error: null }))
    const req = new NextRequest('http://localhost/api/calendar-events', {
      method: 'POST',
      body: JSON.stringify({ title: '독서', date: '2024-06-10', time: '14:00' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
  })
})
