<!-- src/views/storages/modals/CellInventoryModal.vue -->
<template>
  <div class="fixed inset-0 z-50">
    <!-- backdrop -->
    <div class="absolute inset-0 bg-black/40" @click="$emit('close')"></div>

    <!-- modal -->
    <div class="absolute inset-0 flex items-center justify-center p-4">
      <div class="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden">
        <!-- header -->
        <div class="px-4 py-3 border-b flex items-center justify-between">
          <div class="font-semibold">Բջիջի պարունակությունը</div>
          <button class="p-2 rounded hover:bg-gray-100" @click="$emit('close')" aria-label="Close">✕</button>
        </div>

        <!-- body -->
        <div class="p-4">
          <div v-if="loading" class="text-sm text-gray-500">Բեռնվում է…</div>
          <div v-else-if="error" class="text-sm text-red-600">{{ error }}</div>

          <div v-else>
            <table class="min-w-full text-sm">
              <thead class="bg-gray-50">
              <tr>
                <th class="px-3 py-2 text-left">Ապրանք</th>
                <th class="px-3 py-2 text-left">Բնութագրեր</th>
                <th class="px-3 py-2 text-right">Քանակ</th>
                <th class="px-3 py-2 text-right">Չափմ.</th>
              </tr>
              </thead>

              <tbody>
              <tr
                  v-for="(row, idx) in rows"
                  :key="row.id ?? row.storage_cell_product_id ?? (row.product_id + '-' + (row.batch_no || '') + '-' + (row.serial_no || '') + '-' + idx)"
                  class="border-t"
              >
                <!-- Product -->
                <td class="px-3 py-2">
                  <div class="font-medium">
                    {{ row.product?.name || row.product_name || row.product_id }}
                  </div>
                  <div v-if="row.batch_no || row.serial_no" class="text-[11px] text-gray-500 mt-0.5">
                    <span v-if="row.batch_no">Batch: {{ row.batch_no }}</span>
                    <span v-if="row.batch_no && row.serial_no"> · </span>
                    <span v-if="row.serial_no">SN: {{ row.serial_no }}</span>
                  </div>
                </td>

                <!-- Characteristics -->
                <td class="px-3 py-2">
                  <div class="flex flex-wrap gap-1">
                      <span
                          v-for="c in characteristicsFromRow(row)"
                          :key="(c.id ?? c.name)+'-'+idx"
                          class="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700"
                      >
                        {{ c.name }}
                      </span>
                    <span v-if="characteristicsFromRow(row).length===0" class="text-[11px] text-gray-400">—</span>
                  </div>
                </td>

                <!-- Qty -->
                <td class="px-3 py-2 text-right tabular-nums">
                  {{ fmt(row.qty) }}
                </td>

                <!-- Measure -->
                <td class="px-3 py-2 text-right">
                  <span class="text-gray-600">{{ unit(row.measure) }}</span>
                </td>
              </tr>

              <tr v-if="rows.length === 0">
                <td colspan="4" class="px-3 py-6 text-center text-gray-500">Դատարկ է</td>
              </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- footer -->
        <div class="px-4 py-3 border-t flex justify-end">
          <button class="px-3 py-2 rounded-xl border hover:bg-gray-50" @click="$emit('close')">Փակել</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { wmsApi } from '@/api.js'
import { useRoute } from 'vue-router'

const props = defineProps({
  cellId: { type: Number, required: true }
})

const rows = ref([])
const loading = ref(false)
const error = ref('')

const route = useRoute()
const storageId = Number(route.params.id)

// map backend measure keys to readable labels (adjust as needed)
function unit (m) {
  const k = String(m || '').toLowerCase()
  return ({
    kg: 'կգ',
    g: 'գ',
    tonn: 'տ',
    l: 'լ',
    ml: 'մլ',
    m3: 'մ³',
    m: 'մ',
    cm: 'սմ',
    mm: 'մմ',
    piece: 'հատ'
  }[k]) || m || ''
}

// support both array & stringified JSON for characteristics
function normalizeCharacteristics (val) {
  if (Array.isArray(val)) return val
  if (typeof val === 'string') {
    try { return JSON.parse(val || '[]') } catch { return [] }
  }
  return []
}

// extract characteristics from row (product.characteristics OR product_characteristics field)
function characteristicsFromRow (row) {
  // prefer nested product.characteristics
  const pChars = normalizeCharacteristics(row?.product?.characteristics)
  if (pChars.length) return pChars

  // fallback: if backend sent raw json field
  const flat = normalizeCharacteristics(row?.product_characteristics)
  if (flat.length) return flat

  return []
}

function fmt (n) {
  const num = Number(n || 0)
  return num.toLocaleString(undefined, { maximumFractionDigits: 6 })
}

async function load () {
  if (!props.cellId) return
  loading.value = true
  error.value = ''
  try {
    // NOTE: using 2-arg signature as in your codebase
    const data = await wmsApi.getCellProducts(storageId, {
      cell_id: props.cellId,
      limit: 500
    })

    const list = Array.isArray(data) ? data : (Array.isArray(data?.rows) ? data.rows : [])
    rows.value = list.map(r => ({
      id: r.id ?? r.storage_cell_product_id ?? null,
      product_id: r.product_id ?? r.product?.id ?? null,
      // keep whole product if present; frontend reads product.characteristics from here
      product: r.product ?? null,
      product_name: r.product_name ?? r.product?.name ?? null,
      qty: r.qty ?? 0,
      // prefer explicit measure from backend; fallback to product’s default
      measure: r.measure ?? r.product?.measure_type ?? null,
      batch_no: r.batch_no ?? null,
      serial_no: r.serial_no ?? null,
      // allow alternative payload names if backend returns raw json field
      product_characteristics: r.product_characteristics ?? null
    }))
  } catch (e) {
    error.value = 'Չհաջողվեց բեռնել բջիջի պարունակությունը'
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => props.cellId, load)
</script>
