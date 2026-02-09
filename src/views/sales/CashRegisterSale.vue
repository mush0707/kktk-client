<template>
  <div class="flex flex-col gap-4">
    <header class="bg-white p-4">
      <h1 class="text-lg font-semibold">Դրամարկղ</h1>
      <p class="text-xs text-slate-500 mt-1">
        Ապրանքների որոնում անվամբ կամ շտրիխկոդով, զամբյուղ, և վաճառքի պատմություն։
      </p>
    </header>

    <div class="px-4">
      <div class="inline-flex gap-1 rounded-xl border border-gray-200 bg-white p-1">
        <button
            class="px-4 py-2 rounded-lg text-sm font-medium"
            :class="tab==='pos' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-50'"
            @click="tab='pos'"
        >
          Արտահանում
        </button>
        <button
            class="px-4 py-2 rounded-lg text-sm font-medium"
            :class="tab==='history' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-50'"
            @click="tab='history'"
        >
          Արտահանումների պատմություն
        </button>
      </div>
    </div>

    <!-- POS -->
    <section v-show="tab==='pos'" class="grid lg:grid-cols-3 gap-4">
      <!-- Search panel -->
      <div class="lg:col-span-2 bg-white rounded-xl p-4 flex flex-col gap-3">
        <div class="grid sm:grid-cols-[minmax(280px,460px)_1fr] gap-2">
          <!-- BARCODE (large) -->
          <div class="relative">
            <input
                ref="barcodeInput"
                v-model="barcode"
                type="text"
                inputmode="numeric"
                placeholder="Շտրիխկոդ"
                class="w-full border border-gray-300 rounded-2xl px-4 py-4 text-lg tracking-widest"
                @keydown.enter.prevent="scanBarcode()"
            />
            <span class="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">Enter</span>
          </div>

          <!-- name search (normal size) -->
          <div class="relative">
            <input
                v-model="searchQ"
                type="text"
                class="w-full border border-gray-300 rounded-xl px-3 py-2"
                placeholder="Փնտրել ապրանք անվամբ…"
                @input="debouncedSearch()"
            />
            <div
                v-if="searching"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500"
            >Փնտրվում է…</div>
          </div>
        </div>

        <!-- search results -->
        <div class="border border-gray-300 rounded-xl divide-y max-h-[420px] overflow-y-auto">
          <div
              v-for="row in results"
              :key="productId(row)"
              class="p-3 flex items-center justify-between gap-3"
          >
            <div class="min-w-0">
              <!-- name -->
              <div class="font-medium truncate">{{ productName(row) }}</div>

              <!-- meta -->
              <div class="text-xs text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>#{{ productId(row) }}</span>

                <template v-if="displayLastUnit(row)">
                  <template v-if="displayLastUnit(row)?.base && displayLastUnit(row)?.percent>0">
                    <span class="line-through">{{ $money(displayLastUnit(row).base) }}</span>
                  </template>
                  <span>{{ $money(displayLastUnit(row)?.final || 0) }}</span>
                  <span v-if="displayLastUnit(row)?.percent>0" class="text-emerald-700">
                    (-{{ displayLastUnit(row)?.percent }}%)
                  </span>
                </template>
                <span class="text-slate-400">֏/{{ measureOf(row) }}</span>

                <span class="text-slate-400">
                  առկա՝ {{ formatQty(availableOf(row)) }} {{ measureOf(row) }}
                </span>
              </div>

              <!-- breakdown for this add -->
              <div v-if="segmentsFor(row).length" class="mt-1 text-[11px] text-slate-500">
                <span class="mr-1">հաշվարկ․</span>
                <span v-for="(seg, i) in segmentsFor(row)" :key="i" class="inline-flex items-center gap-1">
                  <span>{{ formatQty(seg.qty) }} × {{ $money(seg.final) }}</span>
                  <span v-if="i < segmentsFor(row).length - 1" class="mx-1">+</span>
                </span>
                <span class="ml-2 text-slate-400">
                  = {{ $money(totalFinalFor(row)) }}
                </span>
              </div>
            </div>

            <!-- qty + add -->
            <div class="flex items-center gap-2 shrink-0">
              <input
                  :value="qtyFor(productId(row))"
                  @input="updateQty(productId(row), ($event.target as HTMLInputElement).value)"
                  type="number"
                  min="1"
                  class="w-24 border rounded-lg px-2 py-1 text-sm"
                  placeholder="քանակ"
              />
              <button
                  class="px-3 py-1.5 text-xs font-medium text-white rounded-md"
                  :class="canAddQty(row) ? 'bg-blue-600' : 'bg-gray-300 cursor-not-allowed'"
                  :disabled="!canAddQty(row)"
                  @click="addToBasket(row)"
              >
                Ավելացնել
              </button>
            </div>
          </div>

          <div v-if="!searching && !results.length" class="p-6 text-center text-slate-400">Արդյունք չկա</div>
        </div>
      </div>

      <!-- Basket -->
      <div class="bg-white border border-gray-300 rounded-xl p-4 flex flex-col">
        <div class="flex items-center justify-between">
          <div class="font-medium">Զամբյուղ ({{ basket.length }})</div>
          <button class="text-xs text-slate-600 underline" :disabled="!basket.length" @click="clearBasket">Մաքրել</button>
        </div>

        <div class="divide-y my-3 max-h-[420px] overflow-y-auto">
          <div v-for="line in basket" :key="line.product_id" class="py-3 flex items-center justify-between gap-2">
            <div class="min-w-0">
              <div class="font-medium truncate">{{ line.name }}</div>
              <div class="text-xs text-slate-500">
                {{ $money(lastUnitForBasket(line).final) }} ֏/{{ line.measure || 'հատ' }}
              </div>

              <div v-if="basketSegments(line).length" class="mt-1 text-[11px] text-slate-500">
                <span class="mr-1">հաշվարկ․</span>
                <span v-for="(seg, i) in basketSegments(line)" :key="i" class="inline-flex items-center gap-1">
                  <span>{{ formatQty(seg.qty) }} × {{ $money(seg.final) }}</span>
                  <span v-if="i < basketSegments(line).length - 1" class="mx-1">+</span>
                </span>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <input v-model.number="line.qty" type="number" min="1" class="w-16 border rounded-lg px-2 py-1 text-sm" />
              <div class="w-24 text-right font-medium">{{ $money(basketLineTotal(line)) }}</div>
              <button class="px-2 py-1 text-xs bg-rose-50 text-rose-700 rounded-md" @click="removeFromBasket(line.product_id)">x</button>
            </div>
          </div>

          <div v-if="!basket.length" class="p-6 text-center text-slate-400">Զամբյուղը դատարկ է</div>
        </div>

        <div class="mt-auto pt-3 border-t">
          <div class="flex items-center justify-between text-sm">
            <span>Ընդամենը</span>
            <span class="font-semibold">{{ $money(total) }}</span>
          </div>

          <div class="grid grid-cols-2 gap-2 mt-3">
            <select v-model="payment.method" class="border rounded-xl px-3 py-2 text-sm">
              <option value="cash">Կանխիկ</option>
              <option value="card">Քարտ</option>
              <option value="mixed">Խառը</option>
            </select>
            <div></div>

            <input
                v-if="payment.method==='mixed'"
                v-model.number="payment.amount_cash"
                type="number"
                inputmode="decimal"
                min="0"
                class="border rounded-xl px-3 py-2 text-sm"
                placeholder="Կանխիկ գումար"
            />
            <input
                v-if="payment.method==='mixed'"
                v-model.number="payment.amount_card"
                type="number"
                inputmode="decimal"
                min="0"
                class="border rounded-xl px-3 py-2 text-sm"
                placeholder="Քարտի գումար"
            />
          </div>

          <p v-if="payment.method==='mixed' && mixedError" class="mt-2 text-xs text-rose-600">
            {{ mixedError }}
          </p>

          <button
              class="w-full mt-3 px-4 py-2 rounded-xl bg-emerald-600 text-white disabled:opacity-50"
              :disabled="!canSubmit"
              @click="openCheckout"
          >
            Վճարել / Checkout
          </button>

          <div v-if="error" class="text-xs text-rose-600 mt-2">{{ error }}</div>
        </div>
      </div>
    </section>

    <!-- HISTORY -->
    <SalesHistoryList v-show="tab==='history'" class="px-4" />

    <!-- ===== CHECKOUT MODAL ===== -->
    <transition name="fade">
      <div v-if="checkoutOpen" class="fixed inset-0 z-50">
        <div class="absolute inset-0 bg-black/40" @click="closeCheckout"></div>

        <div class="absolute left-1/2 top-1/2 w-[min(720px,92vw)] -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl">
          <!-- Header -->
          <div class="px-5 py-3 border-b flex items-center justify-between">
            <h3 class="text-lg font-semibold">Հաճախորդ & Վճարում</h3>
            <button class="px-3 py-1 rounded-lg border" @click="closeCheckout">✕</button>
          </div>

          <!-- Body -->
          <div class="p-5 space-y-4">
            <!-- Customer picker -->
            <div>
              <label class="block text-sm font-medium mb-1">Ընտրել հաճախորդ</label>
              <div class="flex items-center gap-2">
                <VueSelect
                    class="flex-1"
                    v-model="selectedCustomer"
                    :options="customerOptions"
                    :is-multi="false"
                    :is-searchable="true"
                    :filterable="false"
                    :loading="loading.customers"
                    :get-option-label="c => customerLabel(c)"
                    :get-option-value="c => c.id"
                    placeholder="Սկսեք գրել անուն / հեռախոս"
                    @open="fetchCustomers('')"
                    @search="q => fetchCustomers(q)"
                    @update:modelValue="onCustomerPick"
                />
                <button
                    v-if="selectedCustomer"
                    class="px-3 py-2 rounded-lg border text-xs"
                    @click="clearPickedCustomer"
                >
                  մաքրել
                </button>
              </div>
              <p class="mt-1 text-xs text-slate-500">
                Կարող եք ընտրել առկա հաճախորդից կամ լրացնել տվյալները ներքևում։
              </p>
            </div>

            <!-- Customer form -->
            <div class="grid md:grid-cols-2 gap-3">
              <div>
                <label class="block text-sm mb-1">Անուն *</label>
                <input
                    v-model="customerForm.first_name"
                    :disabled="isLocked"
                    class="w-full border rounded-lg px-3 py-2"
                    :class="fieldErr('first_name')"
                    placeholder="Անուն"
                />
                <p v-if="errors.first_name" class="text-xs text-rose-600 mt-1">{{ errors.first_name }}</p>
              </div>

              <div>
                <label class="block text-sm mb-1">Ազգանուն *</label>
                <input
                    v-model="customerForm.last_name"
                    :disabled="isLocked"
                    class="w-full border rounded-lg px-3 py-2"
                    :class="fieldErr('last_name')"
                    placeholder="Ազգանուն"
                />
                <p v-if="errors.last_name" class="text-xs text-rose-600 mt-1">{{ errors.last_name }}</p>
              </div>

              <div>
                <label class="block text-sm mb-1">Հայրանուն</label>
                <input
                    v-model="customerForm.middle_name"
                    :disabled="isLocked"
                    class="w-full border rounded-lg px-3 py-2"
                    placeholder="Հայրանուն"
                />
              </div>

              <div>
                <label class="block text-sm mb-1">Էլ. փոստ</label>
                <input
                    v-model="customerForm.email"
                    :disabled="isLocked"
                    type="email"
                    class="w-full border rounded-lg px-3 py-2"
                    placeholder="email@example.com"
                />
              </div>

              <div class="md:col-span-2 grid grid-cols-[160px_1fr] gap-2">
                <div>
                  <label class="block text-sm mb-1">Երկիր / Կոդ *</label>
                  <VueSelect
                      v-model="phoneCodeCode"
                      :options="phoneCodeOptions"
                      :is-multi="false"
                      :is-searchable="true"
                      :filterable="true"
                      :get-option-label="opt => opt.flag + ' +' + opt.code + ' ' + opt.name"
                      :get-option-value="opt => opt.code"
                      :disabled="isLocked"
                      placeholder="Ընտրել կոդ"
                  />
                  <p v-if="errors.phone_code" class="text-xs text-rose-600 mt-1">{{ errors.phone_code }}</p>
                </div>
                <div>
                  <label class="block text-sm mb-1">Հեռախոսահամար *</label>
                  <input
                      v-model="customerForm.phone_number"
                      @input="customerForm.phone_number = (customerForm.phone_number || '').toString().replace(/\D/g,'').slice(0,8)"
                      @blur="phoneTouched = true"
                      :disabled="isLocked"
                      class="border rounded-xl px-3 py-2 text-sm"
                      placeholder="Հեռախոսահամար"
                  />
                  <p v-if="phoneTouched && !phoneNumberValid" class="text-xs text-rose-600 mt-1">
                    Մուտքագրեք 8 նիշանոց հեռախոսահամար։
                  </p>
                  <p v-if="errors.phone_number" class="text-xs text-rose-600 mt-1">{{ errors.phone_number }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-5 py-3 border-t flex items-center justify-between">
            <div class="text-sm text-slate-600">
              Ընդամենը՝ <span class="font-semibold">{{ $money(total) }}</span>
            </div>
            <div class="flex items-center gap-2">
              <button class="px-3 py-2 rounded-lg border" @click="closeCheckout">Չեղարկել</button>
              <button
                  class="px-4 py-2 rounded-lg bg-emerald-600 text-white disabled:opacity-50"
                  :disabled="!checkoutValid || creating"
                  @click="confirmCheckout"
              >
                Հաստատել & Վճարել
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import VueSelect from 'vue3-select-component'
import { sales } from '@/api'
import SalesHistoryList from './CashRegisterSaleHistory.vue'

const tab = ref<'pos'|'history'>('pos')

/* ===================== SEARCH / BARCODE (unchanged) ===================== */
const searchQ = ref('')
const results = ref<any[]>([])
const searching = ref(false)
let sTimer: number|undefined

function debouncedSearch(){
  if (sTimer) window.clearTimeout(sTimer)
  sTimer = window.setTimeout(async () => {
    searching.value = true
    try {
      const { data } = await sales.sale.searchProducts({ search: searchQ.value || null, limit: 20, offset: 0 })
      results.value = Array.isArray(data?.data) ? data.data : []
    } finally { searching.value = false }
  }, 250)
}

const barcode = ref('')
const barcodeInput = ref<HTMLInputElement|null>(null)
// track blur so we only show the error after user interacts
const phoneTouched = ref(false)

// phone must be exactly 8 digits (e.g., 94465634)
const phoneNumberValid = computed(() =>
    /^\d{8}$/.test(String(customerForm.phone_number || ''))
)
function focusBarcode() { if (tab.value !== 'pos') return; requestAnimationFrame(() => barcodeInput.value?.focus()) }
function onWindowFocus() { focusBarcode() }
function onVisibility() { if (!document.hidden) focusBarcode() }
function scanBarcode(){ const code = (barcode.value || '').trim(); if (!code) return; findByBarcode(code); barcode.value=''; barcodeInput.value?.focus() }
async function findByBarcode(code:string){
  const { data } = await sales.sale.searchProducts({ barcode: code, limit: 1, offset: 0 })
  const p = Array.isArray(data?.data) && data.data[0] ? data.data[0] : null
  if (p) addToBasket(p, true)
}
let stream = ''; let lastTs = 0
window.addEventListener('keydown', (e: KeyboardEvent) => {
  if (tab.value !== 'pos') return
  const now = Date.now()
  if (now - lastTs > 35) stream = ''
  lastTs = now
  if (e.key.length === 1) stream += e.key
  if (e.key === 'Enter' && stream.length >= 5) {
    findByBarcode(stream)
    stream = ''
    focusBarcode()
  }
})

/* ===================== PRICING (tiers + discounts) ===================== */
function sortByLimitAsc(a:any, b:any){
  const al = a.until_qty == null ? Infinity : Number(a.until_qty)
  const bl = b.until_qty == null ? Infinity : Number(b.until_qty)
  if (al !== bl) return al - bl
  const as = Number(a.sort ?? 9999)
  const bs = Number(b.sort ?? 9999)
  return as - bs
}
function getPortionTiers(anyRowOrProduct:any){
  const prod = (anyRowOrProduct?.product ?? anyRowOrProduct) || {}
  const src = Array.isArray(prod.active_portions) ? prod.active_portions.slice().sort(sortByLimitAsc) : []
  if (!src.length) return [{ limit: Infinity, price: 0 }]

  let prevRaw = 0, prevUpd = 0
  const tiers: { limit:number; price:number }[] = []

  for (const p of src) {
    const rawLimit = p.until_qty == null ? Infinity : Number(p.until_qty)
    const price    = Number(p.price || 0)
    const sold     = Number(p.qty_sold_out || 0)

    const rawCap   = isFinite(rawLimit) ? Math.max(0, rawLimit - prevRaw) : Infinity
    const remaining= isFinite(rawCap) ? Math.max(0, rawCap - sold) : Infinity
    const updatedLimit = isFinite(remaining) ? prevUpd + remaining : Infinity

    tiers.push({ limit: updatedLimit, price })
    if (isFinite(rawLimit)) prevRaw = rawLimit
    prevUpd = updatedLimit
    if (!isFinite(rawLimit)) break
  }

  const last = tiers[tiers.length - 1]
  if (last && last.limit !== Infinity) tiers.push({ limit: Infinity, price: last.price })
  return tiers
}
function getDiscountTiers(anyRowOrProduct:any){
  const prod = (anyRowOrProduct?.product ?? anyRowOrProduct) || {}
  const src = Array.isArray(prod.active_discounts) ? prod.active_discounts.slice().sort(sortByLimitAsc) : []
  if (!src.length) return [{ limit: Infinity, percent: 0 }]

  let prevRaw = 0, prevUpd = 0
  const tiers: { limit:number; percent:number }[] = []

  for (const d of src) {
    const rawLimit = d.until_qty == null ? Infinity : Number(d.until_qty)
    const sold     = Number(d.qty_sold_out || 0)
    const percent  = d?.discount_setting?.discount?.percentage ? Number(d.discount_setting.discount.percentage) : 0

    const rawCap   = isFinite(rawLimit) ? Math.max(0, rawLimit - prevRaw) : Infinity
    const remaining= isFinite(rawCap) ? Math.max(0, rawCap - sold) : Infinity
    const updatedLimit = isFinite(remaining) ? prevUpd + remaining : Infinity

    tiers.push({ limit: updatedLimit, percent })
    if (isFinite(rawLimit)) prevRaw = rawLimit
    prevUpd = updatedLimit
    if (!isFinite(rawLimit)) break
  }

  const last = tiers[tiers.length - 1]
  if (last?.limit !== Infinity) tiers.push({ limit: Infinity, percent: 0 })
  else if (last && last.percent == null) last.percent = 0

  return tiers
}
function computeSegmentsFrom(anyRowOrProduct:any, start:number, qty:number){
  qty = Math.max(0, Number(qty || 0))
  start = Math.max(0, Number(start || 0))
  const pTiers = getPortionTiers(anyRowOrProduct)
  const dTiers = getDiscountTiers(anyRowOrProduct)
  if (qty === 0) return { segments: [], totalBase: 0, totalFinal: 0, lastUnit: { base:0, final:0, percent:0 } }

  let pi = 0, di = 0
  let takenGlobal = start
  let takenLocal  = 0
  const segs: Array<{qty:number;base:number;percent:number;final:number}> = []

  while (pi < pTiers.length - 1 && takenGlobal >= pTiers[pi].limit) pi++
  while (di < dTiers.length - 1 && takenGlobal >= dTiers[di].limit) di++

  while (takenLocal < qty) {
    const portion = pTiers[pi]
    const disc    = dTiers[di]
    const remainingLocal = qty - takenLocal
    const remPortion = portion.limit - takenGlobal
    const remDisc    = disc.limit - takenGlobal
    const slice      = Math.min(remainingLocal, remPortion, remDisc)
    if (!(slice > 0)) break

    const base = portion.price
    const percent = disc.percent
    const final = percent > 0 ? base * (1 - percent/100) : base
    segs.push({ qty: slice, base, percent, final })

    takenLocal  += slice
    takenGlobal += slice

    while (pi < pTiers.length - 1 && takenGlobal >= pTiers[pi].limit) pi++
    while (di < dTiers.length - 1 && takenGlobal >= dTiers[di].limit) di++
  }

  const totalBase  = segs.reduce((s, x) => s + x.qty * x.base, 0)
  const totalFinal = segs.reduce((s, x) => s + x.qty * x.final, 0)
  const last       = segs[segs.length - 1] || { base:0, final:0, percent:0 }
  return { segments: segs, totalBase, totalFinal, lastUnit: { base:last.base, final:last.final, percent:last.percent } }
}

/* ===================== helpers ===================== */
function product(row:any){ return row?.product ?? row }
function productId(row:any){ return Number(product(row)?.id ?? row?.id) }
function productName(row:any){ return String(product(row)?.name ?? row?.name ?? '') }
function measureOf(row:any){
  const prod = product(row)
  const fromPortion = prod?.active_portions?.[0]?.measure
  if (fromPortion) return fromPortion
  if (prod?.measure) return prod.measure
  const t = prod?.measure_type
  if (t === 'weight') return 'kg'
  if (t === 'length') return 'm'
  if (t === 'capacity') return 'l'
  return 'հատ'
}
function safeNum(v:any){ const n = Number(v); return Number.isFinite(n) ? n : 0 }
function availableOf(row:any){
  const a = safeNum(row?.qty_available)
  const d = safeNum(row?.qty_reserved_dispatch)
  const p = safeNum(row?.qty_reserved_production)
  return Math.max(0, a - d - p)
}
function formatQty(n:number){
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 3 }).format(n)
}

