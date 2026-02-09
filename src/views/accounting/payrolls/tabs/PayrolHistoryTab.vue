<template>
  <div class="flex flex-col gap-3">
    <div class="flex items-center">
      <DatePicker v-model="fromDate" :placeholder="t('start_date')" month-picker auto-apply />
      <DatePicker v-model="toDate"   :disabled="!fromDate" :placeholder="t('end_date')" month-picker auto-apply class="ml-2" />
    </div>

    <div class="border border-gray-300 rounded-xl shadow-sm">
      <div class="overflow-x-auto rounded-xl">
        <table class="min-w-full divide-y divide-gray-200 text-sm text-gray-700">
          <thead class="bg-gray-50">
          <tr>
            <th class="p-3 text-center">
              <input type="checkbox" @change="toggleAll" :checked="allSelected" />
            </th>
            <th class="p-3 text-left">{{ t('employee') }}</th>
            <th class="p-3 text-center">{{ t('status') }}</th>
            <th class="p-3 text-right">Ընդանուր</th>
            <th class="p-3 text-right">Վճարված</th>
            <th class="p-3 text-right">Ամսաթիվ</th>
          </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
          <tr v-for="item in payrolls" :key="item.id" class="hover:bg-gray-50 transition-colors">
            <td class="p-3 text-center">
              <input type="checkbox" :value="item.id" v-model="selectedIds" />
            </td>
            <td class="p-3">{{ item.employee?.first_name }} {{ item.employee?.last_name }}</td>
            <td class="p-3 text-center">{{ item.status }}</td>
            <td class="p-3 text-right">{{ format(item.total_salary) }}</td>
            <td class="p-3 text-right">{{ format(item.paid_amount || 0) }}</td>
            <td class="p-3 text-right">{{ item.paid_date || '-' }}</td>
          </tr>
          </tbody>
        </table>
      </div>

      <div v-if="loading" class="p-4 text-center text-gray-500">{{ t('loading') }}...</div>
      <div v-if="allLoaded && payrolls.length && offset > 0" class="p-4 text-center text-gray-500">{{ t('no_more') }}</div>
      <div v-if="!loading && !payrolls.length" class="p-4 text-center text-gray-500">{{ t('no_results') }}</div>
    </div>

    <div ref="sentinel" class="h-6"></div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { payrollApi } from '@/api.ts'

const { t } = useI18n()

type MonthYear = { month:number; year:number } | null
type Employee = { first_name: string; last_name: string }
type Item = {
  id:number
  employee: Employee
  total_salary: number|string
  status: string
  paid_amount?: number|string
  paid_date?: string
  declaration_downloaded?: boolean
}

const fromDate = ref<MonthYear>(null)
const toDate   = ref<MonthYear>(null)
const LIMIT = 30
const payrolls = ref<Item[]>([])
const selectedIds = ref<number[]>([])
const offset = ref(0)
const loading = ref(false)
const allLoaded = ref(false)

const downloadedSelectedIds = computed(() =>
    selectedIds.value.filter(id => payrolls.value.find(p => p.id === id)?.declaration_downloaded)
)
const allSelected = computed(
    () => payrolls.value.length > 0 && selectedIds.value.length === payrolls.value.length
)
const emit = defineEmits<{
  (e:'update-selection', payload:{downloadCount:number; payCount:number}):void
}>()

function format(v:any){ return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Number(v||0)) + ' ֏' }
function incrementMonth(date: MonthYear) {
  if (!date) return null
  let { month, year } = date
  month += 1; if (month > 12) { month = 1; year += 1 }
  return { month, year }
}

function toggleAll(e: Event) {
  const checked = (e.target as HTMLInputElement).checked
  selectedIds.value = checked ? payrolls.value.map(p => p.id) : []
  emitSelection()
}
function emitSelection() {
  emit('update-selection', {
    downloadCount: selectedIds.value.length,
    payCount: downloadedSelectedIds.value.length
  })
}

async function load(append=false) {
  if (loading.value || (append && allLoaded.value)) return
  // loading.value = true
  // try {
  //   const to   = toDate.value   ? incrementMonth(toDate.value)   : null
  //   const from = fromDate.value ? incrementMonth(fromDate.value) : null
  //   const data = await payrollApi.getPaid({ limit: LIMIT, offset: offset.value, to, from })
  //   const rows: Item[] = data?.data || []
  //   if (append) {
  //     if (!rows.length) { allLoaded.value = true; return }
  //     payrolls.value = payrolls.value.concat(rows)
  //     offset.value += rows.length
  //     if (rows.length < LIMIT) allLoaded.value = true
  //   } else {
  //     payrolls.value = rows
  //     selectedIds.value = []
  //     offset.value = rows.length
  //     allLoaded.value = rows.length < LIMIT
  //   }
  //   emitSelection()
  // } finally {
  //   loading.value = false
  // }
}

// page sentinel
const sentinel = ref<HTMLDivElement|null>(null)
let observer: IntersectionObserver|null = null
function setupObserver() {
  if (!sentinel.value) return
  observer = new IntersectionObserver(
      entries => {
        const entry = entries[0]
        if (entry.isIntersecting && !loading.value && !allLoaded.value) load(true)
      },
      { root: null, rootMargin: '0px 0px 300px 0px', threshold: 0 }
  )
  observer.observe(sentinel.value)
}
function cleanupObserver() { if (observer) { observer.disconnect(); observer = null } }

function onBus(e: Event) {
  const { action } = (e as CustomEvent).detail || {}
  if (action === 'downloadSelected') payrollApi.downloadDeclarations(selectedIds.value)
  if (action === 'paySelected') payrollApi.payPayroll(downloadedSelectedIds.value)
}

watch([fromDate, toDate], async () => {
  offset.value = 0; allLoaded.value = false
  await load(false)
})

onMounted(async () => {
  await load(false)
  setupObserver()
  window.addEventListener('payroll:action', onBus as any)
})
onBeforeUnmount(() => {
  cleanupObserver()
  window.removeEventListener('payroll:action', onBus as any)
})
</script>
