<!-- src/views/demand/DemandToStoragePage.vue -->
<template>
  <div class="flex flex-col gap-y-4">
    <div class="flex px-4 pt-4" v-if="cartCount > 0">
      <button
          class="inline-flex items-center gap-2 px-3 py-2 rounded-xl border bg-indigo-900 text-white"
          @click="openCart = true"
      >
        Նոր պահանջագրի ցանկ
        <span class="text-xs px-2 py-0.5 rounded bg-white/10 border border-white/20">
            {{ cartCount }}
          </span>
      </button>
    </div>
    <!-- Storage select -->
    <div class="px-4">
      <div class="grid md:grid-cols-3 gap-2 items-end">
        <div class="flex flex-col gap-y-2">
          <label class="text-xs text-gray-500">Պահեստ</label>
          <select
              v-model.number="selectedStorageId"
              class="border border-gray-300 rounded-xl px-3 py-2 w-full"
              @change="onStorageChange"
          >
            <option :value="undefined">— Ընտրել պահեստ —</option>
            <option
                v-for="s in storagesFiltered"
                :key="s.id"
                :value="s.id"
            >
              {{ s.address }} — {{ s.cell ? 'բջջային' : (s.industrial ? 'արտադրական' : 'սովորական') }}
            </option>
          </select>
        </div>

        <!-- Search -->
        <div class="flex flex-col gap-y-2 pt-2">
          <label class="text-xs text-gray-500">Փնտրել ապրանք</label>
          <div class="flex gap-2">
            <input
                v-model="search"
                class="border border-gray-300 rounded-xl px-3 py-2 w-full"
                placeholder="Անուն / SKU"
                @input="onSearchInput"
            />
            <button
                class="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50"
                @click="reloadFromStart"
                :disabled="!selectedStorageId"
            >
              Կիրառել
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Products table -->
    <div class="px-4" v-if="selectedStorageId">
      <div class="bg-white border border-gray-300 rounded-2xl overflow-hidden">
        <table class="min-w-full text-sm">
          <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-4 text-left">Ապրանք</th>
            <th class="px-6 py-4 text-right">Մնացորդ</th>
            <th class="px-6 py-4 text-right">Ավելացված</th>
            <th class="px-6 py-4 w-[1%]"></th>
          </tr>
          </thead>
          <tbody>
          <tr
              v-for="row in items"
              :key="row.product_id"
              class="bg-white border-b border-gray-200"
          >
            <td class="px-6 py-4">
              <div class="font-medium">
                {{ row.product_name }}
                <span v-if="row.product_sku" class="text-gray-400"> ({{ row.product_sku }})</span>
              </div>
              <div v-if="row.product?.characteristics?.length" class="mt-1 flex flex-wrap gap-1">
                  <span
                      v-for="c in row.product.characteristics"
                      :key="c.id || c.name"
                      class="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-700"
                  >
                    {{ c.name }}
                  </span>
              </div>
            </td>

            <td class="px-6 py-4 text-right">
              {{ fmt(row.available_qty) }}
              <span class="text-gray-500">{{ unitShort(row.measure) }}</span>
            </td>

            <td class="px-6 py-4 text-right">
              <div class="mt-1 text-xs text-slate-500" v-if="addedQtyFor(row) > 0">
                <span class="inline-flex items-center gap-1 rounded px-2 py-0.5 bg-slate-100">
                  {{ $t('added','Ավելացված') }}:
                  <b class="tabular-nums">{{ fmt(addedQtyFor(row)) }}</b>
                  <span v-if="row.measure" class="text-slate-400">{{ unitShort(row.measure) }}</span>
                </span>
              </div>
            </td>

            <td class="px-6 py-4 text-right">
              <button
                  class="flex items-center gap-x-2 px-3 py-1 text-xs font-medium text-white bg-green-600 rounded-md shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  @click="openAdd(row)"
              >
                Ավելացնել
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
              </button>
            </td>
          </tr>

          <tr v-if="!loading && items.length===0">
            <td colspan="4" class="px-4 py-8 text-center text-gray-500">Տվյալներ չկան</td>
          </tr>
          </tbody>
        </table>

        <div class="p-3 text-center text-sm" v-if="loading">Լցվում է…</div>
      </div>

      <!-- Infinite scroll sentinel -->
      <div ref="sentinel" class="h-12 flex items-center justify-center">
        <span v-if="loading && items.length>0" class="text-sm text-gray-500">Լցվում է…</span>
        <span v-else-if="endReached && items.length>0" class="text-xs text-gray-400">Վերջ</span>
      </div>
    </div>

    <!-- Add modal -->
    <div v-if="modal.open" class="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div class="bg-white rounded-2xl p-4 w-full max-w-lg">
        <div class="flex items-center justify-between mb-3">
          <div class="font-medium">Ավելացնել պահանջագիր</div>
          <button class="p-1" @click="modal.open=false">✕</button>
        </div>

        <div class="space-y-3">
          <div class="text-sm">
            <div class="font-medium">
              {{ modal.row?.product_name }}
              <span v-if="modal.row?.product_sku" class="text-gray-400"> ({{ modal.row.product_sku }})</span>
            </div>
            <div v-if="modal.row?.product?.characteristics?.length" class="mt-1 flex flex-wrap gap-1">
              <span
                  v-for="c in modal.row.product.characteristics"
                  :key="c.id || c.name"
                  class="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-700"
              >
                {{ c.name }}
              </span>
            </div>
            <div class="text-xs text-gray-500 mt-2">
              Հասանելի՝ <b>{{ fmt(modal.row?.available_qty) }}</b> {{ unitShort(modal.row?.measure) }}
            </div>
            <div v-if="addedQty(modal.row?.storage_product_id) > 0" class="text-xs text-blue-700 mt-1">
              Արդեն ավելացված՝ <b>{{ fmt(addedQty(modal.row?.storage_product_id)) }}</b> {{ unitShort(modal.row?.measure) }}
            </div>
          </div>

          <div>
            <label class="text-xs text-gray-500">Քանակ</label>
            <input
                v-model.number="modal.qty"
                type="number"
                min="0"
                step="0.001"
                class="border rounded-xl px-3 py-2 w-full"
            />
          </div>

          <div class="flex justify-end gap-2">
            <button class="px-4 py-2 border rounded-xl" @click="modal.open=false">Չեղարկել</button>
            <button
                class="px-4 py-2 border rounded-xl bg-gray-900 text-white"
                :disabled="!canAdd"
                @click="confirmAdd"
            >
              Ավելացնել
            </button>
          </div>

          <p v-if="modal.error" class="text-sm text-red-600">{{ modal.error }}</p>
        </div>
      </div>
    </div>

    <!-- Cart modal -->
    <div v-if="openCart" class="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div class="bg-white rounded-2xl p-4 w-full max-w-2xl">
        <div class="flex items-center justify-between mb-3">
          <div class="font-medium">Նոր պահանջագրի ցանկ</div>
          <button class="p-1" @click="openCart=false">✕</button>
        </div>

        <div class="space-y-3">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-50">
            <tr>
              <th class="px-3 py-2 text-left">Ապրանք</th>
              <th class="px-3 py-2 text-right">Քանակ</th>
              <th class="px-3 py-2 text-right">Չափ</th>
              <th class="px-3 py-2 w-[1%]"></th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="it in cartList" :key="it.storage_product_id" class="border-t">
              <td class="px-3 py-2">
                <div class="font-medium">{{ it.product_name }}</div>
                <div v-if="it.product?.characteristics?.length" class="mt-1 flex flex-wrap gap-1">
                    <span
                        v-for="c in it.product.characteristics"
                        :key="c.id || c.name"
                        class="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-700"
                    >
                      {{ c.name }}
                    </span>
                </div>
              </td>
              <td class="px-3 py-2 text-right tabular-nums">{{ fmt(it.qty) }}</td>
              <td class="px-3 py-2 text-right">{{ unitShort(it.measure) }}</td>
              <td class="px-3 py-2 text-right">
                <button class="px-2 py-1 rounded border hover:bg-gray-50" @click="removeFromCart(it.storage_product_id)">
                  Հեռացնել
                </button>
              </td>
            </tr>

            <tr v-if="cartList.length===0">
              <td colspan="4" class="px-3 py-6 text-center text-gray-500">Ցանկը դատարկ է</td>
            </tr>
            </tbody>
          </table>

          <!-- Actions by actor kind are BE-driven later; for now just render placeholders -->
          <div class="flex justify-end gap-2 pt-2 border-t">
            <button class="px-4 py-2 border rounded-xl" @click="openCart=false">Փակել</button>
            <!-- draft -->
            <button
                class="px-4 py-2 border rounded-xl bg-gray-900 text-white"
                :disabled="submitting || cartList.length===0"
                @click="sendDemand('draft')"
            >
              <span v-if="submitting && submitAction==='draft'">Պահպ. …</span>
              <span v-else>Պահպանել սևագիր</span>
            </button>

            <!-- primary per-actor button -->
            <button
                class="px-4 py-2 border rounded-xl bg-blue-600 text-white"
                :disabled="submitting || cartList.length===0 || !primaryAction"
                @click="sendDemand(primaryAction)"
            >
              <span v-if="submitting && submitAction===primaryAction">{{ primaryLabel }} …</span>
              <span v-else>{{ primaryLabel }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { mainApi, wmsApi, authApi, demandApi } from '@/api.js' // authApi → session actor
import { useRoute } from 'vue-router'

// ─── State
const route = useRoute()
const actor = ref<any>(null)
const storages = ref<any[]>([])
const selectedStorageId = ref<number|undefined>(undefined)
const submitting = ref(false)
const submitAction = ref<string|null>(null)
// list + pagination
const items = ref<any[]>([])
const loading = ref(false)
const endReached = ref(false)
const limit = ref(50)
const offset = ref(0)
const search = ref('')
const primaryLabel = computed(() => {
  switch (primaryAction.value) {
    case 'submit_for_approval':  return 'Ուղարկել հաստատման'
    case 'submit_to_warehouse':  return 'Ուղարկել պահեստ'
    default:                     return ''
  }
})
// infinite scroll
const sentinel = ref<HTMLElement|null>(null)
let observer: IntersectionObserver|null = null

// debounce
let searchTimer: any = null
const onSearchInput = () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => reloadFromStart(), 300)
}

