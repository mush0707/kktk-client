<template>
  <div class="space-y-4 bg-white p-4 border border-gray-300 rounded-xl">
    <!-- Controls -->
    <div class="flex flex-col gap-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <button class="px-2 py-1 rounded-lg border border-gray-300" @click="prevMonth" aria-label="Prev">‹</button>
          <div class="text-lg font-semibold">{{ monthLabel }}</div>
          <button class="px-2 py-1 rounded-lg border border-gray-300" @click="nextMonth" aria-label="Next">›</button>
        </div>
      </div>

      <!-- Mode + Filters -->
      <div class="flex flex-wrap items-center gap-3">
        <!-- Holidays sub-mode -->
        <div v-if="mode==='holidays'" class="inline-flex rounded-xl border border-gray-300 bg-white overflow-hidden">
          <button
              class="px-3 py-2 text-sm"
              :class="holidayPickMode==='day' ? 'bg-slate-800 text-white' : 'hover:bg-slate-50'"
              @click="setHolidayPickMode('day')"
          >
            օր
          </button>
          <button
              class="px-3 py-2 text-sm border-l"
              :class="holidayPickMode==='range' ? 'bg-slate-800 text-white' : 'hover:bg-slate-50'"
              @click="setHolidayPickMode('range')"
          >
            միջակայք
          </button>
        </div>

        <!-- Department -->
        <div class="min-w-[220px]">
          <VueSelect
              v-model="selectedDepartment"
              :options="deptOptions"
              :get-option-value="o => o.id"
              label="label"
              track-by="id"
              :clearable="true"
              :loading="loadingDept"
              placeholder="Ընտրել բաժին…"
              @open="ensureDepartments"
              @option-selected="onDepartmentChange"
              @option-deselected="onDepartmentChange"
          />
        </div>

        <!-- Role (depends on department for options) -->
        <div class="min-w-[220px]">
          <VueSelect
              v-model="selectedRole"
              :options="roleOptions"
              :get-option-value="o => o.role_id"
              label="label"
              :clearable="true"
              :loading="loadingRole"
              :disabled="!selectedDepartment"
              placeholder="Ընտրել հաստիք…"
              @open="ensureRoles"
              @option-selected="onRoleChange"
              @option-deselected="onRoleChange"
          />
        </div>

        <!-- Staff (INDEPENDENT of dept/role; always enabled) -->
        <div class="min-w-[260px]">
          <VueSelect
              v-model="selectedStaff"
              :options="staffOptions"
              :get-option-value="o => o.id"
              label="label"
              :clearable="true"
              :loading="loadingStaff"
              :filterable="true"
              @search="onStaffSearch"
              placeholder="Ընտրել աշխատակցին…"
          />
        </div>
      </div>
    </div>

    <!-- Calendar -->
    <div class="border rounded-2xl bg-white">
      <div class="grid grid-cols-7 text-xs text-slate-500 border-b">
        <div v-for="d in WEEKDAYS" :key="d" class="py-2 text-center">{{ d }}</div>
      </div>

      <div class="grid grid-cols-7 gap-1 p-2">
        <template
            v-for="cell in cells"
            :key="cell.key"
        >
          <div class="flex flex-col justify-end">
            <div
                class="h-40 p-2 rounded-lg border relative overflow-hidden"
                :class="{
                  'opacity-40': cell.outside,
                  'ring-2 ring-slate-400': isRangeEdge(cell.date),
                  'ring-1 ring-slate-300': isInRange(cell.date)
                }"
                @click="onDayClick(cell.date)"
            >
              <!-- Public holiday backdrop / badge -->
              <div v-if="isPublicHoliday(cell.date)" class="absolute inset-0 pointer-events-none bg-amber-50/60"></div>
              <div class="flex items-center justify-between relative">
                <span class="text-lg text-slate-600">{{ cell.date.getDate() }}</span>
                <span v-if="isPublicHoliday(cell.date)"
                      class="text-[10px] px-1 rounded bg-amber-100 text-amber-700 border border-amber-200">ոչ աշխատ.</span>
              </div>

              <!-- OPEN MODALS -->
              <div v-if="eventsByDay(cell.date).length || daySearch[sameDayKey(cell.date)]?.length" class="mt-2">
                <button
                    class="text-blue-700 hover:text-white border border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2"
                    @click.stop="openDayListModal(cell.date)"
                    :title="`Ցուցակ / որոնում (${eventsByDay(cell.date).length})`"
                >
                  Աշխատացանկ ({{ eventsByDay(cell.date).length }})
                </button>
              </div>
              <div v-if="leavesByDay(cell.date).length" class="mt-1">
                <button
                    class="text-red-700 hover:text-white border border-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2"
                    @click.stop="openDayLeavesModal(cell.date)"
                    :title="`Արձակուրդներ (${leavesByDay(cell.date).length})`"
                >
                  Արձակուրդներ ({{ leavesByDay(cell.date).length }})
                </button>
              </div>
              <div class="mt-1">
                <button
                    class="px-3 w-full py-1.5 text-xs rounded-md border border-slate-300 bg-white hover:bg-slate-50"
                    @click.stop="openOvertimeModal(cell.date)"
                    :title="`Արտաժամ — ${dateLabel(cell.date)}`"
                >
                  Արտաժամ
                </button>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Loading / Empty -->
    <div v-if="loading" class="text-sm text-slate-500">Բեռնվում է…</div>
    <div v-else-if="!hasAnyEvent" class="text-sm text-slate-500">Տվյալներ չկան</div>

    <!-- HOLIDAY MODAL -->
    <div v-if="holidayModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/30" @click="closeHolidayModal"></div>

      <div class="relative bg-white rounded-2xl w-full max-w-2xl shadow-xl p-6">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-lg font-semibold">
            Ավելացնել արձակուրդ —
            <template v-if="holidayPickMode==='day'">
              {{ dateLabel(modalRange.start!) }}
            </template>
            <template v-else>
              {{ dateLabel(modalRange.start!) }} – {{ dateLabel(modalRange.end!) }}
            </template>
          </h3>
          <button class="px-3 py-1 rounded-lg border" @click="closeHolidayModal">Փակել</button>
        </div>

        <!-- Filters snapshot (labels resolved from options) -->
        <div class="flex flex-wrap gap-2 text-xs text-slate-600 mb-2">
          <span class="px-2 py-1 rounded bg-slate-100">Բաժին: {{ selectedDepartmentLabel }}</span>
          <span class="px-2 py-1 rounded bg-slate-100">Հաստիք: {{ selectedRoleLabel }}</span>
        </div>

        <!-- Staff picker -->
        <div class="flex items-end gap-3">
          <div class="min-w-[280px]">
            <label class="block text-sm text-slate-600 mb-1">Աշխատակից</label>
            <VueSelect
                v-model="modalStaff"
                :options="staffOptions"
                :get-option-value="o => o.id"
                label="label"
                :filterable="true"
                :clearable="true"
                :loading="loadingStaff"
                @search="onStaffSearch"
                placeholder="Ընտրել աշխատակցին…"
            />
          </div>
          <button
              class="px-3 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50"
              :disabled="!modalStaff"
              @click="addStaffToHolidayList"
          >
            Ավելացնել
          </button>
        </div>

        <!-- Chosen list -->
        <div class="mt-4 border rounded-xl overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-gray-50">
            <tr class="text-left">
              <th class="px-3 py-2">#</th>
              <th class="px-3 py-2">Աշխատակից</th>
              <th class="px-3 py-2">Միջոցառումը</th>
              <th class="px-3 py-2 w-10"></th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="(row, idx) in modalChosen" :key="row.id" class="border-t">
              <td class="px-3 py-2">{{ idx + 1 }}</td>
              <td class="px-3 py-2">{{ row.label }}</td>
              <td class="px-3 py-2">
                <span v-if="holidayPickMode==='day'">{{ dateLabel(modalRange.start!) }}</span>
                <span v-else>{{ dateLabel(modalRange.start!) }} – {{ dateLabel(modalRange.end!) }}</span>
              </td>
              <td class="px-3 py-2">
                <button class="text-red-600 hover:underline" @click="removeChosen(idx)">Հեռացնել</button>
              </td>
            </tr>
            <tr v-if="modalChosen.length===0">
              <td colspan="4" class="px-3 py-6 text-center text-slate-500">Չկա ընտրված աշխատակից</td>
            </tr>
            </tbody>
          </table>
        </div>

        <div class="flex justify-end gap-2 mt-4">
          <button class="px-4 py-2 rounded-lg border hover:bg-gray-100" @click="closeHolidayModal">Փակել</button>
          <button
              class="px-4 py-2 rounded-lg text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
              :disabled="modalChosen.length===0 || submittingHolidays"
              @click="submitHolidays"
          >
            Պահպանել
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- NEW (OVERTIME) -->
  <div v-if="overtimeModalOpen" class="fixed inset-0 z-40 p-4 flex items-center justify-center">
    <div class="absolute inset-0 bg-black/30" @click="closeOvertimeModal"></div>

    <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-6xl p-6">
      <div class="flex items-center justify-between gap-3">
        <div>
          <div class="text-[12px] uppercase tracking-wide text-slate-500">Արտաժամ</div>
          <div class="text-lg font-semibold">{{ dateLabel(overtimeDate) }}</div>
        </div>
        <button class="px-3 py-1 rounded-lg border" @click="closeOvertimeModal">Փակել</button>
      </div>

      <!-- Filters (same options deps; v-models are INTs) -->
      <div class="mt-4 grid md:grid-cols-3 gap-3">
        <div>
          <label class="block text-sm text-slate-600 mb-1">Բաժին</label>
          <VueSelect
              v-model="otDepartment"
              :options="deptOptions"
              :get-option-value="o => o.id"
              label="label"
              track-by="id"
              :clearable="true"
              :loading="loadingDept"
              placeholder="Ընտրել բաժին…"
              @open="ensureDepartments"
              @option-selected="onOTDepartmentChange"
              @option-deselected="onOTDepartmentChange"
          />
        </div>

        <div>
          <label class="block text-sm text-slate-600 mb-1">Հաստիք</label>
          <VueSelect
              v-model="otRole"
              :options="otRoleOptions"
              :get-option-value="o => o.role_id"
              label="label"
              :clearable="true"
              :loading="otLoadingRole"
              :disabled="!otDepartment"
              placeholder="Ընտրել հաստիք…"
              @open="ensureOTRoles"
              @option-selected="onOTRoleChange"
              @option-deselected="onOTRoleChange"
          />
        </div>

        <div>
          <label class="block text-sm text-slate-600 mb-1">Աշխատակից</label>
          <VueSelect
              v-model="otStaff"
              :options="otStaffOptions"
              :get-option-value="o => o.id"
              label="label"
              :clearable="true"
              :filterable="true"
              :loading="otLoadingStaff"
              placeholder="Ընտրել աշխատակցին…"
              @search="onOTStaffSearch"
              @option-selected="onOTStaffSelected"
          />
        </div>
      </div>

      <!-- Chosen list -->
      <div class="mt-4 border border-gray-300 overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50">
          <tr class="text-left">
            <th class="px-3 py-2 w-10">#</th>
            <th class="px-3 py-2">Աշխատակից</th>
            <th class="px-3 py-2" :title="'Base & busy windows used for total'">Ընտրված օրվա աշխ․ ժամեր (բոլորը)</th>
            <th class="px-3 py-2">Շաբաթվա ժամեր (բոլորը)</th>
            <th class="px-3 py-2">Հավելյալ աշխատաժամեր</th>
            <th class="px-3 py-2 w-10"></th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="(row, idx) in otChosen" :key="row.id" class="border-t align-top">
            <td class="px-3 py-2">{{ idx + 1 }}</td>
            <td class="px-3 py-2">{{ row.label }}</td>
            <td class="px-3 py-2" :title="row.calc_details">
              <span class="font-medium">{{ row.calculated_total_hours }}</span>
              <span class="text-xs text-slate-500"> ժ.</span>
            </td>
            <td class="px-3 py-2">
              <span class="font-medium">{{ row.calculated_week_hours }}</span>
              <span class="text-xs text-slate-500"> ժ.</span>
            </td>
            <td class="px-3 py-2">
              <!-- Working hours number -->
              <div class="flex items-center gap-2">
                <input
                    v-model.number="row.working_hours"
                    type="number"
                    min="0"
                    max="12"
                    step="0.5"
                    class="w-24 px-2 py-1 text-sm rounded-lg border border-gray-300"
                    @input="onWorkingHoursEdited(row)"
                />
                <span class="text-xs text-slate-500">ժ.</span>
              </div>

              <!-- Open windows picker -->
              <div class="mt-2 flex items-center gap-2">
                <select
                    class="min-w-[210px] max-w-full px-2 py-1 rounded-lg border border-gray-300 bg-white text-sm"
                    v-model.number="row.selected_window_index"
                    @change="onPickWindow(row)"
                >
                  <option :value="-1" disabled>Ընտրել ազատ պատուհան</option>
                  <option
                      v-for="(w, wi) in row.open_windows"
                      :key="wi"
                      :value="wi"
                  >{{ w.label }}</option>
                </select>
                <span v-if="row.open_windows.length===0" class="text-xs text-rose-600">Ազատ պատուհան չկա</span>
              </div>

              <!-- Start/End within selected window -->
              <div v-if="row.selected_window_index>=0" class="mt-2 flex items-center gap-2">
                <input
                    type="time"
                    class="px-2 text-sm py-1 rounded-lg border border-gray-300"
                    step="1800"
                    v-model="row.ot_start"
                    :min="row.window_min"
                    :max="row.window_max"
                    @change="syncFromTimes(row)"
                />
                <span>–</span>
                <input
                    type="time"
                    class="px-2 py-1 text-sm rounded-lg border border-gray-300"
                    step="1800"
                    v-model="row.ot_end"
                    :min="row.window_min"
                    :max="row.window_max"
                    @change="syncFromTimes(row)"
                />
                <span class="text-[11px] text-slate-500">սահման՝ {{ row.window_min }}–{{ row.window_max }}</span>
              </div>
            </td>
            <td class="px-3 py-2">
              <button class="text-red-600 hover:underline" @click="removeOTChosen(idx)">Հեռացնել</button>
            </td>
          </tr>
          <tr v-if="otChosen.length === 0">
            <td colspan="6" class="px-3 py-6 text-center text-slate-500">Չկա ընտրված աշխատակից</td>
          </tr>
          </tbody>
        </table>
      </div>

      <div class="flex justify-end gap-2 mt-4">
        <button class="px-4 py-2 rounded-lg border hover:bg-gray-100" @click="closeOvertimeModal">Փակել</button>
        <button
            class="px-4 py-2 rounded-lg text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
            :disabled="otChosen.length === 0 || submittingOvertimes"
            @click="submitOvertimes"
        >
          Պահպանել
        </button>
      </div>
    </div>
  </div>

  <!-- Movement modal -->
  <WorkingHoursMovementModal
      :open="movementOpen"
      :day="pickedDayYMD"
      :department-id="selectedDepartment || null"
      :role-id="selectedRole || null"
      :day-employee-ids="dayEmployeeIds"
      :prefill-primary-id="prefillPrimaryId"
      @close="movementOpen=false"
      @saved="fetchAssignments"
  />

  <!-- Day Events Modal -->
  <div v-if="dayListModalOpen" class="fixed inset-0 z-30 p-4">
    <div class="absolute inset-0 bg-black/30" @click="closeDayListModal"></div>
    <div class="relative bg-white rounded-2xl shadow-xl max-w-3xl w-full mx-auto p-6">
      <div class="flex items-center justify-between gap-3">
        <div>
          <div class="text-[12px] uppercase tracking-wide text-slate-500">Օրվա ցուցակ</div>
          <div class="text-lg font-semibold">{{ dateLabel(modalDayDate) }}</div>
        </div>
        <button class="px-3 py-1 rounded-lg border" @click="closeDayListModal">Փակել</button>
      </div>

      <div class="mt-4">
        <input
            type="text"
            class="w-full text-sm px-3 py-2 rounded-lg border border-gray-300"
            :placeholder="`Փնտրել (${eventsByDay(modalDayDate).length})…`"
            v-model="modalSearch"
        />
      </div>

      <div class="mt-4 space-y-2 max-h-[60vh] overflow-y-auto pr-1">
        <div
            v-for="ev in modalFilteredEvents"
            :key="ev.key"
            class="text-[12px] w-full px-2 flex items-center gap-2 py-2 rounded border"
            :class="eventClass(ev)"
            :title="eventTitle(ev)"
        >
          <span class="font-bold">{{ ev.label }}</span>
          <span>{{ ev.role.name }}</span>
          <span v-if="mode==='working'" class="whitespace-nowrap">{{ timeLabel(ev.start) }}–{{ timeLabel(ev.end) }}</span>
          <span v-else class="whitespace-nowrap">{{ dateLabel(ev.start) }}<template v-if="!sameDay(ev.start, ev.end)"> – {{ dateLabel(ev.end) }}</template></span>
          <div v-if="mode==='working' && ev.shift" class="text-[10px] opacity-70">Հերթափոխ՝ {{ ev.shift_hours }} / {{ ev.shift_periodicity }}</div>
          <div v-else-if="mode==='working' && ev.working_hours != null" class="text-[10px] opacity-70">{{ ev.working_hours }} ժ.</div>
          <div v-else-if="mode==='holidays'" class="text-[10px] opacity-70 capitalize">{{ ev.status }}</div>

          <div class="ml-auto flex items-center gap-2">
           <span v-if="ev.fromActiveOvertime" class="text-[11px] text-slate-500">
              <span v-if="ev.overtimeKind === 'free' && ev.movement_employee_overtime_id">Տեղափոխված է</span>
              <span v-if="ev.overtimeKind === 'busy' && !ev.movement_employee_overtime_id">Արտաժամ</span>
              <span v-if="ev.overtimeKind === 'busy'  && ev.movement_employee_overtime_id">Փոխարինել է</span>
            </span>
            <button
                v-if="mode==='working' && ev.shift"
                class="text-xs px-2 py-1 rounded-lg border bg-white border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="ev.fromActiveOvertime || isPastDay(modalDayDate)"
                @click.stop="!ev.fromActiveOvertime && !isPastDay(modalDayDate) && openMovementFor(modalDayDate, ev)"
                :title="ev.fromActiveOvertime
            ? 'Այս տողը կազմվել է տեղափոխությունից (active_overtimes) և չի կարող տեղափոխվել կրկին'
            : (isPastDay(modalDayDate) ? 'Անցյալ օր • չի կարելի տեղափոխել' : 'Տեղափոխել')"
            >
              Տեղափոխել
            </button>
          </div>
        </div>

        <div v-if="modalFilteredEvents.length===0" class="text-sm text-slate-500 py-8 text-center">
          Չկան արդյունքներ
        </div>
      </div>
    </div>
  </div>

  <!-- Day Leaves Modal -->
  <div v-if="dayLeavesModalOpen" class="fixed inset-0 z-30 p-4">
    <div class="absolute inset-0 bg-black/30" @click="closeDayLeavesModal"></div>
    <div class="relative bg-white rounded-2xl shadow-xl max-w-3xl w-full mx-auto p-6">
      <div class="flex items-center justify-between gap-3">
        <div>
          <div class="text-[12px] uppercase tracking-wide text-slate-500">Օրվա արձակուրդներ</div>
          <div class="text-lg font-semibold">{{ dateLabel(leavesModalDate) }}</div>
        </div>
        <button class="px-3 py-1 rounded-lg border" @click="closeDayLeavesModal">Փակել</button>
      </div>

      <div class="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
        <div v-for="grp in dayLeavesGrouped" :key="grp.employee" class="border border-gray-300">
          <div class="px-3 py-2 bg-gray-50 font-medium">{{ grp.employee }}</div>
          <table class="w-full text-sm">
            <thead class="text-left text-slate-600">
            <tr>
              <th class="px-3 py-2">Տեսակ / Անվանում</th>
              <th class="px-3 py-2">Ժամանակահատված</th>
              <th class="px-3 py-2">Օրեր</th>
              <th class="px-3 py-2">Կարգավիճակ</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="lr in grp.items" :key="lr.id" class="border-t">
              <td class="px-3 py-2">
                {{ lr.type.name }}
              </td>
              <td class="px-3 py-2 whitespace-nowrap">
                {{ lr.date_from }} <template v-if="lr.date_to && lr.date_to!==lr.date_from">– {{ lr.date_to }}</template>
              </td>
              <td class="px-3 py-2">{{ lr.days ?? '—' }}</td>
              <td class="px-3 py-2 capitalize">{{ $t(lr.status) }}</td>
            </tr>
            </tbody>
          </table>
        </div>

        <div v-if="dayLeavesGrouped.length===0" class="text-sm text-slate-500 py-8 text-center">
          Չկան արձակուրդային գրառումներ
        </div>
      </div>
    </div>
  </div>

