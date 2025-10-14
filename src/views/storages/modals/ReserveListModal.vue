<!-- src/views/storages/modals/ReserveListModal.vue -->
<template>
  <div v-if="open" class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/40" @click="$emit('close')"></div>

    <div
        class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl bg-white rounded-2xl shadow-xl"
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-5 py-4 border-b">
        <h3 class="text-lg font-semibold">
          {{ headerTitle }}
        </h3>
        <button class="p-2 rounded-lg hover:bg-gray-100" @click="$emit('close')" aria-label="Close">✕</button>
      </div>

      <!-- Body -->
      <div class="p-5 space-y-4">
        <!-- Filters -->
        <div class="flex items-center gap-2">
          <select v-model="department" @change="reloadFromStart" class="border border-gray-300 rounded-xl px-3 py-2">
            <option value="" selected>{{ $t('all_departments') || 'Բոլոր բաժինները' }}</option>
            <option v-for="d in departmentOptions" :key="d.id" :value="d.id">{{ d.name }}</option>
          </select>
          <select v-model="status" class="border border-gray-300 rounded-xl px-3 py-2 w-full" @change="reloadFromStart">
            <option value="">{{ $t('all','Բոլորը') }}</option>
            <option value="active">{{ $t('active','Ակտիվ') }}</option>
            <option value="cancelled">{{ $t('cancelled','Չեղարկված') }}</option>
            <option value="finished">{{ $t('finished','Ավարտված') }}</option>
          </select>
        </div>

        <!-- Table -->
        <div class="overflow-hidden">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left">{{ $t('type','Տեսակ') }}</th>
              <th class="px-4 py-3 text-left">{{ $t('department','Ստորաբաժանում') }}</th>
              <th class="px-4 py-3 text-left">{{ $t('cell','Բջիջ') }}</th>
              <th class="px-4 py-3 text-right">{{ $t('qty','Քանակ') }}</th>
              <th class="px-4 py-3 text-left">{{ $t('created_at','Ստեղծվել է') }}</th>
              <th class="px-4 py-3 text-center">{{ $t('actions','Գործողություններ') }}</th>
            </tr>
            </thead>
            <tbody>
            <tr
                v-for="r in rows"
                :key="r.id"
                class="bg-white border-b border-gray-200"
            >
              <td class="px-4 py-3">
                  <span
                      class="inline-flex items-center px-2 py-0.5 rounded text-xs"
                      :class="badgeClass(r.status)"
                  >
                    {{ r.status ? $t(r.status) : '-' }}
                  </span>
              </td>
              <td class="px-4 py-3">
                {{ r.storage_demand_request_item?.demand_request?.department?.name || '-' }}
              </td>
              <td class="px-4 py-3">
                <span v-if="r.cell">{{ cellPath(r.cell) }}</span>
                <span v-else>-</span>
              </td>
              <td class="px-4 py-3 text-right">
                {{ formatQty(r.qty) }} {{ unitLabel(r) }}
              </td>
              <td class="px-4 py-3">
                <span :title="r.created_at">{{ formatDateTime(r.created_at) }}</span>
                <span class="text-xs text-gray-400 ml-2">({{ fromNow(r.created_at) }})</span>
              </td>
              <td class="px-4 py-3">
                <div class="flex justify-center">
                  <button
                      v-if="r.status === 'active'"
                      class="px-3 py-1 text-xs font-medium text-white bg-rose-600 rounded-md shadow hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      :disabled="cancellingId === r.id"
                      @click="cancelReserve(r)"
                  >
                    {{ cancellingId === r.id ? $t('cancelling','Չեղարկվում է…') : $t('cancel','Չեղարկել') }}
                  </button>
                  <span v-else class="text-xs text-gray-500">—</span>
                </div>
              </td>
            </tr>

            <tr v-if="!loading && rows.length === 0">
              <td colspan="6" class="px-4 py-8 text-center text-gray-500">
                {{ $t('no_data','Տվյալներ չկան') }}
              </td>
            </tr>
            </tbody>
          </table>
        </div>

        <!-- Sentinel / loading -->
        <div ref="sentinel" class="h-10 flex items-center justify-center">
          <span v-if="loading && rows.length > 0" class="text-sm text-gray-500">{{ $t('loading','Լցվում է…') }}</span>
          <span v-else-if="endReached && rows.length > 0" class="text-xs text-gray-400">{{ $t('the_end','Վերջ') }}</span>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-5 py-4 border-t flex justify-end gap-2">
        <button class="px-4 py-2 rounded-xl border" @click="$emit('close')">{{ $t('close','Փակել') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import { useToast } from 'vue-toastification'
import { directoriesApi, wmsApi } from '@/api.js'
import { formatQty } from '@/utils/numberFormat'
import { fromNow } from '@/utils/dateFormat.js'

const props = defineProps({
  open: { type: Boolean, default: false },

  // Usage A (staging list):
  storageProduct: { type: Object, default: null },

  // Usage B (cell inventory):
  cellId: { type: [Number, String], default: null },
  productId: { type: [Number, String], default: null },

  // Optional custom title
  title: { type: String, default: '' },
})
const emit = defineEmits(['close', 'updated'])
const toast = useToast()

// List state
const rows = ref([])
const loading = ref(false)
const endReached = ref(false)
const pager = ref({ limit: 50, offset: 0 })

// Filters
const status = ref('')
const department = ref('')
const departmentOptions = ref([])

// Cancel state
const cancellingId = ref(null)

/* ========================= Helpers ========================= */

const badgeClass = (status) => {
  switch (status) {
    case 'active': return 'bg-emerald-100 text-emerald-700'
    case 'cancelled': return 'bg-rose-100 text-rose-700'
    case 'consumed':
    case 'finished': return 'bg-slate-100 text-slate-700'
    default: return 'bg-slate-100 text-slate-700'
  }
}

const cellPath = (cell) => {
  const parts = []
  if (cell?.section) parts.push(cell.section.name || cell.section.code)
  if (cell?.row)     parts.push(cell.row.name || cell.row.code)
  if (cell?.rack)    parts.push(cell.rack.name || cell.rack.code)
  parts.push(cell?.name || cell?.code || 'Cell')
  return parts.filter(Boolean).join(' / ')
}

const formatDateTime = (value) => {
  if (!value) return '-'
  try {
    const d = new Date(value)
    return d.toLocaleString()
  } catch {
    return String(value)
  }
}

// Choose unit label gracefully (row → storageProduct → 'piece')
const unitLabel = (row) => {
  return row?.unit || row?.measure || props.storageProduct?.measure || 'piece'
}

/* =================== Dynamic Title + Params =================== */

const headerTitle = computed(() => {
  if (props.title) return props.title
  if (props.storageProduct?.product?.name) {
    return `Ռեզերվներ — ${props.storageProduct.product.name}`
  }
  if (props.storageProduct?.product_id) {
    return `Ռեզերվներ — #${props.storageProduct.product_id}`
  }
  if (props.cellId) {
    return `Ռեզերվներ — Բջիջ #${props.cellId}${props.productId ? ` · Ապրանք #${props.productId}` : ''}`
  }
  return 'Ռեզերվներ'
})

const buildParams = () => {
  const base = {
    limit: pager.value.limit,
    offset: pager.value.offset,
  }
  // Prefer storage_product_id when provided (back-compat)
  if (props.storageProduct?.id) {
    return {
      ...base,
      storage_product_id: props.storageProduct.id,
      department_id: department.value || undefined,
      status: status.value || undefined,
    }
  }
  // Otherwise, use cell_id (+ optional product_id)
  if (props.cellId) {
    return {
      ...base,
      cell_id: Number(props.cellId),
      product_id: props.productId ? Number(props.productId) : undefined,
      department_id: department.value || undefined,
      status: status.value || undefined,
    }
  }
  return null
}

/* ========================= Data IO ========================= */

async function fetchDepartments () {
  const res = await directoriesApi.departments()
  departmentOptions.value = res?.data ?? res ?? []
}

// Fetch one page (limit/offset)
const fetchPage = async () => {
  if (loading.value || endReached.value) return
  const params = buildParams()
  if (!params) return

  loading.value = true
  try {
    const res = await wmsApi.getReserves(params)
    const list = Array.isArray(res) ? res : (res?.data ?? [])
    rows.value.push(...list)
    pager.value.offset += list.length
    if (list.length < pager.value.limit) endReached.value = true
  } finally {
    loading.value = false
  }
}

const reloadFromStart = async () => {
  rows.value = []
  endReached.value = false
  pager.value.offset = 0
  await fetchPage()
}

// Cancel action (active only)
const cancelReserve = async (r) => {
  try {
    cancellingId.value = r.id
    await wmsApi.cancelReserve(r.id)
    toast.success($t?.('reserve_cancelled','Ռեզերվը չեղարկվեց') || 'Ռեզերվը չեղարկվեց')
    await reloadFromStart()
    emit('updated')
  } finally {
    cancellingId.value = null
  }
}

/* ===================== Infinite scroll ===================== */

const sentinel = ref(null)
let observer = null
const startObserver = () => {
  if (!sentinel.value) return
  observer = new IntersectionObserver((entries) => {
    const [e] = entries
    if (e.isIntersecting) fetchPage()
  })
  observer.observe(sentinel.value)
}

const stopObserver = () => {
  if (observer && sentinel.value) observer.unobserve(sentinel.value)
  observer = null
}

/* ========================= Lifecycle ========================= */

onMounted(async () => {
  if (props.open) {
    await fetchDepartments()
    await reloadFromStart()
    startObserver()
  }
})

watch(() => props.open, async (v) => {
  if (v) {
    await fetchDepartments()
    await reloadFromStart()
    startObserver()
  } else {
    stopObserver()
  }
})

// Reload when switching the context (storageProduct/cell/product)
watch(
    () => [props.storageProduct?.id, props.cellId, props.productId, status.value, department.value],
    async () => { if (props.open) await reloadFromStart() }
)

onBeforeUnmount(() => { stopObserver() })
</script>