/* ===================== qty buffer ===================== */
const qtyBuffer = reactive<Record<number, number>>({})
function qtyFor(pid:number){ return qtyBuffer[pid] ?? 1 }
function updateQty(pid:number, val:string){
  const v = Number(val)
  qtyBuffer[pid] = (Number.isFinite(v) && v > 0) ? v : 1
}

/* ===================== basket ===================== */
type BasketRow = { product_id:number; name:string; qty:number; measure?:string; source:any }
const basket = ref<BasketRow[]>([])
function basketIndex(pid:number){ return basket.value.findIndex(b => b.product_id === pid) }
function basketQty(pid:number){ const i = basketIndex(pid); return i >= 0 ? basket.value[i].qty : 0 }

function displayLastUnit(row:any){ const pid = productId(row); const start = basketQty(pid); const q = Math.max(1, qtyFor(pid)); return computeSegmentsFrom(product(row), start, q).lastUnit }
function segmentsFor(row:any){ const pid = productId(row); const start = basketQty(pid); const q = qtyFor(pid); return computeSegmentsFrom(product(row), start, q).segments }
function totalFinalFor(row:any){ const pid = productId(row); const start = basketQty(pid); const q = qtyFor(pid); return computeSegmentsFrom(product(row), start, q).totalFinal }

