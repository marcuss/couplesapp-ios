/**
 * Budgets Tests
 * Covers: create budget, add spending, view totals
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { BudgetsPage } from '../presentation/pages/BudgetsPage';
import { AuthContext } from '../presentation/contexts/AuthContext';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});

const mockBudgetsData = [
  {
    id: 'budget-1',
    category: 'Groceries',
    amount: 500,
    spent: 250,
    year: 2026,
    created_by: 'user-1',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'budget-2',
    category: 'Rent',
    amount: 1000,
    spent: 850,
    year: 2026,
    created_by: 'user-1',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'budget-3',
    category: 'Vacation',
    amount: 500,
    spent: 600,
    year: 2026,
    created_by: 'user-1',
    created_at: '2026-01-01T00:00:00Z',
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

const setupMocks = (budgets = mockBudgetsData) => {
  mockSupabaseFrom.mockImplementation((table: string) => {
    if (table === 'budgets') {
      return {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockResolvedValue({ data: [{ id: 'new-budget' }], error: null }),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: budgets, error: null }),
      };
    }
    if (table === 'expenses') {
      return {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockResolvedValue({ data: [{ id: 'new-expense' }], error: null }),
        in: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
    }
    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    };
  });
};

const renderBudgets = (budgets = mockBudgetsData) => {
  setupMocks(budgets);
  const mockAuth = createAuthContext();
  return render(
    <AuthContext.Provider value={mockAuth}>
      <MemoryRouter>
        <BudgetsPage />
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe('Budgets', () => {
  beforeEach(() => {
    mockSupabaseFrom.mockReset();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  it('shows empty state when no budgets', async () => {
    renderBudgets([]);
    await waitFor(() => {
      expect(screen.getByText('No budgets yet')).toBeInTheDocument();
    });
  });

  it('shows budget cards', async () => {
    renderBudgets();
    await waitFor(() => {
      expect(screen.getByText('Groceries')).toBeInTheDocument();
      expect(screen.getByText('Rent')).toBeInTheDocument();
    });
  });

  it('shows budget amounts', async () => {
    renderBudgets();
    await waitFor(() => {
      // Multiple "$500.00" can appear (budget amount + in expenses), use getAllByText
      expect(screen.getAllByText('$500.00').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('$1000.00').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows spent amounts on budget cards', async () => {
    renderBudgets();
    await waitFor(() => {
      expect(screen.getByText('Spent: $250.00')).toBeInTheDocument();
    });
  });

  it('shows remaining budget when under budget', async () => {
    renderBudgets();
    await waitFor(() => {
      expect(screen.getByText('$250.00 left')).toBeInTheDocument();
    });
  });

  it('shows over-budget indicator', async () => {
    renderBudgets();
    await waitFor(() => {
      expect(screen.getByText('$100.00 over')).toBeInTheDocument();
    });
  });

  it('opens New Budget form', async () => {
    renderBudgets();
    await waitFor(() => expect(screen.getByTestId('new-budget-button')).toBeInTheDocument());
    await userEvent.click(screen.getByTestId('new-budget-button'));
    // Modal is open - Cancel button only appears in modal
    await waitFor(() => expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument());
  });

  it('shows expenses count on budget card', async () => {
    renderBudgets();
    await waitFor(() => {
      expect(screen.getAllByText(/View Expenses \(0\)/)).toHaveLength(mockBudgetsData.length);
    });
  });

  it('shows view expenses button', async () => {
    renderBudgets();
    await waitFor(() => {
      const viewExpensesButtons = screen.getAllByText(/View Expenses/);
      expect(viewExpensesButtons.length).toBeGreaterThan(0);
    });
  });

  it('shows percentage on progress bar', async () => {
    renderBudgets();
    await waitFor(() => {
      expect(screen.getByText('50%')).toBeInTheDocument();
    });
  });
});
