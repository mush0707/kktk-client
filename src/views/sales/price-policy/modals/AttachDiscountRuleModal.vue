<!-- src/views/sales/modals/AttachDiscountRuleModal.vue -->
<template>
  <div v-if="open" class="fixed inset-0 z-50">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/30" @click="close"></div>

    <!-- Panel -->
    <aside class="absolute right-0 top-0 h-screen w-full max-w-5xl bg-white shadow-2xl flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between px-5 py-3 border-b">
        <h3 class="text-lg font-semibold">Ստեղծել զեղչի կարգավորում</h3>
        <button class="px-3 py-1 rounded-xl border" @click="close">✕</button>
      </div>

      <!-- Info -->
      <div class="flex p-4 text-sm text-blue-800 rounded-lg bg-blue-50" role="alert">
        <svg class="shrink-0 inline w-4 h-4 me-3 mt-[2px]" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z"/>
        </svg>
        <div>
          <span class="font-medium">Ամեն ապրանք կարող է ունենալ 1 անժամկետ կամ մի քանի իրար հաջորդող ժամկետային զեղչի կարգավորում:</span>
          <ul class="mt-1.5 list-disc list-inside">
            <li>Ապրանքները անժամկետ կարգավորմանը կցելուց հետո՝ այն հնարավոր չի լինի կցել մեկ այլ զեղչի</li>
            <li>Ապրանքների ժամկետներով զեղչի կարգավորումները կաշխատեն ըստ հերթականության</li>
          </ul>
        </div>
      </div>

      <!-- Top form: discount + dates -->
      <div class="px-5 pt-4 pb-3 border-b">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <!-- Discount -->
          <div class="flex flex-col">
            <label class="text-sm font-medium text-slate-700 mb-1">Զեղչ</label>
            <VueSelect
                v-model="discountId"
                :options="discountOptions"
                :is-multi="false"
                :is-searchable="true"
                :filterable="false"
                :loading="loading.discounts"
                :get-option-label="o => o.name"
                :get-option-value="o => o.id"
                placeholder="Ընտրել զեղչ"
                @open="fetchDiscounts('')"
                @search="q => fetchDiscounts(q)"
            />
            <p v-if="errors.discount" class="mt-1 text-xs text-rose-600">{{ errors.discount }}</p>
          </div>

          <!-- from_date -->
          <div class="flex flex-col">
            <label class="text-sm font-medium text-slate-700 mb-1">Սկիզբ</label>
            <input v-model="fromDate" type="date" class="border border-gray-300 rounded-xl px-3 py-2" :min="today" />
            <p v-if="errors.from_date" class="mt-1 text-xs text-rose-600">{{ errors.from_date }}</p>
          </div>

          <!-- to_date -->
          <div class="flex flex-col">
            <label class="text-sm font-medium text-slate-700 mb-1">Ավարտ</label>
            <input v-model="toDate" type="date" class="border border-gray-300 rounded-xl px-3 py-2" :min="fromDate || today" />
            <p v-if="errors.to_date" class="mt-1 text-xs text-rose-600">{{ errors.to_date }}</p>
          </div>
        </div>
      </div>

      <!-- Body: two blocks -->
      <div class="flex-1 overflow-hidden">
        <div class="grid grid-cols-1 lg:grid-cols-2 h-full">
          <!-- Block 1: Filters + Product list -->
          <section class="flex flex-col h-full border-r">
            <!-- Filters -->
            <div class="p-5 space-y-3 border-b">
              <div class="text-sm font-medium text-slate-700">Ֆիլտրել ապրանքները</div>
              <div class="grid grid-cols-2 gap-2">
                <!-- Group -->
                <VueSelect
                    v-model="groupId"
                    :options="groupOptions"
                    :is-multi="false"
                    :is-searchable="true"
                    :filterable="false"
                    :loading="loading.groups"
                    :get-option-label="o => o.name"
                    :get-option-value="o => o.id"
                    placeholder="Խումբ"
                    @open="fetchGroups('')"
                    @search="q => fetchGroups(q)"
                />
                <!-- Type -->
                <VueSelect
                    v-model="typeId"
                    :options="typeOptions"
                    :is-multi="false"
                    :is-searchable="true"
                    :filterable="false"
                    :loading="loading.types"
                    :get-option-label="o => o.name"
                    :get-option-value="o => o.id"
                    placeholder="Տեսակ"
                    @open="fetchTypes('')"
                    @search="q => fetchTypes(q)"
                />
                <!-- Search -->
                <input v-model="search" type="text" placeholder="Որոնել…" class="border col-span-2 border-gray-300 rounded-xl px-3 py-2" />
              </div>
            </div>

            <!-- Product list -->
            <div class="flex-1 overflow-y-auto">
              <div class="divide-y">
                <div v-for="p in products" :key="p.id" class="p-4 space-y-2">
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <div class="font-medium truncate">{{ p.name }}</div>

                      <!-- last_discount line -->
                      <div v-if="p.last_discount" class="mt-1 flex items-center gap-2 text-xs">
                        <span
                            class="inline-flex items-center px-2 py-0.5 rounded-full font-medium"
                            :class="statusMeta(p.last_discount.status as any).classes"
                        >
                          {{ statusMeta(p.last_discount.status as any).label }}
                        </span>
                        <span class="text-slate-600">
                          {{ p.last_discount.discount?.name || 'Զեղչ' }}
                          ({{ p.last_discount.discount?.percentage ?? '—' }}%)
                        </span>
                      </div>

                      <div class="text-[11px] text-slate-500">
                        {{ labelForMeasure(p) }}
                      </div>
                      <div
                          v-if="Array.isArray(p.characteristics) && p.characteristics.length"
                          class="mt-1 flex flex-wrap gap-1"
                      >
                        <span
                            v-for="(c, i) in p.characteristics.slice(0,4)"
                            :key="i"
                            class="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600"
                        >{{ c.name }}</span>
                        <span v-if="p.characteristics.length>4"
                              class="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600"
                        >+{{ p.characteristics.length-4 }}</span>
                      </div>
                    </div>

                    <!-- per-row 'until' + actions -->
                    <div class="flex flex-col items-end gap-2 shrink-0">
                      <div class="flex items-end gap-2">
                        <div class="flex flex-col">
                          <label class="text-xs text-slate-600">Մինչև ({{ labelForMeasure(p) }})</label>
                          <input
                              :value="rowUntil[p.id] ?? ''"
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="օր․ 1.00"
                              class="w-28 border border-gray-300 rounded-xl px-3 py-1.5 text-sm"
                              @input="onRowUntilInput(p.id, ($event.target as HTMLInputElement).value)"
                          />
                        </div>
                        <button
                            class="px-3 py-1.5 text-xs font-medium text-white rounded-md hover:opacity-90 disabled:opacity-50"
                            :class="freeInfo(p).mode==='blocked' ? 'bg-rose-600' : 'bg-blue-600'"
                            :disabled="freeInfo(p).mode==='blocked'"
                            @click="queueProduct(p)"
                        >
                          Կցել →
                        </button>
                      </div>

                      <!-- Free date ranges message -->
                      <div
                          v-if="freeInfo(p).text"
                          class="mt-1 text-[11px] rounded px-2 py-1 ring-1"
                          :class="{
                          'text-emerald-700 bg-emerald-50 ring-emerald-100': freeInfo(p).mode==='ok',
                          'text-slate-600 bg-slate-50 ring-slate-200': freeInfo(p).mode==='none',
                          'text-rose-700 bg-rose-50 ring-rose-200': freeInfo(p).mode==='blocked',
                        }"
                      >
                        {{ freeInfo(p).text }}
                      </div>
                    </div>
                  </div>

                  <div class="flex gap-2">
                    <!-- View portions -->
                    <button class="px-3 py-1.5 text-xs font-medium text-slate-700 rounded-md border hover:bg-slate-50" @click="openProductPortions(p)">
                      Տեսնել չափաբաժինները
                    </button>

                    <!-- View active discounts -->
                    <button class="px-3 py-1.5 text-xs font-medium text-indigo-700 rounded-md border border-indigo-200 hover:bg-indigo-50" @click="openActiveDiscounts(p)">
                      Տեսնել ակտիվ զեղչերը
                    </button>
                  </div>
                </div>
              </div>

              <!-- sentinel + states -->
              <div ref="listSentinel" class="h-8"></div>
              <div v-if="loading.products" class="p-4 text-center text-slate-500">Բեռնվում է…</div>
              <div v-if="!loading.products && !products.length" class="p-6 text-center text-slate-400">Ապրանք չի գտնվել</div>
            </div>
          </section>

          <!-- Block 2: Selected rows -->
          <section class="flex flex-col h-full">
            <div class="p-5 border-b flex items-center justify-between">
              <div class="text-sm font-medium text-slate-700">Ընտրված ապրանքներ ({{ selected.length }})</div>
              <button class="px-3 py-1.5 text-xs font-medium text-slate-700 rounded-md border hover:bg-slate-50" :disabled="!selected.length || saving" @click="clearSelected">
                Մաքրել բոլորը
              </button>
            </div>

            <div class="flex-1 overflow-y-auto">
              <div v-if="!selected.length" class="p-6 text-center text-slate-400">Ապրանք դեռ ընտրված չէ</div>

              <div v-for="row in selected" :key="row.product_id" class="p-4 border-b">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <div class="font-medium truncate">{{ row.name }}</div>
                    <div class="text-[11px] text-slate-500">{{ $t(row.measure_label ?? 'piece') }}</div>
                    <div v-if="Array.isArray(row.characteristics) && row.characteristics.length" class="hidden sm:flex flex-wrap gap-1">
                      <span
                          v-for="(c, i) in row.characteristics.slice(0, 3)"
                          :key="i"
                          class="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600"
                      >{{ c.name }}</span>
                    </div>
                  </div>
                  <div class="flex items-end gap-2">
                    <div class="flex flex-col gap-y-2">
                      <label class="text-xs text-slate-600">Մինչև ({{ $t(row.measure_label) }})</label>
                      <input v-model.number="row.until_qty" type="number" min="0" step="0.01" placeholder="օր․ 1.00" class="w-28 border border-gray-300 rounded-xl px-3 py-1.5 text-sm" />
                    </div>
                    <button class="px-3 py-1.5 text-xs font-medium text-white bg-rose-600 rounded-md hover:bg-rose-700" @click="removeSelected(row.product_id)">Հեռացնել</button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-4 border-t flex gap-2 justify-end">
        <div class="flex-1 text-xs text-rose-600" v-if="formError">{{ formError }}</div>
        <button class="px-4 py-2 rounded-xl border" @click="close">Փակել</button>
        <button class="px-4 py-2 rounded-xl bg-blue-600 text-white disabled:opacity-50" :disabled="saving || !canSubmit" @click="submit">
          Պահպանել
        </button>
      </div>
    </aside>

    <!-- RIGHT SLIDE-OVER: Product portions list -->
    <transition name="slide-in-right">
      <div v-if="portionsOpen" class="fixed inset-0 z-50">
        <div class="absolute inset-0 bg-black/30" @click="closePortions"></div>

        <aside class="absolute right-0 top-0 h-screen w-full max-w-xl bg-white shadow-2xl flex flex-col">
          <div class="flex items-center justify-between px-5 py-3 border-b">
            <h3 class="text-lg font-semibold truncate">Չափաբաժիններ — {{ portionsTitle }}</h3>
            <button class="px-3 py-1 rounded-xl border" @click="closePortions">✕</button>
          </div>

          <div class="px-5 py-3 border-b">
            <select v-model="portionsStatus" class="border border-gray-300 rounded-xl px-3 py-2 text-sm">
              <option :value="''">Բոլոր կարգավիճակները</option>
              <option v-for="s in portionStatuses" :key="s" :value="s">{{ $t(s) }}</option>
            </select>
          </div>

          <div class="flex-1 overflow-y-auto">
            <div v-for="it in portions" :key="it.id" class="p-4 border-b">
              <div class="flex items-center justify-between">
                <div class="space-y-0.5">
                  <div class="font-medium">{{ it.price }} ֏</div>
                  <div class="text-xs text-slate-500">
                    {{ it.until_qty ? ('մինչև ' + it.until_qty) : '—' }} • {{ it.measure ? $t(it.measure) : 'piece' }}
                  </div>
                </div>
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" :class="statusMeta(it.status).classes">
                  {{ statusMeta(it.status).label }}
                </span>
              </div>
            </div>

            <div ref="portionsSentinel" class="h-8"></div>
            <div v-if="portionsLoading" class="p-4 text-center text-slate-500">Բեռնվում է…</div>
            <div v-if="!portionsLoading && !portions.length" class="p-6 text-center text-slate-400">Չկան չափաբաժիններ</div>
          </div>
        </aside>
      </div>
    </transition>

    <!-- RIGHT SLIDE-OVER — Active discounts -->
    <transition name="slide-in-right">
      <div v-if="activeOpen" class="fixed inset-0 z-50">
        <div class="absolute inset-0 bg-black/30" @click="closeActive"></div>

        <aside class="absolute right-0 top-0 h-screen w-full max-w-xl bg-white shadow-2xl flex flex-col">
          <div class="flex items-center justify-between px-5 py-3 border-b">
            <h3 class="text-lg font-semibold truncate">Ակտիվ զեղչեր — {{ activeTitle }}</h3>
            <button class="px-3 py-1 rounded-xl border" @click="closeActive">✕</button>
          </div>

          <div class="flex-1 overflow-y-auto">
            <div v-if="!activeRows.length" class="p-6 text-center text-slate-400">Ակտիվ զեղչեր չկան</div>

            <div v-for="row in activeRows" :key="row.id || row.discount_setting?.id" class="p-4 border-b">
              <div class="flex items-center justify-between">
                <div class="space-y-0.5">
                  <div class="text-xs text-slate-500">
                    <span class="mr-2">Սկսած՝ {{ row.discount_setting?.from_date || '—' }}</span>
                    <span>Մինչև՝ {{ row.discount_setting?.to_date || '—' }}</span>
                  </div>
                  <div class="font-medium">
                    {{ row.discount_setting?.discount?.name || 'Զեղչ' }}
                    <span class="text-slate-500">
                      ({{ row.discount_setting?.discount?.percentage ?? '—' }}%)
                    </span>
                  </div>
                  <div class="text-xs">
                    <span class="text-slate-500">Չափաքանակ՝ </span>
                    <span>{{ row.until_qty > 0 ? row.until_qty + ' ' + $t(row.measure ?? 'piece') : 'Անսահմանափակ' }}</span>
                  </div>
                </div>
                <span
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                    :class="statusMeta((row.discount_setting?.status || row.status) as any).classes"
                >
                  {{ statusMeta((row.discount_setting?.status || row.status) as any).label }}
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import VueSelect from 'vue3-select-component'
import { productsApi, sales } from '@/api'

