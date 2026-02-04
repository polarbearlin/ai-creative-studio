/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Vitality Canvas - Wheat/Tan/Organic
                background: '#FEFAE0', // Off-White Cream
                surface: '#FAEDCD',    // Soft Beige (Papyrus)
                surfaceHighlight: '#E9EDC9', // Pale Green Accent

                // Text colors
                foreground: '#283618', // Dark Deep Green
                muted: '#606C38',      // Sage Green

                // Brand accents
                primary: '#D4A373',    // Classic Wheat/Tan
                primaryHover: '#BC8A5F', // Darker Wheat

                // Borders
                border: 'rgba(40, 54, 24, 0.1)', // #283618 with opacity
            },
            fontFamily: {
                sans: ['Raleway', 'system-ui', 'sans-serif'],
                serif: ['Lora', 'serif'],
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out',
                'slide-up': 'slideUp 0.5s ease-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
            },
        },
    },
    plugins: [],
}
