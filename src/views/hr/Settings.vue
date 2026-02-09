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
            <path d="M7.05 3.55a1 1 0 0 1 1.4 0l4.5 4.5a1 1 0 0 1 0 1.4ল-4.5 4.5a1 1 0 0 1-1.4-1.4L10.79 10 7.05 6.26a1 1 0 0 1 0-1.41z"/>
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
    <div class="flex flex-col gap-y-2 border-gray-300 rounded-2xl overflow-hidden">
      <!-- Tabs -->
      <div class="inline-flex gap-1 rounded-xl border border-gray-200 bg-white p-1">
        <button
            v-for="tab in tabs"
            :key="tab.value"
            class="px-4 py-2 rounded-lg text-sm font-medium"
            :class="activeTab === tab.value ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-50'"
            @click="activeTab = tab.value"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Leave types -->
      <div
          v-if="activeTab === 'leave_types'"
          class="p-4 flex flex-col gap-y-2 bg-white border border-gray-300 rounded-2xl overflow-hidden"
      >
        <div class="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 text-left">
            <tr>
              <th class="px-4 py-2">{{ $t('name') }}</th>
              <th class="px-4 py-2">Ռեժիմ</th>
              <th class="px-4 py-2">Օրերի քանակ</th>
              <th class="px-4 py-2">Ընտրված տարի</th>
              <th class="px-4 py-2 hidden md:table-cell">{{ $t('months_after_contract_start') }}</th>
              <th class="px-4 py-2 w-28 hidden md:table-cell">{{ $t('affects_balance') }}</th>
              <th class="px-4 py-2 hidden md:table-cell"></th>
            </tr>
            </thead>
            <tbody>
            <template v-for="leaveType in leaveTypes" :key="leaveType.id">
              <tr class="bg-white border-b border-gray-200">
                <td class="px-4 py-2">{{ leaveType.name }}</td>

                <!-- Mode badge -->
                <td class="px-4 py-2">
                    <span
                        v-if="leaveType.mode === 'days_countdown'"
                        class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700"
                    >
                      {{ $t('days_countdown') }}
                    </span>
                  <span
                      v-else-if="leaveType.mode === 'public_holidays'"
                      class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"
                  >
                      {{ $t('public_holidays') }}
                    </span>
                  <span v-else class="text-slate-500">{{ leaveType.mode }}</span>
                </td>

                <!-- Days / Year -->
                <td class="px-4 py-2">
                  <template v-if="leaveType.mode === 'public_holidays'">
                    -
                  </template>
                  <template v-else>
                    {{ leaveType.days > 0 ? leaveType.days : '-' }}
                  </template>
                </td>
                <td class="px-4 py-2">
                  <template v-if="leaveType.mode === 'public_holidays'">
                    {{ leaveType.specific_year ?? '-' }}
                  </template>
                  <template v-else>
                    -
                  </template>
                </td>

                <!-- Months after contract start -->
                <td class="px-4 py-2">
                  <div v-if="leaveType.months_after_contract_start">
                    {{ leaveType.months_after_contract_start }} {{ $t('months_after') }}
                  </div>
                  <div v-else>-</div>
                </td>

                <td class="px-4 py-2">
                  {{ leaveType.affects_balance ? $t('yes') : $t('no') }}
                </td>

                <td class="px-4 py-2 text-right space-x-2">
                  <div class="flex gap-2">
                    <button
                        v-if="!leaveType.is_active"
                        class="px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs"
                        @click="toggleActive(leaveType)"
                    >
                      Ակտիվացնել
                    </button>
                    <button
                        v-else
                        class="px-3 py-1.5 rounded-lg bg-orange-600 text-white hover:bg-orange-700 text-xs"
                        @click="toggleActive(leaveType)"
                    >
                      Ապաակտիվացնել
                    </button>

                    <!-- See holidays (only public_holidays) -->
                    <button
                        v-if="leaveType.mode === 'public_holidays'"
                        class="px-3 py-1.5 rounded-lg border text-xs hover:bg-gray-50"
                        @click="onSeeHolidays(leaveType)"
                    >
                      Տեսնել տոն օրերը
                    </button>
                  </div>
                </td>
              </tr>

              <tr v-if="openRowId === leaveType.id" class="bg-white border-b border-gray-200">
                <td colspan="6" class="px-4 py-3">
                  <div class="flex flex-col gap-3">
                    <div v-if="!leaveType.specific_year" class="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
                      Նախ այս տեսակի համար նշված չէ «Ընտրված տարի» (<code>specific_year</code>)։
                    </div>

                    <div v-else class="space-y-2">
                      <label class="text-sm text-gray-600">Կցել տոն ({{ leaveType.specific_year }})</label>

                      <VueSelect
                          v-model="selectedHolidayDate"
                          @search="q => fetchHolidayDates(q, leaveType)"
                          @update:modelValue="val => onSelectHolidayDate(val, leaveType)"
                          :filterable="false"
                          :loading="holidayDatesLoading"
                          :is-searchable="true"
                          :get-option-label="o => (o?.holiday?.name || '') + ' — ' + (o?.day || '')"
                          :get-option-value="o => o?.id"
                          :is-multi="false"
                          :options="holidayDateOptions"
                          :placeholder="'Ընտրեք տոնը…'"
                          :noResults="'Արդյունք չի գտնվել'"
                      >
                        <template #no-options>Արդյունք չի գտնվել</template>
                        <template #option="{ option }">
                          <div class="flex items-center justify-between gap-3">
                            <div class="font-medium">{{ option.holiday?.name }}</div>
                            <div class="text-xs text-slate-600">{{ option.day }}</div>
                          </div>
                        </template>
                      </VueSelect>

                      <!-- Existing attached holidays list -->
                      <div class="mt-2">
                        <div class="text-sm text-slate-600 mb-1">Կցված տոները</div>
                        <div v-if="(leaveType.holiday_dates?.length ?? 0) === 0" class="text-sm text-slate-500">
                          Չկան կցված տոն օրեր
                        </div>
                        <div v-else class="flex flex-wrap gap-2">
                          <span
                              v-for="h in leaveType.holiday_dates"
                              :key="h.id || h.holiday_id"
                              class="inline-flex items-center gap-2 px-3 py-1 rounded-lg border border-gray-300 bg-white"
                          >
                            <span class="font-medium">{{ h.holiday?.name ?? h.name ?? ('#' + (h.holiday_id ?? h.id)) }}</span>
                            <span v-if="h.day" class="text-xs text-slate-500">({{ h.day }})</span>
                            <button
                                class="text-xs px-2 py-0.5 rounded bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                                @click="onDetachHoliday(leaveType, h)"
                                title="Ջնջել կապը"
                            >
                              ✕
                            </button>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </template>

            <!-- Empty state -->
            <tr v-if="!leaveTypes.length">
              <td colspan="6" class="px-4 py-6 text-center text-slate-500">
                {{ $t('nothing_found') || 'Ցուցակը դատարկ է' }}
              </td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Holidays tab (separate component) -->
      <HolidaysTab v-else-if="activeTab === 'holidays'" />
    </div>

    <!-- LeaveTypeModal removed usage (create/edit) -->
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { leaveTypeApi, holidaysApi } from '@/api.js'
import { useRoute } from 'vue-router'
import { useToast } from "vue-toastification"
import { useI18n } from "vue-i18n"
import HolidaysTab from "@/views/hr/components/Holidays/HolidaysTab.vue"
import VueSelect from "vue3-select-component";

