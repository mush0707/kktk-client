<!-- src/views/storages/modals/AllocatedToCellModal.vue -->
<template>
  <div class="fixed inset-0 z-50">
    <!-- backdrop -->
    <div class="absolute inset-0 bg-black/40" @click="$emit('close')"></div>

    <!-- modal -->
    <div class="absolute inset-0 flex items-center justify-center p-4">
      <div class="w-full max-w-3xl bg-white rounded-2xl shadow-xl overflow-hidden">
        <!-- header -->
        <div class="px-4 py-3 border-b flex items-center justify-between">
          <div class="font-semibold">Տեղավորել</div>
          <button class="px-3 py-1 rounded-xl border border-gray-300 hover:bg-gray-50" @click="$emit('close')">Փակել</button>
        </div>

        <!-- body -->
        <div class="p-4 space-y-4">
          <!-- error -->
          <div v-if="err" class="text-sm text-red-600">{{ err }}</div>

          <!-- 📦 Ապրանքի ինֆո -->
          <div class="rounded-xl border border-gray-300 px-3 py-2">
            <div class="flex flex-wrap items-center gap-2">
              <span class="font-medium">{{ p?.name || storageProduct?.product_id }}</span>
              <span v-if="p?.type?.name" class="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                {{ p.type.name }}
              </span>
              <span class="text-[11px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                {{ unitLabel }}
              </span>
            </div>

            <div v-if="charList.length" class="mt-1 flex flex-wrap gap-1">
              <span v-for="c in charList" :key="c.id || c.name"
                    class="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                {{ c.name }}
              </span>
            </div>
          </div>

          <!-- qty + row -->
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="text-xs text-gray-500">
                Քանակ <span class="text-gray-400">({{ unitShort }})</span>
              </label>
              <input
                  v-model.number="form.qty"
                  type="number"
                  min="0"
                  :max="maxQty"
                  step="0.001"
                  class="w-full border border-gray-300 rounded-xl px-3 py-2"
              />
              <div class="text-xs text-gray-500">
                Առավելագույն՝ {{ fmt(maxQty) }} {{ unitShort }}
              </div>
            </div>
          </div>

          <!-- hierarchy -->
          <div class="grid grid-cols-4 gap-3">
            <div>
              <label class="text-xs text-gray-500">Բաժին</label>
              <select v-model.number="sel.departmentId" class="w-full border border-gray-300 rounded-xl px-3 py-2" @change="onDepartment">
                <option :value="undefined">— Ընտրել —</option>
                <option v-for="d in (tree.departments || [])" :key="d.id" :value="d.id">{{ d.name }}</option>
              </select>
            </div>

            <div>
              <label class="text-xs text-gray-500">Շարք</label>
              <select v-model.number="sel.sectionId" class="w-full border border-gray-300 rounded-xl px-3 py-2" @change="onSection">
                <option :value="undefined">— Ընտրել —</option>
                <option v-for="s in sections" :key="s.id" :value="s.id">{{ s.name }}</option>
              </select>
            </div>

            <div>
              <label class="text-xs text-gray-500">Դարակաշար</label>
              <select v-model.number="sel.shelfId" class="w-full border border-gray-300 rounded-xl px-3 py-2" @change="onShelf">
                <option :value="undefined">— Ընտրել —</option>
                <option v-for="sh in shelves" :key="sh.id" :value="sh.id">{{ sh.name }}</option>
              </select>
            </div>

            <div>
              <label class="text-xs text-gray-500">Բջիջ</label>
              <select v-model.number="sel.cellId" class="w-full border border-gray-300 rounded-xl px-3 py-2">
                <option :value="undefined">— Ընտրել —</option>
                <option v-for="c in cells" :key="c.id" :value="c.id">
                  {{ c.code }} ({{ c.is_empty ? 'դատարկ' : 'ոչ դատարկ' }})
                </option>
              </select>
            </div>
          </div>

          <!-- selected cell info -->
          <div v-if="selectedCell" class="rounded-xl border border-gray-300 px-3 py-2 flex items-center justify-between">
            <div class="text-sm">
              <div class="font-medium">Բջիջ՝ {{ selectedCell.code }}</div>
              <div class="text-gray-500">
                Վիճակ՝ {{ selectedCell.is_empty ? 'Դատարկ' : 'Ոչ դատարկ' }}
                <span v-if="!selectedCell.is_empty">
                  · Տողեր՝ {{ selectedCell.summary?.rows ?? '—' }}
                  <span v-if="selectedCell.summary?.qty"> · Քանակ՝ {{ fmt(selectedCell.summary.qty) }} {{ unitShort }}</span>
                </span>
              </div>
            </div>

            <button
                v-if="!selectedCell.is_empty"
                class="px-3 py-2 rounded-xl border border-gray-300 hover:bg-gray-50"
                @click="openInventory(selectedCell.id)"
            >
              Տեսնել բջիջում առկա ապրանքները
            </button>
          </div>
        </div>

        <!-- footer -->
        <div class="px-4 py-3 border-t flex justify-end gap-2">
          <button class="px-3 py-2 rounded-xl border border-gray-300 hover:bg-gray-50" @click="$emit('close')">Չեղարկել</button>
          <button
              class="px-3 py-2 rounded-xl bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-60"
              :disabled="!canSubmit || loading"
              @click="submit"
          >
            {{ loading ? 'Կատարվում է…' : 'Տեղավորել' }}
          </button>
        </div>
      </div>
    </div>

    <!-- inventory modal -->
    <CellInventoryModal
        v-if="showInv && invCellId !== null"
        :key="invCellId"
        :cell-id="invCellId"
        @close="closeInventory"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { wmsApi } from '@/api.js'
