<!-- src/views/hr/EmployeesTableFromStaffUsers.vue -->
<template>
  <div class="flex flex-col">
    <!-- Header -->
    <div class="dark:border-gray-700 bg-white">
      <div class="flex items-center justify-between p-4 border-b rounded-md border-gray-200">
        <div class="flex items-center gap-2">
          <p class="text-xl font-semibold">{{ employee?.first_name + ' ' + employee?.last_name }}</p>
          <p class="text-sm text-slate-500">({{ $t('hr') }})</p>
        </div>

      </div>
    </div>

    <!-- Breadcrumb -->
    <nav class="flex bg-blue-50 py-2 items-center text-sm" aria-label="Breadcrumb">
      <ol class="inline-flex items-center">
        <li>
          <router-link
              :to="'/hr'"
              class="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-slate-100"
          >
            <span class="underline-offset-2 hover:underline">{{ $t('hr') }}</span>
          </router-link>
        </li>
        <li aria-hidden="true" class="px-1">
          <svg class="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
            <path
                d="M7.05 3.55a1 1 0 0 1 1.4 0l4.5 4.5a1 1 0 0 1 0 1.4l-4.5 4.5a1 1 0 0 1-1.4-1.4L10.79 10 7.05 6.26a1 1 0 0 1 0-1.41z"/>
          </svg>
        </li>
        <li>
          <router-link
              :to="'/hr/employees'"
              class="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-slate-100"
          >
            <span class="underline-offset-2 hover:underline">{{ $t('employees') }}</span>
          </router-link>
        </li>
        <li aria-hidden="true" class="px-1">
          <svg class="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
            <path
                d="M7.05 3.55a1 1 0 0 1 1.4 0l4.5 4.5a1 1 0 0 1 0 1.4l-4.5 4.5a1 1 0 0 1-1.4-1.4L10.79 10 7.05 6.26a1 1 0 0 1 0-1.41z"/>
          </svg>
        </li>
        <li>
          <p class="inline-flex items-center gap-1 rounded-md px-2 py-1">
            <span class="underline-offset-2 hover:underline">{{ $t('personal_information') }}</span>
          </p>
        </li>
      </ol>
    </nav>

  </div>
  <div class="flex flex-col gap-4 px-4 py-4">
    <!-- Header -->
    <div class="bg-white border border-gray-300 rounded-2xl overflow-hidden">
      <div class="p-4 flex items-center justify-between border-b">
        <div class="text-lg font-semibold">{{ $t('personal_information') }}</div>
      </div>

      <!-- Tabs -->
      <div class="flex border-b text-sm font-medium text-gray-600">
        <button
            v-for="tab in tabs"
            :key="tab.value"
            @click="activeTab = tab.value"
            class="px-4 py-2 transition-colors"
            :class="activeTab === tab.value ? 'border-b-2 border-blue-600 text-blue-600' : 'hover:text-gray-800'"
        >
          {{ tab.label }}
        </button>
      </div>
      <!-- Employees Table -->
      <div v-if="activeTab === 'documents'" class="bg-white border border-gray-300 rounded-2xl overflow-hidden">
        <div class="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 text-left">
            <tr>
              <th class="px-4 py-2">{{ $t('contract_number') }}</th>
              <th class="px-4 py-2">{{ $t('work_time_type') }}</th>
              <th class="px-4 py-2 w-24">{{ $t('start_date') }}</th>
              <th class="px-4 py-2 w-28 hidden md:table-cell">{{ $t('end_date') }}</th>
              <th class="px-4 py-2 hidden md:table-cell">{{ $t('base_rate') }}</th>
            </tr>
            </thead>
            <tbody>
            <template v-for="(assignment, contractId) in employee?.schedule_assignments" :key="assignment.id">
              <!-- Clickable department row -->
              <tr
                  class="border-t cursor-pointer select-none hover:bg-gray-50"
                  role="button"
                  tabindex="0"
                  :aria-expanded="!!expanded[contractId]"
                  @click="toggleDepartment(contractId)"
                  @keydown.enter.prevent="toggleDepartment(contractId)"
                  @keydown.space.prevent="toggleDepartment(contractId)"
              >
                <td class="px-4 py-2">{{ assignment.contract.contract_number }}</td>
                <td class="px-4 py-2">{{ $t(assignment.contract.work_time_type) }}</td>
                <td class="px-4 py-2 whitespace-nowrap">
                  {{ assignment.start_date }}
                </td>
                <td class="px-4 py-2 whitespace-nowrap">
                  {{ assignment.end_date }}
                </td>
                <td class="px-4 py-2 whitespace-nowrap">
                  {{ assignment.contract.base_rate }} {{ assignment.contract.currency }}
                </td>
                <td class="px-4 py-2 relative">
                  {{ $t(assignment.contract.status) }}
                </td>
              </tr>
              <tr v-if="expanded[contractId]">
                <td :colspan="6" class="px-0 md:px-4 pt-2 pb-4 bg-slate-50">
                  <!-- Desktop table (≥md) -->
                  <div class="hidden md:block overflow-x-auto rounded-xl border border-gray-200 bg-white mx-4">
                    <table class="w-full text-sm">
                      <thead class="bg-gray-50 text-left">
                      <tr>
                        <th class="px-3 py-2">{{ $t('work_schedule') }}</th>
                        <th v-if="assignment.schedule.is_sum_accounting" class="px-3 py-2 w-24">{{
                            $t('period_days')
                          }}
                        </th>
                        <th v-if="!assignment.schedule.is_sum_accounting" class="px-3 py-2 w-24">(օր/ժամ)</th>
                      </tr>
                      </thead>
                      <tbody>

                      <tr
                          class="border-t  select-none hover:bg-gray-50">

                        <td class="px-4 py-2 whitespace-nowrap">
                          {{ assignment.schedule.name }}
                        </td>
                        <td class="px-4 py-2 whitespace-nowrap"
                            v-if="assignment.schedule.is_sum_accounting">
                          {{ assignment.schedule.period_days ?? '-' }}
                        </td>
                        <td v-if="!assignment.schedule.is_sum_accounting" class="px-4 py-2 whitespace-nowrap w-100">
                          <div class="grid grid-cols-4 gap-2">
                            <div
                                v-for="(day, index) in assignment.schedule.pattern"
                                :key="index"
                                class="flex flex-col items-center"
                            >
                              <span class="font-medium">{{ DOW[index] }}</span>
                              <span>{{ day.hours }} ժ</span>
                            </div>
                          </div>
                        </td>


                        <td>

                        </td>
                      </tr>


                      </tbody>
                    </table>
                    <div v-if="assignment?.contract.documents.length">
                      <div class="text-slate-500 font-bold m-4">{{ $t('documents') }}</div>
                      <table class="w-full text-sm">
                        <thead class="bg-gray-50 text-left">
                        <tr>
                          <th class="px-3 py-2">{{ $t('name') }}</th>
                          <th class="px-3 py-2">{{ $t('extension') }}</th>
                          <th class="px-3 py-2">{{ $t('file_size') }}</th>
                          <th class="px-3 py-2">{{ $t('created_date') }}</th>
                        </tr>
                        </thead>
                        <tbody>
                        <template v-for="doc in assignment?.contract.documents">
                          <tr
                              class="border-t  select-none hover:bg-gray-50">

                            <td class="px-4 py-2 whitespace-nowrap">
                              {{ doc.type?.name }}
                            </td>
                            <td class="px-4 py-2 whitespace-nowrap">
                              {{ doc.extension?.toUpperCase() }}
                            </td>
                            <td class="px-4 py-2 whitespace-nowrap">
                              {{ (doc.size / 1024).toFixed(1) }} KB
                            </td>
                            <td class="px-4 py-2 whitespace-nowrap">
                              {{ formatDateTime(doc.updated_at) }} • {{ fromNow(doc.updated_at) }}
                            </td>
                            <td class="px-4 py-2 whitespace-nowrap">
                              <a
                                  :href="doc.full_path"
                                  class="px-3 py-1.5 text-xs text-white bg-blue-600 rounded-md hover:bg-blue-700 transition"
                                  target="_blank"
                                  download
                              >
                                {{ $t('download') }}
                              </a>
                            </td>
                          </tr>
                        </template>
                        </tbody>
                      </table>

                    </div>

                    <div v-else class="text-gray-500 text-center py-10">
                      {{ $t('no_documents') }}
                    </div>
                  </div>

                  <!-- Mobile cards (<md) -->

                </td>

              </tr>

              <tr v-if="expanded[contractId]">

                <td :colspan="6" class="px-0 md:px-4 pt-2 pb-4 bg-slate-50">
                  <!-- Desktop table (≥md) -->
                  <div class="hidden md:block overflow-x-auto rounded-xl border border-gray-200 bg-white mx-4">
                    <div>

                      <button
                          @click="openLeaveType(assignment)"
                          class="m-3 px-3 py-1.5 text-xs text-white bg-blue-600 rounded-md hover:bg-blue-700 transition"
                      >
                        {{ $t('new_leave_types') }}
                      </button>
                    </div>
                    <table class="w-full text-sm">
                      <thead class="bg-gray-50 text-left">
                      <tr>
                        <th class="px-4 py-2">{{ $t('name') }}</th>
                        <th class="px-4 py-2">{{ $t('days_count') }}</th>
                        <th class="px-4 py-2 w-24">{{ $t('years_count') }}</th>
                        <th class="px-4 py-2 w-28 hidden md:table-cell">{{ $t('months_after_contract_start') }}</th>
                        <th class="px-4 py-2 w-28 hidden md:table-cell">{{ $t('affects_balance') }}</th>
                      </tr>
                      </thead>
                      <tbody>

                      <tr
                          v-for="leaveType in assignment.contract.leave_types" :key="leaveType.id"
                          class="border-t  select-none hover:bg-gray-50">

                        <td class="px-4 py-2">{{ leaveType.name }}</td>
                        <td class="px-4 py-2">{{ leaveType.days }}</td>
                        <td class="px-4 py-2">{{ leaveType.years_count }}</td>
                        <td class="px-4 py-2">{{ leaveType.months_after_contract_start }} {{ $t('months_after') }}</td>
                        <td class="px-4 py-2">{{ leaveType.affects_balance ? $t('yes') : $t('no') }}</td>
                      </tr>


                      </tbody>
                    </table>


                  </div>

                  <!-- Mobile cards (<md) -->

                </td>

              </tr>

            </template>
            </tbody>
          </table>
        </div>

      </div>

      <!-- Personal Page -->
      <div
          v-else-if="activeTab === 'personal'"
          class="bg-white border border-gray-300 rounded-2xl overflow-hidden"
      >
        <div v-if="employee" class="p-6 space-y-6">
          <!-- Header -->
          <h2 class="text-xl font-semibold text-gray-800 border-b pb-2">
            {{ $t('personal_information') }}
          </h2>

          <!-- Grid Info Section -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <strong class="block text-gray-600">{{ $t('first_name') }}:</strong>
              <span class="text-gray-900">{{ employee.first_name }}</span>
            </div>

            <div>
              <strong class="block text-gray-600">{{ $t('last_name') }}:</strong>
              <span class="text-gray-900">{{ employee.last_name }}</span>
            </div>

            <div>
              <strong class="block text-gray-600">{{ $t('middle_name') }}:</strong>
              <span class="text-gray-900">{{ employee.middle_name }}</span>
            </div>

            <div>
              <strong class="block text-gray-600">{{ $t('birth_date') }}:</strong>
              <span class="text-gray-900">{{ employee.birth_date }}</span>
            </div>

            <div>
              <strong class="block text-gray-600">{{ $t('gender') }}:</strong>
              <span class="text-gray-900">{{ $t(employee.gender) }}</span>
            </div>

            <div>
              <strong class="block text-gray-600">{{ $t('marital_status') }}:</strong>
              <span class="text-gray-900">{{employee?.marital_status? $t(employee?.marital_status) : '-' }}</span>
            </div>

            <div>
              <strong class="block text-gray-600">{{ $t('phone') }}:</strong>
              <span class="text-gray-900">{{ employee.phone }}</span>
            </div>

            <div>
              <strong class="block text-gray-600">{{ $t('email') }}:</strong>
              <span class="text-gray-900">{{ employee.email }}</span>
            </div>

            <div>
              <strong class="block text-gray-600">{{ $t('citizenship') }}:</strong>
              <span class="text-gray-900">{{ getCountry(employee.citizenship) }}</span>
            </div>

            <div>
              <strong class="block text-gray-600">{{ $t('national_id') }}:</strong>
              <span class="text-gray-900">{{ employee.national_id }}</span>
            </div>

            <div>
              <strong class="block text-gray-600">{{ $t('address_city') }}:</strong>
              <span class="text-gray-900">{{ employee.address_city }}</span>
            </div>


            <div class="sm:col-span-2 lg:col-span-3">
              <strong class="block text-gray-600">{{ $t('address_line') }}:</strong>
              <span class="text-gray-900">{{ employee.address_line }}</span>
            </div>

            <div>
              <strong class="block text-gray-600">{{ $t('emergency_contact_name') }}:</strong>
              <span class="text-gray-900">{{ employee.emergency_contact_name??'-' }}</span>
            </div>

            <div>
              <strong class="block text-gray-600">{{ $t('emergency_contact_phone') }}:</strong>
              <span class="text-gray-900">{{ employee.emergency_contact_phone??'-' }}</span>
            </div>


          </div>
          <div v-if="employee?.documents.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
                v-for="doc in employee?.documents"
                :key="doc.id"
                class="border border-gray-200 bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition"
            >
              <!-- File Preview -->


              <!-- File Info -->
              <div class="space-y-2">
                <div class="text-sm text-gray-700 font-semibold">
                  {{ doc.name }}
                </div>

                <div class="text-sm text-gray-600">
                  <strong>{{ $t('type') }}:</strong>
                  {{ doc.type?.name }}
                </div>

                <div class="text-sm text-gray-600">
                  <strong>{{ $t('extension') }}:</strong>
                  {{ doc.extension?.toUpperCase() }}
                </div>

                <div class="text-sm text-gray-600">
                  <strong>{{ $t('size') }}:</strong>
                  {{ (doc.size / 1024).toFixed(1) }} KB
                </div>

                <div class="text-xs text-gray-400">
                  {{ formatDateTime(doc.updated_at) }} • {{ fromNow(doc.updated_at) }}
                </div>
              </div>

              <!-- Actions -->
              <div class="mt-4 flex justify-end">
                <a
                    :href="doc.full_path"
                    class="px-3 py-1.5 text-xs text-white bg-blue-600 rounded-md hover:bg-blue-700 transition"
                    target="_blank"
                    download
                >
                  {{ $t('download') }}
                </a>
              </div>
            </div>
          </div>

          <div v-else class="text-gray-500 text-center py-10">
            {{ $t('no_documents') }}
          </div>


        </div>

        <div v-else class="text-gray-500 text-center py-10">
          {{ $t('no_employee_selected') }}
        </div>
      </div>
      <div v-if="activeTab === 'transfer'" class="bg-white border border-gray-300 rounded-2xl overflow-hidden">
        <div class="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 text-left">
            <tr>
              <th class="px-4 py-2 whitespace-nowrap ">{{ $t('department') }}</th>
              <th class="px-4 py-2  whitespace-nowrap w-24">{{ $t('roles') }}</th>
              <th class="px-4 py-2  whitespace-nowrap w-28 hidden md:table-cell">{{ $t('position_count_title') }}</th>
              <th class="px-4 py-2  whitespace-nowrap hidden md:table-cell">{{ $t('filled_count_title') }}</th>
            </tr>
            </thead>
            <tbody>
            <template v-for="row in positions" :key="row.id">
              <!-- Clickable department row -->

              <tr
                  class="border-t cursor-pointer select-none hover:bg-gray-50"
              >
                <td class="px-3 py-2 whitespace-nowrap">
                  <div class="text-xs text-slate-500">{{ row.department?.name }}</div>
                </td>
                <td class="px-3 py-2 whitespace-nowrap">
                  <div class="font-medium">{{ row.role?.name }}</div>
                </td>
                <td class="px-3 py-2 whitespace-nowrap">
                  <div class="font-medium">{{ row.position_count }}</div>
                </td>
                <td class="px-3 py-2 whitespace-nowrap">
                  <div class="font-medium">{{ row.filled_count }}</div>
                </td>
                <td class="px-3 py-2 whitespace-nowrap">

                  <button v-if="row.position_count-row.filled_count>0&&!checkWorker(row.role_id, row.department_id)"
                          class="cursor-pointer px-3 py-1 text-xs rounded-md border" @click="handleTransfer(row)">{{
                      $t('transfer')
                    }}
                  </button>
                </td>
              </tr>
            </template>
            </tbody>
          </table>
        </div>

      </div>

    </div>

    <ContractLeaveTypesModal
        v-if="showLeaveTypes"
        :open="showLeaveTypes"
        :contract-id="currentContractId"
        :selected="currentSelectedLeaveIds"
        :required="false"
        @close="showLeaveTypes = false"
        @saved="onLeaveTypesSaved"
    />
  </div>
