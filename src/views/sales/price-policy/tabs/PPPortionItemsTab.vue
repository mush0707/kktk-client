<template>
  <div class="space-y-4">
    <!-- Filters -->
    <div class="flex flex-col gap-y-2 bg-white rounded-2xl">
      <p>Ֆիլտր (Չափաբաժիններ)</p>
      <div class="grid md:grid-cols-5 gap-3 text-sm">
        <input
            v-model="filters.search"
            placeholder="Փնտրել"
            class="border border-gray-300 rounded-xl px-3 py-2 md:col-span-2"
        />
        <select v-model="statusPick" class="border border-gray-300 rounded-xl px-3 py-2">
          <option :value="''">Բոլոր կարգավիճակները</option>
          <option v-for="s in statuses" :key="s" :value="s">{{ statusMeta(s).label }}</option>
        </select>

        <!-- Product filter -->
        <VueSelect
            class="md:col-span-2"
            v-model="selectedProduct"
            :options="productOptions"
            :is-multi="false"
            :is-searchable="true"
            :filterable="false"
            :loading="loading.products"
            :get-option-label="p => p.name"
            :get-option-value="p => p.id"
            placeholder="Ֆիլտր ըստ ապրանքի"
            @open="fetchProducts('')"
            @search="q => fetchProducts(q)"
            @update:modelValue="onPickProduct"
        />
      </div>

      <div v-if="selectedProductId" class="px-1 pb-3 text-xs text-slate-600">
        Ընտրված ապրանք՝ <span class="font-medium">{{ selectedProductName }}</span>.
        <span class="ml-1">Drag & drop reorder enabled.</span>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-2xl border border-gray-300">
      <div class="p-4 flex items-center justify-between">
        <span>Չափաբաժինների աղյուսակ</span>
        <span v-if="selectedProductId" class="text-xs text-slate-500">Drag & drop reorder enabled</span>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead>
          <tr class="text-left bg-slate-50">
            <th class="px-3 py-2">Ապրանք</th>
            <th class="px-3 py-2">Գին (֏)</th>
            <th class="px-3 py-2">Քանակ</th>
            <th class="px-3 py-2">Չափաբաժին</th>
            <th class="px-3 py-2">Կարգավիճակ</th>
            <th class="px-3 py-2 text-right">Գործողություններ</th>
          </tr>
          </thead>
          <tbody>
          <tr
              v-for="(it, idx) in rows"
              :key="it.id"
              class="border-t"
              :draggable="!!selectedProductId"
              @dragstart="onDragStart(idx, $event)"
              @dragover.prevent
              @drop.prevent="onDrop(idx)"
              @dragend="onDragEnd"
              :class="selectedProductId ? 'cursor-move' : ''"
          >
            <td class="px-3 py-2 align-top">
              <div class="font-medium">{{ it.product?.name || selectedProductName || '—' }}</div>
            </td>
            <td class="px-3 py-2 align-top">{{ $money(it.price) }}</td>
            <td class="px-3 py-2 align-top">{{ it.until_qty ?? '—' }}</td>
            <td class="px-3 py-2 align-top">{{ it.measure ? $t(it.measure) : 'piece' }}</td>
            <td class="px-3 py-2 align-top">
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" :class="statusMeta(it.status).classes">
                  {{ statusMeta(it.status).label }}
                </span>
            </td>
            <td class="px-3 py-2 align-top">
              <div class="flex flex-wrap gap-1 justify-end">
                <button v-if="it.status==='pending'" @click="activate(it)" class="px-3 py-1 text-xs font-medium text-white bg-emerald-600 rounded-md">Ակտիվացնել</button>
                <button v-if="it.status==='pending'" @click="cancel(it)" class="px-3 py-1 text-xs font-medium text-white bg-rose-600 rounded-md">Չեղարկել</button>
                <button v-if="it.status==='pending'" @click="edit(it)" class="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-md">Խմբագրել</button>
                <button v-if="it.status==='active'" @click="onHold(it)" class="px-3 py-1 text-xs font-medium text-white bg-amber-600 rounded-md">Կասեցնել</button>
                <button v-if="it.status==='active'" @click="archive(it)" class="px-3 py-1 text-xs font-medium text-white bg-slate-700 rounded-md">Արխիվացնել</button>
              </div>
            </td>
          </tr>
          </tbody>
        </table>
      </div>

      <div ref="sentinel" class="h-8"></div>
      <div v-if="loading.table" class="p-4 text-center text-slate-500">Բեռնվում է…</div>
      <div v-if="!loading.table && !rows.length" class="p-6 text-center text-slate-400">Տվյալներ չկան</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, computed } from 'vue'
import VueSelect from 'vue3-select-component'
import { sales } from '@/api'

type Status = 'pending'|'active'|'cancelled'|'archived'|'on_hold'
type Row = { id:number; status:Status; price:number; until_qty?:number|null; measure?:string|null; product?:{id:number; name:string} }

/* Filters */
const filters = reactive({ search: '' })
const statuses: Status[] = ['pending','active','cancelled','archived','on_hold']
const statusPick = ref<string>('')

/* Product filter */
const selectedProduct = ref<any | null>(null)              // can be object OR number
const productOptions = ref<any[]>([])
const loading = reactive({ table:false, products:false })

