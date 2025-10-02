<!-- src/views/CellInventoryPage.vue -->
<template>
  <div class="flex flex-col gap-y-4">
    <!-- Header + Breadcrumb -->
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
              <path d="M7.05 3.55a1 1 0 0 1 1.4 0l4.5 4.5a1 1 0 0 1 0 1.4լ-4.5 4.5a1 1 0 0 1-1.4-1.4L10.79 10 7.05 6.26a1 1 0 0 1 0-1.41z"/>
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
              <path d="M7.05 3.55a1 1 0 0 1 1.4 0լ4.5 4.5a1 1 0 0 1 0 1.4լ-4.5 4.5a1 1 0 0 1-1.4-1.4L10.79 10 7.05 6.26a1 1 0 0 1 0-1.41z"/>
            </svg>
          </li>
          <li>
            <p class="inline-flex items-center gap-1 rounded-md px-2 py-1">
              <span class="underline-offset-2 hover:underline">{{ $t('cell_inventory', 'Բջջային մնացորդներ') }}</span>
            </p>
          </li>
        </ol>
      </nav>
    </div>

    <!-- Filters -->
    <div class="grid md:grid-cols-4 gap-2 px-4">
      <select v-model.number="f.department_id" class="border border-gray-300 rounded-xl px-3 py-2" @change="onDeptChange">
        <option :value="undefined">{{ $t('all_departments','Բոլոր բաժինները') }}</option>
        <option v-for="d in hierarchy.departments" :key="d.id" :value="d.id">{{ d.name }}</option>
      </select>

      <select v-model.number="f.section_id" class="border border-gray-300 rounded-xl px-3 py-2" @change="onSectionChange">
        <option :value="undefined">{{ $t('all_sections','Բոլոր սեկցիաները') }}</option>
        <option v-for="s in sectionsFiltered" :key="s.id" :value="s.id">{{ s.name }}</option>
      </select>

      <select v-model.number="f.shelf_id" class="border border-gray-300 rounded-xl px-3 py-2" @change="onShelfChange">
        <option :value="undefined">{{ $t('all_shelves','Բոլոր դարակաշարերը') }}</option>
        <option v-for="s in shelvesFiltered" :key="s.id" :value="s.id">{{ s.name }}</option>
      </select>

      <select v-model.number="f.cell_id" class="border border-gray-300 rounded-xl px-3 py-2" @change="reload">
        <option :value="undefined">{{ $t('all_cells','Բոլոր բջիջները') }}</option>
        <option v-for="c in cellsFiltered" :key="c.id" :value="c.id">{{ c.name }} ({{ c.slug }})</option>
      </select>
    </div>

    <div class="flex items-end gap-2 px-4">
      <input v-model="f.q" class="border border-gray-300 rounded-xl px-3 py-2" :placeholder="$t('search','Փնտրել ապրանք')" @keyup.enter="apply"/>
      <button class="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50" @click="apply">
        {{ $t('apply','Կիրառել') }}
      </button>

      <button class="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50"
              :disabled="!filtersActive"
              @click="clearFilters">
        {{ $t('clear_filters','Մաքրել ֆիլտրները') }}
      </button>
    </div>

    <!-- Table -->
    <div class="px-4">
      <div class="bg-white border border-gray-300 rounded-2xl overflow-hidden">
        <table class="min-w-full text-sm">
          <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-4 text-left">{{ $t('cell','Բջիջ') }}</th>
            <th class="px-6 py-4 text-left">{{ $t('product','Ապրանք') }}</th>
            <th class="px-6 py-4 text-left">Բնութագրեր</th>
            <th class="px-6 py-4 text-right">{{ $t('qty','Քանակ') }}</th>
            <th class="px-6 py-4 text-right">{{ $t('reserved','Արտոնագրված') }}</th>
            <th class="px-6 py-4"></th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="r in rows" :key="r.id" class="bg-white border-b border-gray-200">
            <td class="px-6 py-4">
              <div class="font-medium">
                {{ r.cell_name }} <span class="text-gray-400">({{ r.cell_slug }})</span>
              </div>
              <div class="text-xs text-gray-500">{{ r.department_name }} → {{ r.section_name }} → {{ r.shelf_name }}</div>
            </td>

            <td class="px-6 py-4">
              <div class="font-medium">{{ r.product_name }}</div>
            </td>

            <td class="px-6 py-4">
              <div class="flex flex-wrap gap-1">
                  <span
                      v-for="c in characteristicsFromRow(r)"
                      :key="c.id ?? c.name"
                      class="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700"
                  >
                    {{ c.name }}
                  </span>
                <span v-if="characteristicsFromRow(r).length===0" class="text-[11px] text-gray-400">—</span>
              </div>
            </td>

            <td class="px-6 py-4 text-right">{{ fmt(r.qty) }} {{ unit(r.measure  ?? 'piece') }}</td>
            <td class="px-6 py-4 text-right">{{ fmt(r.reserved_qty) }} {{ unit(r.measure ?? 'piece') }}</td>

            <td class="px-6 py-4 text-right">
              <div class="flex gap-2">
                <button @click="openPlacementsForCell(r.cell_id)"
                        class="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded-md shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Տեսնել տեղավորումները
                </button>
                <button @click="openTransfer(r)"
                        class="px-3 py-1 text-xs font-medium text-white bg-amber-600 rounded-md shadow hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  Տեղափոխել
                </button>
              </div>
            </td>
          </tr>

          <tr v-if="!loading && rows.length===0">
            <td colspan="8" class="px-4 py-8 text-center text-gray-500">{{ $t('no_data','Տվյալներ չկան') }}</td>
          </tr>
          </tbody>
        </table>

        <div class="p-3 text-center text-sm" v-if="loading">{{ $t('loading','Լցվում է…') }}</div>
      </div>
    </div>

    <!-- Transfer modal -->
    <div v-if="modal.open" class="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div class="bg-white rounded-2xl p-4 w-full max-w-2xl">
        <div class="flex items-center justify-between mb-3">
          <div class="font-medium">{{ $t('transfer_between_cells','Տեղափոխություն բջիջների միջև') }}</div>
          <button class="p-1" @click="modal.open=false">✕</button>
        </div>

        <div class="space-y-3">
          <div class="text-sm text-gray-600">
            <p>{{ modal.row?.product_name }}</p>
            <div class="flex flex-wrap gap-1">
                  <span
                      v-for="c in characteristicsFromRow(modal.row)"
                      :key="c.id ?? c.name"
                      class="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700"
                  >
                    {{ c.name }}
                  </span>
              <span v-if="characteristicsFromRow(modal.row).length===0" class="text-[11px] text-gray-400">—</span>
            </div>
            Սկզբնակետ: <b>{{ modal.row?.cell_name }}</b>
          </div>

          <!-- Qty + Department -->
          <div class="grid md:grid-cols-2 gap-2">
            <div>
              <label class="text-xs text-gray-500">{{ $t('qty','Քանակ') }}</label>
              <input v-model.number="modal.qty" type="number" min="0" step="0.001" class="border rounded-xl px-3 py-2 w-full"/>
              <div class="text-xs text-gray-400 mt-1">
                {{ $t('available','Մատչելի') }}: {{ fmt(modal.available) }}
              </div>
            </div>
          </div>

          <!-- Section / Shelf / Cell -->
          <div class="grid md:grid-cols-4 gap-2">
            <!-- Department -->
            <div>
              <label class="text-xs text-gray-500">Բաժին</label>
              <template v-if="modalDepartments.length === 1">
                <div class="px-3 py-2 rounded border border-gray-200 bg-gray-50">
                  {{ modalDepartments[0].name }}
                </div>
              </template>
              <select v-else v-model.number="modal.to_department_id"
                      @change="onChangeDept"
                      class="border rounded-xl px-3 py-2 w-full">
                <option :value="undefined">—</option>
                <option v-for="d in modalDepartments" :key="d.id" :value="d.id">{{ d.name }}</option>
              </select>
            </div>

            <!-- Section -->
            <div>
              <label class="text-xs text-gray-500">Շարք</label>
              <template v-if="modalSections.length === 1">
                <div class="px-3 py-2 rounded border border-gray-200 bg-gray-50">
                  {{ modalSections[0].name }}
                </div>
              </template>
              <select v-else v-model.number="modal.to_section_id"
                      @change="onChangeSection"
                      class="border rounded-xl px-3 py-2 w-full">
                <option :value="undefined">—</option>
                <option v-for="s in modalSections" :key="s.id" :value="s.id">{{ s.name }}</option>
              </select>
            </div>

            <!-- Shelf -->
            <div>
              <label class="text-xs text-gray-500">Դարակաշար</label>
              <template v-if="modalShelves.length === 1">
                <div class="px-3 py-2 rounded border border-gray-200 bg-gray-50">
                  {{ modalShelves[0].name }}
                </div>
              </template>
              <select v-else v-model.number="modal.to_shelf_id"
                      @change="onChangeShelf"
                      class="border rounded-xl px-3 py-2 w-full">
                <option :value="undefined">—</option>
                <option v-for="sh in modalShelves" :key="sh.id" :value="sh.id">{{ sh.name }}</option>
              </select>
            </div>

            <!-- Cell -->
            <div>
              <label class="text-xs text-gray-500">{{ $t('to_cell','Մուտք բջիջ') }}</label>
              <select v-model.number="modal.to_cell_id" class="border rounded-xl px-3 py-2 w-full">
                <option v-for="c in modalCells" :key="c.id" :value="c.id">{{ c.name }} ({{ c.slug }})</option>
              </select>
            </div>
          </div>

          <div class="flex justify-end gap-2 mt-2">
            <button class="px-4 py-2 border rounded-xl" @click="modal.open=false">{{ $t('cancel','Չեղարկել') }}</button>
            <button
                class="inline-flex items-center gap-2 px-3 py-2 rounded-xl border bg-amber-900 text-white disabled:opacity-60"
                :disabled="!canSubmit || modal.saving"
                @click="doTransfer"
            >
              <!-- փոքր loader -->
              <svg v-if="modal.saving" class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" d="M4 12a8 8 0 018-8" stroke="currentColor" stroke-width="4"/>
              </svg>
              <span v-if="modal.saving">{{ $t('processing','Կատարվում է…') }}</span>
              <span v-else>{{ $t('transfer','Տեղափոխել') }}</span>
            </button>
          </div>

          <p v-if="modal.error" class="text-sm text-red-600">{{ modal.error }}</p>
        </div>
      </div>
    </div>
  </div>
  <CellPlacementsModal
      :open="placementsModal.open"
      :storage-id="storageId"
      :cell-id="placementsModal.cellId"
      @close="placementsModal.open=false"
  />
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { mainApi, wmsApi } from '@/api.js'
import { nextTick } from 'vue'
import CellPlacementsModal from "@/views/storages/modals/CellPlacementsModal.vue";
const route = useRoute()
const storageId = Number(route.params.id)
const storage = ref<any>(null)