</template>

<script setup lang="ts">
import {computed, onMounted, ref, watch} from 'vue'
import VueSelect from 'vue3-select-component'
import {directoriesApi, employeesApi, leaveRequestApi} from '@/api.ts'
import WorkingHoursMovementModal from '@/views/hr/components/Calendar/WorkingHoursMovementModal.vue'

const movementOpen = ref(false)
const pickedDayYMD = ref<string>('')      // 'YYYY-MM-DD'
const dayEmployeeIds = ref<number[]>([])  // employees working that day
const prefillPrimaryId = ref<number | null>(null)

/* per-day search memory */
const daySearch = ref<Record<string, string>>({})

/* Day list modal */
const dayListModalOpen = ref(false)
const modalDayDate = ref<Date>(new Date())
const modalSearch = ref('')

function openDayListModal(d: Date) {
  modalDayDate.value = new Date(d)
  const key = sameDayKey(modalDayDate.value)
  modalSearch.value = daySearch.value[key] || ''
  dayListModalOpen.value = true
}
function closeDayListModal() { dayListModalOpen.value = false }

watch(modalSearch, (v) => {
  const key = sameDayKey(modalDayDate.value)
  daySearch.value[key] = v
})

function eventsByDayFiltered(d: Date) {
  const key = sameDayKey(d)
  const q = (daySearch.value[key] || '').trim().toLowerCase()
  const list = eventsByDay(d)
  if (!q) return list
  return list.filter(ev => String(ev.label || '').toLowerCase().includes(q))
}
const modalFilteredEvents = computed(() => eventsByDayFiltered(modalDayDate.value))

