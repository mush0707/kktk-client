<!-- WorkingHoursMovementModal.vue -->
<template>
  <div v-if="open" class="fixed inset-0 z-50 p-4">
    <div class="absolute inset-0 bg-black/30" @click="emit('close')"></div>

    <div class="relative max-h-screen overflow-y-auto bg-white rounded-2xl shadow-xl max-w-6xl w-full mx-auto p-6">
      <!-- Header -->
      <div class="flex items-center justify-between gap-3">
        <div>
          <div class="text-[12px] uppercase tracking-wide text-slate-500">Օրը</div>
          <div class="text-lg font-semibold">{{ day }}</div>
        </div>
        <button class="px-3 py-1 rounded-lg border border-gray-300" @click="emit('close')">Փակել</button>
      </div>

      <div class="mt-5 space-y-6">
        <!-- PRIMARY -->
        <section>
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="text-sm text-slate-600 mb-1">Աշխատակից</div>
              <div class="text-base font-medium">{{ primaryLabel || '—' }}</div>
              <div class="text-[12px] text-slate-500 mt-0.5">
                Հաստիք՝ {{ primaryRole || '—' }}
                <span v-if="primaryShift" class="ml-2 px-1 rounded bg-indigo-50 border border-indigo-200 text-indigo-700">Հերթափոխ</span>
              </div>
            </div>
            <div class="text-[11px] text-slate-500">
              <template v-if="!primaryShift && pMin && pMax">Թույլատրելի՝ {{ pMin }} – {{ pMax }}</template>
            </div>
          </div>

          <div v-if="primary && !primaryShift" class="grid md:grid-cols-3 gap-3 mt-3">
            <div>
              <label class="block text-sm text-slate-600 mb-1">Սկիզբ</label>
              <input type="time" v-model="pStart" :min="pMin" :max="pMax" step="60" class="w-full border rounded-lg px-2 py-1" @change="normalizePrimary" />
            </div>
            <div>
              <label class="block text-sm text-slate-600 mb-1">Ավարտ</label>
              <input type="time" v-model="pEnd" :min="pMin" :max="pMax" step="60" class="w-full border rounded-lg px-2 py-1" @change="normalizePrimary" />
            </div>
            <div class="text-[11px] text-slate-500 self-end">Թույլատրելի՝ {{ pMin }} – {{ pMax }}</div>
          </div>

          <p v-if="pError" class="text-sm text-rose-600 mt-2">{{ pError }}</p>
        </section>

        <!-- SECONDARY -->
        <section class="space-y-3">
          <div>
            <label class="block text-sm text-slate-600 mb-1">Փոխարինող աշխատակից</label>
            <VueSelect
                v-model="secondaryId"
                :options="replacementOptions"
                :get-option-value="o => o.id"
                label="label"
                :filterable="true"
                :clearable="true"
                :loading="loadingReplacement"
                :disabled="!primary"
                @open="loadReplacement('')"
                @search="loadReplacement"
                @option-selected="(opt:any)=> secondaryId = opt?.id ?? null"
                @option-deselected="()=> secondaryId = null"
                placeholder="Ընտրել փոխարինող աշխատակցին…"
            />
            <p v-if="secondaryId" class="text-[11px] text-slate-500 mt-1">
              Հաստիք՝ {{ empById[secondaryId]?.role?.name ?? '—' }}
            </p>
          </div>

          <!-- Correct calendar usage with busy-window trimming -->
          <EmployeeScheduleCalendar
              v-if="secondaryId"
              v-model="toDay"
              :schedule="secondarySchedule"
              :leaves="empById[secondaryId]?.active_contract?.employee?.leave_requests || []"
              :busy="secondaryBusy"
              @pick="onSecondaryCalendarPick"
              @request-busy="onRequestBusy"
          />

          <!-- Selected summary -->
          <div v-if="secondaryId && secondaryPick.day" class="text-[12px] text-slate-600">
            Ընտրված «դեպի» օր՝ <span class="font-medium">{{ secondaryPick.day }}</span>
            <template v-if="!secondaryPick.isShift && secondaryPick.start_time && secondaryPick.end_time">
              • Ժամեր՝ {{ secondaryPick.start_time }}–{{ secondaryPick.end_time }}
            </template>
            <template v-else-if="secondaryPick.isShift">• Հերթափոխ (ժամաչափը գրաֆիկով)</template>
          </div>
        </section>
      </div>

      <!-- Actions -->
      <div class="mt-6 flex justify-end gap-2">
        <button
            class="px-4 py-2 rounded-lg text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
            :disabled="!canSubmit"
            @click="submit"
        >
          Պահպանել
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import VueSelect from 'vue3-select-component'
import { employeesApi } from '@/api.ts'
import EmployeeScheduleCalendar from '@/views/hr/components/Calendar/EmployeeScheduleCalendar.vue'

