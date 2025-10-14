<template>
  <div class="flex flex-col gap-y-2">
    <!-- Վերնամաս՝ պահեստի ինֆո + breadcrumb -->
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
                :to="'/storages/'+storage?.id"
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
              <span class="underline-offset-2 hover:underline">Ապրանքացանկ</span>
            </p>
          </li>
        </ol>
      </nav>
    </div>

    <!-- Sticky basket summary -->
    <div v-if="basket.items.length" class="sticky bottom-4 z-30 px-4 pt-2">
      <div class="rounded-2xl border border-violet-200/70 bg-gradient-to-r from-violet-50 to-fuchsia-50 shadow-sm">
        <div class="flex flex-col md:flex-row items-start md:items-center gap-3 p-4">
          <!-- Left -->
          <div class="flex flex-wrap items-center gap-3 text-sm">
            <span class="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 border border-violet-200 shadow-xs">
              <svg class="h-4 w-4 text-violet-600" viewBox="0 0 24 24" fill="none">
                <path d="M3 3h2l2.4 12.1a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L21 7H6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="9" cy="20" r="1.5" fill="currentColor"/>
                <circle cx="18" cy="20" r="1.5" fill="currentColor"/>
              </svg>
              <span class="font-medium">Ընտրված է</span>
              <span class="font-semibold">{{ basket.items.length }}</span>
              <span class="text-slate-500">Ապրանք</span>
            </span>
          </div>

          <!-- Right -->
          <div class="md:ml-auto flex items-stretch gap-2 w-full md:w-auto">
            <button
                type="button"
                class="inline-flex justify-center items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50 w-full md:w-auto"
                @click="basketReview.open = true"
            >
              <svg class="h-4 w-4 text-slate-600" viewBox="0 0 24 24" fill="none">
                <path d="M15 12H7m8 4H7m8-8H7m12 12H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9l5 5v10a2 2 0 0 1-2 2Z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Դիտել զամբյուղը
            </button>

            <button
                type="button"
                class="inline-flex justify-center items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow hover:from-violet-700 hover:to-fuchsia-700 disabled:opacity-50 w-full md:w-auto"
                :disabled="basket.sending || !basket.items.length"
                @click="sendBasket"
            >
              <svg v-if="basket.sending" class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" d="M4 12a8 8 0 018-8" stroke="currentColor" stroke-width="4"/>
              </svg>
              <svg v-else class="h-4 w-4" viewBox="0 0 24 24" fill="none">
                <path d="M4 7h16M7 12h10M9 17h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Ուղարկել արտադրամաս
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Փնտրում + Ֆիլտր -->
    <div class="p-4">
      <div class="flex items-center gap-3 flex-wrap">
        <input
            v-model="q"
            placeholder="Փնտրել ապրանք"
            class="border border-gray-300 rounded-xl px-3 py-2"
        />
        <select
            v-model="filter.status"
            class="border border-gray-300 rounded-xl px-3 py-2"
            @change="reloadFromStart"
        >
          <option value="">Բոլորը</option>
          <option value="active">Ակտիվ</option>
          <option value="for_produce">Արտադրության համար</option>
          <option value="pending">Սպասման մեջ</option>
          <option value="send_to_production">Ուղարկված է արտադրություն</option>
          <option value="cancelled">Չեղարկված</option>
        </select>
        <span v-if="loading && items.length === 0" class="text-sm text-gray-500">Բեռնվում է…</span>
      </div>
    </div>

    <!-- Ցանկ -->
    <div class="px-4">
      <div class="bg-white border border-gray-300 overflow-hidden rounded-xl">
        <table class="min-w-full text-sm">
          <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-4 text-left">Կարգավիճակ</th>
            <th class="px-6 py-4 text-left">Ապրանք</th>
            <th class="px-6 py-4 text-right">Քանակ</th>
            <th class="px-6 py-4 text-right">Տեղավորված</th>
            <th class="px-6 py-4 text-right">Ռեզերվ</th>
            <th class="px-6 py-4 text-right">Արտադրամասում</th>
            <th class="px-6 py-4">Գործողություններ</th>
          </tr>
          </thead>
          <tbody>
          <tr
              v-for="sp in items"
              :key="sp.id"
              class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200"
          >
            <td class="px-6 py-4">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs" :class="badgeClass(sp.status)">
                  {{ $t(sp.status) || sp.status }}
                </span>
            </td>

            <td class="px-6 py-4">
              <div class="flex flex-col">
                <div class="flex flex-wrap items-center gap-1">
                  <span class="font-medium">{{ sp.product?.name || sp.product_id }}</span>
                  <span v-if="sp.product?.type?.name" class="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {{ sp.product.type.name }}
                    </span>
                </div>
                <div v-if="(sp.product?.characteristics || []).length" class="mt-1 flex flex-wrap gap-1">
                    <span
                        v-for="c in sp.product.characteristics"
                        :key="c.id"
                        class="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-700"
                    >
                      {{ c.name }}
                    </span>
                </div>
              </div>
            </td>

            <td class="px-6 py-4 text-right">
              {{ formatQty(sp.qty_available) }} {{ $t(sp.measure ?? 'piece') }}
            </td>
            <td class="px-6 py-4 text-right">
              {{ formatQty(sp.qty_reserved_place) }} {{ $t(sp.measure ?? 'piece') }}
            </td>
            <td class="px-6 py-4 text-right">
              {{ formatQty(sp.qty_reserved_dispatch) }} {{ $t(sp.measure ?? 'piece') }}
            </td>
            <td class="px-6 py-4 text-right">
              {{ formatQty(sp.qty_reserved_production) }} {{ $t(sp.measure ?? 'piece') }}
            </td>

            <td class="px-6 py-4">
              <div class="flex flex-wrap justify-center gap-2">
                <button
                    class="px-3 py-1 text-xs font-medium text-white bg-slate-700 rounded-md shadow hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500"
                    @click="openReserves(sp)"
                >
                  Ռեզերվներ
                </button>

                <button
                    v-if="sp.status === 'active'"
                    class="px-3 py-1 text-xs font-medium text-white bg-amber-600 rounded-md shadow hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    @click="openPlace(sp)"
                >
                  Տեղավորել → բջիջ
                </button>

                <button
                    v-if="sp.status === 'for_produce'"
                    class="px-3 py-1 text-xs font-medium text-white bg-indigo-600 rounded-md shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    :disabled="consumingId === sp.id"
                    @click="quickConsume(sp)"
                >
                  {{ consumingId === sp.id ? 'Կատարվում է…' : 'Սպառել → արտադրություն' }}
                </button>
                <!-- New: add to basket for production -->
                <button v-if="storage?.industrial"
                    class="px-3 py-1 text-xs font-medium text-white bg-purple-600 rounded-md shadow hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    @click="openSendModal(sp)"
                >
                  Ուղարկել արտադրամաս
                </button>
              </div>
            </td>
          </tr>

          <tr v-if="!loading && items.length === 0">
            <td colspan="7" class="px-4 py-8 text-center text-gray-500">Տվյալներ չկան</td>
          </tr>
          </tbody>
        </table>
      </div>

      <!-- sentinel -->
      <div ref="sentinel" class="h-12 flex items-center justify-center">
        <span v-if="loading && items.length > 0" class="text-sm text-gray-500">Լցվում է…</span>
        <span v-else-if="endReached && items.length > 0" class="text-xs text-gray-400">Վերջ</span>
      </div>
    </div>

    <!-- Մոդալներ -->
    <AllocateToCellModal
        v-if="showPlace"
        :storage-product="selected"
        @close="showPlace = false"
        @created="reloadFromStart"
    />
    <AllocateToDispatchModal
        v-if="showDispatch"
        :storage-product="selected"
        @close="showDispatch = false"
        @created="reloadFromStart"
    />
  </div>

  <!-- Reserve list -->
  <ReserveListModal
      v-if="showReserves"
      :open="showReserves"
      :storage-product="selected"
      @close="showReserves=false"
      @updated="reloadFromStart"
  />

  <!-- Send to workshop (single product) -->
  <div v-if="sendModal.open" class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/40" @click="closeSendModal"></div>
    <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow">
      <div class="flex items-center justify-between px-5 py-4 border-b">
        <div class="font-semibold">Ուղարկել արտադրամաս</div>
        <button class="p-2 hover:bg-gray-100 rounded-lg" @click="closeSendModal">✕</button>
      </div>
      <div class="p-5 space-y-3 text-sm">
        <div class="font-medium">
          {{ sendModal.product?.product?.name || ('#'+sendModal.product?.product_id) }}
        </div>

        <div class="text-xs text-gray-500">
          Առկա՝ {{ formatQty(sendModal.product?.qty_available || 0) }} {{ $t(sendModal.product?.measure || 'piece') }}
        </div>
        <div class="text-xs text-gray-500">
          Արտադրամասում՝ {{ formatQty(sendModal.product?.qty_reserved_production || 0) }}
        </div>
        <div class="text-xs text-gray-500">
          Զամբյուղում՝ {{ formatQty(inBasketQty(sendModal.product?.id)) }}
        </div>
        <div class="text-xs text-gray-500">
          Մնացորդ (սահման)՝ {{ formatQty(sendAvailable) }}
        </div>

        <div>
          <label class="text-xs text-gray-500">Քանակ</label>
          <input
              v-model.number="sendModal.qty"
              type="number"
              min="0"
              step="0.001"
              class="border rounded-xl px-3 py-2 w-full"
          />
          <p class="text-xs text-gray-400 mt-1">Առավելագույն՝ {{ formatQty(sendAvailable) }}</p>
        </div>

        <div v-if="industrial_storages.length > 1">
          <label class="text-xs text-gray-500">Արտադրամաս</label>
          <select v-model.number="sendModal.to_storage_id" class="border rounded-xl px-3 py-2 w-full">
            <option :value="undefined">—</option>
            <option v-for="s in industrial_storages" :key="s.id" :value="s.id">
              {{ s.address || s.name || ('#'+s.id) }}
            </option>
          </select>
        </div>
      </div>
      <div class="px-5 py-4 border-t flex justify-end gap-2">
        <button class="px-3 py-2 rounded-xl border" @click="closeSendModal">Չեղարկել</button>
        <button
            class="px-3 py-2 rounded-xl bg-purple-600 text-white disabled:opacity-60"
            :disabled="!canAddToBasket"
            @click="addToBasket"
        >
          Ավելացնել զամբյուղ
        </button>
      </div>
    </div>
  </div>

  <!-- Basket review -->
  <div v-if="basketReview.open" class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/40" @click="basketReview.open=false"></div>
    <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-2xl shadow">
      <div class="flex items-center justify-between px-5 py-4 border-b">
        <div class="font-semibold">Զամբյուղ — ուղարկել արտադրամաս</div>
        <button class="p-2 hover:bg-gray-100 rounded-lg" @click="basketReview.open=false">✕</button>
      </div>
      <div class="p-5 space-y-3">
        <div class="rounded-xl border border-gray-200 overflow-hidden">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left">Ապրանք</th>
              <th class="px-4 py-3 text-left">Քանակ</th>
              <th class="px-4 py-3 text-left">Արտադրամաս</th>
              <th class="px-4 py-3 text-right"></th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="it in basket.items" :key="it.key" class="border-t">
              <td class="px-4 py-2">
                {{ it.product_name || ('#'+it.product_id) }}
                <div v-if="it.characteristics?.length" class="text-xs text-slate-500">
                  <span v-for="c in it.characteristics" :key="c.id" class="mr-1">{{ c.name }}</span>
                </div>
              </td>
              <td class="px-4 py-2">
                {{ formatQty(it.qty) }} {{ $t(it.measure || 'piece') }}
              </td>
              <td class="px-4 py-2">
                {{ it.storage_label }}
              </td>
              <td class="px-4 py-2 text-right">
                <button class="px-2 py-1 text-xs border rounded-lg" @click="removeFromBasket(it.key)">Հեռացնել</button>
              </td>
            </tr>
            <tr v-if="!basket.items.length">
              <td colspan="4" class="px-4 py-6 text-center text-gray-500">Դատարկ</td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="px-5 py-4 border-t flex justify-end gap-2">
        <button class="px-4 py-2 rounded-xl border" @click="basketReview.open=false">Փակել</button>
        <button
            class="px-4 py-2 rounded-xl bg-purple-600 text-white"
            :disabled="basket.sending || !basket.items.length"
            @click="sendBasket"
        >
          {{ basket.sending ? 'Ուղարկվում է…' : 'Ուղարկել' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRoute } from 'vue-router'
import { mainApi, wmsApi } from '@/api.js'
import AllocateToCellModal from '@/views/storages/modals/AllocatedToCellModal.vue'
import AllocateToDispatchModal from '@/views/storages/modals/AllocatedToDispatchModal.vue'
import { useToast } from 'vue-toastification'
import { formatQty } from '@/utils/numberFormat'
import ReserveListModal from '@/views/storages/modals/ReserveListModal.vue'

const toast = useToast()
const route = useRoute()

/* ---------- Storage ---------- */
const storage = ref(null)

/* ---------- List state ---------- */
const items = ref([])
const loading = ref(false)
const endReached = ref(false)

/* ---------- Filters ---------- */
const filter = ref({
  storage_id: undefined,
  limit: 50,
  offset: 0,
  search: '',
  status: ''
})

/* ---------- Search debounce ---------- */
const q = ref('')
let debounceTimer
watch(q, (val) => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    filter.value.search = val || ''
    reloadFromStart()
  }, 300)
})

