/**
 * CouplePlan Design System - Color Tokens
 * 
 * Research-based romantic color palette:
 * - Rose/Pink: Love, romance, warmth (primary)
 * - Coral: Energy, passion, playfulness (secondary)
 * - Amber/Gold: Happiness, optimism, celebration (accent)
 * - Soft neutrals: Balance, sophistication
 */

export const colors = {
  // Primary - Rose/Pink (Love & Romance)
  primary: {
    50: '#FFF1F2',
    100: '#FFE4E6',
    200: '#FECDD3',
    300: '#FDA4AF',
    400: '#FB7185',
    500: '#F43F5E', // Vibrant Rose
    600: '#E11D48',
    700: '#BE123C',
    800: '#9F1239',
    900: '#881337',
  },

  // Secondary - Coral (Passion & Energy)
  secondary: {
    50: '#FFF5F5',
    100: '#FFE0E0',
    200: '#FFC5C5',
    300: '#FF9F9F',
    400: '#FF7A7A',
    500: '#FF6B6B', // Warm Coral
    600: '#EE5A5A',
    700: '#D94A4A',
    800: '#B83B3B',
    900: '#963030',
  },

  // Accent - Amber/Gold (Happiness & Celebration)
  accent: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B', // Warm Amber
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },

  // Success - Soft Green
  success: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },

  // Warning - Soft Orange
  warning: {
    50: '#FFF7ED',
    100: '#FFEDD5',
    200: '#FED7AA',
    300: '#FDBA74',
    400: '#FB923C',
    500: '#F97316',
    600: '#EA580C',
    700: '#C2410C',
    800: '#9A3412',
    900: '#7C2D12',
  },

  // Error - Soft Red
  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },

  // Neutral - Grays
  neutral: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  // Background colors
  background: {
    light: '#FFFFFF',
    dark: '#111827',
    gradient: {
      start: '#FFF1F2', // Rose 50
      middle: '#FDF2F8', // Pink 50
      end: '#FFFBEB', // Amber 50
    },
  },

  // Text colors
  text: {
    primary: {
      light: '#111827',
      dark: '#F9FAFB',
    },
    secondary: {
      light: '#6B7280',
      dark: '#9CA3AF',
    },
    muted: {
      light: '#9CA3AF',
      dark: '#6B7280',
    },
  },
} as const;

// Semantic color aliases for easier use
export const semanticColors = {
  // Brand
  brand: colors.primary[500],
  brandLight: colors.primary[400],
  brandDark: colors.primary[600],

  // Interactive
  primary: colors.primary[500],
  primaryHover: colors.primary[600],
  primaryActive: colors.primary[700],

  secondary: colors.secondary[500],
  secondaryHover: colors.secondary[600],
  secondaryActive: colors.secondary[700],

  accent: colors.accent[500],
  accentHover: colors.accent[600],
  accentActive: colors.accent[700],

  // Status
  success: colors.success[500],
  warning: colors.warning[500],
  error: colors.error[500],
  info: colors.primary[400],

  // Background
  bgLight: colors.background.light,
  bgDark: colors.background.dark,

  // Text
  textPrimary: colors.text.primary.light,
  textSecondary: colors.text.secondary.light,
  textMuted: colors.text.muted.light,
} as const;

export default colors;
