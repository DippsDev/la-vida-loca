export default defineNuxtConfig({
  compatibilityDate: '2025-09-12',
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],
  tailwindcss: {
    cssPath: '~/assets/css/main.css',
    configPath: 'tailwind.config.ts',
  },
  runtimeConfig: {
    adminPassword: process.env.NUXT_ADMIN_PASSWORD || '',
    adminSessionSecret: process.env.NUXT_ADMIN_SESSION_SECRET || '',
    public: {
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL || 'https://pynxtrdndibgcxbnaeul.supabase.co',
      supabaseAnonKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5bnh0cmRuZGliZ2N4Ym5hZXVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNjM3NTgsImV4cCI6MjEwNTczOTc1OH0.4-kFI2n1DC0hN_fzfigT4vr_Dtx3NKbEfUB450Eooa0',
      adminEmails: process.env.NUXT_PUBLIC_ADMIN_EMAILS || '',
    },
  },
  routeRules: {
    '/splash-ibiza-1080.mp4': {
      headers: {
        'cache-control': 'public, max-age=31536000, immutable',
      },
    },
  },
  app: {
    pageTransition: {
      name: 'page',
    },
    head: {
      viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
      title: 'La Vida Loca',
      meta: [
        {
          name: 'description',
          content: 'Request to join La Vida LOCA — a private summer evening by the pool.',
        },
      ],
      link: [
        { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
        { rel: 'icon', type: 'image/png', href: '/favicon-32.png', sizes: '32x32' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Caveat:wght@500;600&family=Courier+Prime:ital,wght@0,400;0,700;1,400&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=Italianno&family=Playfair+Display:wght@700;800&display=swap',
        },
      ],
    },
  },
})