</template>

<script setup lang="ts">
import {computed, onMounted, reactive, ref, watch} from 'vue'
import {contractsApi, employeesApi, rolePositionApi} from '@/api.js'
import {useRoute} from 'vue-router'
import {formatDateTime, fromNow} from '@/utils/dateFormat'
import {useToast} from "vue-toastification";
import {useI18n} from "vue-i18n";
import ContractLeaveTypesModal from "@/views/hr/components/Employee/ContractLeaveTypesModal.vue";

const toast = useToast();

const route = useRoute()
const employeeId = computed(() => Number(route.params.id))
const {t} = useI18n();

const tabs = [
  {value: 'personal', label: 'Անձնական էջ'},
  {value: 'documents', label: 'Աշխատակցի փաստաթուղթեր'},
  {value: 'transfer', label: 'Տեղափոխել'}
]
const activeTab = ref('personal')
const types = ref([])
const contractTypes = ref([])

const employee = ref(null)
const expanded = reactive({})
const q = ref('')
const positions = ref(null)
const loadRoleList = async () => {
  try {
    const {data} = await rolePositionApi.list({search: q.value || undefined, limit: 100})
    positions.value = data?.data || data || null;
  } catch (e) {

  }
}
watch(activeTab, (newVal) => {
  if (newVal === 'transfer' && !positions.value) {
    loadRoleList()
  }
})