const hierarchy = reactive({
  departments: [] as any[],
  sections: [] as any[],
  shelves: [] as any[],
  cells: [] as any[],
})

const rows = ref<any[]>([])
const loading = ref(false)
const placementsModal = reactive({ open:false, cellId:0 })
function openPlacementsForCell(cellId){
  placementsModal.cellId = Number(cellId)
  placementsModal.open = true
}
const f = reactive({
  storage_id: storageId,
  department_id: undefined as number|undefined,
  section_id: undefined as number|undefined,
  shelf_id: undefined as number|undefined,
  cell_id: undefined as number|undefined,
  q: '',
  limit: 50,
  offset: 0,
})

const sectionsFiltered = computed(() =>
    hierarchy.sections.filter((s:any) => !f.department_id || s.department_id === f.department_id)
)
const shelvesFiltered = computed(() =>
    hierarchy.shelves.filter((s:any) => !f.section_id || s.section_id === f.section_id)
)
const cellsFiltered = computed(() =>
    hierarchy.cells.filter((c:any) =>
        (!f.section_id || c.section_id === f.section_id) &&
        (!f.department_id || c.department_id === f.department_id)
    )
)

function fmt(n:any){ return Number(n || 0).toLocaleString(undefined,{ maximumFractionDigits: 6 }) }
function unit(m:any){
  const k = String(m||'').toLowerCase()
  return ({kg:'կգ', g:'գ', t:'տ', tonn:'տ', l:'լ', ml:'մլ', m3:'մ³', m:'մ', cm:'սմ', mm:'մմ', piece:'հատ', pcs:'հատ'} as any)[k] || (m || '')
}

