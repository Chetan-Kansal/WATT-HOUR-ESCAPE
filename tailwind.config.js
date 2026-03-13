/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
        './pages/**/*.{ts,tsx}',
        './components/**/*.{ts,tsx}',
        './app/**/*.{ts,tsx}',
        './src/**/*.{ts,tsx}',
    ],
    prefix: "",
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px",
            },
        },
        extend: {
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
                // Brand colors
                gdg: {
                    blue: "#4285F4",
                    red: "#EA4335",
                    yellow: "#FBBC05",
                    green: "#34A853",
                },
                ieee: {
                    blue: "#006699",
                    lightblue: "#00B5E2",
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            keyframes: {
                "accordion-down": {
                    from: { height: "0" },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: "0" },
                },
                "shake": {
                    "0%, 100%": { transform: "translateX(0)" },
                    "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-4px)" },
                    "20%, 40%, 60%, 80%": { transform: "translateX(4px)" },
                },
                "glow-pulse": {
                    "0%, 100%": { boxShadow: "0 0 5px #34A853, 0 0 20px #34A85340" },
                    "50%": { boxShadow: "0 0 20px #34A853, 0 0 40px #34A85360" },
                },
                "wave": {
                    "0%, 100%": { transform: "scaleY(0.5)" },
                    "50%": { transform: "scaleY(1.5)" },
                },
                "float": {
                    "0%, 100%": { transform: "translateY(0px)" },
                    "50%": { transform: "translateY(-10px)" },
                },
                "pulse-ring": {
                    "0%": { transform: "scale(1)", opacity: "1" },
                    "100%": { transform: "scale(1.5)", opacity: "0" },
                },
                "slide-in-up": {
                    "0%": { transform: "translateY(20px)", opacity: "0" },
                    "100%": { transform: "translateY(0)", opacity: "1" },
                },
                "countdown": {
                    "0%": { strokeDashoffset: "0" },
                    "100%": { strokeDashoffset: "283" },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                "shake": "shake 0.5s ease-in-out",
                "glow-pulse": "glow-pulse 1.5s ease-in-out infinite",
                "wave": "wave 1s ease-in-out infinite",
                "float": "float 3s ease-in-out infinite",
                "pulse-ring": "pulse-ring 1.5s ease-out infinite",
                "slide-in-up": "slide-in-up 0.3s ease-out",
            },
            fontFamily: {
                sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
                mono: ['var(--font-jetbrains)', 'monospace'],
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
                'grid-pattern': "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
            },
            boxShadow: {
                'glow-blue': '0 0 20px rgba(66, 133, 244, 0.3)',
                'glow-green': '0 0 20px rgba(52, 168, 83, 0.3)',
                'glow-red': '0 0 20px rgba(234, 67, 53, 0.3)',
                'glow-yellow': '0 0 20px rgba(251, 188, 5, 0.3)',
                'premium': '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.05)',
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
}
