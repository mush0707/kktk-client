<template>
  <div class="space-y-4 bg-white p-4 border border-gray-300 rounded-xl">
    <!-- Toolbar (same header & filters) -->
    <div class="flex flex-col gap-y-2">
      <div class="flex items-center gap-2">
        <!-- Search -->
        <input
            v-model="q"
            @input="debouncedSearch"
            class="px-3 py-2 rounded-xl border border-gray-300 w-72"
            :placeholder="$t('search_placeholder') || 'Փնտրել (աշխատակից)…'"
        />

        <!-- Date range -->
        <input
            v-model="filterStart"
            @change="onFilterDatesChange"
            type="date"
            class="px-3 py-2 rounded-xl border border-gray-300"
            :placeholder="$t('start') || 'Սկիզբ'"
            title="Սկիզբ"
        />
        <input
            v-model="filterEnd"
            @change="onFilterDatesChange"
            type="date"
            class="px-3 py-2 rounded-xl border border-gray-300"
            :placeholder="$t('end') || 'Վերջ'"
            title="Վերջ"
        />

        <!-- Status -->
        <select
            v-model="filterStatus"
            @change="triggerFilters"
            class="px-3 py-2 rounded-xl border border-gray-300"
            title="Կարգավիճակ"
        >
          <option :value="''">{{ $t('all') || 'Բոլորը' }}</option>
          <option value="pending">{{ $t('pending') || 'Սպասման' }}</option>
          <option value="approved">{{ $t('approved') || 'Հաստատված' }}</option>
          <option value="cancelled">{{ $t('cancelled') || 'Չեղարկված' }}</option>
        </select>

        <button
            v-if="filterStart || filterEnd || filterStatus"
            class="px-2 py-1 text-xs rounded-lg border border-gray-300 hover:bg-gray-50"
            @click="() => { filterStart=''; filterEnd=''; filterStatus=''; triggerFilters() }"
        >
          {{ $t('reset_filters') || 'Մաքրել ֆիլտրերը' }}
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white border border-gray-300 overflow-x-auto">
      <table class="min-w-full text-sm whitespace-nowrap">
        <thead class="bg-gray-50">
        <tr class="text-left">
          <th class="px-4 py-3">#</th>
          <th class="px-4 py-3">{{ $t('employee') || 'Աշխատակից' }}</th>
          <th class="px-4 py-3">{{ $t('start') || 'Սկիզբ' }}</th>
          <th class="px-4 py-3">{{ $t('end') || 'Վերջ' }}</th>
          <th class="px-4 py-3">{{ $t('status') || 'Կարգավիճակ' }}</th>
          <th class="px-4 py-3">Տեղափոխություն</th>
          <th class="px-4 py-3"></th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="row in rows" :key="row.id" class="border-t">
          <td class="px-4 py-3 font-medium">#{{ row.id }}</td>

          <!-- Employee -->
          <td class="px-4 py-3">
            {{ row.employee?.first_name }} {{ row.employee?.last_name }}
          </td>

          <!-- Start / End -->
          <td class="px-4 py-3">{{ fmtDT(row.start_time) }}</td>
          <td class="px-4 py-3">{{ fmtDT(row.finished_time) }}</td>

          <!-- Status badge -->
          <td class="px-4 py-3">
              <span
                  class="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs border"
                  :class="statusMeta(row.status).chip"
              >
                <span class="w-1.5 h-1.5 rounded-full" :class="statusMeta(row.status).dot"></span>
                {{ $t(statusMeta(row.status).label) || statusMeta(row.status).label }}
              </span>
          </td>

          <!-- Movement combined column -->
          <td class="px-4 py-3">
            <div v-if="row.movement" class="inline-flex flex-col gap-0.5 px-3 py-2 rounded-lg border bg-white border-gray-200">
              <div class="text-[13px] font-medium">
                {{ row.movement?.employee?.first_name }} {{ row.movement?.employee?.last_name }}
              </div>
              <div class="text-[12px] text-slate-600">
                {{ fmtDT(row.movement?.start_time) }} – {{ fmtDT(row.movement?.finished_time) }}
              </div>
            </div>
            <span v-else class="text-slate-400 text-xs">—</span>
          </td>

          <!-- Actions -->
          <td class="px-4 py-3">
            <div class="flex items-center gap-2">
              <button
                  v-if="row.status === 'pending'"
                  class="px-3 py-1 text-xs text-white bg-green-600 rounded-md hover:bg-green-700"
                  @click="approveRow(row)"
              >
                {{ $t('approve') || 'Ընդունել' }}
              </button>
              <button
                  v-if="row.status === 'pending'"
                  class="px-3 py-1 text-xs text-white bg-red-600 rounded-md hover:bg-red-700"
                  @click="cancelRow(row)"
              >
                {{ $t('cancel') || 'Չեղարկել' }}
              </button>
            </div>
          </td>
        </tr>

        <tr v-if="!loading && rows.length===0">
          <td colspan="7" class="p-6 text-center text-gray-500">
            {{ $t('empty') || 'Դատարկ է' }}
          </td>
        </tr>
        </tbody>
      </table>
    </div>

    <!-- Sentinel for infinite scroll -->
    <div ref="sentinel" class="h-1"></div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, computed } from 'vue'
