<!-- src/views/mfg/components/ManufacturingRawTab.vue -->
<template>
  <section>
    <!-- Sticky baskets -->
    <div v-if="hasAnyBasket" class="sticky bottom-4 z-30 flex gap-2 py-2 space-y-2">
      <!-- WRITE-OFF basket -->
      <div
          v-if="baskets.writeoff.items.length"
          class="rounded-2xl border border-amber-200/70 bg-gradient-to-r from-amber-50 to-yellow-50 shadow-sm"
      >
        <div class="flex flex-col md:flex-row items-start md:items-center gap-3 p-4">
          <div class="flex flex-wrap items-center gap-3 text-sm">
            <span
                class="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 border border-amber-200 shadow-xs"
            >
              <svg class="h-4 w-4 text-amber-600" viewBox="0 0 24 24" fill="none">
                <path
                    d="M3 3h2l2.4 12.1a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L21 7H6"
                    stroke="currentColor"
                    stroke-width="1.6"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                />
                <circle cx="9" cy="20" r="1.5" fill="currentColor"/>
                <circle cx="18" cy="20" r="1.5" fill="currentColor"/>
              </svg>
              <span class="font-medium">{{ $t('writeoff', 'Դուրսգրում') }}</span>
              <span class="font-semibold">{{ baskets.writeoff.items.length }}</span>
            </span>
          </div>
          <div class="md:ml-auto flex items-stretch gap-2 w-full md:w-auto">
            <button
                type="button"
                class="inline-flex justify-center items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-amber-700 disabled:opacity-50 w-full md:w-auto"
                :disabled="baskets.writeoff.sending || !baskets.writeoff.items.length"
                @click="openWriteoffSubmit()"
            >
              <svg v-if="baskets.writeoff.sending" class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" d="M4 12a8 8 0 018-8" stroke="currentColor" stroke-width="4"/>
              </svg>
              <span>{{ $t('send', 'Ուղարկել') }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- RECYCLE basket -->
      <div
          v-if="baskets.recycle.items.length"
          class="rounded-2xl border border-indigo-200/70 bg-gradient-to-r from-indigo-50 to-fuchsia-50 shadow-sm"
      >
        <div class="flex flex-col md:flex-row items-start md:items-center gap-3 p-4">
          <div class="flex flex-wrap items-center gap-3 text-sm">
            <span
                class="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 border border-indigo-200 shadow-xs"
            >
              <svg class="h-4 w-4 text-indigo-600" viewBox="0 0 24 24" fill="none">
                <path
                    d="M3 3h2l2.4 12.1a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L21 7H6"
                    stroke="currentColor"
                    stroke-width="1.6"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                />
                <circle cx="9" cy="20" r="1.5" fill="currentColor"/>
                <circle cx="18" cy="20" r="1.5" fill="currentColor"/>
              </svg>
              <span class="font-medium">{{ $t('recycle', 'Վերամշակում') }}</span>
              <span class="font-semibold">{{ baskets.recycle.items.length }}</span>
            </span>
          </div>
          <div class="md:ml-auto flex items-stretch gap-2 w-full md:w-auto">
            <button
                type="button"
                class="inline-flex justify-center items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50 w-full md:w-auto"
                @click="openBasketReview('recycle')"
            >
              {{ $t('view_basket', 'Դիտել զամբյուղը') }}
            </button>
            <button
                type="button"
                class="inline-flex justify-center items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-50 w-full md:w-auto"
                :disabled="baskets.recycle.sending || !baskets.recycle.items.length"
                @click="submitBasket('recycle')"
            >
              <svg v-if="baskets.recycle.sending" class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" d="M4 12a8 8 0 018-8" stroke="currentColor" stroke-width="4"/>
              </svg>
              <span>{{ $t('send', 'Ուղարկել') }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- List -->
    <div class="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <table class="min-w-full text-sm">
        <thead class="bg-gray-50">
        <tr>
          <th class="px-6 py-3 text-left">{{ $t('product', 'Ապրանք') }}</th>
          <th class="px-6 py-3 text-left">{{ $t('qty', 'Քանակ') }}</th>
          <th class="px-6 py-3 text-right">{{ $t('actions', 'Գործողություններ') }}</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="r in raws.rows" :key="r.id" class="border-t">
          <td class="px-6 py-3">
            <div class="font-medium">{{ r.product?.name || ('#' + r.product_id) }}</div>
            <div class="mt-1 flex flex-wrap gap-1" v-if="(r.product?.characteristics||[]).length">
                <span
                    v-for="c in r.product.characteristics"
                    :key="c.id||c.name"
                    class="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700"
                >{{ c.name }}</span>
            </div>
          </td>
          <td class="px-6 py-3">
            <span class="font-medium">{{ fmt(r.qty) }}</span> {{ $t(r.measure || 'kg') }}
            <div class="text-xs text-gray-500">
              {{ $t('reserved', 'Ռեզերվ') }}: {{ fmt(r.reserved_qty || 0) }} {{ $t(r.measure || 'kg') }}
            </div>
            <!-- cross-basket availability (same for both actions) -->
            <div class="text-xs text-gray-500 mt-1">
              Հասանելի:
              {{ fmt(availableFor(r)) }} {{ $t(r.measure || 'kg') }}
            </div>
          </td>
          <td class="px-6 py-3">
            <div class="flex justify-end gap-2">
              <button
                  class="px-3 py-1 text-xs font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700"
                  @click="openItemModal('writeoff', r)"
              >
                {{ $t('writeoff_from_shop', 'Դուրս գրել արտադրամասից') }}
              </button>
              <button
                  class="px-3 py-1 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                  @click="openItemModal('recycle', r)"
              >
                {{ $t('send_to_recycle', 'Ուղարկել վերամշակման') }}
              </button>
              <button
                  class="px-3 py-1 text-xs font-medium text-white bg-slate-700 rounded-md hover:bg-slate-800"
                  @click="openReserves(r)"
              >
                {{ $t('reserves','Ռեզերվներ') }}
              </button>
            </div>
          </td>
        </tr>

        <tr v-if="!raws.loading && raws.rows.length===0">
          <td colspan="3" class="px-6 py-8 text-center text-gray-500">{{ $t('no_data') }}</td>
        </tr>
        </tbody>
      </table>

      <div class="p-3 text-center" v-if="raws.loading">{{ $t('loading') }}</div>
      <div ref="rawsSentinel" class="h-10"></div>
    </div>



  </section>
  <!-- Add-to-basket modal -->
  <div v-if="itemModal.open" class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/40" @click="closeItemModal"></div>
    <div
        class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow">
      <div class="flex items-center justify-between px-5 py-4 border-b">
        <div class="font-semibold">
          {{ itemModal.kind === 'writeoff' ? 'Դուրս գրել արտադրամասից' : 'Ուղարկել վերամշակման' }}
        </div>
        <button class="p-2 hover:bg-gray-100 rounded-lg" @click="closeItemModal">✕</button>
      </div>
      <div class="p-5 space-y-3 text-sm">
        <div class="font-medium">{{ itemModal.row?.product?.name }}</div>
        <div class="text-xs text-gray-500">
          {{ $t('available', 'Մատչելի') }}:
          {{ fmt(currentAvailable) }} {{ $t(itemModal.row?.measure || 'kg') }}
        </div>
        <div>
          <label class="text-xs text-gray-500">{{ $t('qty') }}</label>
          <input
              v-model.number="itemModal.qty"
              type="number"
              min="0"
              step="0.001"
              class="border rounded-xl px-3 py-2 w-full"
          />
          <p class="text-xs text-gray-400 mt-1">
            {{ $t('max', 'Առավելագույն') }}: {{ fmt(currentAvailable) }}
          </p>
        </div>
      </div>
      <div class="px-5 py-4 border-t flex justify-end gap-2">
        <button class="px-4 py-2 rounded-xl border" @click="closeItemModal">Փակել</button>
        <button
            class="px-4 py-2 rounded-xl text-white disabled:opacity-60"
            :class="itemModal.kind==='writeoff' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-700'"
            :disabled="!canAddCurrent"
            @click="addCurrentToBasket"
        >
          {{ $t('add_to_basket', 'Ավելացնել զամբյուղ') }}
        </button>
      </div>
    </div>
  </div>

  <!-- Basket review modal (per-kind) -->
  <div v-if="basketReview.open" class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/40" @click="closeBasketReview"></div>
    <div
        class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-2xl shadow">
      <div class="flex items-center justify-between px-5 py-4 border-b">
        <div class="font-semibold">
          {{ basketReview.kind === 'writeoff' ? $t('writeoff', 'Դուրսգրում') : $t('recycle', 'Վերամշակում') }} —
          {{ $t('basket', 'Զամբյուղ') }}
        </div>
        <button class="p-2 hover:bg-gray-100 rounded-lg" @click="closeBasketReview">✕</button>
      </div>
      <div class="p-5 space-y-3">
        <div class="rounded-xl border border-gray-200 overflow-hidden">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left">{{ $t('product', 'Ապրանք') }}</th>
              <th class="px-4 py-3 text-left">{{ $t('qty', 'Քանակ') }}</th>
              <th class="px-4 py-3 text-right"></th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="it in activeBasket.items" :key="it.key" class="border-t">
              <td class="px-4 py-2">{{ it.product_name || ('#' + it.product_id) }}</td>
              <td class="px-4 py-2">{{ fmt(it.qty) }} {{ $t(it.measure || 'kg') }}</td>
              <td class="px-4 py-2 text-right">
                <button class="px-2 py-1 text-xs border rounded-lg"
                        @click="removeBasketItem(basketReview.kind!, it.key)">
                  {{ $t('remove', 'Հեռացնել') }}
                </button>
              </td>
            </tr>
            <tr v-if="activeBasket.items.length===0">
              <td colspan="3" class="px-4 py-6 text-center text-gray-500">{{ $t('empty', 'Դատարկ') }}</td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="px-5 py-4 border-t flex justify-end gap-2">
        <button class="px-4 py-2 rounded-xl border" @click="closeBasketReview">{{ $t('close', 'Փակել') }}</button>
        <button
            class="px-4 py-2 rounded-xl text-white"
            :class="basketReview.kind==='writeoff' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-700'"
            :disabled="activeBasket.sending || !activeBasket.items.length"
            @click="submitBasket(basketReview.kind!)"
        >
          {{ activeBasket.sending ? $t('processing', 'Ուղարկվում է…') : $t('send', 'Ուղարկել') }}
        </button>
      </div>
    </div>
  </div>
  <!-- ADD: Write-off submit modal -->
  <div v-if="writeoffSubmit.open" class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/40" @click="closeWriteoffSubmit"></div>
    <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-2xl shadow">
      <div class="flex items-center justify-between px-5 py-4 border-b">
        <div class="font-semibold">{{ $t('writeoff','Դուրսգրում') }} — {{ $t('basket','Զամբյուղ') }}</div>
        <button class="p-2 hover:bg-gray-100 rounded-lg" @click="closeWriteoffSubmit">✕</button>
      </div>

      <div class="p-5 space-y-4">
        <!-- Direction picker -->
        <div class="flex flex-col gap-1">
          <label class="text-xs text-gray-500">{{ $t('direction','Ուղղություն') }}</label>
          <select v-model="writeoffSubmit.direction" class="border rounded-xl px-3 py-2 w-full">
            <option value="to_storage">{{ $t('to_storage','Պահեստ') }}</option>
            <option value="output">{{ $t('output','Ելք') }}</option>
            <option value="as_waste">{{ $t('as_waste','Թափոն') }}</option>
          </select>
        </div>

        <!-- Basket list preview -->
        <div class="rounded-xl border border-gray-200 overflow-hidden">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left">{{ $t('product','Ապրանք') }}</th>
              <th class="px-4 py-3 text-left">{{ $t('qty','Քանակ') }}</th>
              <th class="px-4 py-3 text-right"></th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="it in baskets.writeoff.items" :key="it.key" class="border-t">
              <td class="px-4 py-2">{{ it.product_name || ('#'+it.product_id) }}</td>
              <td class="px-4 py-2">{{ fmt(it.qty) }} {{ $t(it.measure || 'kg') }}</td>
              <td class="px-4 py-2 text-right">
                <button class="px-2 py-1 text-xs border rounded-lg" @click="removeBasketItem('writeoff', it.key)">
                  {{ $t('remove','Հեռացնել') }}
                </button>
              </td>
            </tr>
            <tr v-if="baskets.writeoff.items.length===0">
              <td colspan="3" class="px-4 py-6 text-center text-gray-500">{{ $t('empty','Դատարկ') }}</td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="px-5 py-4 border-t flex justify-end gap-2">
        <button class="px-4 py-2 rounded-xl border" @click="closeWriteoffSubmit">{{ $t('cancel','Չեղարկել') }}</button>
        <button
            class="px-4 py-2 rounded-xl bg-amber-600 text-white disabled:opacity-60"
            :disabled="baskets.writeoff.sending || !baskets.writeoff.items.length"
            @click="submitWriteoff"
        >
          {{ baskets.writeoff.sending ? $t('processing','Կատարվում է…') : $t('send','Ուղարկել') }}
        </button>
      </div>
    </div>
  </div>
  <div v-if="reservesModal.open" class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/40" @click="closeReserves"></div>
    <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-white rounded-2xl shadow">
      <div class="flex items-center justify-between px-5 py-4 border-b">
        <div class="font-semibold">
          {{ $t('reserves','Ռեզերվներ') }} — {{ reservesModal.item?.product?.name || ('#'+reservesModal.item?.product_id) }}
        </div>
        <button class="p-2 hover:bg-gray-100 rounded-lg" @click="closeReserves">✕</button>
      </div>

      <div class="p-5 space-y-3">
        <div class="flex flex-col gap-2">
          <label class="text-xs text-gray-500">{{ $t('status','Կարգավիճակ') }}</label>
          <select v-model="reservesModal.status" class="border border-gray-300 rounded-xl px-3 py-2" @change="reloadReserves">
            <option value="">{{ $t('all','Բոլորը') }}</option>
            <option value="active">{{ $t('active','Ակտիվ') }}</option>
            <option value="cancelled">{{ $t('cancelled','Չեղարկված') }}</option>
          </select>
        </div>

        <div class="rounded-xl border border-gray-200 overflow-hidden">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left">{{ $t('qty','Քանակ') }}</th>
              <th class="px-4 py-3 text-left">{{ $t('status','Կարգավիճակ') }}</th>
              <th class="px-4 py-3 text-left">{{ $t('date','Ամսաթիվ') }}</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="row in reservesModal.rows" :key="row.id" class="border-t">
              <td class="px-4 py-2">{{ Number(row.qty||0).toLocaleString(undefined,{maximumFractionDigits:3}) }}</td>
              <td class="px-4 py-2">
                <span class="px-2 py-0.5 rounded text-xs"
                      :class="row.status==='active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'">
                  {{ $t(row.status) }}
                </span>
              </td>
              <td class="px-4 py-2">
                {{ new Date(row.created_at||row.date||row.updated_at).toLocaleString() }}
              </td>
            </tr>
            <tr v-if="!reservesModal.loading && reservesModal.rows.length===0">
              <td colspan="3" class="px-4 py-6 text-center text-gray-500">{{ $t('no_data','Տվյալներ չկան') }}</td>
            </tr>
            </tbody>
          </table>
          <div class="p-3 text-center" v-if="reservesModal.loading">{{ $t('loading','Լցվում է…') }}</div>
          <div ref="reservesSentinel" class="h-8"></div>
        </div>

        <div class="flex justify-end">
          <button class="px-3 py-2 rounded-xl border" @click="closeReserves">{{ $t('close','Փակել') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive, computed, onMounted, onBeforeUnmount} from 'vue'
import {mfgApi} from '@/api.js'

type ID = number
const props = defineProps<{ storageId: ID }>()
const emit = defineEmits<{ (e: 'updated'): void }>()

const fmt = (n: any) => Number(n || 0).toLocaleString(undefined, {maximumFractionDigits: 3})

/* Raw list + infinite scroll */
const raws = reactive({rows: [] as any[], loading: false, end: false, limit: 30, offset: 0})
const rawsSentinel = ref<HTMLElement | null>(null)
let rawsObs: IntersectionObserver | null = null
const writeoffSubmit = reactive<{
  open: boolean
  direction: 'to_storage' | 'output' | 'as_waste'
}>({
  open: false,
  direction: 'to_storage',
})

// ADD: open/close helpers
function openWriteoffSubmit() {
  writeoffSubmit.open = true
  writeoffSubmit.direction = 'to_storage' // default
}
function closeWriteoffSubmit() {
  writeoffSubmit.open = false
}

async function submitBasket(kind: BasketKind, direction?: 'to_storage'|'output'|'as_waste') {
  const bag = baskets[kind]
  if (!bag.items.length) return
  bag.sending = true
  try {
    const payload: any = {
      items: bag.items.map(it => ({
        manufacturing_product_id: it.id,
        qty: Number(it.qty || 0),
        measure: it.measure
      }))
    }
    if (kind === 'writeoff') {
      // include direction only for writeoff
      payload.direction = direction || 'to_storage'
      await mfgApi.rawWriteoffBatch(props.storageId, payload)
    } else {
      await mfgApi.rawRecycleBatch(props.storageId, payload)
    }
    bag.items = []
    await reloadRaws()
    emit('updated')
  } finally {
    bag.sending = false
  }
}

// ADD: wrapper used by the modal confirm button
async function submitWriteoff() {
  await submitBasket('writeoff', writeoffSubmit.direction)
  closeWriteoffSubmit()
}
async function fetchRaws() {
  if (raws.loading || raws.end) return
  raws.loading = true
  try {
    const res = await mfgApi.getRawMaterials(props.storageId, {
      limit: raws.limit,
      offset: raws.offset,
      include: 'product',
    })
    const list = Array.isArray(res) ? res : (res?.data ?? [])
    raws.rows.push(...list)
    raws.offset += list.length
    if (list.length < raws.limit) raws.end = true
  } finally {
    raws.loading = false
  }
}
const reservesModal = reactive({
  open: false,
  item: null as any,
  rows: [] as any[],
  loading: false,
  end: false,
  limit: 30,
  offset: 0,
  status: '' as ''|'active'|'cancelled'
})
const reservesSentinel = ref<HTMLElement|null>(null)
let reservesObs: IntersectionObserver | null = null

function openReserves(row:any){
  reservesModal.item = row
  reservesModal.open = true
  reloadReserves()
  // start observer a tick later so DOM exists
  queueMicrotask(startReservesObserver)
}
function closeReserves(){
  reservesModal.open = false
  reservesModal.item = null
  stopReservesObserver()
}

async function fetchReserves(){
  if (reservesModal.loading || reservesModal.end || !reservesModal.item) return
  reservesModal.loading = true
  try{
    const res = await mfgApi.getRawReserves(props.storageId, reservesModal.item.id,{
      limit: reservesModal.limit,
      offset: reservesModal.offset,
      status: reservesModal.status || undefined,
    })
    const list = Array.isArray(res) ? res : (res?.data ?? [])
    reservesModal.rows.push(...list)
    reservesModal.offset += list.length
    if (list.length < reservesModal.limit) reservesModal.end = true
  } finally { reservesModal.loading = false }
}
function reloadReserves(){
  reservesModal.rows = []
  reservesModal.offset = 0
  reservesModal.end = false
  fetchReserves()
}
function startReservesObserver(){
  if (!reservesSentinel.value) return
  stopReservesObserver()
  reservesObs = new IntersectionObserver((ents)=>{
    if (ents[0].isIntersecting) fetchReserves()
  })
  reservesObs.observe(reservesSentinel.value)
}
function stopReservesObserver(){
  if (reservesObs && reservesSentinel.value) reservesObs.unobserve(reservesSentinel.value)
  reservesObs = null
}
function reloadRaws() {
  raws.rows = [];
  raws.end = false;
  raws.offset = 0;
  fetchRaws()
}

function startRawsObserver() {
  if (!rawsSentinel.value) return
  rawsObs = new IntersectionObserver((es) => {
    if (es[0].isIntersecting) fetchRaws()
  })
  rawsObs.observe(rawsSentinel.value)
}

onBeforeUnmount(() => {
  if (rawsObs && rawsSentinel.value) rawsObs.unobserve(rawsSentinel.value)
})

/* Two separate baskets */
type BasketKind = 'writeoff' | 'recycle'
type BasketItem = {
  key: string
  id: number
  product_id: number
  product_name?: string
  measure?: string
  qty: number
}
const baskets = reactive<{
  writeoff: { items: BasketItem[]; sending: boolean },
  recycle: { items: BasketItem[]; sending: boolean },
}>({
  writeoff: {items: [], sending: false},
  recycle: {items: [], sending: false},
})
const hasAnyBasket = computed(() => baskets.writeoff.items.length > 0 || baskets.recycle.items.length > 0)

/* per-basket qty helper */
function inBasketQty(kind: BasketKind, Id: number) {
  return baskets[kind].items
      .filter(i => i.id === Id)
      .reduce((s, i) => s + Number(i.qty || 0), 0)
}

/* CROSS-basket availability: qty - reserved - writeoffBasket - recycleBasket */
function availableFor(row: any) {
  const total = Number(row?.qty || 0)
  const reserved = Number(row?.reserved_qty || 0)
  const id = Number(row?.id)
  const used = inBasketQty('writeoff', id) + inBasketQty('recycle', id)
  return Math.max(0, total - reserved - used)
}

/* Add-to-basket modal */
const itemModal = reactive<{ open: boolean; kind: BasketKind | null; row: any | null; qty: number }>({
  open: false, kind: null, row: null, qty: 0
})

function openItemModal(kind: BasketKind, row: any) {
  itemModal.open = true
  itemModal.kind = kind
  itemModal.row = row
  itemModal.qty = 0
}

function closeItemModal() {
  itemModal.open = false;
  itemModal.kind = null;
  itemModal.row = null;
  itemModal.qty = 0
}

const currentAvailable = computed(() => {
  if (!itemModal.row) return 0
  return availableFor(itemModal.row)
})
const canAddCurrent = computed(() => {
  if (!itemModal.kind || !itemModal.row) return false
  const q = Number(itemModal.qty || 0)
  return q > 0 && q <= currentAvailable.value
})

function addCurrentToBasket() {
  if (!canAddCurrent.value) return
  const kind = itemModal.kind as BasketKind
  const r: any = itemModal.row
  const qty = Number(itemModal.qty || 0)
  const list = baskets[kind].items
  const existing = list.find(i => i.id === Number(r.id))
  if (existing) {
    existing.qty = Number(existing.qty || 0) + qty
  } else {
    list.unshift({
      key: `${kind}-${r.id}-${Date.now()}`,
      id: Number(r.id),
      product_id: Number(r.product_id),
      product_name: r.product?.name,
      measure: r.measure,
      qty
    })
  }
  closeItemModal()
}

/* Basket review per kind */
const basketReview = reactive<{ open: boolean; kind: BasketKind | null }>({open: false, kind: null})

function openBasketReview(kind: BasketKind) {
  basketReview.open = true;
  basketReview.kind = kind
}

function closeBasketReview() {
  basketReview.open = false;
  basketReview.kind = null
}

const activeBasket = computed(() => basketReview.kind ? baskets[basketReview.kind] : {items: [], sending: false} as any)

function removeBasketItem(kind: BasketKind, key: string) {
  baskets[kind].items = baskets[kind].items.filter(x => x.key !== key)
}


/* Mount */
onMounted(() => {
  reloadRaws()
  startRawsObserver()
})
onBeforeUnmount(stopReservesObserver)
</script>
