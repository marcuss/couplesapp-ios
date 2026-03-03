/**
 * Authentication Tests
 * Covers: login, signup, logout scenarios from features.feature
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from '../presentation/pages/LoginPage';
import { SignupPage } from '../presentation/pages/SignupPage';
import { AuthContext } from '../presentation/contexts/AuthContext';

// Mock react-router-dom's useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock the supabase client
vi.mock('../infrastructure/repositories/supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  },
}));

// Mock emailjs
vi.mock('@emailjs/browser', () => ({
  default: { send: vi.fn().mockResolvedValue({}) },
}));

const createMockAuthContext = (overrides = {}) => ({
  user: null,
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

const renderLogin = (authOverrides = {}) => {
  const mockAuth = createMockAuthContext(authOverrides);
  return render(
    <AuthContext.Provider value={mockAuth}>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

const renderSignup = (authOverrides = {}) => {
  const mockAuth = createMockAuthContext(authOverrides);
  return render(
    <AuthContext.Provider value={mockAuth}>
      <MemoryRouter>
        <SignupPage />
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe('Authentication - Login', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders the login form', () => {
    renderLogin();
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByTestId('login-button')).toBeInTheDocument();
  });

  it('calls login with entered credentials when form is submitted', async () => {
    const mockLogin = vi.fn().mockResolvedValue(undefined);
    renderLogin({ login: mockLogin });

    await userEvent.type(screen.getByTestId('email-input'), 'user@example.com');
    await userEvent.type(screen.getByTestId('password-input'), 'password123');
    await userEvent.click(screen.getByTestId('login-button'));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('user@example.com', 'password123');
    });
  });

  it('navigates to dashboard after successful login', async () => {
    const mockLogin = vi.fn().mockResolvedValue(undefined);
    renderLogin({ login: mockLogin });

    await userEvent.type(screen.getByTestId('email-input'), 'user@example.com');
    await userEvent.type(screen.getByTestId('password-input'), 'password123');
    await userEvent.click(screen.getByTestId('login-button'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('shows error message on login failure', async () => {
    const mockLogin = vi.fn().mockRejectedValue(new Error('Invalid login credentials'));
    renderLogin({ login: mockLogin });

    await userEvent.type(screen.getByTestId('email-input'), 'wrong@example.com');
    await userEvent.type(screen.getByTestId('password-input'), 'wrongpassword');
    await userEvent.click(screen.getByTestId('login-button'));

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(screen.getByText('Invalid login credentials')).toBeInTheDocument();
    });
  });

  it('shows loading state while submitting', async () => {
    let resolveLogin: () => void;
    const mockLogin = vi.fn().mockReturnValue(
      new Promise<void>((resolve) => { resolveLogin = resolve; })
    );
    renderLogin({ login: mockLogin });

    await userEvent.type(screen.getByTestId('email-input'), 'user@example.com');
    await userEvent.type(screen.getByTestId('password-input'), 'password123');
    await userEvent.click(screen.getByTestId('login-button'));

    // Button should be disabled during loading
    await waitFor(() => {
      expect(screen.getByTestId('login-button')).toBeDisabled();
    });

    resolveLogin!();
  });

  it('has a link to the signup page', () => {
    renderLogin();
    expect(screen.getByText('Sign up')).toBeInTheDocument();
  });

  it('displays both email and password fields as required', () => {
    renderLogin();
    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    expect(emailInput).toBeRequired();
    expect(passwordInput).toBeRequired();
  });
});

describe('Authentication - Signup', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders the signup form', () => {
    renderSignup();
    expect(screen.getByText('Create Account')).toBeInTheDocument();
    expect(screen.getByTestId('name-input')).toBeInTheDocument();
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByTestId('signup-button')).toBeInTheDocument();
  });

  it('calls signup with entered details when form is submitted', async () => {
    const mockSignup = vi.fn().mockResolvedValue(undefined);
    renderSignup({ signup: mockSignup });

    await userEvent.type(screen.getByTestId('name-input'), 'John Doe');
    await userEvent.type(screen.getByTestId('email-input'), 'newuser@example.com');
    await userEvent.type(screen.getByTestId('password-input'), 'securepassword');
    await userEvent.click(screen.getByTestId('signup-button'));

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith(
        'newuser@example.com',
        'securepassword',
        'John Doe'
      );
    });
  });

  it('navigates to dashboard after successful signup', async () => {
    const mockSignup = vi.fn().mockResolvedValue(undefined);
    renderSignup({ signup: mockSignup });

    await userEvent.type(screen.getByTestId('name-input'), 'John Doe');
    await userEvent.type(screen.getByTestId('email-input'), 'newuser@example.com');
    await userEvent.type(screen.getByTestId('password-input'), 'securepassword');
    await userEvent.click(screen.getByTestId('signup-button'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('shows error message on signup failure', async () => {
    const mockSignup = vi.fn().mockRejectedValue(
      new Error('User already registered')
    );
    renderSignup({ signup: mockSignup });

    await userEvent.type(screen.getByTestId('name-input'), 'Jane Doe');
    await userEvent.type(screen.getByTestId('email-input'), 'existing@example.com');
    await userEvent.type(screen.getByTestId('password-input'), 'password123');
    await userEvent.click(screen.getByTestId('signup-button'));

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(screen.getByText('User already registered')).toBeInTheDocument();
    });
  });

  it('has a link to the login page', () => {
    renderSignup();
    expect(screen.getByText('Sign in')).toBeInTheDocument();
  });

  it('all fields are required', () => {
    renderSignup();
    expect(screen.getByTestId('name-input')).toBeRequired();
    expect(screen.getByTestId('email-input')).toBeRequired();
    expect(screen.getByTestId('password-input')).toBeRequired();
  });
});
