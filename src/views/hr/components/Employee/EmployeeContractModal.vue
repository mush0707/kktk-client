<!-- src/views/hr/modals/HireEmployeeModal.vue -->
<template>
  <div class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/40" @click="$emit('close')"></div>

    <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-6xl bg-white rounded-2xl shadow-xl">
      <!-- Header -->
      <div class="flex items-center justify-between px-5 py-4 border-b">
        <h3 class="text-lg font-semibold">{{ $t('employment_contract') }}</h3>
        <button class="p-2 rounded-lg hover:bg-gray-100" @click="$emit('close')" aria-label="Close">✕</button>
      </div>

      <div class="px-4 py-2">
        <div class="p-2 bg-indigo-50 text-sm rounded-lg space-y-1">
          <p><span class="text-gray-500">Աշխատակից</span>՝ {{ props.employee?.user?.name }}</p>
          <p><span class="text-gray-500">Բաժին</span>՝ {{ currentDepartmentName }}</p>
          <p><span class="text-gray-500">Հաստիք</span>՝ {{ currentRoleName }}</p>
        </div>
      </div>

      <!-- Stepper -->
      <div class="px-5 pt-4">
        <ol class="flex items-center gap-3 text-xs text-slate-600">
          <li v-for="(s, i) in steps" :key="s.key" class="flex items-center gap-2">
    <span
        class="w-6 h-6 inline-flex items-center justify-center rounded-full border"
        :class="[
        (isCivil && (i === 1 || i === 2)) ? 'border-gray-200 text-gray-300' :
        (currentStep > i ? 'bg-emerald-600 text-white border-emerald-600'
         : (currentStep === i ? 'border-emerald-600 text-emerald-700' : 'border-gray-300'))
      ]"
        :title="isCivil && (i === 1 || i === 2) ? 'Քաղաքացիաիրավական պայմանագրի դեպքում այս քայլը չի լրացվում' : ''"
    >{{ i + 1 }}</span>
            <span
                :class="[
        (isCivil && (i === 1 || i === 2)) ? 'text-gray-300' : '',
        currentStep === i && !(isCivil && (i === 1 || i === 2)) ? 'font-medium' : ''
      ]"
            >
      {{ s.label }}
    </span>
          </li>
        </ol>
      </div>

      <!-- Body -->
      <div class="p-5 space-y-6 text-sm max-h-[75vh] overflow-y-auto">

        <!-- STEP 1: Contract + Dept/Role (base_rate moved to STEP 2) -->
        <section v-show="currentStep === 0" class="grid md:grid-cols-2 gap-4">
          <!-- Department -->
          <div class="flex flex-col gap-2 md:col-span-1">
            <label class="text-sm text-gray-600">
              {{ $t('department') }} <span class="text-red-600">*</span>
            </label>
            <select
                v-model="selectedDepartmentId"
                class="w-full px-3 py-2 rounded-xl border border-gray-300"
                :disabled="!canEditDeptRole || currentStep !== 0"
            >
              <option :value="null" disabled>{{ $t('select') }}</option>
              <option v-for="d in departments" :key="d.id" :value="d.id">{{ d.name }}</option>
            </select>
            <p v-if="showRequired && !selectedDepartmentId" class="text-xs text-red-600">
              {{ $t('field_required') || 'Պարտադիր դաշտ' }}
            </p>
            <p v-if="!canEditDeptRole" class="text-xs text-slate-500">
              {{ $t('not_editable_here') || 'Դաշտը չի փոփոխվում այս փուլում' }}
            </p>
          </div>

          <!-- Role -->
          <div class="flex flex-col gap-2 md:col-span-1">
            <label class="text-sm text-gray-600">
              {{ $t('roles') }} <span class="text-red-600">*</span>
            </label>
            <select
                v-model="selectedRoleId"
                class="w-full px-3 py-2 rounded-xl border border-gray-300"
                :disabled="!canEditDeptRole || currentStep !== 0 || !selectedDepartmentId || loadingRoles"
            >
              <option :value="null" disabled>
                {{ loadingRoles ? ($t('loading') || 'Բեռնվում է…') : ($t('select') || 'Ընտրել') }}
              </option>
              <option v-for="r in roles" :key="r.id" :value="r.id">
                {{ r.role?.name || r.name }}
              </option>
            </select>
            <p v-if="showRequired && !selectedRoleId" class="text-xs text-red-600">
              {{ $t('field_required') || 'Պարտադիր դաշտ' }}
            </p>
            <p v-if="capacityError" class="text-xs text-red-600">
              {{ capacityError }}
            </p>
          </div>

          <!-- Dates -->
          <div class="flex flex-col gap-2">
            <label class="text-sm text-gray-600">
              {{ $t('start_date') || 'Սկիզբ' }} <span class="text-red-600">*</span>
            </label>
            <VueDatePicker
                v-model="form.contract.start_date"
                :enable-time-picker="false"
                :clearable="true"
                :format="displayDate"
                model-type="yyyy-MM-dd"
                :teleport="true"
                :auto-apply="true"
                :max-date="form.contract.end_date || undefined"
                :input-class-name="'w-full px-3 py-2 rounded-xl border border-gray-300'"
            />
            <p v-if="showRequired && !form.contract.start_date" class="text-xs text-red-600">
              {{ $t('field_required') || 'Պարտադիր դաշտ' }}
            </p>
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-sm text-gray-600">{{ $t('end_date') || 'Ավարտ' }}</label>
            <VueDatePicker
                v-model="form.contract.end_date"
                :enable-time-picker="false"
                :clearable="true"
                :format="displayDate"
                model-type="yyyy-MM-dd"
                :teleport="true"
                :auto-apply="true"
                :min-date="form.contract.start_date || undefined"
                :input-class-name="'w-full px-3 py-2 rounded-xl border border-gray-300'"
            />
            <p v-if="dateError" class="text-xs text-red-600">{{ dateError }}</p>
          </div>
          <div class="md:col-span-2 mt-2">
            <label class="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" v-model="form.contract.civil_contract" />
              <span>Քաղաքացիաիրավական պայմանագիր</span>
            </label>
          </div>
        </section>

        <!-- STEP 2: Work Schedule + Rate According (gross/daily/hourly) -->
        <section v-show="currentStep === 1 && !isCivil" class="space-y-4">
          <div class="font-medium">{{ $t('work_schedule') || 'Աշխատաժամերի գրաֆիկ' }}</div>

          <!-- Rate According segmented control + Base Rate -->
          <div class="flex flex-col gap-4">
            <!-- Segmented radio -->
            <div class="flex">
              <div class="flex flex-col gap-2">
                <label class="text-sm text-gray-600">Դրույքը ըստ</label>
                <div class="relative inline-flex rounded-xl border border-gray-300 bg-white overflow-hidden">
                  <button
                      type="button"
                      class="px-3 py-2 text-sm"
                      :class="form.schedule.rate_according==='gross' ? 'bg-slate-800 text-white' : 'hover:bg-slate-50'"
                      @click="form.schedule.rate_according='gross'"
                  >Գրոս</button>
                  <button
                      type="button"
                      class="px-3 py-2 text-sm border-l"
                      :class="form.schedule.rate_according==='daily' ? 'bg-slate-800 text-white' : 'hover:bg-slate-50'"
                      @click="form.schedule.rate_according='daily'"
                  >Օրավարձ</button>
                  <button
                      type="button"
                      class="px-3 py-2 text-sm border-l"
                      :class="form.schedule.rate_according==='hourly' ? 'bg-slate-800 text-white' : 'hover:bg-slate-50'"
                      @click="form.schedule.rate_according='hourly'"
                  >Ժամավարձ</button>
                </div>
              </div>
            </div>
            <!-- When rate_according === 'gross': choose 5/6 day week -->
            <div v-if="form.schedule.rate_according==='gross'" class="flex items-end gap-4">
              <div class="flex gap-2 items-center">
                <select
                    v-model="form.schedule.grossWeekType"
                    class="px-3 py-2 rounded-xl border border-gray-300 text-sm"
                >
                  <option value="5">5 օրյա</option>
                  <option value="6">6 օրյա</option>
                </select>
              </div>
            </div>
            <!-- Base rate + Currency (moved here) -->
            <div class="grid grid-cols-3 gap-2">
              <div class="col-span-2 flex flex-col gap-2">
                <label class="text-sm text-gray-600">
                  {{ rateLabel }} <span class="text-red-600">*</span>
                </label>
                <input
                    v-model.number="form.contract.base_rate"
                    type="number"
                    step="0.01"
                    class="w-full px-3 py-2 rounded-xl text-sm border border-gray-300"
                />
                <p v-if="showRequired && !form.contract.base_rate" class="text-xs text-red-600">
                  {{ $t('field_required') || 'Պարտադիր դաշտ' }}
                </p>
                <span v-if="form.contract.base_rate && form.schedule.rate_according==='gross'" class="text-sm text-gray-600">
                  {{ $t('net_salary') || 'Մաքուր' }} — <strong>{{ netSalary.toLocaleString() }} {{ form.contract.currency }}</strong>
                </span>
              </div>
              <div class="col-span-1 flex flex-col gap-y-2">
                <label class="text-sm text-gray-600">{{ $t('currency') || 'Արժույթ' }}</label>
                <select disabled v-model="form.contract.currency" class="w-full px-3 py-2 rounded-xl border border-gray-300">
                  <option value="AMD">AMD</option>
                </select>
              </div>
            </div>
          </div>

          <div class="grid md:grid-cols-2 gap-4">
            <!-- Shift -->
            <div v-if="form.schedule.shift" class="col-span-2">
              <div class="space-y-2">
                <div class="grid grid-cols-2 gap-3">
                  <div class="flex flex-col gap-y-2">
                    <label class="text-sm text-gray-600">Հերթափոխի ժամեր <span class="text-red-600">*</span></label>
                    <input
                        disabled
                        type="number" min="2" max="24" step="2"
                        v-model.number="form.schedule.shift_hours"
                        class="w-full px-3 py-2 rounded-xl border border-gray-300"
                        placeholder="օր.՝ 6"
                    />
                    <p v-if="shiftHoursError" class="text-xs text-red-600">{{ shiftHoursError }}</p>
                  </div>
                  <div class="flex flex-col gap-y-2">
                    <label class="text-sm text-gray-600">Պարբերականություն <span class="text-red-600">*</span></label>
                    <input
                        disabled
                        type="number" min="6" :max="6*24" step="2"
                        v-model.number="form.schedule.shift_periodicity"
                        class="w-full px-3 py-2 rounded-xl border border-gray-300"
                        placeholder="օր.՝ 48"
                    />
                    <p v-if="shiftPeriodError" class="text-xs text-red-600">{{ shiftPeriodError }}</p>
                  </div>
                </div>
                <p class="text-[11px] text-gray-500">
                  հերթափոխի ժամեր՝ {{ form.schedule.shift_hours }}ժ․ • Պարբերականություն՝ {{ form.schedule.shift_periodicity }}ժ․
                </p>
                <ShiftCalendar
                    :mode="calendarMode"
                    :existing="peerSchedules"
                    :self-employee-id="props.employee?.id"
                    :start-date="form.contract.start_date"
                    :end-date="form.contract.end_date || ''"
                    :shift-hours="Number(form.schedule.shift_hours || 0)"
                    :shift-periodicity="Number(form.schedule.shift_periodicity || 0)"
                    @built="onCalendarBuilt"
                    @save="onCalendarSave"
                />
                <p v-if="calendarBuildError" class="text-xs text-red-600">{{ calendarBuildError }}</p>
              </div>
            </div>

            <!-- Pattern (non-shift) -->
            <div v-if="!form.schedule.shift" class="md:col-span-2">
              <div class="grid sm:grid-cols-2 gap-3 mb-3">
                <div class="flex flex-col gap-1">
                  <label class="text-sm text-gray-600">Մեկնարկի օր</label>
                  <VueDatePicker
                      v-model="form.schedule.patternStartDate"
                      :enable-time-picker="false"
                      :clearable="true"
                      :format="displayDate"
                      model-type="yyyy-MM-dd"
                      :teleport="true"
                      :auto-apply="true"
                      :min-date="form.contract.start_date || undefined"
                      :input-class-name="'w-full px-3 py-2 rounded-xl border border-gray-300'"
                  />
                  <p v-if="patternStartError" class="text-xs text-red-600">{{ patternStartError }}</p>
                </div>



                <!-- When rate_according === 'daily': global hours+time for selected days -->
                <div v-if="form.schedule.rate_according==='daily'" class="sm:col-span-2 grid grid-cols-2 gap-3">
                  <div class="flex flex-col gap-1">
                    <label class="text-sm text-gray-600">Օրվա աշխատաժամ</label>
                    <input
                        type="number" min="0" step="0.5"
                        v-model.number="form.schedule.globalDailyHours"
                        class="w-full border rounded-xl px-3 py-2"
                        placeholder="օր.՝ 8"
                    />
                  </div>
                  <div class="flex flex-col gap-1">
                    <label class="text-sm text-gray-600">Մեկնարկային ժամ</label>
                    <input
                        type="time"
                        v-model="form.schedule.globalDailyStartTime"
                        class="w-full border rounded-xl px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>

              <!-- Weekday chips:
                   show for 'daily' and 'hourly'; hide for 'gross' -->
              <div v-if="form.schedule.rate_according!=='gross'" class="mb-3">
                <div class="text-sm text-gray-600 mb-2">Ընտրեք օրերը</div>
                <div class="flex flex-wrap gap-2">
                  <button
                      v-for="opt in DOW_OPTS"
                      :key="opt.id"
                      type="button"
                      class="px-3 py-1.5 rounded-full border text-sm transition"
                      :class="form.schedule.daysSelected.includes(opt.id)
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                      : 'bg-white border-gray-300 hover:bg-gray-50'"
                      @click="toggleWeekday(opt.id)"
                  >
                    {{ opt.label }}
                  </button>
                </div>
              </div>

              <!-- Per-weekday hours/time for 'hourly' only -->
              <div v-if="form.schedule.rate_according==='hourly'" class="grid sm:grid-cols-2 gap-3">
                <div
                    v-for="d in form.schedule.daysSelected"
                    :key="'h-'+d"
                    class="flex items-center gap-3 p-3 rounded-xl border border-gray-300 bg-white"
                >
                  <span class="text-sm w-12 text-slate-600">{{ DOW_OPTS_MAP[d]?.label }}</span>

                  <div class="flex-1 grid grid-cols-2 gap-2 items-center">
                    <div class="flex items-center gap-2">
                      <input
                          type="number"
                          min="0"
                          step="0.5"
                          v-model.number="(form.schedule.hoursMap as any)[d]"
                          class="w-full border rounded-xl px-3 py-2"
                          :placeholder="'օր.՝ 8'"
                      />
                      <span class="text-xs text-slate-500">ժամ</span>
                    </div>

                    <div class="flex items-center gap-2">
                      <input
                          type="time"
                          v-model="(form.schedule.timeMap as any)[d]"
                          class="w-full border rounded-xl px-3 py-2 text-sm"
                      />
                      <span class="text-xs text-slate-500">սկիզբ</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="mt-2 text-xs" :class="weeklyHours > 48 ? 'text-red-600' : 'text-slate-600'">
                Շաբաթվա ընդհանուր ժամեր՝ <b>{{ weeklyHours }}</b> (առավելագույնը՝ 48)
              </div>
              <p v-if="patternError" class="text-xs text-red-600 mt-1">{{ patternError }}</p>
            </div>
          </div>
        </section>

        <!-- STEP 3: Leave types -->
        <section v-show="currentStep === 2  && !isCivil" class="space-y-3">
          <div class="flex items-center justify-between">
            <div class="font-medium">Արձակուրդներ</div>
            <div class="text-xs text-slate-500" v-if="selectedLeaveTypeIds.length">
              {{ selectedLeaveTypeIds.length }} {{ $t('selected') || 'ընտրված' }}
            </div>
          </div>

          <div class="border rounded-xl p-4 bg-gray-50 space-y-3">
            <div v-if="selectedLeaveTypeIds.length" class="flex flex-wrap gap-2">
              <button
                  v-for="lt in selectedLeaveTypeIds.map(id => leaveTypesMap[id]).filter(Boolean)"
                  :key="lt.id"
                  type="button"
                  class="flex items-center gap-1 px-2 py-1 rounded-full bg-white border text-xs hover:bg-gray-50"
                  @click="toggleLeaveType(lt.id)"
              >
                <span>{{ lt.name }}</span><span class="text-slate-400">✕</span>
              </button>
            </div>

            <div class="flex flex-col md:flex-row gap-2">
              <input
                  v-model.trim="leaveSearch"
                  class="w-full px-3 py-2 rounded-xl border border-gray-300"
                  :placeholder="$t('search_placeholder') || 'Որոնել տեսակով…'"
              />
              <div class="flex gap-2">
                <button type="button" class="px-3 py-2 rounded-xl border border-gray-300 hover:bg-gray-50" @click="clearAll">
                  Մաքրել
                </button>
              </div>
            </div>

            <div class="max-h-56 overflow-auto rounded-lg border bg-white">
              <div v-if="!filteredLeaveTypes.length" class="p-3 text-sm text-slate-500">
                {{ $t('nothing_found') || 'Ցուցակը դատարկ է' }}
              </div>
              <label
                  v-for="lt in filteredLeaveTypes"
                  :key="lt.id"
                  class="flex items-center gap-2 px-3 py-2 border-b last:border-b-0 hover:bg-gray-50"
              >
                <input
                    type="checkbox"
                    class="rounded"
                    :value="lt.id"
                    :checked="selectedLeaveTypeIds.includes(lt.id)"
                    @change="toggleLeaveType(lt.id)"
                />
                <span class="text-sm">
                  {{ lt.name }}
                  <span class="text-gray-500">({{ $t(lt.mode) }})</span>
                  <span class="text-gray-500" v-if="lt.days">({{ lt.days }} օր)</span>
                </span>
              </label>
            </div>

            <p v-if="showRequired && leaveTypesRequired && !selectedLeaveTypeIds.length" class="text-xs text-red-600">
              {{ $t('field_required') || 'Պարտադիր է' }}
            </p>
          </div>
        </section>

        <!-- STEP 4: Documents -->
        <section v-show="currentStep === 3 && docTypes.length" class="space-y-4">
          <div class="font-medium">{{ $t('documents') || 'Փաստաթղթեր' }}</div>
          <div v-for="t in docTypes" :key="t.id" class="border border-gray-300 rounded-xl p-4">
            <div class="mb-2 flex items-center gap-2">
              <span class="font-medium">{{ t.name }}</span>
              <span v-if="t.required" class="text-red-600 text-xs">★ {{ $t('required') || 'պարտադիր' }}</span>
            </div>
            <input type="file" :accept="fileAccept" multiple @change="e => onFilesByType(t.id, e)" class="w-full px-3 py-2 rounded-xl border border-gray-500" />
            <p v-if="showRequired && t.required && !(uploads[t.id]?.length)" class="text-xs text-red-600 mt-1">
              {{ $t('field_required') || 'Պարտադիր է' }}
            </p>
          </div>
        </section>

        <!-- Nav buttons -->
        <div class="ml-auto flex items-center gap-2">
          <button v-if="currentStep > 0"
                  class="px-3 py-2 rounded-xl border hover:bg-gray-50"
                  :disabled="saving"
                  @click="prevStep">
            <- Հետ
          </button>

          <button v-if="currentStep < steps.length - 1"
                  class="px-3 py-2 rounded-xl border bg-blue-600 text-white hover:bg-blue-700"
                  :disabled="saving"
                  @click="nextStep">
            Հաջորդ ->
          </button>

          <button v-else
                  class="px-3 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                  :disabled="saving || !canSubmit"
                  @click="submit">
            <span v-if="saving">Պահպանում…</span>
            <span v-else>Ընդունել աշխատանքի</span>
          </button>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-4 border-t flex items-center justify-between gap-2">
        <button class="px-3 py-2 rounded-xl border border-gray-300 hover:bg-gray-50" @click="$emit('close')" :disabled="saving">
          {{ $t('cancel') || 'Չեղարկել' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import VueDatePicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import { contractsApi, employeesApi, leaveTypeApi, payrollSettingApi, directoriesApi } from '@/api.ts'
import ShiftCalendar from '@/views/hr/components/Employee/ShiftCalendar.vue'

const DEFAULT_DAY_START = '09:00'

const props = defineProps<{ employee: any }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'saved', payload?: any): void }>()
const isCivil = computed(() => !!form.contract.civil_contract)
/* Steps */
const steps = [
  { key: 'contract', label: 'Պայմանագիր' },
  { key: 'schedule', label: 'Գրաֆիկ' },
  { key: 'leave',    label: 'Արձակուրդներ' },
  { key: 'docs',     label: 'Փաստաթղթեր' }
]
const currentStep = ref(0)
const showRequired = ref(false)
const saving = ref(false)
function nextStep() {
  showRequired.value = true
  if (!canProceed(currentStep.value)) return

  if (currentStep.value === 0 && isCivil.value) {
    // Skip 2 & 3 → go straight to Docs (index 3)
    currentStep.value = 3
    return
  }
  // Defensive: if somehow sitting on 1 or 2 while civil, jump to 3
  if (isCivil.value && (currentStep.value === 1 || currentStep.value === 2)) {
    currentStep.value = 3
    return
  }

  currentStep.value += 1
  if (currentStep.value === 1) loadPeerSchedules(true)
}

