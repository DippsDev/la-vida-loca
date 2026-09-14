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
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL || '',
      supabaseAnonKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY || '',
      adminEmails: process.env.NUXT_PUBLIC_ADMIN_EMAILS || '',
    },
  },
  app: {
    head: {
      title: 'La Vida LOCA',
      meta: [
        {
          name: 'description',
          content: 'Request to join La Vida LOCA — a private summer evening by the pool.',
        },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=Italianno&family=Playfair+Display:wght@700;800&display=swap',
        },
      ],
    },
  },
})