// cart
type CartRow = { product_id:number; product_name:string; measure:string|null|undefined; qty:number; product?:any }
const cart = reactive<Record<number, CartRow>>({})
const cartCount = computed(() => Object.keys(cart).length)
const cartList = computed(() => Object.values(cart))

// UI modals
const modal = reactive({
  open:false,
  row:null as any,
  qty: 0,
  error:''
})
const openCart = ref(false)
const primaryAction = computed<null | 'submit_for_approval' | 'submit_to_warehouse'>(() => {
  const kind = actor.value?.kind
  if (!kind) return null

  if (kind === 'superadmin') return 'submit_to_warehouse'
  if (kind === 'storekeeper') return 'submit_to_warehouse'
  if (kind === 'department_leader') return 'submit_to_warehouse'

  if (kind === 'storage_department_leader') return 'submit_for_approval'

  // staff stay the same
  if (kind === 'storage_department_staff' || kind === 'department_staff') {
    return 'submit_for_approval'
  }
  return null
})
// 🔁 CHANGED: storage_department_leader can only draft / submit_for_approval

// ─── Helpers
function fmt(n:any) { return Number(n||0).toLocaleString(undefined,{ maximumFractionDigits: 6 }) }
function unitShort(m:any) {
  const key = String(m||'').toLowerCase()
  return ({kg:'կգ', g:'գ', tonn:'տ', t:'տ', l:'լ', ml:'մլ', m3:'մ³', m:'մ', cm:'սմ', mm:'մմ', piece:'հատ', pcs:'հատ'})[key] || ''
}
function addedQty(product_id:number) {
  return cart[product_id]?.qty || 0
}