function dayEmployeeIdsFor(d: Date): number[] {
  const ids = (eventsByDay(d) || [])
      .map(e => e.employee_id)
      .filter((v): v is number => typeof v === 'number')
  return Array.from(new Set(ids))
}
function ymdLocal(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
function openMovementFor(day: Date, ev: any) {
  if (isPastDay(day)) return
  pickedDayYMD.value = ymdLocal(day);
  dayEmployeeIds.value = dayEmployeeIdsFor(day)
  prefillPrimaryId.value = ev.employee_id ?? null
  movementOpen.value = true
}

/* Types */
type WorkingDay = { weekday: number; working_hours: number }
type ActiveOvertime = {
  id: number
  status: string
  movement_employee_overtime_id: number | null
  employee_id: number
  employment_contract_id: number
  start_time: string
  finished_time: string
  movement?: {
    id: number
    status: string
    movement_employee_overtime_id: number | null
    employee_id: number
    employment_contract_id: number
    start_time: string
    finished_time: string
  } | null
}
type LeaveRequest = {
  id: number
  employee_id: number
  leave_type_id?: number | null
  name?: string | null
  date_from: string
  date_to: string
  days?: number | null
  status: 'pending' | 'approved' | 'canceled' | 'active' | string
}
type AssignmentRow = {
  id: number
  employee_id: number
  employment_contract_id: number
  start_date: string
  end_date: string | null
  start_time: string | null
  shift: number | boolean
  shift_hours: number | null
  shift_periodicity: number | null
  status?: string
  working_days: WorkingDay[]
  active_overtimes?: ActiveOvertime[] | null
  contract?: {
    employee?: { first_name?: string; last_name?: string, leave_requests?: LeaveRequest[] | null }
    role?: { id: number; name: string },
  } | null
}
type HolidayRow = { date_from: string; date_to: string; status: 'pending' | 'active'; employee: { name: string } }
type Ev = {
  key: string
  dateKey: string
  start: Date
  end: Date
  employee_id?: number
  contract_id?: number
  label: string
  status?: string
  shift?: boolean
  shift_hours?: number | null
  shift_periodicity?: number | null
  working_hours?: number | null
  holiday?: boolean
  contract: [] | null
  role: { id: number; name: string }
  fromActiveOvertime?: boolean
  overtimeKind?: 'busy' | 'free'
  movement_employee_overtime_id?: number | null
}

const WEEKDAYS = ['Երկ', 'Երք', 'Չրք', 'Հնգ', 'Ուր', 'Շբթ', 'Կիր']

/* Calendar state */
const viewYear = ref<number>(new Date().getFullYear())
const viewMonth = ref<number>(new Date().getMonth())
const monthLabel = computed(() => {
  const d = new Date(viewYear.value, viewMonth.value, 1)
  const m = new Intl.DateTimeFormat('hy-AM', {month: 'long'}).format(d)
  return `${d.getFullYear()} ${m.charAt(0).toUpperCase() + m.slice(1)}`
})
const dayLeavesModalOpen = ref(false)
const leavesModalDate = ref<Date>(new Date())
const todayStart = startOfDay(new Date())
function isPastDay(d: Date) { return endOfDay(d) < todayStart }
function openDayLeavesModal(d: Date) { leavesModalDate.value = new Date(d); dayLeavesModalOpen.value = true }
function closeDayLeavesModal() { dayLeavesModalOpen.value = false }

/** grouped by employee for the chosen day */
const dayLeavesGrouped = computed(() => {
  const list = leavesByDay(leavesModalDate.value)
  const map = new Map<number, { employee: string, items: LeaveRequest[] }>()
  for (const row of list) {
    const x = map.get(row.employee_id) || { employee: row.employee_label, items: [] as LeaveRequest[] }
    x.items.push(row.request)
    map.set(row.employee_id, x)
  }
  return Array.from(map.values())
})
function startOfDay(d: Date) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }
function endOfDay(d: Date) { const x = new Date(d); x.setHours(23, 59, 59, 999); return x }
function addHours(dt: Date, hrs: number) { const x = new Date(dt); x.setHours(x.getHours() + hrs); return x }