/* Props/Emits */
const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ (e:'update:open', v:boolean):void; (e:'done'):void }>()

/* Top form state */
const discountId = ref<string>('')
const discountOptions = ref<any[]>([])
const fromDate = ref<string>('')
const toDate   = ref<string>('')

/* Date validation + special rules */
const today = new Date().toISOString().slice(0,10)
watch(fromDate, (v) => {
  if (v && v < today) fromDate.value = today
  if (toDate.value && v && toDate.value < v) toDate.value = v
})
watch(toDate, (v) => {
  // if only end is chosen -> start becomes today
  if (v && !fromDate.value) fromDate.value = today
  if (v && fromDate.value && v < fromDate.value) toDate.value = fromDate.value
})

/* Errors */
const errors = reactive<{ discount?: string; from_date?: string; to_date?: string }>({})
const formError = ref('')

/* Filters + data */
const groupId = ref<string>('')   // group select value
const typeId  = ref<string>('')   // type select value
const search  = ref<string>('')

const groupOptions = ref<any[]>([])
const typeOptions  = ref<any[]>([])
const products     = ref<any[]>([])  // include last_discount & active_and_pending_discounts
const rowUntil     = reactive<Record<number, number | null>>({})

const limit = 20
let offset = 0

/* Selected rows */
type SelectedRow = {
  product_id: number
  name: string
  measure_label: string
  characteristics: [] | null
  until_qty: number | null
}
const selected = ref<SelectedRow[]>([])

