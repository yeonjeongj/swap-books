// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SwapRequestPopup from '@/components/SwapRequestPopup'

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    return <img {...props} alt={props.alt as string} />
  },
}))

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const USER_BOOKS = [
  { id: 'book-existing', isbn: '9788983920775', title: '해리포터' },
]

const defaultProps = {
  userBooks: USER_BOOKS,
  onClose: vi.fn(),
  onSuccess: vi.fn(),
}

function kakaoBook(overrides = {}) {
  return {
    title: '해리포터',
    authors: ['J.K. 롤링'],
    publisher: '문학수첩',
    thumbnail: 'https://example.com/cover.jpg',
    isbn: '9788983920775',
    ...overrides,
  }
}

beforeEach(() => vi.resetAllMocks())

describe('SwapRequestPopup', () => {
  it('renders the swap request form', () => {
    render(<SwapRequestPopup {...defaultProps} />)
    expect(screen.getByRole('heading', { name: '교환하기' })).toBeDefined()
    expect(screen.getByPlaceholderText('닉네임을 입력하세요')).toBeDefined()
  })

  it('submit button is disabled when no book and no partner are selected', () => {
    render(<SwapRequestPopup {...defaultProps} />)
    expect(screen.getByRole('button', { name: '교환하기' })).toBeDisabled()
  })

  it('shows "이미 등록된 책" notice when selected book matches an existing user book', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ documents: [kakaoBook()] }),
    })

    render(<SwapRequestPopup {...defaultProps} />)
    await user.type(screen.getByPlaceholderText('제목 또는 저자를 검색하세요'), '해리포터')
    await user.click(screen.getAllByRole('button', { name: '검색' })[0])
    await waitFor(() => screen.getByText('해리포터'))
    await user.click(screen.getByText('해리포터'))

    await waitFor(() => {
      expect(screen.getByText(/이미 등록된 책입니다/)).toBeDefined()
    })
  })

  it('selects a partner after searching and shows their nickname in the input', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ id: 'user-2', nickname: '파트너' }]),
    })

    render(<SwapRequestPopup {...defaultProps} />)
    await user.type(screen.getByPlaceholderText('닉네임을 입력하세요'), '파트너')
    await user.click(screen.getAllByRole('button', { name: '검색' })[1])
    await waitFor(() => screen.getByText('파트너'))
    await user.click(screen.getByText('파트너'))

    const input = screen.getByPlaceholderText('닉네임을 입력하세요') as HTMLInputElement
    expect(input.value).toBe('파트너')
  })

  it('toggling public recruit clears selected partner', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ id: 'user-2', nickname: '파트너' }]),
    })

    render(<SwapRequestPopup {...defaultProps} />)

    // Select partner
    await user.type(screen.getByPlaceholderText('닉네임을 입력하세요'), '파트너')
    await user.click(screen.getAllByRole('button', { name: '검색' })[1])
    await waitFor(() => screen.getByText('파트너'))
    await user.click(screen.getByText('파트너'))

    // Now toggle public recruit — should clear partner
    await user.click(screen.getByText('파트너 공개 모집하기'))

    const input = screen.getByPlaceholderText('닉네임을 입력하세요') as HTMLInputElement
    expect(input.value).toBe('')
  })

  it('uses existing book id when book already matches a user book (no extra POST to /api/user-books)', async () => {
    const user = userEvent.setup()
    // First call: book search; second call: POST /api/swaps
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ documents: [kakaoBook()] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{ id: 'user-2', nickname: '파트너' }]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 's1' }),
      })

    render(<SwapRequestPopup {...defaultProps} />)

    // Select book
    await user.type(screen.getByPlaceholderText('제목 또는 저자를 검색하세요'), '해리포터')
    await user.click(screen.getAllByRole('button', { name: '검색' })[0])
    await waitFor(() => screen.getByText('해리포터'))
    await user.click(screen.getByText('해리포터'))

    // Select partner
    await user.type(screen.getByPlaceholderText('닉네임을 입력하세요'), '파트너')
    await user.click(screen.getAllByRole('button', { name: '검색' })[1])
    await waitFor(() => screen.getByText('파트너'))
    await user.click(screen.getByText('파트너'))

    await user.click(screen.getByRole('button', { name: '교환하기' }))

    await waitFor(() => {
      // fetch should have been called 3 times (book search, partner search, swap create)
      // NOT 4 times (which would mean it also called /api/user-books)
      expect(mockFetch).toHaveBeenCalledTimes(3)
      const swapCall = mockFetch.mock.calls[2]
      expect(swapCall[0]).toBe('/api/swaps')
      const swapBody = JSON.parse(swapCall[1].body)
      expect(swapBody.offeredBookId).toBe('book-existing')
    })
  })

  it('registers a new book first when it does not match any user book', async () => {
    const user = userEvent.setup()
    const newBook = kakaoBook({ title: '새로운 책', isbn: '0000000000000' })

    mockFetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ documents: [newBook] }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([{ id: 'user-2', nickname: '파트너' }]) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ id: 'new-book-id' }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ id: 's1' }) })

    render(<SwapRequestPopup {...defaultProps} />)

    await user.type(screen.getByPlaceholderText('제목 또는 저자를 검색하세요'), '새로운 책')
    await user.click(screen.getAllByRole('button', { name: '검색' })[0])
    await waitFor(() => screen.getByText('새로운 책'))
    await user.click(screen.getByText('새로운 책'))

    await user.type(screen.getByPlaceholderText('닉네임을 입력하세요'), '파트너')
    await user.click(screen.getAllByRole('button', { name: '검색' })[1])
    await waitFor(() => screen.getByText('파트너'))
    await user.click(screen.getByText('파트너'))

    await user.click(screen.getByRole('button', { name: '교환하기' }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(4)
      expect(mockFetch.mock.calls[2][0]).toBe('/api/user-books')
      expect(mockFetch.mock.calls[3][0]).toBe('/api/swaps')
    })
  })

  it('calls onSuccess and onClose on successful submission', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const onSuccess = vi.fn()

    mockFetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ documents: [kakaoBook()] }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ id: 's1' }) })

    render(<SwapRequestPopup userBooks={USER_BOOKS} onClose={onClose} onSuccess={onSuccess} />)

    await user.type(screen.getByPlaceholderText('제목 또는 저자를 검색하세요'), '해리포터')
    await user.click(screen.getAllByRole('button', { name: '검색' })[0])
    await waitFor(() => screen.getByText('해리포터'))
    await user.click(screen.getByText('해리포터'))

    // Use public recruit instead of selecting a partner
    await user.click(screen.getByText('파트너 공개 모집하기'))

    await user.click(screen.getByRole('button', { name: '교환하기' }))

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledOnce()
      expect(onClose).toHaveBeenCalledOnce()
    })
  })
})