function canAddQty(row:any){
  const pid = productId(row)
  const already = basketQty(pid)
  const want = qtyFor(pid)
  return already + want <= availableOf(row) && want > 0
}
function addToBasket(row:any, byBarcode=false){
  const pid = productId(row)
  const name = productName(row)
  const measure = measureOf(row)
  const available = availableOf(row)
  const already = basketQty(pid)
  let want = byBarcode ? 1 : qtyFor(pid)

  const left = Math.max(0, available - already)
  if (left <= 0) { alert('Չկա բավարար մնացորդ'); return }
  if (want > left) {
    want = left
    alert('Քանակը կսահմանափակվի առկա մնացորդով')
  }

  const i = basketIndex(pid)
  if (i >= 0) basket.value[i].qty += want
  else basket.value.push({ product_id: pid, name, qty: want, measure, source: product(row) })

  qtyBuffer[pid] = 1
}
function removeFromBasket(pid:number){ basket.value = basket.value.filter(b => b.product_id !== pid) }
function clearBasket(){ basket.value = [] }
function basketSegments(line: BasketRow){ return computeSegmentsFrom(line.source, 0, line.qty).segments }
function basketLineTotal(line: BasketRow){ return computeSegmentsFrom(line.source, 0, line.qty).totalFinal }
function lastUnitForBasket(line: BasketRow){ return computeSegmentsFrom(line.source, 0, line.qty).lastUnit }
const total = computed(() => basket.value.reduce((s, l) => s + basketLineTotal(l), 0))

