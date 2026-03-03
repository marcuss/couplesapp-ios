/**
 * Invitation Tests
 * Covers: send invite, accept invite via token, decline invite
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { InvitePartnerPage } from '../presentation/pages/InvitePartnerPage';
import { InvitationPage } from '../presentation/pages/InvitationPage';
import { AuthContext } from '../presentation/contexts/AuthContext';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@emailjs/browser', () => ({
  default: { send: vi.fn().mockResolvedValue({}) },
}));

const mockSupabaseFrom = vi.fn();
vi.mock('../infrastructure/repositories/supabaseClient', () => ({
  supabase: {
    from: (...args: unknown[]) => mockSupabaseFrom(...args),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-2', email: 'bob@example.com' } },
        error: null,
      }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
}));

const mockUser = { id: 'user-1', email: 'alice@example.com', name: 'Alice', partner_id: null };

const createAuthContext = (overrides = {}) => ({
  user: mockUser,
  partner: null,
  loading: false,
  login: vi.fn(),
  signup: vi.fn(),
  logout: vi.fn(),
  invitePartner: vi.fn().mockResolvedValue('https://app.example.com/invitation/mock-uuid-1234-5678'),
  disconnectPartner: vi.fn(),
  refreshUser: vi.fn(),
  ...overrides,
});

const renderInvitePartner = (authOverrides = {}) => {
  const mockAuth = createAuthContext(authOverrides);
  return render(
    <AuthContext.Provider value={mockAuth}>
      <MemoryRouter>
        <InvitePartnerPage />
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

const renderInvitationPage = (token: string, authOverrides = {}) => {
  const mockAuth = createAuthContext(authOverrides);
  return render(
    <AuthContext.Provider value={mockAuth}>
      <MemoryRouter initialEntries={[`/invitation/${token}`]}>
        <Routes>
          <Route path="/invitation/:token" element={<InvitationPage />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe('Invite Partner Page', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockSupabaseFrom.mockReset();
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  it('renders invite partner form', () => {
    renderInvitePartner();
    expect(screen.getByText('Invite Your Partner')).toBeInTheDocument();
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('send-invitation-button')).toBeInTheDocument();
  });

  it('calls invitePartner with entered email', async () => {
    const mockInvite = vi.fn().mockResolvedValue('https://app.example.com/invitation/token123');
    renderInvitePartner({ invitePartner: mockInvite });

    await userEvent.type(screen.getByTestId('email-input'), 'bob@example.com');
    await userEvent.click(screen.getByTestId('send-invitation-button'));

    await waitFor(() => {
      expect(mockInvite).toHaveBeenCalledWith('bob@example.com');
    });
  });

  it('shows success state after invitation created', async () => {
    const mockInvite = vi.fn().mockResolvedValue('https://app.example.com/invitation/token123');
    renderInvitePartner({ invitePartner: mockInvite });

    await userEvent.type(screen.getByTestId('email-input'), 'bob@example.com');
    await userEvent.click(screen.getByTestId('send-invitation-button'));

    await waitFor(() => {
      expect(screen.getByTestId('invitation-success')).toBeInTheDocument();
      expect(screen.getByTestId('invitation-url')).toBeInTheDocument();
    });
  });

  it('shows the invitation URL after success', async () => {
    const url = 'https://app.example.com/invitation/token123';
    const mockInvite = vi.fn().mockResolvedValue(url);
    renderInvitePartner({ invitePartner: mockInvite });

    await userEvent.type(screen.getByTestId('email-input'), 'bob@example.com');
    await userEvent.click(screen.getByTestId('send-invitation-button'));

    await waitFor(() => {
      const urlInput = screen.getByTestId('invitation-url') as HTMLInputElement;
      expect(urlInput.value).toBe(url);
    });
  });

  it('shows copy link button', async () => {
    const mockInvite = vi.fn().mockResolvedValue('https://app.example.com/invitation/token123');
    renderInvitePartner({ invitePartner: mockInvite });

    await userEvent.type(screen.getByTestId('email-input'), 'bob@example.com');
    await userEvent.click(screen.getByTestId('send-invitation-button'));

    await waitFor(() => {
      expect(screen.getByTestId('copy-link-button')).toBeInTheDocument();
    });
  });

  it('copies link to clipboard when copy button is clicked', async () => {
    const mockInvite = vi.fn().mockResolvedValue('https://app.example.com/invitation/token123');
    renderInvitePartner({ invitePartner: mockInvite });

    await userEvent.type(screen.getByTestId('email-input'), 'bob@example.com');
    await userEvent.click(screen.getByTestId('send-invitation-button'));

    await waitFor(() => expect(screen.getByTestId('copy-link-button')).toBeInTheDocument());
    await userEvent.click(screen.getByTestId('copy-link-button'));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'https://app.example.com/invitation/token123'
      );
    });
  });

  it('shows error when invitation fails', async () => {
    const mockInvite = vi.fn().mockRejectedValue(new Error('Network error'));
    renderInvitePartner({ invitePartner: mockInvite });

    await userEvent.type(screen.getByTestId('email-input'), 'bob@example.com');
    await userEvent.click(screen.getByTestId('send-invitation-button'));

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });
  });

  it('send button is disabled when email is empty', () => {
    renderInvitePartner();
    expect(screen.getByTestId('send-invitation-button')).toBeDisabled();
  });
});

describe('Invitation Page - Accept/Reject', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockSupabaseFrom.mockReset();
  });

  const setupPendingInvitation = () => {
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      update: vi.fn().mockResolvedValue({ data: [], error: null }),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'inv-1',
          from_user_id: 'user-1',
          to_email: 'bob@example.com',
          token: 'abc123',
          status: 'pending',
          created_at: '2026-01-01T00:00:00Z',
          inviter: { name: 'Alice', email: 'alice@example.com' },
        },
        error: null,
      }),
    });
  };

  it('shows loading state initially', () => {
    setupPendingInvitation();
    renderInvitationPage('abc123');
    expect(screen.getByText('Loading invitation...')).toBeInTheDocument();
  });

  it('shows invitation details after loading', async () => {
    setupPendingInvitation();
    renderInvitationPage('abc123');

    await waitFor(() => {
      expect(screen.getByText('Partner Invitation')).toBeInTheDocument();
      expect(screen.getByText(/Alice/)).toBeInTheDocument();
    });
  });

  it('shows accept and decline buttons', async () => {
    setupPendingInvitation();
    renderInvitationPage('abc123');

    await waitFor(() => {
      expect(screen.getByTestId('accept-button')).toBeInTheDocument();
      expect(screen.getByTestId('reject-button')).toBeInTheDocument();
    });
  });

  it('shows error for already accepted invitation', async () => {
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 'inv-1', status: 'accepted', token: 'accepted-token' },
        error: null,
      }),
    });
    renderInvitationPage('accepted-token');

    await waitFor(() => {
      expect(screen.getByText('This invitation has already been accepted')).toBeInTheDocument();
    });
  });

  it('shows error for rejected invitation', async () => {
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 'inv-1', status: 'rejected', token: 'rejected-token' },
        error: null,
      }),
    });
    renderInvitationPage('rejected-token');

    await waitFor(() => {
      expect(screen.getByText('This invitation has been rejected')).toBeInTheDocument();
    });
  });

  it('shows error for invalid invitation token', async () => {
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
    });
    renderInvitationPage('invalid-token');

    await waitFor(() => {
      expect(screen.getByText('Invitation not found or has expired')).toBeInTheDocument();
    });
  });
});