/* Loaders */
const loading = reactive({ discounts:false, groups:false, types:false, products:false })
const saving = ref(false)

/* Open/Close main modal */
function close(){ emit('update:open', false) }

/* Status badge helper */
type PStatus = 'pending'|'active'|'cancelled'|'archived'|'on_hold'
function statusMeta(s: PStatus | string){
  switch (s as string) {
    case 'active':    return { label:'Ակտիվ',       classes:'bg-green-100 text-green-700 ring-1 ring-green-200' }
    case 'pending':   return { label:'Սպասման մեջ', classes:'bg-amber-100 text-amber-800 ring-1 ring-amber-200' }
    case 'on_hold':   return { label:'Կասեցված',    classes:'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-200' }
    case 'archived':  return { label:'Արխիվացված',  classes:'bg-slate-100 text-slate-700 ring-1 ring-slate-200' }
    case 'cancelled': return { label:'Չեղարկված',   classes:'bg-rose-100 text-rose-700 ring-1 ring-rose-200' }
    default:          return { label: String(s),     classes:'bg-slate-100 text-slate-700 ring-1 ring-slate-200' }
  }
}

/* Reference data */
async function fetchDiscounts(q: string | null){
  loading.discounts = true
  try{
    const { data } = await sales.discounts.list({ limit: 20, offset: 0, status: ['active'], search: q && q.trim()!=='' ? q : null })
    const arr = Array.isArray(data?.data) ? data.data : []
    discountOptions.value = arr.map((d:any) => ({ id:String(d.id), name:`${d.name} (${d.percentage}%) ${d.for_customer ? 'Հաճախորդի' : ''}` }))
  } finally { loading.discounts = false }
}
async function fetchGroups(q: string | null){
  loading.groups = true
  try{
    const arr = await productsApi.searchGroups({ limit: 20, offset: 0, search: q && q.trim()!=='' ? q : null })
    groupOptions.value = (arr || []).map((g:any) => ({ id:String(g.id), name:String(g.name || '') }))
  } finally { loading.groups = false }
}
async function fetchTypes(q: string | null){
  loading.types = true
  try{
    const arr = await productsApi.searchTypes({ limit: 20, offset: 0, group_id: groupId.value, search: q && q.trim()!=='' ? q : null })
    typeOptions.value = (arr || []).map((t:any) => ({ id:String(t.id), name:String(t.name || '') }))
  } finally { loading.types = false }
}

