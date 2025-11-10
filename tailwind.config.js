/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Spotify theme colors from PRD
        primary: '#1DB954',
        secondary: '#FFFFFF',
        background: '#121212',
        accent: '#535353',
        border: 'rgba(255, 255, 255, 0.1)',
      },
      fontFamily: {
        body: ['Poppins', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        // Typography scale from UI guidelines
        xs: '12px',
        sm: '14px',
        base: '16px',
        md: '18px',
        lg: '20px',
        xl: '24px',
        '2xl': '32px',
        '3xl': '40px',
      },
      spacing: {
        // 8px base spacing system from UI guidelines
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '48px',
        '3xl': '64px',
        '4xl': '80px',
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '12px',
        xl: '16px',
      },
      maxWidth: {
        container: '1440px',
      },
      screens: {
        // Breakpoints from UI guidelines
        sm: '600px',
        md: '900px',
        lg: '1200px',
        xl: '1440px',
      },
      gridTemplateColumns: {
        // Grid system from UI guidelines
        'mobile': 'repeat(4, 1fr)',
        'tablet': 'repeat(8, 1fr)',
        'desktop': 'repeat(12, 1fr)',
      },
      gap: {
        gutter: '24px',
      },
      fontWeight: {
        light: '300',
        normal: '400',
        semibold: '600',
        bold: '700',
      },
      lineHeight: {
        // 1.5x font size rule from UI guidelines
        tight: '1.5',
      },
    },
  },
  plugins: [],
}