/* ===================== Payment ===================== */
const payment = reactive<{ method:'cash'|'card'|'mixed'; amount_cash?: number; amount_card?: number }>({
  method: 'cash',
  amount_cash: undefined,
  amount_card: undefined,
})
const creating = ref(false)
const error = ref('')

watch(() => payment.method, (m) => {
  if (m !== 'mixed') {
    payment.amount_cash = undefined
    payment.amount_card = undefined
  }
})
const totalCents = computed(() => Math.round(total.value * 100))
const mixedCents  = computed(() => Math.round(Number(payment.amount_cash ?? 0) * 100 + Number(payment.amount_card ?? 0) * 100))
const mixedError = computed(() => {
  if (payment.method !== 'mixed') return ''
  const cashFilled = payment.amount_cash !== undefined && payment.amount_cash !== null && payment.amount_cash !== ''
  const cardFilled = payment.amount_card !== undefined && payment.amount_card !== null && payment.amount_card !== ''
  if (!cashFilled || !cardFilled) return 'Լրացրեք «Կանխիկ գումար» և «Քարտի գումար» դաշտերը.'
  if (mixedCents.value !== totalCents.value) return 'Կանխիկ + Քարտ գումարները պետք է հավասար լինեն ընդհանուր գումարին.'
  return ''
})