/* ---------- Chips ---------- */
const badgeClass = (status) => {
  switch (status) {
    case 'active': return 'bg-emerald-100 text-emerald-700'
    case 'pending': return 'bg-amber-100 text-amber-700'
    case 'send_to_production': return 'bg-indigo-100 text-indigo-700'
    case 'cancelled': return 'bg-rose-100 text-rose-700'
    default: return 'bg-slate-100 text-slate-700'
  }
}

/* ---------- Modals / actions (existing) ---------- */
const showPlace = ref(false)
const showDispatch = ref(false)
const selected = ref(null)
const consumingId = ref(null)
const activatingId = ref(null)

const openReserves = (sp) => { selected.value = sp; showReserves.value = true }
const openPlace = (sp) => { selected.value = sp; showPlace.value = true }
const openDispatch = (sp) => { selected.value = sp; showDispatch.value = true }

const quickConsume = async (sp) => {
  try {
    consumingId.value = sp.id
    await wmsApi.quickConsume(sp.id)
    toast.success('Սպառումը գրանցվեց')
    await reloadFromStart()
  } finally {
    consumingId.value = null
  }
}

const activateRow = async (sp) => {
  try {
    activatingId.value = sp.id
    await wmsApi.activateEntry(sp.id)
    sp.status = 'active'
    toast.success('Տողը ակտիվացվեց')
    await reloadFromStart()
  } finally {
    activatingId.value = null
  }
}

