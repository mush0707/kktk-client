<template>
  <div v-if="open" class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/30" @click="close"></div>

    <div
        class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-xl w-full max-w-2xl"
    >
      <div class="flex items-center justify-between px-5 py-3 border-b">
        <h3 class="text-lg font-semibold">
          {{ form.id ? 'Չափաբաժնի խմբագրում' : 'Նոր չափաբաժին' }}
        </h3>
        <button class="px-3 py-1 rounded-xl border" @click="close">✕</button>
      </div>

      <div class="p-5 space-y-4 text-sm">
        <div class="grid md:grid-cols-2 gap-3">
          <!-- Product picker (only when not locked by productContextId) -->
          <div v-if="!lockedProductId" class="md:col-span-2">
            <ProductAutocomplete
                v-model="selectedProduct"
                label="Ապրանք"
                :required="true"
                :error="errors.product_id"
            />
            <!-- STOCK PREVIEW -->
            <div v-if="stockLoaded" class="mt-3 grid grid-cols-3 gap-2 text-xs">
              <div class="rounded-lg border border-gray-200 p-2">
                <div class="text-slate-500">Առկա</div>
                <div class="font-semibold">{{ stock.qty_available }}</div>
              </div>
              <div class="rounded-lg border border-gray-200 p-2">
                <div class="text-slate-500">Պահ. (առաքում)</div>
                <div class="font-semibold">{{ stock.qty_reserved_dispatch }}</div>
              </div>
              <div class="rounded-lg border border-gray-200 p-2">
                <div class="text-slate-500">Պահ. (արտադրություն)</div>
                <div class="font-semibold">{{ stock.qty_reserved_production }}</div>
              </div>
            </div>
          </div>

          <!-- Price -->
          <div class="flex flex-col gap-y-2">
            <label>Գին (֏) <span class="text-red-500">*</span></label>
            <input
                v-model.number="form.price"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="1000"
                class="border border-gray-300 rounded-xl px-3 py-2"
                :disabled="readOnlyByStatus"
            />
          </div>

          <div class="col-span-2 flex gap-x-2">
            <!-- Until qty -->
            <div class="flex flex-col gap-y-2">
              <label>Քանակ (մինչև)</label>
              <input
                  v-model.number="formUntil"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="1"
                  class="border border-gray-300 rounded-xl px-3 py-2"
                  :disabled="readOnlyByStatus"
              />
            </div>

            <!-- Measure (always disabled; derived) -->
            <div class="flex flex-col gap-y-2">
              <label>Չափման միավոր</label>
              <select
                  v-model="formMeasure"
                  class="border border-gray-300 rounded-xl px-3 py-2"
                  disabled
              >
                <option v-for="m in measureOptions" :key="m" :value="m">
                  {{ $t(m) }}
                </option>
              </select>
              <p class="text-[11px] text-slate-500 mt-1">
                Չափման միավորը որոշվում է ապրանքի տեսակից։
              </p>
            </div>
          </div>
        </div>

        <div class="flex gap-2">
          <button
              class="bg-blue-600 text-white px-4 py-2 rounded-xl disabled:opacity-50"
              :disabled="saving || !valid"
              @click="save"
          >
            {{ form.id ? 'Պահպանել' : 'Ստեղծել' }}
          </button>
          <button class="px-4 py-2 rounded-xl border" @click="resetForm">Մաքրել</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, watch, ref } from 'vue'
import { sales } from '@/api'
import ProductAutocomplete from '@/views/sales/components/products/ProductAutocomplete.vue'
import type { ProductPortion } from '@/types/sales/portions'

type MeasureType = null | 'weight' | 'length' | 'capacity'
type SelectedProduct = { id: number; name: string; measure_type?: MeasureType | null }

const props = defineProps<{
  open: boolean
  defaultMeasure?: string           // from parent (measureFromRow)
  item?: ProductPortion | null      // edit
  productContextId?: number | null  // create from product row (locked)
}>()
const emit = defineEmits<{ (e:'update:open', v:boolean):void; (e:'saved'):void }>()

const saving = ref(false)
const errors = reactive<{ product_id?: string; price?: string }>({})

const lockedProductId = computed(() => props.productContextId ?? null)
const selectedProduct = ref<SelectedProduct | null>(null)

/* STOCK */
const stock = reactive({
  qty_available: 0,
  qty_reserved_dispatch: 0,
  qty_reserved_production: 0,
})
const stockLoaded = ref(false)
async function fetchStock(productId: number) {
  stockLoaded.value = false
  try {
    const { data } = await sales.products.stock.getByProductId(productId)
    const s = data?.data || {}
    stock.qty_available = Number(s.qty_available ?? 0)
    stock.qty_reserved_dispatch = Number(s.qty_reserved_dispatch ?? 0)
    stock.qty_reserved_production = Number(s.qty_reserved_production ?? 0)
  } finally {
    stockLoaded.value = true
  }
}

/** Form */
const form = reactive<{
  id?: number
  product_id: number | null
  price: number | null
  until_qty?: number | null
  measure?: string | null
  qty_until?: number | null
  qty_measure?: string | null
  status?: string
}>({
  id: undefined,
  product_id: null,
  price: null,
  until_qty: null,
  measure: null,
  qty_until: null,
  qty_measure: null,
  status: undefined,
})