/* Product list */
function makeProductQuery(reset=false){
  const params:any = { limit, offset: reset ? 0 : offset }
  if (groupId.value) params.group_id = groupId.value
  if (typeId.value)  params.type_id  = typeId.value
  if (search.value && search.value.trim() !== '') params.search = search.value
  return params
}
async function loadMoreProducts(){
  if (loading.products) return
  loading.products = true
  try{
    const { data } = await sales.products.portions.productList(makeProductQuery())
    const arr = Array.isArray(data?.data) ? data.data : []
    const mapped = arr.map((p:any) => ({
      id: Number(p.id),
      name: String(p.name || ''),
      measure_type: p.measure_type ?? null,
      measure: p.measure ?? null,
      characteristics: Array.isArray(p.characteristics) ? p.characteristics : [],
      last_discount: p.last_discount ?? null,
      active_and_pending_discounts: Array.isArray(p.active_and_pending_discounts) ? p.active_and_pending_discounts : [],
    }))
    if (offset === 0) products.value = mapped
    else products.value.push(...mapped)
    if (arr.length === limit) offset += limit
  } finally { loading.products = false }
}
function reloadProducts(){ offset = 0; loadMoreProducts() }

/* Infinite scroll sentinel */
const listSentinel = ref<HTMLElement|null>(null)
let io: IntersectionObserver | null = null
onMounted(() => {
  io = new IntersectionObserver((entries) => {
    if (entries.some(e => e.isIntersecting)) loadMoreProducts()
  })
  if (listSentinel.value) io.observe(listSentinel.value)
})