const ISO2 = [
  {code: 'AM', name: 'Armenia'}, {code: 'GE', name: 'Georgia'}, {code: 'RU', name: 'Russia'},
  {code: 'US', name: 'United States'}, {code: 'GB', name: 'United Kingdom'}, {code: 'DE', name: 'Germany'},
  {code: 'FR', name: 'France'}, {code: 'IT', name: 'Italy'}, {code: 'ES', name: 'Spain'},
  {code: 'TR', name: 'Türkiye'}, {code: 'CN', name: 'China'}, {code: 'JP', name: 'Japan'},
  {code: 'AE', name: 'United Arab Emirates'}, {code: 'IR', name: 'Iran'}, {code: 'IN', name: 'India'},
  {code: 'UA', name: 'Ukraine'}, {code: 'PL', name: 'Poland'}, {code: 'NL', name: 'Netherlands'},
  {code: 'CA', name: 'Canada'}, {code: 'BR', name: 'Brazil'}, {code: 'KZ', name: 'Kazakhstan'}
]
const DOW = ['Երկ', 'Երք', 'Չրք', 'Հնգ', 'Ուր', 'Շբթ', 'Կիր']


onMounted(async () => {
  if (!employeeId.value) {
    console.warn('⚠️ No employee ID in route params.')
    return
  }
  await getEmployee(employeeId.value)
  await getDocType()
  await getContractDocType()
})

