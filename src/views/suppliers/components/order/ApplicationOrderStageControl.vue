<template>
  <div class="p-4 space-y-4">
    <!-- Tabs -->
    <div class="border-b border-gray-300">
      <nav class="-mb-px flex gap-4" aria-label="Tabs">
        <button
            class="px-3 pb-2 border-b-2"
            :class="tab==='list' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'"
            @click="tab='list'"
        >Ուղարկված ցանկ
        </button>
        <button
            class="px-3 pb-2 border-b-2"
            :class="tab==='prepare' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'"
            @click="tab='prepare'"
        >Ուղարկել
        </button>
      </nav>
    </div>

    <!-- Tab 1 (placeholder for now) -->
    <div v-if="tab==='list'" class="text-gray-500">
      Այստեղ հետո կլինեն ցանկերը…
    </div>

    <!-- Tab 2 -->
    <div v-else class="space-y-4">
      <!-- Partner select -->
      <div class="grid md:grid-cols-3 gap-4">
        <div class="flex flex-col gap-2">
          <label class="text-sm text-gray-600">Ընտրել Գործընկեր</label>
          <VueSelect
              v-model="partner"
              @search="partnerList"
              :filterable="false"
              :loading="partnersLoading"
              :is-searchable="true"
              :get-option-label="o => o.name"
              :get-option-value="o => o.id"
              :is-multi="false"
              :options="partners"
              :placeholder="'Ընտրիր գործընկեր'"
              :noResults="'Արդյունք չի գտնվել'"
          >
            <template #no-options>Արդյունք չի գտնվել</template>
            <template #option="{ option }">
              <div class="flex items-center gap-2">
                <span class="font-medium">{{ option.name }}</span>
              </div>
            </template>
          </VueSelect>
        </div>

        <div v-if="partner" class="md:col-span-2 flex items-end">
          <input
              v-model.trim="search"
              @input="debouncedFetch"
              class="px-3 py-2 rounded-xl border border-gray-300 w-full"
              placeholder="Փնտրել ապրանքով…"
          />
        </div>
      </div>

      <!-- List only after selecting partner -->
      <div v-if="partner" class="bg-white border border-gray-300 overflow-hidden rounded-xl">
        <div class="px-4 py-3 border-b font-medium">Ապրանքների ցանկ</div>
        <table class="min-w-full text-sm">
          <thead class="bg-gray-50">
          <tr>
            <th class="px-3 py-2 text-left">Ապրանք</th>
            <th class="px-3 py-2 text-left"></th>
            <th class="px-3 py-2 text-right">Քանակ</th>
            <th class="px-3 py-2 text-right">Ուղարկված քանակ</th>
            <th class="px-3 py-2 text-right">Գործողություններ</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="row in rows" :key="row.id" class="border-t">
            <td class="px-3 py-2">
              <div class="font-medium">{{ row.product?.name || row.name }}</div>
              <div class="text-xs text-slate-500" v-if="row.product?.type?.name">
                Տեսակ՝ {{ row.product.type.name }}
              </div>
            </td>
            <td class="px-3 py-2">
              <button
                  class="px-3 py-1 text-xs text-white bg-slate-600 rounded hover:bg-slate-700"
                  @click="openPhases(row)"
              >
                Տեսնել փուլերը
              </button>
            </td>
            <td class="px-3 py-2 text-right">
              {{ formatNumber(row.qty) }} <span class="text-gray-400">{{ row.measure || '' }}</span>
            </td>
            <td class="px-3 py-2 text-right">
              {{ formatNumber(row.sent_qty || 0) }} <span class="text-gray-400">{{ row.measure || '' }}</span>
            </td>
            <td class="px-3 py-2 text-right">
              <button
                  class="px-3 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700"
                  @click="openPrepare(row)"
              >
                Պատրաստել ուղարկման
              </button>
            </td>
          </tr>
          <tr v-if="!loading && rows.length===0">
            <td colspan="5" class="px-4 py-6 text-center text-gray-500">Դատարկ է</td>
          </tr>
          </tbody>
        </table>
        <div class="p-3 border-t text-center text-sm text-gray-500" v-if="loading">Բեռնվում է…</div>
        <div ref="sentinel" class="h-8"></div>
      </div>

      <!-- Basket -->
      <div v-if="partner" class="bg-white border border-gray-300 overflow-hidden rounded-xl">
        <div class="px-4 py-3 border-b font-medium">Զամբյուղ</div>
        <div v-if="basket.length===0" class="p-4 text-sm text-gray-500">Դատարկ է</div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-50">
            <tr>
              <th class="px-3 py-2 text-left">Ապրանք</th>
              <th class="px-3 py-2 text-left">Փուլ</th>
              <th class="px-3 py-2 text-left">Պահեստ</th>
              <th class="px-3 py-2 text-right">Քանակ</th>
              <th class="px-3 py-2 w-0 text-right"></th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="(b, i) in basket" :key="i" class="border-t">
              <td class="px-3 py-2">{{ b.productName }}</td>
              <td class="px-3 py-2">{{ b.stageName }}</td>
              <td class="px-3 py-2">{{ b.warehouseName }}</td>
              <td class="px-3 py-2 text-right">{{ formatNumber(b.qty) }} <span class="text-gray-400">{{
                  b.measure || ''
                }}</span></td>
              <td class="px-3 py-2 text-right">
                <button class="px-3 py-1 text-xs rounded border hover:bg-gray-50" @click="removeFromBasket(i)">
                  Հեռացնել
                </button>
              </td>
            </tr>
            </tbody>
          </table>

          <div class="p-4 border-t flex items-center justify-end gap-2">
            <button class="px-3 py-2 rounded-xl border hover:bg-gray-50" @click="clearBasket">Մաքրել</button>
            <button
                class="px-3 py-2 rounded-xl text-white"
                :class="basket.length ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-gray-400 cursor-not-allowed'"
                :disabled="basket.length===0 || submitting"
                @click="submitBasket"
            >
              Ուղարկել բեքենդ
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Phases Modal -->
    <div v-if="phasesModal.open" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/40" @click="closePhases"></div>
      <div
          class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl bg-white rounded-2xl shadow-xl">
        <div class="flex items-center justify-between px-5 py-4 border-b">
          <h3 class="text-lg font-semibold">Փուլեր · {{ phasesModal.row?.product?.name || phasesModal.row?.name }}</h3>
          <button class="p-2 rounded-lg hover:bg-gray-100" @click="closePhases" aria-label="Close">✕</button>
        </div>
        <div class="p-5">
          <div class="overflow-x-auto">
            <table class="min-w-full text-sm border rounded-lg overflow-hidden">
              <thead class="bg-gray-50">
              <tr class="text-left">
                <th class="px-3 py-2">Անվանում</th>
                <th class="px-3 py-2">Ժամկետ</th>
                <th class="px-3 py-2 text-right">Քանակ</th>
                <th class="px-3 py-2 text-right">Ուղարկված քանակ</th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="st in phasesModal.row?.stages || []" :key="st.id" class="border-t">
                <td class="px-3 py-2">{{ st.name }}</td>
                <td class="px-3 py-2">{{ stageDeadlineLabel(st) }}</td>
                <td class="px-3 py-2 text-right">{{ formatNumber(st.qty) }}</td>
                <td class="px-3 py-2 text-right">{{ formatNumber(st.sent_qty || 0) }}</td>
              </tr>
              <tr v-if="!(phasesModal.row?.stages || []).length">
                <td colspan="4" class="px-4 py-6 text-center text-gray-500">Փուլեր չկան</td>
              </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="flex items-center justify-end gap-2 px-5 py-4 border-t">
          <button class="px-3 py-2 rounded-xl border hover:bg-gray-50" @click="closePhases">Փակել</button>
        </div>
      </div>
    </div>

    <!-- Prepare Modal -->
    <div v-if="prepareModal.open" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/40" @click="closePrepare"></div>
      <div
          class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-white rounded-2xl shadow-xl">
        <div class="flex items-center justify-between px-5 py-4 border-b">
          <h3 class="text-lg font-semibold">Պատրաստել ուղարկման ·
            {{ prepareModal.row?.product?.name || prepareModal.row?.name }}</h3>
          <button class="p-2 rounded-lg hover:bg-gray-100" @click="closePrepare" aria-label="Close">✕</button>
        </div>

        <div class="p-5 space-y-4">
          <!-- Stage select -->
          <div class="flex flex-col gap-1">
            <label class="text-sm text-gray-600">Փուլ</label>
            <select v-model="prepareModal.stageId" class="w-full px-3 py-2 rounded-xl border">
              <option :value="null" disabled>Ընտրիր փուլ</option>
              <option
                  v-for="st in selectableStages"
                  :key="st.id"
                  :value="st.id"
              >
                {{ st.name }} · մն. {{ formatNumber(stageRemaining(st)) }}
              </option>
            </select>
            <p v-if="!selectableStages.length" class="text-xs text-gray-500">Առկա փուլ չկա (բոլորը ուղարկված են)</p>
          </div>

          <!-- Warehouse select -->
          <div class="flex flex-col gap-1">
            <label class="text-sm text-gray-600">Պահեստ</label>
            <VueSelect
                v-model="prepareModal.warehouse"
                @search="warehouseList"
                :filterable="false"
                :loading="warehousesLoading"
                :is-searchable="true"
                :get-option-label="o => o.name"
                :get-option-value="o => o.id"
                :is-multi="false"
                :options="warehouses"
                :placeholder="'Ընտրիր պահեստ'"
                :noResults="'Արդյունք չի գտնվել'"
            >
              <template #no-options>Արդյունք չի գտնվել</template>
              <template #option="{ option }">
                <div class="flex items-center gap-2">
                  <span class="font-medium">{{ option.name }}</span>
                </div>
              </template>
            </VueSelect>
          </div>

          <!-- Qty -->
          <div class="flex flex-col gap-1">
            <label class="text-sm text-gray-600">Քանակ</label>
            <input
                v-model.number="prepareModal.qty"
                type="number"
                min="0"
                :max="maxSendableForChosenStage"
                step="0.01"
                class="w-full px-3 py-2 rounded-xl border"
            />
            <p class="text-xs text-gray-500">
              Առավելագույնը՝ {{ formatNumber(maxSendableForChosenStage) }} {{ prepareModal.row?.measure || '' }}
            </p>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 px-5 py-4 border-t">
          <button class="px-3 py-2 rounded-xl border hover:bg-gray-50" @click="closePrepare">Փակել</button>
          <button
              class="px-3 py-2 rounded-xl text-white"
              :class="canAddToBasket ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'"
              :disabled="!canAddToBasket"
              @click="addToBasket"
          >
            Ավելացնել
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted, onBeforeUnmount, watchEffect, watch} from 'vue'
import VueSelect from 'vue3-select-component'
import {useToast} from 'vue-toastification'
import {purchasingPartnerApi, applicationMovementsApi, storagesApi} from '@/api.js'

