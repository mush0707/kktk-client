<!-- src/views/storages/mfg/MoDetail.vue -->
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
            <router-link
                :to="`/storages/${storageId}/manufacturing`"
                class="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-slate-100"
            >
              <span class="underline-offset-2 hover:underline">Արտադրամաս</span>
            </router-link>
          </li>
          <li aria-hidden="true" class="px-1">
            <svg class="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
              <path d="M7.05 3.55a1 1 0 0 1 1.4 0l4.5 4.5a1 1 0 0 1 0 1.4l-4.5 4.5a1 1 0 0 1-1.4-1.4L10.79 10 7.05 6.26a1 1 0 0 1 0-1.41z"/>
            </svg>
          </li>
          <li>
            <p class="inline-flex items-center gap-1 rounded-md px-2 py-1">
              <span class="underline-offset-2 hover:underline">Սեսիա № {{ mo?.number }}</span>
            </p>
          </li>
        </ol>
      </nav>
    </div>

    <!-- Սեսիայի գլխիք -->
    <div class="px-4">
      <div class="bg-white border border-gray-300 rounded-xl p-4 flex items-center justify-between">
        <div class="space-y-2">
          <span class="text-xs px-2 py-1 rounded" :class="badgeClass(mo?.status)">{{ mo?.status ? $t(mo?.status) : null }}</span>
          <div class="text-xl font-semibold">Սեսիա № {{ mo?.number }}</div>
          <div class="text-sm text-gray-600">
            Ստեղծված՝
            <span :title="mo?.created_at">{{ formatDateTime(mo?.created_at) }}</span>
            <span class="text-xs text-gray-400 ml-2">({{ fromNow(mo?.created_at) }})</span>
          </div>
          <div class="text-sm text-gray-600">
            <span v-if="mismatchWarning" class="ml-2 text-rose-600">(զգուշացում՝ չի համընկնում route storage-ի հետ)</span>
          </div>
        </div>
        <div class="flex gap-2 items-center">
          <button
              v-if="canComplete"
              class="px-3 py-2 rounded-xl border bg-emerald-600 text-white hover:bg-emerald-700"
              @click="completeMO"
          >
            Ավարտել սեսիան
          </button>
        </div>
      </div>
    </div>

    <!-- Սպառում / Ելքեր -->
    <div class="px-4 grid md:grid-cols-2 gap-4">
      <!-- Սպառում -->
      <div class="bg-white border border-gray-300 rounded-xl p-4">
        <div class="flex items-center justify-between mb-3">
          <div class="font-medium">Սպառում</div>
        </div>
        <table class="min-w-full text-sm">
          <thead>
          <tr class="bg-gray-50">
            <th class="px-3 py-2 text-left">Ապրանք</th>
            <th class="px-3 py-2 text-right">Քանակ</th>
            <th class="px-3 py-2 text-left">Ժամանակ</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="c in consumptions" :key="c.id" class="border-t">
            <td class="px-3 py-2">{{ c.product?.name || c.product_id }}</td>
            <td class="px-3 py-2 text-right">{{ formatQty(c.qty) }} {{ $t(c.storage_product.measure ?? 'piece') }}</td>
            <td class="px-3 py-2 text-gray-500">
              <span :title="c.consumed_at">{{ formatDateTime(c.consumed_at) }}</span>
            </td>
          </tr>
          <tr v-if="!loading && consumptions.length === 0">
            <td colspan="3" class="px-3 py-6 text-center text-gray-500">Տվյալներ չկան</td>
          </tr>
          </tbody>
        </table>
      </div>

      <!-- Ելքեր -->
      <div class="bg-white border border-gray-300 rounded-xl p-4">
        <div class="flex items-center justify-between mb-3">
          <div class="font-medium">Ելքեր (→ {{ storage?.address }} staging)</div>
          <button v-if="mo?.status !== 'completed' && mo?.status !== 'cancelled'" class="px-3 py-2 rounded-xl border hover:bg-gray-50" @click="toggleAdd = !toggleAdd">
            Ավելացնել ելք
          </button>
        </div>

        <div v-if="toggleAdd" class="flex gap-2 mb-3 flex-wrap items-center">
          <!-- Ապրանք dropdown՝ ֆիլտրած պահեստի խմբով -->
          <div class="min-w-[280px]">
            <select v-model.number="productId" class="border rounded-xl px-3 py-2 w-full" @change="onProductChange">
              <option :value="undefined">— Ընտրել ապրանք —</option>
              <option v-for="p in productOptions" :key="p.id" :value="p.id">
                {{ p.name }}
                <span v-if="normChars(p).length">
                  — {{ normChars(p).map(c => c.name).join(', ') }}
                </span>
              </option>
            </select>
          </div>

          <!-- Քանակ -->
          <input v-model.number="qty" type="number" step="0.001" min="0"
                 class="border rounded-xl px-3 py-2 w-40" placeholder="Քանակ" />

          <!-- Միավոր՝ կախված measure_type-ից -->
          <div>
            <template v-if="selectedMeasureType === 'weight'">
              <select v-model="unit" class="border rounded-xl px-3 py-2">
                <option value="kg">կգ</option>
                <option value="g">գ</option>
                <option value="tonn">տ</option>
              </select>
            </template>

            <template v-else-if="selectedMeasureType === 'capacity'">
              <select v-model="unit" class="border rounded-xl px-3 py-2">
                <option value="l">լ</option>
                <option value="ml">մլ</option>
              </select>
            </template>

            <template v-else-if="selectedMeasureType === 'length'">
              <select v-model="unit" class="border rounded-xl px-3 py-2">
                <option value="m">մ</option>
                <option value="cm">սմ</option>
                <option value="mm">մմ</option>
              </select>
            </template>

            <template v-else>
              <span class="text-sm text-gray-500">հատ</span>
            </template>
          </div>

          <button
              class="px-3 py-2 rounded-xl border bg-gray-900 text-white hover:bg-gray-800"
              :disabled="!productId || qty <= 0 || saving"
              @click="addOutput"
          >
            {{ saving ? 'Գրանցվում է…' : 'Ավելացնել' }}
          </button>
        </div>

        <!-- Outputs table՝ ավելացրի «Մ/Չափ» սյունակ -->
        <table class="min-w-full text-sm">
          <thead>
          <tr class="bg-gray-50">
            <th class="px-3 py-2 text-left">Ապրանք</th>
            <th class="px-3 py-2 text-right">Քանակ</th>
            <th class="px-3 py-2 text-left">Մ/Չափ</th>
            <th class="px-3 py-2 text-left">Ժամանակ</th>
            <th class="px-3 py-2 text-left"></th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="o in outputs" :key="o.id" class="border-t">
            <td class="px-3 py-2">
              <div class="flex gap-1 flex-wrap items-center">
                <span>{{ o.product?.name || o.product_id }}</span>
                <template v-for="c in normChars(o.product)" :key="c.id">
                  <span class="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">{{ c.name }}</span>
                </template>
              </div>
            </td>
            <td class="px-3 py-2 text-right">{{ formatQty(o.qty) }}</td>
            <td class="px-3 py-2">
              {{ $t(o.unit || o.measure || o.product?.measure_type || '—') }}
            </td>
            <td class="px-3 py-2 text-gray-500">
              <span :title="o.created_at">{{ formatDateTime(o.created_at) }}</span>
            </td>
            <td class="px-3 py-2">
              <div v-if="mo?.status !== 'completed' && mo?.status !== 'cancelled'"  class="flex justify-end gap-2">
                <button class="p-2 rounded hover:bg-gray-100" @click="openEditOutput(o)" title="Փոփոխել">
                  <!-- pencil icon -->
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 21h3.75L19.81 7.94l-3.75-3.75L3 17.25V21zM20.71 6.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/></svg>
                </button>
                <button class="p-2 rounded hover:bg-gray-100" @click="confirmDeleteOutput(o)" title="Ջնջել">
                  <!-- trash icon -->
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 7h12M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M7 7l1 12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2l1-12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!loading && outputs.length === 0">
            <td colspan="4" class="px-3 py-6 text-center text-gray-500">Տվյալներ չկան</td>
          </tr>
          </tbody>
        </table>

        <div class="text-xs text-gray-500 mt-2">
          Ելքերը հայտնվում են «Ժամանակավոր պահեստ»֊ում, որից հետո կարող եք «Տեղավորել → բջիջ»։
        </div>
      </div>
    </div>

    <!-- Շարժումներ -->
    <div class="px-4">
      <div class="bg-white border border-gray-300 rounded-xl p-4">
        <div class="font-medium mb-2">Շարժումներ (audit)</div>
        <ul class="space-y-2">
          <li v-for="m in movements" :key="m.id"
              class="flex items-start justify-between gap-4 rounded-lg border border-gray-300 px-3 py-2">
            <div class="min-w-0">
              <!-- reason badge -->
              <span class="inline-flex items-center text-xs px-2 py-0.5 rounded-full mr-2"
                    :class="reasonBadge(m.reason)">
            {{ $t(`movement.reasons.${m.reason}`) || m.reason }}
          </span>

              <!-- Product name + characteristics badges -->
              <div class="mt-1 flex flex-wrap gap-1 items-center">
                <span class="font-medium truncate">{{ m.product?.name || m.product_id }}</span>
                <span v-for="c in normChars(m.product)" :key="c.id"
                      class="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              {{ c.name }}
            </span>
              </div>
            </div>

            <div class="text-right shrink-0">
              <!-- qty + measure -->
              <div class="font-semibold tabular-nums">
                {{ formatQty(m.qty) }}
                <span class="text-gray-500">{{ $t(m.measure || m.product?.measure_type) }}</span>
              </div>
              <div class="text-xs text-gray-500">
                {{ formatDateTime(m.moved_at, { withSeconds: true }) }}
              </div>
            </div>
          </li>
        </ul>

        <div v-if="!loading && movements.length === 0"
             class="text-sm text-gray-500 py-2">Տվյալներ չկան</div>
      </div>
    </div>
  </div>
  <div v-if="showEditModal" class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/40" @click="closeEditModal"></div>

    <div class="absolute inset-0 flex items-center justify-center p-4">
      <div class="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div class="px-4 py-3 border-b flex items-center justify-between">
          <div class="font-semibold">Փոփոխել ելքը</div>
          <button class="p-2 rounded hover:bg-gray-100" @click="closeEditModal" aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>

        <div class="p-4 space-y-3" v-if="editForm">
          <div class="space-y-1">
            <label class="text-xs text-gray-500">Քանակ</label>
            <input v-model.number="editForm.qty" type="number" step="0.001" min="0"
                   class="w-full border rounded-xl px-3 py-2" />
          </div>
          <div class="space-y-1" v-if="editForm.measure_type !== 'piece'">
            <label class="text-xs text-gray-500">Մ/Չափ</label>
            <select v-model="editForm.measure" class="w-full border rounded-xl px-3 py-2">
              <option v-for="u in unitOptionsByMeasure(editForm.measure_type)" :key="u" :value="u">
                {{ $t(u) }}
              </option>
            </select>
          </div>
        </div>

        <div class="px-4 py-3 border-t flex justify-end gap-2">
          <button class="px-3 py-2 rounded-xl border hover:bg-gray-50" @click="closeEditModal">Փակել</button>
          <button class="px-3 py-2 rounded-xl bg-gray-900 text-white hover:bg-gray-800"
                  :disabled="!editForm || editForm.qty <= 0"
                  @click="submitEditOutput">
            Պահպանել
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { mainApi, wmsApi, mfgApi } from '@/api.js'
import { useToast } from 'vue-toastification'
import { formatDateTime, fromNow } from '@/utils/dateFormat'
import { formatQty } from '@/utils/numberFormat'
type ID = number