type WorkingDay = { weekday: number; start_time: string | null; end_time: string | null }
type EmpOption = {
  id: number
  label: string
  role?: { id: number; name: string } | null
  active_contract?: {
    id: number
    role?: { id: number; name: string }
    employee?: { first_name?: string; last_name?: string, leave_requests?: [] | null }
    schedule_assignment?: {
      id?: number | null
      employee_id?: number | null
      employment_contract_id?: number | null
      shift: 0 | 1 | boolean
      working_days?: WorkingDay[]
      start_time?: string | null
      shift_hours?: number | null
      shift_periodicity?: number | null
      start_date?: string | null
      end_date?: string | null
      status?: string | null
    } | null,
  } | null
  user?: { roles?: Array<{ id:number; name:string }> | null } | null
}
type OvertimeRow = { start_time: string; finished_time: string }
type SecondaryPick = { day: string | null; isShift: boolean; start_time: string | null; end_time: string | null }

const props = defineProps<{
  open: boolean
  day: string                  // FROM day 'YYYY-MM-DD'
  departmentId: number | null
  roleId: number | null
  dayEmployeeIds: number[]
  prefillPrimaryId?: number | null
}>()

const emit = defineEmits<{ (e:'close'): void; (e:'saved'): void }>()

/* ---------- State ---------- */
const primary = ref<EmpOption|null>(null)
const secondaryId = ref<number|null>(null)

const replacementOptions = ref<Array<{ id:number; label:string }>>([])
const loadingReplacement = ref(false)

const pOvertimes = ref<OvertimeRow[]>([])
const pStart = ref('') // HH:MM
const pEnd   = ref('')

const pError = ref('')

const secondaryPick = ref<SecondaryPick>({ day: null, isShift: false, start_time: null, end_time: null })
const toDay = ref<string|null>(null) // v-model for calendar

// Busy windows for the secondary employee across current visible month of child
const secondaryBusy = ref<Array<{ start_time: string; finished_time: string }>>([])

/* ---------- Helpers ---------- */
const weekdayIndex = computed(() => (new Date(props.day + 'T00:00:00').getDay() + 6) % 7)
const hhmm = (str?: string|null) => (str?.match(/^(\d{2}:\d{2})/)?.[1] ?? null)
const toMinutes = (t: string) => { const [h,m] = t.split(':').map(Number); return h*60+m }

const empById = ref<Record<number, EmpOption>>({})
function upsertEmpMap(list: any[]) {
  list.forEach((u: any) => {
    empById.value[u.id] = {
      id: u.id,
      label: [u.first_name, u.last_name].filter(Boolean).join(' ') || `#${u.id}`,
      role: u?.active_contract?.role ?? u?.user?.roles?.[0] ?? null,
      active_contract: u.active_contract ?? null,
      user: u.user ?? null
    }
  })
}

/* ---------- Primary derived ---------- */
const primaryLabel = computed(() => {
  if (!primary.value) return ''
  const fn = primary.value.active_contract?.employee?.first_name
  const ln = primary.value.active_contract?.employee?.last_name
  const built = [fn, ln].filter(Boolean).join(' ')
  return built || primary.value.label || (primary.value.id ? `#${primary.value.id}` : '')
})
const primaryRole = computed(() =>
    primary.value?.user?.roles?.[0]?.name || primary.value?.active_contract?.role?.name || '-'
)
const primaryShift = computed(() => !!primary.value?.active_contract?.schedule_assignment?.shift)

function dayBounds(emp: EmpOption | null) {
  const asg = emp?.active_contract?.schedule_assignment
  if (!asg || asg.shift) return { min: '', max: '' }
  const wd = (asg.working_days || []).find(w => +w.weekday === weekdayIndex.value)
  if (!wd) return { min: '', max: '' }
  const start = hhmm(wd.start_time)
  const end   = hhmm(wd.end_time)
  if (!start || !end) return { min: '', max: '' }
  return { min: start, max: end }
}
const pMin = computed(() => dayBounds(primary.value).min)
const pMax = computed(() => dayBounds(primary.value).max)