/* ---------- Industrial storages list (for target workshop) ---------- */
const industrial_storages = ref([])
async function loadIndustrialStorages () {
  const res = await wmsApi.getStorages({ industrial: 1, is_active: 1 })
  industrial_storages.value = Array.isArray(res?.data) ? res.data : (res ?? [])
}

/* ---------- Basket state ---------- */
const basket = ref({
  items: /** @type {Array<{key:string, storage_product_id:number, product_id:number, product_name?:string, characteristics?:any[], measure?:string, qty:number, to_storage_id:number, storage_label:string}>} */([]),
  sending: false
})

function inBasketQty (storageProductId) {
  return basket.value.items
      .filter(x => x.storage_product_id === Number(storageProductId))
      .reduce((s, x) => s + Number(x.qty || 0), 0)
}

/* ---------- Single-product send modal ---------- */
const sendModal = ref({
  open: false,
  product: null,
  qty: 0,
  to_storage_id: undefined
})

const sendAvailable = computed(() => {
  const p = sendModal.value.product || {}
  const total = Number(p.qty_available || 0)
  const reservedProd = Number(p.qty_reserved_production || 0)
  const inBasket = inBasketQty(p.id)
  const left = total - reservedProd - inBasket
  return left > 0 ? left : 0
})

const canAddToBasket = computed(() => {
  const qty = Number(sendModal.value.qty || 0)
  if (qty <= 0 || qty > sendAvailable.value) return false
  if (industrial_storages.value.length > 1 && !sendModal.value.to_storage_id) return false
  return true
})