/** Mapping for derived measures */
const DEFAULT_MEASURE_BY_TYPE: Record<Exclude<MeasureType, null>, string> = {
  weight: 'kg',
  length: 'm',
  capacity: 'l',
}
function fixedMeasureForType(t: MeasureType | undefined | null): string {
  if (!t) return 'piece'
  return DEFAULT_MEASURE_BY_TYPE[t] ?? 'piece'
}

/** Derivation rules
 * - EDIT mode: keep item's saved measure
 * - If product is LOCKED (opened from row): use parent's defaultMeasure (already computed from the row)
 * - Otherwise (toolbar create): if selected product has measure_type → derive from it; else fallback to defaultMeasure/piece
 */
function deriveMeasure(): string {
  if (props.item?.measure) return String(props.item.measure)

  if (lockedProductId.value) {
    return (props.defaultMeasure?.trim() || 'piece')
  }

  if (selectedProduct.value?.measure_type) {
    return fixedMeasureForType(selectedProduct.value.measure_type)
  }

  return (props.defaultMeasure?.trim() || 'piece')
}

function setDerivedMeasureIntoForm() {
  const m = deriveMeasure()
  if (form.id) {
    form.qty_measure = m
    form.measure = m
  } else {
    form.measure = m
    form.qty_measure = null
  }
}

function resetFormToCreate() {
  form.id = undefined
  form.product_id = lockedProductId.value || null
  form.price = null
  form.until_qty = null
  form.qty_until = null
  form.status = undefined

  if (!lockedProductId.value) {
    selectedProduct.value = null
    stockLoaded.value = false
  }

  setDerivedMeasureIntoForm()
}

/** Bindings */
const formUntil = computed({
  get: () => (form.id ? form.qty_until : form.until_qty),
  set: (v: number | null) => {
    if (form.id) form.qty_until = v
    else form.until_qty = v
  }
})
const formMeasure = computed({
  get: () => (form.id ? (form.qty_measure ?? form.measure) : form.measure),
  set: (v: string | null) => {
    if (form.id) form.qty_measure = v ?? null
    form.measure = v ?? null
  }
})

/** Options — single visible value; select is disabled */
const measureOptions = computed(() => {
  const m = formMeasure.value || deriveMeasure()
  return [m || 'piece']
})

const readOnlyByStatus = computed(() => !!props.item && props.item.status !== 'pending')

/** OPEN watcher — reset correctly on every open */
watch(() => props.open, (isOpen) => {
  if (!isOpen) return
  if (props.item) {
    // EDIT: keep item values; still normalize measure
    form.id        = props.item.id as any
    form.product_id= (props.item as any).product_id ?? form.product_id
    form.price     = (props.item.price ?? null) as any
    form.until_qty = (props.item.until_qty ?? null) as any
    setDerivedMeasureIntoForm()
  } else {
    // CREATE: full clean reset
    resetFormToCreate()
  }

  if (lockedProductId.value) {
    fetchStock(lockedProductId.value)
  }
}, { immediate: true })

/** When parent changes the locked product id (open from row) */
watch(() => props.productContextId, (pid) => {
  if (!props.open) return
  if (pid) {
    form.product_id = pid
    fetchStock(pid)
    setDerivedMeasureIntoForm()
  }
})

/** Ensure selected product carries measure_type; if not, fetch once */
async function ensureMeasureType(p: SelectedProduct | null) {
  if (!p?.id) return
  if (p.measure_type == null) {
    try {
      const { data } = await (sales as any).products.getById(p.id)
      const mt = data?.data?.measure_type ?? null
      selectedProduct.value = { ...p, measure_type: mt }
    } catch {
      // ignore; fallback logic will use defaultMeasure/piece
    }
  }
}

/** Product selection change → prefer product.measure_type over defaultMeasure */
watch(selectedProduct, async (p) => {
  if (lockedProductId.value) return // ignore if locked by row
  form.product_id = p?.id ?? null
  await ensureMeasureType(p)
  setDerivedMeasureIntoForm()
  if (p?.id) fetchStock(p.id)
  else stockLoaded.value = false
})

/** Also react if parent defaultMeasure changes while open */
watch(() => props.defaultMeasure, () => {
  if (!props.open) return
  setDerivedMeasureIntoForm()
})

/** Valid state */
const valid = computed(() =>
    (!!form.product_id || !!lockedProductId.value) &&
    !!form.price && Number(form.price) > 0
)

/** Actions */
function resetForm() { resetFormToCreate() }
function close() { emit('update:open', false) }

async function save() {
  if (!valid.value) return
  saving.value = true
  try {
    if (form.id) {
      await sales.products.portions.update(form.id, {
        product_id: form.product_id!,
        price: form.price!,
        until_qty: form.qty_until ?? undefined,
        measure: form.qty_measure ?? undefined,
      })
    } else {
      await sales.products.portions.create({
        product_id: form.product_id ?? lockedProductId.value!,
        price: form.price!,
        until_qty: form.until_qty ?? undefined,
        measure: form.measure ?? undefined,
      })
    }
    emit('saved')
    close()
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
/* no extra styles */
</style>