const toast = useToast()
const route = useRoute()

// router params
const storageId = computed(() => Number(route.params.id))
const moId = computed(() => Number(route.params.mo_id))

// header storage
const storage = ref<any | null>(null)

// data
const mo = ref<any | null>(null)
const consumptions = ref<any[]>([])
const outputs = ref<any[]>([])
const movements = ref<any[]>([])
const loading = ref(false)

// add output UI
const toggleAdd = ref(false)
const prodQuery = ref('')
const productOptions = ref<{id:number; name:string; measure_type:'piece'|'capacity'|'weight'|'length'}[]>([])
const productId = ref<number | undefined>()
const selectedMeasureType = ref<'piece' | 'capacity' | 'weight' | 'length' | undefined>(undefined)
const unit = ref<string | undefined>(undefined)
const qty = ref<number>(0)
const saving = ref(false)
const editForm = ref<{id:number; qty:number; measure?:string; measure_type?:string; batch_no?:string; serial_no?:string} | null>(null)
const deletingId = ref<number | null>(null)
const showEditModal = ref(false)

const unitOptionsByMeasure = (mt?: string) => {
  switch (mt) {
    case 'weight':   return ['kg','g','tonn']        // եթե backend-ը 't' է պահում
    case 'capacity': return ['l','ml','m3']
    case 'length':   return ['m','cm','mm']
    default:         return ['piece']
  }
}

