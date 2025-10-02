<!-- src/views/storages/modals/CellPlacementsModal.vue -->
<template>
  <div v-if="open" class="fixed inset-0 z-50">
    <!-- backdrop -->
    <div class="absolute inset-0 bg-black/40" @click="$emit('close')"></div>

    <!-- modal -->
    <div class="absolute inset-0 flex items-center justify-center p-4">
      <div class="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <!-- header -->
        <div class="px-4 py-3 border-b flex items-center justify-between">
          <div class="font-semibold">
            {{ $t('placements_for_cell','Տեղավորումներ բջջի համար') }}
            <span class="text-gray-500 ml-1">#{{ cellId }}</span>
          </div>
          <button class="p-2 rounded hover:bg-gray-100" @click="$emit('close')" aria-label="Close">✕</button>
        </div>

        <!-- filters -->
        <div class="px-4 py-3 flex flex-wrap items-center gap-2 border-b">
          <input
              v-model="q"
              :placeholder="$t('search', 'Փնտրել ապրանք')"
              class="border border-gray-300 rounded-xl px-3 py-2 flex-1 min-w-[220px]"
          />
          <select v-model="status" class="border border-gray-300 rounded-xl px-3 py-2">
            <option value="pending">{{ $t('pending','Սպասման մեջ') }}</option>
            <option value="approved">{{ $t('approved','Հաստատված') }}</option>
            <option value="cancelled">{{ $t('cancelled','Չեղարկված') }}</option>
            <option value="">{{ $t('all','Բոլորը') }}</option>
          </select>
        </div>

        <!-- table -->
        <div class="flex-1 overflow-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th class="px-6 py-3 text-left">{{ $t('product','Ապրանք') }}</th>
              <th class="px-6 py-4">Տեսակ</th>
              <th class="px-6 py-4">Որ բջջից</th>
              <th class="px-6 py-3">{{ $t('cell','Բջիջ') }}</th>
              <th class="px-6 py-3 text-right">{{ $t('qty','Քանակ') }}</th>
              <th class="px-6 py-3">{{ $t('status','Կարգավիճակ') }}</th>
            </tr>
            </thead>
            <tbody>
            <tr
                v-for="row in items"
                :key="row.id"
                class="bg-white border-b border-gray-200"
            >
              <td class="px-6 py-3">
                <div class="font-medium">
                  {{ row.product?.name || row.product_name || row.product_id }}
                </div>

                <!-- chips: characteristics, batch/serial (only if present in response) -->
                <div class="mt-1 flex flex-wrap gap-1">
                    <span
                        v-for="c in chars(row)"
                        :key="c.id || c.name || String(c)"
                        class="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-700"
                    >
                      {{ c.name || c }}
                    </span>
                  <span v-if="row.batch_no" class="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                      batch: {{ row.batch_no }}
                    </span>
                  <span v-if="row.serial_no" class="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                      SN: {{ row.serial_no }}
                    </span>
                </div>
              </td>
              <td class="px-6 py-4 text-center">
              <span class="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs">
                {{ row.from_cell_id ? 'Տեղափոխություն' : 'Տեղավորում' }}
              </span>
              </td>
              <td class="px-6 py-4 text-center">
                {{ row.from_cell?.name || row.from_cell_name || row.from_cell_id || '—' }}
              </td>

              <td class="px-6 py-3 text-center">
                <!-- եթե backend-ը տալիս է cell օբյեկտ՝ ցույց ենք տալիս անունը, այլապես՝ ID -->
                <div>
                  {{ row.cell?.name || row.cell_name || row.cell_id }}
                </div>
              </td>

              <td class="px-6 py-3 text-right">
                {{ fmt(row.qty) }}
                <span v-if="shortUnit(row.measure)" class="text-gray-500">{{ shortUnit(row.measure) }}</span>
              </td>

              <td class="px-6 py-3 text-center">
                <span v-if="row.status==='pending'"   class="px-2 py-0.5 rounded bg-amber-100  text-amber-700  text-xs">{{ $t('pending','Սպասման մեջ') }}</span>
                <span v-else-if="row.status==='approved'" class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-xs">{{ $t('approved','Հաստատված') }}</span>
                <span v-else class="px-2 py-0.5 rounded bg-rose-100   text-rose-700   text-xs">{{ $t('cancelled','Չեղարկված') }}</span>
              </td>
            </tr>

            <tr v-if="!loading && items.length===0">
              <td colspan="4" class="px-4 py-8 text-center text-gray-500">{{ $t('no_data','Տվյալներ չկան') }}</td>
            </tr>
            </tbody>
          </table>

          <!-- sentinel -->
          <div ref="sentinel" class="h-12 flex items-center justify-center">
            <span v-if="loading && items.length>0" class="text-sm text-gray-500">{{ $t('loading','Լցվում է…') }}</span>
            <span v-else-if="endReached && items.length>0" class="text-xs text-gray-400">{{ $t('the_end','Վերջ') }}</span>
          </div>
        </div>

        <!-- footer -->
        <div class="px-4 py-3 border-t flex justify-end">
          <button class="px-3 py-2 rounded-xl border hover:bg-gray-50" @click="$emit('close')">{{ $t('close','Փակել') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { wmsApi } from '@/api.js'

const props = defineProps({
  open: { type: Boolean, default: false },
  storageId: { type: Number, required: true },
  cellId: { type: Number, required: true },
})

const items = ref([])
const loading = ref(false)
const q = ref('')
const status = ref('pending')

// pagination
const limit = ref(50)
const offset = ref(0)
const endReached = ref(false)

// infinite scroll
const sentinel = ref(null)
let observer = null

// helpers (only use fields that exist in backend)
const fmt = (n)=> Number(n||0).toLocaleString(undefined,{ maximumFractionDigits: 6 })
const shortUnit = (m)=> ({kg:'կգ', g:'գ', tonn:'տ', t:'տ', l:'լ', ml:'մլ', m3:'մ³', m:'մ', cm:'սմ', mm:'մմ', piece:'հատ', pcs:'հատ'}[String(m||'').toLowerCase()] || '')
const chars = (row) => {
  const a = row.product_characteristics
  if (Array.isArray(a)) return a
  const b = row.product?.characteristics
  if (Array.isArray(b)) return b
  if (typeof a === 'string') { try { const arr = JSON.parse(a||'[]'); return Array.isArray(arr)?arr:[] } catch { return [] } }
  if (typeof b === 'string') { try { const arr = JSON.parse(b||'[]'); return Array.isArray(arr)?arr:[] } catch { return [] } }
  return []
}

// fetch one page
const fetchPage = async () => {
  if (loading.value || endReached.value) return
  loading.value = true
  try {
    const page = await wmsApi.getPlacements(props.storageId, {
      status: status.value || undefined,
      search: q.value || undefined,
      cell_id: props.cellId,
      limit: limit.value,
      offset: offset.value,
    })
    const list = Array.isArray(page) ? page : (page?.data ?? page?.rows ?? [])
    items.value.push(...list)
    offset.value += list.length
    if (list.length < limit.value) endReached.value = true
  } finally {
    loading.value = false
  }
}

const reloadFromStart = async () => {
  endReached.value = false
  items.value = []
  offset.value = 0
  await fetchPage()
}

// observer
const startObserver = () => {
  if (!sentinel.value) return
  observer = new IntersectionObserver((entries) => {
    const [entry] = entries
    if (entry.isIntersecting) fetchPage()
  })
  observer.observe(sentinel.value)
}

const stopObserver = () => {
  if (observer && sentinel.value) observer.unobserve(sentinel.value)
  observer = null
}

onMounted(() => {
  if (props.open) {
    reloadFromStart()
    startObserver()
  }
})
watch(() => props.open, async (v) => {
  if (v) {
    await reloadFromStart()
    startObserver()
  } else {
    stopObserver()
  }
})
watch([status, q, () => props.cellId], () => reloadFromStart())

onBeforeUnmount(stopObserver)
</script>
