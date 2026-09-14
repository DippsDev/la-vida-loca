# La Vida LOCA

Personal RSVP **Request to Join** app — public invite form + live admin dashboard.

## Stack

- Nuxt 3 + Vue 3 (`<script setup>` + TypeScript)
- Tailwind CSS
- Supabase (Postgres + Realtime)

## Setup

1. **Install**

```bash
npm install
```

2. **Supabase**

- Create a project at [supabase.com](https://supabase.com)
- Run `supabase/schema.sql` in the SQL Editor
- Copy Project URL + anon key into `.env`:

```bash
cp .env.example .env
```

```env
NUXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NUXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

3. **Dev server**

```bash
npm run dev
```

- Public form: [http://localhost:3000/](http://localhost:3000/)
- Admin inbox: [http://localhost:3000/admin](http://localhost:3000/admin)

## Features

| Route | What it does |
|-------|----------------|
| `/` | Event landing + request form; duplicate emails show a friendly message; success state without reload |
| `/admin` | Metrics, status tabs, Approve/Reject, Supabase realtime updates |

## Design

Tropical cobalt / cream / blossom pink (mood boards) with Zia-style restraint: brand-first hero, sparse copy, one clear CTA.

Splash art lives at `public/hero.jpg`. Replace it anytime to update the landing background.

## Security note

The included SQL policies allow anon insert/select/update for a private personal event. For a shared or public deployment, protect `/admin` and move status updates behind a service-role API route.
