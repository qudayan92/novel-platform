/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        accent: {
          purple: '#8b5cf6',
          pink: '#ec4899',
          cyan: '#06b6d4',
          amber: '#f59e0b',
        },
        dark: {
          50: '#0f0f1a',
          100: '#14142a',
          200: '#1a1a30',
          300: '#12122a',
          400: '#0a0a14',
          500: '#05050a',
        },
        surface: {
          glass: 'rgba(15, 15, 25, 0.8)',
          elevated: 'rgba(26, 26, 48, 0.6)',
        }
      },
      fontFamily: {
        sans: ['PingFang SC', 'Microsoft YaHei', 'AppleSystem', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['Fira Code', 'Monaco', 'Consolas', 'monospace'],
      },
      backgroundImage: {
        'gradient-hero': 'linear-gradient(180deg, #0a0a0f 0%, #12121a 50%, #0a0a0f 100%)',
        'gradient-primary': 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #d946ef 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #06b6d4 0%, #6366f1 100%)',
        'gradient-accent': 'linear-gradient(135deg, #f59e0b 0%, #ec4899 100%)',
        'gradient-card': 'linear-gradient(145deg, rgba(20, 20, 40, 0.9) 0%, rgba(15, 15, 30, 0.95) 100%)',
        'gradient-glow': 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
        'mesh-gradient': 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
      },
      boxShadow: {
        'glow': '0 0 30px rgba(139, 92, 246, 0.2), 0 0 60px rgba(139, 92, 246, 0.1)',
        'glow-lg': '0 0 50px rgba(139, 92, 246, 0.3), 0 0 100px rgba(139, 92, 246, 0.15)',
        'glow-pink': '0 0 30px rgba(236, 72, 153, 0.25)',
        'inner-glow': 'inset 0 0 30px rgba(139, 92, 246, 0.1)',
        'card': '0 8px 32px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 20px 50px rgba(0, 0, 0, 0.5)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gradient': 'gradient 8s ease infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'glow': 'glow 3s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '33%': { transform: 'translateY(-15px) rotate(1deg)' },
          '66%': { transform: 'translateY(-8px) rotate(-1deg)' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        glow: {
          '0%, 100%': { opacity: '0.5', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
      },
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'md': '8px',
        'lg': '16px',
        'xl': '24px',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      letterSpacing: {
        'tighter': '-0.02em',
        'tight': '-0.01em',
        'normal': '0',
        'wide': '0.01em',
        'wider': '0.02em',
      },
      lineHeight: {
        'relaxed': '1.75',
        'loose': '2',
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1.5' }],
        'sm': ['0.875rem', { lineHeight: '1.5' }],
        'base': ['1rem', { lineHeight: '1.6' }],
        'lg': ['1.125rem', { lineHeight: '1.7' }],
        'xl': ['1.25rem', { lineHeight: '1.7' }],
        '2xl': ['1.5rem', { lineHeight: '1.3' }],
        '3xl': ['1.875rem', { lineHeight: '1.25' }],
        '4xl': ['2.25rem', { lineHeight: '1.2' }],
        '5xl': ['3rem', { lineHeight: '1.1' }],
      },
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}
