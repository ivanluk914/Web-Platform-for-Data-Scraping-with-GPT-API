import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '../test/test-utils'
import Sidebar from '../components/SideBar'
import { UserRole } from '../models/user'

// Mock Auth0
const mockLogout = vi.fn()
vi.mock('@auth0/auth0-react', () => ({
  useAuth0: () => ({
    logout: mockLogout,
    user: {
      name: 'Test User',
      email: 'test@example.com'
    }
  })
}))

// Mock user provider
const mockUseUser = vi.fn()
vi.mock('../providers/user-provider', () => ({
  useUser: () => mockUseUser()
}))

describe('Sidebar', () => {
  beforeEach(() => {
    mockUseUser.mockClear()
    mockLogout.mockClear()
  })

  // Test normal user menu items
  it('should render basic menu items for normal user', () => {
    mockUseUser.mockReturnValue({
      currentUser: {
        name: 'Test User',
        email: 'test@example.com',
        picture: 'test.jpg',
        roles: [UserRole.User]
      },
      isLoading: false
    })

    renderWithProviders(<Sidebar />)

    // Check basic menu items
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Task Management')).toBeInTheDocument()
    expect(screen.getByText('Create Task')).toBeInTheDocument()
    expect(screen.getByText('Profile')).toBeInTheDocument()
    
    // Admin menu should not be present
    expect(screen.queryByText('Admin')).not.toBeInTheDocument()
  })

  // Test admin menu items
  it('should render admin menu items for admin user', () => {
    mockUseUser.mockReturnValue({
      currentUser: {
        name: 'Admin User',
        email: 'admin@example.com',
        picture: 'admin.jpg',
        roles: [UserRole.Admin]
      },
      isLoading: false
    })

    renderWithProviders(<Sidebar />)
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  // Test user profile display
  it('should display user profile information', () => {
    mockUseUser.mockReturnValue({
      currentUser: {
        name: 'Test User',
        email: 'test@example.com',
        picture: 'test.jpg',
        roles: [UserRole.User]
      },
      isLoading: false
    })

    renderWithProviders(<Sidebar />)
    
    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
  })

  // Test logout functionality
  it('should handle logout when logout button is clicked', () => {
    mockUseUser.mockReturnValue({
      currentUser: {
        name: 'Test User',
        email: 'test@example.com',
        picture: 'test.jpg',
        roles: [UserRole.User]
      },
      isLoading: false
    })

    renderWithProviders(<Sidebar />)
    
    const logoutButton = screen.getByText('Logout')
    fireEvent.click(logoutButton)
    
    expect(mockLogout).toHaveBeenCalledWith({ 
      logoutParams: { 
        returnTo: window.location.origin 
      } 
    })
  })

  // Test loading state
  it('should show loading skeleton when user data is loading', () => {
    mockUseUser.mockReturnValue({
      currentUser: null,
      isLoading: true
    })

    const { container } = renderWithProviders(<Sidebar />)
    
    // Check for presence of skeleton elements
    expect(screen.queryByText('Test User')).not.toBeInTheDocument()
    expect(screen.queryByText('test@example.com')).not.toBeInTheDocument()
  })
})