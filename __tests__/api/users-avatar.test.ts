import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/users/avatar/route'

const mockAuth = vi.hoisted(() => vi.fn())
vi.mock('@/lib/auth', () => ({ auth: mockAuth }))

const mockStorageFrom = vi.hoisted(() => vi.fn())
vi.mock('@/lib/supabase', () => ({
  supabase: {
    storage: { from: mockStorageFrom },
  },
}))

const SESSION = { user: { id: 'user-1' } }

function makeFormWithFile(type: string, size: number) {
  const bytes = new Uint8Array(size)
  const file = new File([bytes], 'avatar', { type })
  const form = new FormData()
  form.append('file', file)
  return form
}

function makeRequest(form: FormData) {
  const req = new NextRequest('http://localhost/api/users/avatar', { method: 'POST', body: form })
  return req
}

beforeEach(() => {
  vi.resetAllMocks()
  mockStorageFrom.mockReturnValue({
    upload: vi.fn().mockResolvedValue({ error: null }),
    getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://cdn.example.com/avatar.jpg' } }),
  })
})

describe('POST /api/users/avatar', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const form = makeFormWithFile('image/jpeg', 100)
    const res = await POST(makeRequest(form))
    expect(res.status).toBe(401)
  })

  it('returns 400 when no file is provided', async () => {
    mockAuth.mockResolvedValue(SESSION)
    const req = new NextRequest('http://localhost/api/users/avatar', {
      method: 'POST',
      body: new FormData(),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('file is required')
  })

  it('returns 400 for SVG files', async () => {
    mockAuth.mockResolvedValue(SESSION)
    const form = makeFormWithFile('image/svg+xml', 100)
    const res = await POST(makeRequest(form))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('File must be jpeg, png, gif, or webp')
  })

  it('returns 400 when file exceeds 2MB', async () => {
    mockAuth.mockResolvedValue(SESSION)
    const form = makeFormWithFile('image/jpeg', 2 * 1024 * 1024 + 1)
    const res = await POST(makeRequest(form))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('File must be under 2 MB')
  })

  it('returns 200 with public URL on successful upload (jpeg)', async () => {
    mockAuth.mockResolvedValue(SESSION)
    const form = makeFormWithFile('image/jpeg', 1024)
    const res = await POST(makeRequest(form))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.url).toBe('https://cdn.example.com/avatar.jpg')
  })

  it('accepts png, gif, and webp file types', async () => {
    mockAuth.mockResolvedValue(SESSION)
    for (const type of ['image/png', 'image/gif', 'image/webp']) {
      const form = makeFormWithFile(type, 1024)
      const res = await POST(makeRequest(form))
      expect(res.status).toBe(200)
    }
  })
})
