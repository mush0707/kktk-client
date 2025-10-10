<template>
  <div class="flex flex-col">
    <div class="dark:border-gray-700 bg-white">
      <div class="flex gap-x-2 items-center p-4 border-b rounded-md border-gray-200 text-xl">
        <p>{{ storage?.address }}</p>
        <p class="text-sm">({{
            !storage?.cell ? (storage?.industrial ? $t('industrial') : $t('normal')) : $t('cell')
          }})</p>
      </div>
    </div>
    <nav class="flex bg-blue-50 py-2 items-center text-sm" aria-label="Breadcrumb">
      <ol class="inline-flex items-center">

        <li>
          <router-link :to="'/storages'"
                       class="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-slate-100">
            <span class="underline-offset-2 hover:underline">{{ $t('storages') }}</span>
          </router-link>
        </li>
        <li aria-hidden="true" class="px-1">
          <svg class="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
            <path
                d="M7.05 3.55a1 1 0 0 1 1.4 0l4.5 4.5a1 1 0 0 1 0 1.4l-4.5 4.5a1 1 0 0 1-1.4-1.4L10.79 10 7.05 6.26a1 1 0 0 1 0-1.41z"/>
          </svg>
        </li>
        <li>
          <router-link :to="'/storages/'+storage?.id"
                       class="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-slate-100">
            <span class="underline-offset-2 hover:underline">{{ storage?.address }}</span>
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
            <span class="underline-offset-2 hover:underline">{{ $t('entries') }}</span>
          </p>
        </li>
      </ol>
    </nav>
  </div>
  <div class="p-4 space-y-4">
    <!-- Filters -->
    <div class="rounded-xl border border-gray-300 bg-white p-4">
      <div class="grid md:grid-cols-4 gap-3">
        <!-- From -->
        <div class="flex flex-col gap-1">
          <label class="text-sm text-gray-600">Աղբյուր</label>
          <select v-model="filters.from" class="px-3 py-2 rounded-xl border border-gray-300" @change="onFiltersChanged">
            <option value="">Բոլորը</option>
            <option value="purchasing">Գնումներ</option>
            <option value="production">Արտադրություն</option>
          </select>
        </div>

        <!-- Status -->
        <div class="flex flex-col gap-1">
          <label class="text-sm text-gray-600">Կարգավիճակ</label>
          <select v-model="filters.status" class="px-3 py-2 rounded-xl border border-gray-300"
                  @change="onFiltersChanged">
            <option value="">Բոլորը</option>
            <option value="pending">Սպասում է</option>
            <option value="in_progress">Ընթացքի մեջ</option>
            <option value="finished">Ավարտված</option>
          </select>
        </div>

        <!-- Search -->
        <div class="md:col-span-2 flex flex-col gap-1">
          <label class="text-sm text-gray-600">Փնտրել</label>
          <input
              v-model.trim="filters.search"
              @input="debouncedReload"
              class="px-3 py-2 rounded-xl border border-gray-300 w-full"
              placeholder="Փնտրել ըստ մուտք №  / ապրանք…"
          />
        </div>
      </div>
    </div>

    <!-- List -->
    <div class="bg-white border border-gray-300 rounded-xl overflow-hidden">
      <div class="px-4 py-3 border-b font-medium">Պահեստի մուտքերի ցանկ</div>

      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-gray-50">
          <tr>
            <th class="px-3 py-2 text-left">Մուտք №</th>
            <th class="px-3 py-2 text-left">Աղբյուր</th>
            <th class="px-3 py-2 text-left">Կարգավիճակ</th>
            <th class="px-3 py-2 text-left">Ստեղծվել է</th>
            <th class="px-3 py-2 text-right">Գործողություններ</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="e in entries" :key="e.id" class="border-t">
            <td class="px-3 py-2 font-medium">{{ e.identification_number }}</td>
            <td class="px-3 py-2">
                <span class="px-2 py-0.5 rounded text-xs" :class="fromChip(e.from)">
                  {{ fromLabel(e.from) }}
                </span>
            </td>
            <td class="px-3 py-2">
                <span class="px-2 py-0.5 rounded text-xs" :class="statusChip(e.status)">
                  {{ statusLabel(e.status) }}
                </span>
            </td>
            <td class="px-3 py-2 text-xs">
              <span :title="e.created_at">{{ formatDateTime(e.created_at) }}</span>
              <span class="text-xs text-gray-400 ml-2">({{ fromNow(e.created_at) }})</span>
            </td>
            <td class="px-3 py-2 text-right">
              <!-- pending -> Ընդունել աշխատանքի -->
              <button
                  v-if="e.status === 'pending'"
                  class="px-3 py-1 text-xs font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700 disabled:opacity-50"
                  :disabled="rowBusy[e.id]"
                  @click="acceptEntry(e)"
              >
                {{ rowBusy[e.id] ? 'Ընդունվում է…' : 'Ընդունել աշխատանքի' }}
              </button>

              <!-- in_progress -> Հաստատել -->
              <button
                  v-else-if="e.status === 'in_progress'"
                  class="px-3 py-1 text-xs font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:opacity-50"
                  :disabled="rowBusy[e.id]"
                  @click="confirmEntry(e)"
              >
                {{ rowBusy[e.id] ? 'Հաստատվում է…' : 'Հաստատել' }}
              </button>

              <!-- «Դիտել» եթե ուզում ես պահել-->
              <button
                  class="ml-2 px-3 py-1 text-xs font-medium border rounded-md hover:bg-gray-50"
                  @click="openEntry(e)"
              >
                Դիտել
              </button>
            </td>
          </tr>

          <tr v-if="!loading && entries.length===0">
            <td colspan="6" class="px-4 py-6 text-center text-gray-500">Արդյունք չի գտնվել</td>
          </tr>
          </tbody>
        </table>
      </div>

      <div class="p-3 border-t text-center text-sm text-gray-500" v-if="loading">Բեռնվում է…</div>
      <div ref="sentinel" class="h-8"></div>
    </div>

    <!-- Entry modal -->
    <div v-if="entryModal.open" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/40" @click="closeEntry"></div>
      <div
          class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl bg-white rounded-2xl shadow-xl"
      >
        <div class="flex items-center justify-between px-5 py-4 border-b">
          <h3 class="text-lg font-semibold">
            Մուտք № {{ entryModal.entry?.identification_number }}
          </h3>
          <button class="p-2 rounded-lg hover:bg-gray-100" @click="closeEntry" aria-label="Close">✕</button>
        </div>

        <div class="p-5 space-y-4">
          <div class="grid md:grid-cols-4 gap-3 text-sm">
            <div>
              <div class="text-gray-500">Աղբյուր</div>
              <div>
                <span class="px-2 py-0.5 rounded text-xs" :class="fromChip(entryModal.entry?.from)">
                  {{ fromLabel(entryModal.entry?.from) }}
                </span>
              </div>
            </div>
            <div>
              <div class="text-gray-500">Կարգավիճակ</div>
              <div>
                <span class="px-2 py-0.5 rounded text-xs" :class="statusChip(entryModal.entry?.status)">
                  {{ statusLabel(entryModal.entry?.status) }}
                </span>
              </div>
            </div>
            <div>
              <div class="text-gray-500">Ստեղծվել է</div>
              <div class="font-medium">
                <span :title="entryModal.entry?.created_at">{{ formatDateTime(entryModal.entry?.created_at) }}</span>
                <span class="text-xs text-gray-400 ml-2">({{ fromNow(entryModal.entry?.created_at) }})</span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <!-- 1) Ընդունել աշխատանքի — երևում է, երբ ամբողջ entry-ն pending է -->
            <button
                v-if="entryModal.entry?.status === 'pending'"
                class="px-3 py-2 rounded-xl bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
                :disabled="modalBusy"
                @click="acceptEntry"
            >
              {{ modalBusy ? 'Ընդունվում է…' : 'Ընդունել աշխատանքի' }}
            </button>

            <!-- 2) Հաստատել — երևում է, երբ ամբողջ entry-ն in_progress է -->
            <button
                v-if="entryModal.entry?.status === 'in_progress'"
                class="px-3 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                :disabled="modalBusy || !hasInProgress"
                @click="confirmEntry"
                title="Հաստատել միայն «Ընթացքի մեջ» ապրանքներն է"
            >
              {{ modalBusy ? 'Հաստատվում է…' : 'Հաստատել' }}
            </button>
          </div>
          <div class="rounded-xl border border-gray-300 overflow-hidden">
            <div class="px-4 py-3 bg-gray-50 border-b font-medium">Ապրանքներ</div>
            <table class="min-w-full text-sm">
              <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left">Ապրանք</th>
                <th class="px-4 py-3 text-left w-[120px]">Քանակ</th>
                <th class="px-4 py-3 text-left w-[120px]">Չափ</th>
                <th class="px-4 py-3 text-left w-[160px]">Կարգավիճակ</th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="p in (entryModal.entry?.products || [])" :key="p.id" class="border-t">
                <td class="px-4 py-2 font-medium">
                  <div class="font-medium truncate">{{ p.product?.name ?? ('#' + p.product_id) }}</div>
                  <div v-if="Array.isArray(p.product.characteristics) && p.product.characteristics.length" class="mt-1 flex flex-wrap gap-1">
                    <span
                        v-for="c in p.characteristics"
                        :key="c.id||c.name"
                        class="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-700"
                    >{{ c.name }}</span>
                  </div>
                  <div v-if="p.product?.type?.name" class="text-xs text-slate-500">Տեսակ՝ {{
                      p.product.type.name
                    }}
                  </div>
                </td>
                <td class="px-4 py-2">{{ formatNumber(p.qty) }}</td>
                <td class="px-4 py-2">{{ $t(p.measure || 'piece') }}</td>
                <td class="px-4 py-2">
                    <span class="px-2 py-0.5 rounded text-xs" :class="sepStatusChip(p.status)">
                      {{ sepStatusLabel(p.status) }}
                    </span>
                </td>
              </tr>
              <tr v-if="(entryModal.entry?.products?.length || 0)===0">
                <td colspan="4" class="px-4 py-4 text-center text-slate-500">Ապրանքներ չկան</td>
              </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 px-5 py-4 border-t">
          <button class="px-3 py-2 rounded-xl border hover:bg-gray-50" @click="closeEntry">Փակել</button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import {ref, onMounted, watch, onBeforeUnmount, computed} from 'vue'