import CellInventoryModal from './CellInventoryModal.vue'

const props = defineProps({
  storageProduct: { type: Object, required: true }
})
const emit = defineEmits(['close', 'created'])

/* ---------- helpers ---------- */
const fmt = (n) => Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 6 })

// 👉 մարդուն հարմար միավորների լեյբլեր
function unitFromMeasureType(mt) {
  switch (mt) {
    case 'weight':   return { short: 'կգ', full: 'կիլոգրամ' }
    case 'capacity': return { short: 'լ',  full: 'լիտր' }
    case 'length':   return { short: 'մ',  full: 'մետր' }
    default:         return { short: 'հատ', full: 'հատ' }
  }
}
function unitFromRowMeasure(measure) {
  // եթե storage_products.measure կա՝ մափենք հայերեն կրճատմամբ
  const m = (measure || '').toLowerCase()
  if (!m) return null
  const map = {
    kg: 'կգ', g: 'գ', t: 'տ',
    l: 'լ', ml: 'մլ', m3: 'մ³',
    m: 'մ', cm: 'սմ', mm: 'մմ',
    piece: 'հատ', pcs: 'հատ'
  }
  return map[m] || m
}

/* ---------- state ---------- */
const form = ref({ qty: 0 })
const err = ref('')
const loading = ref(false)

const maxQty = computed(() => Number(props.storageProduct?.qty_available || 0) - Number(props.storageProduct?.qty_reserved_place || 0) - Number(props.storageProduct?.qty_reserved_production || 0))

// product info (from staging row)
const p = computed(() => props.storageProduct?.product || null)

// characteristics safe list
const charList = computed(() => {
  const raw = p.value?.characteristics
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string') { try { return JSON.parse(raw || '[]') } catch { return [] } }
  return []
})

// unit labels (short/full) for UI
const unitShort = computed(() => {
  // նախընտրում ենք storage_products.measure-ը (եթե կա), այլապես measure_type
  const m = unitFromRowMeasure(props.storageProduct?.measure)
  if (m) return m
  return unitFromMeasureType(p.value?.measure_type || 'piece').short
})
const unitLabel = computed(() => {
  const m = unitFromRowMeasure(props.storageProduct?.measure)
  if (m) return `մ/չափ՝ ${m}`
  const mt = unitFromMeasureType(p.value?.measure_type || 'piece')
  return `մ/չափ՝ ${mt.full} (${mt.short})`
})