function openSendModal (sp) {
  sendModal.value.open = true
  sendModal.value.product = sp
  sendModal.value.qty = 0
  sendModal.value.to_storage_id = industrial_storages.value.length === 1
      ? Number(industrial_storages.value[0].id)
      : undefined
}
function closeSendModal () {
  sendModal.value = { open: false, product: null, qty: 0, to_storage_id: undefined }
}

/* ---------- Add to basket (merge same product+workshop) ---------- */
function addToBasket () {
  if (!canAddToBasket.value) return
  const p = sendModal.value.product
  const toId = Number(sendModal.value.to_storage_id ?? (industrial_storages.value[0]?.id || 0))
  const sInfo = industrial_storages.value.find(x => Number(x.id) === toId)
  const storageLabel = sInfo?.address || sInfo?.name || ('#' + toId)

  // merge by (storage_product_id + to_storage_id)
  const idx = basket.value.items.findIndex(
      it => it.storage_product_id === Number(p.id) && it.to_storage_id === toId
  )
  if (idx >= 0) {
    // increase qty but clamp to available
    const maxAdd = sendAvailable.value
    const add = Number(sendModal.value.qty)
    const newQty = Number(basket.value.items[idx].qty) + add
    // clamp by available + current basket qty for this product+workshop
    const allowed = Math.min(newQty, Number(p.qty_available || 0) - Number(p.qty_reserved_production || 0))
    basket.value.items[idx].qty = allowed
  } else {
    basket.value.items.unshift({
      key: `${p.id}-${toId}-${Date.now()}`,
      storage_product_id: Number(p.id),                // ← inventory identificator
      product_id: Number(p.product_id),
      product_name: p.product?.name,
      characteristics: p.product?.characteristics || [],
      measure: p.measure,
      qty: Number(sendModal.value.qty),
      to_storage_id: toId,
      storage_label: storageLabel
    })
  }
  closeSendModal()
}