// chars helpers (array or JSON string)
function normalizeCharacteristics(val:any){
  if (Array.isArray(val)) return val
  if (typeof val === 'string'){ try { return JSON.parse(val||'[]') } catch { return [] } }
  return []
}
function characteristicsFromRow(r:any){
  const viaProd = normalizeCharacteristics(r?.product?.characteristics)
  if (viaProd.length) return viaProd
  return normalizeCharacteristics(r?.product_characteristics)
}

async function loadHierarchy(){
  const data = await wmsApi.getHierarchy(storageId) // permission-aware
  hierarchy.departments = data?.departments ?? []
  hierarchy.sections    = data?.sections ?? []
  hierarchy.shelves     = data?.shelves ?? []
  hierarchy.cells       = data?.cells ?? []

  // keep previous selections if still valid
  const valid = {
    d: hierarchy.departments.some((x:any)=> x.id === f.department_id),
    s: hierarchy.sections.some((x:any)=> x.id === f.section_id),
    sh: hierarchy.shelves.some((x:any)=> x.id === f.shelf_id),
    c: hierarchy.cells.some((x:any)=> x.id === f.cell_id),
  }
  f.department_id = valid.d ? f.department_id : undefined
  f.section_id    = valid.s && valid.d ? f.section_id : undefined
  f.shelf_id      = valid.sh && valid.s ? f.shelf_id : undefined
  f.cell_id       = valid.c && valid.sh ? f.cell_id : undefined
}