import {useRoute} from 'vue-router'
import {mainApi, wmsApi} from '@/api.js'
import { useToast } from 'vue-toastification'
import { storageEntriesApi } from '@/api.js'
const route = useRoute()
const storage = ref(null)
// const pendingCount = ref(0)
import { formatDateTime, fromNow } from '@/utils/dateFormat.js'

const load = async () => {
  const id = Number(route.params.id)
  storage.value = await mainApi.getStorageById(id)
  // pendingCount.value = await wmsApi.getPendingPlacementsCount(id)
}
type AnyObj = Record<string, any>
const toast = useToast()
const modalBusy = ref(false)
const rowBusy = ref<Record<number, boolean>>({})

// «Ցանկում կա՞ գոնե մեկ in_progress ապրանք»՝ վերևի «Հաստատել» կոճակի enable-ի համար
const hasInProgress = computed(() =>
    Array.isArray(entryModal.entry?.products)
        ? entryModal.entry.products.some((it:any) => it.status === 'in_progress')
        : false
)
async function acceptEntry(e:any) {
  rowBusy.value[e.id] = true
  try {
    await storageEntriesApi.accept(storage.value.id, e.id)            // POST /storage-entries/:id/accept
    e.status = 'in_progress'                        // UI refresh
  } finally {
    rowBusy.value[e.id] = false
  }
}

