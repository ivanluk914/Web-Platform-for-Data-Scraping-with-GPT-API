import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../test/test-utils'
import TaskManagement from '../pages/TaskManagement'

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
const mockGet = vi.fn()
vi.mock('../providers/http-provider', () => ({
  useHttp: () => ({
    get: mockGet,
  })
}))

describe('TaskManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Test empty state
  it('should show no tasks message when list is empty', async () => {
    // Mock empty task list response
    mockGet.mockResolvedValueOnce({ data: [] })

    renderWithProviders(<TaskManagement />)

    // First check loading state
    expect(screen.getByText('Loading...')).toBeInTheDocument()

    // Then check for empty state message
    await waitFor(() => {
      expect(screen.getByText('No tasks to display.')).toBeInTheDocument()
    })
  })
})