/* ===================== CHECKOUT MODAL (customers + form) ===================== */
const checkoutOpen = ref(false)
function openCheckout(){
  if (!canSubmit.value) {
    error.value = payment.method === 'mixed'
        ? (mixedError.value || 'Լրացրեք վճարման տվյալները')
        : 'Լրացրեք վաճառքի տվյալները'
    return
  }
  error.value = ''
  checkoutOpen.value = true
}
function closeCheckout(){ checkoutOpen.value = false }

/* customer select */
const loading = reactive({ customers: false })
const selectedCustomer = ref<any | null>(null)
const customerOptions = ref<any[]>([])

async function fetchCustomers(q: string | null){
  loading.customers = true
  try {
    const { data } = await sales.customers.list({ q: q || null, limit: 20, offset: 0 })
    customerOptions.value = Array.isArray(data?.data) ? data.data : []
  } finally { loading.customers = false }
}
function customerLabel(c:any){
  const fn = c?.first_name || ''
  const ln = c?.last_name || ''
  const pn = c?.phone_number || c?.phone || ''
  const cc = c?.phone_code ? '+' + c.phone_code : ''
  return `${fn} ${ln} ${cc ? '('+cc+' '+pn+')' : pn}`.trim()
}

/* customer form state */
const customerForm = reactive<{ first_name:string; last_name:string; middle_name?:string; email?:string; phone_code?:string; phone_number?:string }>({
  first_name: '', last_name: '', middle_name: '', email: '', phone_code: '', phone_number: ''
})
const errors = reactive<Record<string, string>>({})
const customerLocked = computed(() => !!selectedCustomer?.value)

