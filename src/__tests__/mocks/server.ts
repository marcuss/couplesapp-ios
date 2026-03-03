import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

const SUPABASE_URL = 'https://rdmjheytzgnewwslgbtk.supabase.co';

// Default handlers for Supabase REST API
export const handlers = [
  // Profiles
  http.get(`${SUPABASE_URL}/rest/v1/profiles`, () => {
    return HttpResponse.json([
      { id: 'user-1', email: 'alice@example.com', name: 'Alice', partner_id: null },
    ]);
  }),

  http.patch(`${SUPABASE_URL}/rest/v1/profiles`, () => {
    return HttpResponse.json([]);
  }),

  // Goals
  http.get(`${SUPABASE_URL}/rest/v1/goals`, () => {
    return HttpResponse.json([
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
    ]);
  }),

  http.post(`${SUPABASE_URL}/rest/v1/goals`, () => {
    return HttpResponse.json([{ id: 'goal-new' }], { status: 201 });
  }),

  http.patch(`${SUPABASE_URL}/rest/v1/goals`, () => {
    return HttpResponse.json([]);
  }),

  http.delete(`${SUPABASE_URL}/rest/v1/goals`, () => {
    return HttpResponse.json([]);
  }),

  // Budgets
  http.get(`${SUPABASE_URL}/rest/v1/budgets`, () => {
    return HttpResponse.json([
      {
        id: 'budget-1',
        category: 'Groceries',
        amount: 500,
        spent: 250,
        year: 2026,
        created_by: 'user-1',
        created_at: '2026-01-01T00:00:00Z',
      },
    ]);
  }),

  http.post(`${SUPABASE_URL}/rest/v1/budgets`, () => {
    return HttpResponse.json([{ id: 'budget-new' }], { status: 201 });
  }),

  http.patch(`${SUPABASE_URL}/rest/v1/budgets`, () => {
    return HttpResponse.json([]);
  }),

  http.delete(`${SUPABASE_URL}/rest/v1/budgets`, () => {
    return HttpResponse.json([]);
  }),

  // Expenses
  http.get(`${SUPABASE_URL}/rest/v1/expenses`, () => {
    return HttpResponse.json([]);
  }),

  http.post(`${SUPABASE_URL}/rest/v1/expenses`, () => {
    return HttpResponse.json([{ id: 'expense-new' }], { status: 201 });
  }),

  // Events
  http.get(`${SUPABASE_URL}/rest/v1/events`, () => {
    return HttpResponse.json([
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
    ]);
  }),

  http.post(`${SUPABASE_URL}/rest/v1/events`, () => {
    return HttpResponse.json([{ id: 'event-new' }], { status: 201 });
  }),

  http.patch(`${SUPABASE_URL}/rest/v1/events`, () => {
    return HttpResponse.json([]);
  }),

  http.delete(`${SUPABASE_URL}/rest/v1/events`, () => {
    return HttpResponse.json([]);
  }),

  // Tasks
  http.get(`${SUPABASE_URL}/rest/v1/tasks`, () => {
    return HttpResponse.json([
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
    ]);
  }),

  http.post(`${SUPABASE_URL}/rest/v1/tasks`, () => {
    return HttpResponse.json([{ id: 'task-new' }], { status: 201 });
  }),

  http.patch(`${SUPABASE_URL}/rest/v1/tasks`, () => {
    return HttpResponse.json([]);
  }),

  http.delete(`${SUPABASE_URL}/rest/v1/tasks`, () => {
    return HttpResponse.json([]);
  }),

  // Travels
  http.get(`${SUPABASE_URL}/rest/v1/travels`, () => {
    return HttpResponse.json([
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
    ]);
  }),

  http.post(`${SUPABASE_URL}/rest/v1/travels`, () => {
    return HttpResponse.json([{ id: 'travel-new' }], { status: 201 });
  }),

  http.patch(`${SUPABASE_URL}/rest/v1/travels`, () => {
    return HttpResponse.json([]);
  }),

  http.delete(`${SUPABASE_URL}/rest/v1/travels`, () => {
    return HttpResponse.json([]);
  }),

  // Invitations
  http.get(`${SUPABASE_URL}/rest/v1/invitations`, () => {
    return HttpResponse.json([
      {
        id: 'inv-1',
        from_user_id: 'user-1',
        to_email: 'bob@example.com',
        token: 'abc123',
        status: 'pending',
        created_at: '2026-01-01T00:00:00Z',
        inviter: { name: 'Alice', email: 'alice@example.com' },
      },
    ]);
  }),

  http.post(`${SUPABASE_URL}/rest/v1/invitations`, () => {
    return HttpResponse.json([{ id: 'inv-new', token: 'new-token-uuid' }], { status: 201 });
  }),

  http.patch(`${SUPABASE_URL}/rest/v1/invitations`, () => {
    return HttpResponse.json([]);
  }),

  // Supabase Auth
  http.post(`${SUPABASE_URL}/auth/v1/token`, () => {
    return HttpResponse.json({
      access_token: 'mock-access-token',
      token_type: 'bearer',
      user: { id: 'user-1', email: 'alice@example.com' },
    });
  }),

  http.post(`${SUPABASE_URL}/auth/v1/signup`, () => {
    return HttpResponse.json({
      access_token: 'mock-access-token',
      token_type: 'bearer',
      user: { id: 'user-new', email: 'newuser@example.com' },
    });
  }),

  http.post(`${SUPABASE_URL}/auth/v1/logout`, () => {
    return HttpResponse.json({});
  }),

  http.get(`${SUPABASE_URL}/auth/v1/user`, () => {
    return HttpResponse.json({
      id: 'user-1',
      email: 'alice@example.com',
    });
  }),
];

export const server = setupServer(...handlers);
