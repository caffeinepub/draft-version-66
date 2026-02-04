import typography from '@tailwindcss/typography';
import containerQueries from '@tailwindcss/container-queries';
import animate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ['class'],
    content: ['index.html', 'src/**/*.{js,ts,jsx,tsx,html,css}'],
    theme: {
        container: {
            center: true,
            padding: '2rem',
            screens: {
                '2xl': '1400px'
            }
        },
        extend: {
            colors: {
                border: 'oklch(var(--border) / <alpha-value>)',
                input: 'oklch(var(--input) / <alpha-value>)',
                ring: 'oklch(var(--ring) / <alpha-value>)',
                background: 'oklch(var(--background) / <alpha-value>)',
                foreground: 'oklch(var(--foreground) / <alpha-value>)',
                primary: {
                    DEFAULT: 'oklch(var(--primary) / <alpha-value>)',
                    foreground: 'oklch(var(--primary-foreground) / <alpha-value>)',
                    dark: 'oklch(var(--primary-dark) / <alpha-value>)'
                },
                secondary: {
                    DEFAULT: 'oklch(var(--secondary) / <alpha-value>)',
                    foreground: 'oklch(var(--secondary-foreground) / <alpha-value>)'
                },
                destructive: {
                    DEFAULT: 'oklch(var(--destructive) / <alpha-value>)',
                    foreground: 'oklch(var(--destructive-foreground) / <alpha-value>)'
                },
                muted: {
                    DEFAULT: 'oklch(var(--muted) / <alpha-value>)',
                    foreground: 'oklch(var(--muted-foreground) / <alpha-value>)'
                },
                accent: {
                    DEFAULT: 'oklch(var(--accent) / <alpha-value>)',
                    foreground: 'oklch(var(--accent-foreground) / <alpha-value>)',
                    cyan: 'oklch(var(--accent-cyan) / <alpha-value>)',
                    'cyan-tinted': 'oklch(var(--accent-cyan-tinted) / <alpha-value>)'
                },
                popover: {
                    DEFAULT: 'oklch(var(--popover) / <alpha-value>)',
                    foreground: 'oklch(var(--popover-foreground) / <alpha-value>)'
                },
                card: {
                    DEFAULT: 'oklch(var(--card) / <alpha-value>)',
                    foreground: 'oklch(var(--card-foreground) / <alpha-value>)'
                },
                chart: {
                    1: 'oklch(var(--chart-1) / <alpha-value>)',
                    2: 'oklch(var(--chart-2) / <alpha-value>)',
                    3: 'oklch(var(--chart-3) / <alpha-value>)',
                    4: 'oklch(var(--chart-4) / <alpha-value>)',
                    5: 'oklch(var(--chart-5) / <alpha-value>)'
                },
                'description-gray': 'oklch(var(--description-gray) / <alpha-value>)'
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)'
            },
            boxShadow: {
                xs: '0 1px 2px 0 rgba(0,0,0,0.05)',
                glow: '0 4px 20px oklch(var(--accent-cyan) / 0.3), 0 0 40px oklch(var(--accent-cyan-tinted) / 0.2)',
                'glow-lg': '0 8px 30px oklch(var(--accent-cyan) / 0.4), 0 0 60px oklch(var(--accent-cyan-tinted) / 0.3)'
            },
            keyframes: {
                'accordion-down': {
                    from: { height: '0' },
                    to: { height: 'var(--radix-accordion-content-height)' }
                },
                'accordion-up': {
                    from: { height: 'var(--radix-accordion-content-height)' },
                    to: { height: '0' }
                },
                'fade-in': {
                    from: {
                        opacity: '0',
                        transform: 'translateY(20px)'
                    },
                    to: {
                        opacity: '1',
                        transform: 'translateY(0)'
                    }
                },
                'breathe': {
                    '0%, 100%': {
                        transform: 'scale(1)'
                    },
                    '50%': {
                        transform: 'scale(1.05)'
                    }
                },
                'breathe-gentle': {
                    '0%, 100%': {
                        transform: 'scale(1)',
                        opacity: '0.95'
                    },
                    '50%': {
                        transform: 'scale(1.02)',
                        opacity: '1'
                    }
                },
                'glow-pulse': {
                    '0%, 100%': {
                        boxShadow: '0 0 20px oklch(var(--accent-cyan) / 0.3)'
                    },
                    '50%': {
                        boxShadow: '0 0 40px oklch(var(--accent-cyan) / 0.6)'
                    }
                },
                'float': {
                    '0%, 100%': {
                        transform: 'translateY(0)'
                    },
                    '50%': {
                        transform: 'translateY(-10px)'
                    }
                }
            },
            animation: {
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out',
                'fade-in': 'fade-in 1s ease-out',
                'breathe': 'breathe 4s ease-in-out infinite',
                'breathe-gentle': 'breathe-gentle 6s ease-in-out infinite',
                'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
                'float': 'float 3s ease-in-out infinite'
            },
            fontFamily: {
                sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'sans-serif'],
                serif: ['Georgia', 'Times New Roman', 'serif'],
                playfair: ['Playfair Display', 'Georgia', 'Times New Roman', 'serif']
            }
        }
    },
    plugins: [typography, containerQueries, animate]
};
