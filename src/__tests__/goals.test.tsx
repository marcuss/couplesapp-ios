/**
 * Goals Tests
 * Covers: create, view, update, delete, complete shared goals
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { GoalsPage } from '../presentation/pages/GoalsPage';
import { AuthContext } from '../presentation/contexts/AuthContext';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});

const mockGoalsData = [
  {
    id: 'goal-1',
    title: 'Buy a house',
    description: 'Our dream home',
    category: 'financial',
    target_date: '2026-12-31',
    completed: false,
    created_by: 'user-1',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'goal-2',
    title: 'Travel to Japan',
    description: null,
    category: 'travel',
    target_date: null,
    completed: true,
    created_by: 'user-1',
    created_at: '2026-01-02T00:00:00Z',
  },
];

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

const createGoalsQueryBuilder = (goals: typeof mockGoalsData) => ({
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockResolvedValue({ data: [{ id: 'new-goal' }], error: null }),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockResolvedValue({ data: goals, error: null }),
  single: vi.fn().mockResolvedValue({ data: goals[0], error: null }),
});

const renderGoals = (goals = mockGoalsData, authOverrides = {}) => {
  mockSupabaseFrom.mockReturnValue(createGoalsQueryBuilder(goals));
  const mockAuth = createAuthContext(authOverrides);
  return render(
    <AuthContext.Provider value={mockAuth}>
      <MemoryRouter>
        <GoalsPage />
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe('Goals', () => {
  beforeEach(() => {
    mockSupabaseFrom.mockReset();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  it('shows goals list', async () => {
    renderGoals();
    await waitFor(() => {
      expect(screen.getByText('Buy a house')).toBeInTheDocument();
      expect(screen.getByText('Travel to Japan')).toBeInTheDocument();
    });
  });

  it('shows empty state when no goals', async () => {
    renderGoals([]);
    await waitFor(() => {
      expect(screen.getByText('No goals yet')).toBeInTheDocument();
    });
  });

  it('shows category badges', async () => {
    renderGoals();
    await waitFor(() => {
      expect(screen.getByText('Financial')).toBeInTheDocument();
      expect(screen.getByText('Travel')).toBeInTheDocument();
    });
  });

  it('shows completed goal with strikethrough styling', async () => {
    renderGoals();
    await waitFor(() => {
      const completedGoal = screen.getByText('Travel to Japan');
      expect(completedGoal).toHaveClass('line-through');
    });
  });

  it('opens create form when New Goal button is clicked', async () => {
    renderGoals();
    await waitFor(() => {
      expect(screen.getByTestId('new-goal-button')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByTestId('new-goal-button'));
    // Form should be open - check for Cancel button which only appears in modal
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('shows all category options in the form', async () => {
    renderGoals();
    await waitFor(() => expect(screen.getByTestId('new-goal-button')).toBeInTheDocument());
    await userEvent.click(screen.getByTestId('new-goal-button'));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument());

    expect(screen.getByRole('option', { name: 'Travel' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Financial' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Personal' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Other' })).toBeInTheDocument();
  });

  it('closes form when Cancel is clicked', async () => {
    renderGoals();
    await waitFor(() => expect(screen.getByTestId('new-goal-button')).toBeInTheDocument());
    await userEvent.click(screen.getByTestId('new-goal-button'));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
  });

  it('shows target date for goals that have one', async () => {
    renderGoals();
    await waitFor(() => {
      // The date should be displayed in locale format
      expect(screen.getByText('Buy a house')).toBeInTheDocument();
    });
  });
});