/* When modal opens – fresh lists */
watch(() => props.open, (isOpen) => {
  if (!isOpen) return
  offset = 0
  products.value = []
  groupOptions.value = []
  typeOptions.value = []
  discountOptions.value = []

  fetchDiscounts('')
  fetchGroups('')
  fetchTypes('')
  reloadProducts()
})

/* Debounced reactions */
let searchTimer: number | undefined
watch(typeId, () => {
  if (!groupId.value) fetchGroups('')
  reloadProducts()
})
watch(groupId, () => {
  typeId.value = ''
  typeOptions.value = []
  fetchTypes('')
  reloadProducts()
})
watch(search, () => {
  if (searchTimer) window.clearTimeout(searchTimer)
  searchTimer = window.setTimeout(() => reloadProducts(), 300)
})

/* Measure helpers */
function labelForMeasure(p:any){
  if (p.measure) return p.measure
  const mt = p.measure_type
  if (mt === 'weight') return 'kg'
  if (mt === 'length') return 'm'
  if (mt === 'capacity') return 'l'
  return 'հատ'
}
function onRowUntilInput(pid:number, raw:string){
  const n = raw === '' ? null : Number(raw)
  rowUntil[pid] = (n !== null && !Number.isNaN(n)) ? n : null
}

/* ===== Date math to compute free days ===== */
type DateRange = { start: Date; end: Date } // inclusive
function dParse(s?: string|null): Date | null { return s ? new Date(`${s}T00:00:00`) : null }
function dISO(d: Date) { return d.toISOString().slice(0,10) }
function addDays(d: Date, n: number){ const x=new Date(d); x.setDate(x.getDate()+n); return x }

