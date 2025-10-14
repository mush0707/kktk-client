<template>
  <div class="flex flex-col min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white shadow p-4 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold">{{ $t('payroll') || 'Ղեկավարվող աշխատավարձեր' }}</h1>
          <p class="text-sm text-gray-500">{{ $t('overview') || 'Աշխատողների ամսական վճարումներ' }}</p>
        </div>
        <button
            :disabled="!selectedEmployees.length"
            @click="paySelected"
            class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
        >
          {{ $t('pay_selected') || 'Վճարել ընտրվածներին' }}
        </button>
      </div>
    </div>

    <!-- Filters / Search -->
    <div class="p-4 bg-white border-b border-gray-200 flex items-center justify-between gap-4">
      <input
          v-model="search"
          type="text"
          placeholder="Փնտրել աշխատողին..."
          class="border rounded px-3 py-2 w-full sm:w-64"
      />
      <select v-model="selectedMonth" class="border rounded px-3 py-2">
        <option v-for="month in months" :key="month.value" :value="month.value">
          {{ month.name }}
        </option>
      </select>
    </div>

    <!-- Payroll Table -->
    <div class="p-4 overflow-x-auto">
      <table class="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
        <thead class="bg-gray-100">
        <tr>
          <th class="px-4 py-3 text-left">
            <input
                type="checkbox"
                :checked="allSelected"
                @change="toggleAll"
            />
          </th>
          <th class="px-4 py-3 text-left">Աշխատող</th>
          <th class="px-4 py-3 text-left">Պաշտոն</th>
          <th class="px-4 py-3 text-left">Աշխատավարձ</th>
          <th class="px-4 py-3 text-left">Հաշվարկ ամսաթիվը</th>
          <th class="px-4 py-3 text-left">Գործողություն</th>
        </tr>
        </thead>
        <tbody>
        <tr
            v-for="employee in filteredPayrolls"
            :key="employee.id"
            class="hover:bg-gray-50 border-b border-gray-100"
        >
          <td class="px-4 py-2">
            <input
                type="checkbox"
                v-model="selectedEmployees"
                :value="employee.id"
            />
          </td>
          <td class="px-4 py-2 font-medium">{{ employee.name }}</td>
          <td class="px-4 py-2 text-gray-600">{{ employee.position }}</td>
          <td class="px-4 py-2 font-semibold">{{ employee.salary }} ֏</td>
          <td class="px-4 py-2 text-gray-500">{{ employee.payDate }}</td>
          <td class="px-4 py-2">
            <button
                @click="openDetails(employee)"
                class="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
            >
              {{ $t('view') || 'Դիտել' }}
            </button>
          </td>
        </tr>
        <tr v-if="!filteredPayrolls.length">
          <td colspan="6" class="text-center py-4 text-gray-400">Աշխատողներ չկան</td>
        </tr>
        </tbody>
      </table>
    </div>

    <!-- Payroll Details Modal -->
    <div
        v-if="modalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
        @click.self="modalOpen = false"
    >
      <div class="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <h2 class="text-xl font-semibold mb-4">{{ selectedEmployee.name }}</h2>
        <p><strong>Պաշտոն:</strong> {{ selectedEmployee.position }}</p>
        <p><strong>Աշխատավարձ:</strong> {{ selectedEmployee.salary }} ֏</p>
        <p><strong>Հաշվարկ ամսաթիվը:</strong> {{ selectedEmployee.payDate }}</p>
        <p><strong>Բաժանմունք:</strong> {{ selectedEmployee.department }}</p>
        <button
            @click="modalOpen = false"
            class="mt-4 bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded"
        >
          {{ $t('close') || 'Փակել' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface EmployeePayroll {
  id: number
  name: string
  position: string
  salary: number
  payDate: string
  department: string
}

// Sample payroll data
const payrolls = ref<EmployeePayroll[]>([
  { id: 1, name: 'Արամ Սարգսյան', position: 'Frontend Developer', salary: 600000, payDate: '2025-10-01', department: 'IT' },
  { id: 2, name: 'Մարիա Հարությունյան', position: 'HR Specialist', salary: 450000, payDate: '2025-10-01', department: 'HR' },
  { id: 3, name: 'Գոռ Պետրոսյան', position: 'Accountant', salary: 500000, payDate: '2025-10-01', department: 'Finance' },
])

const search = ref('')
const selectedMonth = ref(new Date().getMonth() + 1)
const selectedEmployees = ref<number[]>([])

const months = [
  { value: 1, name: 'Հունվար' },
  { value: 2, name: 'Փետրվար' },
  { value: 3, name: 'Մարտ' },
  { value: 4, name: 'Ապրիլ' },
  { value: 5, name: 'Մայիս' },
  { value: 6, name: 'Հունիս' },
  { value: 7, name: 'Հուլիս' },
  { value: 8, name: 'Օգոստոս' },
  { value: 9, name: 'Սեպտեմբեր' },
  { value: 10, name: 'Հոկտեմբեր' },
  { value: 11, name: 'Նոյեմբեր' },
  { value: 12, name: 'Դեկտեմբեր' },
]

const filteredPayrolls = computed(() => {
  return payrolls.value.filter(e =>
      e.name.toLowerCase().includes(search.value.toLowerCase()) &&
      new Date(e.payDate).getMonth() + 1 === Number(selectedMonth.value)
  )
})

// Modal
const modalOpen = ref(false)
const selectedEmployee = ref<EmployeePayroll>({
  id: 0,
  name: '',
  position: '',
  salary: 0,
  payDate: '',
  department: '',
})
function openDetails(employee: EmployeePayroll) {
  selectedEmployee.value = employee
  modalOpen.value = true
}

// Select all / deselect all
const allSelected = computed(() => {
  return filteredPayrolls.value.length > 0 &&
      filteredPayrolls.value.every(e => selectedEmployees.value.includes(e.id))
})
function toggleAll() {
  if (allSelected.value) {
    selectedEmployees.value = selectedEmployees.value.filter(id =>
        !filteredPayrolls.value.some(e => e.id === id)
    )
  } else {
    const ids = filteredPayrolls.value.map(e => e.id)
    selectedEmployees.value = Array.from(new Set([...selectedEmployees.value, ...ids]))
  }
}

// Action for paying selected employees
function paySelected() {
  alert(`Վճարվում են աշխատողներ ID: ${selectedEmployees.value.join(', ')}`)
  selectedEmployees.value = []
}
</script>

<style scoped>
/* Optional custom styling */
</style>
