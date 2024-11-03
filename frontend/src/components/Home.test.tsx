import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import Home from './Home'
import { renderWithProviders } from '../test/test-utils'

describe('Home Component', () => {
  it('renders welcome message', () => {
    renderWithProviders(<Home />)
    expect(screen.getByText(/Welcome to Claude Collaborators/i)).toBeInTheDocument()
  })
})