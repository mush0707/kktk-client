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
          <router-link :to="'/hr'" class="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-slate-100">
            <span class="underline-offset-2 hover:underline">{{ $t('hr') }}</span>
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
        <li aria-hidden="true" class="px-1">
          <svg class="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
            <path d="M7.05 3.55a1 1 0 0 1 1.4 0l4.5 4.5a1 1 0 0 1 0 1.4l-4.5 4.5a1 1 0 0 1-1.4-1.4L10.79 10 7.05 6.26a1 1 0 0 1 0-1.41z"/>
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
    <div class="flex flex-col gap-y-2 border-gray-300 rounded-2xl overflow-hidden">
      <!-- Tabs -->
      <div class="inline-flex gap-1 rounded-xl border border-gray-200 bg-white p-1">
        <button
            class="px-4 py-2 rounded-lg text-sm font-medium"
            v-for="tab in tabs"
            :key="tab.value"
            :class="activeTab === tab.value ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-50'"
            @click="activeTab = tab.value"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Contracts -->
      <EmployeeContractsPane
          v-if="activeTab === 'contracts'"
          :employee="employee"
          @open-leave-types="openLeaveType"
      />

      <!-- Personal Page -->
      <div v-else-if="activeTab === 'personal'" class="bg-white border border-gray-300 rounded-2xl overflow-hidden">
        <div v-if="employee" class="p-6 space-y-6">
          <h2 class="text-xl font-semibold text-gray-800 border-b border-gray-300 pb-2">
            {{ $t('personal_information') }}
          </h2>

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
              <span class="text-gray-900">{{ employee?.marital_status ? $t(employee?.marital_status) : '-' }}</span>
            </div>

            <div>
              <strong class="block text-gray-600">{{ $t('phone') }}:</strong>
              <input
                  v-model.trim="personal.phone"
                  type="number"
                  class="w-full px-3 text-sm py-2 rounded-xl border border-gray-300"
                  :placeholder="employee?.phone || '099123456'"
              />
              <p v-if="errors.phone" class="text-xs text-red-600 mt-1">{{ errors.phone }}</p>
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
              <strong class="block text-gray-600">Հ․Հ․ ID փաստաթղթի համար:</strong>
              <span class="text-gray-900">{{ employee.national_id }}</span>
            </div>
            <div>
              <strong class="block text-gray-600">Սոցիալական քարտի համար:</strong>
              <span class="text-gray-900">{{ employee.social_card }}</span>
            </div>
            <div>
              <strong class="block text-gray-600">Անձնագրի համար:</strong>
              <span class="text-gray-900">{{ employee.passport_number }}</span>
            </div>

            <div>
              <strong class="block text-gray-600">{{ $t('address_city') }}:</strong>
              <span class="text-gray-900">{{ getCity(employee.address_city) }}</span>
            </div>

            <div class="sm:col-span-2 lg:col-span-3">
              <strong class="block text-gray-600">{{ $t('address_line') }}:</strong>
              <span class="text-gray-900">{{ employee.address_line }}</span>
            </div>

            <div>
              <label class="block text-sm text-gray-600 mb-1">{{ $t('emergency_contact_name') }}</label>
              <input
                  v-model.trim="personal.emergency_contact_name"
                  type="text"
                  class="w-full px-3 py-2 rounded-xl border border-gray-300"
                  :placeholder="employee?.emergency_contact_name || $t('full_name')"
              />
              <p v-if="errors.emergency_contact_name" class="text-xs text-red-600 mt-1">
                {{ errors.emergency_contact_name }}
              </p>
            </div>

            <div>
              <label class="block text-sm text-gray-600 mb-1">{{ $t('emergency_contact_phone') }}</label>
              <input
                  v-model.trim="personal.emergency_contact_phone"
                  type="number"
                  class="w-full px-3 py-2 rounded-xl border border-gray-300"
                  :placeholder="employee?.emergency_contact_phone || '099123456'"
              />
              <p v-if="errors.emergency_contact_phone" class="text-xs text-red-600 mt-1">
                {{ errors.emergency_contact_phone }}
              </p>
            </div>
          </div>

          <div class="mt-3 flex items-center gap-2">
            <button
                class="px-3 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                @click="savePersonal"
            >
              <span v-if="savingPersonal">{{ $t('saving') || 'Թարմացում…' }}</span>
              <span v-else>Թարմացնել</span>
            </button>
          </div>

          <div v-if="employee?.documents.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
                v-for="doc in employee?.documents"
                :key="doc.id"
                class="border border-gray-200 bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition"
            >
              <div class="space-y-2">
                <div class="text-sm text-gray-700 font-semibold">{{ doc.type.name }}</div>
                <div class="text-sm text-gray-600">
                  {{ formatDateTime(doc.updated_at) }} • {{ fromNow(doc.updated_at) }}
                </div>
                <div class="text-xs text-gray-400">
                  <strong>{{ $t('extension') }}:</strong> {{ doc.extension?.toUpperCase() }}
                </div>
              </div>
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

      <!-- Transfer -->
