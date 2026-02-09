<template>
  <section class="bg-white">
    <!-- Filters -->
    <div class="pb-4 pt-4 border-b grid lg:grid-cols-6 gap-2 text-sm">
      <input
          v-model="filters.search"
          class="border border-gray-300 rounded-xl px-3 py-2 lg:col-span-2"
          placeholder="Փնտրել (սերիա, ապրանք)"
      />

      <VueSelect
          v-model="customerPick"
          class="lg:col-span-2"
          :options="customerOptions"
          :loading="loading.customers"
          :is-multi="false"
          :is-searchable="true"
          :filterable="false"
          placeholder="Հաճախորդ"
          :get-option-label="c => customerLabel(c)"
          :get-option-value="c => c.id"
          @open="fetchCustomers('')"
          @search="q => fetchCustomers(q)"
          clearable
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
          <th class="px-3 py-2">Ընդամենը</th>
          <th class="px-3 py-2">Ստեղծվել է</th>
          <th class="px-3 py-2">Թարմացվել է</th>
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
            <td class="px-3 py-2">
              {{ customerLabel(row.customer) || '—' }}
            </td>
            <td class="px-3 py-2">{{ $money(row.price) }}</td>
            <td class="px-3 py-2">
              <div>{{ formatDateTime(row.created_at) }}</div>
              <div class="text-[11px] text-slate-500">({{ fromNow(row.created_at) }})</div>
            </td>
            <td class="px-3 py-2">
              <div>{{ formatDateTime(row.updated_at) }}</div>
              <div class="text-[11px] text-slate-500">({{ fromNow(row.updated_at) }})</div>
            </td>
          </tr>

          <!-- Expanded products (no extra request) -->
          <tr v-if="expanded[row.id]" class="bg-white">
            <td colspan="6" class="px-3 py-2">
              <div class="divide-y">
                <div
                    v-for="it in (row.products || [])"
                    :key="it.id"
                    class="py-2 flex items-center justify-between"
                >
                  <div class="min-w-0">
                    <div class="font-medium truncate">{{ productName(it) }}</div>
                    <div
                        v-if="Array.isArray(it.product.characteristics) && it.product.characteristics.length"
                        class="hidden sm:flex flex-wrap gap-1"
                    >
            <span
                v-for="(c, i) in it.product.characteristics.slice(0, 3)"
                :key="i"
                class="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600"
            >
              {{ c.name }}
            </span>
                    </div>
                    <div class="flex-col gap-y-2 mt-2 text-slate-600 flex gap-2">
                      <span>{{ it.qty }} {{ $t(it.measure) }}</span>
                      <span class="flex">
                      <span
                          class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium"
                          :class="productStatusMeta(it.status).classes"
                      >
                        {{ productStatusMeta(it.status).label }}
                      </span>
                      </span>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <div class="w-24 text-right font-medium">{{ $money(it.price) }}</div>
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
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import VueSelect from 'vue3-select-component'
import { sales } from '@/api'
import { formatDateTime, fromNow } from '@/utils/dateFormat'

type Customer = { id:number; first_name?:string; last_name?:string; full_name?:string }
type ProductItem = {
  id: number
  name?: string
  product?: { id:number; name:string; measure?:string }
  qty: number
  price: number
  measure?: string | null
  status?: 'need_to_locate' | 'located' | 'written_off' | string
}
type OutputRow = {
  id: number
  identification_number?: string | number
  customer?: Customer | null
  total: number
  status?: 'ready' | 'written_off' | string | null
  created_at: string
  updated_at: string
  products?: ProductItem[]
}

const rows = ref<OutputRow[]>([])
const limit = 20
let offset = 0

const filters = reactive<{
  search: string
  customer_id: number | null
  status: '' | 'ready' | 'written_off'
  date_from: string
  date_to: string
}>({
  search: '',
  customer_id: null,
  status: '',
  date_from: '',
  date_to: ''
})

/* Customer select */
const customerPick = ref<Customer | null>(null)
const customerOptions = ref<Customer[]>([])
const loading = reactive({ table: false, customers: false })

