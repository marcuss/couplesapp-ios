// Mock Supabase client for testing
import { vi } from 'vitest';

// Default mock user
export const mockUser = {
  id: 'user-1',
  email: 'alice@example.com',
  name: 'Alice',
  partner_id: null,
};

export const mockPartner = {
  id: 'user-2',
  email: 'bob@example.com',
  name: 'Bob',
};

export const mockGoals = [
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

export const mockBudgets = [
  {
    id: 'budget-1',
    category: 'Groceries',
    amount: 500,
    spent: 250,
    year: 2026,
    created_by: 'user-1',
    created_at: '2026-01-01T00:00:00Z',
  },
];

export const mockEvents = [
  {
    id: 'event-1',
    title: 'Anniversary Dinner',
    description: 'Special restaurant',
    date: '2026-06-15',
    time: '19:00',
    type: 'shared',
    color: '#2A7F7B',
    user_id: 'user-1',
    created_at: '2026-01-01T00:00:00Z',
  },
];

export const mockTasks = [
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
];

export const mockTravels = [
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
];

export const mockInvitations = [
  {
    id: 'inv-1',
    from_user_id: 'user-1',
    to_email: 'bob@example.com',
    token: 'abc123',
    status: 'pending',
    created_at: '2026-01-01T00:00:00Z',
    inviter: { name: 'Alice', email: 'alice@example.com' },
  },
];

// Create mock Supabase client
const createMockSupabase = () => {
  const mockFrom = vi.fn();
  
  const createQueryBuilder = (data: unknown[] | null = [], error: unknown = null) => {
    const builder = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: data?.[0] ?? null, error }),
      then: undefined as unknown,
    };
    // Make the builder thenable (resolves to { data, error })
    builder.then = (resolve: (v: { data: unknown; error: unknown }) => void) => {
      return Promise.resolve({ data, error }).then(resolve);
    };
    return builder;
  };

  mockFrom.mockImplementation((table: string) => {
    switch (table) {
      case 'goals':
        return createQueryBuilder(mockGoals);
      case 'budgets':
        return createQueryBuilder(mockBudgets);
      case 'expenses':
        return createQueryBuilder([]);
      case 'events':
        return createQueryBuilder(mockEvents);
      case 'tasks':
        return createQueryBuilder(mockTasks);
      case 'travels':
        return createQueryBuilder(mockTravels);
      case 'invitations':
        return createQueryBuilder(mockInvitations);
      case 'profiles':
        return createQueryBuilder([{ ...mockUser }]);
      default:
        return createQueryBuilder([]);
    }
  });

  return {
    from: mockFrom,
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-1', email: 'alice@example.com' } },
        error: null,
      }),
      signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
      signUp: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-1', email: 'alice@example.com' } },
        error: null,
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
  };
};

export const mockSupabase = createMockSupabase();