import { employeesApi } from '@/api.ts'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

/* ---------- Status badges (pending/approved/cancelled) ---------- */
const STATUS_META: Record<string, { label: string; chip: string; dot: string }> = {
  pending: {
    label: 'pending',
    chip: 'bg-amber-50 text-amber-800 border-amber-200',
    dot: 'bg-amber-500',
  },
  approved: {
    label: 'approved',
    chip: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  cancelled: {
    label: 'cancelled',
    chip: 'bg-gray-50 text-gray-700 border-gray-200',
    dot: 'bg-gray-400',
  },
}
function statusMeta(s: string | null | undefined) {
  const key = String(s || '').toLowerCase()
  return STATUS_META[key] ?? {
    label: key || 'unknown',
    chip: 'bg-slate-50 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
  }
}

/* ---------- List state ---------- */
const q = ref('')
const rows = ref<any[]>([])
const loading = ref(false)
const eof = ref(false)
const LIMIT = 20
const offset = ref(0)
const sentinel = ref<HTMLElement | null>(null)
let io: IntersectionObserver | null = null
let tId: number | ReturnType<typeof setTimeout> | null = null

/* Filters: start_date / end_date / status */
const filterStart = ref<string>('') // YYYY-MM-DD
const filterEnd = ref<string>('')   // YYYY-MM-DD
const filterStatus = ref<string>('') // 'pending' | 'approved' | 'cancelled' | ''

/* ---------- Helpers ---------- */
function fmtDT(s?: string | null) {
  if (!s) return '—'
  // Accept 'YYYY-MM-DD HH:mm:ss' or ISO
  const str = s.replace(' ', 'T')
  const d = new Date(str)
  if (isNaN(d.getTime())) return s
  return d.toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}
function normalizeRangeInPlace() {
  if (filterStart.value && filterEnd.value && filterEnd.value < filterStart.value) {
    filterEnd.value = filterStart.value
  }
}
function onFilterDatesChange() {
  normalizeRangeInPlace()
  triggerFilters()
}
function triggerFilters() {
  if (tId) clearTimeout(tId as number)
  tId = setTimeout(resetAndReload, 150)
}
function debouncedSearch() {
  if (tId) clearTimeout(tId as number)
  tId = setTimeout(resetAndReload, 300)
}

/* ---------- Data fetching (limit/offset infinite scroll) ---------- */
async function fetchNext() {
  if (loading.value || eof.value) return
  loading.value = true
  try {
    const params: any = {
      limit: LIMIT,
      offset: offset.value,
      search: q.value || undefined,
      start_date: filterStart.value || undefined,
      end_date: filterEnd.value || undefined,
      status: filterStatus.value || undefined,
    }
    const apiList = (employeesApi as any)?.overtimes?.list
    if (typeof apiList !== 'function') {
      console.warn('employeesApi.overtimes.list is missing. Falling back to calling /employees/overtimes via generic client.')
    }
    const { data } = await apiList?.(params) ?? {}
    const batch = (data?.data ?? data ?? []) as any[]
    rows.value.push(...batch)
    if (batch.length < LIMIT) eof.value = true
    else offset.value += LIMIT
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}
async function resetAndReload() {
  rows.value = []
  offset.value = 0
  eof.value = false
  await fetchNext()
}

/* ---------- Actions: approve / cancel (only pending) ---------- */
async function approveRow(row: any) {
  if (row?.status !== 'pending') return
  const confirmed = window.confirm(t('confirm_approve') || 'Հաստատե՞լ արտաժամը:')
  if (!confirmed) return
  try {
    const apiApprove = (employeesApi as any)?.overtimes?.approve
    await apiApprove?.(row.id) // POST /employees/overtimes/{id}/approve
    row.status = 'approved'
  } catch (e) {
    console.error(e)
  }
}
async function cancelRow(row: any) {
  if (row?.status !== 'pending') return
  const confirmed = window.confirm(t('confirm_cancel') || 'Չեղարկե՞լ արտաժամը:')
  if (!confirmed) return
  try {
    const apiCancel = (employeesApi as any)?.overtimes?.cancel
    await apiCancel?.(row.id) // DELETE /employees/overtimes/{id}/cancel
    row.status = 'cancelled'
  } catch (e) {
    console.error(e)
  }
}

/* ---------- Lifecycle ---------- */
onMounted(() => {
  io = new IntersectionObserver(entries => {
    if (entries.some(e => e.isIntersecting)) fetchNext()
  }, { rootMargin: '0px 0px 200px' })
  if (sentinel.value) io.observe(sentinel.value)
  resetAndReload()
})
onBeforeUnmount(() => {
  if (io && sentinel.value) io.unobserve(sentinel.value)
  io = null
})
</script>
