import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../presentation/contexts/AuthContext';

interface WrapperProps {
  children: React.ReactNode;
  initialEntries?: string[];
}

const Wrapper: React.FC<WrapperProps> = ({ children, initialEntries = ['/'] }) => {
  return (
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </MemoryRouter>
  );
};

export const renderWithProviders = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { initialEntries?: string[] }
) => {
  const { initialEntries, ...rest } = options || {};
  
  return render(ui, {
    wrapper: ({ children }) => (
      <Wrapper initialEntries={initialEntries}>{children}</Wrapper>
    ),
    ...rest,
  });
};

// Helper to create a mock auth context value
export const createMockAuthContext = (overrides = {}) => ({
  user: {
    id: 'user-1',
    email: 'alice@example.com',
    name: 'Alice',
    partner_id: null,
  },
  partner: null,
  loading: false,
  login: vi.fn().mockResolvedValue(undefined),
  signup: vi.fn().mockResolvedValue(undefined),
  logout: vi.fn().mockResolvedValue(undefined),
  invitePartner: vi.fn().mockResolvedValue('https://example.com/invitation/mock-uuid-1234-5678'),
  disconnectPartner: vi.fn().mockResolvedValue(undefined),
  refreshUser: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});
