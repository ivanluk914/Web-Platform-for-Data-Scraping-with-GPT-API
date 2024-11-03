import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../test/test-utils'
import AdminPage from '../pages/AdminPage'

// Mock UserManagement component
vi.mock('../components/UserManagement', () => ({
  default: () => <div>User Management Component</div>
}))

describe('AdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Test initial render
  it('should render AdminPage with Tabs and display UserManagement by default', () => {
    renderWithProviders(<AdminPage />)

    // Check for tabs rendering
    expect(screen.getByText('User Management')).toBeInTheDocument()
    expect(screen.getByText('Placeholder Tab 1')).toBeInTheDocument()
    expect(screen.getByText('Placeholder Tab 2')).toBeInTheDocument()

    // Check if UserManagement is displayed by default
    expect(screen.getByText('User Management Component')).toBeInTheDocument()
  })

  // Test tab switching functionality
  it('should display correct content when switching tabs', async () => {
    renderWithProviders(<AdminPage />)

    // Default: User Management tab content
    expect(screen.getByText('User Management Component')).toBeInTheDocument()

    // Switch to Placeholder Tab 1
    fireEvent.click(screen.getByText('Placeholder Tab 1'))
    await waitFor(() => {
      expect(screen.queryByText('User Management Component')).not.toBeInTheDocument()
    })

    // Placeholder Tab 1 content (empty in this case)
    expect(screen.getByText('Placeholder Tab 1')).toBeInTheDocument()

    // Switch to Placeholder Tab 2
    fireEvent.click(screen.getByText('Placeholder Tab 2'))
    await waitFor(() => {
      expect(screen.queryByText('User Management Component')).not.toBeInTheDocument()
    })

    // Placeholder Tab 2 content (empty in this case)
    expect(screen.getByText('Placeholder Tab 2')).toBeInTheDocument()
  })

  // Test UserManagement component render
  it('should render UserManagement component within User Management tab', async () => {
    renderWithProviders(<AdminPage />)

    // Check that UserManagement component is present when "User Management" tab is active
    expect(screen.getByText('User Management Component')).toBeInTheDocument()
  })
})