/* phone code picker */
const phoneCodeOptions = [
  { code: '374', name: 'Armenia',    flag: '🇦🇲' },
  { code: '7',   name: 'Russia',     flag: '🇷🇺' },
  { code: '995', name: 'Georgia',    flag: '🇬🇪' },
  { code: '90',  name: 'Turkey',     flag: '🇹🇷' },
  { code: '1',   name: 'USA/Canada', flag: '🇺🇸' },
  { code: '380', name: 'Ukraine',    flag: '🇺🇦' },
  { code: '49',  name: 'Germany',    flag: '🇩🇪' },
  { code: '33',  name: 'France',     flag: '🇫🇷' },
  { code: '44',  name: 'UK',         flag: '🇬🇧' },
]
const phoneCode = ref<{code:string;name:string;flag:string} | null>(null)
function onPickCode(opt:any){
  phoneCode.value = opt
  customerForm.phone_code = opt?.code || ''
}
// Phone code as a string (e.g. "374")
const phoneCodeCode = ref<string>('')

// whenever the select changes, copy the numeric code into the form
watch(phoneCodeCode, (val) => {
  customerForm.phone_code = (val || '').toString().replace(/\D/g, '')
})
/* when picking an existing customer -> fill & lock */
function onCustomerPick(val:any){
  // val might be an object OR an id depending on the select's get-option-value
  const picked = (val && typeof val === 'object')
      ? val
      : customerOptions.value.find(o => o?.id === val) || null

  // keep v-model type intact (likely ID), only update form fields
  selectedCustomer.value = val ?? null

  if (picked) {
    customerForm.first_name   = picked.first_name   ?? ''
    customerForm.last_name    = picked.last_name    ?? ''
    customerForm.middle_name  = picked.middle_name  ?? ''
    customerForm.email        = picked.email        ?? ''
    customerForm.phone_code   = (picked.phone_code ?? '').toString()
    customerForm.phone_number = (picked.phone_number ?? picked.phone ?? '').toString().replace(/\D/g,'').slice(0,8)
    // update visible code select
    phoneCodeCode.value = customerForm.phone_code || ''
  }
  phoneTouched.value = false
}