const openEditOutput = (o:any) => {
  editForm.value = {
    id: o.id,
    qty: Number(o.qty),
    measure: o.measure || undefined,
    measure_type: o.product.measure_type,
    batch_no: o.batch_no || '',
    serial_no: o.serial_no || '',
  }
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  editForm.value = null
}

const submitEditOutput = async () => {
  if (!editForm.value) return
  await mfgApi.updateMOOutput(storageId.value, moId.value, editForm.value.id, {
    qty: editForm.value.qty,
    unit: editForm.value.measure,
    batch_no: editForm.value.batch_no,
    serial_no: editForm.value.serial_no,
  })
  // refresh outputs + movements
  outputs.value = await mfgApi.getMOOutputs(storageId.value, moId.value)
  movements.value = await wmsApi.getMovements(storageId.value, {manufacturing_order_id: moId.value })
  showEditModal.value = false
}

const confirmDeleteOutput = async (o:any) => {
  if (!confirm('Ջնջե՞լ ելքը։')) return
  await mfgApi.deleteMOOutput(storageId.value, moId.value, o.id)
  outputs.value = await mfgApi.getMOOutputs(storageId.value, moId.value)
  movements.value = await wmsApi.getMovements(storageId.value, {manufacturing_order_id: moId.value })
}

const reasonBadge = (reason: string) => {
  switch (reason) {
    case 'produce_from_mo': return 'bg-emerald-100 text-emerald-700'
    case 'consume_to_mo':  return 'bg-indigo-100 text-indigo-700'
    case 'place':          return 'bg-amber-100 text-amber-700'
    case 'dispatch':       return 'bg-rose-100 text-rose-700'
    case 'transfer_in':
    case 'transfer_out':   return 'bg-blue-100 text-blue-700'
    default:               return 'bg-slate-100 text-slate-700'
  }
}
const normChars = (obj: any): any[] => {
  const raw = obj?.characteristics
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string') {
    try { return JSON.parse(raw || '[]') } catch { return [] }
  }
  return []
}