<!--      <div v-if="activeTab === 'transfer'" class="bg-white border border-gray-300 rounded-2xl overflow-hidden">-->
<!--        <div class="overflow-x-auto rounded-xl border border-gray-200 bg-white">-->
<!--          <table class="w-full text-sm">-->
<!--            <thead class="bg-gray-50 text-left">-->
<!--            <tr>-->
<!--              <th class="px-4 py-2 whitespace-nowrap ">{{ $t('department') }}</th>-->
<!--              <th class="px-4 py-2 whitespace-nowrap w-24">{{ $t('roles') }}</th>-->
<!--              <th class="px-4 py-2 whitespace-nowrap w-28 hidden md:table-cell">{{ $t('position_count_title') }}</th>-->
<!--              <th class="px-4 py-2 whitespace-nowrap hidden md:table-cell">{{ $t('filled_count_title') }}</th>-->
<!--            </tr>-->
<!--            </thead>-->
<!--            <tbody>-->
<!--            <template v-for="row in positions" :key="row.id">-->
<!--              <tr class="border-t cursor-pointer select-none hover:bg-gray-50">-->
<!--                <td class="px-3 py-2 whitespace-nowrap">-->
<!--                  <div class="text-xs text-slate-500">{{ row.department?.name }}</div>-->
<!--                </td>-->
<!--                <td class="px-3 py-2 whitespace-nowrap">-->
<!--                  <div class="font-medium">{{ row.role?.name }}</div>-->
<!--                </td>-->
<!--                <td class="px-3 py-2 whitespace-nowrap">-->
<!--                  <div class="font-medium">{{ row.position_count }}</div>-->
<!--                </td>-->
<!--                <td class="px-3 py-2 whitespace-nowrap">-->
<!--                  <div class="font-medium">{{ row.filled_count }}</div>-->
<!--                </td>-->
<!--                <td class="px-3 py-2 whitespace-nowrap">-->
<!--                  <button-->
<!--                      v-if="row.position_count - row.filled_count > 0 && !checkWorker(row.role_id, row.department_id)"-->
<!--                      class="cursor-pointer px-3 py-1 text-xs rounded-md border"-->
<!--                      @click="handleTransfer(row)"-->
<!--                  >-->
<!--                    {{ $t('transfer') }}-->
<!--                  </button>-->
<!--                </td>-->
<!--              </tr>-->
<!--            </template>-->
<!--            </tbody>-->
<!--          </table>-->
<!--        </div>-->
<!--      </div>-->
    </div>

    <!-- Leave Types Modal -->
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
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { employeesApi, rolePositionApi } from '@/api.js'
import { useRoute } from 'vue-router'
import { formatDateTime, fromNow } from '@/utils/dateFormat'
import { useToast } from 'vue-toastification'
import { useI18n } from 'vue-i18n'
import ContractLeaveTypesModal from '@/views/hr/components/Employee/ContractLeaveTypesModal.vue'
import EmployeeContractsPane from '@/views/hr/components/Employee/EmployeeContractManage.vue'