type AnyRow = any

const toast = useToast()

/* Tabs */
const tab = ref<'list' | 'prepare'>('prepare')

/* Partner select (VueSelect) */
const partner = ref<any | null>(null)
const partners = ref<any[]>([])
const partnersLoading = ref(false)

async function partnerList(search = '') {
  partnersLoading.value = true
  try {
    const {data} = await purchasingPartnerApi.list({search, limit: 50})
    const list = data?.data ?? data ?? []
    partners.value = list.map((p: any) => ({id: p.id, name: p.name}))
  } catch (e) {
    partners.value = []
  } finally {
    partnersLoading.value = false
  }
}

/* Rows list (after selecting partner) with infinite scroll */
const rows = ref<AnyRow[]>([])
const loading = ref(false)
const eof = ref(false)
const LIMIT = 30
const offset = ref(0)
const sentinel = ref<HTMLElement | null>(null)
let io: IntersectionObserver | null = null
const search = ref('')
let t: any

function debouncedFetch() {
  clearTimeout(t)
  t = setTimeout(resetAndFetch, 300)
}

async function fetchNext() {
  if (!partner.value || loading.value || eof.value) return
  loading.value = true
  try {
    const {data} = await applicationMovementsApi.activeProductList({
      partner_id: partner.value.id,
      search: search.value || undefined,
      limit: LIMIT,
      offset: offset.value,
    })
    const batch = data?.data ?? data ?? []
    rows.value.push(...batch)
    if (batch.length < LIMIT) eof.value = true
    else offset.value += LIMIT
  } catch (e) {
    // ignore
  } finally {
    loading.value = false
  }
}

