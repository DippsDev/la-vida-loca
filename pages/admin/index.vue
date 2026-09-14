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
    <header class="bg-cobalt-deep px-6 py-8 text-cream">
      <div class="mx-auto flex max-w-5xl items-end justify-between gap-4">
        <div>
          <p class="font-script text-3xl text-white">
            La Vida
          </p>
          <h1 class="font-display text-3xl font-extrabold tracking-[0.1em]">
            LOCA · Admin
          </h1>
          <p class="mt-2 text-sm text-cream/70">
            Live request inbox
          </p>
        </div>
        <div class="flex flex-wrap items-center justify-end gap-2">
          <p
            v-if="auth.adminEmail"
            class="hidden text-xs text-cream/60 sm:block"
          >
            {{ auth.adminEmail }}
          </p>
          <NuxtLink
            to="/home"
            class="rounded-sm border border-cream/40 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-cream transition hover:border-cream hover:bg-cream/10"
          >
            View public page
          </NuxtLink>
          <button
            type="button"
            class="rounded-sm border border-cream/25 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-cream/80 transition hover:border-cream hover:text-cream"
            @click="signOut"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>

    <div class="mx-auto max-w-5xl px-6 py-8">
      <p
        v-if="demoMode"
        class="mb-6 rounded-sm border border-cobalt-deep/15 bg-cobalt-deep/5 px-4 py-3 text-sm text-cobalt-deep/80"
        role="status"
      >
        Showing demo placeholder requests for client preview. Approve/Reject updates this session only.
        Connect Supabase in <code class="text-xs">.env</code> for a live inbox.
      </p>

      <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div class="rounded-sm bg-cobalt-deep px-4 py-4 text-white">
          <p class="text-xs uppercase tracking-wider opacity-80">
            Total
          </p>
          <p class="mt-1 font-display text-3xl font-bold">
            {{ totals.total }}
          </p>
        </div>
        <div class="rounded-sm bg-white px-4 py-4 text-cobalt-deep">
          <p class="text-xs uppercase tracking-wider opacity-70">
            Pending
          </p>
          <p class="mt-1 font-display text-3xl font-bold">
            {{ totals.pending }}
          </p>
        </div>
        <div class="rounded-sm bg-palm px-4 py-4 text-white">
          <p class="text-xs uppercase tracking-wider opacity-80">
            Approved
          </p>
          <p class="mt-1 font-display text-3xl font-bold">
            {{ totals.approved }}
          </p>
        </div>
        <div class="rounded-sm bg-reject px-4 py-4 text-white">
          <p class="text-xs uppercase tracking-wider opacity-80">
            Rejected
          </p>
          <p class="mt-1 font-display text-3xl font-bold">
            {{ totals.rejected }}
          </p>
        </div>
      </div>

      <div class="mt-8 flex flex-wrap gap-2 border-b border-cobalt-deep/15 pb-3">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          class="px-3 py-1.5 text-sm font-medium uppercase tracking-wide transition"
          :class="filter === tab.id
            ? 'bg-cobalt-deep text-white'
            : 'bg-transparent text-cobalt-deep/70 hover:text-cobalt-deep'"
          @click="filter = tab.id"
        >
          {{ tab.label }}
        </button>
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
        class="mt-6 divide-y divide-cobalt-deep/10 bg-white"
      >
        <li
          v-for="request in visible"
          :key="request.id"
          class="flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <p class="font-semibold text-cobalt-deep">
              {{ request.name }}
            </p>
            <p class="text-sm text-ink/70">
              {{ request.email }}
            </p>
            <p
              v-if="request.note"
              class="mt-1 text-sm italic text-ink/55"
            >
              “{{ request.note }}”
            </p>
            <p class="mt-1 text-xs uppercase tracking-wider text-cobalt-deep/45">
              {{ request.status }} · {{ formatDate(request.created_at) }}
            </p>
          </div>

          <div
            v-if="request.status === 'PENDING'"
            class="flex gap-2"
          >
            <button
              type="button"
              class="bg-palm px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:brightness-110 disabled:opacity-50"
              :disabled="updatingId === request.id"
              @click="setStatus(request.id, 'APPROVED')"
            >
              Approve
            </button>
            <button
              type="button"
              class="bg-reject px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:brightness-110 disabled:opacity-50"
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
