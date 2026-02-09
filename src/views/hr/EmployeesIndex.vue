<!-- src/views/hr/EmployeesTableFromStaffUsers.vue -->
<template>
  <div class="flex flex-col">
    <!-- Header -->
    <div class="dark:border-gray-700 bg-white">
      <div class="flex items-center justify-between p-4 border-b rounded-md border-gray-200">
        <div class="flex items-center gap-2">
          <p class="text-xl font-semibold">{{ $t('employees') }}</p>
          <p class="text-sm text-slate-500">({{ $t('hr') || 'Կադրեր' }})</p>
        </div>
      </div>
    </div>

    <!-- Breadcrumb -->
    <nav class="flex bg-blue-50 py-2 items-center text-sm" aria-label="Breadcrumb">
      <ol class="inline-flex items-center">
        <li>
          <router-link :to="'/hr'" class="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-slate-100">
            <span class="underline-offset-2 hover:underline">{{ $t('hr') || 'Կադրեր' }}</span>
          </router-link>
        </li>
        <li aria-hidden="true" class="px-1">
          <svg class="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
            <path d="M7.05 3.55a1 1 0 0 1 1.4 0l4.5 4.5a1 1 0 0 1 0 1.4l-4.5 4.5a1 1 0 0 1-1.4-1.4L10.79 10 7.05 6.26a1 1 0 0 1 0-1.41z"/>
          </svg>
        </li>
        <li>
          <router-link :to="'/hr/employees'" class="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-slate-100">
            <span class="underline-offset-2 hover:underline">{{ $t('employees') }}</span>
          </router-link>
        </li>
      </ol>
    </nav>
  </div>

  <div class="flex flex-col gap-4">
    <div v-if="uiError" class="rounded-xl border border-red-200 bg-red-50 text-red-800 p-3">
      {{ uiError }}
    </div>

    <!-- Toolbar -->
    <div class="bg-white border-gray-300 overflow-hidden p-4 flex flex-col gap-y-2">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-wrap items-center gap-2">
          <input
              v-model.trim="q"
              @input="debouncedReload"
              :placeholder="$t('search') || 'Որոնել՝ անուն, բաժին, պաշտոն…'"
              class="border border-gray-300 rounded-xl px-3 py-2 w-[220px] md:w-[320px]"
          />
          <select v-model="status" @change="reloadAll(true)" class="border border-gray-300 rounded-xl px-3 py-2">
            <option value="all">{{ $t('all') || 'Բոլորը' }}</option>
            <option value="new_hires">{{ $t('new_hires') || 'Նոր ընդունվածներ' }}</option>
            <option value="needs_docs">{{ $t('needs_docs') || 'Պետք է փաստաթղթեր' }}</option>
            <option value="active">{{ $t('active') || 'Ակտիվ' }}</option>
          </select>
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white border border-gray-300 rounded-2xl overflow-hidden">
        <div class="overflow-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-50 text-gray-600">
            <tr>
              <th class="text-left px-4 py-3">#</th>
              <th class="text-left px-4 py-3">{{ $t('status') }}</th>
              <th class="text-left px-4 py-3">Անուն Ազգանուն</th>
              <th class="text-left px-4 py-3">Ստորաբաժանում</th>
              <th class="text-left px-4 py-3">Հաստիք</th>
              <th class="text-left px-4 py-3">{{ $t('onboarding') || 'Onboarding' }}</th>
              <th class="text-left px-4 py-3"></th>
            </tr>
            </thead>
            <tbody class="divide-y divide-gray-300">
            <tr v-for="(e, i) in filtered" :key="e.id" class="hover:bg-gray-50">
              <td class="px-4 py-3">{{ i + 1 }}</td>
              <td class="px-4 py-3">{{ e.event_status ? $t('event_' + e.event_status) : '-' }}</td>
              <td class="px-4 py-3">
                <div class="font-medium">{{ e.name }}</div>
                <div class="text-xs text-gray-500">{{ e.email || '—' }}</div>
              </td>
              <td class="px-4 py-3">{{ e.department || '—' }}</td>
              <td class="px-4 py-3">{{ e.position || '—' }}</td>
              <td class="px-4 py-3">
                <div class="flex flex-wrap gap-1">
                  <span v-if="e.meta.is_new_hire" class="px-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-700 border border-blue-200">Նոր</span>
                  <span v-if="e.hasEmployee" class="px-2 py-0.5 text-xs rounded-full bg-sky-50 text-sky-700 border border-sky-200">{{ $t('personal_information') }}</span>
                  <span v-if="e.hasContract && e.hasEmployee" class="px-2 py-0.5 text-xs rounded-full bg-amber-50 text-amber-700 border border-amber-200">Առկա է պայմանագիր</span>
                  <span v-if="e.bank_name && e.hasEmployee" class="px-2 py-0.5 text-xs rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Բանկային ռեկվիզիտներ առկա են</span>
                </div>
              </td>
              <td class="px-2 py-2">
                <div class="flex flex-wrap gap-2 mt-3">
                  <button
                      v-if="!e.hasEmployee"
                      class=" whitespace-nowrap bg-indigo-600 text-white hover:bg-indigo-700  px-3 py-1 text-xs rounded-md border"
                      @click="addEmployee(e)"
                  >
                    Գրանցել անձնական տվյալները
                  </button>
                  <button
                      v-if="e.employee_id"
                      class=" whitespace-nowrap bg-emerald-600 text-white hover:bg-emerald-700  px-3 py-1 text-xs rounded-md border"
                      @click="openRequisites(e)"
                  >
                    Բանկային ռեկվիզիտներ
                  </button>
                  <button
                      v-if="e.hasEmployee"
                      class="whitespace-nowrap   bg-amber-600 text-white hover:bg-amber-700  px-3 py-1 text-xs rounded-md border"
                      :disabled="loadingContract"
                      @click="openContract(e)"
                  >
                    {{ $t('add_contract') || 'Ավելացնել պայմանագիր' }}
                  </button>

                  <button
                      v-if="e.status==='pending'&&e.hasContract"
                      class="whitespace-nowrap  bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 px-3 py-1 text-xs rounded-md border"
                      @click="openActivateModal(e)"
                  >
                    {{ $t('activate') }}
                  </button>
                  <RouterLink
                      :to="`/hr/employees/${e.employee_id}/manage`"
                      class="whitespace-nowrap   bg-blue-600 text-white hover:bg-blue-700  px-3 py-1 text-xs rounded-md border"
                  >
                    {{ $t('view') }}
                  </RouterLink>
                </div>
              </td>
            </tr>

            <tr v-if="!filtered.length">
              <td colspan="8" class="px-4 py-8 text-center text-gray-500">{{ $t('nothing_found') }}</td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <EmployeeActivateModal
        v-if="showActivateModal"
        :user="activateData"
        @close="closeActiveModal"
        @saved="saveActiveEmployee"
    />

    <AddEmployeeModal
        :open="showAdd"
        :user_id="addPrefill.user_id"
        :name="addPrefill.name"
        :email="addPrefill.email"
        :staff-user="selectedStaffUser"
        @close="() => { showAdd=false; selectedStaffUser=null }"
        @saved="onSavedEmployee"
    />

    <BankRequisitesForm
        :open="showRequisites"
        :initial="{ bank_name: selectedStaffUser?.bank_name, bank_account: selectedStaffUser?.bank_account }"
        :extra-payload="{ employee_id: selectedStaffUser?.id }"
        @close="() => { showRequisites=false; selectedStaffUser=null }"
        @saved="onSavedEmployee"
    />

    <EmploymentContractModal
        v-if="showContract"
        :employee="employeeForContract"
        @saved="onContractSaved"
        @close="() => { showContract=false; employeeForContract=null }"
    />

  </div>