const getDocType = async () => {
  const response = await employeesApi.getDocTypes()
  types.value = response.data
}
const getContractDocType = async () => {
  const response = await contractsApi.getDocTypes()
  contractTypes.value = response.data
}

const handleTransfer = async (position) => {

  try {
    await employeesApi.transfer(employeeId.value, position.id)

    toast.success(t('transfer_successful'));
    await loadRoleList();
    await getEmployee(employeeId.value)

  } catch (e) {
    console.log(e)
  }
}


const getEmployee = async (id: number) => {
  try {
    const response = await employeesApi.show(id)
    // ✅ Case 1: API returns `{ data: {...} }`
    if (response?.data) {
      employee.value = response.data
    }
    // ✅ Case 2: API returns employee object directly
    else {
      employee.value = response
    }

    console.log('✅ Loaded employee:', employee.value)
  } catch (error) {
    console.error('❌ Failed to load employee:', error)
  }
}

const getCountry = (code: String) => {
  console.log(code)
  return ISO2.find((obj) => obj.code === code)?.name ?? code
}

const toggleDepartment = (contractId: number) => {
  expanded[contractId] = !expanded[contractId]
}

const showLeaveTypes = ref(false)
const currentContractId = ref<number | null>(null)
const currentSelectedLeaveIds = ref<number[]>([])

// open modal for a specific contract
function openLeaveType(assignment: any) {
  const contract = assignment?.contract
  if (!contract?.id) return

  currentContractId.value = Number(contract.id)
  // map from objects -> ids (if API returns objects like {id, name,...})
  currentSelectedLeaveIds.value = Array.isArray(contract.leave_types)
      ? contract.leave_types.map((lt: any) => Number(lt.id)).filter(Boolean)
      : Array.isArray(contract.leave_type_ids)
          ? contract.leave_type_ids.map((id: any) => Number(id)).filter(Boolean)
          : []

  showLeaveTypes.value = true
}

// after modal saves — refresh the employee so the leave type list is up to date
async function onLeaveTypesSaved() {
  showLeaveTypes.value = false
  await getEmployee(employeeId.value)
  toast.success(t('saved') || 'Պահպանվեց')
}

const checkWorker = (roleId: number, departmentId: number) => {
  return employee.value?.latest_event?.role_position.role_id === roleId && employee.value?.latest_event?.role_position?.department_id === departmentId && employee.value.latest_event?.event_type === 'hire';
}


</script>

