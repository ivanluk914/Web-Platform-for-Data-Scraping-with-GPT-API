import React from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'  
import { NextUIProvider } from '@nextui-org/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

export function renderWithProviders(
  ui: React.ReactElement,
  {
    route = '/',
    queryClient = createTestQueryClient(),
    ...renderOptions
  } = {}
) {
  window.history.pushState({}, 'Test page', route)

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <NextUIProvider>
            {children}
          </NextUIProvider>
        </QueryClientProvider>
      </MemoryRouter>
    )
  }

  return {
    queryClient,
    ...render(ui, {
      wrapper: Wrapper,
      ...renderOptions,
    }),
  }
}

export * from '@testing-library/react'