/* ---------- Secondary schedule for calendar ---------- */
const secondarySchedule = computed(() => {
  if (!secondaryId.value) return null
  return empById.value[secondaryId.value]?.active_contract?.schedule_assignment ?? null
})

/* ---------- Data loading ---------- */
async function loadPrimaryById(id: number) {
  const { data } = await (employeesApi as any).list({
    employee_ids: [id],
    limit: 1,
    with: ['active_contract.employee', 'active_contract.role', 'active_contract.schedule_assignment', 'user.roles']
  })
  const item = Array.isArray(data) ? data?.[0] : (data?.data?.[0])
  if (!item) return null
  const opt: EmpOption = {
    id: item.id,
    label: [item.first_name, item.last_name].filter(Boolean).join(' ') || `#${item.id}`,
    role: item?.active_contract?.role ?? item?.user?.roles?.[0] ?? null,
    active_contract: item.active_contract,
    user: item.user
  }
  primary.value = opt
  return opt
}

async function loadReplacement(q: string) {
  if (!primary.value) return
  loadingReplacement.value = true
  try {
    const { data } = await (employeesApi as any).list({
      search: q,
      limit: 50,
      exclude_ids: [primary.value.id],
      department_id: props.departmentId,
      role_id: primary.value.user?.roles?.[0]?.id ?? null,
      with: ['active_contract.employee', 'active_contract.role', 'active_contract.schedule_assignment', 'user.roles']
    })
    const list = Array.isArray(data) ? data : (data?.data ?? [])
    upsertEmpMap(list)
    replacementOptions.value = list.map((u: any) => ({
      id: u.id,
      label: [u.first_name, u.last_name].filter(Boolean).join(' ') || `#${u.id}`,
    }))
  } finally {
    loadingReplacement.value = false
  }
}

async function fetchOvertimesFor(employeeId: number, day: string): Promise<OvertimeRow[]> {
  const { data } = await (employeesApi as any).overtimes.getEmployeeOvertimes(employeeId, day)
  const list = Array.isArray(data) ? data : (data?.data ?? [])
  return list.map((r: any) => ({ start_time: r.start_time, finished_time: r.finished_time }))
}

/* ---------- Validation (primary only) ---------- */
function intervalValid(startHHMM: string, endHHMM: string, minHHMM: string, maxHHMM: string) {
  if (!startHHMM || !endHHMM || !minHHMM || !maxHHMM) return false
  const s = toMinutes(startHHMM), e = toMinutes(endHHMM)
  const mn = toMinutes(minHHMM), mx = toMinutes(maxHHMM)
  return s < e && s >= mn && e <= mx
}
function overlapsExisting(startHHMM: string, endHHMM: string, existing: OvertimeRow[]) {
  const s = toMinutes(startHHMM), e = toMinutes(endHHMM)
  return existing.some(r => {
    const rs = toMinutes(hhmm(r.start_time)!)
    const re = toMinutes(hhmm(r.finished_time)!)
    return s < re && e > rs
  })
}
function normalizePrimary() {
  if (primaryShift.value) return
  const min = pMin.value, max = pMax.value
  if (!intervalValid(pStart.value, pEnd.value, min, max)) {
    if (pStart.value && min && toMinutes(pStart.value) < toMinutes(min)) pStart.value = min
    if (pEnd.value && max && toMinutes(pEnd.value) > toMinutes(max)) pEnd.value = max
  }
  if (!intervalValid(pStart.value, pEnd.value, min, max)) {
    pError.value = 'Ժամերը պետք է լինեն օրվա թույլատրելի սահմաններում'
    return
  }
  if (overlapsExisting(pStart.value, pEnd.value, pOvertimes.value)) {
    pError.value = 'Ընտրված միջակայքը խաչվում է արդեն գրանցված արտաժամ/տեղափոխության հետ'
    return
  }
  pError.value = ''
}

watch([pStart, pEnd], () => {
  if (primary.value && !primaryShift.value) normalizePrimary()
})
const toHHMM = (d: Date) => `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`

/* ---------- Calendar pick handler ---------- */
function onSecondaryCalendarPick(payload: {
  day: string
  shift: boolean
  start: Date
  end: Date
  hours: number | null
}) {
  secondaryPick.value = {
    day: payload.day,
    isShift: payload.shift,
    start_time: payload.shift ? null : toHHMM(payload.start),
    end_time:   payload.shift ? null : toHHMM(payload.end),
  }
  toDay.value = payload.day
}