const toast = useToast()
const route = useRoute()
const { t } = useI18n()

const leaveTypes = ref<any[]>([])

// expanded row state
const openRowId = ref<number|null>(null)
const holidayDateOptions = ref<any[]>([])
const holidayDatesLoading = ref(false)
const selectedHolidayDate = ref<any|null>(null)
const tabs = [
  { value: 'leave_types', label: 'Արձակուրդի տեսակներ' },
  { value: 'holidays',    label: 'Տոնական օրեր' },
]
const activeTab = ref<'leave_types' | 'holidays'>('leave_types')

onMounted(async () => {
  await getLeaveTypes()
})

async function getLeaveTypes() {
  try {
    const data = await leaveTypeApi.list()
    leaveTypes.value = data?.data ?? data ?? []
  } catch (e) {
    console.log(e)
  }
}

// Expand per-row panel
function onSeeHolidays(lt: any) {
  if (openRowId.value === lt.id) {
    openRowId.value = null
    return
  }
  openRowId.value = lt.id
  selectedHolidayDate.value = null
  fetchHolidayDates('', lt)
}

// Fetch holidays by lt.specific_year and search query
async function fetchHolidayDates(q = '', lt?: any) {
  if (!lt?.specific_year) { holidayDateOptions.value = []; return }
  holidayDatesLoading.value = true
  try {
    const res = await holidaysApi.dateList({
      limit: 30,
      offset: 0,
      search: q || undefined,
      year: lt.specific_year,
      // backend handles exclusion of already-attached holidays via this
      exclude_leave_type_id: lt.id,
    })
    const rows = Array.isArray(res?.data) ? res.data : (res?.data ?? res ?? [])
    holidayDateOptions.value = Array.isArray(rows) ? rows : []
  } finally {
    holidayDatesLoading.value = false
  }
}

async function onSelectHolidayDate(id: number | null, lt: any) {
  if (!id || !lt?.id) return

  try {
    await leaveTypeApi.attachHoliday(lt.id, id)

    // find the picked option to show name/day in the UI
    const opt = holidayDateOptions.value.find((o: any) => o.id === id)

    if (opt) {
      const entry = {
        id: opt.id,                       // holiday_date id
        holiday_id: opt.holiday_id,       // for backend refs
        day: opt.day,
        holiday: opt.holiday,             // { id, name, ... }
      }
      lt.holiday_dates = [entry, ...(lt.holiday_dates ?? [])]
    }

    // clear selection and refresh dropdown (backend excludes attached via exclude_leave_type_id)
    selectedHolidayDate.value = null
    await fetchHolidayDates('', lt)
  } catch (e) {
    console.error(e)
  }
}
// Toggle active/deactive
async function toggleActive(lt: any) {
  try {
    if (!lt.is_active) {
      await leaveTypeApi.activate(lt.id)
      lt.is_active = true
      toast.success('Տեսակը ակտիվացվեց')
    } else {
      await leaveTypeApi.deactivate(lt.id)
      lt.is_active = false
      toast.info('Տեսակը ապաակտիվացվեց')
    }
  } catch (e) {
  }
}

async function onDetachHoliday(lt: any, h: any) {
  if (!lt?.id || !h?.id) return
  try {
    await leaveTypeApi.detachHoliday(lt.id, h.id) // h.id is holiday_date_id

    // remove from UI immediately
    lt.holiday_dates = (lt.holiday_dates || []).filter((x: any) => x.id !== h.id)

    // refresh dropdown options so the just-detached date becomes selectable again
    await fetchHolidayDates('', lt) // this uses /holidays/dates with exclude_leave_type_id=lt.id
  } catch (e) {
    console.error(e)
  }
}
</script>

<style scoped>
/* optional – tighter badge */
</style>
