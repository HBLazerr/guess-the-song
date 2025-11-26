/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			background: 'hsl(var(--background))',
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		fontFamily: {
  			body: [
  				'Poppins',
  				'Inter',
  				'-apple-system',
  				'BlinkMacSystemFont',
  				'Segoe UI',
  				'sans-serif'
  			]
  		},
  		fontSize: {
  			xs: '12px',
  			sm: '14px',
  			base: '16px',
  			md: '18px',
  			lg: '20px',
  			xl: '24px',
  			'2xl': '32px',
  			'3xl': '40px'
  		},
  		spacing: {
  			xs: '4px',
  			sm: '8px',
  			md: '16px',
  			lg: '24px',
  			xl: '32px',
  			'2xl': '48px',
  			'3xl': '64px',
  			'4xl': '80px'
  		},
  		borderRadius: {
  			DEFAULT: '8px',
  			lg: 'var(--radius)',
  			xl: '16px',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		maxWidth: {
  			container: '1440px'
  		},
  		screens: {
  			sm: '600px',
  			md: '900px',
  			lg: '1200px',
  			xl: '1440px'
  		},
  		gridTemplateColumns: {
  			mobile: 'repeat(4, 1fr)',
  			tablet: 'repeat(8, 1fr)',
  			desktop: 'repeat(12, 1fr)'
  		},
  		gap: {
  			gutter: '24px'
  		},
  		fontWeight: {
  			light: '300',
  			normal: '400',
  			semibold: '600',
  			bold: '700'
  		},
  		lineHeight: {
  			tight: '1.5'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