const filtersActive = computed(() => Boolean(
    f.department_id || f.section_id || f.shelf_id || f.cell_id || (f.q && f.q.trim()) || f.offset>0
))

function apply(){ f.offset = 0; reload() }
function clearFilters(){
  f.department_id = f.section_id = f.shelf_id = f.cell_id = undefined
  f.q = ''
  f.offset = 0
  reload()
}

async function reload(){
  loading.value = true
  try{
    f.offset = Number(f.offset || 0)
    const data = await wmsApi.getCellProducts(f.storage_id, {
      storage_id: f.storage_id,
      department_id: f.department_id,
      section_id: f.section_id,
      shelf_id: f.shelf_id,
      cell_id: f.cell_id,
      search: f.q,
      limit: f.limit, // required
      offset: f.offset,
    })
    rows.value = Array.isArray(data) ? data : (data?.data ?? data?.rows ?? [])
  } finally { loading.value = false }
}

onMounted(async () => {
  storage.value = await mainApi.getStorageById(storageId)
  await loadHierarchy()
  await reload()
})

// cascading resets
function onDeptChange(){ f.section_id = f.shelf_id = f.cell_id = undefined; f.offset = 0; reload() }
function onSectionChange(){ f.shelf_id = f.cell_id = undefined; f.offset = 0; reload() }
function onShelfChange(){ f.cell_id = undefined; f.offset = 0; reload() }

/* ───────── Transfer modal ───────── */
const modal = reactive({
  open:false,
  row:null as any,
  to_department_id: undefined as number|undefined,
  to_section_id:    undefined as number|undefined,
  to_shelf_id:      undefined as number|undefined,
  to_cell_id:       undefined as number|undefined,
  qty: 0,
  available: 0,
  error:'',
  saving: false,
})

const modalDepartments = computed(()=> hierarchy.departments)
const modalSections = computed(()=> hierarchy.sections.filter((s:any)=> !modal.to_department_id || s.department_id===modal.to_department_id))
const modalShelves = computed(() =>
    hierarchy.shelves.filter((sh: any) =>
        (!modal.to_section_id || sh.section_id === modal.to_section_id)
    )
)
const shelfById = computed(() => {
  const m = new Map<number, any>()
  for (const sh of hierarchy.shelves) m.set(Number(sh.id), sh)
  return m
})
const sectionById = computed(() => {
  const m = new Map<number, any>()
  for (const s of hierarchy.sections) m.set(Number(s.id), s)
  return m
})

