<!-- src/views/hr/components/Holidays/HolidaysTab.vue -->
<template>
  <div class="space-y-4">
    <!-- Filters / Actions -->
    <div class="flex flex-col md:flex-row md:items-center gap-2 justify-between">
      <div class="flex gap-2">
        <input v-model.trim="filters.search"
               @input="onFilterInput"
               class="px-3 py-2 rounded-xl border border-gray-300 w-56"
               :placeholder="'Որոնել անվանումով…'">
<!--        <select v-model.number="filters.year" @change="resetAndFetch"-->
<!--                class="px-3 py-2 rounded-xl border border-gray-300">-->
<!--          <option :value="undefined">{{ $t('all') || 'Բոլորը' }}</option>-->
<!--          <option v-for="y in years" :key="y" :value="y">{{ y }}</option>-->
<!--        </select>-->
      </div>
      <button @click="openCreate"
              class="px-3 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700">
        {{ $t('create') || 'Ստեղծել տոն' }}
      </button>
    </div>

    <!-- Scroll container -->
    <div ref="scrollBox"
         class="overflow-auto rounded-xl border border-gray-200 bg-white"
         style="max-height: 60vh">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 text-left sticky top-0 z-10">
        <tr>
          <th class="px-4 py-2">Անվանում</th>
          <th class="px-4 py-2 w-36">Ֆիքսված օր</th>
          <th class="px-4 py-2">Ամենաթարմ օր</th>
          <th class="px-4 py-2"></th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="h in rows" :key="h.id"
            class="border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200"
            :class="rowHighlight(h)">
          <td class="px-4 py-2">
            <div class="font-medium">{{ h.name }}</div>
          </td>

          <td class="px-4 py-2">
              <span v-if="h.fixed_day" class="px-2 py-1 rounded bg-slate-100">
                {{ formatFixed(h.fixed_day) }}
              </span>
            <span v-else class="text-slate-500">—</span>
          </td>

          <!-- Only the first date (if any). If none -> row red via rowHighlight() -->
          <td class="px-4 py-2">
            <span v-if="firstDateOf(h)"
                  class="inline-flex items-center gap-1 border border-gray-300 rounded-lg px-2 py-0.5 bg-white">
                  {{ firstDateLabel(h) }}
                </span>
            <span v-else class="text-slate-400">—</span>
          </td>

          <td class="px-4 py-2 text-right space-x-2">
            <div class="flex gap-2">
              <button v-if="!h.fixed_day" class="px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs"
                      @click="openAddDate(h)">
                Կցել ամսաթիվ
              </button>
              <button class="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-300 text-xs"
                      @click="openListDates(h)">
                Դիտել կցված ամսաթվերը
              </button>
              <button class="px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-xs"
                      @click="openEdit(h)">
                {{ $t('edit') }}
              </button>
            </div>
          </td>
        </tr>

        <!-- Empty state -->
        <tr v-if="!loading && !rows.length">
          <td colspan="4" class="px-4 py-6 text-center text-slate-500">
            {{ $t('nothing_found') || 'Ցուցակը դատարկ է' }}
          </td>
        </tr>

        <!-- Loading row -->
        <tr v-if="loading">
          <td colspan="4" class="px-4 py-4 text-center text-slate-500">
            {{ $t('loading') || 'Բեռնում…' }}
          </td>
        </tr>

        <!-- Sentinel -->
        <tr ref="sentinel" v-show="!end && rows.length">
          <td colspan="4" class="py-2"></td>
        </tr>
        </tbody>
      </table>
    </div>

    <!-- Upsert Holiday Modal -->
    <div v-if="modals.upsert.open" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/30" @click="closeUpsert"></div>
      <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-xl">
        <div class="px-5 py-4 border-b font-semibold">
          {{ modals.upsert.model?.id ? 'Խմբագրել' : 'Ստեղծել' }}
        </div>
        <div class="p-5 space-y-3 text-sm">
          <div class="flex flex-col gap-1">
            <label class="text-slate-600">{{ 'Անվանում' }} <span class="text-red-600">*</span></label>
            <input v-model.trim="upsertForm.name" class="w-full px-3 py-2 rounded-xl border border-gray-300"/>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="flex flex-col gap-1">
              <label class="text-slate-600">{{ 'Ամիս (ֆիքսված)' }}</label>
              <input v-model.number="upsertForm.fixed_month" type="number" min="1" max="12"
                     class="w-full px-3 py-2 rounded-xl border border-gray-300" placeholder="1..12"/>
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-slate-600">{{ 'Օր (ֆիքսված)'}}</label>
              <input v-model.number="upsertForm.fixed_day" type="number" min="1" max="31"
                     class="w-full px-3 py-2 rounded-xl border border-gray-300" placeholder="1..31"/>
            </div>
          </div>
        </div>
        <div class="px-5 py-3 border-t flex items-center justify-end gap-2">
          <button class="px-3 py-2 rounded-xl border hover:bg-gray-50" @click="closeUpsert">Փակել</button>
          <button class="px-3 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700" @click="saveHoliday" :disabled="saving">
            <span v-if="saving">{{ 'Պահպանում…' }}</span>
            <span v-else>{{ 'Պահպանել' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Upsert Date Modal (attach/edit one date) -->
    <div v-if="modals.date.open" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/30" @click="closeDate"></div>
      <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-2xl shadow-xl">
        <div class="px-5 py-4 border-b font-semibold">
          {{ modals.date.model?.id ? 'Օրվա խմբագրում' : 'Օր ավելացնել' }}
        </div>
        <div class="p-5 space-y-3 text-sm">
          <div class="flex flex-col gap-1">
            <label class="text-slate-600">{{ 'Ամսաթիվ' }} <span class="text-red-600">*</span></label>
            <input v-model="dateForm.date" type="date" class="w-full px-3 py-2 rounded-xl border border-gray-300"/>
          </div>
        </div>
        <div class="px-5 py-3 border-t flex items-center justify-end gap-2">
          <button class="px-3 py-2 rounded-xl border hover:bg-gray-50" @click="closeDate">Փակել</button>
          <button class="px-3 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700" @click="saveDate" :disabled="savingDate">
            <span v-if="savingDate">{{ 'Պահպանում…' }}</span>
            <span v-else>{{ 'Պահպանել'}}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Dates List Modal (view all attached dates) -->
    <div v-if="modals.listDates.open" class="fixed inset-0 z-30">
      <div class="absolute inset-0 bg-black/30" @click="closeListDates"></div>
      <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-xl">
        <div class="px-5 py-4 border-b font-semibold flex items-center justify-between">
          <span>Կցված ամսաթվեր</span>
          <span class="text-slate-500 text-sm" v-if="modals.listDates.parent">{{ modals.listDates.parent.name }}</span>
        </div>
        <div class="p-5 space-y-3 text-sm max-h-[60vh] overflow-auto">
          <div v-if="!(modals.listDates.parent?.dates?.length)">
            <div class="text-slate-500">{{ $t('nothing_found') || 'Ցուցակը դատարկ է' }}</div>
          </div>
          <div v-else class="space-y-2">
            <div v-for="d in modals.listDates.parent.dates" :key="d.id"
                 class="flex items-center justify-between border rounded-xl px-3 py-2">
              <div class="font-medium">{{ (d.date || d.day) }}</div>
              <div v-if="!modals.listDates.parent.fixed_day" class="space-x-2">
                <button class="px-3 py-1.5 rounded-lg border hover:bg-gray-50 text-xs"
                        @click="openEditDate(modals.listDates.parent, d)">
                  {{ $t('edit') }}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="px-5 py-3 border-t flex items-center justify-end gap-2">
          <button class="px-3 py-2 rounded-xl border hover:bg-gray-50" @click="closeListDates">Փակել</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { holidaysApi } from '@/api.js'

const { t } = useI18n()

// years dropdown (next year to last 5)
const years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() + 1 - i)

// filters
const filters = reactive<{ search?: string; year?: number | undefined }>({
  search: '',
  year: undefined
})
const selectedYear = () => (filters.year ?? new Date().getFullYear())

// paging/infinite
const limit = 20
const offset = ref(0)
const end = ref(false)
const loading = ref(false)
const rows = ref<any[]>([])

const scrollBox = ref<HTMLElement | null>(null)
const sentinel = ref<HTMLElement | null>(null)
let io: IntersectionObserver | null = null

function getListParams() {
  return {
    limit,
    offset: offset.value,
    search: filters.search || undefined,
    year: filters.year || undefined,
  }
}

async function loadNextPage() {
  if (loading.value || end.value) return
  loading.value = true
  try {
    const res = await holidaysApi.list(getListParams())
    const page = Array.isArray(res?.data) ? res.data : (res?.data ?? res ?? [])
    const arr = Array.isArray(page) ? page : (Array.isArray(res?.data?.data) ? res.data.data : [])
    rows.value.push(...arr)
    if (arr.length < limit) end.value = true
    offset.value += limit
  } finally {
    loading.value = false
  }
}

function resetAndFetch(): Promise<void> {
  offset.value = 0
  end.value = false
  rows.value = []
  return new Promise((resolve) => {
    // ensure loadNextPage runs after DOM clears
    requestAnimationFrame(async () => {
      await loadNextPage()
      resolve()
    })
  })
}

// debounce search input ~300ms
let searchTimer: number | null = null
function onFilterInput() {
  if (searchTimer) window.clearTimeout(searchTimer)
  searchTimer = window.setTimeout(() => resetAndFetch(), 300) as unknown as number
}

// IntersectionObserver
function mountObserver() {
  if (!sentinel.value) return
  io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) loadNextPage()
  }, { root: scrollBox.value || undefined, threshold: 0.1 })
  io.observe(sentinel.value)
}
function unmountObserver() {
  if (io && sentinel.value) io.unobserve(sentinel.value)
  io?.disconnect()
  io = null
}