async function confirmEntry(e:any) {
  rowBusy.value[e.id] = true
  try {
    await storageEntriesApi.confirm(storage.value.id, e.id)           // POST /storage-entries/:id/confirm
    e.status = 'finished'                           // UI refresh
  } finally {
    rowBusy.value[e.id] = false
  }
}
/* -------- Filters -------- */
const filters = ref<{ from: string; status: string; search: string }>({
  from: '',
  status: '',
  search: '',
})

function onFiltersChanged() { resetAndFetch() }

let debounceTimer: any = null
function debouncedReload() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(resetAndFetch, 300)
}

/* -------- Infinite list -------- */
const entries = ref<any[]>([])
const loading = ref(false)
const eof = ref(false)
const LIMIT = 30
const offset = ref(0)
const sentinel = ref<HTMLElement | null>(null)
let io: IntersectionObserver | null = null

async function fetchNext() {
  // storage-ը դեռ չի լոդվել → ոչինչ չանենք
  if (!storage.value || !storage.value.id) return

  if (loading.value || eof.value) return
  loading.value = true
  try {
    const params: AnyObj = {
      limit: LIMIT,
      offset: offset.value,
      search: filters.value.search || undefined,
      status: filters.value.status || undefined,
      from: filters.value.from || undefined,
      include: 'storage,products.product,products.product.type',
    }
    const data = await storageEntriesApi.list(storage.value.id, params)
    const batch = (data?.data ?? data ?? []) as any[]
    entries.value.push(...batch)
    if (batch.length < LIMIT) eof.value = true
    else offset.value += LIMIT
  } catch (e:any) {
    toast.error(e?.response?.data?.message || 'Չհաջողվեց բեռնել մուտքերը')
  } finally {
    loading.value = false
  }
}