// small helpers
const toNum = (v:any) => Number(v || 0)
const normalizeCell = (raw:any) => {
  const id = toNum(raw.id)
  const shelf_id = toNum(raw.shelf_id)
  const section_id = toNum(raw.section_id || shelfById.value.get(shelf_id)?.section_id)
  const department_id = toNum(sectionById.value.get(section_id)?.department_id)
  return { ...raw, id, shelf_id, section_id, department_id }
}
const modalCells = computed(() => {
  const fromId   = toNum(modal.row?.cell_id)
  const tShelf   = toNum(modal.to_shelf_id)
  const tSection = toNum(modal.to_section_id)
  const tDept    = toNum(modal.to_department_id)

  const all = hierarchy.cells.map(normalizeCell)
  const filt = (pred:(c:any)=>boolean) =>
      all.filter(pred).filter(c => c.id !== fromId)

  // strict
  let list = filt(c =>
      (!tShelf   || c.shelf_id     === tShelf) &&
      (!tSection || c.section_id   === tSection) &&
      (!tDept    || c.department_id=== tDept)
  )
  if (list.length) return list

  // relax shelf
  list = filt(c =>
      (!tSection || c.section_id   === tSection) &&
      (!tDept    || c.department_id=== tDept)
  )
  if (list.length) return list

  // relax section
  list = filt(c => (!tDept || c.department_id === tDept))
  if (list.length) return list

  // last resort: any cell in storage except fromId
  return filt(() => true)
})
function ensureSingleDefaults(){
  if (!modal.to_department_id && modalDepartments.value.length===1) {
    modal.to_department_id = modalDepartments.value[0].id
  }
  const secs = modalSections.value
  if ((!modal.to_section_id || !secs.find(s=>s.id===modal.to_section_id)) && secs.length===1){
    modal.to_section_id = secs[0].id
  }
  const shs = modalShelves.value
  if ((!modal.to_shelf_id || !shs.find(s=>s.id===modal.to_shelf_id)) && shs.length===1){
    modal.to_shelf_id = shs[0].id
  }
  const cells = modalCells.value
  if ((!modal.to_cell_id || !cells.find(c=>c.id===modal.to_cell_id)) && cells.length===1){
    modal.to_cell_id = cells[0].id
  }
}

function onChangeDept(){ modal.to_section_id = modal.to_shelf_id = modal.to_cell_id = undefined; ensureSingleDefaults() }
function onChangeSection(){ modal.to_shelf_id = modal.to_cell_id = undefined; ensureSingleDefaults() }
function onChangeShelf(){ modal.to_cell_id = undefined; ensureSingleDefaults() }

async function openTransfer(row:any){
  modal.row = row
  modal.open = true
  modal.qty = 0
  modal.error = ''
  modal.available = Math.max(0, Number(row.qty) - Number(row.reserved_qty))

  modal.to_department_id = row.department_id
  modal.to_section_id    = row.section_id
  modal.to_shelf_id      = row.shelf_id ?? undefined
  modal.to_cell_id       = undefined

  ensureSingleDefaults()
  await nextTick()
  if (!modal.to_cell_id && modalCells.value.length) {
    modal.to_cell_id = modalCells.value[0].id
  }
}
watch(modalCells, (list) => {
  if (!modal.open) return
  if (!list.length) { modal.to_cell_id = undefined; return }
  if (!list.find(c => c.id === toNum(modal.to_cell_id))) {
    modal.to_cell_id = list[0].id
  }
})
const canSubmit = computed(() =>
    modal.open &&
    !!modal.to_cell_id &&
    Number(modal.qty) > 0 &&
    Number(modal.qty) <= Number(modal.available) &&
    !modal.saving
)

async function doTransfer(){
  modal.error = ''
  if (!canSubmit.value) return

  modal.saving = true
  try{
    const payload = {
      from_cell_id: Number(modal.row.cell_id),
      to_cell_id:   Number(modal.to_cell_id),
      product_id:   Number(modal.row.product_id),
      batch_no:     modal.row.batch_no || undefined,
      serial_no:    modal.row.serial_no || undefined,
      qty:          Number(modal.qty),
      unit:         modal.row?.measure || 'piece',
    }

    await wmsApi.transferCellStock(storageId, payload)
    modal.open = false
    await reload()
  }catch(e:any){
    modal.error = e?.response?.data?.message || e.message || 'Error'
  }finally{
    modal.saving = false
  }
}
</script>