/** Parse Y-M-D into Date at 00:00 local */
function ymdToStart(ymd?: string | null): Date | null {
  if (!ymd) return null
  const m = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return null
  return new Date(+m[1], +m[2]-1, +m[3], 0, 0, 0, 0)
}
/** Full-day window [start, nextDayStart) */
function fullDayWindow(fromYMD: string, toYMD?: string) {
  const s = ymdToStart(fromYMD)!
  const eStart = ymdToStart(toYMD || fromYMD)!
  const e = new Date(eStart); e.setDate(e.getDate() + 1)
  return { start: s, end: e }
}
/** Build per-employee leave windows */
function buildLeaveIndex(list: AssignmentRow[]) {
  const idx = new Map<number, Array<{ start: Date; end: Date; req: LeaveRequest }>>()
  for (const r of list || []) {
    const lrs = r.contract?.employee?.leave_requests || []
    for (const lr of lrs) {
      const s = ymdToStart(lr.date_from)
      const e0 = ymdToStart(lr.date_to || lr.date_from)
      if (!s || !e0) continue
      const e = new Date(e0); e.setDate(e.getDate() + 1)
      if (e <= s) continue
      const arr = idx.get(r.employee_id) || []
      arr.push({ start: s, end: e, req: lr })
      idx.set(r.employee_id, arr)
    }
  }
  return idx
}
/** All leave requests that cover a given day */
function leavesByDay(d: Date) {
  const keyTS = startOfDay(d).getTime()
  const seen = new Set<number>()
  const rows: Array<{ employee_id: number; employee_label: string; request: LeaveRequest }> = []
  for (const r of (rawList.value || [])) {
    const empLabel = labelForRow(r)
    const lrs = r.contract?.employee?.leave_requests || []
    for (const lr of lrs) {
      const s = ymdToStart(lr.date_from); const e = ymdToStart(lr.date_to || lr.date_from)
      if (!s || !e) continue
      const sTS = startOfDay(s).getTime()
      const eTS = startOfDay(e).getTime()
      if (keyTS >= sTS && keyTS <= eTS) {
        if (!seen.has(lr.id)) {
          seen.add(lr.id)
          rows.push({ employee_id: r.employee_id, employee_label: empLabel, request: lr })
        }
      }
    }
  }
  return rows
}
function sameDayKey(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
function parseDateTime(s?: string | null): Date | null {
  if (!s) return null
  const [datePart, timePart] = s.split(' ')
  if (!datePart) return null
  const [Y, M, D] = datePart.split('-').map(n => Number(n))
  const [h = 0, m = 0, sec = 0] = (timePart?.split(':').map(Number) ?? [])
  const d = new Date(Y, (M || 1) - 1, D || 1, h || 0, m || 0, sec || 0, 0)
  return isNaN(+d) ? null : d
}

/* Month derived */
const monthStart = computed(() => new Date(viewYear.value, viewMonth.value, 1))
const monthEnd = computed(() => new Date(viewYear.value, viewMonth.value + 1, 0))

/* Cells */
const cells = computed(() => {
  const first = new Date(viewYear.value, viewMonth.value, 1)
  const start = new Date(first)
  const startWeekday = (first.getDay() + 6) % 7 // Monday=0
  start.setDate(first.getDate() - startWeekday)
  const list: Array<{ key: string; date: Date; outside: boolean }> = []
  for (let i = 0; i < 42; i++) {
    const day = new Date(start)
    day.setDate(start.getDate() + i)
    list.push({key: sameDayKey(day), date: day, outside: day.getMonth() !== viewMonth.value})
  }
  return list
})
function prevMonth() { const m = viewMonth.value - 1; if (m < 0) { viewMonth.value = 11; viewYear.value -= 1 } else { viewMonth.value = m } }
function nextMonth() { const m = viewMonth.value + 1; if (m > 11) { viewMonth.value = 0; viewYear.value += 1 } else { viewMonth.value = m } }

/* Mode */
type Mode = 'working' | 'holidays'
const mode = ref<Mode>('working')
function setMode(m: Mode) {
  if (mode.value === m) return
  mode.value = m
  resetHolidayRange()
  buildEvents()
  triggerDataFetch()
}

/* Holidays sub-mode */
type HolidayPickMode = 'day' | 'range'
const holidayPickMode = ref<HolidayPickMode>('day')
function setHolidayPickMode(p: HolidayPickMode) { holidayPickMode.value = p; resetHolidayRange() }

/* Filters (INT IDs) */
const selectedDepartment = ref<number | null>(null)
const selectedRole = ref<number | null>(null)           // role_id
const selectedStaff = ref<number | null>(null)

const deptOptions = ref<Array<{ id: number; label: string }>>([])
const roleOptions = ref<Array<{ id: number; label: string; role_id: number }>>([])
const staffOptions = ref<Array<{ id: number; label: string }>>([])

const selectedDepartmentLabel = computed(() => deptOptions.value.find(d => d.id === selectedDepartment.value)?.label || '—')
const selectedRoleLabel = computed(() => roleOptions.value.find(r => r.role_id === selectedRole.value)?.label || '—')

const loadingDept = ref(false)
const loadingRole = ref(false)
const loadingStaff = ref(false)

/* Fetch departments and roles */
async function ensureDepartments() {
  if (deptOptions.value.length) return
  loadingDept.value = true
  try {
    const data = await (directoriesApi as any).departments()
    const list = Array.isArray(data) ? data : (data?.data ?? [])
    deptOptions.value = list.map((d: any) => ({id: d.id, label: d.name}))
  } finally { loadingDept.value = false }
}
async function ensureRoles() {
  if (!selectedDepartment.value) return
  loadingRole.value = true
  try {
    const data = await (directoriesApi as any).departmentRoles(selectedDepartment.value)
    const list = Array.isArray(data) ? data : (data?.data ?? [])
    roleOptions.value = list.map((r: any) => ({id: r.id, label: r.role.name, role_id: r.role_id}))
  } finally { loadingRole.value = false }
}

function onDepartmentChange() {
  selectedRole.value = null
  roleOptions.value = []
  // staff is INDEPENDENT; do not clear options
  ensureRoles()
  onStaffSearch('')   // refresh with optional dept filter
  buildEvents()
}
function onRoleChange() {
  // staff is INDEPENDENT; do not clear options
  onStaffSearch('')   // refresh with optional role filter
  buildEvents()
}

/* Staff search INDEPENDENT of dept/role */
async function onStaffSearch(q: string) {
  loadingStaff.value = true
  try {
    const {data} = await (employeesApi as any).list({
      search: q,
      department_id: selectedDepartment.value ?? null,
      role_id: selectedRole.value ?? null,
      limit: 50
    })
    const list = Array.isArray(data) ? data : (data?.data ?? [])
    staffOptions.value = (list || []).map((u: any) => ({
      id: u.id,
      label: [u.first_name, u.last_name].filter(Boolean).join(' ') || `#${u.id}`
    }))
  } catch (e) {
    console.log(e); staffOptions.value = []
  } finally { loadingStaff.value = false }
}

/* Gate: only fetch if all 3 filters selected */
const canQuery = computed(() => !!(selectedDepartment.value && selectedRole.value && selectedStaff.value))

/* Data buckets */
const loading = ref(false)
const rawList = ref<AssignmentRow[]>([])
const holidayList = ref<HolidayRow[]>([])
const publicHolidays = ref<string[]>([])

/* Public holidays for visible month */
async function fetchPublicHolidays() {
  try {
    const {data} = await (directoriesApi as any).publicHolidays({
      month: viewMonth.value + 1,
      year: viewYear.value,
    })
    const list = Array.isArray(data) ? data : (data?.data ?? [])
    publicHolidays.value = list.map((d: any) => d?.day).filter(Boolean)
  } catch { publicHolidays.value = [] }
}
const publicHolidaySet = computed(() => new Set(publicHolidays.value))
function isPublicHoliday(d: Date) { return publicHolidaySet.value.has(sameDayKey(d)) }

/* ---------- Movement helpers ---------- */
function parseTimeOrDefault(row: AssignmentRow): { h: number; m: number } {
  const str = (row.start_time || '').split(' ')[1] || '09:00:00'
  const [hh, mm] = str.split(':').slice(0, 2).map(n => Number(n))
  return {h: Number.isFinite(hh) ? hh : 9, m: Number.isFinite(mm) ? mm : 0}
}
function labelForRow(row: AssignmentRow): string {
  const fn = row.contract?.employee?.first_name?.trim()
  const ln = row.contract?.employee?.last_name?.trim()
  if (fn || ln) return [fn, ln].filter(Boolean).join(' ')
  return `#${row.employee_id}`
}
function sameDay(a: Date, b: Date) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate() }
function withinVisible(d: Date) { return d >= startOfDay(monthStart.value) && d <= endOfDay(monthEnd.value) }

/* Movement/leave window indexes */
function buildMovementIndex(list: AssignmentRow[]) {
  const idx = new Map<number, Array<{ start: Date; end: Date }>>()
  for (const r of list || []) {
    const ots = Array.isArray(r.active_overtimes) ? r.active_overtimes : []
    for (const ot of ots) {
      if (!ot.movement) continue
      const s = parseDateTime(ot.movement.start_time)
      const e = parseDateTime(ot.movement.finished_time)
      if (s && e && e > s) {
        const arr = idx.get(ot.employee_id) || []
        arr.push({ start: s, end: e })
        idx.set(ot.employee_id, arr)
      }
    }
  }
  return idx
}
function subtractMovements(baseStart: Date, baseEnd: Date, mv: Array<{ start: Date; end: Date }>) {
  let segs: Array<{ start: Date; end: Date }> = [{ start: new Date(baseStart), end: new Date(baseEnd) }]
  if (!mv.length) return segs
  for (const w of mv) {
    const next: Array<{ start: Date; end: Date }> = []
    for (const s of segs) {
      if (w.end <= s.start || w.start >= s.end) { next.push(s); continue }
      if (w.start <= s.start && w.end >= s.end) { continue }
      if (w.start <= s.start && w.end < s.end) { next.push({ start: new Date(w.end), end: s.end }); continue }
      if (w.start > s.start && w.end >= s.end) { next.push({ start: s.start, end: new Date(w.start) }); continue }
      next.push({ start: s.start, end: new Date(w.start) })
      next.push({ start: new Date(w.end), end: s.end })
    }
    segs = next
    if (!segs.length) break
  }
  return segs
}
function clampToVisible(seg: { start: Date; end: Date }, visStart: Date, visEnd: Date) {
  const s = seg.start < visStart ? new Date(visStart) : seg.start
  const e = seg.end   > visEnd   ? new Date(visEnd)   : seg.end
  if (e <= s) return null
  return { start: s, end: e }
}

/* Working days */
async function fetchAssignments() {
  loading.value = true
  try {
    const data = await (employeesApi as any).workScheduling.scheduleAssignments({
      employee_ids: selectedStaff.value ? [selectedStaff.value] : null,
      department_id: selectedDepartment.value ?? null,
      role_id: selectedRole.value ?? null
    })
    rawList.value = Array.isArray(data) ? data : (data?.data ?? [])
  } catch (e) {
    console.log(e); rawList.value = []
  } finally { loading.value = false }
}

/* Holidays (leave requests) */
async function fetchHolidays() {
  if (!canQuery.value) { holidayList.value = []; return }
  loading.value = true
  try {
    const {data} = await (leaveRequestApi as any).list({
      employee_id: selectedStaff.value!,
      department_id: selectedDepartment.value!,
      role_id: selectedRole.value!,
      limit: 500
    })
    const list = Array.isArray(data) ? data : (data?.data ?? [])
    holidayList.value = list.map((r: any) => ({
      date_from: r.date_from,
      date_to: r.date_to,
      status: r.status,
      employee: {name: r.contract.employee?.name ?? [r.contract.employee?.first_name, r.contract.employee?.last_name].filter(Boolean).join(' ') ?? ''}
    }))
  } catch { holidayList.value = [] }
  finally { loading.value = false }
}

/* Smart fetch trigger */
function triggerDataFetch() { if (mode.value === 'working') fetchAssignments(); else fetchHolidays() }