async function resetAndFetch() {
  entries.value = []
  eof.value = false
  offset.value = 0
  await fetchNext()
}

onMounted(async () => {
  await load()  // այստեղ storage.value արդեն լրացված է

  io = new IntersectionObserver(
      (ents) => {
        // storage guard՝ նույնիսկ observer-ի դեպքում
        if (!storage.value || !storage.value.id) return
        if (ents.some(x => x.isIntersecting)) fetchNext()
      },
      { rootMargin: '0px 0px 200px' }
  )
  if (sentinel.value) io.observe(sentinel.value)

  // հիմա կարելի է բեռնել առաջին էջը
  await resetAndFetch()
})
onBeforeUnmount(() => {
  if (io && sentinel.value) io.unobserve(sentinel.value)
})

/* -------- Modal -------- */
const entryModal = ref<{ open: boolean; entry: any | null }>({ open: false, entry: null })

function openEntry(e: any) {
  entryModal.value = { open: true, entry: e }
}

function closeEntry() {
  entryModal.value = { open: false, entry: null }
}

/* -------- UI helpers -------- */
function formatNumber(
    value: any,
    { maximumFractionDigits = 6, minimumFractionDigits = 0, locale = 'hy-AM' } = {}
) {
  if (value === null || value === undefined || value === '') return ''
  const num = typeof value === 'string' ? Number(value) : value
  if (!isFinite(num)) return String(value)
  return new Intl.NumberFormat(locale, { maximumFractionDigits, minimumFractionDigits, useGrouping: false })
      .format(num)
}
function fmtDate(iso?: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  return isNaN(d as any) ? iso : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

/* from -> label/chip */
function fromLabel(v?: string) {
  if (v === 'purchasing') return 'Գնումներ'
  if (v === 'production') return 'Արտադրություն'
  return v || '—'
}
function fromChip(v?: string) {
  if (v === 'purchasing') return 'bg-sky-100 text-sky-700'
  if (v === 'production') return 'bg-violet-100 text-violet-700'
  return 'bg-gray-100 text-gray-700'
}

/* storage_entries.status -> label/chip */
const ENTRY_STATUS_LABELS: Record<string, string> = {
  pending: 'Սպասում է',
  in_progress: 'Ընթացքի մեջ',
  finished: 'Ավարտված',
}
function statusLabel(s?: string) { return ENTRY_STATUS_LABELS[s || ''] || s || '—' }
function statusChip(s?: string) {
  if (s === 'finished') return 'bg-emerald-100 text-emerald-700'
  if (s === 'in_progress') return 'bg-indigo-100 text-indigo-700'
  if (s === 'pending') return 'bg-amber-100 text-amber-700'
  return 'bg-gray-100 text-gray-700'
}

/* storage_entry_products.status -> label/chip */
const SEP_STATUS_LABELS: Record<string, string> = {
  pending: 'Սպասում է',
  in_progress: 'Ընթացքի մեջ',
  finished: 'Ավարտված',
}
function sepStatusLabel(s?: string) { return SEP_STATUS_LABELS[s || ''] || s || '—' }
function sepStatusChip(s?: string) {
  if (s === 'finished') return 'bg-emerald-100 text-emerald-700'
  if (s === 'in_progress') return 'bg-indigo-100 text-indigo-700'
  if (s === 'pending') return 'bg-amber-100 text-amber-700'
  return 'bg-gray-100 text-gray-700'
}
watch(() => route.params.id, async () => {
  await load()
  await resetAndFetch()
})
</script>