/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [],
  theme: {
    extend: {
      colors: {
        // Wellness color palette from PRD
        wellness: {
          sage: {
            DEFAULT: '#A8C3A0',
            light: '#C5D9BF',
            dark: '#8BAA84',
          },
          sand: {
            DEFAULT: '#E7D8C9',
            light: '#F0E7DC',
            dark: '#D4C0AE',
          },
          cream: {
            DEFAULT: '#F7F4EE',
            light: '#FDFCFA',
            dark: '#EBE6DC',
          },
          eucalyptus: {
            DEFAULT: '#7C9A92',
            light: '#9FB5AE',
            dark: '#627D77',
          },
          charcoal: {
            DEFAULT: '#2F3437',
            light: '#4A4F52',
            dark: '#1F2123',
          },
          lavender: {
            DEFAULT: '#C9BEDD',
            light: '#DDD5E9',
            dark: '#B5A6CA',
          },
          teal: {
            DEFAULT: '#6FA7A1',
            light: '#8DBDB8',
            dark: '#5A8A85',
          },
        },
        // Semantic color mappings
        primary: {
          DEFAULT: '#A8C3A0', // sage
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#E7D8C9', // sand
          foreground: '#2F3437', // charcoal
        },
        accent: {
          DEFAULT: '#7C9A92', // eucalyptus
          foreground: '#FFFFFF',
        },
        background: '#F7F4EE', // cream
        foreground: '#2F3437', // charcoal
        muted: {
          DEFAULT: '#EBE6DC', // cream-dark
          foreground: '#4A4F52', // charcoal-light
        },
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#2F3437',
        },
        border: '#D4C0AE', // sand-dark
        input: '#D4C0AE',
        ring: '#A8C3A0', // sage
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        soft: '0 2px 8px rgba(47, 52, 55, 0.08)',
        'soft-lg': '0 4px 16px rgba(47, 52, 55, 0.12)',
        'soft-xl': '0 8px 24px rgba(47, 52, 55, 0.16)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
