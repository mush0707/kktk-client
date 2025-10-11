<template>
  <div v-if="open" class="fixed inset-0 z-50">
    <!-- overlay -->
    <div class="absolute inset-0 bg-black/40" @click="$emit('close')"></div>

    <!-- drawer -->
    <div class="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl
                animate-[slideIn_.2s_ease-out] overflow-y-auto">
      <div class="p-5 border-b flex items-center justify-between">
        <h3 class="text-lg font-semibold">
          Բաշխում · {{ product.application_order_product.product?.name }} <span class="text-xs text-gray-500"></span>
        </h3>
        <button class="p-2 rounded hover:bg-gray-100" @click="$emit('close')">✕</button>
      </div>

      <div class="p-5 space-y-5">

        <!-- Available warehouses -->
        <div v-if="filteredAvailable.length" class="rounded-xl border border-gray-300 overflow-hidden">
          <div class="px-4 py-2 bg-gray-50 border-b text-sm font-medium">
            Հասանելի պահեստների ցանկ
          </div>
          <div class="p-3 space-y-2">
            <!--            <div class="flex gap-2">-->
            <!--              <input v-model.trim="wSearch" class="px-3 py-2 rounded-xl border w-full" placeholder="Փնտրել պահեստով…"/>-->
            <!--            </div>-->

            <div v-if="wLoading" class="text-sm text-gray-500">Բեռնվում է…</div>
            <div v-else class="space-y-2 max-h-56 overflow-y-auto">
              <div v-for="w in filteredAvailable" :key="w.storage_id"
                   class="flex items-center justify-between gap-2 border border-gray-300 rounded-xl px-3 py-2">
                <div class="font-medium truncate">{{ w.name }}</div>
                <button class="px-3 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700"
                        @click="chooseWarehouse(w)">Ընտրել
                </button>
              </div>
              <div v-if="filteredAvailable.length===0" class="text-sm text-gray-500 px-1">
                Ցանկը դատարկ է
              </div>
            </div>
          </div>
        </div>
        <div class="flex items-center justify-between text-sm px-1">
          <div class="text-gray-600">
            Պարտադիր՝ <span class="font-medium">{{
              fmt(requiredQty)
            }} {{ $t(product?.application_order_product?.measure) || '' }}</span>
          </div>
          <div :class="remaining>0 ? 'text-amber-700' : remaining<0 ? 'text-rose-700' : 'text-emerald-700'">
            Մնացորդ՝ <span class="font-semibold">{{ fmt(remaining) }}</span>
          </div>
        </div>
        <!-- Selected warehouses with qty -->
        <div class="rounded-xl border border-gray-300 overflow-hidden">
          <div class="px-4 py-2 bg-gray-50 border-b text-sm font-medium">
            Ընտրված պահեստներ
          </div>
          <div class="p-3 space-y-2" v-if="selected.length">
            <div v-for="(s,i) in selected" :key="s.storage_id" class="border border-gray-300 rounded-xl p-3 space-y-2">
              <div class="flex items-center justify-between">
                <div class="font-medium">{{ s.name }}</div>
                <div class="flex items-center gap-2">
                  <button
                      class="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                      @click="openBalance(s)">Տեսնել մնացորդները
                  </button>
                  <button
                      class="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                      @click="removeSelected(i)">Հեռացնել
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-5 gap-2 items-end">
                <div class="col-span-3">
                  <label class="text-sm text-gray-600">Մուտքագրել քանակ</label>
                  <input v-model.number="s.qty" type="number" min="0" step="0.01"
                         class="w-full px-3 py-2 rounded-xl border border-gray-300"
                         @input="clampQty(i)"/>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="p-4 text-sm text-gray-500">Դեռ ոչ մի պահեստ ընտրված չէ</div>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-2">
          <button class="px-3 py-2 rounded-xl border hover:bg-gray-50" @click="$emit('close')">Փակել</button>
          <button class="px-3 py-2 rounded-xl text-white"
                  :class="canSubmit ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-gray-400 cursor-not-allowed'"
                  :disabled="!canSubmit" @click="submit">
            {{ submitting ? 'Ուղարկվում է…' : 'Պահպանել բաշխումը' }}
          </button>
        </div>
      </div>
    </div>

    <!-- balance modal -->
    <StockBalanceModal
        :open="balance.open"
        :storage="balance.storage"
        :product="product.application_order_product.product"
        @close="balance.open=false"
    />
  </div>
</template>

<script setup lang="ts">
import {ref, computed, watch, onMounted} from 'vue'
import StockBalanceModal from '@/views/storages/components/StockBalanceModal.vue'
import {ordersApi, storagesApi} from '@/api.js'

