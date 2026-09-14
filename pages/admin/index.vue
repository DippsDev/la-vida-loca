<script setup lang="ts">
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { JoinRequest, RequestStatus } from '~/types/request'
import { createDemoRequests } from '~/utils/adminDemoData'

definePageMeta({
  ssr: false,
})

useHead({ title: 'Admin · La Vida LOCA' })

type FilterTab = 'ALL' | RequestStatus

const route = useRoute()
const auth = useAdminAuth()
const supabase = useSupabaseClient()
const requests = ref<JoinRequest[]>([])
const filter = ref<FilterTab>('ALL')
const loading = ref(true)
const updatingId = ref<string | null>(null)
const fetchError = ref('')
const demoMode = ref(false)
let channel: RealtimeChannel | null = null

function loadDemoInbox() {
  demoMode.value = true
  requests.value = createDemoRequests()
  fetchError.value = ''
}

const totals = computed(() => {
  const all = requests.value
  return {
    total: all.length,
    pending: all.filter(r => r.status === 'PENDING').length,
    approved: all.filter(r => r.status === 'APPROVED').length,
    rejected: all.filter(r => r.status === 'REJECTED').length,
  }
})

const visible = computed(() => {
  if (filter.value === 'ALL') return requests.value
  return requests.value.filter(r => r.status === filter.value)
})

const tabs: { id: FilterTab; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'PENDING', label: 'Pending' },
  { id: 'APPROVED', label: 'Approved' },
  { id: 'REJECTED', label: 'Rejected' },
]

function upsertLocal(row: JoinRequest) {
  const index = requests.value.findIndex(r => r.id === row.id)
  if (index === -1) {
    requests.value = [row, ...requests.value]
    return
  }
  const next = [...requests.value]
  next[index] = row
  requests.value = next
}

function removeLocal(id: string) {
  requests.value = requests.value.filter(r => r.id !== id)
}

async function fetchRequests() {
  loading.value = true
  fetchError.value = ''
  demoMode.value = false

  const config = useRuntimeConfig()
  const forceDemo = route.query.demo === '1'

  if (forceDemo || !config.public.supabaseUrl || !config.public.supabaseAnonKey) {
    loadDemoInbox()
    loading.value = false
    return
  }

  const { data, error } = await supabase
    .from('requests')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    loadDemoInbox()
  }
  else if (data?.length) {
    requests.value = data
  }
  else {
    loadDemoInbox()
  }

  loading.value = false
}

async function setStatus(id: string, status: Extract<RequestStatus, 'APPROVED' | 'REJECTED'>) {
  updatingId.value = id

  if (demoMode.value) {
    await new Promise(resolve => window.setTimeout(resolve, 350))
    const row = requests.value.find(r => r.id === id)
    if (row) upsertLocal({ ...row, status })
    updatingId.value = null
    return
  }

  const { error } = await supabase
    .from('requests')
    .update({ status })
    .eq('id', id)

  updatingId.value = null

  if (error) {
    fetchError.value = error.message
    return
  }

  const row = requests.value.find(r => r.id === id)
  if (row) upsertLocal({ ...row, status })
}

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

async function signOut() {
  await auth.logout()
  await navigateTo('/admin/login')
}

onMounted(async () => {
  await fetchRequests()

  if (demoMode.value) return

  channel = supabase
    .channel('requests-admin')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'requests' },
      (payload) => {
        if (payload.eventType === 'INSERT') {
          upsertLocal(payload.new as JoinRequest)
        }
        else if (payload.eventType === 'UPDATE') {
          upsertLocal(payload.new as JoinRequest)
        }
        else if (payload.eventType === 'DELETE') {
          removeLocal((payload.old as { id: string }).id)
        }
      },
    )
    .subscribe()
})

onUnmounted(() => {
  if (channel) {
    supabase.removeChannel(channel)
  }
})
</script>

