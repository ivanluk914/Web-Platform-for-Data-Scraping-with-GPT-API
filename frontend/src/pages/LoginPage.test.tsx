import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../test/test-utils'
import LoginPage from '../pages/LoginPage'
import { useAuth0 } from '@auth0/auth0-react'  // Add this import

// Mock the entire auth0 module
vi.mock('@auth0/auth0-react', () => ({
  useAuth0: vi.fn(() => ({
    loginWithRedirect: vi.fn(),
    isAuthenticated: false,
    isLoading: false,
    user: undefined,
    getAccessTokenSilently: vi.fn(),
    getIdTokenClaims: vi.fn(),
    logout: vi.fn(),
  })),
  Auth0Provider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

describe('LoginPage', () => {
  // Test login page rendering
  it('should render login page with all elements', () => {
    renderWithProviders(<LoginPage />)
    
    // Check if title exists
    expect(screen.getByText('Claude Collaborators')).toBeInTheDocument()
    
    // Check if subtitle exists
    expect(screen.getByText('Collaborate smarter, not harder')).toBeInTheDocument()
    
    // Check if login button exists
    const loginButton = screen.getByRole('button', { name: /login/i })
    expect(loginButton).toBeInTheDocument()
  })

  // Test login button click
  it('should call Auth0 login when button is clicked', () => {
    // Create mock function
    const mockLoginWithRedirect = vi.fn()
    
    // Setup mock return value
    const mockUseAuth0 = useAuth0 as jest.Mock
    mockUseAuth0.mockReturnValue({
      loginWithRedirect: mockLoginWithRedirect,
      isAuthenticated: false,
      isLoading: false,
      user: undefined,
      getAccessTokenSilently: vi.fn(),
      getIdTokenClaims: vi.fn(),
      logout: vi.fn(),
    })

    renderWithProviders(<LoginPage />)
    
    // Find and click login button
    const loginButton = screen.getByRole('button', { name: /login/i })
    loginButton.click()
    
    // Verify login was called
    expect(mockLoginWithRedirect).toHaveBeenCalled()
  })
})