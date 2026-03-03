/**
 * Profile Tests
 * Covers: view profile, view partner info, disconnect partner
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ProfilePage } from '../presentation/pages/ProfilePage';
import { AuthContext } from '../presentation/contexts/AuthContext';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockSupabaseFrom = vi.fn();
vi.mock('../infrastructure/repositories/supabaseClient', () => ({
  supabase: {
    from: (...args: unknown[]) => mockSupabaseFrom(...args),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
}));

const mockUser = { id: 'user-1', email: 'alice@example.com', name: 'Alice', partner_id: null };
const mockPartner = { id: 'user-2', email: 'bob@example.com', name: 'Bob' };

const createAuthContext = (overrides = {}) => ({
  user: mockUser,
  partner: null,
  loading: false,
  login: vi.fn(),
  signup: vi.fn(),
  logout: vi.fn(),
  invitePartner: vi.fn(),
  disconnectPartner: vi.fn(),
  refreshUser: vi.fn(),
  ...overrides,
});

const renderProfile = (authOverrides = {}) => {
  mockSupabaseFrom.mockReturnValue({
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    then: vi.fn().mockResolvedValue({ data: [], error: null }),
  });
  const mockAuth = createAuthContext(authOverrides);
  return render(
    <AuthContext.Provider value={mockAuth}>
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe('Profile', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockSupabaseFrom.mockReset();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  it('shows profile name', async () => {
    renderProfile();
    await waitFor(() => {
      expect(screen.getByTestId('profile-name')).toHaveTextContent('Alice');
    });
  });

  it('shows user email', async () => {
    renderProfile();
    await waitFor(() => {
      expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    });
  });

  it('shows partner section', async () => {
    renderProfile();
    await waitFor(() => {
      expect(screen.getByTestId('partner-section')).toBeInTheDocument();
    });
  });

  it('shows "not connected" state when no partner', async () => {
    renderProfile({ partner: null });
    await waitFor(() => {
      expect(screen.getByText('Not connected to a partner')).toBeInTheDocument();
    });
  });

  it('shows invite partner button when no partner', async () => {
    renderProfile({ partner: null });
    await waitFor(() => {
      expect(screen.getByTestId('invite-partner-button')).toBeInTheDocument();
    });
  });

  it('shows partner info when connected', async () => {
    renderProfile({ partner: mockPartner });
    await waitFor(() => {
      expect(screen.getByTestId('partner-info')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('bob@example.com')).toBeInTheDocument();
    });
  });

  it('shows Connected status badge when partner is connected', async () => {
    renderProfile({ partner: mockPartner });
    await waitFor(() => {
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });
  });

  it('shows disconnect button when partner is connected', async () => {
    renderProfile({ partner: mockPartner });
    await waitFor(() => {
      expect(screen.getByTestId('disconnect-button')).toBeInTheDocument();
    });
  });

  it('calls disconnectPartner when disconnect button clicked and confirmed', async () => {
    const mockDisconnect = vi.fn().mockResolvedValue(undefined);
    renderProfile({ partner: mockPartner, disconnectPartner: mockDisconnect });

    await waitFor(() => expect(screen.getByTestId('disconnect-button')).toBeInTheDocument());
    await userEvent.click(screen.getByTestId('disconnect-button'));

    await waitFor(() => {
      expect(mockDisconnect).toHaveBeenCalled();
    });
  });

  it('shows success message after disconnecting', async () => {
    const mockDisconnect = vi.fn().mockResolvedValue(undefined);
    renderProfile({ partner: mockPartner, disconnectPartner: mockDisconnect });

    await waitFor(() => expect(screen.getByTestId('disconnect-button')).toBeInTheDocument());
    await userEvent.click(screen.getByTestId('disconnect-button'));

    await waitFor(() => {
      expect(screen.getByTestId('disconnect-message')).toBeInTheDocument();
      expect(screen.getByText(/Disconnected from Bob/)).toBeInTheDocument();
    });
  });

  it('calls logout when Log Out button clicked', async () => {
    const mockLogout = vi.fn().mockResolvedValue(undefined);
    renderProfile({ logout: mockLogout });

    await waitFor(() => expect(screen.getByText('Log Out')).toBeInTheDocument());
    await userEvent.click(screen.getByText('Log Out'));

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('has back to dashboard link', async () => {
    renderProfile();
    await waitFor(() => {
      expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
    });
  });
});
