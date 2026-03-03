/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand Primary - Slate Blue (Trust/Structure)
        brand: {
          50: '#E8EBF0',
          100: '#D1D7E1',
          200: '#A3AFC3',
          300: '#7587A5',
          400: '#4A5F87',
          500: '#2B3A55', // Primary
          600: '#232E44',
          700: '#1A2333',
          800: '#121722',
          900: '#090C11',
        },
        // Brand Secondary - Muted Teal (Growth/Teamwork)
        teal: {
          50: '#E8F4F4',
          100: '#D1E9E8',
          200: '#A3D3D1',
          300: '#75BDBA',
          400: '#47A7A3',
          500: '#2A7F7B', // Secondary
          600: '#226663',
          700: '#194C4A',
          800: '#113331',
          900: '#081919',
        },
        // Brand Accent - Warm Ochre (Attention/Highlights)
        ochre: {
          50: '#FAF5E8',
          100: '#F5EBD1',
          200: '#EBD7A3',
          300: '#E1C375',
          400: '#D7AF47',
          500: '#C49A3A', // Accent
          600: '#9D7B2E',
          700: '#765C23',
          800: '#4E3E17',
          900: '#271F0B',
        },
        // Neutrals - Warm Off-White background
        background: '#F7F3EE',
        surface: '#FFFFFF',
        'surface-alt': '#EFE7DD',
        // Text colors
        ink: '#1B1F24',
        slate: '#5B6572',
        // Border
        'quiet-border': '#D9D2C8',
        // Semantic colors
        success: {
          50: '#E8F5E9',
          100: '#C8E6C9',
          200: '#A5D6A7',
          300: '#81C784',
          400: '#66BB6A',
          500: '#2E7D32',
          600: '#2E7D32',
          700: '#1B5E20',
          800: '#0D3B0F',
          900: '#051905',
        },
        warning: {
          50: '#FFF8E1',
          100: '#FFECB3',
          200: '#FFE082',
          300: '#FFD54F',
          400: '#FFCA28',
          500: '#B7791F',
          600: '#A56A1B',
          700: '#8A5A16',
          800: '#6B4510',
          900: '#4A2F0B',
        },
        error: {
          50: '#FFEBEE',
          100: '#FFCDD2',
          200: '#EF9A9A',
          300: '#E57373',
          400: '#EF5350',
          500: '#9B2C2C',
          600: '#8B2626',
          700: '#7A2121',
          800: '#5A1818',
          900: '#3A0F0F',
        },
        // Optional accent - Dusty Mauve
        mauve: {
          50: '#F5F3F5',
          100: '#EBE7EB',
          200: '#D7CFD7',
          300: '#C3B7C3',
          400: '#AF9FAF',
          500: '#8E7A8A',
          600: '#72626E',
          700: '#564A52',
          800: '#3A3137',
          900: '#1E191C',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #2B3A55 0%, #3A4F70 100%)',
        'gradient-teal': 'linear-gradient(135deg, #2A7F7B 0%, #3AA8A3 100%)',
        'gradient-ochre': 'linear-gradient(135deg, #C49A3A 0%, #D9B556 100%)',
        'gradient-warm': 'linear-gradient(135deg, #F7F3EE 0%, #EFE7DD 100%)',
      },
    },
  },
  plugins: [],
}