async function fetchProducts(q: string | null){
  loading.products = true
  try {
    const { data } = await sales.products.portions.productList({ limit:20, offset:0, search: q?.trim() || null })
    const arr = Array.isArray(data?.data) ? data.data : []
    productOptions.value = arr.map((p:any) => ({ id:Number(p.id), name:String(p.name || '') }))
  } finally { loading.products = false }
}

const selectedProductId = computed<number|null>(() => {
  const v = selectedProduct.value
  if (!v && v !== 0) return null
  return typeof v === 'object' ? Number(v.id) : Number(v)
})
const selectedProductName = computed<string>(() => {
  const v = selectedProduct.value
  if (!v && v !== 0) return ''
  if (typeof v === 'object') return v.name || ''
  const found = productOptions.value.find(o => Number(o.id) === Number(v))
  return found?.name || ''
})

function onPickProduct(p:any){
  selectedProduct.value = p ?? null
  reload()
}

/* Pagination + rows */
const limit = 20
let offset = 0
const rows = ref<Row[]>([])

/* Status badge */
function statusMeta(s: Status){
  switch(s){
    case 'active': return {label:'Ակտիվ', classes:'bg-green-100 text-green-700 ring-1 ring-green-200'}
    case 'pending': return {label:'Սպասման մեջ', classes:'bg-amber-100 text-amber-800 ring-1 ring-amber-200'}
    case 'on_hold': return {label:'Կասեցված', classes:'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-200'}
    case 'archived': return {label:'Արխիվացված', classes:'bg-slate-100 text-slate-700 ring-1 ring-slate-200'}
    case 'cancelled': return {label:'Չեղարկված', classes:'bg-rose-100 text-rose-700 ring-1 ring-rose-200'}
    default: return {label:s, classes:'bg-slate-100 text-slate-700 ring-1 ring-slate-200'}
  }
}

/* Build query – ALWAYS list; include product_id when available */
function makeQuery(reset=false){
  const q:any = {
    limit,
    offset: reset ? 0 : offset,
    search: filters.search || null,
    status: statusPick.value ? [statusPick.value as Status] : null,
  }
  if (selectedProductId.value) q.product_id = selectedProductId.value   // <-- HERE
  return q
}

async function loadMore(){
  if (loading.table) return
  loading.table = true
  try{
    const { data } = await sales.products.portions.list(makeQuery())    // <-- ALWAYS list()
    const arr: Row[] = Array.isArray(data?.data) ? data.data : []
    const filled = arr.map(r =>
        r.product || !selectedProductId.value
            ? r
            : { ...r, product: { id: selectedProductId.value!, name: selectedProductName.value } }
    )
    if (offset === 0) rows.value = filled
    else rows.value.push(...filled)
    if (arr.length === limit) offset += limit
  } finally { loading.table = false }
}
function reload(){ offset = 0; rows.value = []; loadMore() }

/* Infinite scroll */
const sentinel = ref<HTMLElement|null>(null)
let io: IntersectionObserver|null = null
onMounted(() => {
  fetchProducts('')
  reload()
  io = new IntersectionObserver(es => { if (es.some(e=>e.isIntersecting)) loadMore() })
  if (sentinel.value) io.observe(sentinel.value)
})

/* Debounce filters */
let ft:number|undefined
watch(() => [filters.search, statusPick.value], () => {
  if (ft) window.clearTimeout(ft)
  ft = window.setTimeout(() => reload(), 300)
})

/* Row Ops (minimal) */
async function activate(row: Row){ await sales.products.portions.activate(row.id); await reload() }
async function cancel(row: Row){ await sales.products.portions.cancel(row.id); await reload() }
async function onHold(row: Row){ await sales.products.portions.onHold(row.id); await reload() }
async function archive(row: Row){ await sales.products.portions.archive(row.id); await reload() }
function edit(_row: Row){ /* open edit modal if needed */ }

/* Drag & Drop reorder – only when product_id selected */
const dragIndex = ref<number|null>(null)
function onDragStart(idx:number, e:DragEvent){
  if (!selectedProductId.value) return
  dragIndex.value = idx
  e.dataTransfer?.setData('text/plain', String(idx))
}
async function refreshWithCurrentFilters() {
  offset = 0
  rows.value = []
  await loadMore() // loadMore() internally calls makeQuery() => keeps status/search/product
}
async function onDrop(idx: number) {
  if (!selectedProductId.value || dragIndex.value === null || dragIndex.value === idx) {
    dragIndex.value = null
    return
  }

  const next = rows.value.slice()
  const [moved] = next.splice(dragIndex.value, 1)
  next.splice(idx, 0, moved)
  rows.value = next
  dragIndex.value = null

  const moved_id  = moved.id
  const before_id = rows.value[idx - 1]?.id ?? null
  const after_id  = rows.value[idx + 1]?.id ?? null

  try {
    await sales.products.portions.sort({
      product_id: selectedProductId.value,
      moved_id, before_id, after_id,   // minimal payload
    })
    await refreshWithCurrentFilters()
  } catch {
    await reload()
    await refreshWithCurrentFilters()

  }
}
function onDragEnd(){ dragIndex.value = null }
</script>