function clearPickedCustomer(){
  selectedCustomer.value = null
  customerForm.first_name = ''
  customerForm.last_name = ''
  customerForm.middle_name = ''
  customerForm.email = ''
  customerForm.phone_code = ''
  customerForm.phone_number = ''
  phoneCodeCode.value = ''   // reset the select
  phoneTouched.value = false
}

/* simple validation for *new* customer */
function validateCustomer(): boolean {
  for (const k of Object.keys(errors)) delete errors[k]
  if (!customerLocked.value) {
    if (!customerForm.first_name?.trim()) errors.first_name = 'Անունը պարտադիր է'
    if (!customerForm.last_name?.trim())  errors.last_name  = 'Ազգանունը պարտադիր է'
    if (!customerForm.phone_code?.trim()) errors.phone_code = 'Կոդը պարտադիր է'
    if (!customerForm.phone_number?.trim()) errors.phone_number = 'Հեռախոսահամարը պարտադիր է'
  }
  return Object.keys(errors).length === 0
}
function fieldErr(name:string){ return errors[name] ? 'border-rose-400' : '' }
const checkoutValid = computed(() => {
  if (!basket.value.length) return false

  // if a customer was picked, fields are locked and considered valid
  const basicValid = customerLocked.value
      ? true
      : !!customerForm.first_name &&
      !!customerForm.last_name &&
      !!customerForm.phone_code &&
      phoneNumberValid.value

  const paymentsOk = payment.method !== 'mixed'
      ? true
      : mixedError.value === ''

  return basicValid && paymentsOk
})