/* Build events into days (keep OT rows, trim/hide base by movements; skip base on public holidays) */
const dayEvents = ref<Record<string, Ev[]>>({})
function toDateYMD(ymd?: string | null): Date | null {
  if (!ymd) return null
  const m = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return null
  const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3])
  const dt = new Date(y, mo - 1, d, 0, 0, 0, 0)
  return isNaN(dt.getTime()) ? null : dt
}
function buildEvents() {
  const bucket: Record<string, Ev[]> = {}
  if (mode.value === 'working') {
    const visibleStart = startOfDay(monthStart.value)
    const visibleEnd   = endOfDay(monthEnd.value)
    const seenOT = new Set<string>()
    const movementIndex = buildMovementIndex(rawList.value)
    const leaveIndex    = buildLeaveIndex(rawList.value)

    const pushOvertimeWindow = (opts: {
          kind: 'busy' | 'free',
          employee_id: number,
          employment_contract_id: number,
          start: Date | null,
          end: Date | null,
          roleName?: string,
          label: string,
          row: AssignmentRow,
          movementId?: number | null
        }) => {
          const { kind, employee_id, employment_contract_id, start, end, roleName, label, row, movementId } = opts
          if (!start || !end) return
          if (end < visibleStart || start > visibleEnd) return
          const s = start < visibleStart ? new Date(visibleStart) : start
          const e = end   > visibleEnd   ? new Date(visibleEnd)   : end
          const sig = `${kind}:${employee_id}:${employment_contract_id}:${s.toISOString()}:${e.toISOString()}`
          if (seenOT.has(sig)) return
          seenOT.add(sig)
          const dayKey = sameDayKey(s)
          const ev: Ev = {
                key: `ot-${sig}`,
                dateKey: dayKey,
                start: s,
                end: e,
                employee_id,
                contract_id: employment_contract_id,
                label,
                status: 'approved',
                shift: false,
                working_hours: Math.max(0, Math.round((e.getTime() - s.getTime()) / 3600000)),
                role: row.contract?.role ?? { id: 0, name: (roleName ?? row.contract?.role?.name ?? '-') },
                fromActiveOvertime: true,
                overtimeKind: kind,
                contract: [] as any,
                movement_employee_overtime_id: movementId ?? null
              }
          ;(bucket[dayKey] ||= []).push(ev)
        }

    ;(rawList.value || []).forEach((row) => {
      const startDate = toDateYMD(row.start_date)
      if (!startDate) return
      const endDate = row.end_date ? toDateYMD(row.end_date) : null
      const status = (row.status || '').toLowerCase()
      const label = labelForRow(row)
      const rangeStart = new Date(Math.max(startOfDay(startDate).getTime(), visibleStart.getTime()))
      const rangeEnd = endDate ? endOfDay(endDate) : visibleEnd
      const mvWindows = movementIndex.get(row.employee_id) || []
      const leaveWindows = leaveIndex.get(row.employee_id) || []
      const blockWindows = [...mvWindows, ...leaveWindows]

      if (row.shift === 1 || row.shift === true) {
        const hours = Number(row.shift_hours || 0)
        const period = Number(row.shift_periodicity || 0)
        if (!hours || !period) return
        const { h, m } = parseTimeOrDefault(row)
        const anchor = new Date(startDate); anchor.setHours(h, m, 0, 0)
        let cur = new Date(anchor)
        if (cur < rangeStart) {
          const diffMs = rangeStart.getTime() - cur.getTime()
          const diffHours = Math.floor(diffMs / 3600000)
          const steps = Math.max(0, Math.floor(diffHours / period))
          cur = addHours(cur, steps * period)
          while (cur < rangeStart) cur = addHours(cur, period)
        }
        const EPS_MS = 60 * 1000
        while (cur <= rangeEnd) {
          const baseStart = new Date(cur)
          const baseEnd   = addHours(cur, hours)
          const exactCovered = (blockWindows || []).some(w =>
              Math.abs(w.start.getTime() - baseStart.getTime()) <= EPS_MS &&
              Math.abs(w.end.getTime()   - baseEnd.getTime())   <= EPS_MS
          )
          if (exactCovered) { cur = addHours(cur, period); continue }
          const segs = subtractMovements(baseStart, baseEnd, blockWindows || [])
          for (const seg of segs) {
            const clamped = clampToVisible(seg, visibleStart, visibleEnd)
            if (!clamped) continue
            if (isPublicHoliday(clamped.start)) continue
            const durHrs = (clamped.end.getTime() - clamped.start.getTime()) / 3600000
            if (durHrs <= 0) continue
            const dayKey = sameDayKey(clamped.start)
            const ev: Ev = {
                  key: `s-${row.id}-${clamped.start.toISOString()}`,
                  dateKey: dayKey,
                  start: new Date(clamped.start),
                  end: new Date(clamped.end),
                  employee_id: row.employee_id,
                  contract_id: row.employment_contract_id,
                  label,
                  status,
                  shift: true,
                  shift_hours: row.shift_hours,
                  shift_periodicity: row.shift_periodicity,
                  role: row.contract?.role ?? { id: 0, name: '-' },
                  working_hours: Math.round(durHrs),
                  contract: [] as any
                }
            ;(bucket[dayKey] ||= []).push(ev)
          }
          cur = addHours(cur, period)
        }
      } else {
        const days = Array.isArray(row.working_days) ? row.working_days : []
        if (!days.length) return
        const { h, m } = parseTimeOrDefault(row)
        let cursor = new Date(visibleStart)
        while (cursor <= visibleEnd && cursor <= rangeEnd) {
          if (cursor >= rangeStart) {
            const jsWeekday = cursor.getDay()
            const ourWeekday = (jsWeekday + 6) % 7
            const wd = days.find(d => Number(d.weekday) === ourWeekday)
            if (wd && Number(wd.working_hours) > 0) {
              const baseStart = new Date(cursor); baseStart.setHours(h, m, 0, 0)
              const baseEnd   = addHours(baseStart, Number(wd.working_hours))
              const segs = subtractMovements(baseStart, baseEnd, blockWindows)
              for (const seg of segs) {
                const clamped = clampToVisible(seg, visibleStart, visibleEnd)
                if (!clamped) continue
                if (isPublicHoliday(clamped.start)) continue
                const dayKey = sameDayKey(clamped.start)
                const durHrs = Math.max(0, Math.round((clamped.end.getTime() - clamped.start.getTime()) / 3600000))
                const ev: Ev = {
                      key: `p-${row.id}-${clamped.start.toISOString()}`,
                      dateKey: dayKey,
                      start: new Date(clamped.start),
                      end: new Date(clamped.end),
                      employee_id: row.employee_id,
                      contract_id: row.employment_contract_id,
                      label,
                      status,
                      shift: false,
                      working_hours: durHrs,
                      role: row.contract?.role ?? { id: 0, name: '-' },
                      contract: [] as any
                    }
                ;(bucket[dayKey] ||= []).push(ev)
              }
            }
          }
          cursor = addHours(cursor, 24)
        }
      }

      // OT (busy/free)
      const ots = Array.isArray(row.active_overtimes) ? row.active_overtimes : []
      for (const ot of ots) {
        const busyStart = parseDateTime(ot.start_time)
        const busyEnd   = parseDateTime(ot.finished_time)
        pushOvertimeWindow({
          kind: 'busy',
          employee_id: ot.employee_id,
          employment_contract_id: ot.employment_contract_id,
          start: busyStart,
          end: busyEnd,
          label,
          row,
          movementId: ot.movement_employee_overtime_id ?? null
        })
        if (ot.movement) {
          const freeStart = parseDateTime(ot.movement.start_time)
          const freeEnd   = parseDateTime(ot.movement.finished_time)
          pushOvertimeWindow({
            kind: 'free',
            employee_id: ot.movement.employee_id,
            employment_contract_id: ot.movement.employment_contract_id,
            start: freeStart,
            end: freeEnd,
            roleName: row.contract?.role?.name,
            label,
            row,
            movementId: ot.movement.movement_employee_overtime_id ?? null
          })
        }
      }
    })
  } else {
    const visStart = startOfDay(monthStart.value)
    const visEnd = endOfDay(monthEnd.value)
    ;(holidayList.value || []).forEach((row, idx) => {
      const from = toDateYMD(row.date_from)
      const to = row.date_to ? toDateYMD(row.date_to) : null
      if (!from) return
      const rangeStart = new Date(Math.max(startOfDay(from).getTime(), visStart.getTime()))
      const rangeEnd = to ? endOfDay(to) : visEnd
      let cur = new Date(rangeStart)
      while (cur <= rangeEnd) {
        const dayKey = sameDayKey(cur)
        const ev: Ev = {
              key: `h-${idx}-${dayKey}`,
              dateKey: dayKey,
              start: new Date(from),
              end: to ? new Date(rangeEnd) : new Date(from),
              label: row.employee?.name || '—',
              status: row.status,
              holiday: true,
              role: { id: 0, name: '-' },
              contract: [] as any
            }
        ;(bucket[dayKey] ||= []).push(ev)
        cur = addHours(cur, 24)
      }
    })
  }
  Object.keys(bucket).forEach(k => {
    bucket[k].sort((a, b) => a.start.getTime() - b.start.getTime() || String(a.label).localeCompare(String(b.label)))
  })
  dayEvents.value = bucket
}

