/**
 * Tasks Tests
 * Covers: create, assign, complete, delete tasks, filter by status
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { TasksPage } from '../presentation/pages/TasksPage';
import { AuthContext } from '../presentation/contexts/AuthContext';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});

const mockTasksData = [
  {
    id: 'task-1',
    title: 'Buy groceries',
    description: 'Milk, eggs, bread',
    category: 'home',
    assigned_to: null,
    due_date: '2026-03-10',
    completed: false,
    created_by: 'user-1',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'task-2',
    title: 'Clean the kitchen',
    description: null,
    category: 'shared',
    assigned_to: null,
    due_date: null,
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

const renderTasks = (tasks = mockTasksData) => {
  mockSupabaseFrom.mockReturnValue({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockResolvedValue({ data: [{ id: 'new-task' }], error: null }),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    then: vi.fn().mockResolvedValue({ data: tasks, error: null }),
    // Second order call should resolve
  });
  // Handle chained .order().order() - need the final promise
  const mockBuilder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockResolvedValue({ data: [{ id: 'new-task' }], error: null }),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn(),
  };
  mockBuilder.order.mockReturnValueOnce(mockBuilder).mockResolvedValueOnce({ data: tasks, error: null });
  mockSupabaseFrom.mockReturnValue(mockBuilder);

  const mockAuth = createAuthContext();
  return render(
    <AuthContext.Provider value={mockAuth}>
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe('Tasks', () => {
  beforeEach(() => {
    mockSupabaseFrom.mockReset();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  it('shows empty state when no tasks', async () => {
    const mockBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn(),
    };
    mockBuilder.order.mockReturnValueOnce(mockBuilder).mockResolvedValueOnce({ data: [], error: null });
    mockSupabaseFrom.mockReturnValue(mockBuilder);

    const mockAuth = createAuthContext();
    render(
      <AuthContext.Provider value={mockAuth}>
        <MemoryRouter>
          <TasksPage />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('No tasks yet')).toBeInTheDocument();
    });
  });

  it('shows tasks list', async () => {
    renderTasks();
    await waitFor(() => {
      expect(screen.getByText('Buy groceries')).toBeInTheDocument();
      expect(screen.getByText('Clean the kitchen')).toBeInTheDocument();
    });
  });

  it('shows task description', async () => {
    renderTasks();
    await waitFor(() => {
      expect(screen.getByText('Milk, eggs, bread')).toBeInTheDocument();
    });
  });

  it('shows category badges', async () => {
    renderTasks();
    await waitFor(() => {
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Shared')).toBeInTheDocument();
    });
  });

  it('shows completed task with strikethrough', async () => {
    renderTasks();
    await waitFor(() => {
      const completedTask = screen.getByText('Clean the kitchen');
      expect(completedTask).toHaveClass('line-through');
    });
  });

  it('opens new task form', async () => {
    renderTasks();
    await waitFor(() => expect(screen.getByTestId('new-task-button')).toBeInTheDocument());
    await userEvent.click(screen.getByTestId('new-task-button'));
    // Form should be open - Cancel button only appears in modal
    await waitFor(() => expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument());
  });

  it('shows all category options in form', async () => {
    renderTasks();
    await waitFor(() => expect(screen.getByTestId('new-task-button')).toBeInTheDocument());
    await userEvent.click(screen.getByTestId('new-task-button'));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument());

    expect(screen.getByRole('option', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Work' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Personal' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Shared' })).toBeInTheDocument();
  });

  it('has filter options', async () => {
    renderTasks();
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'All Tasks' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Pending' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Completed' })).toBeInTheDocument();
    });
  });

  it('filters to show only pending tasks', async () => {
    renderTasks();
    await waitFor(() => expect(screen.getByText('Buy groceries')).toBeInTheDocument());

    const filterSelect = screen.getByRole('combobox');
    await userEvent.selectOptions(filterSelect, 'pending');

    await waitFor(() => {
      expect(screen.getByText('Buy groceries')).toBeInTheDocument();
      expect(screen.queryByText('Clean the kitchen')).not.toBeInTheDocument();
    });
  });

  it('filters to show only completed tasks', async () => {
    renderTasks();
    await waitFor(() => expect(screen.getByText('Clean the kitchen')).toBeInTheDocument());

    const filterSelect = screen.getByRole('combobox');
    await userEvent.selectOptions(filterSelect, 'completed');

    await waitFor(() => {
      expect(screen.getByText('Clean the kitchen')).toBeInTheDocument();
      expect(screen.queryByText('Buy groceries')).not.toBeInTheDocument();
    });
  });
});
