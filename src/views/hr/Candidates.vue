<template>
  <div class="flex flex-col">
    <!-- Header -->
    <div class="dark:border-gray-700 bg-white">
      <div class="flex items-center justify-between p-4 border-b rounded-md border-gray-200">
        <div class="flex items-center gap-2">
          <p class="text-xl font-semibold">{{ $t('candidates') || 'Թեկնածուներ' }}</p>
          <p class="text-sm text-slate-500">({{ $t('hr') || 'Կադրեր' }})</p>
        </div>
        <div>
          <button
              class="px-3 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
              @click="openCreate()"
          >
            {{ $t('new_candidate') || 'Նոր թեկնածու +' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Breadcrumb -->
    <nav class="flex bg-blue-50 py-2 items-center text-sm" aria-label="Breadcrumb">
      <ol class="inline-flex items-center">
        <li>
          <router-link
              :to="'/hr'"
              class="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-slate-100"
          >
            <span class="underline-offset-2 hover:underline">{{ $t('hr') || 'Կադրեր' }}</span>
          </router-link>
        </li>
        <li aria-hidden="true" class="px-1">
          <svg class="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
            <path
                d="M7.05 3.55a1 1 0 0 1 1.4 0l4.5 4.5a1 1 0 0 1 0 1.4l-4.5 4.5a1 1 0 0 1-1.4-1.4L10.79 10 7.05 6.26a1 1 0 0 1 0-1.41z"/>
          </svg>
        </li>
        <li>
          <p class="inline-flex items-center gap-1 rounded-md px-2 py-1">
            <span class="underline-offset-2 hover:underline">{{ $t('candidates') || 'Թեկնածուներ' }}</span>
          </p>
        </li>
      </ol>
    </nav>
  </div>

  <div class="p-4 space-y-4">
    <!-- Toolbar -->
    <div class="flex flex-col gap-y-2">
      <div class="flex items-center gap-2">
        <input
            v-model="q"
            @input="debouncedSearch"
            class="px-3 py-2 rounded-xl border border-gray-300 w-72"
            :placeholder="$t('search_placeholder') || 'Փնտրել (անուն/էլ․ փոստ)…'"
        />
        <button class="px-3 py-2 rounded-xl border hover:bg-gray-50" @click="resetAndReload">
          {{ $t('refresh') || 'Թարմացնել' }}
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white border border-gray-300 overflow-hidden">
      <table class="min-w-full text-sm">
        <thead class="bg-gray-50">
        <tr class="text-left">
          <th class="px-4 py-3">#</th>
          <th class="px-4 py-3">{{ $t('name') || 'Անուն Ազգանուն' }}</th>
          <th class="px-4 py-3">Email / {{ $t('phone') || 'Հեռախոս' }}</th>
          <th class="px-4 py-3"> {{ $t('gender') }}</th>
          <th class="px-4 py-3"> {{ $t('birth_date') }}</th>
          <th class="px-4 py-3">{{ $t('documents') || 'Փաստաթղթեր' }}</th>
          <th class="px-4 py-3">{{ $t('updated_at') || 'Թարմացվել է' }}</th>
          <th class="px-4 py-3"></th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="row in rows" :key="row.id" class="border-t">
          <td class="px-4 py-3 font-medium">#{{ row.id }}</td>
          <td class="px-4 py-3">
            <div class="flex flex-col">
              <span class="font-medium">{{ row.first_name }} {{ row.last_name }}</span>
              <span v-if="row.position" class="text-xs text-gray-500">{{ row.position }}</span>
            </div>
          </td>
          <td class="px-4 py-3">
            <div class="flex flex-col">
              <span>{{ row.email || '—' }}</span>
              <span class="text-xs text-gray-500">{{ row.phone || '—' }}</span>
            </div>
          </td>
          <td class="px-4 py-3">
            <div class="flex flex-col">
              <span>{{ $t(row?.gender ?? '-') || '—' }}</span>
            </div>
          </td>
          <td class="px-4 py-3">
            <div class="flex flex-col">
              <span>{{ row.birth_date || '—' }}</span>
            </div>
          </td>
          <td class="px-4 py-3">
              <span class="px-2 py-0.5 rounded text-xs bg-gray-100">
                {{ row.documents_count ?? row.docs_count ?? (row.documents?.length || 0) }}
              </span>
          </td>
          <td class="px-4 py-3">
            <span :title="row.updated_at">{{ formatDateTime(row.updated_at) }}</span>
            <span class="text-xs text-gray-400 ml-2">({{ fromNow(row.updated_at) }})</span>
          </td>
          <td class="px-4 py-3">
            <div class="flex flex-wrap gap-2">
              <button
                  class="px-3 py-1 text-xs text-white bg-slate-600 rounded-md hover:bg-slate-700"
                  @click="openDocs(row)"
              >
                {{ $t('documents') || 'Փաստաթղթեր' }}
              </button>
              <button
                  class="px-3 py-1 text-xs text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                  @click="openEdit(row)"
              >
                {{ $t('edit') || 'Փոփոխել' }}
              </button>
            </div>
          </td>
        </tr>

        <tr v-if="!loading && rows.length===0">
          <td colspan="6" class="p-6 text-center text-gray-500">{{ $t('empty') || 'Դատարկ է' }}</td>
        </tr>
        </tbody>
      </table>

      <div class="p-3 border-t text-center text-sm text-gray-500" v-if="loading">
        {{ $t('loading') || 'Բեռնվում է…' }}
      </div>
      <div ref="sentinel" class="h-8"></div>
    </div>
  </div>

  <!-- Modals -->
  <CandidateModal
      v-if="candidateModal.open"
      :key="candidateModal.model?.id ?? 'new'"
      :open="candidateModal.open"
      :model-value="candidateModal.model"
      @close="candidateModal.open=false"
      @saved="onSavedCandidate"
  />

  <CandidateDocumentsModal
      v-if="docsModal.open"
      :key="docsModal.candidateId"
      :open="docsModal.open"
      :candidate-id="docsModal.candidateId"
      :candidate="docsModal.candidate"
      @close="docsModal.open=false"
      @saved="resetAndReload"
  />


</template>

<script setup lang="ts">
import {onBeforeUnmount, onMounted, ref} from 'vue'
import {candidateApi} from '@/api'
import CandidateModal from './components/CandidateModal.vue'
import CandidateDocumentsModal from './components/CandidateDocumentsModal.vue'
import {formatDateTime, fromNow} from '@/utils/dateFormat'

const q = ref<string>('')
const rows = ref<any[]>([])
const loading = ref(false)
const eof = ref(false)
const LIMIT = 20
const offset = ref(0)
const sentinel = ref<HTMLElement | null>(null)
let io: IntersectionObserver | null = null
let tId: number | ReturnType<typeof setTimeout> | null = null

// Candidate edit/create modal
const candidateModal = ref<{ open: boolean; model: any | null }>({open: false, model: null})

// Documents modal (держим и id, и сам объект)
const docsModal = ref<{ open: boolean; candidateId: number | null; candidate: any | null }>({
  open: false,
  candidateId: null,
  candidate: null,
})

/* ===== List fetching ===== */
async function fetchNext() {
  if (loading.value || eof.value) return
  loading.value = true
  try {
    const {data} = await candidateApi.list({
      limit: LIMIT,
      offset: offset.value,
      search: q.value || undefined,
    })
    const batch = data?.data ?? data ?? []
    rows.value.push(...batch)
    if (batch.length < LIMIT) eof.value = true
    else offset.value += LIMIT
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function resetAndReload() {
  rows.value = []
  eof.value = false
  offset.value = 0
  await fetchNext()
}

function debouncedSearch() {
  if (tId) clearTimeout(tId as number)
  tId = setTimeout(resetAndReload, 300)
}

/* ===== Actions ===== */
function openCreate() {
  candidateModal.value = {open: true, model: null}
}

function openEdit(row: any) {
  const model = {
    id: row.id,
    first_name: row.first_name ?? '',
    last_name: row.last_name ?? '',
    email: row.email ?? '',
    phone: row.phone ?? '',
    gender: row.gender ?? null,
    birth_date: row.birth_date ?? ''
  }
  candidateModal.value = {open: true, model}
}

function onSavedCandidate() {
  candidateModal.value.open = false
  resetAndReload()
}

function openDocs(row: any) {
  docsModal.value = {open: true, candidateId: row.id, candidate: row}
}

/* ===== Mount / Unmount ===== */
onMounted(() => {
  io = new IntersectionObserver(
      (e) => {
        if (e.some((x) => x.isIntersecting)) fetchNext()
      },
      {rootMargin: '0px 0px 200px'}
  )
  if (sentinel.value) io.observe(sentinel.value)
  resetAndReload()
})

onBeforeUnmount(() => {
  if (io && sentinel.value) io.unobserve(sentinel.value)
  io = null
})
</script>

<style scoped>
/* No custom styles required */
</style>
