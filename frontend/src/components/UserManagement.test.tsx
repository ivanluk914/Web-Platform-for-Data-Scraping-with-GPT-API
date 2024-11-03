import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../test/test-utils'
import UserManagement from '../components/UserManagement'
import { toast } from 'react-hot-toast'
import { UserRole } from '../models/user'

// Mock user service functions
const mockListUsers = vi.fn()
const mockDeleteUser = vi.fn()
const mockAssignRole = vi.fn()
const mockRemoveRole = vi.fn()

// Mock service class
vi.mock('../api/user-service', () => ({
  UserService: class {
    constructor() {
      return {
        listUsers: mockListUsers,
        deleteUser: mockDeleteUser,
        assignRole: mockAssignRole,
        removeRole: mockRemoveRole
      }
    }
  }
}))

// Mock toast notifications
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

// Mock http provider
vi.mock('../providers/http-provider', () => ({
  useHttp: () => ({})
}))

// Mock user data
const mockUser = {
  user_id: '1',
  name: 'Test User',
  email: 'test@example.com',
  nickname: 'tester',
  last_login: '2024-03-01',
  roles: [UserRole.User],
  picture: 'test.jpg',
  given_name: 'Test',
  family_name: 'User'
}

describe('UserManagement', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    vi.clearAllMocks()
    // Set default mock responses
    mockListUsers.mockResolvedValue([mockUser])
    mockDeleteUser.mockResolvedValue(undefined)
    mockAssignRole.mockResolvedValue([])
    mockRemoveRole.mockResolvedValue([])
  })

  // Test initial render
  it('should render user management interface', async () => {
    renderWithProviders(<UserManagement />)

    // Check for header elements
    expect(screen.getByText('User Management')).toBeInTheDocument()
    expect(screen.getByText('Manage user roles and permissions for the application.')).toBeInTheDocument()

    // Wait for user data to load and display
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument()
    })
  })

  // Test user deletion
  it('should handle user deletion successfully', async () => {
    renderWithProviders(<UserManagement />)

    // Wait for user data to load
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument()
    })

    // Open actions menu
    const actionButton = screen.getByRole('button', { name: '' })
    fireEvent.click(actionButton)

    // Click delete option
    const deleteButton = await screen.findByText('Delete User')
    fireEvent.click(deleteButton)

    // Confirm deletion in modal
    const confirmButton = await screen.findByRole('button', { name: /delete/i })
    fireEvent.click(confirmButton)

    // Wait for success message
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('User deleted successfully')
    })

    // Verify deletion was called
    expect(mockDeleteUser).toHaveBeenCalledWith('1')
  })

  // Test role updates
  it('should handle role assignment successfully', async () => {
    // Setup mock response for role assignment
    mockAssignRole.mockResolvedValueOnce([UserRole.Admin])
    
    renderWithProviders(<UserManagement />)

    // Wait for user data to load
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument()
    })

    // Open actions menu
    const actionButton = screen.getByRole('button', { name: '' })
    fireEvent.click(actionButton)

    // Open role assignment modal
    const assignRoleButton = await screen.findByText('Assign Role')
    fireEvent.click(assignRoleButton)

    // Select admin role
    const roleCheckbox = await screen.findByRole('checkbox', { name: /admin/i })
    fireEvent.click(roleCheckbox)

    // Submit role update
    const updateButton = await screen.findByRole('button', { name: /update/i })
    fireEvent.click(updateButton)

    // Wait for all async operations
    await new Promise(process.nextTick)

    // Verify success
    await waitFor(() => {
      expect(mockAssignRole).toHaveBeenCalled()
      expect(toast.success).toHaveBeenCalledWith('Role assigned successfully')
    }, {
      timeout: 2000
    })
  })

  // Test loading state
  it('should display loading skeleton when fetching data', () => {
    // Make listUsers never resolve to show loading state
    mockListUsers.mockImplementationOnce(() => new Promise(() => {}))
    
    renderWithProviders(<UserManagement />)

    // Check for skeleton loading elements
    const skeletons = document.querySelectorAll('.h-8.mb-2')
    expect(skeletons.length).toBeGreaterThan(0)

    // Loading state should be visible
    const loadingContainer = screen.getByLabelText('Loading')
    expect(loadingContainer).toBeInTheDocument()
  })
})