<template>
  <div class="min-h-screen bg-[#f3f5f8] text-ink">
    <header class="bg-cobalt-deep px-4 py-6 text-cream sm:px-6 sm:py-8">
      <div class="mx-auto flex max-w-5xl flex-col gap-5 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div class="min-w-0">
          <p class="font-script text-3xl leading-none text-white sm:text-4xl">
            La Vida
          </p>
          <h1 class="mt-1 font-display text-2xl font-extrabold tracking-[0.1em] sm:text-3xl">
            LOCA · Admin
          </h1>
          <p class="mt-2 text-sm text-cream/70">
            Live request inbox
          </p>
          <p
            v-if="auth.adminEmail"
            class="mt-1 truncate text-xs text-cream/55"
          >
            {{ auth.adminEmail }}
          </p>
        </div>

        <div class="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-end">
          <NuxtLink
            to="/home"
            class="rounded-sm border border-cream/40 px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-cream transition hover:border-cream hover:bg-cream/10 sm:px-4 sm:text-xs"
          >
            Public page
          </NuxtLink>
          <button
            type="button"
            class="rounded-sm border border-cream/25 px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-cream/80 transition hover:border-cream hover:text-cream sm:px-4 sm:text-xs"
            @click="signOut"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>

    <div class="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <p
        v-if="demoMode"
        class="mb-6 rounded-sm border border-cobalt-deep/15 bg-cobalt-deep/5 px-3.5 py-3 text-xs leading-relaxed text-cobalt-deep/80 sm:px-4 sm:text-sm"
        role="status"
      >
        Showing demo placeholder requests for client preview. Approve/Reject updates this session only.
        Connect Supabase in <code class="text-[11px] sm:text-xs">.env</code> for a live inbox.
      </p>

      <div class="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-4">
        <div class="rounded-sm bg-cobalt-deep px-3 py-3.5 text-white sm:px-4 sm:py-4">
          <p class="text-[11px] uppercase tracking-wider opacity-80 sm:text-xs">
            Total
          </p>
          <p class="mt-1 font-display text-2xl font-bold sm:text-3xl">
            {{ totals.total }}
          </p>
        </div>
        <div class="rounded-sm border border-cobalt-deep/10 bg-white px-3 py-3.5 text-cobalt-deep sm:px-4 sm:py-4">
          <p class="text-[11px] uppercase tracking-wider opacity-70 sm:text-xs">
            Pending
          </p>
          <p class="mt-1 font-display text-2xl font-bold sm:text-3xl">
            {{ totals.pending }}
          </p>
        </div>
        <div class="rounded-sm bg-palm px-3 py-3.5 text-white sm:px-4 sm:py-4">
          <p class="text-[11px] uppercase tracking-wider opacity-80 sm:text-xs">
            Approved
          </p>
          <p class="mt-1 font-display text-2xl font-bold sm:text-3xl">
            {{ totals.approved }}
          </p>
        </div>
        <div class="rounded-sm bg-reject px-3 py-3.5 text-white sm:px-4 sm:py-4">
          <p class="text-[11px] uppercase tracking-wider opacity-80 sm:text-xs">
            Rejected
          </p>
          <p class="mt-1 font-display text-2xl font-bold sm:text-3xl">
            {{ totals.rejected }}
          </p>
        </div>
      </div>

      <div
        class="mt-7 -mx-4 overflow-x-auto overscroll-x-contain border-b border-cobalt-deep/15 px-4 sm:mx-0 sm:mt-8 sm:overflow-visible sm:px-0"
        role="tablist"
        aria-label="Filter requests"
      >
        <div class="flex min-w-max gap-1 pb-3 sm:min-w-0 sm:flex-wrap sm:gap-2">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            type="button"
            role="tab"
            :aria-selected="filter === tab.id"
            class="shrink-0 px-3 py-2 text-xs font-medium uppercase tracking-wide transition sm:text-sm"
            :class="filter === tab.id
              ? 'bg-cobalt-deep text-white'
              : 'bg-transparent text-cobalt-deep/70 hover:text-cobalt-deep'"
            @click="filter = tab.id"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>

      <p
        v-if="fetchError"
        class="mt-6 text-sm text-reject"
        role="alert"
      >
        {{ fetchError }}
      </p>

      <p
        v-if="loading"
        class="mt-8 text-sm text-cobalt-deep/60"
      >
        Loading…
      </p>

      <ul
        v-else
        class="mt-5 divide-y divide-cobalt-deep/10 overflow-hidden rounded-sm bg-white sm:mt-6"
      >
        <li
          v-for="request in visible"
          :key="request.id"
          class="flex flex-col gap-3.5 px-4 py-4 sm:gap-3 md:flex-row md:items-center md:justify-between"
        >
          <div class="min-w-0">
            <p class="font-semibold text-cobalt-deep">
              {{ request.name }}
            </p>
            <p class="break-all text-sm text-ink/70">
              {{ request.email }}
            </p>
            <p
              v-if="request.note"
              class="mt-1 text-sm italic text-ink/55"
            >
              “{{ request.note }}”
            </p>
            <p class="mt-1 text-[11px] uppercase tracking-wider text-cobalt-deep/45 sm:text-xs">
              {{ request.status }} · {{ formatDate(request.created_at) }}
            </p>
          </div>

          <div
            v-if="request.status === 'PENDING'"
            class="grid grid-cols-2 gap-2 md:flex md:shrink-0"
          >
            <button
              type="button"
              class="bg-palm px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-white transition hover:brightness-110 disabled:opacity-50 md:py-2"
              :disabled="updatingId === request.id"
              @click="setStatus(request.id, 'APPROVED')"
            >
              Approve
            </button>
            <button
              type="button"
              class="bg-reject px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-white transition hover:brightness-110 disabled:opacity-50 md:py-2"
              :disabled="updatingId === request.id"
              @click="setStatus(request.id, 'REJECTED')"
            >
              Reject
            </button>
          </div>

          <span
            v-else
            class="inline-flex self-start px-2 py-1 text-xs font-semibold uppercase tracking-wide"
            :class="request.status === 'APPROVED'
              ? 'bg-palm/15 text-palm'
              : 'bg-reject/15 text-reject'"
          >
            {{ request.status }}
          </span>
        </li>

        <li
          v-if="!visible.length"
          class="px-4 py-10 text-center text-sm text-cobalt-deep/50"
        >
          No requests in this view.
        </li>
      </ul>
    </div>
  </div>
</template>
