<!-- src/views/hr/EmployeesTableFromStaffUsers.vue -->
<template>
  <div class="flex flex-col">
    <!-- Header -->
    <div class="dark:border-gray-700 bg-white">
      <div class="flex items-center justify-between p-4 border-b rounded-md border-gray-200">
        <div class="flex items-center gap-2">
          <p class="text-xl font-semibold">{{ $t('settings') }}</p>
          <p class="text-sm text-slate-500">({{ $t('hr') }})</p>
        </div>
        <div>
          <button
              @click="openLeaveType()"
              type="button"
              v-if="activeTab === 'leave_types'"
              class="px-3 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
          >
            {{ $t('new_leave_types') || 'Նոր թեկնածու +' }}
          </button>
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
          <p class="inline-flex items-center gap-1 rounded-md px-2 py-1">
            <span class="underline-offset-2 hover:underline">{{ $t('settings') }}</span>
          </p>
        </li>
      </ol>
    </nav>

  </div>
  <div class="flex flex-col gap-4 px-4 py-4">
    <!-- Header -->
    <div class="bg-white border border-gray-300 rounded-2xl overflow-hidden">
      <div class="p-4 flex items-center justify-between border-b">
        <div class="text-lg font-semibold">{{ $t('settings') }}</div>
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
      <div v-if="activeTab === 'leave_types'" class="bg-white border border-gray-300 rounded-2xl overflow-hidden">

        <div class="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 text-left">
            <tr>
              <th class="px-4 py-2">{{ $t('name') }}</th>
              <th class="px-4 py-2">{{ $t('days_count') }}</th>
              <th class="px-4 py-2 w-24">{{ $t('years_count') }}</th>
              <th class="px-4 py-2 w-28 hidden md:table-cell">{{ $t('months_after_contract_start') }}</th>
              <th class="px-4 py-2 w-28 hidden md:table-cell">{{ $t('affects_balance') }}</th>
              <th class="px-4 py-2 w-28 hidden md:table-cell"></th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="leaveType in leaveTypes" :key="leaveType.id">
              <td class="px-4 py-2">{{ leaveType.name }}</td>
              <td class="px-4 py-2">{{ leaveType.days }}</td>
              <td class="px-4 py-2">{{ leaveType.years_count }}</td>
              <td class="px-4 py-2">{{ leaveType.months_after_contract_start }} {{$t('months_after')}}</td>
              <td class="px-4 py-2">{{ leaveType.affects_balance ? $t('yes') : $t('no') }}</td>
              <td class="px-4 py-2">
                <button
                    class="px-3 py-1.5 rounded-lg border bg-blue-600 text-white hover:bg-blue-700  px-3 py-1 text-xs rounded-md border"
                    @click="openEditLeaveType(leaveType)"
                >
                  {{ $t('edit') || 'Ավելացնել աշխատակից' }}
                </button>

              </td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <LeaveTypeModal
        v-if="leaveTypesModal.open"
        :open="leaveTypesModal.open"
        v-model="leaveTypesModal.model"
        @close="onLeaveTypesClose"
        @saved="onLeaveTypesClose"
    />

  </div>
</template>

<script setup lang="ts">
import {onMounted, ref} from 'vue'
import {leaveTypeApi} from '@/api.js'
import {useRoute} from 'vue-router'
import {useToast} from "vue-toastification";
import {useI18n} from "vue-i18n";
import LeaveTypeModal from "@/views/hr/components/Leave/LeaveTypeModal.vue";

const toast = useToast();

const route = useRoute()
const {t} = useI18n();
const leaveTypes = ref([])
const leaveTypesModal = ref<{ open: boolean; model: any | null }>({open: false, model: null})

const tabs = [
  {value: 'leave_types', label: t('leave_types')},
]
const activeTab = ref('leave_types')

onMounted(async () => {
  await getLeaveTypes()
})

const getLeaveTypes = async () => {
  try {
    const data = await leaveTypeApi.list()
    leaveTypes.value = data?.data ?? data ?? []
  } catch (e) {
    console.log(e);
  }
}
const openLeaveType = () => {
  leaveTypesModal.value.open = true
}

const openEditLeaveType = (leaveType: any) => {
  leaveTypesModal.value.model = leaveType
  leaveTypesModal.value.open = true
}


const onLeaveTypesClose = async () => {
  await getLeaveTypes()
  leaveTypesModal.value.open = false
  leaveTypesModal.value.model = null
}

</script>

