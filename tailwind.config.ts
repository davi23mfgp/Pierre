import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: { center: true, padding: "2rem", screens: { "2xl": "1400px" } },
    extend: {
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "SF Pro Display", "var(--font-onest)", "Onest", "system-ui", "sans-serif"],
      },
      colors: {
        border:     "hsl(var(--border))",
        input:      "hsl(var(--input))",
        ring:       "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary:    { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary:  { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive:{ DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted:      { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent:     { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        popover:    { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        card:       { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        sidebar: {
          DEFAULT:              "hsl(var(--sidebar))",
          foreground:           "hsl(var(--sidebar-foreground))",
          border:               "hsl(var(--sidebar-border))",
          accent:               "hsl(var(--sidebar-accent))",
          "accent-foreground":  "hsl(var(--sidebar-accent-foreground))",
        },
        /* Status semânticos — só como texto ou fundo a 15% (bg-success/15). */
        success: "hsl(var(--success) / <alpha-value>)",
        warning: "hsl(var(--warning) / <alpha-value>)",
        danger:  "hsl(var(--danger) / <alpha-value>)",
        /* ── DNA Control.Deal — tokens oklch (usados direto: bg-surface-1, text-ios-blue…) ── */
        "surface-1": "var(--surface-1)",
        "surface-2": "var(--surface-2)",
        "surface-3": "var(--surface-3)",
        hairline:    "var(--hairline)",
        "muted-fg":  "var(--muted-fg)",
        /* oklch com <alpha-value> p/ suportar modificador /opacity (bg-ios-blue/10) */
        /* Cada cor é um trio "L C H" numa variável só (--lch-ios-*), que troca
           entre claro e escuro. Interpolar o trio inteiro mantém o modificador
           de opacidade funcionando: bg-ios-teal/10. */
        "ios-blue":  "oklch(var(--lch-ios-blue) / <alpha-value>)",
        "ios-green": "oklch(var(--lch-ios-green) / <alpha-value>)",
        "ios-yellow":"oklch(var(--lch-ios-yellow) / <alpha-value>)",
        "ios-orange":"oklch(var(--lch-ios-orange) / <alpha-value>)",
        "ios-purple":"oklch(var(--lch-ios-purple) / <alpha-value>)",
        "ios-teal":  "oklch(var(--lch-ios-teal) / <alpha-value>)",
        "ios-red":   "oklch(var(--lch-ios-red) / <alpha-value>)",
      },
      borderRadius: {
        sm:   "var(--radius-sm)",    /* 10px */
        md:   "var(--radius-md)",    /* 16px */
        lg:   "var(--radius)",       /* 14px */
        xl:   "var(--radius-lg)",    /* 20px */
        "2xl":"var(--radius-xl)",    /* 24px */
        "3xl":"var(--radius-2xl)",   /* 28px */
      },
      boxShadow: {
        "apple-card":   "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.05)",
        "apple-raised": "0 4px 12px rgba(0,0,0,0.08), 0 16px 40px rgba(0,0,0,0.08)",
        "apple-float":  "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)",
        "apple-btn":    "0 2px 8px rgba(0,0,0,0.18)",
      },
      fontSize: {
        "apple-caption": ["13px", { lineHeight: "1.4", letterSpacing: "0" }],
        "apple-body":    ["15px", { lineHeight: "1.6", letterSpacing: "-0.01em" }],
        "apple-title":   ["17px", { lineHeight: "1.4", letterSpacing: "-0.02em", fontWeight: "600" }],
        "apple-hero":    ["28px", { lineHeight: "1.2", letterSpacing: "-0.03em", fontWeight: "700" }],
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up":   { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        shimmer: {
          "0%":   { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        "page-enter": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        // iOS 26 spring keyframes
        "spring-pop": {
          "0%":   { transform: "scale(0.85)", opacity: "0" },
          "55%":  { transform: "scale(1.04)", opacity: "1" },
          "75%":  { transform: "scale(0.98)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "spring-slide-up": {
          "0%":   { transform: "translateY(20px) scale(0.97)", opacity: "0" },
          "60%":  { transform: "translateY(-4px) scale(1.01)", opacity: "1" },
          "80%":  { transform: "translateY(2px) scale(0.995)" },
          "100%": { transform: "translateY(0) scale(1)", opacity: "1" },
        },
        "spring-fade": {
          "0%":   { opacity: "0", transform: "scale(0.92) translateY(4px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        shimmer:          "shimmer 1.5s infinite",
        "page-enter":     "page-enter 0.3s cubic-bezier(0.4,0,0.2,1) forwards",
        "slide-up":       "slide-up 0.3s cubic-bezier(0.4,0,0.2,1) forwards",
        "fade-in":        "fade-in 0.2s ease-out forwards",
        "spring-pop":       "spring-pop 0.42s cubic-bezier(0.34,1.56,0.64,1) both",
        "spring-slide-up":  "spring-slide-up 0.45s cubic-bezier(0.34,1.56,0.64,1) both",
        "spring-fade":      "spring-fade 0.3s cubic-bezier(0.34,1.46,0.64,1) both",
      },
      transitionTimingFunction: {
        apple:  "cubic-bezier(0.4, 0, 0.2, 1)",
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