/* Has any event */
const hasAnyEvent = computed(() => Object.values(dayEvents.value).some(arr => arr?.length))
function eventsByDay(d: Date) { return dayEvents.value[sameDayKey(d)] || [] }
function eventClass(ev: Ev) {
  if (mode.value === 'holidays') {
    if (ev.status === 'active') return 'bg-rose-50 border-rose-200 text-rose-800'
    if (ev.status === 'pending') return 'bg-yellow-50 border-yellow-200 text-yellow-800'
    return 'bg-slate-50 border-slate-200 text-slate-800'
  }
  const isArchived = (ev.status || '') === 'archived'
  if (isArchived) return 'bg-rose-50 border-rose-200 text-rose-800'
  if (ev.fromActiveOvertime) return ev.overtimeKind === 'busy' ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-sky-50 border-sky-200 text-sky-800'
  return ev.shift ? 'bg-indigo-50 border-indigo-200 text-indigo-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
}
function eventTitle(ev: Ev) {
  if (mode.value === 'holidays') {
    const base = `${ev.label}`
    return `${base} • ${dateLabel(ev.start)}${sameDay(ev.start, ev.end) ? '' : ' – ' + dateLabel(ev.end)} • ${ev.status}`
  }
  const base = `${ev.label} • ${timeLabel(ev.start)}–${timeLabel(ev.end)}`
  const tag = ev.fromActiveOvertime ? (ev.overtimeKind === 'busy' ? ' • (տեղափոխված՝ զբաղված պատուհան)' : ' • (տեղափոխված՝ ազատ պատուհան)') : ''
  if (ev.shift) return `${base} • shift ${ev.shift_hours}/${ev.shift_periodicity}${tag}`
  if (ev.working_hours != null) return `${base} • ${ev.working_hours} ժ.${tag}`
  return base + tag
}
function timeLabel(d: Date) { return d.toLocaleTimeString(undefined, {hour: '2-digit', minute: '2-digit'}) }
function dateLabel(d: Date) { return d.toLocaleDateString(undefined, {month: '2-digit', day: '2-digit'}) }

/* ---------- Holidays Day/Range picking ---------- */
const holidayModalOpen = ref(false)
const holidayRangeStart = ref<Date | null>(null)
const holidayRangeEnd = ref<Date | null>(null)
function resetHolidayRange() { holidayRangeStart.value = null; holidayRangeEnd.value = null }
function isInRange(d: Date) {
  if (!holidayRangeStart.value || !holidayRangeEnd.value) return false
  const t = +startOfDay(d)
  return t >= +startOfDay(holidayRangeStart.value) && t <= +startOfDay(holidayRangeEnd.value)
}
function isRangeEdge(d: Date) {
  const t = +startOfDay(d)
  return (holidayRangeStart.value && t === +startOfDay(holidayRangeStart.value)) ||
      (holidayRangeEnd.value && t === +startOfDay(holidayRangeEnd.value))
}
function onDayClick(d: Date) {
  if (mode.value !== 'holidays') return
  if (!selectedDepartment.value || !selectedRole.value) return
  if (holidayPickMode.value === 'day') {
    holidayRangeStart.value = startOfDay(d)
    holidayRangeEnd.value = startOfDay(d)
    openHolidayModal()
  } else {
    if (!holidayRangeStart.value) {
      holidayRangeStart.value = startOfDay(d)
      holidayRangeEnd.value = null
    } else if (!holidayRangeEnd.value) {
      const a = +startOfDay(holidayRangeStart.value)
      const b = +startOfDay(d)
      if (b >= a) {
        holidayRangeEnd.value = startOfDay(d)
      } else {
        holidayRangeEnd.value = holidayRangeStart.value
        holidayRangeStart.value = startOfDay(d)
      }
      openHolidayModal()
    } else {
      holidayRangeStart.value = startOfDay(d)
      holidayRangeEnd.value = null
    }
  }
}

/* Holiday modal state */
const modalRange = computed(() => ({ start: holidayRangeStart.value, end: holidayRangeEnd.value || holidayRangeStart.value }))
const modalStaff = ref<number | null>(null)
const modalChosen = ref<Array<{ id: number; label: string }>>([])
const submittingHolidays = ref(false)

function openHolidayModal() {
  if (!modalRange.value.start || !modalRange.value.end) return
  holidayModalOpen.value = true
  modalStaff.value = null
  modalChosen.value = []
  onStaffSearch('')
}
function closeHolidayModal() { holidayModalOpen.value = false }

function addStaffToHolidayList() {
  if (!modalStaff.value) return
  const staff = staffOptions.value.find(s => s.id === modalStaff.value)
  if (!staff) return
  const exists = modalChosen.value.some(s => s.id === staff.id)
  if (!exists) modalChosen.value.push({id: staff.id, label: staff.label})
  modalStaff.value = null
}
function removeChosen(idx: number) { modalChosen.value.splice(idx, 1) }

async function submitHolidays() {
  if (!modalRange.value.start || !modalRange.value.end || modalChosen.value.length === 0) return
  submittingHolidays.value = true
  try {
    const date_from = sameDay(modalRange.value.start, modalRange.value.end)
        ? sameDayKey(modalRange.value.start)
        : sameDayKey(modalRange.value.start)
    const date_to = sameDay(modalRange.value.start, modalRange.value.end)
        ? sameDayKey(modalRange.value.start)
        : sameDayKey(modalRange.value.end)

    const payload = modalChosen.value.map(s => ({
      employee_id: s.id,
      date_from,
      date_to,
      status: 'pending',
      department_id: selectedDepartment.value!,
      role_id: selectedRole.value!
    }))
    await (leaveRequestApi as any).createMany({requests: payload})
    if (canQuery.value && mode.value === 'holidays') await fetchHolidays()
    closeHolidayModal()
  } catch (e) { console.error(e) }
  finally { submittingHolidays.value = false }
}

/* NEW (OVERTIME) — modal state */
const overtimeModalOpen = ref(false)
const overtimeDate = ref<Date>(new Date())

/* Overtime pickers (INT IDs) */
const otDepartment = ref<number | null>(null)
const otRole = ref<number | null>(null)     // role_id
const otStaff = ref<number | null>(null)

const otRoleOptions = ref<Array<{ id:number; label:string; role_id:number }>>([])
const otStaffOptions = ref<Array<{ id:number; label:string }>>([])
const otLoadingRole = ref(false)
const otLoadingStaff = ref(false)

/* Chosen rows */
type OpenWindow = { start: string; end: string; label: string; hours: number }
type OTChosenRow = {
  id:number; label:string;
  calculated_total_hours:number; calculated_week_hours:number; working_hours:number;
  /* NEW: explain & choose time */
  calc_details: string;
  open_windows: OpenWindow[];
  selected_window_index: number; // -1 none
  window_min: string; window_max: string; // HH:MM bounds for inputs
  ot_start: string | null; ot_end: string | null; // HH:MM
}
const otChosen = ref<OTChosenRow[]>([])
const submittingOvertimes = ref(false)
function getWeekStart(d: Date) {
  const x = startOfDay(d)
  const js = x.getDay()               // Sun=0..Sat=6
  const monOffset = (js + 6) % 7      // Mon=0
  const wk = new Date(x); wk.setDate(x.getDate() - monOffset)
  return wk
}
function addDays(dt: Date, days: number) {
  const x = new Date(dt); x.setDate(x.getDate() + days); return x
}

/* ---- Busy/Open windows calculation for a single employee & day ---- */

function hhmm(d: Date) {
  const h = String(d.getHours()).padStart(2,'0')
  const m = String(d.getMinutes()).padStart(2,'0')
  return `${h}:${m}`
}
function fromHHMM(baseDay: Date, t: string): Date {
  const [h,m] = t.split(':').map(Number)
  const d = new Date(baseDay); d.setHours(h||0, m||0, 0, 0); return d
}
function roundToHalfHours(ms: number) {
  const hrs = ms/3600000
  return Math.round(hrs*2)/2
}
function mergeWindows(wins: Array<{start: Date; end: Date}>) {
  const list = wins.slice().sort((a,b) => a.start.getTime()-b.start.getTime())
  const out: Array<{start: Date; end: Date}> = []
  for (const w of list) {
    if (!out.length || w.start.getTime() > out[out.length-1].end.getTime()) out.push({start:new Date(w.start), end:new Date(w.end)})
    else out[out.length-1].end = new Date(Math.max(out[out.length-1].end.getTime(), w.end.getTime()))
  }
  return out
}
function diffWindows(a: {start: Date; end: Date}, subs: Array<{start: Date; end: Date}>) {
  return subtractMovements(a.start, a.end, subs)
}
function invertWindows(dayStart: Date, dayEnd: Date, busy: Array<{start: Date; end: Date}>) {
  const merged = mergeWindows(busy).filter(w => w.end > dayStart && w.start < dayEnd)
  let cur = new Date(dayStart)
  const free: Array<{start: Date; end: Date}> = []
  for (const w of merged) {
    if (w.start > cur) free.push({start: new Date(cur), end: new Date(Math.min(w.start.getTime(), dayEnd.getTime()))})
    cur = new Date(Math.max(cur.getTime(), w.end.getTime()))
    if (cur >= dayEnd) break
  }
  if (cur < dayEnd) free.push({start: new Date(cur), end: new Date(dayEnd)})
  return free
}

