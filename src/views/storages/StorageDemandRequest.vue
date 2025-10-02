<template>
  <div class="flex flex-col">
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
              <span class="underline-offset-2 hover:underline">Պահանջագրեր</span>
            </p>
          </li>
        </ol>
      </nav>
    </div>
    <div class="flex flex-col gap-3 px-4 py-4">
      <!-- Filters -->
      <div class="grid md:grid-cols-2 gap-2 items-end">
        <input
            v-model="search"
            class="border border-gray-300 rounded-xl px-3 py-2 w-full"
            placeholder="ID / Ապրանք"
            @input="debouncedReload"
        />
        <select v-model="status" class="border border-gray-300 rounded-xl px-3 py-2 w-full" @change="reloadFromStart">
          <option value="">Բոլորը</option>
          <option value="awaiting_warehouse">Սպասում է պահեստին</option>
          <option value="approved">Հաստատված</option>
          <option value="rejected">Մերժված</option>
          <option value="written_off">Դուրս գրված</option>
        </select>
      </div>

      <!-- Table -->
      <div class="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table class="min-w-full text-sm">
          <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left">#</th>
            <th class="px-4 py-3 text-left">
              Ստորաբաժանում / Սկզբնական պահեստ
            </th>
            <th class="px-4 py-3 text-left">Ստեղծող</th>
            <th class="px-4 py-3 text-left">Ստեղծվել է</th>
            <th class="px-4 py-3 text-left">Կարգավիճակ</th>
            <th class="px-4 py-3 text-left">Գործողություններ</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="row in rows" :key="row.id" class="border-t">
            <td class="px-4 py-3">{{ row.id }}</td>
            <td class="px-4 py-3">
              {{ originName(row) }}
            </td>
            <td class="px-4 py-3">{{ row.user?.name || row.user_id }}</td>
            <td class="px-4 py-3">
              <span :title="row.created_at">{{ formatDateTime(row.created_at) }}</span>
              <span class="text-xs text-gray-400 ml-2">({{ fromNow(row.created_at) }})</span>
            </td>
            <td class="px-4 py-3">
              <span class="px-2 py-0.5 rounded text-xs" :class="statusClass(row.status)">
                {{ statusLabel(row.status) }}
              </span>
            </td>
            <td class="px-4 py-3">
              <div class="flex flex-wrap gap-2">
                <button
                    class="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    @click="openView(row)"
                >
                  Դիտել
                </button>

                <!-- awaiting_warehouse → allow approve / reject -->
                <template v-if="row.status === 'awaiting_warehouse'">
                  <button
                      class="px-3 py-1 text-xs font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:opacity-50"
                      :disabled="submittingId===row.id"
                      @click="approveRow(row)"
                  >
                    Հաստատել
                  </button>
                  <button
                      class="px-3 py-1 text-xs font-medium text-white bg-rose-600 rounded-md hover:bg-rose-700 disabled:opacity-50"
                      :disabled="submittingId===row.id"
                      @click="rejectRow(row)"
                  >
                    Մերժել
                  </button>
                </template>
                <!-- approved → allow write-off -->
                <template v-else-if="row.status === 'approved'">
                  <button
                      class="px-3 py-1 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                      :disabled="submittingId===row.id"
                      @click="writeOffRow(row)"
                  >
                    Դուրսգրում
                  </button>
                </template>
              </div>
            </td>
          </tr>

          <tr v-if="!loading && rows.length===0">
            <td colspan="5" class="px-4 py-8 text-center text-gray-500">Տվյալներ չկան</td>
          </tr>
          </tbody>
        </table>

        <div class="p-3 text-center text-sm" v-if="loading">Լցվում է…</div>
      </div>

      <!-- infinite scroll sentinel -->
      <div ref="sentinel" class="h-10 flex items-center justify-center">
        <span v-if="loading && rows.length>0" class="text-sm text-gray-500">Լցվում է…</span>
        <span v-else-if="endReached && rows.length>0" class="text-xs text-gray-400">Վերջ</span>
      </div>
    </div>
  </div>

  <!-- View modal -->
  <div v-if="view.open" class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
    <div class="bg-white w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden">
      <div class="px-4 py-3 border-b flex items-center justify-between">
        <div class="font-semibold">
          Պահանջագիր № {{ view.data?.id }}
          <span class="ml-2 text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700">{{ statusLabel(view.data?.status) }}</span>
        </div>
        <div class="grid md:grid-cols-3 gap-3 mb-4 text-sm text-gray-600">
          <div v-if="view.data?.from_storage?.address"><b>Սկզբնական պահեստ:</b> {{ view.data?.from_storage?.address || view.data?.from_storage_address || '—' }}</div>
          <div v-if="view.data?.department?.name"><b>Ստորաբաժանում:</b> {{ view.data?.department?.name || view.data?.department_name || '—' }}</div>
        </div>
        <button class="p-2 hover:bg-gray-100 rounded" @click="closeView">✕</button>
      </div>

      <div class="p-4">
        <div class="border rounded-xl overflow-hidden">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-50">
            <tr>
              <th class="px-3 py-2 text-left">Ապրանք</th>
              <th class="px-3 py-2 text-right">Քանակ</th>
              <th class="px-3 py-2 text-right">Չափ</th>
