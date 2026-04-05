import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { UnauthorizedPage } from '@/pages/unauthorized-page'

const useAuthMock = vi.fn()

vi.mock('@/lib/auth', () => ({
  useAuth: () => useAuthMock(),
}))

describe('UnauthorizedPage', () => {
  it('shows sign-in button when auth is enabled and user is anonymous', () => {
    const login = vi.fn()
    useAuthMock.mockReturnValue({
      authEnabled: true,
      status: 'unauthenticated',
      login,
      logout: vi.fn(),
    })

    render(<UnauthorizedPage />)
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    expect(login).toHaveBeenCalled()
  })

  it('shows custom message', () => {
    useAuthMock.mockReturnValue({
      authEnabled: false,
      status: 'unauthenticated',
      login: vi.fn(),
      logout: vi.fn(),
    })

    render(<UnauthorizedPage message="Custom forbidden message" />)

    expect(screen.getByText('Custom forbidden message')).toBeInTheDocument()
  })
})