function mergeRanges(ranges: DateRange[]): DateRange[] {
  if (!ranges.length) return []
  const sorted = [...ranges].sort((a,b)=>a.start.getTime()-b.start.getTime())
  const out: DateRange[] = []
  let cur = { ...sorted[0] }
  for (let i=1;i<sorted.length;i++){
    const r = sorted[i]
    if (r.start.getTime() <= addDays(cur.end,1).getTime()){
      if (r.end.getTime() > cur.end.getTime()) cur.end = r.end
    } else { out.push(cur); cur = { ...r } }
  }
  out.push(cur)
  return out
}
function subtractRanges(main: DateRange, blocks: DateRange[]): DateRange[] {
  if (!blocks.length) return [main]
  const merged = mergeRanges(
      blocks.map(b => ({
        start: b.start.getTime() < main.start.getTime() ? main.start : b.start,
        end:   b.end.getTime()   > main.end.getTime()   ? main.end   : b.end,
      })).filter(b => b.start.getTime() <= b.end.getTime())
  )
  const gaps: DateRange[] = []
  let cursor = new Date(main.start)
  for (const b of merged){
    if (b.start.getTime() > cursor.getTime()) gaps.push({ start: new Date(cursor), end: addDays(b.start,-1) })
    const next = addDays(b.end,1)
    if (next.getTime() > cursor.getTime()) cursor = next
    if (cursor.getTime() > main.end.getTime()) break
  }
  if (cursor.getTime() <= main.end.getTime()) gaps.push({ start: new Date(cursor), end: new Date(main.end) })
  return gaps
}
function activeRangesOf(p: any): DateRange[] {
  const rows = Array.isArray(p.active_and_pending_discounts) ? p.active_and_pending_discounts : []
  const ranges: DateRange[] = []
  for (const r of rows){
    const ds = r?.discount_setting
    const st = (ds?.status || r.status)
    if (st !== 'active') continue
    const s = dParse(ds?.from_date)
    const e = dParse(ds?.to_date)
    if (!s || !e) continue
    ranges.push({ start: s, end: e })
  }
  return ranges
}

