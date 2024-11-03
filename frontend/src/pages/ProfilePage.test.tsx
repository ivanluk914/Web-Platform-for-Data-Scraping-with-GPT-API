import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../test/test-utils'
import ProfilePage from '../pages/ProfilePage'
import { toast } from 'react-hot-toast'
import type { UserModel } from '../models/user'

// Mock Auth0
const mockAuth0 = {
  isAuthenticated: true,
  user: {
    sub: 'auth0|123',
    name: 'Test User',
    email: 'test@example.com',
  }
}

vi.mock('@auth0/auth0-react', () => ({
  useAuth0: () => mockAuth0
}))

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

// Mock user data
const mockUserData: UserModel = {
  user_id: 'auth0|123',
  name: 'Test User',
  email: 'test@example.com',
  picture: 'https://test.com/picture.jpg',
  given_name: 'Test',
  family_name: 'User',
  nickname: 'test',
  last_login: '2024-03-01'
}

// Mock useUser hook
const mockUseUser = vi.fn(() => ({
  currentUser: mockUserData,
  isLoading: false
}))

vi.mock('../providers/user-provider', () => ({
  useUser: () => mockUseUser()
}))

// Mock queryClient
const mockInvalidateQueries = vi.fn()
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query')
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: mockInvalidateQueries
    })
  }
})

// Mock HTTP client
const mockPut = vi.fn()
vi.mock('../providers/http-provider', () => ({
  useHttp: () => ({
    put: mockPut
  })
}))

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPut.mockResolvedValue({ status: 200 })
  })

  // Test initial render for auth0 user
  it('should render editable form for auth0 user', () => {
    renderWithProviders(<ProfilePage />)

    // Check header text
    expect(screen.getByText('Profile Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Customize Profile Information')).toBeInTheDocument()

    // Check form fields are enabled
    expect(screen.getByLabelText('Email Address')).toBeEnabled()
    expect(screen.getByLabelText(/Name/)).toBeEnabled()
    expect(screen.getByLabelText('Picture URL')).toBeEnabled()
  })

  // Test profile update
  it('should handle profile update successfully', async () => {
    renderWithProviders(<ProfilePage />)

    // Update form fields
    const emailInput = screen.getByLabelText('Email Address')
    const nameInput = screen.getByLabelText(/Name/)
    const pictureInput = screen.getByLabelText('Picture URL')

    fireEvent.change(emailInput, { target: { value: 'new@example.com' } })
    fireEvent.change(nameInput, { target: { value: 'New Name' } })
    fireEvent.change(pictureInput, { target: { value: 'https://new-picture.jpg' } })

    // Submit form
    const submitButton = screen.getByText('Update Profile')
    fireEvent.click(submitButton)

    // Check API call
    await waitFor(() => {
      expect(mockPut).toHaveBeenCalledWith(
        `/user/${mockUserData.user_id}`,
        expect.objectContaining({
          email: 'new@example.com',
          name: 'New Name',
          picture: 'https://new-picture.jpg'
        })
      )
    })

    // Check success message
    expect(toast.success).toHaveBeenCalledWith('Profile updated successfully')
    
    // Check query invalidation
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['users'] })
  })

  // Test form validation
  it('should validate form fields', async () => {
    renderWithProviders(<ProfilePage />)

    // Test invalid email
    const emailInput = screen.getByLabelText('Email Address')
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    fireEvent.blur(emailInput)

    expect(await screen.findByText(/Please enter a valid email address/)).toBeInTheDocument()

    // Test invalid picture URL
    const pictureInput = screen.getByLabelText('Picture URL')
    fireEvent.change(pictureInput, { target: { value: 'invalid-url' } })
    fireEvent.blur(pictureInput)

    expect(await screen.findByText(/Please enter a valid URL/)).toBeInTheDocument()

    // Test empty name
    const nameInput = screen.getByLabelText(/Name/)
    fireEvent.change(nameInput, { target: { value: '' } })
    fireEvent.blur(nameInput)

    expect(await screen.findByText(/Name is required/)).toBeInTheDocument()
  })
})