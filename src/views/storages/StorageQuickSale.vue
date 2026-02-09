<template>
  <div class="flex flex-col">
    <div class="dark:border-gray-700 bg-white">
      <div class="flex gap-x-2 items-center p-4 border-b rounded-md border-gray-200 text-xl">
        <p>{{ storage?.address }}</p>
        <p class="text-sm">
          ({{ !storage?.cell ? (storage?.industrial ? $t('industrial') : $t('normal')) : $t('cell') }})
        </p>
      </div>
    </div>

    <nav class="flex bg-blue-50 py-2 items-center text-sm" aria-label="Breadcrumb">
      <ol class="inline-flex items-center">
        <li>
          <router-link
              to="/storages"
              class="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-slate-100"
          >
            <span class="underline-offset-2 hover:underline">{{ $t('storages') }}</span>
          </router-link>
        </li>
        <li aria-hidden="true" class="px-1">
          <svg class="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
            <path d="M7.05 3.55a1 1 0 0 1 1.4 0l4.5 4.5a1 1 0 0 1 0 1.4l-4.5 4.5a1 1 0 0 1-1.4-1.4L10.79 10 7.05 6.26a1 1 0 0 1 0-1.41z"/>
          </svg>
        </li>
        <li>
          <router-link
              :to="`/storages/${storage?.id}`"
              class="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-slate-100"
          >
            <span class="underline-offset-2 hover:underline">{{ storage?.address }}</span>
          </router-link>
        </li>
        <li aria-hidden="true" class="px-1">
          <svg class="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
            <path d="M7.05 3.55a1 1 0 0 1 1.4 0l4.5 4.5a1 1 0 0 1 0 1.4l-4.5 4.5a1 1 0 0 1-1.4-1.4L10.79 10 7.05 6.26a1 1 0 0 1 0-1.41z"/>
          </svg>
        </li>
        <li>
          <p class="inline-flex items-center gap-1 rounded-md px-2 py-1">
            <span class="underline-offset-2 hover:underline">Արագ վաճառքներ</span>
          </p>
        </li>
      </ol>
    </nav>
  </div>
  <section class="bg-white px-4">
    <!-- Filters (NO customer filter) -->
    <div class="pb-4 pt-4 border-b grid lg:grid-cols-6 gap-2 text-sm">
      <input
          v-model="filters.search"
          class="border border-gray-300 rounded-xl px-3 py-2 lg:col-span-2"
          placeholder="Փնտրել (սերիա, ապրանք)"
      />

      <select v-model="filters.status" class="border border-gray-300 rounded-xl px-3 py-2">
        <option :value="''">Բոլորը</option>
        <option value="ready">Պատրաստ</option>
        <option value="written_off">Դուրս գրված</option>
      </select>

      <div class="grid grid-cols-2 gap-2 lg:col-span-2 lg:grid-cols-2">
        <input v-model="filters.date_from" type="date" class="border border-gray-300 rounded-xl px-3 py-2" />
        <input v-model="filters.date_to"   type="date" class="border border-gray-300 rounded-xl px-3 py-2" />
      </div>

      <div class="flex items-center gap-2">
        <button class="px-3 py-2 rounded-xl border" @click="reload">Կիրառել</button>
        <button class="px-3 py-2 rounded-xl border" @click="clearFilters">Մաքրել</button>
      </div>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto">
      <table class="min-w-full text-sm">
        <thead class="bg-slate-50 text-left">
        <tr>
          <th class="px-3 py-2">Համարը</th>
          <th class="px-3 py-2">Հաճախորդ</th>
          <th class="px-3 py-2">Ստեղծվել է</th>
          <th class="px-3 py-2">Թարմացվել է</th>
          <th class="px-3 py-2 w-48 text-right">Գործողություններ</th>
        </tr>
        </thead>
        <tbody>
        <template v-for="row in rows" :key="row.id">
          <tr class="border-t hover:bg-slate-50 cursor-pointer" @click="toggle(row)">
            <td class="px-3 py-2">
              <div class="font-medium">#{{ row.identification_number || row.id }}</div>
              <span
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1"
                  :class="statusBadgeMeta(row.status).classes"
              >
                {{ statusBadgeMeta(row.status).label }}
              </span>
            </td>

            <td class="px-3 py-2">{{ customerLabel(row.customer) || '—' }}</td>

            <td class="px-3 py-2">
              <div>{{ formatDateTime(row.created_at) }}</div>
              <div class="text-[11px] text-slate-500">({{ fromNow(row.created_at) }})</div>
            </td>
            <td class="px-3 py-2">
              <div>{{ formatDateTime(row.updated_at) }}</div>
              <div class="text-[11px] text-slate-500">({{ fromNow(row.updated_at) }})</div>
            </td>

            <td class="px-3 py-2 text-right">
              <button v-if="row.status !== 'written_off'"
                  class="px-3 py-1.5 text-xs rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
                  @click.stop="writeOffRow(row)"
              >
                Դուրս գրել
              </button>
            </td>
          </tr>

          <!-- Expanded products (no extra request) -->
          <tr v-if="expanded[row.id]" class="bg-white">
            <td colspan="5" class="px-3 py-2">
              <div class="divide-y">
                <div
                    v-for="it in (row.products || [])"
                    :key="it.id"
                    class="py-2 flex items-center justify-between"
                >
                  <div class="min-w-0">
                    <div class="font-medium truncate">{{ productName(it) }}</div>

                    <!-- characteristics -->
                    <div
                        v-if="Array.isArray(it.product?.characteristics) && it.product.characteristics.length"
                        class="mt-1 hidden sm:flex flex-wrap gap-1"
                    >
                      <span
                          v-for="c in it.product.characteristics.slice(0,3)"
                          :key="c.id || c.name"
                          class="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600"
                      >
                        {{ c.name }}
                      </span>
                    </div>

                    <!-- qty + badge -->
                    <div class="mt-2 text-slate-600 flex items-center gap-3">
                      <span>{{ it.qty }} {{ $t(measureOf(it)) }}</span>
                      <span
                          class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium"
                          :class="productStatusMeta(it.status).classes"
                      >
                        {{ productStatusMeta(it.status).label }}
                      </span>
                    </div>
                  </div>

                  <div class="flex items-center gap-2">
                    <!-- NO amount here -->
                    <button v-if="row.status !== 'written_off'"
                        class="px-3 py-1.5 text-xs rounded-md bg-green-600 text-white hover:bg-green-700"
                        @click="openCellsModal(row, it)"
                    >
                      Բաշխել
                    </button>
                  </div>
                </div>

                <div v-if="!(row.products || []).length" class="py-2 text-slate-400 text-sm">
                  Դիտարկվող վաճառքը չի պարունակում ապրանքներ
                </div>
              </div>
            </td>
          </tr>
        </template>
        </tbody>
      </table>
    </div>

    <div ref="sentinel" class="h-8"></div>
    <div v-if="loading.table" class="p-4 text-center text-slate-500">Բեռնվում է…</div>
    <div v-if="!loading.table && !rows.length" class="p-6 text-center text-slate-400">Տվյալներ չկան</div>
  </section>

  <!-- Cells Modal -->
  <div v-if="cellsModal.open" class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
    <div class="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden">
      <div class="px-4 py-3 border-b flex items-center justify-between">
        <div class="font-semibold">
          Ելքագրման բջիջներ — {{ cellsModal.item?.product?.name || cellsModal.item?.storage_product_id }}
        </div>
        <button class="p-2 hover:bg-gray-100 rounded" @click="closeCellsModal">✕</button>
      </div>

      <div class="p-5 space-y-4">
        <!-- chips -->
        <div class="flex flex-wrap gap-2">
          <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-slate-100 text-slate-700">
            Պահանջված՝ <b class="ml-1">{{ fmt(cellsModal.item?.qty) }}</b>
            {{ unitShort(cellsModal.item?.storage_product?.measure || cellsModal.item?.measure) }}
          </span>
          <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-indigo-100 text-indigo-700">
            Չտեղավորված առկա՝ <b class="ml-1">{{ fmt(cellsModal.availableNotPlaced) }}</b>
          </span>
        </div>

        <!-- cells table -->
        <div class="border rounded-xl overflow-hidden">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-50">
            <tr>
              <th class="px-3 py-2 text-left">Բջիջ</th>
              <th class="px-3 py-2 text-right">Մնացորդ</th>
              <th class="px-3 py-2 text-right">Ավելի. (առկա)</th>
              <th class="px-3 py-2 text-right">Ելքագրման քանակ</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="row in cellsModal.cells" :key="row.cell_id" class="border-t">
              <td class="px-3 py-2">{{ row.cell_name }}</td>
              <td class="px-3 py-2 text-right tabular-nums">{{ fmt(row.qty) }}</td>
              <td class="px-3 py-2 text-right tabular-nums">{{ fmt(row.available) }}</td>
              <td class="px-3 py-2 text-right">
                <input
                    type="number" min="0" step="0.001"
                    class="border border-slate-300 rounded-lg px-2 py-1 w-32 text-right focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    v-model.number="cellsModal.alloc[row.cell_id]"
                />
              </td>
            </tr>
            <tr v-if="!cellsModal.cells.length">
              <td colspan="4" class="px-3 py-6 text-center text-gray-500">Տվյալ ապրանքը բջիջներում առկա չէ</td>
            </tr>
            </tbody>
          </table>
        </div>

        <!-- bottom cards -->
        <div class="grid sm:grid-cols-2 gap-4">
          <!-- not placed -->
          <div class="rounded-xl border border-slate-200 p-3">
            <div class="text-sm font-medium mb-2">Չտեղավորվածից ելքագրման քանակ</div>
            <input
                type="number" min="0" step="0.001"
                class="w-full border border-slate-300 rounded-lg px-3 py-2 text-right
                     focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                v-model.number="cellsModal.allocNotPlaced"
            />
            <div class="mt-1 text-xs text-slate-500">
              Նախկինում ընտրված՝ <b>{{ fmt(cellsModal.prevNotPlaced) }}</b>
              · Առկա՝ <b>{{ cellsModal.availableNotPlaced!=null ? fmt(cellsModal.availableNotPlaced) : '—' }}</b>
            </div>
            <p v-if="Number(cellsModal.allocNotPlaced||0) < 0" class="text-xs text-rose-600 mt-1">
              Չի կարող լինել բացասական։
            </p>
          </div>

          <!-- totals -->
          <div class="rounded-xl border border-slate-200 p-3">
            <div class="text-sm font-medium mb-2">Ընդհանուր</div>
            <div class="text-sm">
              <div class="flex items-center justify-between">
                <span>Ընդամենը (բջիջներ)</span>
                <b class="tabular-nums">{{ fmt(sumAllocCells) }}</b>
              </div>
              <div class="flex items-center justify-between">
                <span>Ընդամենը (բջիջներ + չտեղավորված)</span>
                <b class="tabular-nums">{{ fmt(sumTotal) }}</b>
              </div>
              <div class="mt-1 text-xs text-slate-500">Սահման՝ {{ fmt(requiredQty) }}</div>
              <p v-if="!totalsMatch" class="text-xs text-amber-700 mt-1">
                Պետք է բաշխել ճշգրիտ {{ fmt(requiredQty) }} քանակ (բջիջներ + չտեղավորվող)։
              </p>
            </div>
          </div>
        </div>

        <!-- footer buttons -->
        <div class="flex justify-end gap-2 pt-1">
          <button class="px-3 py-2 rounded-xl border hover:bg-gray-50" @click="closeCellsModal">Փակել</button>
          <button
              class="px-3 py-2 rounded-xl text-white"
              :class="(!canSave || savingCells) ? 'bg-slate-400 cursor-not-allowed' : 'bg-green-900 hover:bg-green-800'"
              :disabled="!canSave || savingCells"
              @click="saveCellsAlloc"
          >
            <span v-if="savingCells">Պահպանում…</span>
            <span v-else>Պահպանել</span>
          </button>
        </div>

        <p v-if="!totalsMatch" class="text-sm text-amber-700 mt-2">
          Պետք է բաշխել ճշգրիտ <b>{{ fmt(requiredQty) }}</b> քանակ (բջիջներ + չտեղավորված)։
        </p>
        <p v-else-if="Number(cellsModal.allocNotPlaced||0) > Number(cellsModal.availableNotPlaced||0)" class="text-sm text-rose-600 mt-2">
          «Չտեղավորվածից» ընտրած քանակը չի կարող գերազանցել հասանելիին։
        </p>
        <p v-if="cellsModal.error" class="text-sm text-rose-600">{{ cellsModal.error }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import {mainApi, sales, storagesApi, warehouseDemandApi, wmsApi} from '@/api'
import { formatDateTime, fromNow } from '@/utils/dateFormat'
import {useRoute} from "vue-router";

type Customer = { id:number; first_name?:string; last_name?:string; full_name?:string } | null
type ProductItem = {
  id: number
  name?: string
  product?: { id:number; name:string; measure?:string; characteristics?: any[] }
  qty: number
  measure?: string | null
  status?: 'need_to_locate' | 'located' | 'written_off' | string
  storage_product?: { measure?: string } | null
}
type OutputRow = {
  id: number
  identification_number?: string | number
  customer?: Customer
  status?: 'ready' | 'written_off' | string | null
  created_at: string
  updated_at: string
  products?: ProductItem[]
}
const storage = ref(null)
const rows = ref<OutputRow[]>([])
const loading = reactive({ table:false })
const limit = 20
let offset = 0

const filters = reactive<{
  search: string
  status: '' | 'ready' | 'written_off'
  date_from: string
  date_to: string
}>({
  search: '',
  status: '',
  date_from: '',
  date_to: ''
})

/* helpers */
function customerLabel(c?: Customer) {
  if (!c) return ''
  // adjust to your backend shape
  // @ts-ignore
  return c.full_name || [c.first_name, c.last_name].filter(Boolean).join(' ')
}
function statusBadgeMeta(s: any) {
  switch (s) {
    case 'ready':       return { label: 'Պատրաստ',     classes: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200' }
    case 'written_off': return { label: 'Դուրս գրված', classes: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200' }
    default:            return { label: 'Անորոշ',      classes: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200' }
  }
}
function productStatusMeta(s: any) {
  switch (s) {
    case 'need_to_locate': return { label: 'Պետք է բաշխել', classes: 'bg-amber-100 text-amber-800 ring-1 ring-amber-200' }
    case 'located':        return { label: 'Բաշխված',       classes: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200' }
    case 'written_off':    return { label: 'Դուրս գրված',   classes: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200' }
    default:               return { label: s || '—',        classes: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200' }
  }
}
function productName(it: ProductItem) {
  return it.name || it.product?.name || 'Ապրանք'
}
function measureOf(it: ProductItem) {
  return it.measure || it.storage_product?.measure || it.product?.measure || 'piece'
}

/* fetch */
function makeQuery(reset=false){
  return {
    limit,
    offset: reset ? 0 : offset,
    search: filters.search || null,
    status: filters.status || null,
    date_from: filters.date_from || null,
    date_to: filters.date_to || null,
  }
}
async function loadMore(){
  if (loading.table) return
  loading.table = true
  try{
    const data = await storagesApi.getQuickSales(route.params.id, makeQuery())
    const arr: OutputRow[] = Array.isArray(data?.data) ? data.data : []
    if (offset === 0) rows.value = arr
    else rows.value.push(...arr)
    if (arr.length === limit) offset += limit
  } finally { loading.table = false }
}
function reload(){ offset = 0; for (const k in expanded) delete expanded[k]; loadMore() }
function clearFilters(){
  filters.search = ''
  filters.status = ''
  filters.date_from = ''
  filters.date_to = ''
  reload()
}

/* expand */
const expanded = reactive<Record<number, boolean>>({})
function toggle(r: OutputRow){ expanded[r.id] = !expanded[r.id] }

/* actions */
async function writeOffRow(r: OutputRow){
  if (!confirm('Կատարե՞լ դուրսգրում')) return
  // ↳ adjust API to your backend
  await storagesApi.writtenOffQuickSale(route.params.id, r.id)
  r.status = 'written_off'
}

/* ===== Cells modal state & logic ===== */
const cellsModal = ref({
  open:false,
  output_id: 0,
  item_id: 0,
  item: null as ProductItem | null,
  cells: [] as Array<{cell_id:number; cell_name:string; qty:number; available:number}>,
  alloc: {} as Record<number, number>,
  prevNotPlaced: 0,
  allocNotPlaced: 0,
  availableNotPlaced: 0,
  error: '',
})
const savingCells = ref(false)

function fmt(n:any){ return Number(n||0).toLocaleString(undefined,{ maximumFractionDigits:6 }) }
function unitShort(m:any){
  const k = String(m||'').toLowerCase()
  return ({kg:'կգ', g:'գ', tonn:'տ', t:'տ', l:'լ', ml:'մլ', m3:'մ³', m:'մ', cm:'սմ', mm:'մմ', piece:'հատ', pcs:'հատ'})[k] || ''
}

const sumAllocCells = computed(() =>
    Object.values(cellsModal.value.alloc).reduce((a,b)=> a + Number(b||0), 0)
)
const requiredQty = computed(() => Number(cellsModal.value.item?.qty || 0))
const sumTotal = computed(() => Number(sumAllocCells.value) + Number(cellsModal.value.allocNotPlaced || 0))
const totalsMatch = computed(() => Math.abs(Number(sumTotal.value) - Number(requiredQty.value)) < 1e-9)
const canSave = computed(() => {
  if (Number(cellsModal.value.allocNotPlaced||0) > Number(cellsModal.value.availableNotPlaced||0)) return false
  for (const qty of Object.values(cellsModal.value.alloc)) if (Number(qty||0) < 0) return false
  return totalsMatch.value
})

async function openCellsModal(row:OutputRow, item:ProductItem){
  cellsModal.value.open = true
  cellsModal.value.output_id = row.id
  cellsModal.value.item_id = item.id
  cellsModal.value.item = item
  cellsModal.value.error = ''
  cellsModal.value.cells = []
  cellsModal.value.alloc = {}
  cellsModal.value.allocNotPlaced = 0
  cellsModal.value.prevNotPlaced = 0
  cellsModal.value.availableNotPlaced = 0

  // ↳ adjust API name to your backend
  const dto = await storagesApi.getQuickSaleItemReserves(route.params.id, row.id, item.id)

  cellsModal.value.cells = dto?.cells || []
  for (const a of (dto?.allocated || [])) {
    cellsModal.value.alloc[a.cell_id] = Number(a.qty || 0)
  }
  cellsModal.value.prevNotPlaced       = Number(dto?.not_placed_qty || 0)
  cellsModal.value.allocNotPlaced      = Number(dto?.not_placed_qty || 0)
  cellsModal.value.availableNotPlaced  = Number(dto?.available_not_placed_qty || 0)
  reload()
}
function closeCellsModal(){ cellsModal.value.open = false }

async function saveCellsAlloc(){
  if (!canSave.value) return
  savingCells.value = true
  cellsModal.value.error = ''

  try{
    const measure = String(
        cellsModal.value.item?.measure ||
        cellsModal.value.item?.storage_product?.measure ||
        cellsModal.value.item?.product?.measure ||
        'piece'
    )

    const allocations: Array<{cell_id:number|null; qty:number; measure:string}> = []

    for (const [cellIdStr, qtyAny] of Object.entries(cellsModal.value.alloc)) {
      const qty = Number(qtyAny || 0)
      const cell_id = Number(cellIdStr)
      if (qty > 0) allocations.push({ cell_id, qty, measure })
    }
    const np = Number(cellsModal.value.allocNotPlaced || 0)
    if (np > 0) allocations.push({ cell_id: null, qty: np, measure })

    // ↳ adjust API name to your backend
    await storagesApi.distributeQuickSaleProduct(route.params.id, cellsModal.value.output_id, cellsModal.value.item_id, { allocations })

    closeCellsModal()
  } catch (e:any) {
    cellsModal.value.error = e?.response?.data?.message || e.message || 'Սխալ'
  } finally {
    savingCells.value = false
  }
}
const load = async () => {
  const id = Number(route.params.id)
  storage.value = await mainApi.getStorageById(id)
}
const route = useRoute()

/* infinite scroll */
const sentinel = ref<HTMLElement|null>(null)
let io: IntersectionObserver | null = null
onMounted(() => {
  reload()
  load()
  io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) loadMore() })
  if (sentinel.value) io.observe(sentinel.value)
})
</script>
