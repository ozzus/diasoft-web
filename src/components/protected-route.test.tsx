import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ProtectedRoute } from '@/components/protected-route'

const useAuthMock = vi.fn()

vi.mock('@/lib/auth', () => ({
  useAuth: () => useAuthMock(),
}))

describe('ProtectedRoute', () => {
  it('renders loading state while session is loading', () => {
    useAuthMock.mockReturnValue({
      status: 'loading',
    })

    render(
      <ProtectedRoute allowedRoles={['student']}>
        <div>Protected</div>
      </ProtectedRoute>,
    )

    expect(screen.getByText(/loading session/i)).toBeInTheDocument()
  })

  it('renders protected content for allowed role', () => {
    useAuthMock.mockReturnValue({
      status: 'authenticated',
      authEnabled: true,
      user: { subject: 'student-001', roles: ['student'] },
      hasAnyRole: (...roles: string[]) => roles.includes('student'),
    })

    render(
      <ProtectedRoute allowedRoles={['student']}>
        <div>Protected</div>
      </ProtectedRoute>,
    )

    expect(screen.getByText('Protected')).toBeInTheDocument()
  })

  it('renders unauthorized state for missing role', () => {
    useAuthMock.mockReturnValue({
      status: 'authenticated',
      authEnabled: true,
      user: { subject: 'student-001', roles: ['student'] },
      error: null,
      hasAnyRole: () => false,
      login: vi.fn(),
      logout: vi.fn(),
    })

    render(
      <ProtectedRoute allowedRoles={['university_admin']}>
        <div>Protected</div>
      </ProtectedRoute>,
    )

    expect(screen.getByText(/access is not available/i)).toBeInTheDocument()
  })
})