/**
 * freeInfo modes:
 * - 'none'    : no period selected -> “սահմանափակում չկա”
 * - 'ok'      : there are free gaps; show first 1–2
 * - 'blocked' : no gaps in selected period
 */
function freeInfo(p: any): { mode: 'none'|'ok'|'blocked'; text: string } {
  // Block everything if product has a perpetual active discount
  if (hasPerpetualActive(p)) {
    return { mode: 'blocked', text: 'Ապրանքը ունի ակտիվ անժամկետ զեղչ — չի կարելի կցել նոր զեղչ' }
  }

  // resolve selected window
  let s = fromDate.value || ''
  let e = toDate.value   || ''
  if (!s && e) s = today
  if (!s || !e) return { mode: 'none', text: 'Ժամկետային սահմանափակում չկա' }

  const main: DateRange = { start: dParse(s)!, end: dParse(e)! }
  const gaps = subtractRanges(main, activeRangesOf(p))
  if (!gaps.length) {
    return { mode: 'blocked', text: 'Նշված միջակայքում «նոր» զեղչի ժամանակահատված չկա' }
  }
  const pretty = gaps.slice(0,2).map(g => `${dISO(g.start)} — ${dISO(g.end)}`).join(', ')
  const more = gaps.length > 2 ? ` +${gaps.length-2}` : ''
  return { mode: 'ok', text: `Ազատ միջակայքեր՝ ${pretty}${more}` }
}

/* Queue / remove selected */
function queueProduct(p:any){
  if (selected.value.some(s => s.product_id === p.id)) return
  const f = freeInfo(p)
  if (f.mode === 'blocked') { alert(f.text); return }
  selected.value.push({
    product_id: p.id,
    name: p.name,
    characteristics: p.characteristics,
    measure_label: labelForMeasure(p),
    until_qty: rowUntil[p.id] ?? null,
  })
}
function removeSelected(pid:number){
  selected.value = selected.value.filter(s => s.product_id !== pid)
}
function clearSelected(){ selected.value = [] }

/* Validation + submit */
const canSubmit = computed(() => {
  formError.value = ''
  errors.discount = undefined
  errors.from_date = undefined
  errors.to_date = undefined

  if (!discountId.value) { errors.discount = 'Ընտրեք զեղչը'; return false }
  if (!selected.value.length) { formError.value = 'Ընտրեք առնվազն մեկ ապրանք'; return false }
  if (fromDate.value && fromDate.value < today) { errors.from_date = 'from_date չի կարող լինել այսօրից ցածր'; return false }
  if (toDate.value && fromDate.value && toDate.value < fromDate.value) { errors.to_date = 'to_date չի կարող լինել from_date-ից ցածր'; return false }
  return true
})
async function submit(){
  if (!canSubmit.value) return
  saving.value = true
  try{
    const items = selected.value.map(s => ({ product_id: s.product_id, until_qty: s.until_qty ?? null, measure: s.measure_label ?? 'piece' }))
    await sales.discounts.settings.store({
      discount_id: Number(discountId.value),
      from_date: fromDate.value || null,
      to_date: toDate.value || null,
      products: items,
    })
    emit('done')
    close()
  } finally { saving.value = false }
}

