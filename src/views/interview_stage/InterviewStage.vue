<template>
  <div class="flex flex-col">
    <div class="dark:border-gray-700 bg-white">
      <div class="flex gap-x-2 items-center p-4 border-b rounded-md border-gray-200 text-xl">
        <p>{{ $t('interview_stage') }}</p>
      </div>
    </div>
  </div>

  <div class="p-4 space-y-4">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <input
            v-model="q"
            @input="debouncedSearch"
            class="px-3 py-2 rounded-xl border border-gray-300 w-64"
            :placeholder="$t('search') + '…'"
        />
      </div>

      <div class="flex items-center gap-2">
        <button class="px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700" @click="openCreate">
          {{ $t('new_stage') || 'Նոր փուլ' }} +
        </button>
      </div>
    </div>

    <!-- List -->
    <div class="bg-white border border-gray-300 overflow-hidden rounded-2xl">
      <table class="min-w-full text-sm">
        <thead class="bg-gray-50">
        <tr class="text-left">
          <th class="px-4 py-3">{{ $t('name') }}</th>
          <th class="px-4 py-3 w-0"></th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="row in rows" :key="row.id" class="border-t">
          <td class="px-4 py-3">{{ row.name }}</td>
          <td class="px-4 py-3">
            <div class="flex items-center gap-2">
              <button
                  class="px-3 whitespace-nowrap py-1 text-xs font-medium text-white bg-blue-600 rounded-md shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  @click="openEdit(row)"
              >
                {{ $t('view_edit') || 'Դիտել / Փոփոխել' }}
              </button>
              <button
                  class="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded-md shadow hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                  :disabled="deleting[row.id]"
                  @click="confirmDelete(row)"
              >
                {{ deleting[row.id] ? ($t('deleting') || 'Ջնջվում է…') : ($t('delete') || 'Ջնջել') }}
              </button>
            </div>
          </td>
        </tr>

        <tr v-if="!loading && rows.length === 0">
          <td colspan="5" class="p-6 text-center text-gray-500">{{ $t('empty') }}</td>
        </tr>
        </tbody>
      </table>

      <!-- infinite scroll sentinel -->
      <div ref="sentinel" class="h-8"></div>

      <!-- Footer loader -->
      <div class="p-3 border-t text-center text-sm text-gray-500" v-if="loading">
        {{ $t('loading') }}…
      </div>
    </div>

    <!-- Create/Edit modal -->
    <InterviewFormModal
        v-if="formModal.open"
        :open="formModal.open"
        :row="formModal.row"
        :id="formModal.id"
        @close="formModal.open = false"
        @saved="onSavedStage"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, watch } from 'vue'
import { purchasingApi, interviewStageApi } from '@/api.js'
import InterviewFormModal from './components/InterviewFormModal.vue'

/** Search & filters */
const q = ref('')
const kind = ref('') // kept for future filters

/** Pagination for infinite scroll */
const LIMIT = 20
const offset = ref(0)
const total = ref(0)

/** Data & state */
const rows = ref([])
const loading = ref(false)
const eof = ref(false)

/** Delete state */
const deleting = reactive({}) // { [id]: boolean }

/** Staff dropdown data (kept if you need elsewhere in page) */
const staffOptions = ref([])
const staffLoading = ref(false)
const selectedManager = reactive({}) // { [stageId]: userId } (unused currently but harmless)

/** Drawers / Modals */
const drawer = ref({ open: false, row: null })
const formModal = ref({ open: false, row: null, id: null })

function openContracts(row) { drawer.value = { open: true, row } }
function openCreate() { formModal.value = { open: true, row: null, id: null } }
/** VIEW/EDIT button => open modal with id only; modal fetches itself */
function openEdit(row) { formModal.value = { open: true, row: null, id: row.id } }


/** Fetch page */
async function fetchNext() {
  if (loading.value || eof.value) return
  loading.value = true
  try {
    const { data } = await interviewStageApi.list({
      search: q.value || undefined,
      limit: LIMIT,
      offset: offset.value
    })

    // Normalize payloads: support { data, total, next_offset } and plain array responses
    const batch = data?.data ?? data ?? []
    const nextOffset = data?.next_offset ?? (Array.isArray(batch) && batch.length ? offset.value + LIMIT : offset.value)
    total.value = data?.total ?? total.value

    // (Optional) manager mapping if needed later
    for (const r of batch) {
      if (selectedManager[r.id] === undefined) selectedManager[r.id] = r?.manager?.id ?? ''
    }

    rows.value.push(...batch)

    if (!Array.isArray(batch) || batch.length < LIMIT) eof.value = true
    else offset.value = nextOffset
  } finally {
    loading.value = false
  }
}

/** Reset & reload */
async function resetAndReload() {
  rows.value = []
  offset.value = 0
  eof.value = false
  await fetchNext()
}

/** After save in modal */
async function onSavedStage() {
  formModal.value.open = false
  await resetAndReload()
}

/** Delete flow */
function confirmDelete(row) {
  const msg = (typeof window !== 'undefined')
      ? (window?.i18n?.t?.('confirm_delete_stage') || 'Վստա՞հ եք, որ ցանկանում եք ջնջել այս փուլը։ Գործողությունը անդառնալի է։')
      : 'Վստա՞հ եք, որ ցանկանում եք ջնջել այս փուլը։'

  if (!confirm(msg)) return
  deleteStage(row)
}

async function deleteStage(row) {
  if (!row?.id || deleting[row.id]) return
  deleting[row.id] = true

  // Optimistic UI: remove row locally first
  const prevRows = rows.value.slice()
  rows.value = rows.value.filter(r => r.id !== row.id)

  try {
    await interviewStageApi.delete(row.id)
    // success: nothing else to do; optional: refresh list head to refill if you want
    if (rows.value.length < LIMIT && !eof.value) {
      await fetchNext()
    }
  } catch (e) {
    // rollback on error
    rows.value = prevRows
    console.error(e)
    alert('Ջնջումը ձախողվեց')
  } finally {
    deleting[row.id] = false
  }
}

/** Debounced search */
let t
function debouncedSearch() {
  clearTimeout(t)
  t = setTimeout(() => resetAndReload(), 300)
}
watch(kind, () => { resetAndReload() })

/** Infinite scroll */
const sentinel = ref(null)
let io
onMounted(async () => {
   io = new IntersectionObserver(
      entries => { if (entries.some(e => e.isIntersecting)) fetchNext() },
      { root: null, rootMargin: '0px 0px 200px 0px', threshold: 0 }
  )
  if (sentinel.value) io.observe(sentinel.value)
  resetAndReload()
})
onBeforeUnmount(() => { if (io && sentinel.value) io.unobserve(sentinel.value) })
</script>