function prevStep() {
  // If on Docs (3) and civil, go back to 0
  if (isCivil.value && currentStep.value === 3) {
    currentStep.value = 0
    return
  }
  currentStep.value = Math.max(0, currentStep.value - 1)
}


/* Form */
const form = reactive({
  contract: {
    start_date: '' as string,
    end_date: '' as string | '',
    work_time_type: 'full',
    base_rate: null as number | null,         // moved UI to Step 2
    currency: 'AMD',
    status: 'active',
    civil_contract: false as boolean
  },
  schedule: {
    name: '' as string,
    shift: false as boolean,
    shift_hours: null as number | null,
    shift_periodicity: null as number | null,
    patternStartDate: '' as string,

    // Rate According
    rate_according: 'gross' as 'gross' | 'daily' | 'hourly',

    // Day selection + per-day controls (used in hourly mode)
    daysSelected: [0, 1, 2, 3, 4] as number[],
    hoursMap: { 0: 8, 1: 8, 2: 8, 3: 8, 4: 8, 5: 0, 6: 0 } as Record<number, number>,
    timeMap:  { 0: DEFAULT_DAY_START, 1: DEFAULT_DAY_START, 2: DEFAULT_DAY_START, 3: DEFAULT_DAY_START, 4: DEFAULT_DAY_START, 5: DEFAULT_DAY_START, 6: DEFAULT_DAY_START } as Record<number, string>,

    // Gross mode
    grossWeekType: '5' as '5' | '6',

    // Daily mode
    globalDailyHours: 8 as number,
    globalDailyStartTime: DEFAULT_DAY_START as string,
  }
})
watch(() => form.contract.civil_contract, (v) => {
  if (v && (currentStep.value === 1 || currentStep.value === 2)) {
    currentStep.value = 3
  }
})
/* Dept/Role */
const departments = ref<Array<{ id: number; name: string }>>([])
const roles = ref<Array<any>>([])
const loadingRoles = ref(false)

