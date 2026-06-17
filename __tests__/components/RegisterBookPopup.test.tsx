// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RegisterBookPopup from '@/components/RegisterBookPopup'

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt as string} />
  },
}))

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const defaultProps = {
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

beforeEach(() => {
  vi.resetAllMocks()
})

describe('RegisterBookPopup', () => {
  it('renders the book registration form', () => {
    render(<RegisterBookPopup {...defaultProps} />)
    expect(screen.getByText('책 등록하기')).toBeDefined()
    expect(screen.getByPlaceholderText('제목 또는 저자를 검색하세요')).toBeDefined()
  })

  it('search button is disabled when query is empty', () => {
    render(<RegisterBookPopup {...defaultProps} />)
    const searchBtn = screen.getByRole('button', { name: '검색' })
    expect(searchBtn).toBeDisabled()
  })

  it('shows search results dropdown after searching', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ documents: [kakaoBook()] }),
    })
    render(<RegisterBookPopup {...defaultProps} />)
    await user.type(screen.getByPlaceholderText('제목 또는 저자를 검색하세요'), '해리포터')
    await user.click(screen.getByRole('button', { name: '검색' }))
    await waitFor(() => expect(screen.getByText('해리포터')).toBeDefined())
  })

  it('selects a book when clicking a result', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ documents: [kakaoBook()] }),
    })
    render(<RegisterBookPopup {...defaultProps} />)
    await user.type(screen.getByPlaceholderText('제목 또는 저자를 검색하세요'), '해리포터')
    await user.click(screen.getByRole('button', { name: '검색' }))
    await waitFor(() => screen.getByText('해리포터'))
    await user.click(screen.getByText('해리포터'))
    // After selection, the input shows the book title and the dropdown is gone
    const input = screen.getByPlaceholderText('제목 또는 저자를 검색하세요') as HTMLInputElement
    expect(input.value).toBe('해리포터')
  })

  it('submit button is disabled when no book is selected', () => {
    render(<RegisterBookPopup {...defaultProps} />)
    const submitBtn = screen.getByRole('button', { name: '등록하기' })
    expect(submitBtn).toBeDisabled()
  })

  it('calls onSuccess and onClose after successful registration', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const onSuccess = vi.fn()

    // First fetch: book search results
    // Second fetch: POST /api/user-books
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ documents: [kakaoBook()] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'b1', title: '해리포터' }),
      })

    render(<RegisterBookPopup onClose={onClose} onSuccess={onSuccess} />)

    await user.type(screen.getByPlaceholderText('제목 또는 저자를 검색하세요'), '해리포터')
    await user.click(screen.getByRole('button', { name: '검색' }))
    await waitFor(() => screen.getByText('해리포터'))
    await user.click(screen.getByText('해리포터'))

    await user.click(screen.getByRole('button', { name: '등록하기' }))

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledOnce()
      expect(onClose).toHaveBeenCalledOnce()
    })
  })

  it('shows error message when registration API fails', async () => {
    const user = userEvent.setup()
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ documents: [kakaoBook()] }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: '이미 등록된 책입니다.' }),
      })

    render(<RegisterBookPopup {...defaultProps} />)
    await user.type(screen.getByPlaceholderText('제목 또는 저자를 검색하세요'), '해리포터')
    await user.click(screen.getByRole('button', { name: '검색' }))
    await waitFor(() => screen.getByText('해리포터'))
    await user.click(screen.getByText('해리포터'))
    await user.click(screen.getByRole('button', { name: '등록하기' }))

    await waitFor(() => {
      expect(screen.getByText('이미 등록된 책입니다.')).toBeDefined()
    })
  })

  it('closes when the close button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<RegisterBookPopup onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: '닫기' }))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
