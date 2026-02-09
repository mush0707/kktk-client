<template>
  <div class="space-y-4 bg-white p-4 border border-gray-300 rounded-xl">
    <!-- Toolbar -->
    <div class="flex flex-col gap-y-2">
      <div class="flex items-center gap-2">
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
          <option value="active">{{ $t('active') || 'Ակտիվ' }}</option>
          <option value="rejected">{{ $t('rejected') || 'Մերժված' }}</option>
          <option value="canceled">{{ $t('canceled') || 'Չեղարկված' }}</option>
        </select>
        <button
            v-if="filterStart || filterEnd || filterStatus"
            class="px-2 py-1 text-xs rounded-lg border border-gray-300 hover:bg-gray-50"
            @click="() => { filterStart=''; filterEnd=''; filterStatus=''; triggerFilters() }"
        >
          {{ $t('reset_filters') || 'Մաքրել ֆիլտրերը' }}
        </button>
        <div class="flex">
          <button
              class="ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
              @click="openCreateModal"
          >
            {{ $t('new_leave_request') || 'Նոր բացթողման հայտ' }}
          </button>
        </div>
      </div>
    </div>


    <!-- Table -->
    <div class="bg-white border border-gray-300 overflow-x-auto">
      <table class="min-w-full text-sm whitespace-nowrap">
        <thead class="bg-gray-50">
        <tr class="text-left">
          <th class="px-4 py-3">#</th>
          <th class="px-4 py-3">{{ $t('employee') || 'Աշխատակից' }}</th>
          <th class="px-4 py-3">{{ $t('leave_type') || 'Արձակուրդի տեսակ' }}</th>
          <th class="px-4 py-3">{{ $t('start') || 'Սկիզբ' }}</th>
          <th class="px-4 py-3">{{ $t('end') || 'Վերջ' }}</th>
          <th class="px-4 py-3">{{ $t('days_count') || 'Օրեր' }}</th>
          <th class="px-4 py-3">{{ $t('status') || 'Կարգավիճակ' }}</th>
          <th class="px-4 py-3"></th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="row in rows" :key="row.id" class="border-t">
          <td class="px-4 py-3 font-medium">#{{ row.id }}</td>
          <td class="px-4 py-3">{{ row.employee.first_name }} {{ row.employee.last_name }}</td>
          <td class="px-4 py-3">{{ row.type?.name || row.name || '—' }}</td>
          <td class="px-4 py-3">{{ row.date_from }}</td>
          <td class="px-4 py-3">{{ row.date_to }}</td>
          <td class="px-4 py-3">{{ row.days }}</td>
          <td class="px-4 py-3">
            <span
                class="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs border"
                :class="statusMeta(row.status).chip"
            >
              <span class="w-1.5 h-1.5 rounded-full" :class="statusMeta(row.status).dot"></span>
              {{ $t(statusMeta(row.status).label) || statusMeta(row.status).label }}
            </span>
          </td>
          <td class="px-4 py-3 flex gap-2">
            <button
                v-if="row.status==='pending'"
                class="px-3 py-1 text-xs text-white bg-green-600 rounded-md hover:bg-green-700"
                @click="approveStatus(row.id, 'approved')"
            >
              {{ $t('approve') || 'Ընդունել' }}
            </button>

            <button
                v-if="row.status==='pending'"
                class="px-3 py-1 text-xs text-white bg-red-600 rounded-md hover:bg-red-700"
                @click="openRejectModal(row.id)"
            >
              {{ $t('reject') || 'Մերժել' }}
            </button>
          </td>
        </tr>

        <tr v-if="!loading && rows.length===0">
          <td colspan="8" class="p-6 text-center text-gray-500">
            {{ $t('empty') || 'Դատարկ է' }}
          </td>
        </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Reject modal -->
  <div v-if="cancelModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/30" @click="closeRejectModal"></div>

    <div class="relative bg-white rounded-2xl w-full max-w-md shadow-xl p-6">
      <h3 class="text-lg font-semibold mb-4">
        {{ $t('reject_request') || 'Մերժել արձակուրդի հայտը' }}
      </h3>

      <div class="flex flex-col gap-y-2">
        <label class="block text-sm text-gray-600">
          {{ $t('comment') || 'Մեկնաբանություն' }}
          <span class="text-red-600">*</span>
        </label>
        <textarea
            v-model.trim="cancelComment"
            class="w-full border rounded-lg p-2 resize-none h-24"
            placeholder="Նշեք մերժման պատճառը…"
        ></textarea>
      </div>

      <div v-if="formError" class="rounded-xl border border-red-200 bg-red-50 text-red-800 p-2 text-sm mt-3">
        {{ formError }}
      </div>

      <div class="flex justify-end gap-2 mt-6 border-t pt-3">
        <button class="px-4 py-2 rounded-lg border hover:bg-gray-100" @click="closeRejectModal">
          {{ $t('close') || 'Փակել' }}
        </button>
        <button
            class="px-4 py-2 rounded-lg text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
            @click="submitReject"
            :disabled="cancelLoading"
        >
          {{ cancelLoading ? ($t('loading') || 'Բեռնում...') : ($t('confirm_reject') || 'Հաստատել մերժումը') }}
        </button>
      </div>
    </div>
  </div>

  <!-- Create modal -->
  <div v-if="createOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/30" @click="closeCreateModal"></div>

    <div class="relative bg-white rounded-2xl w-full max-w-2xl shadow-xl p-6">
      <h3 class="text-lg font-semibold mb-4">
        {{ $t('new_leave_request') || 'Նոր բացթողման հայտ' }}
      </h3>

      <div class="grid md:grid-cols-2 gap-4 text-sm">
        <!-- Employee (v-model is number | null) -->
        <div class="md:col-span-2">
          <label class="block text-slate-700 mb-1">
            {{ $t('employee') || 'Աշխատակից' }} <span class="text-red-600">*</span>
          </label>
          <VueSelect
              v-model="form.employee"
              :options="employeeOptions"
              :get-option-value="o => o.id"
              label="label"
              :filterable="true"
              :clearable="true"
              :loading="loadingEmployees"
              @open="loadEmployees('')"
              @search="loadEmployees"
              placeholder="Ընտրել աշխատակցին…"
          />
        </div>

        <div v-if="form.employee" class="col-span-2 grid grid-cols-2 gap-4">
          <!-- Leave type (v-model is number | 'custom' | null) -->
          <div class="col-span-2 grid grid-cols-2 gap-4">
            <div class="flex flex-col">
              <label class="block text-slate-700 mb-1">
                {{ $t('leave_type') || 'Արձակուրդի տեսակ' }} <span class="text-red-600">*</span>
              </label>
              <VueSelect
                  v-model="form.leave_type"
                  :options="leaveTypeOptions"
                  :get-option-value="o => o.id"
                  label="label"
                  :filterable="true"
                  :clearable="true"
                  :loading="loadingLeaveTypes"
                  :disabled="!form.employee"
                  @open="form.employee && leaveTypeOptions.length === 0 && loadLeaveTypesForEmployee(form.employee)"
                  placeholder="Ընտրել տեսակը…"
              />
            </div>
            <div v-if="form.leave_type === 'custom'" class="mt-2 flex flex-col justify-end">
              <input
                  v-model.trim="form.custom_name"
                  type="text"
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  :placeholder="$t('custom_leave_type') || 'Սեփական տեսակ…'"
              />
            </div>
          </div>

          <!-- Dates -->
          <div class="col-span-2 grid grid-cols-2 gap-4">
            <div>
              <label class="block text-slate-700 mb-1">
                {{ $t('start_date') || 'Սկիզբ' }} <span class="text-red-600">*</span>
              </label>
              <input v-model="form.date_from" type="date" class="w-full text-sm border border-gray-300 rounded-lg px-3 py-2" @change="normalizeDates" />
            </div>
            <div>
              <label class="block text-slate-700 mb-1">
                {{ $t('end_date') || 'Վերջ' }} <span class="text-red-600">*</span>
              </label>
              <input v-model="form.date_to" type="date" class="w-full text-sm border border-gray-300 rounded-lg px-3 py-2" @change="normalizeDates" />
            </div>
          </div>

          <div class="md:col-span-2 text-xs text-slate-600">
            <span class="px-2 py-1 rounded bg-slate-100">
              {{ $t('days_count') || 'Օրեր' }}: {{ requestedDays }}
            </span>
          </div>
        </div>
      </div>

      <div v-if="createError" class="rounded-xl border border-red-200 bg-red-50 text-red-800 p-2 text-sm mt-3">
        {{ createError }}
      </div>

      <div class="flex justify-between mt-6 border-t pt-3">
        <div>
          <select v-model="form.status" class="w-full border border-gray-300 text-sm rounded-lg px-3 py-2">
            <option value="pending">{{ $t('pending') || 'Սպասման' }}</option>
            <option value="approved">{{ $t('approved') || 'Հաստատված' }}</option>
          </select>
        </div>
        <div class="flex justify-end gap-2 ">
          <button class="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100" @click="closeCreateModal">
            {{ $t('close') || 'Փակել' }}
          </button>
          <button
              class="px-4 py-2 rounded-lg text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
              :disabled="createLoading || !canCreate"
              @click="submitCreate"
          >
            {{ createLoading ? ($t('loading') || 'Բեռնում...') : ($t('save') || 'Պահպանել') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, computed, watch } from 'vue'
import { leaveRequestApi, employeesApi } from "@/api.ts"
import VueSelect from 'vue3-select-component'
import { useI18n } from "vue-i18n"

const { t } = useI18n()

/* -------- existing list logic -------- */
const q = ref('')
const rows = ref<any[]>([])
const loading = ref(false)
const eof = ref(false)
const LIMIT = 20
const offset = ref(0)
const sentinel = ref<HTMLElement | null>(null)
let io: IntersectionObserver | null = null
let tId: number | ReturnType<typeof setTimeout> | null = null
const filterStart = ref<string>('')   // YYYY-MM-DD
const filterEnd   = ref<string>('')   // YYYY-MM-DD
const filterStatus = ref<string>('')

const STATUS_META: Record<string, { label: string; chip: string; dot: string }> = {
  pending:  {
    label: 'pending',
    chip: 'bg-amber-50 text-amber-800 border-amber-200',
    dot:  'bg-amber-500'
  },
  approved: {
    label: 'approved',
    chip: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dot:  'bg-emerald-500'
  },
  active: {
    label: 'active',
    chip: 'bg-blue-50 text-blue-800 border-blue-200',
    dot:  'bg-blue-500'
  },
  rejected: {
    label: 'rejected',
    chip: 'bg-rose-50 text-rose-800 border-rose-200',
    dot:  'bg-rose-500'
  },
  canceled: {
    label: 'canceled',
    chip: 'bg-gray-50 text-gray-700 border-gray-200',
    dot:  'bg-gray-400'
  }
}
function statusMeta(s: string | null | undefined) {
  const key = String(s || '').toLowerCase()
  return STATUS_META[key] ?? {
    label: key || 'unknown',
    chip: 'bg-slate-50 text-slate-700 border-slate-200',
    dot:  'bg-slate-400'
  }
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
  // small debounce so multiple changes don’t reload repeatedly
  if (tId) clearTimeout(tId as number)
  tId = setTimeout(resetAndReload, 150)
}
watch(filterStatus, () => triggerFilters())
async function fetchNext() {
  if (loading.value || eof.value) return
  loading.value = true
  try {
    const params: any = {
      limit: LIMIT,
      offset: offset.value,
      search: q.value || undefined,
      start_date: filterStart.value || undefined, // ← new
      end_date: filterEnd.value || undefined,     // ← new
      status: filterStatus.value || undefined     // ← new
    }
    const { data } = await leaveRequestApi.list(params)
    const batch = data?.data ?? data ?? []
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
function debouncedSearch() {
  if (tId) clearTimeout(tId as number)
  tId = setTimeout(resetAndReload, 300)
}

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

async function approveStatus(id: number, status: string) {
  const actionText = status === 'approved' ? 'ընդունել' : 'մերժել';
  const confirmed = window.confirm(`Դուք համոզվա՞ծ եք, որ ցանկանում եք ${actionText} այս հայտը?`)
  if (!confirmed) return

  try {
    await leaveRequestApi.approveStatus(id)
    const request = rows.value.find(r => r.id === id)
    if (request) request.status = status
  } catch (e) {
    console.error(e)
  }
}

/* -------- reject modal -------- */
const cancelModalOpen = ref(false)
const cancelId = ref<number | null>(null)
const cancelComment = ref('')
const cancelLoading = ref(false)
const formError = ref('')

function openRejectModal(id: number) {
  cancelId.value = id
  cancelModalOpen.value = true
  cancelComment.value = ''
  formError.value = ''
}
function closeRejectModal() {
  cancelModalOpen.value = false
  cancelId.value = null
  cancelComment.value = ''
  formError.value = ''
}
function validateReject(): string {
  if (!cancelComment.value.trim()) return 'Մեկնաբանությունը պարտադիր է։'
  return ''
}
async function submitReject() {
  formError.value = validateReject()
  if (formError.value) return
  if (!cancelId.value) return
  cancelLoading.value = true
  try {
    await leaveRequestApi.rejectStatus(cancelId.value, { comment: cancelComment.value })
    const request = rows.value.find(r => r.id === cancelId.value)
    if (request) {
      request.status = 'canceled'
      request.comment = cancelComment.value
    }
    closeRejectModal()
  } catch (e) {
    console.error(e)
    formError.value = t('failed_to_reject') || 'Չհաջողվեց մերժել հայտը։'
  } finally {
    cancelLoading.value = false
  }
}

/* -------- create modal -------- */
const createOpen = ref(false)
const createLoading = ref(false)
const createError = ref('')

type EmpOpt = { id: number; label: string }
type LeaveTypeOpt = { id: number | 'custom'; label: string }

const employeeOptions = ref<EmpOpt[]>([])
const loadingEmployees = ref(false)
const leaveTypeOptions = ref<LeaveTypeOpt[]>([])
const loadingLeaveTypes = ref(false)

const form = ref<{
  employee: number | null              // <-- integer ID
  leave_type: number | 'custom' | null // <-- integer ID or 'custom'
  custom_name: string
  date_from: string
  date_to: string
  status: 'pending' | 'approved'
}>({
  employee: null,
  leave_type: null,
  custom_name: '',
  date_from: '',
  date_to: '',
  status: 'pending'
})

function openCreateModal() {
  createOpen.value = true
  createError.value = ''
}
function closeCreateModal() {
  createOpen.value = false
  createLoading.value = false
  createError.value = ''
  form.value = { employee: null, leave_type: null, custom_name: '', date_from: '', date_to: '', status: 'pending' }
}

async function loadEmployees(q: string) {
  loadingEmployees.value = true
  try {
    const { data } = await (employeesApi as any).list({ search: q, limit: 50, with: ['user.roles'] })
    const list = Array.isArray(data) ? data : (data?.data ?? [])
    employeeOptions.value = list.map((u: any) => ({
      id: u.id,
      label: [u.first_name, u.last_name].filter(Boolean).join(' ') +
          (u?.user?.roles?.[0]?.name ? ` (${u.user.roles[0].name})` : '') || `#${u.id}`
    }))
  } finally {
    loadingEmployees.value = false
  }
}

async function loadLeaveTypesForEmployee(employeeId: number) {
  loadingLeaveTypes.value = true
  try {
    const resp = await (employeesApi as any).getLiveTypes(employeeId)
    const list = Array.isArray(resp) ? resp : (resp?.data ?? [])
    leaveTypeOptions.value = [
      ...list.map((t: any) => ({ id: t.id, label: t.name })),
      { id: 'custom', label: t('custom_leave_type') || 'Սեփական տեսակ' }
    ]
  } catch (e) {
    console.error(e)
    leaveTypeOptions.value = [{ id: 'custom', label: t('custom_leave_type') || 'Սեփական տեսակ' }]
  } finally {
    loadingLeaveTypes.value = false
  }
}

/* when employee changes → reset and load types */
watch(() => form.value.employee, (id) => {
  form.value.leave_type = null
  form.value.custom_name = ''
  leaveTypeOptions.value = []
  if (id) loadLeaveTypesForEmployee(id)
})

function normalizeDates() {
  const f = form.value
  if (f.date_from && f.date_to && f.date_to < f.date_from) f.date_to = f.date_from
}
function ymdLocal(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth()+1).padStart(2,'0')
  const day = String(d.getDate()).padStart(2,'0')
  return `${y}-${m}-${day}`
}
const requestedDays = computed(() => {
  const f = form.value
  if (!f.date_from || !f.date_to) return 0
  const s = new Date(f.date_from + 'T00:00:00')
  const e = new Date(f.date_to + 'T00:00:00')
  const diff = Math.round((e.getTime() - s.getTime()) / 86400000) + 1
  return diff > 0 ? diff : 0
})

const canCreate = computed(() => {
  const f = form.value
  if (!f.employee) return false
  if (!f.leave_type) return false
  if (f.leave_type === 'custom' && !f.custom_name.trim()) return false
  if (!f.date_from || !f.date_to) return false
  if (requestedDays.value <= 0) return false
  return true
})

function validateCreate(): string {
  const f = form.value
  if (!f.employee) return 'Ընտրեք աշխատակցին'
  if (!f.leave_type) return 'Ընտրեք արձակուրդի տեսակը'
  if (f.leave_type === 'custom' && !f.custom_name.trim()) return 'Գրեք անվանումը'
  if (!f.date_from || !f.date_to) return 'Լրացրեք սկիզբ և վերջ ամսաթվերը'
  if (requestedDays.value <= 0) return 'Օրերի քանակը սխալ է'
  return ''
}

async function submitCreate() {
  createError.value = validateCreate()
  if (createError.value) return
  createLoading.value = true
  try {
    const f = form.value
    const payload: any = {
      employee_id: f.employee!,
      leave_type_id: f.leave_type === 'custom' ? null : f.leave_type,
      name: f.leave_type === 'custom' ? f.custom_name : null,
      date_from: ymdLocal(new Date(f.date_from)),
      date_to: ymdLocal(new Date(f.date_to)),
      days: requestedDays.value,
      status: f.status
    }

    const resp = await leaveRequestApi.create(payload)
    const created = resp?.data ?? resp ?? null
    const newId = created?.id

    if (f.status === 'approved' && newId) {
      try { await leaveRequestApi.approveStatus(newId) } catch (e) { console.warn('Auto-approve failed', e) }
    }

    // best-effort add to table
    const empLabel = employeeOptions.value.find(e => e.id === f.employee)?.label || ''
    const [fn, ...rest] = empLabel.replace(/\s*\([^)]*\)\s*$/, '').split(' ')
    rows.value.unshift({
      id: newId || Math.floor(Math.random() * 1e9),
      employee: { first_name: fn || '', last_name: rest.join(' ') || '' },
      type: f.leave_type === 'custom' ? null : { name: leaveTypeOptions.value.find(o => o.id === f.leave_type)?.label },
      name: f.leave_type === 'custom' ? f.custom_name : null,
      date_from: payload.date_from,
      date_to: payload.date_to,
      days: requestedDays.value,
      status: f.status
    })

    closeCreateModal()
  } catch (e) {
    console.error(e)
    createError.value = t('failed_to_create') || 'Չհաջողվեց ստեղծել հայտը։'
  } finally {
    createLoading.value = false
  }
}
</script>