const toast = useToast()
const route = useRoute()
const { t } = useI18n()

const employeeId = computed(() => Number(route.params.id))

const tabs = [
  { value: 'contracts', label: 'Պայմանագրեր' },
  { value: 'personal', label: 'Անձնական էջ' },
  // { value: 'transfer', label: 'Տեղափոխել' }
]
const activeTab = ref<'contracts' | 'personal' | 'transfer'>('personal')

const employee = ref<any | null>(null)
const q = ref('')
const positions = ref<any[] | null>(null)

const personal = reactive({
  phone: '',
  emergency_contact_name: '',
  emergency_contact_phone: ''
})
const savingPersonal = ref(false)
const errors = reactive<{ phone?: string; emergency_contact_name?: string; emergency_contact_phone?: string }>({})

/** Loaders */
onMounted(async () => {
  if (!employeeId.value) {
    console.warn('⚠️ No employee ID in route params.')
    return
  }
  await getEmployee(employeeId.value)
})

const loadRoleList = async () => {
  try {
    const { data } = await rolePositionApi.list({ search: q.value || undefined, limit: 100 })
    positions.value = data?.data || data || null
  } catch { /* noop */ }
}

watch(activeTab, (newVal) => {
  if (newVal === 'transfer' && !positions.value) {
    loadRoleList()
  }
})

/** Editable personal info init/validation */
function initPersonal() {
  const e: any = employee.value || {}
  personal.phone = e.phone || ''
  personal.emergency_contact_name = e.emergency_contact_name || ''
  personal.emergency_contact_phone = e.emergency_contact_phone || ''
  clearPersonalErrors()
}

function clearPersonalErrors() {
  errors.phone = ''
  errors.emergency_contact_name = ''
  errors.emergency_contact_phone = ''
}

function validatePersonal() {
  clearPersonalErrors()
  let ok = true

  if (!personal.phone?.trim()) {
    errors.phone = t('field_required') || 'Պարտադիր դաշտ'
    ok = false
  } else if (personal.phone.replace(/\D/g, '').length < 6) {
    errors.phone = t('invalid_phone') || 'Սխալ հեռախոսահամար'
    ok = false
  }

  if (personal.emergency_contact_phone?.trim()) {
    if (personal.emergency_contact_phone.replace(/\D/g, '').length < 6) {
      errors.emergency_contact_phone = t('invalid_phone') || 'Սխալ հեռախոսահամար'
      ok = false
    }
  }

  return ok
}

async function savePersonal() {
  if (!employeeId.value) return
  if (!validatePersonal()) return
  savingPersonal.value = true
  try {
    await employeesApi.updateExist?.(employeeId.value, {
      phone: personal.phone,
      emergency_contact_name: personal.emergency_contact_name,
      emergency_contact_phone: personal.emergency_contact_phone
    })
    await getEmployee(employeeId.value)
    initPersonal()
    toast.success(t('saved') || 'Պահպանվեց')
  } finally {
    savingPersonal.value = false
  }
}

/** Employee fetch */
const getEmployee = async (id: number) => {
  try {
    const response = await employeesApi.show(id)
    employee.value = response?.data ? response.data : response
    initPersonal()
  } catch (error) {
    console.error('❌ Failed to load employee:', error)
  }
}