function removeFromBasket (key) {
  basket.value.items = basket.value.items.filter(x => x.key !== key)
}

/* ---------- Send basket (single request) ---------- */
async function sendBasket () {
  if (!basket.value.items.length) return
  basket.value.sending = true
  try {
    const itemsPayload = basket.value.items.map(it => ({
      storage_product_id: it.storage_product_id,
      qty: it.qty,
      to_storage_id: it.to_storage_id
    }))
    // one-shot request; backend must accept array of mixed products
    await wmsApi.sendToWorkshop(storage.value.id, { items: itemsPayload })

    basket.value.items = []
    toast.success('Ուղարկվեց արտադրամաս')
    await reloadFromStart()
  } finally {
    basket.value.sending = false
    basketReview.value.open = false
  }
}

/* ---------- Reserve modal ---------- */
const showReserves = ref(false)

/* ---------- Paging ---------- */
const sentinel = ref(null)
let observer = null
const fetchPage = async () => {
  if (loading.value || endReached.value) return
  loading.value = true
  try {
    const page = await wmsApi.getStaging({
      storage_id: filter.value.storage_id,
      limit: filter.value.limit,
      offset: filter.value.offset,
      search: filter.value.search,
      status: filter.value.status || undefined
    })
    const list = Array.isArray(page) ? page : (page?.data ?? [])
    items.value.push(...list)
    filter.value.offset += list.length
    if (list.length < filter.value.limit) endReached.value = true
  } finally {
    loading.value = false
  }
}

const reloadFromStart = async () => {
  endReached.value = false
  items.value = []
  filter.value.offset = 0
  await fetchPage()
}

const loadByRoute = async () => {
  const storageId = Number(route.params.id)
  filter.value.storage_id = Number.isFinite(storageId) ? storageId : undefined
  if (filter.value.storage_id) {
    storage.value = await mainApi.getStorageById(filter.value.storage_id)
  } else {
    storage.value = null
  }
  await loadIndustrialStorages()
  await reloadFromStart()
}

const startObserver = () => {
  if (!sentinel.value) return
  observer = new IntersectionObserver((entries) => {
    const [entry] = entries
    if (entry.isIntersecting) fetchPage()
  })
  observer.observe(sentinel.value)
}

onMounted(async () => {
  await loadByRoute()
  startObserver()
})

watch(() => route.params.id, loadByRoute)

onBeforeUnmount(() => {
  if (observer && sentinel.value) observer.unobserve(sentinel.value)
  observer = null
})

/* ---------- Basket review modal state ---------- */
const basketReview = ref({ open: false })
</script>