const props = defineProps<{ open: boolean, product: any | null }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const wLoading = ref(false)
const wSearch = ref('')
const warehouses = ref<Array<{ storage_id: number; name: string }>>([])
const selected = ref<Array<{ storage_id: number; name: string; qty: number | null }>>([])
const submitting = ref(false)
const num = (v: any) => (v == null || v === '') ? 0 : Number(v)
const round6 = (v: number) => Math.round(v * 1e6) / 1e6
const eq6 = (a: number, b: number) => Math.abs(a - b) <= 1e-6

// պարտադիր բաշխվելիք քանակը
const requiredQty = computed(() =>
    round6(num(props.product?.application_order_product?.qty ?? props.product?.qty ?? 0))
)

// ընտրված պահեստների ընդհանուր քանակ
const totalSelected = computed(() =>
    round6(selected.value.reduce((s, x) => s + num(x.qty), 0))
)

// մնացորդը (պետք է դառնա 0)
const remaining = computed(() => round6(requiredQty.value - totalSelected.value))

// submit-ը միայն երբ ամբողջությամբ բաշխված է
const canSubmit = computed(() =>
    selected.value.length > 0 &&
    eq6(totalSelected.value, requiredQty.value) &&
    !submitting.value
)

function clampQty(i: number) {
  const other = round6(totalSelected.value - num(selected.value[i].qty))
  const maxForThis = round6(requiredQty.value - other)
  if (num(selected.value[i].qty) > maxForThis) selected.value[i].qty = maxForThis
  if (num(selected.value[i].qty) < 0) selected.value[i].qty = 0
}

async function reloadWarehouses() {
  if (!props.product) return
  wLoading.value = true
  try {
    // հարմարեցրու քո backend-ին — եթե կա type կամ product_id filter, փոխանցիր
    const data = await storagesApi.getMatchedStoragePointsByProductTypeId(props.product.application_order_product.product.type_id)
    const list = data?.data ?? data ?? []
    // հանում ենք արդեն ընտրված պահեստները
    const chosenIds = new Set(selected.value.map(s => s.storage_id))
    warehouses.value = list
        .map((w: any) => ({storage_id: Number(w.storage_id), name: String(w.storage.address)}))
        .filter(w => !chosenIds.has(w.storage_id))
  } finally {
    wLoading.value = false
  }
}

onMounted(() => {
  if (props.open) reloadWarehouses()
})
watch(() => props.open, v => {
  if (v) {
    selected.value = [];
    wSearch.value = '';
    reloadWarehouses()
  }
})

function chooseWarehouse(w: { storage_id: number; name: string }) {
  selected.value.push({...w, qty: null})
  warehouses.value = warehouses.value.filter(x => x.storage_id !== w.storage_id)
}

function removeSelected(i: number) {
  const s = selected.value[i]
  selected.value.splice(i, 1)
  warehouses.value.push({storage_id: s.storage_id, name: s.name})
}

const filteredAvailable = computed(() => {
  const q = wSearch.value.trim().toLowerCase()
  if (!q) return warehouses.value
  return warehouses.value.filter(w => w.name.toLowerCase().includes(q))
})

/* Balances modal */
const balance = ref<{ open: boolean, storage: any | null }>({open: false, storage: null})

function openBalance(s: any) {
  balance.value = {open: true, storage: s}
}

/* Submit distribution (adapt endpoint) */
async function submit() {
  if (!canSubmit.value) return
  submitting.value = true
  try {
    console.log(selected.value)
    const payload = {
      product_id: props.product?.product_id ?? props.product?.id,
      items: selected.value.map(s => ({
        storage_id: s.storage_id,
        qty: Number(s.qty || 0),
        measure: props.product.application_order_product.measure
      })),
    }
    await ordersApi.distributeStageProductRow(props.product?.id, payload)
    const emitted = {
      productId: props.product?.application_order_product?.id
          ?? props.product?.id,
      items: selected.value.map(s => ({
        storage_id: s.storage_id,
        storage_name: s.name,
        qty: round6(num(s.qty)),
      })),
    }
    emit('distributed', emitted)
    emit('close')
  } finally {
    submitting.value = false
  }
}

/* fmt */
function fmt(v: any) {
  if (v == null || v === '') return '—';
  const n = Number(v);
  return isFinite(n) ? new Intl.NumberFormat('hy-AM', {
    maximumFractionDigits: 6,
    useGrouping: false
  }).format(n) : String(v)
}
</script>

<style scoped>
@keyframes slideIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}
</style>
