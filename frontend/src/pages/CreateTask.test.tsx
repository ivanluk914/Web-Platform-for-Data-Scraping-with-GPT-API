import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '../test/test-utils'
import TaskCreation from '../pages/CreateTask'
import { toast } from 'react-hot-toast'

// Mock navigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

// Mock toast
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

// Mock Auth0
const mockAuth0User = {
  sub: 'user123',
  name: 'Test User'
}

vi.mock('@auth0/auth0-react', () => ({
  useAuth0: () => ({
    user: mockAuth0User
  })
}))

// Mock HTTP client
const mockPost = vi.fn()
vi.mock('../providers/http-provider', () => ({
  useHttp: () => ({
    post: mockPost
  })
}))

describe('TaskCreation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPost.mockResolvedValue({ 
      data: {
        gpt_response: 'Test response',
        gpt_full_response: 'Full test response'
      }
    })
  })

  // Test initial render
  it('should render task creation form correctly', () => {
    renderWithProviders(<TaskCreation />)

    // Check title and description
    expect(screen.getByText('Task Creation')).toBeInTheDocument()
    expect(screen.getByText(/Create a new data extraction task/)).toBeInTheDocument()

    // Check form fields
    expect(screen.getByLabelText('Task Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Source URL')).toBeInTheDocument()
    expect(screen.getByLabelText('Keyword')).toBeInTheDocument()
  })

  // Test basic validation
  it('should validate required fields', async () => {
    renderWithProviders(<TaskCreation />)

    // Click preview without filling any fields
    const previewButton = screen.getByText('Preview')
    fireEvent.click(previewButton)

    // Verify error message
    expect(toast.error).toHaveBeenCalledWith('Please fill in all required fields before proceeding.')
  })
})