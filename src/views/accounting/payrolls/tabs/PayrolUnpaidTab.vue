<template>
  <div class="flex flex-col gap-y-2">
    <!-- Actions specific to unpaid can be kept inline if needed -->
    <div class="border border-gray-300 rounded-xl shadow-sm">
      <div class="overflow-x-auto rounded-xl">
        <table class="min-w-full divide-y divide-gray-200 text-sm text-gray-700">
          <thead class="bg-gray-50">
          <tr>
            <th class="p-3 text-center">
              <input type="checkbox" @change="toggleAll" :checked="allSelected" />
            </th>
            <th class="p-3 text-center"></th>
            <th class="p-3 text-center">{{ t('status') }}</th>
            <th class="p-3 text-center">Ժամկետ</th>
            <th class="p-3 text-left">{{ t('employee') }}</th>
            <th class="p-3 text-right">Աշխատանքի նկ․</th>
            <th class="p-3 text-right">Ընդանուր</th>
            <th class="p-3 text-right">Որից հարկեր</th>
            <th class="p-3 text-right">Վճարման ամսաթիվ</th>
            <th class="p-3 text-center">{{ t('leave_days_unpaid') }}</th>
          </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
          <tr v-for="item in payrolls" :key="item.id" class="hover:bg-gray-50 transition-colors">
            <td class="p-3 text-center">
              <input type="checkbox" :value="item.id" v-model="selectedIds" />
            </td>
            <td class="p-3 text-center">
              <button
                  v-if="!item.declaration_downloaded"
                  class="whitespace-nowrap bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-1 rounded"
                  @click="handleDownload([item.id])"
              >{{ t('download') }}</button>
              <button
                  v-if="item.declaration_downloaded && item.status !== 'paid'"
                  class="whitespace-nowrap bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded"
                  @click="handlePay([item.id])"
              >{{ t('pay') }}</button>
            </td>
            <td class="p-3 text-center"></td>
            <td class="p-3 text-center"></td>
            <td class="p-3 text-center"></td>
            <td class="p-3 text-center"></td>
            <td class="p-3 text-center"></td>
            <td class="p-3 text-center"></td>
            <td class="p-3 text-center"></td>
            <td class="p-3 text-center"></td>
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
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { payrollApi } from '@/api.ts'

const { t } = useI18n()

type Employee = { first_name: string; last_name: string; email?: string }
type PayrollItem = {
  id: number
  employee: Employee
  month: number
  year: number
  daily_salary: number|string
  income_tax: number|string
  military_fee: number|string
  personal_accumulation_fund: number|string
  total_salary: number|string
  leave_days?: number
  leave_days_unpaid?: number
  status: 'pending'|'paid'|string
  declaration_downloaded?: boolean
}

const LIMIT = 30
const payrolls = ref<PayrollItem[]>([])
const selectedIds = ref<number[]>([])
const offset = ref(0)
const loading = ref(false)
const allLoaded = ref(false)

// Mirror selection counts to parent (for parent buttons)
const downloadedSelectedIds = computed(() =>
    selectedIds.value.filter(id => payrolls.value.find(p => p.id === id)?.declaration_downloaded)
)
const allSelected = computed(
    () => payrolls.value.length > 0 && selectedIds.value.length === payrolls.value.length
)
function emitSelection() {
  // downloadCount = all selected; payCount = only already downloaded
  const downloadCount = selectedIds.value.length
  const payCount = downloadedSelectedIds.value.length
  // @ts-ignore
  emit('update-selection', { downloadCount, payCount })
}
const emit = defineEmits<{
  (e:'update-selection', payload:{downloadCount:number; payCount:number}):void
  (e:'require-refresh'):void
}>()

function toggleAll(e: Event) {
  const checked = (e.target as HTMLInputElement).checked
  selectedIds.value = checked ? payrolls.value.map(p => p.id) : []
  emitSelection()
}

async function loadPayrolls(append = false) {
  if (loading.value || (append && allLoaded.value)) return
  // loading.value = true
  // try {
  //   const data = await payrollApi.getUnpaid({ limit: LIMIT, offset: offset.value })
  //   const newItems: PayrollItem[] = data?.data || []
  //   if (append) {
  //     if (!newItems.length) { allLoaded.value = true; return }
  //     payrolls.value = payrolls.value.concat(newItems)
  //     offset.value += newItems.length
  //     if (newItems.length < LIMIT) allLoaded.value = true
  //   } else {
  //     payrolls.value = newItems
  //     selectedIds.value = []
  //     offset.value = newItems.length
  //     allLoaded.value = newItems.length < LIMIT
  //   }
  //   emitSelection()
  // } finally {
  //   loading.value = false
  // }
}

async function handleDownload(ids: number[]) {
  if (!ids.length) return
  await payrollApi.downloadDeclarations(ids)
  payrolls.value.forEach(p => { if (ids.includes(p.id)) p.declaration_downloaded = true })
  emitSelection()
}

async function handlePay(ids: number[]) {
  if (!ids.length) return
  await payrollApi.payPayroll(ids)
  offset.value = 0
  allLoaded.value = false
  await loadPayrolls(false)
}

// Observe page bottom for infinite scroll
const sentinel = ref<HTMLDivElement|null>(null)
let observer: IntersectionObserver|null = null
function setupObserver() {
  if (!sentinel.value) return
  observer = new IntersectionObserver(
      entries => {
        const entry = entries[0]
        if (entry.isIntersecting && !loading.value && !allLoaded.value) {
          loadPayrolls(true)
        }
      },
      { root: null, rootMargin: '0px 0px 300px 0px', threshold: 0 }
  )
  observer.observe(sentinel.value)
}
function cleanupObserver() {
  if (observer) { observer.disconnect(); observer = null }
}

function onBus(e: Event) {
  const { action } = (e as CustomEvent).detail || {}
  if (action === 'downloadSelected') handleDownload(selectedIds.value)
  if (action === 'paySelected') handlePay(downloadedSelectedIds.value)
}

onMounted(async () => {
  await loadPayrolls(false)
  setupObserver()
  window.addEventListener('payroll:action', onBus as any)
})
onBeforeUnmount(() => {
  cleanupObserver()
  window.removeEventListener('payroll:action', onBus as any)
})
</script>