const initialDepartmentId = computed<number | null>(() =>
    props.employee?.candidate?.application?.department?.id ??
    props.employee?.department_id ??
    props.employee?.department?.id ?? null
)
const initialRoleId = computed<number | null>(() =>
    props.employee?.candidate?.application?.vacancy?.role_id ??
    props.employee?.candidate?.application?.vacancy?.role?.id ??
    props.employee?.user?.roles?.[0]?.id ??
    props.employee?.role_id ?? null
)

const selectedDepartmentId = ref<number | null>(null)
const selectedRoleId = ref<number | null>(null)
const canEditDeptRole = computed(() => !!props.employee?.active_contract)

const currentDepartmentName = computed(() => {
  const d = departments.value.find(x => x.id === selectedDepartmentId.value)
  return d?.name || props.employee?.candidate?.application?.department?.name || '-'
})
const currentRoleName = computed(() => {
  const r = roles.value.find((x:any) => x.id === selectedRoleId.value)
  return (r?.role?.name || r?.name) ?? props.employee?.user?.roles?.[0]?.name ?? '-'
})

/* Role capacity validation */
const capacityError = ref<string>('')
function checkRoleCapacity() {
  capacityError.value = ''
  const origRoleId = initialRoleId.value
  const selId = selectedRoleId.value
  if (!selId) return
  const sel = roles.value.find(r => r.id === selId)
  const isChanged = !!origRoleId && (sel?.role_id ?? sel?.id) !== origRoleId
  if (isChanged) {
    const posCount = Number(sel?.position_count ?? 0)
    const filled = Number(sel?.filled_count ?? 0)
    const remaining = posCount - filled
    if (!(remaining > 1)) {
      capacityError.value = 'Ընտրված հաստիքում ազատ տեղեր չկան (պետք է լինի > 1)'
    }
  }
}

