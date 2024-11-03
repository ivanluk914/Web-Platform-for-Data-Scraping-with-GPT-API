import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../test/test-utils'
import ProtectedRoute from '../components/RouteProtector'
import { UserRole } from '../models/user'
import { toast } from 'react-hot-toast'

// Mock user provider
const mockUseUser = vi.fn()
vi.mock('../providers/user-provider', () => ({
  useUser: () => mockUseUser()
}))

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  toast: {
    error: vi.fn(),
  }
}))

// Mock react-router-dom navigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom') as any
  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => <div>Redirected to {to}</div>
  }
})

describe('ProtectedRoute', () => {
  const TestComponent = () => <div>Protected Content</div>

  beforeEach(() => {
    mockUseUser.mockClear()
    vi.mocked(toast.error).mockClear()
  })

  // Test authorized access
  it('should render children when user has required role', () => {
    mockUseUser.mockReturnValue({
      currentUser: {
        roles: [UserRole.Admin],
        name: 'Test Admin'
      },
      isLoading: false,
      error: null
    })

    renderWithProviders(
      <ProtectedRoute requiredRoles={[UserRole.Admin]}>
        <TestComponent />
      </ProtectedRoute>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  // Test unauthorized access
  it('should redirect when user lacks required role', () => {
    mockUseUser.mockReturnValue({
      currentUser: {
        roles: [UserRole.User],
        name: 'Test User'
      },
      isLoading: false,
      error: null
    })

    renderWithProviders(
      <ProtectedRoute requiredRoles={[UserRole.Admin]}>
        <TestComponent />
      </ProtectedRoute>
    )

    expect(screen.getByText('Redirected to /home')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  // Test error toast
  it('should show error toast when access denied', () => {
    mockUseUser.mockReturnValue({
      currentUser: {
        roles: [UserRole.User],
        name: 'Test User'
      },
      isLoading: false,
      error: null
    })

    renderWithProviders(
      <ProtectedRoute requiredRoles={[UserRole.Admin]}>
        <TestComponent />
      </ProtectedRoute>
    )

    expect(toast.error).toHaveBeenCalledWith('You do not have access to this page')
  })
})