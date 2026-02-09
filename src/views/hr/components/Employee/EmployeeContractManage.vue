<!-- src/views/hr/components/Employee/EmployeeContractsTable.vue -->
<template>
  <div class="bg-white border border-gray-300 rounded-2xl overflow-hidden">
    <div class="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 text-left">
        <tr>
          <th class="px-4 py-2">{{ $t('contract_number') }}</th>
          <th class="px-4 py-2">Հաստիք</th>
          <th class="px-4 py-2 w-24">{{ $t('start_date') }}</th>
          <th class="px-4 py-2 w-28 hidden md:table-cell">{{ $t('end_date') }}</th>
          <th class="px-4 py-2 hidden md:table-cell">{{ $t('base_rate') }}</th>
          <th class="px-4 py-2"></th>
          <th class="px-4 py-2"></th>
        </tr>
        </thead>

        <tbody>
        <template v-for="contract in (contracts || [])" :key="contract?.id">
          <!-- Row (collapsible) -->
          <tr
              class="border-t cursor-pointer select-none hover:bg-gray-50"
              role="button"
              tabindex="0"
              :aria-expanded="!!expanded[contract?.id]"
              @click="toggle(contract?.id)"
              @keydown.enter.prevent="toggle(contract?.id)"
              @keydown.space.prevent="toggle(contract?.id)"
          >
            <td class="px-4 py-2">{{ contract.contract_number }}</td>

            <td class="px-4 py-2">
              <div class="flex flex-col">
                <p>{{ contract.role?.name }}</p>
                <p class="text-xs text-slate-500">{{ contract.department?.name }}</p>
              </div>
            </td>

            <td class="px-4 py-2 whitespace-nowrap">{{ contract.start_date }}</td>
            <td class="px-4 py-2 whitespace-nowrap">{{ contract.end_date }}</td>

            <td class="px-4 py-2 whitespace-nowrap">
              {{ $money(contract.base_rate) }}
            </td>

            <!-- Status badge -->
            <td class="px-4 py-2">
                <span
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium"
                    :class="statusBadgeClass(contract.status)"
                >
                  {{ $t(contract.status) }}
                </span>
            </td>

            <td class="px-4 py-2">
              <div class="flex items-center gap-2">
                <button
                    class="whitespace-nowrap bg-purple-600 text-white hover:bg-purple-700 px-3 py-1 text-xs rounded-md border"
                    @click.stop="openUpdateRate(contract)"
                >
                  Փոփոխել ակտիվ պայմանագրի դրույքը
                </button>

                <!-- NEW: see schedules button -->
                <button
                    class="whitespace-nowrap bg-indigo-600 text-white hover:bg-indigo-700 px-3 py-1 text-xs rounded-md border"
                    @click.stop="openSchedules(contract)"
                >
                  Տեսնել աշխ․ գրաֆիկը
                </button>
              </div>
            </td>
          </tr>

          <!-- Documents -->
          <tr v-if="expanded[contract?.id]">
            <td :colspan="7" class="px-0 md:px-4 pt-2 pb-4 bg-slate-50">
              <div class="hidden md:block overflow-x-auto rounded-xl border border-gray-200 bg-white mx-4">
                <div v-if="(contract.documents || []).length" class="p-4 flex flex-col gap-y-2">
                  <p class="font-medium">{{ $t('documents') }}</p>
                  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div
                        v-for="doc in contract.documents"
                        :key="doc.id"
                        class="border border-gray-200 bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition"
                    >
                      <div class="space-y-2">
                        <div class="text-sm text-gray-700 font-semibold">{{ doc.type?.name }}</div>
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
                </div>
                <div v-else class="text-gray-500 text-center py-10">{{ $t('no_documents') }}</div>
              </div>
            </td>
          </tr>
        </template>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Update Active Contract Rate Modal -->
  <UpdateActiveContractRateModal
      :open="showUpdateRateModal"
      :employee-id="updateRateEmployeeId"
      :contract-id="rowForUpdate?.id || null"
      :initial-base-rate="rowForUpdate?.base_rate ?? null"
      :currency="rowForUpdate?.currency || 'AMD'"
      @close="() => { showUpdateRateModal = false; rowForUpdate = null }"
      @saved="onUpdatedRate"
  />

  <!-- Schedules list modal -->
  <div v-if="showSchedulesModal" class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/40" @click="closeSchedules"></div>

    <div
        class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
             w-full max-w-3xl bg-white rounded-2xl shadow-xl"
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-5 py-4 border-b">
        <h3 class="text-lg font-semibold">Աշխատաժամերի գրաֆիկներ</h3>
        <button class="p-2 rounded-lg hover:bg-gray-100" @click="closeSchedules" aria-label="Close">✕</button>
      </div>

      <!-- Body -->
      <div class="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-sm">
        <div v-if="!currentSchedules.length" class="text-slate-500">
          Ցանկը դատարկ է
        </div>

        <div v-else class="overflow-x-auto rounded-xl border border-gray-300 bg-white">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-50">
            <tr>
              <th class="text-left px-3 py-2">Հերթափոխ</th>
              <th class="text-left px-3 py-2">Ժամեր</th>
              <th class="text-left px-3 py-2">Թարմացվել է</th>
            </tr>
            </thead>
            <tbody class="divide-y">
            <tr v-for="(a, idx) in currentSchedules" :key="a?.id ?? idx">
              <td class="px-3 py-2">
                <span
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium"
                    :class="(a?.shift) ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-700 border-slate-200'"
                >
                  {{ a?.shift ? 'Այո' : 'Ոչ' }}
                </span>
              </td>

              <!-- HOURS CELL -->
              <td class="px-3 py-2">
                <!-- Shift-style -->
                <div v-if="a.shift_hours">
                  <p class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border bg-emerald-50 border-emerald-200 text-emerald-800">
                    <span class="text-xs">Հերթափոխ</span>
                    <span class="font-medium">{{ a.shift_hours }} ժ</span>
                    <span class="text-xs opacity-70">/ {{ a.shift_periodicity }} ժ պարբեր.</span>
                  </p>
                </div>

                <!-- Pattern-style: render the array of {weekday, working_hours} beautifully -->
                <div v-else>
                  <div
                      v-if="Array.isArray(a.working_days) && a.working_days.length"
                      class="flex flex-wrap gap-2"
                  >
                    <div
                        v-for="d in normalizedDays(a.working_days)"
                        :key="d.weekday"
                        class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border bg-white border-gray-200 shadow-sm"
                        :title="dowLabel(d.weekday)"
                    >
                      <span class="text-[11px] text-slate-500 w-7 text-center">{{ dowShort[d.weekday] }}</span>
                      <span class="text-sm font-medium">{{ d.working_hours }} ժ</span>
                    </div>
                    <!-- total -->
                    <div
                        class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border bg-indigo-50 border-indigo-200 text-indigo-800 ml-1"
                        title="Շաբաթվա ընդհանուր ժամեր"
                    >
                      <span class="text-[11px]">Ընդամենը</span>
                      <span class="text-sm font-semibold">{{ sumHours(a.working_days) }} ժ</span>
                    </div>
                  </div>
                  <div v-else class="text-slate-400">—</div>
                </div>
              </td>

              <td class="px-3 py-2">
                {{ a?.updated_at ? formatDateTime(a.updated_at) + ' • ' + fromNow(a.updated_at) : '—' }}
              </td>
            </tr>
            </tbody>
          </table>
        </div>

      </div>

      <!-- Footer -->
      <div class="p-4 border-t flex items-center justify-end gap-2">
        <button class="px-3 py-2 rounded-xl border hover:bg-gray-50" @click="closeSchedules">
          Փակել
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { formatDateTime, fromNow } from '@/utils/dateFormat'
import { employeesApi } from '@/api.ts'
import UpdateActiveContractRateModal from '@/views/hr/components/Employee/UpdateActiveContractRateModal.vue'