/* Uploads */
const fileAccept = '.pdf,image/*'
const docTypes = ref<Array<{ id: number; name: string; required: boolean }>>([])
const uploads = ref<Record<number, File[]>>({})
function onFilesByType(typeId: number, e: Event) {
  const files = Array.from((e.target as HTMLInputElement).files || [])
  uploads.value = { ...uploads.value, [typeId]: files }
}

/* Helpers */
function displayDate(d: Date) {
  if (!d) return ''
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
function toYMD(d: string) { return d ? new Date(d + 'T00:00:00') : null }
function isValidTime(t?: string) { return !!t && /^\d{2}:\d{2}$/.test(t) }

/* Computed labels */
const rateLabel = computed(() => {
  switch (form.schedule.rate_according) {
    case 'gross':  return 'Գրոս աշխատավարձ';
    case 'daily':  return 'Օրավարձ';
    case 'hourly': return 'Ժամավարձ';
  }
})

/* Validation */
const dateError = computed(() => {
  if (!form.contract.start_date || !form.contract.end_date) return ''
  return (form.contract.end_date < form.contract.start_date) ? 'Ավարտը պետք է լինի Սկզբից հետո' : ''
})

const patternStartError = computed(() => {
  if (form.schedule.shift) return ''
  const c = toYMD(form.contract.start_date || '')
  const s = toYMD(form.schedule.patternStartDate || '')
  if (!s) return 'Նշեք մեկնարկային օրը'
  if (c && s < c) return 'Մեկնարկային օրը չի կարող լինել պայմանագրի սկզբից առաջ'
  return ''
})

/* Weekly hours calc (non-shift) */
const weeklyHours = computed(() => {
  if (form.schedule.shift) return 0
  if (form.schedule.rate_according === 'gross') {
    const days = form.schedule.grossWeekType === '6' ? 6 : 5
    return days * 8
  }
  if (form.schedule.rate_according === 'daily') {
    const n = (form.schedule.daysSelected || []).length
    const h = Number(form.schedule.globalDailyHours || 0)
    return n * h
  }
  // hourly
  return (form.schedule.daysSelected || []).reduce((sum, d) => {
    const h = Number((form.schedule.hoursMap as any)[d] || 0)
    return sum + (Number.isFinite(h) ? h : 0)
  }, 0)
})

const patternError = computed(() => {
  if (form.schedule.shift) return ''
  if (form.schedule.rate_according === 'gross') {
    return (weeklyHours.value > 48) ? 'Շաբաթական ժամերը չեն կարող գերազանցել 48 ժամը' : ''
  }
  if (form.schedule.rate_according === 'daily') {
    if (!form.schedule.daysSelected.length) return 'Ընտրեք գոնե մեկ օրվա'
    const hours = Number(form.schedule.globalDailyHours || 0)
    if (!(hours > 0)) return 'Նշեք օրվա աշխատաժամը'
    if (!isValidTime(form.schedule.globalDailyStartTime)) return 'Նշեք մեկնարկային ժամը (օր.՝ 09:00)'
    if (weeklyHours.value > 48) return 'Շաբաթական ժամերը չեն կարող գերազանցել 48 ժամը'
    return ''
  }
  // hourly
  if (!form.schedule.daysSelected.length) return 'Ընտրեք գոնե մեկ օրվա'
  const hasHours = form.schedule.daysSelected.some(d => Number((form.schedule.hoursMap as any)[d] || 0) > 0)
  if (!hasHours) return 'Նշեք գոնե մեկ օրվա ժամ'
  for (const d of form.schedule.daysSelected) {
    const hours = Number((form.schedule.hoursMap as any)[d] || 0)
    if (hours > 0 && !isValidTime((form.schedule.timeMap as any)[d])) {
      return 'Յուրաքանչյուր աշխատանքի օրում նշեք «Մեկնարկային ժամ»-ը (օր.՝ 09:00)'
    }
  }
  if (weeklyHours.value > 48) return 'Շաբաթական ժամերը չեն կարող գերազանցել 48 ժամը'
  return ''
})

/* Shift validations */
const shiftCalendarBuilt = ref(false)
const shiftPlan = ref<Array<{ start: string; end: string }>>([])
const shiftHoursError = computed(() => {
  if (!form.schedule.shift) return ''
  const h = Number(form.schedule.shift_hours || 0)
  if (!h) return 'Նշեք հերթափոխի ժամերը'
  if (h % 2 !== 0) return 'Հերթափոխի ժամերը պետք է լինեն զույգ թիվ'
  if (h < 2 || h > 24) return 'Հերթափոխի ժամերը պետք է լինեն 2-ից 24'
  return ''
})
const shiftPeriodError = computed(() => {
  if (!form.schedule.shift) return ''
  const h = Number(form.schedule.shift_hours || 0)
  const p = Number(form.schedule.shift_periodicity || 0)
  if (!p) return 'Նշեք պարբերականությունը'
  if (p % 2 !== 0) return 'Պարբերականությունը պետք է լինա զույգ թիվ'
  if (p < 6 || p > 6 * 24) return 'Պարբերականությունը պետք է լինի 6-ից մինչև 144'
  if (h && p < h) return 'Պարբերականությունը չի կարող լինել փոքր հերթափոխի ժամերից'
  if (h && !Number.isInteger(p / h)) return 'Պարբերականությունը պետք է բաժանվի հերթափոխի ժամերին առանց մնացորդի'
  return ''
})
const calendarBuildError = computed(() => {
  if (!form.schedule.shift) return ''
  if (!shiftCalendarBuilt.value) return 'Կալենդարում ընտրեք մեկնարկային օրը և ժամը, հետո սեղմեք «Պահպանել»'
  if (!shiftPlan.value.length) return 'Կալենդարային գրաֆիկը դեռ չի կառուցվել'
  return ''
})

/* Leave types */
const leaveTypes = ref<any[]>([])
const leaveTypesRequired = false
const selectedLeaveTypeIds = ref<number[]>([])
const leaveSearch = ref<string>('')
const leaveTypesMap = computed<Record<number, any>>(() => {
  const map: Record<number, any> = {}
  ;(leaveTypes.value || []).forEach((x: any) => { if (x?.id) map[x.id] = x })
  return map
})
const filteredLeaveTypes = computed(() => {
  const q = (leaveSearch.value || '').toLowerCase().trim()
  const list = leaveTypes.value || []
  if (!q) return list
  return list.filter((x: any) =>
      String(x?.name || '').toLowerCase().includes(q) ||
      String(x?.code || '').toLowerCase().includes(q)
  )
})
function toggleLeaveType(id: number) {
  const idx = selectedLeaveTypeIds.value.indexOf(id)
  if (idx === -1) selectedLeaveTypeIds.value.push(id)
  else selectedLeaveTypeIds.value.splice(idx, 1)
}
function clearAll() { selectedLeaveTypeIds.value = [] }

/* Payroll calc */
type VPayrollSetting = {
  income_tax: number
  daily_penalty_percentage?: number
  pension_low_rate: number
  pension_high_rate: number
  pension_threshold: number
  pension_state_rate: number
  pension_state_cap: number
  pension_base_cap: number
  pension_employee_cap: number
  voluntary_flat_rate?: number
  voluntary_state_support?: boolean
  military_settings?: Array<{ salary: number; fee: number }>
}
const payrollSettings = ref<any>()
function brMandatory(gross: number, cfg: VPayrollSetting) {
  if (!cfg || gross <= 0) return { employee: 0, state: 0, base_income: Math.max(0, Math.round(gross)) }
  const S = Number(gross)
  const Seff = Math.min(S, Number(cfg.pension_base_cap))
  const th = Math.min(Number(cfg.pension_threshold), Number(cfg.pension_base_cap))
  const stateRaw = Number(cfg.pension_state_rate) * Math.min(Seff, th)
  const state = Math.min(stateRaw, Number(cfg.pension_state_cap))
  let employee =
      Number(cfg.pension_low_rate)  * Math.min(Seff, th) +
      Number(cfg.pension_high_rate) * Math.max(Seff - th, 0)
  employee = Math.min(employee, Number(cfg.pension_employee_cap))
  return { employee: Math.round(Math.max(0, employee)), state: Math.round(Math.max(0, state)), base_income: Math.round(Seff) }
}
function brVoluntary(gross: number, cfg: VPayrollSetting) {
  if (!cfg || gross <= 0) return { employee: 0, state: 0, base_income: Math.max(0, Math.round(gross)) }
  const S = Number(gross)
  const Seff = Math.min(S, Number(cfg.pension_base_cap))
  const flat = Number(cfg.voluntary_flat_rate ?? 0)
  let employee = flat * Seff
  let state = 0
  if (cfg.voluntary_state_support) {
    state = Number(cfg.pension_state_rate) * Math.min(Seff, Number(cfg.pension_threshold))
  }
  return { employee: Math.round(Math.max(0, employee)), state: Math.round(Math.max(0, state)), base_income: Math.round(Seff) }
}
function breakdown(gross: number, cfg: VPayrollSetting, pension_voluntary = false) {
  return pension_voluntary ? brVoluntary(gross, cfg) : brMandatory(gross, cfg)
}
function calcStampDuty(salary: number, rows: Array<{ salary: number; fee: number }> = []) {
  if (!rows?.length || salary <= 0) return 0
  const sorted = [...rows]
      .map(r => ({ salary: Number(r.salary ?? 0), fee: Number(r.fee ?? 0) }))
      .filter(r => r.salary >= 0 && r.fee >= 0)
      .sort((a, b) => a.salary - b.salary)
  let picked = 0
  for (const r of sorted) { if (salary >= r.salary) picked = r.fee; else break }
  return Math.round(picked)
}
const netSalary = computed(() => {
  if (form.schedule.rate_according !== 'gross') return 0
  const gross = Number(form.contract.base_rate || 0)
  const s = payrollSettings.value as VPayrollSetting
  if (!s || !gross) return 0
  const pit = Math.max(0, gross * (Number(s.income_tax ?? 0) / 100))
  const b = breakdown(gross, s, !!props.employee?.pension_voluntary)
  const pensionEmp = b.employee
  const zah = calcStampDuty(gross, s.military_settings || [])
  const net = Math.max(0, gross - pit - zah - pensionEmp)
  return Math.round(net)
})

/* Shift helpers — peer schedules (ONLY Step 2) */
const calendarMode = computed<'shift' | 'pattern'>(() => form.schedule.shift ? 'shift' : 'pattern')
const peerSchedules = ref<Array<{
  shift: number | boolean
  shift_hours: number | null
  shift_periodicity: number | null
  start_date: string | null
  start_time: string | null
  end_date: string | null
  contract: any[] | null
}>>([])
const thisEmployeeId = computed<number | null>(() =>
    props.employee?.employee_id ??
    props.employee?.id ??
    props.employee?.user_id ??
    props.employee?.user?.id ??
    null
)
async function loadPeerSchedules(force = false) {
  if (currentStep.value !== 1 && !force) return
  const dep = Number(selectedDepartmentId.value)
  const role = roles.value.find(r => r.id === selectedRoleId.value)
  if (!dep || !role) { peerSchedules.value = []; return }

  try {
    const api = (employeesApi as any)?.workScheduling?.activeEmployees
    if (!api) { peerSchedules.value = []; return }
    ;(role as any).value = (role as any).role_id
    const { data } = await api(selectedDepartmentId, role, calendarMode)
    const list = Array.isArray(data) ? data : (data?.data ?? [])
    peerSchedules.value = (list || []).map((r: any) => {
      const isSelf = Number(r?.employee_id) === Number(thisEmployeeId.value)
      return {
        shift: r?.shift === true || Number(r?.shift ?? 0) === 1,
        shift_hours: r?.shift_hours != null ? Number(r.shift_hours) : null,
        shift_periodicity: r?.shift_periodicity != null ? Number(r.shift_periodicity) : null,
        start_date: r?.start_date ?? null,
        start_time: r?.start_time ?? null,
        end_date: r?.end_date ?? null,
        contract: r?.contract,
        employee_id: r?.employee_id ?? null,
        isSelf,
        color: isSelf ? '#22c55e' : '#64748b'
      }
    })
  } catch {
    peerSchedules.value = []
  }
}

/* Watches */
watch(() => selectedRoleId.value, () => {
  const role = roles.value.find(r => r.id === selectedRoleId.value)
  if (role) {
    form.schedule.shift = role.shift;
    form.schedule.shift_hours = role.shift_hours;
    form.schedule.shift_periodicity = role.shift_periodicity;
  }
  checkRoleCapacity()
})
watch(() => selectedDepartmentId.value, async (dep) => {
  await loadRolesByDepartment(dep ?? null)
  if (!roles.value.find(r => r.id === selectedRoleId.value)) {
    selectedRoleId.value = null
  }
  checkRoleCapacity()
  if (currentStep.value === 1) loadPeerSchedules()
})
watch([calendarMode, currentStep], () => { loadPeerSchedules() })

/* Can proceed logic */
function canProceed(stepIdx: number) {
  if (stepIdx === 0) {
    const deptOk = !!selectedDepartmentId.value
    const roleOk = !!selectedRoleId.value
    const startOk = !!form.contract.start_date
    const sel = roles.value.find(r => r.id === selectedRoleId.value)
    const isChanged = !!initialRoleId.value && (sel?.role_id ?? sel?.id) !== initialRoleId.value
    const capacityOk = isChanged ? !capacityError.value : true
    return deptOk && roleOk && startOk && !dateError.value && capacityOk
  }
  if (stepIdx === 1) {
    if (isCivil.value) return true
    const baseOk = !!form.contract.base_rate
    if (form.schedule.shift) {
      return baseOk && !shiftHoursError.value && !shiftPeriodError.value && !calendarBuildError.value
    }
    return baseOk && !patternError.value && !patternStartError.value
  }
  if (stepIdx === 2) {
    if (isCivil.value) return true
    return leaveTypesRequired ? selectedLeaveTypeIds.value.length > 0 : true
  }
  return true
}

const requiredDocsOk = computed(() =>
    docTypes.value.filter(t => t.required).every(t => (uploads.value[t.id]?.length || 0) > 0)
)

const canSubmit = computed(() => {
  // When civil, require only Step 0 + Docs
  if (isCivil.value) return canProceed(0) && requiredDocsOk.value
  // Normal flow: 0,1,2 + Docs
  return canProceed(0) && canProceed(1) && canProceed(2) && requiredDocsOk.value
})
/* Calendar hooks */
function onCalendarBuilt(payload: { built: boolean; plan: Array<{ start: string; end: string }> }) {
  shiftCalendarBuilt.value = !!payload?.built
  shiftPlan.value = payload?.plan || []
}
function onCalendarSave(payload: { plan: Array<{ start: string; end: string }> }) {
  shiftCalendarBuilt.value = true
  shiftPlan.value = payload?.plan || []
}
function firstStartFromPlan() {
  if (!shiftPlan.value.length) return { date: '', time: '' }
  const d = new Date(shiftPlan.value[0].start)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return { date: `${y}-${m}-${day}`, time: `${hh}:${mm}` }
}

/* Submit */
async function submit() {
  showRequired.value = true
  if (!canSubmit.value) return
  try {
    saving.value = true
    const fd = new FormData()

    /* Contract */
    fd.append('contract[start_date]', form.contract.start_date || '')
    fd.append('contract[end_date]', form.contract.end_date || '')
    fd.append('contract[base_rate]', String(form.contract.base_rate ?? ''))
    fd.append('contract[currency]', form.contract.currency || 'AMD')
    fd.append('contract[work_time_type]', form.contract.work_time_type || 'full')
    fd.append('contract[status]', form.contract.status || 'active')
    fd.append('contract[civil_contract]', form.contract.civil_contract ? '1' : '0')
    /* Schedule (common) */
    fd.append('work_scheduling[name]', form.schedule.name)
    fd.append('work_scheduling[shift]', form.schedule.shift ? '1' : '0')
    fd.append('rate_according', form.schedule.rate_according)               // NEW: required by you
    fd.append('work_scheduling[gross]', form.schedule.rate_according === 'gross' ? '1' : '0') // backward-compat

    if (form.schedule.shift) {
      fd.append('work_scheduling[shift_hours]', String(form.schedule.shift_hours ?? ''))
      fd.append('work_scheduling[shift_periodicity]', String(form.schedule.shift_periodicity ?? ''))
      const s = firstStartFromPlan()
      fd.append('work_scheduling[start_date]', s.date)
      fd.append('work_scheduling[start_time]', s.time)
    } else {
      // Non-shift (pattern) payload
      fd.append('work_scheduling[start_date]', form.schedule.patternStartDate || '')

      if (form.schedule.rate_according === 'gross') {
        const days = form.schedule.grossWeekType === '6' ? [0,1,2,3,4,5] : [0,1,2,3,4] // Mon..Sat or Mon..Fri
        days.forEach((weekday, i) => {
          fd.append(`work_scheduling[days][${i}][weekday]`, String(weekday))
          fd.append(`work_scheduling[days][${i}][working_hours]`, '8')
          fd.append(`work_scheduling[days][${i}][start_time]`, DEFAULT_DAY_START)
        })
        fd.append('work_scheduling[gross_week_type]', form.schedule.grossWeekType)
      } else if (form.schedule.rate_according === 'daily') {
        const hours = Number(form.schedule.globalDailyHours || 0)
        const st = form.schedule.globalDailyStartTime || DEFAULT_DAY_START
        let i = 0
        ;(form.schedule.daysSelected || []).forEach((weekday) => {
          if (hours <= 0) return
          fd.append(`work_scheduling[days][${i}][weekday]`, String(weekday))
          fd.append(`work_scheduling[days][${i}][start_time]`, String(st))
          fd.append(`work_scheduling[days][${i}][working_hours]`, String(hours))
          i++
        })
      } else { // hourly
        let i = 0
        ;(form.schedule.daysSelected || []).forEach((weekday) => {
          const hours = Number((form.schedule.hoursMap as any)[weekday] || 0)
          if (hours <= 0) return
          const st = ((form.schedule.timeMap as any)[weekday] || DEFAULT_DAY_START)
          fd.append(`work_scheduling[days][${i}][weekday]`, String(weekday))
          fd.append(`work_scheduling[days][${i}][start_time]`, String(st))
          fd.append(`work_scheduling[days][${i}][working_hours]`, String(hours))
          i++
        })
      }
    }
    fd.append('work_scheduling[end_date]', form.contract.end_date || '')

    /* Leave types */
    selectedLeaveTypeIds.value.forEach(id => fd.append('leave_type_ids[]', String(id)))

    /* Required IDs */
    const employeeId =
        props.employee?.employee_id ??
        props.employee?.id ??
        props.employee?.user_id ??
        props.employee?.user?.id ?? ''
    fd.append('employee_id', String(employeeId))

    if (selectedDepartmentId.value) fd.append('department_id', String(selectedDepartmentId.value))
    if (selectedRoleId.value) fd.append('role_position_id', String(selectedRoleId.value))

    /* Documents (first file per type) */
    let di = 0
    Object.entries(uploads.value || {}).forEach(([typeId, files]) => {
      const file = (files && files[0]) || null
      if (!file) return
      fd.append(`documents[${di}][type_id]`, String(typeId))
      fd.append(`documents[${di}][documents][${di}]`, file)
      di++
    })

    const created = await contractsApi.create(fd)
    emit('saved', created)
    emit('close')
  } finally {
    saving.value = false
  }
}

/* Interactions */
function toggleWeekday(id: number) {
  const arr = form.schedule.daysSelected
  const idx = arr.indexOf(id)
  if (idx === -1) {
    arr.push(id)
    if ((form.schedule as any).hoursMap[id] == null) (form.schedule as any).hoursMap[id] = 0
    if ((form.schedule as any).timeMap[id] == null) (form.schedule as any).timeMap[id] = DEFAULT_DAY_START
  } else {
    arr.splice(idx, 1)
  }
}

/* Seed shift fields from incoming employee role_position meta if present */
function seedShiftFromEmployee(e = props.employee) {
  if (!e) return
  const rp = e?.candidate?.application?.vacancy?.role_position ?? {}
  const isShift = rp.shift === true || Number(rp.shift ?? 0) === 1
  form.schedule.shift = isShift
  if (isShift) {
    const h = rp.shift_hours != null ? Number(rp.shift_hours) : NaN
    const p = rp.shift_periodicity != null ? Number(rp.shift_periodicity) : NaN
    form.schedule.shift_hours = Number.isFinite(h) ? h : 8
    form.schedule.shift_periodicity = Number.isFinite(p) ? p : 24
  } else {
    form.schedule.shift_hours = null
    form.schedule.shift_periodicity = null
  }
}

/* Loaders */
async function loadDocTypes() {
  try {
    const r = await contractsApi.getDocTypes?.()
    const list = (r?.data ?? r ?? []).map((d: any) => ({ id: d.id, name: d.name, required: !!(d.required ?? d.pivot?.required) }))
    docTypes.value = list
  } catch { docTypes.value = [] }
}
async function getLeaveTypes() {
  try {
    const data = await leaveTypeApi.list()
    leaveTypes.value = data?.data ?? data ?? []
  } catch { /* noop */ }
}
async function getPayrollSettings() {
  try {
    const { data } = await payrollSettingApi.getData()
    payrollSettings.value = data?.data || data || null
  } catch { /* noop */ }
}
async function loadDepartments() {
  try {
    departments.value = await directoriesApi.departments({ per_page: 200 })
  } catch {
    departments.value = []
  }
}
async function loadRolesByDepartment(depId: number | null) {
  roles.value = []
  if (!depId) return
  loadingRoles.value = true
  try {
    roles.value = await directoriesApi.departmentRoles(depId)
  } finally {
    loadingRoles.value = false
  }
}

/* On mount, seed lists and values */
onMounted(async () => {
  await loadDepartments()
  selectedDepartmentId.value = initialDepartmentId.value ?? null
  await loadRolesByDepartment(selectedDepartmentId.value)
  const byRoleId = roles.value.find((r:any) => r.role_id === initialRoleId.value)?.id
  selectedRoleId.value = byRoleId ?? roles.value.find((r:any) => r.id === initialRoleId.value)?.id ?? null
  seedShiftFromEmployee()
  await loadDocTypes()
  await getLeaveTypes()
  await getPayrollSettings()
})

/* When employee changes */
watch(() => props.employee, async (e) => {
  selectedDepartmentId.value = initialDepartmentId.value ?? null
  await loadRolesByDepartment(selectedDepartmentId.value)
  const byRoleId = roles.value.find((r:any) => r.role_id === initialRoleId.value)?.id
  selectedRoleId.value = byRoleId ?? roles.value.find((r:any) => r.id === initialRoleId.value)?.id ?? null
  seedShiftFromEmployee(e)
  if (currentStep.value === 1) loadPeerSchedules()
}, { immediate: false })

/* DOW options */
const DOW_OPTS = [
  { id: 0, label: 'Երկ' },
  { id: 1, label: 'Երք' },
  { id: 2, label: 'Չրք' },
  { id: 3, label: 'Հնգ' },
  { id: 4, label: 'Ուր' },
  { id: 5, label: 'Շբթ' },
  { id: 6, label: 'Կիր' }
]
const DOW_OPTS_MAP: Record<number, { id: number; label: string }> =
    Object.fromEntries(DOW_OPTS.map(o => [o.id, o]))
</script>
