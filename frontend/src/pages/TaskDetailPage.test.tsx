import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../test/test-utils'
import TaskDetailPage from '../pages/TaskDetailPage'
import { toast } from 'react-hot-toast'

// Mock navigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ taskId: 'test-123' })
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
const mockPut = vi.fn()
const mockDelete = vi.fn()
vi.mock('../providers/http-provider', () => ({
  useHttp: () => ({
    get: mockGet,
    put: mockPut,
    delete: mockDelete
  })
}))

// Mock task data
const mockTask = {
  id: 'test-123',
  task_name: 'Test Task',
  status: 1,
  created_at: '2024-03-01T00:00:00Z',
  task_definition: JSON.stringify({
    source: [{
      type: 1,
      url: 'https://example.com'
    }],
    target: [{
      type: 1,
      name: 'Price',
      value: 'Text'
    }],
    output: [{
      type: 1,
      value: 'Test response'
    }]
  })
}

describe('TaskDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock successful get task response
    mockGet.mockResolvedValue({ data: mockTask })
  })

  // Test initial render
  it('should render task details correctly', async () => {
    renderWithProviders(<TaskDetailPage />)

    await waitFor(() => {
      expect(screen.getByText('Task Details')).toBeInTheDocument()
      expect(screen.getByText('Test Task')).toBeInTheDocument()
      expect(screen.getByText('https://example.com')).toBeInTheDocument()
    })
  })

  // Test back button navigation
  it('should handle back button click', async () => {
    renderWithProviders(<TaskDetailPage />)

    await waitFor(() => {
      const backButton = screen.getByRole('button', { name: /back/i })
      fireEvent.click(backButton)
      expect(mockNavigate).toHaveBeenCalled()
    })
  })

  // Test download button
  it('should show download button for completed task', async () => {
    const completedTask = {
      ...mockTask,
      status: 3 // completed status
    }
    mockGet.mockResolvedValueOnce({ data: completedTask })

    renderWithProviders(<TaskDetailPage />)

    await waitFor(() => {
      expect(screen.getByText('Download Result')).toBeInTheDocument()
    })
  })

  // Test task status display
  it('should display correct task status', async () => {
    renderWithProviders(<TaskDetailPage />)

    await waitFor(() => {
      const statusChip = screen.getByText('created')
      expect(statusChip).toBeInTheDocument()
    })
  })
})