// Only require basket (and valid mixed split) for opening the modal
const canSubmit = computed(() => {
  if (!basket.value.length) return false
  return payment.method !== 'mixed' ? true : mixedError.value === ''
})

/* submit from modal */
async function confirmCheckout(){
  if (!checkoutValid.value) return
  if (!validateCustomer()) return

  try{
    creating.value = true
    error.value = ''

    const items = basket.value.map(l => ({
      product_id: l.product_id,
      qty: l.qty,
      price: lastUnitForBasket(l).final,
    }))

    // Always send full customer payload; include id if a customer was picked
    const idOrObj = selectedCustomer.value
    const selId =
        (idOrObj && typeof idOrObj === 'object') ? idOrObj.id :
            (typeof idOrObj === 'number' || typeof idOrObj === 'string') ? idOrObj : undefined

    const customer = {
      ...(selId !== undefined ? { id: selId } : {}),
      first_name: (customerForm.first_name || '').trim(),
      last_name:  (customerForm.last_name  || '').trim(),
      middle_name: customerForm.middle_name || null,
      email:        customerForm.email || null,
      phone_code:   (customerForm.phone_code || '').replace(/\D/g, ''),
      phone_number: (customerForm.phone_number || '').replace(/\D/g, ''),
    }

    const payload = {
      items,
      payment: {
        method: payment.method,
        amount_cash: payment.method==='mixed' ? (payment.amount_cash ?? 0) : null,
        amount_card: payment.method==='mixed' ? (payment.amount_card ?? 0) : null,
      },
      customer, // <- full data sent here
    }

    await sales.sale.createOutput(payload)
    // success
    clearBasket()
    closeCheckout()
    tab.value = 'history'
  } catch (e:any) {
    error.value = e?.message || 'Չհաջողվեց պահել վաճառքը'
  } finally {
    creating.value = false
  }
}

/* mounts */
onMounted(() => {
  focusBarcode()
  window.addEventListener('focus', onWindowFocus)
  document.addEventListener('visibilitychange', onVisibility)
})
onBeforeUnmount(() => {
  window.removeEventListener('focus', onWindowFocus)
  document.removeEventListener('visibilitychange', onVisibility)
})
watch(tab, (t) => { if (t === 'pos') focusBarcode() })

const checkout = reactive({
  open: false,
  customerOptions: [] as any[],
  selectedCustomer: null as any | null,

  // form model
  form: {
    first_name: '',
    last_name: '',
    middle_name: '',
    email: '',
    phone_code: '',    // only digits, e.g. "374"
    phone_number: ''   // only digits, e.g. "94465634"
  }
})

// fields are locked while a customer is selected
const isLocked = computed(() => !!selectedCustomer.value)

// robust phone parsing (works with phone_code/phone_number OR a single phone string)
function parsePhoneParts(c: any) {
  let code = String(c?.phone_code ?? '').replace(/\D/g, '')
  let num  = String(c?.phone_number ?? '').replace(/\D/g, '')
  if (!code && !num && c?.phone) {
    const digits = String(c.phone).replace(/\D/g, '')
    // assume last 8 digits are the number if a code is present
    if (digits.length >= 9) {
      code = digits.slice(0, digits.length - 8)
      num  = digits.slice(-8)
    } else {
      num = digits
    }
  }
  return { code, num }
}

function fillFromCustomer(c: any) {
  if (!c) return
  customerForm.first_name   = c.first_name   ?? ''
  customerForm.last_name    = c.last_name    ?? ''
  customerForm.middle_name  = c.middle_name  ?? ''
  customerForm.email        = c.email        ?? ''
  const { code, num } = parsePhoneParts(c)
  customerForm.phone_code   = code
  customerForm.phone_number = num
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity .2s ease }
.fade-enter-from, .fade-leave-to { opacity: 0 }
</style>