async function sendDemand(action: 'draft'|'submit_for_approval'|'submit_to_warehouse') {
  if (!selectedStorageId.value) return
  if (cartList.value.length === 0) return

  submitting.value = true
  submitAction.value = action
  try {
    const payload = {
      storage_id: selectedStorageId.value,
      action,
      items: cartList.value.map(it => ({
        storage_product_id: it.storage_product_id,
        qty: it.qty,
        measure: it.measure ?? null,
      })),
    }
    await demandApi.create(selectedStorageId.value, payload)

    // success → մաքրում ենք զամբյուղը, փակենք մոդալը,
    // ցանկալի է նաև մի փոքր toaster/alert
    Object.keys(cart).forEach(k => delete cart[Number(k)])
    openCart.value = false
    // optional: alert('Ուղարկվեց հաջողությամբ')
  } catch (e:any) {
    // optional: alert(e?.response?.data?.message || e.message || 'Սխալ ուղարկման ժամանակ')
  } finally {
    submitting.value = false
    submitAction.value = null
  }
}
// row-ի already-added քանակը վերցնենք զամբյուղից
function addedQtyFor(row: any) {
  return cart[row.storage_product_id]?.qty || 0
}


// ─── Actor-aware storage filtering (BE should drive)
const storagesFiltered = computed(() => {
  // Եթե backend-ը երբևէ վերադարձնում է {exclude_storage_ids:[...]} կամ {own_storage_ids:[...]} — օգտագործիր այստեղ:
  const excl: number[] = actor.value?.exclude_storage_ids ?? []
  return storages.value.filter(s => !excl.includes(s.id))
})