const props = defineProps<{
  employee: any | null
}>()

const expanded = reactive<Record<number | string, boolean>>({})
const contracts = ref<any[] | null>(null)

function toggle(id: number | string) {
  expanded[id] = !expanded[id]
}

async function getContracts(employeeId?: number) {
  if (!employeeId || Number.isNaN(+employeeId)) return
  try {
    const res = await employeesApi.getEmployeeContracts(employeeId)
    contracts.value = res?.data ?? res ?? []
  } catch (e) {
    console.log(e)
  }
}

/** Status → badge classes */
function statusBadgeClass(status?: string) {
  const s = String(status || '').toLowerCase()
  const map: Record<string, string> = {
    active:    'bg-emerald-50 text-emerald-700 border-emerald-200',
    pending:   'bg-amber-50 text-amber-700 border-amber-200',
    draft:     'bg-slate-50 text-slate-700 border-slate-200',
    suspended: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    terminated:'bg-rose-50 text-rose-700 border-rose-200',
    cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
  }
  return map[s] || 'bg-slate-50 text-slate-700 border-slate-200'
}

/** Watch employee id — fire immediately once it exists, and on change */
watch(
    () => props.employee?.id,
    (id) => { getContracts(Number(id)) },
    { immediate: true }
)

/** Update Active Contract Rate flow */
const showUpdateRateModal = ref(false)
const updateRateEmployeeId = ref<number | null>(null)
const rowForUpdate = ref<any | null>(null)

async function onUpdatedRate() {
  showUpdateRateModal.value = false
  updateRateEmployeeId.value = null
  await getContracts(props.employee?.id)
  ;(window as any)?.$toast?.success?.('Դրույքը հաջողությամբ թարմացվեց') ?? void 0
}

function openUpdateRate(row: any) {
  rowForUpdate.value = row
  updateRateEmployeeId.value = props.employee?.id || null
  showUpdateRateModal.value = true
}

/** Schedules modal state */
const showSchedulesModal = ref(false)
const currentSchedules = ref<any[]>([])

/** Armenian weekday labels (0=Mon … 6=Sun, per your data) */
const dowShort = ['Երկ', 'Երք', 'Չրք', 'Հնգ', 'Ուր', 'Շբթ', 'Կիր']
function dowLabel(i: number) { return dowShort[i] || String(i) }

/** Pretty helpers for the working_days array you send */
function normalizedDays(days: Array<{ weekday: number; working_hours: number }>) {
  return [...days]
      .filter(d => d && Number.isFinite(d.weekday) && Number.isFinite(d.working_hours))
      .sort((a, b) => a.weekday - b.weekday)
}
function sumHours(days?: Array<{ weekday: number; working_hours: number }>) {
  if (!Array.isArray(days)) return 0
  return days.reduce((s, d) => s + Number(d.working_hours || 0), 0)
}

function openSchedules(contract: any) {
  // Expecting each contract to have schedule_assignments
  currentSchedules.value = Array.isArray(contract?.schedule_assignments)
      ? contract.schedule_assignments
      : []
  showSchedulesModal.value = true
}

function closeSchedules() {
  showSchedulesModal.value = false
  currentSchedules.value = []
}
</script>
