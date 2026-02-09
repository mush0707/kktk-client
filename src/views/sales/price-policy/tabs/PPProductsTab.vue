<template>
  <div class="space-y-4">
    <!-- Top actions (OUTSIDE list) -->
    <div class="flex items-center justify-between">
      <button
          class="px-4 py-2 text-sm rounded-xl bg-blue-600 text-white"
          @click="openCreateFromToolbar"
      >
        Նոր չափաբաժին +
      </button>
    </div>

    <!-- Filters -->
    <div class="flex flex-col gap-y-2 bg-white rounded-2xl">
      <p class="font-medium">Ֆիլտր</p>
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
      </div>
    </div>

    <!-- Grouped products -->
    <div class="bg-white rounded-2xl border border-gray-300 divide-y">
      <div class="p-4 font-medium">Ապրանքներ և վերջին չափաբաժիններ</div>

      <div
          v-for="p in products"
          :key="p.id"
          class="p-4 grid gap-3 md:grid-cols-[1fr_auto] items-start"
      >
        <div class="space-y-2">
          <div class="flex items-center justify-between gap-2">
            <div class="font-medium">{{ p.name }}</div>
            <div class="flex gap-2">
              <button
                  class="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-md"
                  @click="addPortionForProduct(p)"
              >
                Ավելացնել չափաբաժին
              </button>
              <button
                  class="px-3 py-1 text-xs font-medium text-white bg-slate-700 rounded-md"
                  @click="openItemsAll"
              >
                Տեսնել չափաբաժինները
              </button>
              <button
                  class="px-3 py-1 text-xs font-medium text-indigo-700 rounded-md border border-indigo-200 hover:bg-indigo-50"
                  @click="openActiveDiscounts(p)"
              >
                Տեսնել ակտիվ զեղչերը
              </button>
            </div>
          </div>

          <div
              v-if="Array.isArray(p.characteristics) && p.characteristics.length"
              class="hidden sm:flex flex-wrap gap-1"
          >
            <span
                v-for="(c, i) in p.characteristics.slice(0, 3)"
                :key="i"
                class="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600"
            >
              {{ c.name }}
            </span>
          </div>

          <div class="grid md:grid-cols-2 gap-2">
            <div
                v-for="prt in (p.portions || []).slice(0, 2)"
                :key="prt.id"
                class="rounded-lg border p-2"
            >
              <div class="mt-1 text-slate-600 space-y-1">
                <div class="flex">
                  <p class="p-1 rounded-md" :class="statusMeta(prt.status).classes">
                    {{ $t(prt.status) }}
                  </p>
                </div>

                <div>
                  {{ prt.until_qty ? ('մինչև ' + prt.until_qty) : '—' }} •
                  {{ prt.measure ? $t(prt.measure) : 'piece' }}
                </div>

                <div class="flex gap-2">
                  <p class="line-through" v-if="prt.last_discount?.status === 'active'">
                    {{ $money(prt.price) }}
                  </p>
                  <p v-else>{{ $money(prt.price) }}</p>
                  <p
                      class="text-emerald-700"
                      v-if="prt.last_discount?.status === 'active'"
                  >
                    {{
                      $money(prt.price - (prt.price * prt.last_discount.discount.percentage / 100))
                    }}
                  </p>
                </div>

                <div v-if="prt.qty_sold_out != null" class="flex items-center gap-1">
                  <span class="text-slate-500">Վաճառք՝</span>
                  <span
                      class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200"
                  >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-3.5 w-3.5"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                    >
                      <path
                          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 8h14l2-8M10 21a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm8 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"
                      />
                    </svg>
                    {{ prt.qty_sold_out }} {{ prt.measure ? $t(prt.measure) : 'piece' }}
                  </span>
                </div>

                <div class="flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
                  <div>
                    <span class="text-slate-500">Թարմացվել է:</span>
                    <span :title="prt.updated_at">{{ formatDateTime(prt.updated_at) }}</span>
                    <span class="text-xs text-gray-400 ml-2">({{ fromNow(prt.updated_at) }})</span>
                  </div>
                  <div>
                    <span class="text-slate-500">Ստեղծվել է:</span>
                    <span :title="prt.created_at">{{ formatDateTime(prt.created_at) }}</span>
                    <span class="text-xs text-gray-400 ml-2">({{ fromNow(prt.created_at) }})</span>
                  </div>
                </div>
              </div>

              <div class="mt-2 flex flex-wrap gap-2">
                <button
                    v-if="isLeader && prt.status==='pending'"
                    @click="activateItem(prt)"
                    class="px-3 py-1 text-xs font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700"
                >
                  Ակտիվացնել
                </button>

                <button
                    v-if="(isLeader || isStaff) && prt.status==='pending'"
                    @click="cancelItem(prt)"
                    class="px-3 py-1 text-xs font-medium text-white bg-rose-600 rounded-md hover:bg-rose-700"
                >
                  Չեղարկել
                </button>

                <button
                    v-if="prt.status==='pending'"
                    @click="editItem(prt)"
                    class="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Խմբագրել
                </button>

                <button
                    v-if="isLeader && prt.status==='active'"
                    @click="onHoldItem(prt)"
                    class="px-3 py-1 text-xs font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700"
                >
                  Կասեցնել
                </button>

                <button
                    v-if="isLeader && prt.status==='active'"
                    @click="archiveItem(prt)"
                    class="px-3 py-1 text-xs font-medium text-white bg-slate-700 rounded-md hover:bg-slate-800"
                >
                  Արխիվացնել
                </button>

                <button
                    v-if="isLeader && prt.status==='on_hold'"
                    @click="activateItem(prt)"
                    class="px-3 py-1 text-xs font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700"
                >
                  Ակտիվացնել
                </button>
              </div>
            </div>
          </div>
        </div>

        <div></div>
      </div>

      <div ref="sentinel" class="h-8"></div>
      <div v-if="loading" class="p-4 text-center text-slate-500">Բեռնվում է…</div>
      <div v-if="!loading && !products.length" class="p-6 text-center text-slate-400">Տվյալներ չկան</div>
    </div>

    <!-- Shared Create/Edit Modal -->
    <PortionFormModal
        v-model:open="modalOpen"
        :item="editingItem"
        :product-context-id="productContextId"
        :default-measure="productContextMeasure"
        @saved="onSaved"
    />

    <!-- Right slide-over: ALL items -->
    <transition name="slide-in-right">
      <div v-if="itemsOpen" class="fixed inset-0 z-50">
        <div class="absolute inset-0 bg-black/30" @click="closeItems"></div>

        <aside class="absolute right-0 top-0 h-screen w-full max-w-xl bg-white shadow-2xl flex flex-col">
          <div class="flex items-center justify-between px-5 py-3 border-b shrink-0">
            <h3 class="text-lg font-semibold">Չափաբաժիններ — բոլորը</h3>
            <button class="px-3 py-1 rounded-xl border border-gray-300" @click="closeItems">✕</button>
          </div>

          <div class="px-5 py-3 border-b shrink-0">
            <div class="grid md:grid-cols-5 gap-3 text-sm">
              <input
                  v-model="itemsFilters.search"
                  placeholder="Փնտրել"
                  class="border border-gray-300 rounded-xl px-3 py-2 md:col-span-2"
              />
              <select v-model="itemsStatusPick" class="border border-gray-300 rounded-xl px-3 py-2">
                <option :value="''">Բոլորը</option>
                <option v-for="s in statuses" :key="s" :value="s">{{ statusMeta(s).label }}</option>
              </select>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto">
            <div class="divide-y divide-gray-100">
              <div v-for="it in items" :key="it.id" class="p-4 space-y-2">
                <div class="mt-1 text-slate-600 space-y-1">
                  <div class="flex">
                    <p class="p-1 rounded-md" :class="statusMeta(it.status).classes">
                      {{ $t(it.status) }}
                    </p>
                  </div>

                  <div>
                    {{ it.until_qty ? ('մինչև ' + it.until_qty) : '—' }} •
                    {{ it.measure ? $t(it.measure) : 'piece' }}
                  </div>

                  <div v-if="it.qty_sold_out != null" class="flex items-center gap-1">
                    <span class="text-slate-500">Վաճառք՝</span>
                    <span
                        class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200"
                    >
                      <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="h-3.5 w-3.5"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                      >
                        <path
                            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 8h14l2-8M10 21a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm8 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"
                        />
                      </svg>
                      {{ it.qty_sold_out }}
                    </span>
                  </div>

                  <div class="flex flex-wrap gap-x-4 gap-y-1">
                    <div>
                      <span class="text-slate-500">Թարմացվել է:</span>
                      <span :title="it.updated_at">{{ formatDateTime(it.updated_at) }}</span>
                      <span class="text-xs text-gray-400 ml-2">({{ fromNow(it.updated_at) }})</span>
                    </div>
                    <div>
                      <span class="text-slate-500">Ստեղծվել է:</span>
                      <span :title="it.created_at">{{ formatDateTime(it.created_at) }}</span>
                      <span class="text-xs text-gray-400 ml-2">({{ fromNow(it.created_at) }})</span>
                    </div>
                  </div>
                </div>

                <div class="flex flex-wrap gap-2 justify-end">
                  <button
                      v-if="isLeader && it.status==='pending'"
                      @click="activateItem(it, true)"
                      class="px-3 py-1 text-xs font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700"
                  >
                    Ակտիվացնել
                  </button>

                  <button
                      v-if="(isLeader || isStaff) && it.status==='pending'"
                      @click="cancelItem(it, true)"
                      class="px-3 py-1 text-xs font-medium text-white bg-rose-600 rounded-md hover:bg-rose-700"
                  >
                    Չեղարկել
                  </button>

                  <button
                      v-if="it.status==='pending'"
                      @click="editItem(it)"
                      class="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Խմբագրել
                  </button>

                  <button
                      v-if="isLeader && it.status==='active'"
                      @click="onHoldItem(it, true)"
                      class="px-3 py-1 text-xs font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700"
                  >
                    Կասեցնել
                  </button>

                  <button
                      v-if="isLeader && it.status==='active'"
                      @click="archiveItem(it, true)"
                      class="px-3 py-1 text-xs font-medium text-white bg-slate-700 rounded-md hover:bg-slate-800"
                  >
                    Արխիվացնել
                  </button>

                  <button
                      v-if="isLeader && it.status==='on_hold'"
                      @click="activateItem(it, true)"
                      class="px-3 py-1 text-xs font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700"
                  >
                    Ակտիվացնել
                  </button>
                </div>
              </div>

              <div ref="itemsSentinel" class="h-8"></div>
              <div v-if="itemsLoading" class="p-4 text-center text-slate-500">Բեռնվում է…</div>
              <div v-if="!itemsLoading && !items.length" class="p-6 text-center text-slate-400">
                Չկան չափաբաժիններ
              </div>
            </div>
          </div>
        </aside>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { sales, authApi } from '@/api'