// ───── Modals & CRUD ─────
const modals = reactive({
  upsert: { open: false, model: null as any | null },
  date:   { open: false, model: null as any | null, parent: null as any | null },
  listDates: { open: false, parent: null as any | null },
})

function openCreate() {
  modals.upsert.model = null
  upsertForm.name = ''
  upsertForm.fixed_month = undefined as any
  upsertForm.fixed_day = undefined as any
  modals.upsert.open = true
}
function openEdit(h: any) {
  modals.upsert.model = h
  upsertForm.name = h.name
  if (h.fixed_day) {
    const [mm, dd] = String(h.fixed_day).split('-').map((x: string) => Number(x))
    upsertForm.fixed_month = mm || undefined
    upsertForm.fixed_day = dd || undefined
  } else {
    upsertForm.fixed_month = undefined as any
    upsertForm.fixed_day = undefined as any
  }
  modals.upsert.open = true
}
function closeUpsert() { modals.upsert.open = false }

const upsertForm = reactive<{ name: string; fixed_month?: number; fixed_day?: number }>({
  name: '', fixed_month: undefined, fixed_day: undefined
})
const saving = ref(false)
async function saveHoliday() {
  try {
    saving.value = true
    const payload: any = { name: upsertForm.name }
    if (upsertForm.fixed_month) payload.fixed_month = upsertForm.fixed_month
    if (upsertForm.fixed_day) payload.fixed_day = upsertForm.fixed_day

    if (modals.upsert.model?.id) {
      await holidaysApi.update(modals.upsert.model.id, payload)
    } else {
      await holidaysApi.create(payload)
    }
    closeUpsert()
    resetAndFetch()
  } finally {
    saving.value = false
  }
}

