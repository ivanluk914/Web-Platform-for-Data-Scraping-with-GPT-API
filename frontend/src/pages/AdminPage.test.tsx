import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
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

    // Check if UserManagement is displayed by default
    expect(screen.getByText('User Management Component')).toBeInTheDocument()
  })

  // Test UserManagement component render
  it('should render UserManagement component within User Management tab', async () => {
    renderWithProviders(<AdminPage />)

    // Check that UserManagement component is present when "User Management" tab is active
    expect(screen.getByText('User Management Component')).toBeInTheDocument()
  })
})
