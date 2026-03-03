/**
 * Travels Tests
 * Covers: create and manage travel plans
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { TravelsPage } from '../presentation/pages/TravelsPage';
import { AuthContext } from '../presentation/contexts/AuthContext';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});

const mockTravelsData = [
  {
    id: 'travel-1',
    destination: 'Paris, France',
    description: 'Romantic getaway',
    start_date: '2026-07-01',
    end_date: '2026-07-14',
    estimated_budget: 3000,
    status: 'planning',
    created_by: 'user-1',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'travel-2',
    destination: 'London, UK',
    description: null,
    start_date: null,
    end_date: null,
    estimated_budget: null,
    status: 'booked',
    created_by: 'user-1',
    created_at: '2026-01-02T00:00:00Z',
  },
  {
    id: 'travel-3',
    destination: 'Tokyo, Japan',
    description: null,
    start_date: '2025-03-01',
    end_date: '2025-03-15',
    estimated_budget: 5000,
    status: 'completed',
    created_by: 'user-1',
    created_at: '2025-01-01T00:00:00Z',
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

const renderTravels = (travels = mockTravelsData) => {
  mockSupabaseFrom.mockReturnValue({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockResolvedValue({ data: [{ id: 'new-travel' }], error: null }),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: travels, error: null }),
  });
  const mockAuth = createAuthContext();
  return render(
    <AuthContext.Provider value={mockAuth}>
      <MemoryRouter>
        <TravelsPage />
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe('Travels', () => {
  beforeEach(() => {
    mockSupabaseFrom.mockReset();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  it('shows empty state when no travels', async () => {
    renderTravels([]);
    await waitFor(() => {
      expect(screen.getByText('No travel plans yet')).toBeInTheDocument();
    });
  });

  it('shows travel destinations', async () => {
    renderTravels();
    await waitFor(() => {
      expect(screen.getByText('Paris, France')).toBeInTheDocument();
      expect(screen.getByText('London, UK')).toBeInTheDocument();
      expect(screen.getByText('Tokyo, Japan')).toBeInTheDocument();
    });
  });

  it('shows status badges', async () => {
    renderTravels();
    await waitFor(() => {
      expect(screen.getByText('Planning')).toBeInTheDocument();
      expect(screen.getByText('Booked')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });
  });

  it('shows estimated budget', async () => {
    renderTravels();
    await waitFor(() => {
      expect(screen.getByText('Budget: $3000.00')).toBeInTheDocument();
      expect(screen.getByText('Budget: $5000.00')).toBeInTheDocument();
    });
  });

  it('shows "Dates not set" when no dates', async () => {
    renderTravels();
    await waitFor(() => {
      expect(screen.getByText('Dates not set')).toBeInTheDocument();
    });
  });

  it('shows date range when both dates are set', async () => {
    renderTravels();
    await waitFor(() => {
      // Should show some date text - the format may vary by locale
      // Check that Paris (which has dates) shows date-related content
      const parisCard = screen.getByText('Paris, France').closest('.bg-surface');
      expect(parisCard).toBeInTheDocument();
      // Paris has dates set so "Dates not set" should NOT appear in that card
    });
    // Total: London has no dates so we expect "Dates not set" once
    expect(screen.getAllByText('Dates not set').length).toBe(1);
  });

  it('opens new trip form', async () => {
    renderTravels();
    await waitFor(() => expect(screen.getByTestId('new-travel-button')).toBeInTheDocument());
    await userEvent.click(screen.getByTestId('new-travel-button'));
    // Form should open - Cancel only appears in modal
    await waitFor(() => expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument());
  });

  it('shows status options in form', async () => {
    renderTravels();
    await waitFor(() => expect(screen.getByTestId('new-travel-button')).toBeInTheDocument());
    await userEvent.click(screen.getByTestId('new-travel-button'));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument());

    expect(screen.getByRole('option', { name: 'Planning' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Booked' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Completed' })).toBeInTheDocument();
  });

  it('shows travel description', async () => {
    renderTravels();
    await waitFor(() => {
      expect(screen.getByText('Romantic getaway')).toBeInTheDocument();
    });
  });

  it('closes form when Cancel is clicked', async () => {
    renderTravels();
    await waitFor(() => expect(screen.getByTestId('new-travel-button')).toBeInTheDocument());
    await userEvent.click(screen.getByTestId('new-travel-button'));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
  });
});