function openAddDate(h: any) {
  modals.date.parent = h
  modals.date.model = null
  dateForm.date = ''
  modals.date.open = true
}
function openEditDate(h: any, d: any) {
  modals.date.parent = h
  modals.date.model = d
  dateForm.date = (d.date || d.day) // handle both shapes
  modals.date.open = true
}
function closeDate() { modals.date.open = false }

const dateForm = reactive<{ date: string }>({ date: '' })
const savingDate = ref(false)
async function saveDate() {
  if (!modals.date.parent?.id) return
  try {
    savingDate.value = true

    const parentId = modals.date.parent.id
    const isEdit = !!modals.date.model?.id

    if (isEdit) {
      await holidaysApi.updateDate(parentId, modals.date.model.id, { date: dateForm.date })
    } else {
      await holidaysApi.addDate(parentId, { date: dateForm.date })
    }

    // close only the date editor, keep the dates list modal as-is
    closeDate()

    // refresh main list (and highlights)
    await resetAndFetch()

    // if the dates list modal is open, repoint it to the fresh row from the list
    if (modals.listDates.open) {
      const fresh = rows.value.find((r) => r.id === parentId)
      if (fresh) modals.listDates.parent = fresh
    }
  } finally {
    savingDate.value = false
  }
}

function openListDates(h: any) {
  modals.listDates.parent = h
  modals.listDates.open = true
}
function closeListDates() { modals.listDates.open = false }

// Try to update just the parent row's dates after save (optional)
async function resetParentDates(h: any) {
  // if API has a single-item GET, you could fetch and replace only this row.
  // keeping simple here; main resetAndFetch() will refresh the list anyway.
}

// ───── Helpers / business rules ─────
function formatFixed(d?: string | null) {
  if (!d) return '—'
  const parts = String(d).split('-')
  return parts.length === 2 ? `${String(parts[0]).padStart(2,'0')}-${String(parts[1]).padStart(2,'0')}` : d
}
function firstDateOf(h: any) {
  const arr = h?.dates || []
  return arr.length ? arr[0] : null
}
function firstDateLabel(h: any) {
  const fd = firstDateOf(h)
  const v = fd ? (fd.date || fd.day) : ''
  return v
}
function rowHighlight(h: any) {
  if (h?.fixed_day) return '' // fixed holidays aren't evaluated by the rule
  const fd = firstDateOf(h)
  if (!fd) return 'bg-red-50'
  const dateStr = (fd.date || fd.day)
  const y = parseInt(String(dateStr).slice(0,4), 10)
  if (!isNaN(y) && y < selectedYear()) return 'bg-yellow-50'
  return ''
}

onMounted(() => {
  resetAndFetch()
  setTimeout(mountObserver, 0)
})
onBeforeUnmount(() => {
  unmountObserver()
  if (searchTimer) window.clearTimeout(searchTimer)
})
</script>