import PortionFormModal from '@/views/sales/modals/PortionFormModal.vue'
import { formatDateTime, fromNow } from '@/utils/dateFormat'

type Status = 'pending' | 'active' | 'cancelled' | 'archived' | 'on_hold'
type Portion = {
  id: number
  product_id?: number
  status: Status
  price: number
  until_qty?: number | null
  measure?: string | null
  qty_sold_out?: number | null
  created_at?: string
  updated_at?: string
  last_discount?: any
}
type ProductRow = {
  id: number
  name: string
  portions: Portion[]
  measure_type?: 'weight' | 'length' | 'capacity' | string | null
  measure?: string | null
  characteristics?: Array<{ name: string }>
}

function measureFromRow(p: ProductRow): string {
  if (p.measure && p.measure.trim() !== '') return p.measure
  switch (p.measure_type) {
    case 'weight':   return 'kg'
    case 'length':   return 'm'
    case 'capacity': return 'l'
    default:         return 'piece'
  }
}

const productContextMeasure = ref<string>('piece')
const productContextId = ref<number | null>(null)

function addPortionForProduct(p: ProductRow) {
  // fresh create for a specific product (locks the product in the modal)
  editingItem.value = null
  productContextId.value = p.id
  productContextMeasure.value = measureFromRow(p)
  modalOpen.value = true
}