function baseWindowsForRowOnDay(row: AssignmentRow, date: Date): Array<{start: Date; end: Date}> {
  const out: Array<{start: Date; end: Date}> = []
  const dayStart = startOfDay(date), dayEnd = endOfDay(date)
  const sDate = ymdToStart(row.start_date)
  const eDate = row.end_date ? ymdToStart(row.end_date) : null
  if (sDate && dayEnd < startOfDay(sDate)) return out
  if (eDate && dayStart > endOfDay(eDate)) return out
  if (isPublicHoliday(date)) return out

  const {h,m} = parseTimeOrDefault(row)
  if (row.shift === 1 || row.shift === true) {
    const hours  = Number(row.shift_hours || 0)
    const period = Number(row.shift_periodicity || 0)
    if (!hours || !period || !sDate) return out
    const anchor = new Date(sDate); anchor.setHours(h, m, 0, 0)
    const candidate = new Date(dayStart); candidate.setHours(h, m, 0, 0)
    const diffHours = Math.round((candidate.getTime() - anchor.getTime())/3600000)
    if (diffHours >= 0 && diffHours % period === 0) {
      const start = new Date(candidate)
      const end = addHours(start, hours)
      out.push({start, end})
    }
  } else {
    const jsW = date.getDay(); const ourW = (jsW + 6) % 7
    const wd = (row.working_days || []).find(d => Number(d.weekday) === ourW)
    const workHrs = Number(wd?.working_hours || 0)
    if (workHrs > 0) {
      const start = new Date(dayStart); start.setHours(h, m, 0, 0)
      const end = addHours(start, workHrs)
      out.push({start, end})
    }
  }

  // subtract leaves covering this day
  const lrs = row.contract?.employee?.leave_requests || []
  for (const lr of lrs) {
    const s = ymdToStart(lr.date_from), e = ymdToStart(lr.date_to || lr.date_from)
    if (!s || !e) continue
    const cover = overlapHours(startOfDay(s), endOfDay(e), dayStart, dayEnd)
    if (cover > 0) return [] // fully block base for this day
  }
  return out
}
function busyOTWindowsForEmployee(rows: AssignmentRow[], employeeId: number, date: Date) {
  const dayStart = startOfDay(date), dayEnd = endOfDay(date)
  const wins: Array<{start: Date; end: Date}> = []
  for (const row of rows) {
    const ots = Array.isArray(row.active_overtimes) ? row.active_overtimes : []
    for (const ot of ots) {
      if (ot.employee_id !== employeeId) continue
      const s = parseDateTime(ot.start_time), e = parseDateTime(ot.finished_time)
      if (!s || !e || e <= s) continue
      // clamp to day
      const cs = new Date(Math.max(s.getTime(), dayStart.getTime()))
      const ce = new Date(Math.min(e.getTime(), dayEnd.getTime()))
      if (ce > cs) wins.push({start: cs, end: ce})
    }
  }
  return wins
}

function movementWindowsForEmployee(rows: AssignmentRow[], employeeId: number) {
  const wins: Array<{start: Date; end: Date}> = []
  for (const row of rows) {
    const ots = Array.isArray(row.active_overtimes) ? row.active_overtimes : []
    for (const ot of ots) {
      if (!ot.movement) continue
      // movement window subtracts from base of the original employee (ot.employee_id)
      if (ot.employee_id === employeeId) {
        const s = parseDateTime(ot.movement.start_time)
        const e = parseDateTime(ot.movement.finished_time)
        if (s && e && e > s) wins.push({start: s, end: e})
      }
    }
  }
  return wins
}

async function computeEmployeeOpenWindows(employeeId: number, departmentId: number | null, roleId: number | null, date: Date) {
  const data = await (employeesApi as any).workScheduling?.scheduleAssignments?.({
    employee_ids: [employeeId],
    department_id: departmentId ?? null,
    role_id: roleId ?? null
  })
  const rows: AssignmentRow[] = Array.isArray(data) ? data : (data?.data ?? [])
  const dayStart = startOfDay(date), dayEnd = endOfDay(date)

  // Base windows all rows for this employee
  let base: Array<{start: Date; end: Date}> = []
  for (const row of rows) {
    if (row.employee_id !== employeeId) continue
    base.push(...baseWindowsForRowOnDay(row, date))
  }

  // Subtract movements from base (trim)
  const mv = movementWindowsForEmployee(rows, employeeId)
  const trimmed: Array<{start: Date; end: Date}> = []
  for (const b of base) trimmed.push(...diffWindows(b, mv))

  // Busy OT
  const busy = busyOTWindowsForEmployee(rows, employeeId, date)

  // Busy = trimmed base ∪ busyOT
  const busyAll = mergeWindows([...trimmed, ...busy])

  // Free = day \ busy
  const open = invertWindows(dayStart, dayEnd, busyAll)

  // Also prepare details for tooltip
  const baseLbl = mergeWindows(base).map(w => `${hhmm(w.start)}–${hhmm(w.end)}`).join(', ')
  const busyLbl = mergeWindows(busy).map(w => `${hhmm(w.start)}–${hhmm(w.end)}`).join(', ')
  const details = [
    baseLbl ? `Base: ${baseLbl}` : '',
    busyLbl ? `Busy OT: ${busyLbl}` : ''
  ].filter(Boolean).join(' | ')

  return {
    openWindows: open.map(w => ({
      start: hhmm(w.start),
      end: hhmm(w.end),
      label: `${hhmm(w.start)}–${hhmm(w.end)} (${roundToHalfHours(w.end.getTime()-w.start.getTime())} ժ.)`,
      hours: roundToHalfHours(w.end.getTime()-w.start.getTime())
    })),
    calcDetails: details
  }
}

/* ---- Existing calculations reused ---- */
function calcEmployeeDayHoursFromRows(rows: AssignmentRow[], date: Date): { baseHours:number; otBusyHours:number } {
  let baseHours = 0, otBusyHours = 0
  const dayStart = startOfDay(date)
  const dayEnd   = endOfDay(date)
  const isPH = isPublicHoliday(date)

  for (const row of rows) {
    const sDate = ymdToStart(row.start_date)
    const eDate = row.end_date ? ymdToStart(row.end_date) : null
    if (sDate && dayEnd < startOfDay(sDate)) continue
    if (eDate && dayStart > endOfDay(eDate)) continue

    // base (skip on public holiday)
    if (!isPH) {
      if (row.shift === 1 || row.shift === true) {
        const hours  = Number(row.shift_hours || 0)
        const period = Number(row.shift_periodicity || 0)
        if (hours > 0 && period > 0 && sDate) {
          const { h, m } = parseTimeOrDefault(row)
          const anchor = new Date(sDate); anchor.setHours(h, m, 0, 0)
          const candidate = new Date(dayStart); candidate.setHours(h, m, 0, 0)
          if (candidate >= anchor) {
            const diffHours = Math.round((candidate.getTime() - anchor.getTime()) / 3600000)
            if (diffHours % period === 0) {
              const shiftStart = new Date(candidate)
              const shiftEnd   = addHours(shiftStart, hours)
              baseHours += overlapHours(shiftStart, shiftEnd, dayStart, dayEnd)
            }
          }
        }
      } else {
        const jsW = date.getDay()
        const ourW = (jsW + 6) % 7
        const wd = (row.working_days || []).find(d => Number(d.weekday) === ourW)
        const workHrs = Number(wd?.working_hours || 0)
        if (workHrs > 0) {
          const { h, m } = parseTimeOrDefault(row)
          const baseStart = new Date(dayStart); baseStart.setHours(h, m, 0, 0)
          const baseEnd   = addHours(baseStart, workHrs)
          baseHours += overlapHours(baseStart, baseEnd, dayStart, dayEnd)
        }
      }
    }

    // leave requests — if any overlap this day, zero out base (same rule as before)
    const lrs = row.contract?.employee?.leave_requests || []
    for (const lr of lrs) {
      const s = ymdToStart(lr.date_from)
      const e = ymdToStart(lr.date_to || lr.date_from)
      if (!s || !e) continue
      const cover = overlapHours(startOfDay(s), endOfDay(e), dayStart, dayEnd)
      if (cover > 0) { baseHours = 0; break }
    }

    // overtime (busy) for THIS employee
    const ots = Array.isArray(row.active_overtimes) ? row.active_overtimes : []
    for (const ot of ots) {
      const s = parseDateTime(ot.start_time)
      const e = parseDateTime(ot.finished_time)
      if (!s || !e || e <= s) continue
      if (ot.employee_id !== row.employee_id) continue
      otBusyHours += overlapHours(s, e, dayStart, dayEnd)
    }
  }

  return {
    baseHours: Math.max(0, Math.round(baseHours)),
    otBusyHours: Math.max(0, Math.round(otBusyHours))
  }
}
function clampWorkingHours(v:any) { const x = Number(v ?? 0); if (!Number.isFinite(x)) return 0; return Math.max(0, Math.min(12, x)) }

/* ---- Overtime UI handlers ---- */

function openOvertimeModal(d: Date) {
  overtimeDate.value = new Date(d)
  overtimeModalOpen.value = true
  otDepartment.value = selectedDepartment.value
  otRole.value = selectedRole.value
  otStaff.value = null
  otRoleOptions.value = []
  otStaffOptions.value = []
  otChosen.value = []
  if (otDepartment.value) ensureOTRoles()
  onOTStaffSearch('')
}
function closeOvertimeModal() { overtimeModalOpen.value = false }

function onOTDepartmentChange() {
  otRole.value = null
  otRoleOptions.value = []
  otStaff.value = null
  otStaffOptions.value = []
  otChosen.value = []
  if (otDepartment.value) ensureOTRoles()
}
function onOTRoleChange() {
  otStaff.value = null
  otStaffOptions.value = []
  otChosen.value = []
  onOTStaffSearch('')
}