// ─── Data loading
async function loadActor() {
  // session/actor → { user:{id,...}, roles:[...], exclude_storage_ids?:number[] }
  try { actor.value = await authApi.getActor() } catch { actor.value = null }
}

async function loadStorages() {
  // ցուցադրում ենք բոլոր պահեստները (հետագայում actor-ի հիման վրա backend-ը կարող է վերադարձնել already-filtered)
  try { storages.value = await wmsApi.getStorages({cell: 0}) } catch { storages.value = [] }
}

async function fetchPage() {
  if (!selectedStorageId.value) return
  if (loading.value || endReached.value) return

  loading.value = true
  try {
    const page = await mainApi.getDemandProducts(selectedStorageId.value, {
      limit: limit.value,
      offset: offset.value,
      search: (search.value||'').trim() || undefined,
    })
    const list = Array.isArray(page) ? page : (page?.data ?? page?.rows ?? [])
    items.value.push(...list)
    offset.value += list.length
    if (list.length < limit.value) endReached.value = true
  } finally {
    loading.value = false
  }
}

async function reloadFromStart() {
  endReached.value = false
  items.value = []
  offset.value = 0
  await fetchPage()
}

function startObserver() {
  if (!sentinel.value) return
  observer = new IntersectionObserver((entries) => {
    const [entry] = entries
    if (entry.isIntersecting) fetchPage()
  })
  observer.observe(sentinel.value)
}

function stopObserver() {
  if (observer && sentinel.value) observer.unobserve(sentinel.value)
  observer = null
}

function onStorageChange() {
  // reset list when storage changes
  reloadFromStart()
}

// ─── Add to cart
const canAdd = computed(() =>
    modal.open &&
    modal.row &&
    Number(modal.qty) > 0
)

function openAdd(row:any) {
  modal.row = row
  modal.qty = 0
  modal.error = ''
  modal.open = true
}

function confirmAdd() {
  const r = modal.row
  const qty = Number(modal.qty || 0)
  if (!r || qty <= 0) return

  const id = Number(r.storage_product_id)
  const prev = cart[id]?.qty || 0
  cart[id] = {
    storage_product_id: id,
    product_name: r.product_name,
    measure: r.measure,
    qty: prev + qty,
    product: r.product
  }
  modal.open = false
}

// remove from cart
function removeFromCart(product_id:number) {
  delete cart[product_id]
}

// ─── Lifecycle
onMounted(async () => {
  await loadActor()
  await loadStorages()
  startObserver()
})

onBeforeUnmount(() => stopObserver())

// if route storage param used in future
watch(() => route.fullPath, () => {
  // placeholder for deep-link navigation
})
</script>