/* Reset calendar state on employee change */
watch(secondaryId, async () => {
  toDay.value = null
  secondaryPick.value = { day: null, isShift: false, start_time: null, end_time: null }
  secondaryBusy.value = []
})

/* ---------- Handle child's busy-window request ---------- */
async function onRequestBusy(range: { start: string; end: string; employee_id: number }) {
  if (!range?.start || !range?.end || !range?.employee_id) return
  const days: string[] = []
  // inclusive date loop
  const s = new Date(range.start + 'T00:00:00')
  const e = new Date(range.end   + 'T00:00:00')
  for (let d = new Date(s); d <= e; d.setDate(d.getDate()+1)) {
    const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), day = String(d.getDate()).padStart(2,'0')
    days.push(`${y}-${m}-${day}`)
  }

  const acc: Array<{ start_time: string; finished_time: string }> = []
  // Fetch sequentially to avoid API hammering (keep it simple/stable)
  for (const ymd of days) {
    try {
      const list = await fetchOvertimesFor(range.employee_id, ymd)
      for (const r of list) acc.push({ start_time: r.start_time, finished_time: r.finished_time })
    } catch { /* ignore one-day errors */ }
  }
  secondaryBusy.value = acc
}

/* ---------- Submit ---------- */
const canSubmit = computed(() => {
  if (!primary.value) return false
  if (!secondaryId.value) return false

  // primary validation
  if (!primaryShift.value) {
    if (!pStart.value || !pEnd.value || !!pError.value) return false
  }

  // secondary validation
  const sp: any = secondaryPick.value
  if (!sp || !sp.day) return false

  if (typeof sp.isShift === 'boolean') {
    if (sp.isShift) return true
    return !!(sp.start_time && sp.end_time)
  }

  return false
})

async function submit() {
  if (!canSubmit.value) return
  const sp = secondaryPick.value
  const employees: any[] = [
    {
      employee_id: primary.value!.id,
      employment_contract_id: primary.value!.active_contract?.id,
      day: sp.day,
      start_time: sp.isShift ? empById.value[secondaryId.value!]?.active_contract?.schedule_assignment?.start_time?.slice(11, 16) : sp.start_time,
      working_hours: sp.isShift ? empById.value[secondaryId.value!]?.active_contract?.schedule_assignment?.shift_hours : Math.round((toMinutes(sp.end_time!) - toMinutes(sp.start_time!)) / 60),
    },
    {
      employee_id: secondaryId.value,
      employment_contract_id: empById.value[secondaryId.value!]?.active_contract?.id,
      day: props.day,
      start_time: primaryShift.value ? primary.value?.active_contract?.schedule_assignment?.start_time?.slice(11, 16) : pStart.value,
      working_hours: primaryShift.value ? primary.value?.active_contract?.schedule_assignment?.shift_hours : Math.round((toMinutes(pEnd.value) - toMinutes(pStart.value)) / 60),
    }
  ]

  await (employeesApi as any).overtimes.storeTransfer({ is_movement: true, employees })
  emit('saved'); emit('close')
}

/* ---------- Open → init ---------- */
async function primePrimaryState() {
  if (!primary.value) return
  pError.value = ''
  pOvertimes.value = await fetchOvertimesFor(primary.value.id, props.day)

  if (!primaryShift.value) {
    const { min, max } = dayBounds(primary.value)
    if (!min || !max) {
      pError.value = 'Սխալ․ աշխատակցի համար տվյալ օրը աշխատանքային ժամ չկա'
    } else {
      pStart.value = min
      pEnd.value   = max
      normalizePrimary()
    }
  }
  await loadReplacement('')
}

watch(() => props.open, async (v) => {
  if (!v) return
  // reset
  primary.value = null
  secondaryId.value = null
  pStart.value = pEnd.value = ''
  pOvertimes.value = []
  pError.value = ''
  toDay.value = null
  secondaryPick.value = { day: null, isShift: false, start_time: null, end_time: null }
  secondaryBusy.value = []

  if (!props.prefillPrimaryId) return
  const prim = await loadPrimaryById(props.prefillPrimaryId)
  if (!prim) return
  await primePrimaryState()
})
</script>

<style scoped>
:deep(.vsc-wrapper){ --vsc-border-color: rgb(209 213 219); border-radius: 0.75rem; }
</style>