// warnings
const mismatchWarning = computed(() =>
    !!mo.value && Number(mo.value.output_storage_id) !== storageId.value
)

const loadAllowedProducts = async () => {
  productOptions.value = await wmsApi.getOutputProductsByStorage(storageId.value, prodQuery.value || '')
}

const onProductChange = () => {
  const p = productOptions.value.find(x => x.id === productId.value)
  selectedMeasureType.value = p?.measure_type
  // default unit suggestion
  if (p?.measure_type === 'weight') unit.value = 'kg'
  else if (p?.measure_type === 'capacity') unit.value = 'l'
  else if (p?.measure_type === 'length') unit.value = 'm'
  else unit.value = undefined
}

const searchProducts = async () => {
  productOptions.value = await wmsApi.getOutputProductsByStorage(storageId.value, prodQuery.value || '')
}

// badges
const badgeClass = (s?: string) => {
  switch (s) {
    case 'released': return 'bg-blue-100 text-blue-700'
    case 'in_progress': return 'bg-indigo-100 text-indigo-700'
    case 'completed': return 'bg-emerald-100 text-emerald-700'
    case 'cancelled': return 'bg-rose-100 text-rose-700'
    case 'draft': return 'bg-slate-100 text-slate-700'
    default: return 'bg-slate-100 text-slate-700'
  }
}

const canComplete = computed(() => {
  const s = mo.value?.status
  return s === 'released' || s === 'in_progress'
})

// load helpers
const loadAll = async () => {
  if (!Number.isFinite(storageId.value) || !Number.isFinite(moId.value)) return
  loading.value = true
  try {
    storage.value = await mainApi.getStorageById(storageId.value)
    mo.value = await mfgApi.getMO(storageId.value, moId.value)
    // related lists
    consumptions.value = await mfgApi.getMOConsumptions(storageId.value, moId.value)
    outputs.value = await mfgApi.getMOOutputs(storageId.value, moId.value)
    // movements via WMS API (filter by mo)
    movements.value = await wmsApi.getMovements(storageId.value, {manufacturing_order_id: moId.value })
  } finally {
    loading.value = false
  }
}

const selectProduct = (p: any) => {
  productId.value = p.id
  prodQuery.value = p.name
}

const addOutput = async () => {
  if (!mo.value || !productId.value || qty.value <= 0) return
  saving.value = true
  try {
    await mfgApi.addMOOutputEx(storageId.value, moId.value, {
      product_id: productId.value,
      qty: qty.value,
      unit: unit.value,
    })
    outputs.value = await mfgApi.getMOOutputs(storageId.value, moId.value)
    movements.value = await wmsApi.getMovements({
      storage_id: storageId.value,
      manufacturing_order_id: moId.value,
      order_by: 'moved_at',
      order_dir: 'desc',
      limit: 100, // քո ցանկալի քանակը
      offset: 0,
    })
    toggleAdd.value = false
    productId.value = undefined
    selectedMeasureType.value = undefined
    unit.value = undefined
    qty.value = 0
  } finally {
    saving.value = false
  }
}

const completeMO = async () => {
  await mfgApi.completeMO(storageId.value, moId.value)
  toast.success('Սեսիան ավարտվեց')
  await loadAll()
}

// initial and watchers
onMounted(async () => {
  await loadAll()
  await loadAllowedProducts()
})
watch(() => route.fullPath, async () => {
  await loadAll()
  await loadAllowedProducts()
})
</script>

<style scoped>
/* optional: small tweaks */
</style>