async function ensureOTRoles() {
  if (!otDepartment.value) return
  otLoadingRole.value = true
  try {
    const data = await (directoriesApi as any).departmentRoles(otDepartment.value)
    const list = Array.isArray(data) ? data : (data?.data ?? [])
    otRoleOptions.value = list.map((r: any) => ({ id: r.id, label: r.role.name, role_id: r.role_id }))
  } finally { otLoadingRole.value = false }
}
async function onOTStaffSearch(q: string) {
  otLoadingStaff.value = true
  try {
    const { data } = await (employeesApi as any).list({
      search: q,
      department_id: otDepartment.value ?? null,
      role_id: otRole.value ?? null,
      limit: 50
    })
    const list = Array.isArray(data) ? data : (data?.data ?? [])
    otStaffOptions.value = (list || []).map((u: any) => ({
      id: u.id,
      label: [u.first_name, u.last_name].filter(Boolean).join(' ') || `#${u.id}`
    }))
  } catch { otStaffOptions.value = [] }
  finally { otLoadingStaff.value = false }
}
async function onOTStaffSelected() {
  if (!otStaff.value) return
  const staff = otStaffOptions.value.find(s => s.id === otStaff.value)
  if (!staff) return
  const existsIdx = otChosen.value.findIndex(x => x.id === staff.id)
  if (existsIdx !== -1) { const [row] = otChosen.value.splice(existsIdx, 1); otChosen.value.unshift(row); return }

  const dayCalc  = await computeEmployeeDayHours(staff.id, otDepartment.value, otRole.value, overtimeDate.value)
  const weekCalc = await computeEmployeeWeekHours(staff.id, otDepartment.value, otRole.value, overtimeDate.value)
  const windows  = await computeEmployeeOpenWindows(staff.id, otDepartment.value, otRole.value, overtimeDate.value)

  const dayTotal  = Math.max(0, Math.round((dayCalc?.baseHours ?? 0) + (dayCalc?.otBusyHours ?? 0)))
  const weekTotal = Math.max(0, Math.round((weekCalc?.baseHours ?? 0) + (weekCalc?.otBusyHours ?? 0)))

  const winIndex = windows.openWindows.length ? 0 : -1
  const win = windows.openWindows[0]

  otChosen.value.unshift({
    id: staff.id,
    label: staff.label,
    calculated_total_hours: dayTotal,
    calculated_week_hours: weekTotal,
    working_hours: clampWorkingHours(win ? win.hours : 0),
    calc_details: windows.calcDetails,
    open_windows: windows.openWindows,
    selected_window_index: winIndex,
    window_min: win ? win.start : '',
    window_max: win ? win.end : '',
    ot_start: win ? win.start : null,
    ot_end: win ? win.end : null
  })
  otStaff.value = null
}

/** Utility: overlap hours between two windows */
function overlapHours(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  const s = Math.max(aStart.getTime(), bStart.getTime())
  const e = Math.min(aEnd.getTime(), bEnd.getTime())
  const ms = Math.max(0, e - s)
  return ms / 3600000
}

/** Compute base + OT(busy) hours (dept/role optional) */
async function computeEmployeeDayHours(employeeId: number, departmentId: number | null, roleId: number | null, date: Date) {
  try {
    const data = await (employeesApi as any).workScheduling?.scheduleAssignments?.({
      employee_ids: [employeeId],
      department_id: departmentId ?? null,
      role_id: roleId ?? null
    })
    const rows: AssignmentRow[] = Array.isArray(data) ? data : (data?.data ?? [])
    return calcEmployeeDayHoursFromRows(rows, date)
  } catch (e) {
    console.error('computeEmployeeDayHours error', e)
    return { baseHours: 0, otBusyHours: 0 }
  }
}

async function computeEmployeeWeekHours(employeeId: number, departmentId: number | null, roleId: number | null, weekOf: Date) {
  try {
    const data = await (employeesApi as any).workScheduling?.scheduleAssignments?.({
      employee_ids: [employeeId],
      department_id: departmentId ?? null,
      role_id: roleId ?? null
    })
    const rows: AssignmentRow[] = Array.isArray(data) ? data : (data?.data ?? [])
    const weekStart = getWeekStart(weekOf)
    let base = 0, ot = 0
    for (let i = 0; i < 7; i++) {
      const d = addDays(weekStart, i)
      const { baseHours, otBusyHours } = calcEmployeeDayHoursFromRows(rows, d)
      base += baseHours
      ot   += otBusyHours
    }
    return {
      baseHours: Math.max(0, Math.round(base)),
      otBusyHours: Math.max(0, Math.round(ot)),
    }
  } catch (e) {
    console.error('computeEmployeeWeekHours error', e)
    return { baseHours: 0, otBusyHours: 0 }
  }
}

function onPickWindow(row: OTChosenRow) {
  const i = row.selected_window_index
  if (i == null || i < 0 || i >= row.open_windows.length) {
    row.window_min = ''
    row.window_max = ''
    row.ot_start = null
    row.ot_end = null
    row.working_hours = 0
    return
  }
  const w = row.open_windows[i]
  row.window_min = w.start
  row.window_max = w.end
  // if start not set, use window bounds
  row.ot_start = row.ot_start ?? w.start
  // ensure start/end inside bounds
  if (row.ot_start < w.start) row.ot_start = w.start
  if (row.ot_end == null || row.ot_end > w.end || row.ot_end <= row.ot_start) row.ot_end = w.end
  // sync hours
  syncFromTimes(row)
}

function onWorkingHoursEdited(row: OTChosenRow) {
  row.working_hours = clampWorkingHours(row.working_hours)
  // If a window is selected, adjust end time accordingly (keep start)
  if (row.selected_window_index >= 0 && row.ot_start) {
    const w = row.open_windows[row.selected_window_index]
    const baseDay = overtimeDate.value
    const start = fromHHMM(baseDay, row.ot_start)
    const maxEnd = fromHHMM(baseDay, w.end)
    const newEnd = new Date(start); newEnd.setMinutes(newEnd.getMinutes() + row.working_hours*60)
    if (newEnd > maxEnd) {
      row.ot_end = w.end
      // clamp hours to actual
      const ms = fromHHMM(baseDay, row.ot_end).getTime() - start.getTime()
      row.working_hours = clampWorkingHours(roundToHalfHours(ms*1.0))
    } else {
      row.ot_end = hhmm(newEnd)
    }
  }
}

function syncFromTimes(row: OTChosenRow) {
  if (row.selected_window_index < 0 || !row.ot_start || !row.ot_end) return
  const w = row.open_windows[row.selected_window_index]
  // clamp inside window
  if (row.ot_start < w.start) row.ot_start = w.start
  if (row.ot_end > w.end) row.ot_end = w.end
  if (row.ot_end <= row.ot_start) row.ot_end = w.end
  const baseDay = overtimeDate.value
  const s = fromHHMM(baseDay, row.ot_start)
  const e = fromHHMM(baseDay, row.ot_end)
  const diff = e.getTime() - s.getTime()
  row.working_hours = clampWorkingHours(roundToHalfHours(diff))
}

function removeOTChosen(idx:number) { otChosen.value.splice(idx, 1) }
async function submitOvertimes() {
  if (!otChosen.value.length) return
  submittingOvertimes.value = true
  try {
    const ymd = sameDayKey(overtimeDate.value)

    // helpers local to this submit:
    const toHHMMSS = (t: any) => {
      const s = String(t ?? '').trim()
      if (!s) return '00:00:00'
      const [hRaw = '0', mRaw = '0', sRaw = '0'] = s.split(':')
      const hh = String(Number(hRaw) || 0).padStart(2, '0')
      const mm = String(Number(mRaw) || 0).padStart(2, '0')
      const ss = String(Number(sRaw) || 0).padStart(2, '0')
      return `${hh}:${mm}:${ss}`
    }
    const fmtYMDHMS = (dt: Date) => {
      const y = dt.getFullYear()
      const m = String(dt.getMonth() + 1).padStart(2, '0')
      const d = String(dt.getDate()).padStart(2, '0')
      const hh = String(dt.getHours()).padStart(2, '0')
      const mm = String(dt.getMinutes()).padStart(2, '0')
      const ss = String(dt.getSeconds()).padStart(2, '0')
      return `${y}-${m}-${d} ${hh}:${mm}:${ss}`
    }

    const items = otChosen.value.map(r => {
      // expect r.ot_start / r.ot_end from the UI; fallback to 09:00 + working_hours if end missing
      const startStr = (r as any).ot_start || '09:00:00'
      const endStr   = (r as any).ot_end || null

      const startHms = toHHMMSS(startStr)
      let finishedHms = endStr ? toHHMMSS(endStr) : null

      // If finished_time is not provided, derive by adding working_hours to start_time
      if (!finishedHms) {
        const [Y, M, D] = ymd.split('-').map(Number)
        const [sh, sm, ss] = startHms.split(':').map(Number)
        const startDT = new Date(Y, (M || 1) - 1, D || 1, sh || 0, sm || 0, ss || 0, 0)
        const endDT = addHours(startDT, clampWorkingHours(r.working_hours))
        finishedHms = fmtYMDHMS(endDT).split(' ')[1] // keep only HH:mm:ss part
      }

      return {
        employee_id: r.id,
        start_time: `${startHms}`,
        finished_time: `${finishedHms}`,
        working_hours: clampWorkingHours(r.working_hours),
      }
    })

    const payload = { day: ymd, employees: items }

    const api = (employeesApi as any)?.overtimes?.createMany
    if (typeof api === 'function') {
      await api(payload)
    } else {
      console.warn('Missing employeesApi.overtimes.createMany. Payload:', payload)
    }

    await fetchAssignments()
    buildEvents()
    closeOvertimeModal()
  } finally {
    submittingOvertimes.value = false
  }
}


/* Effects */
watch([monthStart, monthEnd], async () => { await fetchPublicHolidays(); buildEvents() })
watch([viewYear, viewMonth], () => { buildEvents() })
watch([rawList, holidayList], () => buildEvents(), {deep: true})
watch([selectedDepartment, selectedRole, selectedStaff], () => { triggerDataFetch() })

onMounted(async () => {
  await ensureDepartments()
  await onStaffSearch('') // load staff independently on first load
  buildEvents()
  await fetchPublicHolidays()
})
</script>

<style scoped>
:deep(.vsc-wrapper) {
  --vsc-border-color: rgb(209 213 219);
  border-radius: 0.75rem;
}
</style>