/** Lookups */
const ISO2 = [
  { code: 'AM', name: 'Armenia' }, { code: 'GE', name: 'Georgia' }, { code: 'RU', name: 'Russia' },
  { code: 'US', name: 'United States' }, { code: 'GB', name: 'United Kingdom' }, { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' }, { code: 'IT', name: 'Italy' }, { code: 'ES', name: 'Spain' },
  { code: 'TR', name: 'Türkiye' }, { code: 'CN', name: 'China' }, { code: 'JP', name: 'Japan' },
  { code: 'AE', name: 'United Arab Emirates' }, { code: 'IR', name: 'Iran' }, { code: 'IN', name: 'India' },
  { code: 'UA', name: 'Ukraine' }, { code: 'PL', name: 'Poland' }, { code: 'NL', name: 'Netherlands' },
  { code: 'CA', name: 'Canada' }, { code: 'BR', name: 'Brazil' }, { code: 'KZ', name: 'Kazakhstan' }
]

const armeniaCities = [
  { code: 'Yerevan', name: 'Երևան' }, { code: 'Gyumri', name: 'Գյումրի' }, { code: 'Vanadzor', name: 'Վանաձோர்' },
  { code: 'Vagharshapat', name: 'Էջմիածին' }, { code: 'Hrazdan', name: 'Հրազդան' }, { code: 'Abovyan', name: 'Աբովյան' },
  { code: 'Kapan', name: 'Կապան' }, { code: 'Armavir', name: 'Արմավիր' }, { code: 'Stepanavan', name: 'Ստեփանավան' },
  { code: 'Gavar', name: 'Գավառ' }, { code: 'Sevan', name: 'Սևան' }, { code: 'Charentsavan', name: 'Չարենցավան' },
  { code: 'Ijevan', name: 'Իջևան' }, { code: 'Ararat', name: 'Արարատ' }, { code: 'Artashat', name: 'Արտաշատ' },
  { code: 'Masis', name: 'Մասիս' }, { code: 'Dilijan', name: 'Դիլիջան' }, { code: 'Sisian', name: 'Սիսիան' },
  { code: 'Martuni', name: 'Մարտունի' }, { code: 'Ashtarak', name: 'Աշտարակ' }, { code: 'Spitak', name: 'Սպիտակ' },
  { code: 'Tashir', name: 'Տաշիր' }, { code: 'Meghri', name: 'Մեղրի' }, { code: 'Noyemberyan', name: 'Նոյեմբերյան' },
  { code: 'Vardenis', name: 'Վարդենիս' }, { code: 'Aparan', name: 'Ապարան' }, { code: 'Byureghavan', name: 'Բյուրեղավան' },
  { code: 'Maralik', name: 'Մարալիկ' }, { code: 'Yeghvard', name: 'Եղվարդ' }, { code: 'Alaverdi', name: 'Ալավերդի' },
  { code: 'Agarak', name: 'Ագարակ' }, { code: 'Talin', name: 'Թալին' }, { code: 'Vedi', name: 'Վեդի' },
  { code: 'Shamlugh', name: 'Շամլուղ' }, { code: 'Jermuk', name: 'Ջերմուկ' }
]

const getCountry = (code: string) => ISO2.find((obj) => obj.code === code)?.name ?? code
const getCity = (code: string) => armeniaCities.find((e) => e.code === code)?.name ?? code

/** Transfer */
const handleTransfer = async (position: any) => {
  try {
    await employeesApi.transfer(employeeId.value, position.id)
    toast.success(t('transfer_successful'))
    await loadRoleList()
    await getEmployee(employeeId.value)
  } catch (e) {
    console.log(e)
  }
}

const checkWorker = (roleId: number, departmentId: number) => {
  return employee.value?.latest_event?.role_position.role_id === roleId &&
      employee.value?.latest_event?.role_position?.department_id === departmentId &&
      employee.value?.latest_event?.event_type === 'hire'
}

/** Leave types */
const showLeaveTypes = ref(false)
const currentContractId = ref<number | null>(null)
const currentSelectedLeaveIds = ref<number[]>([])

function openLeaveType(assignment: any) {
  const contract = assignment?.contract
  if (!contract?.id) return
  currentContractId.value = Number(contract.id)
  currentSelectedLeaveIds.value = Array.isArray(contract.leave_types)
      ? contract.leave_types.map((lt: any) => Number(lt.id)).filter(Boolean)
      : Array.isArray(contract.leave_type_ids)
          ? contract.leave_type_ids.map((id: any) => Number(id)).filter(Boolean)
          : []
  showLeaveTypes.value = true
}

async function onLeaveTypesSaved() {
  showLeaveTypes.value = false
  await getEmployee(employeeId.value)
  toast.success(t('saved') || 'Պահպանվեց')
}
</script>