<!--              <th class="px-3 py-2 text-center">Կարգավիճակ</th>-->
              <th class="px-3 py-2 text-center"></th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="it in filteredItems" :key="it.id" class="border-t">
              <td class="px-3 py-2">
                <div class="font-medium">{{ it.storage_product.product?.name || it.product_name || it.storage_product_id }}</div>
                <div v-if="(it.storage_product.product?.characteristics||[]).length" class="mt-1 flex flex-wrap gap-1">
                  <span v-for="c in it.storage_product.product.characteristics" :key="c.id||c.name" class="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-700">{{ c.name }}</span>
                </div>
              </td>
              <td class="px-3 py-2 text-right tabular-nums">{{ fmt(it.qty) }}</td>
              <td class="px-3 py-2 text-right">{{ unitShort(it.storage_product?.measure) }}</td>
<!--              <td class="px-3 py-2 text-center">-->
<!--                  <span :class="itemStatusPill(it.status)" class="px-2 py-0.5 rounded text-xs">-->
<!--                    {{ itemStatusLabel(it.status) }}-->
<!--                  </span>-->
<!--              </td>-->
              <td class="px-3 py-2 text-center">
                <!-- Item: approved → allow reject -->
                <div class="flex gap-2">
                  <button
                      v-if="it.status==='approved' && view.data?.status==='awaiting_warehouse'"
                      class="px-2 py-1 text-xs rounded bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
                      :disabled="rejectingItemId===it.id"
                      @click="rejectItem(it)"
                  >
                    <span v-if="rejectingItemId===it.id">Մերժում…</span>
                    <span v-else>Մերժել</span>
                  </button>
                  <button
                      v-if="canAssignCells(view.data, it)"
                      class="flex gap-x-1 items-center px-2 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                      @click="openCellsModal(it)"
                  >
                    Նշել ելքագրման բջիջ(ներ)ը
                    <svg class="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M7.05 3.55a1 1 0 0 1 1.4 0l4.5 4.5a1 1 0 0 1 0 1.4l-4.5 4.5a1 1 0 0 1-1.4-1.4L10.79 10 7.05 6.26a1 1 0 0 1 0-1.41z"/>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="filteredItems.length===0">
              <td colspan="5" class="px-3 py-6 text-center text-gray-500">Տվյալներ չկան</td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="px-4 py-3 border-t text-right">
        <button class="px-3 py-2 rounded-xl border hover:bg-gray-50" @click="closeView">Փակել</button>
      </div>
    </div>
  </div>
  <!-- Cells Modal -->
  <div v-if="cellsModal.open" class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
    <div class="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden">
      <div class="px-4 py-3 border-b flex items-center justify-between">
        <div class="font-semibold">
          Ելքագրման բջիջներ — {{ cellsModal.item?.product?.name || cellsModal.item?.storage_product_id }}
        </div>
        <button class="p-2 hover:bg-gray-100 rounded" @click="closeCellsModal">✕</button>
      </div>

      <div class="p-4 space-y-3">
        <div class="text-sm text-gray-600">
          Պահանջված քանակ՝ <b>{{ fmt(cellsModal.item?.qty) }}</b> {{ unitShort(cellsModal.item?.storage_product?.measure) }}
        </div>

        <table class="min-w-full text-sm border rounded">
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
            <td class="px-3 py-2 text-right">{{ fmt(row.qty) }}</td>
            <td class="px-3 py-2 text-right">{{ fmt(row.available) }}</td>
            <td class="px-3 py-2 text-right">
              <input
                  type="number" min="0" step="0.001"
                  class="border rounded px-2 py-1 w-32 text-right"
                  v-model.number="cellsModal.alloc[row.cell_id]"
              />
            </td>
          </tr>
          <tr v-if="!cellsModal.cells.length">
            <td colspan="4" class="px-3 py-6 text-center text-gray-500">Բջիջներ չկան</td>
          </tr>
          </tbody>
        </table>

        <div class="text-right text-sm">
          Ընդհանուր՝ <b>{{ fmt(sumAlloc) }}</b> / {{ fmt(cellsModal.item?.qty) }}
        </div>

        <div class="flex justify-end gap-2">
          <button class="px-3 py-2 rounded border" @click="closeCellsModal">Փակել</button>
          <button
              class="px-3 py-2 rounded border bg-gray-900 text-white disabled:opacity-50"
              :disabled="savingCells || sumAlloc > Number(cellsModal.item?.qty || 0)"
              @click="saveCellsAlloc"
          >
            <span v-if="savingCells">Պահպանում…</span>
            <span v-else>Պահպանել</span>
          </button>
        </div>
        <p v-if="cellsModal.error" class="text-sm text-rose-600">{{ cellsModal.error }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { warehouseDemandApi as demandApi, mainApi } from '@/api.js'
import { formatDateTime, fromNow } from '@/utils/dateFormat'

const route = useRoute()
const storageId = computed(() => Number(route.params.id))

// list state
const rows = ref<any[]>([])
const loading = ref(false)
const submittingId = ref<number|null>(null)
const limit = ref(50)
const offset = ref(0)
const endReached = ref(false)
const search = ref('')
const status = ref('awaiting_warehouse')
const storage = ref<any>(null)

async function loadStorage() {
  storage.value = await mainApi.getStorageById(storageId.value)
}
// view modal
const view = ref<{open:boolean, data:any|null, rowRef:any|null}>({ open:false, data:null, rowRef: null })
const rejectingItemId = ref<number|null>(null)

function fmt(n:any){ return Number(n||0).toLocaleString(undefined,{ maximumFractionDigits:6 }) }
function unitShort(m:any){
  const k = String(m||'').toLowerCase()
  return ({kg:'կգ', g:'գ', tonn:'տ', t:'տ', l:'լ', ml:'մլ', m3:'մ³', m:'մ', cm:'սմ', mm:'մմ', piece:'հատ', pcs:'հատ'})[k] || ''
}
function canAssignCells(parent:any, it:any){
  const parentStatus = String(parent?.status||'').toLowerCase()
  // թույլ տանք approved/awaiting_warehouse փուլում (կողմիդ կանոններով fine tune)
  return ['approved','awaiting_warehouse'].includes(parentStatus)
}
function originName(r:any) {
  // նախընտրում ենք ստորաբաժանմանը, հետո՝ սկզբնական պահեստին
  if (r?.department?.name) return r.department.name
  if (r?.from_storage?.address) return r.from_storage.address
  // որոշ API-ներում backend-ը կարող է ուղարկել ինչպես name/address,
  // այնպես էլ պարզապես { department_name, from_storage_address } դաշտերով.
  if (r?.department_name) return r.department_name
  if (r?.from_storage_address) return r.from_storage_address
  return '—'
}
async function writeOffRow(row:any){
  if (!confirm('Կատարե՞լ դուրսգրում')) return
  submittingId.value = row.id
  try {
    await demandApi.writeOff(storageId.value, row.id) // 204/200 expected
    row.status = 'written_off'                        // տեղում թարմացում
    // կամ `await reloadFromStart()` եթե նախընտրում ես ամբողջ ցանկը թարմացնել
  } catch (e:any) {
    // optional: error toast/alert
  } finally {
    submittingId.value = null
  }
}
// labels
function statusLabel(s:string){
  return ({
    awaiting_warehouse:'Սպասում է պահեստին',
    approved:'Հաստատված',
    rejected:'Մերժված',
    written_off:'Դուրսգրված',
  } as any)[s] || s
}
function statusClass(s:string){
  return ({
    awaiting_warehouse:'bg-blue-100 text-blue-700',
    approved:'bg-emerald-100 text-emerald-700',
    rejected:'bg-rose-100 text-rose-700'
  } as any)[s] || 'bg-gray-100 text-gray-700'
}

function itemStatusLabel(s?:string){
  const v = String(s||'').toLowerCase()
  if (v==='approved') return 'Հաստատված'
  if (v==='rejected') return 'Մերժված'
  if (v==='written_off') return 'Դուրս գրված'
  return s || '—'
}
function itemStatusPill(s?:string){
  const v = String(s||'').toLowerCase()
  if (v==='approved') return 'bg-emerald-100 text-emerald-700'
  if (v==='rejected') return 'bg-rose-100 text-rose-700'
  if (v==='written_off') return 'bg-indigo-100 text-indigo-700'
  return 'bg-slate-100 text-slate-700'
}

// fetch page
async function fetchPage(){
  if(loading.value || endReached.value) return
  loading.value = true
  try{
    const page = await demandApi.list(storageId.value, {
      limit: limit.value,
      offset: offset.value,
      search: (search.value || '').trim() || undefined,
      status: status.value || undefined,
    })
    const list = Array.isArray(page) ? page : (page?.data ?? page?.rows ?? [])
    rows.value.push(...list)
    offset.value += list.length
    if(list.length < limit.value) endReached.value = true
  } finally { loading.value = false }
}
function reloadFromStart(){
  endReached.value = false
  offset.value = 0
  rows.value = []
  fetchPage()
}
const debouncedReload = (() => {
  let t:any=null
  return () => { clearTimeout(t); t=setTimeout(reloadFromStart,300) }
})()

// infinite scroll
const sentinel = ref<HTMLElement|null>(null)
let io:IntersectionObserver|null = null
function startIO(){
  if(!sentinel.value) return
  io = new IntersectionObserver((entries)=>{
    const [e] = entries
    if(e.isIntersecting) fetchPage()
  })
  io.observe(sentinel.value)
}
function stopIO(){ if(io && sentinel.value) io.unobserve(sentinel.value); io=null }

// actions (row)
async function approveRow(row:any){
  if (!confirm('Հաստատե՞լ պահանջագիրը')) return
  submittingId.value = row.id
  try {
    await demandApi.approve(storageId.value, row.id)
    row.status = 'approved'                        // տեղում թարմացում
    // reloadFromStart()
  } catch (e:any) {
    const httpStatus = e?.response?.status
    const errCode    = e?.response?.data?.code ?? e?.code
    // եթե backend-ը վերադարձնում է 412 (HTTP կամ code),
    // բացում ենք մոդալը (էլ ոնց որ approve-ից հետո պիտի բացվեր)
    if (httpStatus === 412 || Number(errCode) === 412) {
      await openView(row)
    } else {
      // ցանկացած այլ սխալի դեպքում՝ ցանկությանդ համաձայն նուրբ հուշում/alert
      // alert(e?.response?.data?.message || e.message || 'Չհաջողվեց հաստատել')
    }
  } finally {
    submittingId.value = null
  }
}
async function rejectRow(row:any){
  if(!confirm('Մերժե՞լ պահանջագիրը')) return
  submittingId.value = row.id
  try{
    await demandApi.reject(storageId.value, row.id)
    reloadFromStart()
  } finally { submittingId.value = null }
}

// view modal
async function openView(row:any){
  view.value.open = true
  view.value.rowRef = row
  view.value.data = await demandApi.get(storageId.value, row.id)
}
function closeView(){ view.value.open = false; view.value.data = null }

// only items with these statuses
const filteredItems = computed(() => {
  const items = Array.isArray(view.value.data?.items) ? view.value.data.items : []
  return items.filter((it:any)=> ['approved','rejected','written_off'].includes(String(it.status||'')))
})
const busyId = ref<number|null>(null);
const itemBusyId = ref<number|null>(null);
function statusPillClass(s?: string) {
  const v = String(s || '').toLowerCase()
  switch (v) {
    case 'approved':
      return 'bg-emerald-100 text-emerald-700'
    case 'rejected':
      return 'bg-rose-100 text-rose-700'
    case 'cancelled':
      return 'bg-rose-100 text-rose-700'
    case 'written_off':
      return 'bg-indigo-100 text-indigo-700'
    default: // pending or unknown
      return 'bg-slate-100 text-slate-700'
  }
}
async function doApprove(row){
  if(!confirm('Հաստատե՞լ (կկատարվի ռեզերվ)')) return;
  busyId.value = row.id;
  try { await api.approve(storageId.value, row.id); row.status='approved'; }
  finally { busyId.value = null; }
}

async function doReject(row){
  if(!confirm('Մերժե՞լ պահանջագիրը')) return;
  busyId.value = row.id;
  try { await api.reject(storageId.value, row.id); row.status='rejected'; }
  finally { busyId.value = null; }
}

async function doWriteOff(row){
  if(!confirm('Կատարե՞լ ելքագրում (write-off)')) return;
  busyId.value = row.id;
  try { await api.writeOff(storageId.value, row.id); row.status='written_off'; }
  finally { busyId.value = null; }
}

async function rejectItem(it){
  if(!confirm('Մերժե՞լ ապրանքը')) return;
  itemBusyId.value = it.id;
  try{
    await api.rejectItem(storageId.value, parent.value.id, it.id);
    it.status='rejected';
    // եթե backend-ը վերածեց ամբողջ row-ը rejected, թարմացրու նաև ցանկի row-ը (parentRowRef.status='rejected')
  } finally { itemBusyId.value = null; }
}

const cellsModal = ref({
  open:false,
  demand_id: 0,
  item_id: 0,
  item: null as any,
  cells: [] as any[],
  alloc: {} as Record<number, number>, // cell_id -> qty
  error: ''
})
const savingCells = ref(false)
const sumAlloc = computed(()=> Object.values(cellsModal.value.alloc).reduce((a,b)=> a + Number(b||0), 0))

async function openCellsModal(item:any){
  cellsModal.value.open = true
  cellsModal.value.item_id = item.id
  cellsModal.value.demand_id = view.value.data.id
  cellsModal.value.item = item
  cellsModal.value.error = ''
  cellsModal.value.cells = []
  cellsModal.value.alloc = {}

  const storageId = /* current storage route param */ Number(route.params.id)
  const dto = await demandApi.getItemCells(storageId, view.value.data.id, item.id)

  cellsModal.value.cells = dto.cells
  // preload existing allocations
  for (const a of (dto.allocated || [])) {
    cellsModal.value.alloc[a.cell_id] = Number(a.qty || 0)
  }
}

function closeCellsModal(){ cellsModal.value.open=false }

async function saveCellsAlloc(){
  savingCells.value = true
  cellsModal.value.error = ''
  try {
    const allocations = Object.entries(cellsModal.value.alloc)
        .map(([cell_id, qty])=>({ cell_id: Number(cell_id), qty: Number(qty||0) }))
        .filter(x=> x.qty > 0)

    const storageId = Number(route.params.id)
    await demandApi.upsertItemCells(storageId, cellsModal.value.demand_id, cellsModal.value.item_id, allocations)

    // refresh parent demand to reflect chosen cells (optional if BE returns them)
    const fresh = await demandApi.get(storageId, cellsModal.value.demand_id)
    view.value.data = fresh

    closeCellsModal()
  } catch (e:any) {
    cellsModal.value.error = e?.response?.data?.message || e.message || 'Սխալ'
  } finally {
    savingCells.value = false
  }
}

onMounted(async () => {
  await loadStorage()
  reloadFromStart()
  startIO()
})
onBeforeUnmount(stopIO)
</script>