async function resetAndFetch() {
  rows.value = []
  eof.value = false
  offset.value = 0
  await fetchNext()
}

onMounted(() => {
  io = new IntersectionObserver(
      (entries) => {
        if (entries.some((x) => x.isIntersecting)) fetchNext()
      },
      {rootMargin: '0px 0px 200px'}
  )
  if (sentinel.value) io.observe(sentinel.value)
  partnerList('')
})
onBeforeUnmount(() => {
  if (io && sentinel.value) io.unobserve(sentinel.value)
})
/* When partner changes -> reload */
const partnerId = computed<number | string | null>(() => {
  const v = partner.value as any
  return v == null ? null : (typeof v === 'object' ? v.id ?? null : v)
})
watch(
    partnerId,
    (id, prev) => {
      console.log(id);
      if (!id) {
        rows.value = []
        eof.value = false
        offset.value = 0
        return
      }
      // only run when id actually changes
      if (id !== prev) resetAndFetch()
    },
    {immediate: true}
)

/* Utils */
function formatNumber(
    value: any,
    {maximumFractionDigits = 6, minimumFractionDigits = 0, locale = 'hy-AM'} = {}
): string {
  if (value === null || value === undefined || value === '') return ''
  const num = typeof value === 'string' ? Number(value) : value
  if (!isFinite(num)) return String(value)
  return new Intl.NumberFormat(locale, {maximumFractionDigits, minimumFractionDigits, useGrouping: false}).format(num)
}

