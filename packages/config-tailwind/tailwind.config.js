/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [],
  theme: {
    extend: {
      colors: {
        // Iris design system palette
        iris: {
          bg: '#F3F4F7',
          surface: '#FFFFFF',
          panel: '#FBF8FD',
          ink: '#1E1830',
          ink2: '#3D3450',
          muted: '#7A7090',
          line: '#E5DEEC',
          line2: '#EFE9F2',
          primary: '#5D4AA8',
          primary2: '#7665C2',
          'primary-dk': '#3F2F87',
          accent: '#E8A893',
          'accent-dk': '#C97E68',
          soft1: '#EDE5F4',
          soft2: '#F7E5DD',
        },
        // Semantic color mappings — Iris violet palette
        primary: {
          DEFAULT: '#5D4AA8',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#EDE5F4',
          foreground: '#3D3450',
        },
        accent: {
          DEFAULT: '#E8A893',
          foreground: '#1E1830',
        },
        background: '#F3F4F7',
        foreground: '#1E1830',
        muted: {
          DEFAULT: '#EFE9F2',
          foreground: '#7A7090',
        },
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#1E1830',
        },
        border: '#E5DEEC',
        input: '#E5DEEC',
        ring: '#5D4AA8',
      },
      fontFamily: {
        sans: ['Sora', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Sora', 'system-ui', 'sans-serif'],
        body: ['Sora', 'Inter', 'system-ui', 'sans-serif'],
        sora: ['Sora', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        /* Neutral ink-tinted shadows — no colored glows */
        soft:         '0 1px 2px rgba(28,20,54,0.08)',
        'soft-lg':    '0 2px 8px rgba(28,20,54,0.10)',
        'soft-xl':    '0 8px 28px rgba(28,20,54,0.12), 0 2px 6px rgba(28,20,54,0.06)',
        'iris-cta':   'inset 0 1px 0 rgba(255,255,255,0.18), 0 1px 2px rgba(28,20,54,0.12), 0 1px 1px rgba(28,20,54,0.06)',
        'iris-float': '0 8px 28px rgba(28,20,54,0.12), 0 2px 6px rgba(28,20,54,0.06)',
        'iris-card':  '0 2px 12px rgba(28,20,54,0.06)',
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