</template>

<script setup lang="ts">
import {computed, onMounted, ref} from 'vue'
import {employeesApi} from '@/api.js'
import AddEmployeeModal from './components/Employee/EmployeeModal.vue'
import EmploymentContractModal from './components/Employee/EmployeeContractModal.vue'
import EmployeeActivateModal from "@/views/hr/components/Employee/EmployeeActivateModal.vue";
import BankRequisitesForm from "@/views/hr/components/Employee/BankRequisitesFormModal.vue";
import {useI18n} from "vue-i18n";

const {t} = useI18n();

/** Remote & UI state (single definitions) */
const staffUsers = ref<any>({data: []})
const loading = ref(false)
const showActivateModal = ref(false)
const activateData = ref<object | null>(null)
const q = ref('')
const status = ref<'all' | 'new_hires' | 'needs_docs' | 'active' | 'inactive'>('all')
const uiError = ref('')

/** Modals */
const showAdd = ref(false)
const showRequisites = ref(false)
const addPrefill = ref<{ user_id: number | null; name: string | null; email: string | null }>({ user_id: null, name: null, email: null })
const selectedStaffUser = ref<any | null>(null)

/** Types */
type Id = number
type StaffUser = any
type TableRow = {
  id: Id
  employee_id: Id | null
  name: string
  email: string | null
  department: string | null
  position: string | null
  candidate: boolean
  hasEmployee: boolean
  hasContract: boolean
  status: string | null
  event_status: string | null
  meta: { is_new_hire: boolean; needs_docs: boolean; needs_contract: boolean }
  isWorker: boolean
  bank_name?: string
  bank_account?: string
}