function stageDeadlineLabel(st: any) {
  // you can adjust if you store dates/periods differently
  // here we try several possible fields
  if (st.deadline) return st.deadline
  if (st.months_qty != null) return `${formatNumber(st.months_qty)} ամիս`
  if (st.days_qty != null) return `${formatNumber(st.days_qty)} օր`
  return '—'
}

/* Phases (Stages) modal */
const phasesModal = ref<{ open: boolean; row: AnyRow | null }>({open: false, row: null})

function openPhases(row: AnyRow) {
  phasesModal.value = {open: true, row}
}

function closePhases() {
  phasesModal.value = {open: false, row: null}
}

/* Prepare modal */
const prepareModal = ref<{
  open: boolean
  row: AnyRow | null
  stageId: number | null
  warehouse: any | null
  qty: number | null
}>({open: false, row: null, stageId: null, warehouse: null, qty: null})

function openPrepare(row: AnyRow) {
  prepareModal.value = {open: true, row, stageId: null, warehouse: null, qty: null}
  // preload warehouses quickly
  warehouseList('')
}

function closePrepare() {
  prepareModal.value.open = false
  prepareModal.value.row = null
  prepareModal.value.stageId = null
  prepareModal.value.warehouse = null
  prepareModal.value.qty = null
}

/* Warehouses (VueSelect) */
const warehouses = ref<any[]>([])
const warehousesLoading = ref(false)

async function warehouseList(search = '') {
  warehousesLoading.value = true
  try {
    const {data} = await storagesApi.getMatchedStoragePointsByProductTypeId()
    const list = data?.data ?? data ?? []
    warehouses.value = list.map((w: any) => ({id: w.id, name: w.name}))
  } catch (e) {
    warehouses.value = []
  } finally {
    warehousesLoading.value = false
  }
}

/* Stage filters & limits */
const selectableStages = computed(() => {
  const r = prepareModal.value.row
  if (!r) return []
  const stages = r.stages || []
  return stages.filter((st: any) => stageRemaining(st) > 0)
})

function stageRemaining(st: any) {
  const qty = Number(st.qty || 0)
  const sent = Number(st.sent_qty || 0)
  return Math.max(0, qty - sent)
}

const maxSendableForChosenStage = computed(() => {
  const st = selectableStages.value.find((s: any) => Number(s.id) === Number(prepareModal.value.stageId))
  return st ? stageRemaining(st) : 0
})
const canAddToBasket = computed(() => {
  const pm = prepareModal.value
  if (!pm.open) return false
  if (!pm.row) return false
  if (!pm.stageId) return false
  if (!pm.warehouse) return false
  const q = Number(pm.qty || 0)
  if (!(q > 0)) return false
  return q <= maxSendableForChosenStage.value
})

/* Basket */
const basket = ref<
    Array<{
      rowId: number
      productName: string
      measure?: string
      stageId: number
      stageName: string
      warehouseId: number
      warehouseName: string
      qty: number
    }>
>([])

function addToBasket() {
  const pm = prepareModal.value
  if (!canAddToBasket.value || !pm.row) return
  const st = (pm.row.stages || []).find((s: any) => Number(s.id) === Number(pm.stageId))
  if (!st) return
  basket.value.push({
    rowId: Number(pm.row.id),
    productName: pm.row.product?.name || pm.row.name,
    measure: pm.row.measure,
    stageId: Number(pm.stageId),
    stageName: String(st.name || 'Փուլ'),
    warehouseId: Number(pm.warehouse.id),
    warehouseName: pm.warehouse.name,
    qty: Number(pm.qty),
  })
  closePrepare()
}

function removeFromBasket(i: number) {
  basket.value.splice(i, 1)
}

function clearBasket() {
  basket.value = []
}

/* Submit basket */
const submitting = ref(false)

async function submitBasket() {
  if (!partner.value || basket.value.length === 0) return
  submitting.value = true
  try {
    const payload = {
      partner_id: partner.value.id,
      items: basket.value.map(b => ({
        order_row_id: b.rowId,
        stage_id: b.stageId,
        warehouse_id: b.warehouseId,
        qty: b.qty,
      })),
    }
    await applicationMovementsApi.create(payload)
    toast.success('Ուղարկումը գրանցվեց')
    clearBasket()
    // reload list to reflect sent quantities
    resetAndFetch()
  } catch (e: any) {
    toast.error(e?.response?.data?.message || 'Չհաջողվեց ուղարկել')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
/* minimal */
</style>