const filters = reactive({ search: '' })
const statuses: Status[] = ['pending', 'active', 'cancelled', 'archived', 'on_hold']
const statusPick = ref<string>('')

const limit = 20
let offset = 0
const products = ref<ProductRow[]>([])
const loading = ref(false)

/* Role */
type ActorKind = 'department_leader' | 'department_staff'
const actorKind = ref<ActorKind | null>(null)
const isLeader = computed(() => actorKind.value === 'department_leader')
const isStaff = computed(() => actorKind.value === 'department_staff')
async function loadActor() {
  try {
    const data = await authApi.getActor?.()
    actorKind.value = data?.kind || null
  } catch { actorKind.value = null }
}

/* Active discounts slide-over */
const activeOpen = ref(false)
const activeTitle = ref<string>('')
const activeRows = ref<any[]>([])
function openActiveDiscounts(p: any) {
  activeTitle.value = p.name
  activeRows.value = Array.isArray(p.active_and_pending_discounts) ? p.active_and_pending_discounts : []
  activeOpen.value = true
}
function closeActive() { activeOpen.value = false; activeRows.value = [] }

/* Status badge meta */
function statusMeta(s: Status) {
  switch (s) {
    case 'active':    return { label: 'Ակտիվ',       classes: 'bg-green-100 text-green-700 ring-1 ring-green-200' }
    case 'pending':   return { label: 'Սպասման մեջ', classes: 'bg-amber-100 text-amber-800 ring-1 ring-amber-200' }
    case 'on_hold':   return { label: 'Կասեցված',    classes: 'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-200' }
    case 'archived':  return { label: 'Արխիվացված',  classes: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200' }
    case 'cancelled': return { label: 'Չեղարկված',   classes: 'bg-rose-100 text-rose-700 ring-1 ring-rose-200' }
    default:          return { label: s,             classes: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200' }
  }
}

/* Data */
function makeQuery(reset = false) {
  const status = statusPick.value ? [statusPick.value as Status] : null
  return { limit, offset: reset ? 0 : offset, search: filters.search || null, status }
}
async function loadMore() {
  if (loading.value) return
  loading.value = true
  try {
    const { data } = await sales.products.portions.productList(makeQuery())
    const arr: ProductRow[] = Array.isArray(data?.data) ? data.data : []
    if (offset === 0) products.value = arr
    else products.value.push(...arr)
    if (arr.length === limit) offset += limit
  } finally { loading.value = false }
}
function reload() { offset = 0; loadMore() }

/* Infinite scroll */
const sentinel = ref<HTMLElement | null>(null)
let io: IntersectionObserver | null = null
onMounted(() => {
  loadActor()
  reload()
  io = new IntersectionObserver((es) => { if (es.some(e => e.isIntersecting)) loadMore() })
  if (sentinel.value) io.observe(sentinel.value)
})

let ft: number | undefined
watch(() => [filters.search, statusPick.value], () => {
  if (ft) window.clearTimeout(ft)
  ft = window.setTimeout(() => reload(), 300)
})

/* Ops */
async function activateItem(prt: Portion, fromItemsModal = false) {
  await sales.products.portions.activate(prt.id)
  fromItemsModal ? reloadItems() : reload()
}
async function cancelItem(prt: Portion, fromItemsModal = false) {
  await sales.products.portions.cancel(prt.id)
  fromItemsModal ? reloadItems() : reload()
}
async function archiveItem(prt: Portion, fromItemsModal = false) {
  await sales.products.portions.archive(prt.id)
  fromItemsModal ? reloadItems() : reload()
}
async function onHoldItem(prt: Portion, fromItemsModal = false) {
  await sales.products.portions.onHold(prt.id)
  fromItemsModal ? reloadItems() : reload()
}

/* Modal wiring */
const modalOpen = ref(false)
const editingItem = ref<Portion | null>(null)
function editItem(prt: Portion) {
  editingItem.value = prt
  productContextId.value = null
  productContextMeasure.value = 'piece'
  modalOpen.value = true
}
function openCreateFromToolbar() {
  // fully fresh create — no locked product, clear measure to 'piece'
  editingItem.value = null
  productContextId.value = null
  productContextMeasure.value = 'piece'
  modalOpen.value = true
}
function onSaved() { reload(); if (itemsOpen.value) reloadItems() }

/* Right slide-over list */
const itemsOpen = ref(false)
const items = ref<Portion[]>([])
const itemsLoading = ref(false)
const itemsLimit = 20
let itemsOffset = 0
const itemsFilters = reactive({ search: '' })
const itemsStatusPick = ref<string>('')

function makeItemsQuery(reset = false) {
  const status = itemsStatusPick.value ? [itemsStatusPick.value as Status] : null
  return { limit: itemsLimit, offset: reset ? 0 : itemsOffset, search: itemsFilters.search || null, status }
}
async function loadMoreItems() {
  if (itemsLoading.value) return
  itemsLoading.value = true
  try {
    const { data } = await sales.products.portions.list(makeItemsQuery())
    const arr: Portion[] = Array.isArray(data?.data) ? data.data : []
    if (itemsOffset === 0) items.value = arr
    else items.value.push(...arr)
    if (arr.length === itemsLimit) itemsOffset += itemsLimit
  } finally { itemsLoading.value = false }
}
function reloadItems() { itemsOffset = 0; loadMoreItems() }
function openItemsAll() { itemsOpen.value = true; itemsOffset = 0; items.value = []; loadMoreItems() }
function closeItems() { itemsOpen.value = false; items.value = []; itemsOffset = 0 }

const itemsSentinel = ref<HTMLElement | null>(null)
let ioItems: IntersectionObserver | null = null
onMounted(() => {
  ioItems = new IntersectionObserver((es) => { if (es.some(e => e.isIntersecting)) loadMoreItems() })
  watch(itemsOpen, (open) => {
    if (open && itemsSentinel.value) ioItems?.observe(itemsSentinel.value)
    else if (!open && itemsSentinel.value) ioItems?.unobserve(itemsSentinel.value)
  }, { immediate: true })
})

let itft: number | undefined
watch(() => [itemsFilters.search, itemsStatusPick.value], () => {
  if (itft) window.clearTimeout(itft)
  itft = window.setTimeout(() => reloadItems(), 300)
})
</script>

<style scoped>
.slide-in-right-enter-active,
.slide-in-right-leave-active { transition: transform 0.25s ease, opacity 0.2s ease; }
.slide-in-right-enter-from { transform: translateX(100%); opacity: 0; }
.slide-in-right-enter-to   { transform: translateX(0);     opacity: 1; }
.slide-in-right-leave-from { transform: translateX(0);     opacity: 1; }
.slide-in-right-leave-to   { transform: translateX(100%);  opacity: 0; }
</style>