/** Map API -> table rows */
const rows = computed<TableRow[]>(() => {
  const list = (staffUsers.value?.data || []) as StaffUser[]
  return list.map((u: any) => {
    const department = u.department_staff?.department?.name ?? u.candidate?.application?.department?.name ?? null
    const position = u.user?.roles?.[0]?.name ?? null
    const isWorker = Boolean(u.department_staff)
    const hasEmployee = Boolean(u.user?.employee_data_filled)
    const hasContract = Boolean(u?.contracts_count > 0)
    const isNew = (u.user?.status || '').toLowerCase() === 'pending'
    return {
      id: u.user?.id,
      employee_id: u?.id ?? null,
      status: u?.user?.status ?? null,
      event_status: u?.latest_event?.event_type ?? null,
      name: (u.first_name || '') + ' ' + (u.last_name || ''),
      email: u.email || null,
      department,
      position,
      candidate: !!u.candidate,
      hasEmployee,
      hasContract,
      meta: {
        is_new_hire: isNew,
        needs_docs: !hasEmployee || !hasContract,
        needs_contract: hasContract,
      },
      isWorker,
      bank_name: u.bank_name,
      bank_account: u.bank_account,
      active_contract: u.active_contract
    }
  })
})

/** Filtering/search */
function normalize(s?: string | null) { return (s || '').toLowerCase() }
const filtered = computed(() => {
  const term = normalize(q.value)
  let list = rows.value.slice()
  list = list.filter(e => {
    switch (status.value) {
      case 'new_hires': return e.meta.is_new_hire
      case 'needs_docs': return e.meta.needs_docs
      case 'active': return e.status === 'active'
      case 'inactive': return false
      default: return true
    }
  })
  if (term) {
    list = list.filter(e => [e.name, e.email, e.department, e.position].some(v => normalize(String(v || '')).includes(term)))
  }
  return list
})

/** UI hooks */
function addEmployee(e: TableRow) {
  addPrefill.value = {user_id: e.id, name: e.name, email: e.email}
  const list = (staffUsers.value?.data || []) as any[]
  selectedStaffUser.value = list.find(u => u.id === e.employee_id) || null
  showAdd.value = true
}
function openRequisites(e: TableRow) {
  const list = (staffUsers.value?.data || []) as any[]
  selectedStaffUser.value = list.find(u => u.id === e.employee_id) || null
  showRequisites.value = true
}

/** Networking */
function reloadAll() { void loadStaffUsers() }
let _t: any = null
function debouncedReload() {
  clearTimeout(_t)
  _t = setTimeout(() => { void loadStaffUsers() }, 350)
}
async function loadStaffUsers() {
  loading.value = true
  try {
    const res = await employeesApi.list({search: q.value, limit: 500})
    staffUsers.value = res?.data?.data ? res.data : (res?.data || {data: []})
  } finally {
    loading.value = false
  }
}
async function onSavedEmployee() {
  showAdd.value = false
  selectedStaffUser.value = null
  await loadStaffUsers()
}
onMounted(loadStaffUsers)

/** Contract modal */
const showContract = ref(false)
const employeeForContract = ref<any | null>(null)
const loadingContract = ref(false)
async function openContract(row: TableRow) {
  loadingContract.value = true
  try {
    const staff = (staffUsers.value?.data || []).find((u: any) => u.id === row.employee_id) || {}
    const employee = staff
    employee.role_id = staff.user?.roles?.[0]?.id
    employee.department_id = staff.department_staff?.department_id ?? staff?.candidate?.application?.department?.id
    employeeForContract.value = {...employee, status: (staff.status || 'pending')}
    showContract.value = true
  } finally {
    loadingContract.value = false
  }
}
function onContractSaved() {
  showContract.value = false
  employeeForContract.value = null
  loadStaffUsers()
  ;(window as any)?.$toast?.success?.('Պայմանագիրը ստեղծվեց') ?? void 0
}

/** Activate modal */
function openActivateModal(e: TableRow) { activateData.value = e; showActivateModal.value = true }
const closeActiveModal = () => { showActivateModal.value = false; activateData.value = null }
const saveActiveEmployee = () => { loadStaffUsers(); showActivateModal.value = false; activateData.value = null }

/** Dismiss (kept) */
const dismissEmployee = async (v: object) => {
  try {
    if (!confirm(t('Հեռացնել Աշխատակցին'))) return
    await employeesApi?.dismissEmployee?.((v as any).employee_id)
    loadStaffUsers();
  } catch (e) {
    console.error(e)
    uiError.value = t('error_generic') || 'Սխալ է տեղի ունեցել'
  }
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity .15s ease }
.fade-enter-from, .fade-leave-to { opacity: 0 }
</style>