// tree + selections
const tree = ref({ departments: [] })
const sections = ref([])
const shelves = ref([])
const cells = ref([])

const sel = ref({
  departmentId: undefined,
  sectionId: undefined,
  shelfId: undefined,
  cellId: undefined
})

const selectedCell = computed(() => cells.value.find(c => c.id === sel.value.cellId) || null)

// inventory modal
const showInv = ref(false)
const invCellId = ref(null)
const openInventory = (cid) => {
  if (cid == null) return
  invCellId.value = Number(cid)
  showInv.value = true
}
const closeInventory = () => { showInv.value = false; invCellId.value = null }

/* ---------- load tree (allowed only) ---------- */
async function loadTree () {
  err.value = ''
  try {
    const storageId = props.storageProduct?.storage_id
    const productId = props.storageProduct?.product_id
    if (!storageId || !productId) return
    const data = await wmsApi.getPlaceTree(storageId, productId)
    tree.value = (data && typeof data === 'object') ? data : { departments: [] }

    // reset chains
    sel.value = { departmentId: undefined, sectionId: undefined, shelfId: undefined, cellId: undefined }
    sections.value = []
    shelves.value = []
    cells.value = []

    // ✅ auto-pick if only one department
    const deps = tree.value.departments || []
    if (deps.length === 1) {
      sel.value.departmentId = deps[0].id
      onDepartment()        // սա կլցնի sections-ը
    }
  } catch (e) {
    err.value = 'Չհաջողվեց բեռնել տեղակայման ծառը'
  }
}

function onDepartment () {
  const d = (tree.value.departments || []).find(x => x.id === sel.value.departmentId)
  sections.value = d?.sections || []
  sel.value.sectionId = undefined
  shelves.value = []
  sel.value.shelfId = undefined
  cells.value = []
  sel.value.cellId = undefined

  // ✅ auto-pick if only one section
  if (sections.value.length === 1) {
    sel.value.sectionId = sections.value[0].id
    onSection()
  }
}

function onSection () {
  const s = sections.value.find(x => x.id === sel.value.sectionId)
  shelves.value = s?.shelves || []
  sel.value.shelfId = undefined
  cells.value = []
  sel.value.cellId = undefined

  // ✅ auto-pick if only one shelf
  if (shelves.value.length === 1) {
    sel.value.shelfId = shelves.value[0].id
    onShelf()
  }
}

function onShelf () {
  const sh = shelves.value.find(x => x.id === sel.value.shelfId)
  cells.value = sh?.cells || []
  sel.value.cellId = undefined

  // ✅ auto-pick if only one cell
  if (cells.value.length === 1) {
    sel.value.cellId = cells.value[0].id
  }
}

const canSubmit = computed(() => {
  const q = Number(form.value.qty || 0)
  return q > 0 && q <= maxQty.value && !!sel.value.cellId
})

/* ---------- submit ---------- */
async function submit () {
  if (!canSubmit.value) return
  err.value = ''
  loading.value = true
  try {
    await wmsApi.placeToCell(props.storageProduct.storage_id, props.storageProduct.id, sel.value.cellId, Number(form.value.qty))
    emit('created')  // parent → reload list
    emit('close')
  } catch (e) {
    err.value = 'Տեղավորումը չստացվեց'
  } finally {
    loading.value = false
  }
}

/* ---------- lifecycle ---------- */
onMounted(async () => {
  // default՝ ամբողջ ազատ քանակը
  console.log(maxQty)
  form.value.qty = maxQty.value
  await loadTree()
})

watch(() => props.storageProduct?.id, async () => {
  form.value.qty = maxQty.value
  await loadTree()
})
</script>
