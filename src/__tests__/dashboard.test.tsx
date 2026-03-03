/**
 * Dashboard Tests
 * Covers: view dashboard, today's events, navigation to sections
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { DashboardPage } from '../presentation/pages/DashboardPage';
import { AuthContext } from '../presentation/contexts/AuthContext';

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock supabase
const mockSupabaseFrom = vi.fn();
vi.mock('../infrastructure/repositories/supabaseClient', () => ({
  supabase: {
    from: (...args: unknown[]) => mockSupabaseFrom(...args),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1', email: 'alice@example.com' } }, error: null }),
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

const setupDefaultMocks = () => {
  const today = new Date().toISOString().split('T')[0];
  mockSupabaseFrom.mockReturnValue({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({
      data: [
        { id: 'event-1', title: 'Dinner with family', description: null, date: today, time: '19:00', color: '#2A7F7B' },
      ],
      error: null,
    }),
  });
};

const renderDashboard = (authOverrides = {}, setupMocks = true) => {
  if (setupMocks) {
    setupDefaultMocks();
  }

  const mockAuth = createAuthContext(authOverrides);
  return render(
    <AuthContext.Provider value={mockAuth}>
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe('Dashboard', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockSupabaseFrom.mockReset();
  });

  it('renders dashboard title', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByTestId('dashboard-title')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  it('shows welcome message with user name', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText(/Welcome back, Alice!/)).toBeInTheDocument();
    });
  });

  it('shows CouplePlan logo/brand text', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('CouplePlan')).toBeInTheDocument();
    });
  });

  it('shows partner connected status when partner exists', async () => {
    renderDashboard({ partner: mockPartner });
    await waitFor(() => {
      expect(screen.getByText(/Connected with Bob/)).toBeInTheDocument();
    });
  });

  it('shows today events section', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText("Today's Events")).toBeInTheDocument();
    });
  });

  it("shows today's event in event list", async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Dinner with family')).toBeInTheDocument();
      expect(screen.getByText('19:00')).toBeInTheDocument();
    });
  });

  it('shows empty state when no events today', async () => {
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    });
    renderDashboard({}, false);
    await waitFor(() => {
      expect(screen.getByText('No events scheduled for today')).toBeInTheDocument();
    });
  });

  it('shows navigation menu items', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByTestId('goals-link')).toBeInTheDocument();
      expect(screen.getByTestId('budgets-link')).toBeInTheDocument();
      expect(screen.getByTestId('events-link')).toBeInTheDocument();
      expect(screen.getByTestId('tasks-link')).toBeInTheDocument();
    });
  });

  it('has profile link in header', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByTestId('profile-link')).toBeInTheDocument();
    });
  });

  it('shows invite partner CTA when no partner connected', async () => {
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    });
    renderDashboard({ partner: null }, false);
    await waitFor(() => {
      expect(screen.getByText('Connect with Your Partner')).toBeInTheDocument();
      expect(screen.getByText('Invite Partner')).toBeInTheDocument();
    });
  });

  it('does not show invite CTA when partner is connected', async () => {
    renderDashboard({ partner: mockPartner });
    await waitFor(() => {
      expect(screen.queryByText('Connect with Your Partner')).not.toBeInTheDocument();
    });
  });
});