/* ---------- Product portions slide-over ---------- */
const portionsOpen   = ref(false)
const portionsTitle  = ref<string>('')
const portionsProdId = ref<number|null>(null)
const portions       = ref<any[]>([])
const portionsLoading= ref(false)
const portionsLimit  = 20
let portionsOffset   = 0
const portionsStatus = ref<string>('')

const portionStatuses: PStatus[] = ['pending','active','cancelled','archived','on_hold']

function makePortionsQuery(reset=false){
  const status = portionsStatus.value ? [portionsStatus.value as PStatus] : null
  return { limit: portionsLimit, offset: reset ? 0 : portionsOffset, status }
}
async function loadMorePortions(){
  if (portionsLoading.value || !portionsProdId.value) return
  portionsLoading.value = true
  try {
    const { data } = await sales.products.portions.get(portionsProdId.value, makePortionsQuery())
    const arr = Array.isArray(data?.data) ? data.data : []
    if (portionsOffset === 0) portions.value = arr
    else portions.value.push(...arr)
    if (arr.length === portionsLimit) portionsOffset += portionsLimit
  } finally { portionsLoading.value = false }
}
function openProductPortions(p:any){
  portionsTitle.value  = p.name
  portionsProdId.value = Number(p.id)
  portionsOffset       = 0
  portions.value       = []
  portionsOpen.value   = true
  loadMorePortions()
}
function closePortions(){
  portionsOpen.value   = false
  portionsProdId.value = null
  portions.value       = []
  portionsOffset       = 0
}
const portionsSentinel = ref<HTMLElement|null>(null)
let ioPortions: IntersectionObserver | null = null
onMounted(() => {
  ioPortions = new IntersectionObserver((es)=>{ if (es.some(e=>e.isIntersecting)) loadMorePortions() })
  watch(portionsOpen, (open) => {
    if (open && portionsSentinel.value) ioPortions?.observe(portionsSentinel.value)
    else if (!open && portionsSentinel.value) ioPortions?.unobserve(portionsSentinel.value)
  }, { immediate: true })
})
let ptimer: number|undefined
watch(() => portionsStatus.value, () => {
  if (ptimer) window.clearTimeout(ptimer)
  ptimer = window.setTimeout(() => { portionsOffset = 0; loadMorePortions() }, 250)
})

/* ---------- Active discounts slide-over ---------- */
const activeOpen  = ref(false)
const activeTitle = ref<string>('')
const activeRows  = ref<any[]>([])

function openActiveDiscounts(p:any){
  activeTitle.value = p.name
  activeRows.value = Array.isArray(p.active_and_pending_discounts) ? p.active_and_pending_discounts : []
  activeOpen.value = true
}
function closeActive(){
  activeOpen.value = false
  activeRows.value = []
}
function isPerpetual(to: any): boolean {
  return to === null || to === undefined || to === ''
}

function hasPerpetualActive(p: any): boolean {
  const rows = Array.isArray(p.active_and_pending_discounts)
      ? p.active_and_pending_discounts
      : []

  return rows.some(r => {
    const st = r.discount_setting?.status ?? r.status
    const to = r.discount_setting?.to_date ?? r.to_date
    return st === 'active' && isPerpetual(to)
  })
}
</script>

<style scoped>
.slide-in-right-enter-active,
.slide-in-right-leave-active { transition: transform 0.25s ease, opacity 0.2s ease; }
.slide-in-right-enter-from { transform: translateX(100%); opacity: 0; }
.slide-in-right-enter-to   { transform: translateX(0);     opacity: 1; }
.slide-in-right-leave-from { transform: translateX(0);     opacity: 1; }
.slide-in-right-leave-to   { transform: translateX(100%);  opacity: 0; }
</style>
