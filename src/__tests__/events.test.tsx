/**
 * Events Tests
 * Covers: create, view, edit, delete events by date, filter by today/upcoming/past
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { EventsPage } from '../presentation/pages/EventsPage';
import { AuthContext } from '../presentation/contexts/AuthContext';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});

const today = new Date().toISOString().split('T')[0];
const pastDate = '2025-01-01';
const futureDate = '2027-12-31';

const mockEventsData = [
  {
    id: 'event-today',
    title: 'Anniversary Dinner',
    description: 'Special restaurant',
    date: today,
    time: '19:00',
    type: 'shared',
    color: '#2A7F7B',
    user_id: 'user-1',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'event-future',
    title: 'Birthday Party',
    description: null,
    date: futureDate,
    time: '15:00',
    type: 'personal',
    color: '#2B3A55',
    user_id: 'user-1',
    created_at: '2026-01-02T00:00:00Z',
  },
  {
    id: 'event-past',
    title: 'Old Meeting',
    description: null,
    date: pastDate,
    time: null,
    type: 'personal',
    color: '#8E7A8A',
    user_id: 'user-1',
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

const renderEvents = (events = mockEventsData) => {
  mockSupabaseFrom.mockReturnValue({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockResolvedValue({ data: [{ id: 'new-event' }], error: null }),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: events, error: null }),
  });
  const mockAuth = createAuthContext();
  return render(
    <AuthContext.Provider value={mockAuth}>
      <MemoryRouter>
        <EventsPage />
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe('Events', () => {
  beforeEach(() => {
    mockSupabaseFrom.mockReset();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  it('shows empty state when no events', async () => {
    renderEvents([]);
    await waitFor(() => {
      expect(screen.getByText('No events yet')).toBeInTheDocument();
    });
  });

  it('shows all events in the list', async () => {
    renderEvents();
    await waitFor(() => {
      expect(screen.getByText('Anniversary Dinner')).toBeInTheDocument();
      expect(screen.getByText('Birthday Party')).toBeInTheDocument();
      expect(screen.getByText('Old Meeting')).toBeInTheDocument();
    });
  });

  it("marks today's event with 'Today' badge", async () => {
    renderEvents();
    await waitFor(() => {
      expect(screen.getByText('Today')).toBeInTheDocument();
    });
  });

  it('shows event time when available', async () => {
    renderEvents();
    await waitFor(() => {
      expect(screen.getByText('19:00')).toBeInTheDocument();
      expect(screen.getByText('15:00')).toBeInTheDocument();
    });
  });

  it('shows Shared and Personal type badges', async () => {
    renderEvents();
    await waitFor(() => {
      expect(screen.getByText('Shared')).toBeInTheDocument();
      expect(screen.getAllByText('Personal').length).toBeGreaterThan(0);
    });
  });

  it('opens new event form when button is clicked', async () => {
    renderEvents();
    await waitFor(() => expect(screen.getByTestId('new-event-button')).toBeInTheDocument());
    await userEvent.click(screen.getByTestId('new-event-button'));
    // Modal heading should appear
    expect(screen.getAllByText('New Event').length).toBeGreaterThanOrEqual(1);
    // Form fields should be visible
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('shows event type options in form', async () => {
    renderEvents();
    await waitFor(() => expect(screen.getByTestId('new-event-button')).toBeInTheDocument());
    await userEvent.click(screen.getByTestId('new-event-button'));
    expect(screen.getByRole('option', { name: 'Personal' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Shared' })).toBeInTheDocument();
  });

  it('closes form when Cancel is clicked', async () => {
    renderEvents();
    await waitFor(() => expect(screen.getByTestId('new-event-button')).toBeInTheDocument());
    await userEvent.click(screen.getByTestId('new-event-button'));
    // Form should be open
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    // Cancel button should be gone
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
  });

  it('has filter options for events', async () => {
    renderEvents();
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'All Events' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Today' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Upcoming' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Past' })).toBeInTheDocument();
    });
  });

  it('filters to show only today events', async () => {
    renderEvents();
    await waitFor(() => expect(screen.getByText('Anniversary Dinner')).toBeInTheDocument());

    const filterSelect = screen.getByRole('combobox');
    await userEvent.selectOptions(filterSelect, 'today');

    await waitFor(() => {
      expect(screen.getByText('Anniversary Dinner')).toBeInTheDocument();
      expect(screen.queryByText('Birthday Party')).not.toBeInTheDocument();
      expect(screen.queryByText('Old Meeting')).not.toBeInTheDocument();
    });
  });

  it('filters to show only upcoming events', async () => {
    renderEvents();
    await waitFor(() => expect(screen.getByText('Birthday Party')).toBeInTheDocument());

    const filterSelect = screen.getByRole('combobox');
    await userEvent.selectOptions(filterSelect, 'upcoming');

    await waitFor(() => {
      expect(screen.getByText('Birthday Party')).toBeInTheDocument();
      expect(screen.queryByText('Old Meeting')).not.toBeInTheDocument();
    });
  });

  it('filters to show only past events', async () => {
    renderEvents();
    await waitFor(() => expect(screen.getByText('Old Meeting')).toBeInTheDocument());

    const filterSelect = screen.getByRole('combobox');
    await userEvent.selectOptions(filterSelect, 'past');

    await waitFor(() => {
      expect(screen.getByText('Old Meeting')).toBeInTheDocument();
      expect(screen.queryByText('Birthday Party')).not.toBeInTheDocument();
      // Today's event shouldn't be in past
      expect(screen.queryByText('Anniversary Dinner')).not.toBeInTheDocument();
    });
  });

  it('shows color picker in event form', async () => {
    renderEvents();
    await waitFor(() => expect(screen.getByTestId('new-event-button')).toBeInTheDocument());
    await userEvent.click(screen.getByTestId('new-event-button'));
    expect(screen.getByText('Color')).toBeInTheDocument();
  });
});