function customerLabel(c?: Customer | null) {
  if (!c) return ''
  return c.full_name || [c.first_name, c.last_name].filter(Boolean).join(' ')
}
async function fetchCustomers(q: string) {
  loading.customers = true
  try {
    const { data } = await sales.customers.list({
      limit: 20,
      offset: 0,
      search: q && q.trim() !== '' ? q : null
    })
    customerOptions.value = Array.isArray(data?.data) ? data.data : []
  } finally {
    loading.customers = false
  }
}
function syncCustomerFilter() {
  filters.customer_id = customerPick.value?.id ?? null
}

/* BADGES —— status styles */
function statusBadgeMeta(s: any) {
  switch (s) {
    case 'ready':
      return { label: 'Պատրաստ', classes: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200' }
    case 'written_off':
      return { label: 'Դուրս գրված', classes: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200' }
    default:
      return { label: 'Անորոշ', classes: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200' }
  }
}
function productStatusMeta(s: any) {
  switch (s) {
    case 'need_to_locate': return { label: 'Պետք է բաշխել', classes: 'bg-amber-100 text-amber-800 ring-1 ring-amber-200' }
    case 'located':        return { label: 'Բաշխված',       classes: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200' }
    case 'written_off':    return { label: 'Դուրս գրված', classes: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200' }
    default:               return { label: s || '—',        classes: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200' }
  }
}

/* Helpers for product row */
function productName(it: ProductItem) {
  return it.name || it.product?.name || 'Ապրանք'
}
function measureOf(it: ProductItem) {
  return it.measure || it.product?.measure || 'հատ'
}

/* Query + loading */
function makeQuery(reset=false) {
  return {
    limit,
    offset: reset ? 0 : offset,
    search: filters.search || null,
    customer_id: filters.customer_id || null,
    status: filters.status || null,
    date_from: filters.date_from || null,
    date_to: filters.date_to || null,
  }
}
async function loadMore() {
  if (loading.table) return
  loading.table = true
  try {
    const { data } = await sales.sale.history.list(makeQuery())
    const arr: OutputRow[] = Array.isArray(data?.data) ? data.data : []
    if (offset === 0) rows.value = arr
    else rows.value.push(...arr)
    if (arr.length === limit) offset += limit
  } finally {
    loading.table = false
  }
}
function reload() {
  syncCustomerFilter()
  offset = 0
  for (const k in expanded) delete expanded[k]
  loadMore()
}
function clearFilters() {
  filters.search = ''
  filters.status = ''
  filters.date_from = ''
  filters.date_to = ''
  customerPick.value = null
  syncCustomerFilter()
  reload()
}

/* expand rows without extra request */
const expanded = reactive<Record<number, boolean>>({})
function toggle(r: OutputRow) {
  expanded[r.id] = !expanded[r.id]
}

/* optimistic cancel actions (optional) */
async function cancelOutput(r: OutputRow) {
  if (!confirm('Չեղարկել այս վաճառքը ամբողջությամբ՞')) return
  await sales.sale.history.cancel(r.id)
  rows.value = rows.value.filter(x => x.id !== r.id)
}
async function cancelOutputItem(r: OutputRow, it: ProductItem) {
  if (!confirm('Չեղարկել այս դիրքը՞')) return
  await sales.sale.history.cancelItem(r.id, it.id)
  const idx = rows.value.findIndex(x => x.id === r.id)
  if (idx >= 0) {
    const list = (rows.value[idx].products || [])
    rows.value[idx].products = list.filter(x => x.id !== it.id)
    rows.value[idx].total = Math.max(
        0,
        Number(rows.value[idx].total || 0) - (Number(it.qty || 0) * Number(it.price || 0))
    )
  }
}

/* infinite scroll */
const sentinel = ref<HTMLElement | null>(null)
let io: IntersectionObserver | null = null
onMounted(() => {
  reload()
  io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) loadMore() })
  if (sentinel.value) io.observe(sentinel.value)
})
</script>
