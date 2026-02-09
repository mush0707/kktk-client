<template>
  <div class="space-y-3">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <button class="px-2 py-1 rounded-lg border border-gray-300" @click="prevMonth" aria-label="Prev">‹</button>
        <div class="text-lg font-semibold">{{ monthLabel }}</div>
        <button class="px-2 py-1 rounded-lg border border-gray-300" @click="nextMonth" aria-label="Next">›</button>
      </div>

      <!-- Legend -->
      <div class="flex items-center gap-3 text-xs text-slate-600">
        <span class="inline-flex items-center gap-1">
          <span class="inline-block w-2.5 h-2.5 rounded bg-indigo-500"></span> Հերթափոխային
        </span>
        <span class="inline-flex items-center gap-1">
          <span class="inline-block w-2.5 h-2.5 rounded bg-emerald-500"></span> Շաբաթական փաթեթ
        </span>
      </div>
    </div>

    <!-- Calendar -->
    <div class="border rounded-2xl bg-white">
      <div class="grid grid-cols-7 text-xs text-slate-500 border-b">
        <div v-for="d in WEEKDAYS" :key="d" class="py-2 text-center">{{ d }}</div>
      </div>

      <div class="grid grid-cols-7 gap-1 p-2">
        <div
            v-for="cell in cells"
            :key="cell.key"
            class="h-32 p-2 rounded-lg border relative overflow-hidden cursor-default"
            :class="{
    'opacity-40': cell.outside,
    'cursor-pointer ring-2 ring-blue-500': isSelected(cell.date),
    'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 cursor-pointer': !isShift && isAllowed(cell.date),
    'bg-indigo-50 border-indigo-200 hover:bg-indigo-100 cursor-pointer':  isShift && isAllowed(cell.date),
    'bg-white': !isAllowed(cell.date),
    // NEW — actually hide past & ≤ selected days
    'invisible pointer-events-none select-none': isCellHidden(cell.date),
  }"
            :aria-hidden="isCellHidden(cell.date) ? 'true' : undefined"
            @click="onPick(cell.date)"
            :title="isCellHidden(cell.date) ? '' : titleFor(cell.date)"
        >
          <div class="flex items-center justify-between">
            <span class="text-lg text-slate-700">{{ cell.date.getDate() }}</span>
            <span
                v-if="isAllowed(cell.date)"
                class="text-[10px] px-1 rounded border"
                :class="isShift ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'"
            >
              {{ shortBadge(cell.date) }}
            </span>
          </div>

          <!-- Slot preview (trimmed by busy windows) -->
          <div v-if="isAllowed(cell.date)" class="mt-1 text-[11px] text-slate-600 leading-4 space-y-0.5">
            <template v-if="isShift">
              <div v-for="seg in shiftSegments(cell.date)" :key="segKey(seg)">
                {{ timeLabel(seg.start) }}–{{ timeLabel(seg.end) }} ({{ Math.round(seg.hours) }} ժ.)
              </div>
            </template>
            <template v-else>
              <div v-for="slot in daySlots(cell.date)" :key="slot.key">
                {{ timeLabel(slot.start) }}–{{ timeLabel(slot.end) }} ({{ Math.round(slot.hours) }} ժ.)
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Selected summary -->
    <div v-if="modelValue" class="text-sm text-slate-700">
      Ընտրված «դեպի» օրը՝
      <span class="font-semibold">{{ modelValue }}</span>
      <span v-if="selectedMeta && !selectedMeta.shift">
        • {{ timeLabel(selectedMeta.start) }}–{{ timeLabel(selectedMeta.end) }} ({{ Math.round(selectedMeta.hours) }} ժ.)
      </span>
      <span v-else-if="selectedMeta && selectedMeta.shift">
        • Շիֆտ՝ {{ Math.round(selectedMeta.hours || 0) }} ժ. (սկիզբ {{ timeLabel(selectedMeta.start) }})
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

/**
 * Props
 * - modelValue: currently picked "to day" in 'YYYY-MM-DD'
 * - schedule: the secondary employee's schedule_assignment object
 * - busy: array of busy windows (root active_overtimes for this employee) across current month
 */
type WorkingDay = {
  weekday: number          // 0..6 (Mon..Sun)
  working_hours: number
  start_time?: string | null // 'HH:MM:SS' (optional)
  end_time?: string | null
}
type ScheduleAssignment = {
  id: number
  employee_id: number
  employment_contract_id: number
  start_date: string        // 'YYYY-MM-DD'
  end_date: string | null
  start_time: string | null // 'YYYY-MM-DD HH:MM:SS' (anchor)
  shift: 0 | 1 | boolean
  shift_hours: number | null
  shift_periodicity: number | null  // hours between starts (e.g., 72 for 24/48)
  status: string
  working_days: WorkingDay[]
}

const props = defineProps<{
  modelValue: string | null
  schedule: ScheduleAssignment | null
  busy?: Array<{ start_time: string; finished_time: string }>
  leaves?: Array<{ date_from: string; date_to?: string|null; status?: string }>
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: string | null): void
  (e: 'pick', payload: {
    day: string
    shift: boolean
    hours: number | null
    start: Date
    end: Date
    schedule_id: number
    employment_contract_id: number
    employee_id: number
  }): void
  (e: 'request-busy', payload: { start: string; end: string; employee_id: number }): void
}>()
const todayStart = startOfDay(new Date())

function isPastDay(d: Date) {
  return +startOfDay(d) < +todayStart
}
/* Locale helpers */
const WEEKDAYS = ['Երկ', 'Երք', 'Չրք', 'Հնգ', 'Ուր', 'Շբթ', 'Կիր']
function ymd(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
const selectedStart = computed(() => {
  const d = parseYmd(props.modelValue || null)
  return d ? startOfDay(d) : null
})

function isBeforeOrEqualSelected(d: Date) {
  const s = selectedStart.value
  if (!s) return false
  return +startOfDay(d) <= +s
}
function isCellHidden(d: Date) {
  return isPastDay(d) || isBeforeOrEqualSelected(d)
}
function startOfDay(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x }
function endOfDay(d: Date)   { const x = new Date(d); x.setHours(23,59,59,999); return x }
function addHours(dt: Date, hrs: number) { const x = new Date(dt); x.setHours(x.getHours() + hrs); return x }
function timeLabel(d: Date)  { return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) }
function parseDateTime(s?: string|null): Date | null {
  if (!s) return null
  const [datePart, timePart] = s.split(' ')
  if (!datePart) return null
  const [Y, M, D] = datePart.split('-').map(n => Number(n))
  const [h = 0, m = 0, sec = 0] = (timePart?.split(':').map(Number) ?? [])
  const d = new Date(Y, (M || 1) - 1, D || 1, h || 0, m || 0, sec || 0, 0)
  return isNaN(+d) ? null : d
}
function parseYmd(s?: string|null): Date | null {
  if (!s) return null
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  return m ? new Date(+m[1], +m[2]-1, +m[3]) : null
}

const leaveRanges = computed(() => {
  const arr = Array.isArray(props.leaves) ? props.leaves : []
  return arr.map(l => {
    const s = parseYmd(l.date_from)
    const e = parseYmd(l.date_to ?? l.date_from)
    const status = String(l.status || 'pending').toLowerCase()
    return (s && e) ? { start: startOfDay(s), end: startOfDay(e), status } : null
  }).filter(Boolean) as Array<{start: Date; end: Date; status: string}>
})

function isLeaveDay(date: Date) {
  const t = +startOfDay(date)
  for (const r of leaveRanges.value) {
    // treat pending/approved/active as blocking; allow canceled/rejected
    if (r.status === 'canceled' || r.status === 'rejected') continue
    if (t >= +r.start && t <= +r.end) return true
  }
  return false
}
/* Calendar state */
const today = new Date()
const viewYear = ref<number>(today.getFullYear())
const viewMonth = ref<number>(today.getMonth())

const monthLabel = computed(() => {
  const d = new Date(viewYear.value, viewMonth.value, 1)
  const m = new Intl.DateTimeFormat('hy-AM', { month: 'long' }).format(d)
  return `${d.getFullYear()} ${m.charAt(0).toUpperCase() + m.slice(1)}`
})

function prevMonth() {
  const candidate = new Date(viewYear.value, viewMonth.value - 1, 1)
  const minMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  if (candidate < minMonth) return            // NEW: clamp to current month
  const m = viewMonth.value - 1
  if (m < 0) { viewMonth.value = 11; viewYear.value -= 1 } else { viewMonth.value = m }
}
function nextMonth() { const m = viewMonth.value + 1; if (m > 11) { viewMonth.value = 0; viewYear.value += 1 } else { viewMonth.value = m } }

const monthStart = computed(() => new Date(viewYear.value, viewMonth.value, 1))
const monthEnd   = computed(() => new Date(viewYear.value, viewMonth.value + 1, 0))

const cells = computed(() => {
  const first = new Date(viewYear.value, viewMonth.value, 1)
  const start = new Date(first)
  const startWeekday = (first.getDay() + 6) % 7 // Monday=0
  start.setDate(first.getDate() - startWeekday)
  const list: Array<{ key: string; date: Date; outside: boolean }> = []
  for (let i = 0; i < 42; i++) {
    const day = new Date(start)
    day.setDate(start.getDate() + i)
    list.push({ key: ymd(day), date: day, outside: day.getMonth() !== viewMonth.value })
  }
  return list
})

/* Schedule helpers */
const schedule = computed(() => props.schedule || null)
const isShift  = computed(() => !!(schedule.value && (schedule.value.shift === 1 || schedule.value.shift === true)))

function scheduleStartDate(): Date | null {
  if (!schedule.value?.start_date) return null
  const m = schedule.value.start_date.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null
}
function scheduleEndDate(): Date | null {
  if (!schedule.value?.end_date) return null
  const m = schedule.value.end_date.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null
}
function parseAnchorTime(): { h: number; m: number } {
  const raw = schedule.value?.start_time || ''
  const timePart = raw.split(' ')[1] || '09:00:00'
  const [hh, mm] = timePart.split(':').slice(0,2).map(n => Number(n))
  return { h: Number.isFinite(hh) ? hh : 9, m: Number.isFinite(mm) ? mm : 0 }
}
function shiftPeriod(): number {
  return Number(schedule.value?.shift_periodicity || 0) // hours between starts
}

/* ---------- Busy windows (root active_overtimes.*) ---------- */
const busyParsed = computed(() => {
  const arr = Array.isArray(props.busy) ? props.busy : []
  return arr
      .map(w => {
        const s = parseDateTime(w.start_time)
        const e = parseDateTime(w.finished_time)
        return (s && e && e > s) ? { start: s, end: e } : null
      })
      .filter(Boolean) as Array<{ start: Date; end: Date }>
})

const EPS_MS = 60 * 1000 // 1 minute tolerance for equality checks

function overlaps(a: {start:Date; end:Date}, b: {start:Date; end:Date}) {
  return a.start < b.end && a.end > b.start
}

/** subtract a set of [start,end) windows from base [start,end) window */
function subtractWindows(
    baseStart: Date,
    baseEnd: Date,
    mv: Array<{ start: Date; end: Date }>
) {
  let segs: Array<{ start: Date; end: Date }> = [{ start: new Date(baseStart), end: new Date(baseEnd) }]
  if (!mv.length) return segs

  for (const w of mv) {
    const next: Array<{ start: Date; end: Date }> = []
    for (const s of segs) {
      if (w.end <= s.start || w.start >= s.end) { next.push(s); continue }                  // no overlap
      if (w.start <= s.start && w.end >= s.end) { continue }                                // full cover
      if (w.start <= s.start && w.end < s.end)  { next.push({ start: new Date(w.end), end: s.end }); continue } // left bite
      if (w.start > s.start && w.end >= s.end)  { next.push({ start: s.start, end: new Date(w.start) }); continue } // right bite
      // split
      next.push({ start: s.start, end: new Date(w.start) })
      next.push({ start: new Date(w.end), end: s.end })
    }
    segs = next
    if (!segs.length) break
  }
  return segs
}

function eqWindow(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return Math.abs(aStart.getTime() - bStart.getTime()) <= EPS_MS &&
      Math.abs(aEnd.getTime()   - bEnd.getTime())   <= EPS_MS
}

/* Shift helpers */
function shiftStartAt(date: Date): Date {
  const base = new Date(date)
  const { h, m } = parseAnchorTime()
  base.setHours(h, m, 0, 0)
  return base
}

/** TRUE only if a shift occurrence actually starts on this date (periodicity aligned). */
function isShiftOccurrence(date: Date): boolean {
  const sDate = scheduleStartDate()
  const period = shiftPeriod()
  if (!sDate || !period) return false
  const { h, m } = parseAnchorTime()

  const anchor = new Date(sDate); anchor.setHours(h, m, 0, 0)
  const candidate = new Date(date); candidate.setHours(h, m, 0, 0)

  if (candidate < anchor) return false
  const diffHours = Math.round((candidate.getTime() - anchor.getTime()) / 3600000)
  return diffHours % period === 0
}

/* Non-shift: base slots for a given date, then trim by busy */
function rawDayBaseSlots(date: Date) {
  if (!schedule.value || isShift.value) return []
  const wdList = Array.isArray(schedule.value.working_days) ? schedule.value.working_days : []
  if (!wdList.length) return []
  const jsW = date.getDay()
  const ourWeekday = (jsW + 6) % 7
  const filtered = wdList.filter(d => Number(d.weekday) === ourWeekday && Number(d.working_hours) > 0)
  if (!filtered.length) return []

  return filtered.map((row, idx) => {
    const base = new Date(date)
    const start = new Date(base)
    if (row.start_time) {
      const [H, M] = row.start_time.split(':').slice(0,2).map(Number)
      start.setHours(H || 9, M || 0, 0, 0)
    } else {
      const { h, m } = parseAnchorTime()
      start.setHours(h, m, 0, 0)
    }
    const hours = Number(row.working_hours) || 0
    const end = addHours(start, hours)
    return { key: `${ymd(date)}-${idx}`, start, end, hours }
  })
}

/* Shift mode: compute trimmed segments for that day */
function shiftSegments(date: Date) {
  if (!schedule.value || !isShift.value) return []
  // IMPORTANT: Only calculate segments when an occurrence starts today
  if (!isShiftOccurrence(date)) return []

  const hours = Number(schedule.value.shift_hours || 0)
  const start = shiftStartAt(date)
  const end = addHours(start, hours)

  // If an exact busy window equals the whole shift → suppress
  const exactBusy = busyParsed.value.some(b => eqWindow(start, end, b.start, b.end))
  if (exactBusy) return []

  // Else subtract busy windows (those that overlap this base window)
  const overlapping = busyParsed.value.filter(b => overlaps({start, end}, b))
  const segs = subtractWindows(start, end, overlapping).map(seg => ({
    start: seg.start, end: seg.end, hours: Math.max(0, (seg.end.getTime()-seg.start.getTime())/3600000)
  }))
  return segs.filter(s => s.hours > 0.0001)
}

/* Non-shift: produce slots for a given date and trim by busy windows */
function daySlots(date: Date) {
  if (!schedule.value) return []
  if (isShift.value) return [] // handled by shiftSegments

  const baseSlots = rawDayBaseSlots(date)
  if (!baseSlots.length) return []

  const windows = busyParsed.value
  const result: Array<{ key: string; start: Date; end: Date; hours: number }> = []

  for (const base of baseSlots) {
    // Exact cover → skip whole base slot
    const exactBusy = windows.some(b => eqWindow(base.start, base.end, b.start, b.end))
    if (exactBusy) continue

    const overlapping = windows.filter(b => overlaps({start: base.start, end: base.end}, b))
    const segs = subtractWindows(base.start, base.end, overlapping)
    for (const seg of segs) {
      const hrs = Math.max(0, (seg.end.getTime()-seg.start.getTime())/3600000)
      if (hrs <= 0.0001) continue
      result.push({
        key: `${base.key}-${seg.start.toISOString()}`,
        start: seg.start,
        end: seg.end,
        hours: hrs
      })
    }
  }

  return result
}

/* Date eligibility (allowed if any positive segment remains after trimming) */
function withinScheduleRange(date: Date) {
  const s = scheduleStartDate()
  const e = scheduleEndDate()
  if (!s) return true
  const d = startOfDay(date).getTime()
  if (d < startOfDay(s).getTime()) return false
  if (e && d > endOfDay(e).getTime()) return false
  return true
}

function isAllowed(date: Date): boolean {
  if (!schedule.value) return false
  if (startOfDay(date) < todayStart) return false
  if (selectedStart.value && startOfDay(date) <= selectedStart.value) return false // NEW
  if (!withinScheduleRange(date)) return false
  if (isLeaveDay?.(date)) return false
  return isShift.value
      ? (isShiftOccurrence(date) && shiftSegments(date).length > 0)
      : daySlots(date).length > 0
}

/* Title/Badge */
function titleFor(date: Date) {
  if (!schedule.value) return ''
  if (startOfDay(date) < todayStart) return 'Անցյալ օր'
  if (selectedStart.value && startOfDay(date) <= selectedStart.value) return 'Չի ցուցադրվում՝ ընտրած օրվանից առաջ կամ նույն օրը' // NEW
  if (!withinScheduleRange(date)) return 'Չի մտնում գրաֆիկի միջակայքում'
  if (isLeaveDay(date)) return 'Արձակուրդ • Չի ընտրվում'
  if (isShift.value) {
    if (!isShiftOccurrence(date)) return 'Այս օրը հերթափոխ չի սկսվում (պարբերականություն)'
    const segs = shiftSegments(date)
    if (!segs.length) return 'Չկա հասանելի հատված (զբաղված է տեղափոխություններով)'
    return segs.map(s => `${timeLabel(s.start)}–${timeLabel(s.end)} (${Math.round(s.hours)} ժ.)`).join(' • ')
  } else {
    const slots = daySlots(date)
    if (!slots.length) return 'Չկա հասանելի աշխատանքային ժամ'
    return slots.map(s => `${timeLabel(s.start)}–${timeLabel(s.end)} (${Math.round(s.hours)} ժ.)`).join(' • ')
  }
}
function shortBadge(date: Date) {
  if (isShift.value) return 'Հերթափոխ'
  return 'Աշխ. օր'
}

/* Selection */
const selectedMeta = ref<null | {
  day: string
  shift: boolean
  hours: number | null
  start: Date
  end: Date
}>(null)

function isSelected(d: Date) {
  return props.modelValue === ymd(d)
}
function segKey(seg: {start: Date; end: Date; hours: number}) {
  return `${seg.start.toISOString()}-${seg.end.toISOString()}`
}

function onPick(d: Date) {
  if (startOfDay(d) < todayStart) return
  if (!isAllowed(d) || !schedule.value) return

  const picked = ymd(d)
  let payload: {
    day: string
    shift: boolean
    hours: number | null
    start: Date
    end: Date
    schedule_id: number
    employment_contract_id: number
    employee_id: number
  }

  if (isShift.value) {
    const segs = shiftSegments(d)
    const first = segs[0]
    if (!first) return
    payload = {
      day: picked,
      shift: true,
      hours: Math.round(first.hours),
      start: first.start,
      end: first.end,
      schedule_id: schedule.value.id,
      employment_contract_id: schedule.value.employment_contract_id,
      employee_id: schedule.value.employee_id
    }
  } else {
    const slots = daySlots(d)
    const first = slots[0]
    if (!first) return
    payload = {
      day: picked,
      shift: false,
      hours: Math.round(first.hours),
      start: first.start,
      end: first.end,
      schedule_id: schedule.value.id,
      employment_contract_id: schedule.value.employment_contract_id,
      employee_id: schedule.value.employee_id
    }
  }

  selectedMeta.value = {
    day: payload.day,
    shift: payload.shift,
    hours: payload.hours,
    start: payload.start,
    end: payload.end
  }

  emit('update:modelValue', picked)
  emit('pick', payload)
}

/* Request busy-windows for current month (parent fetches and passes via :busy) */
function requestBusyForMonth() {
  if (!schedule.value) return
  emit('request-busy', {
    start: ymd(startOfDay(monthStart.value)),
    end: ymd(endOfDay(monthEnd.value)),
    employee_id: schedule.value.employee_id
  })
}

onMounted(() => { requestBusyForMonth() })
watch([() => props.schedule, monthStart, monthEnd], () => {
  // invalidate selection if becomes disallowed
  if (props.modelValue) {
    const dt = new Date(props.modelValue)
    if (!isAllowed(dt)) {
      emit('update:modelValue', null)
      selectedMeta.value = null
    }
  }
  requestBusyForMonth()
})
</script>

<style scoped>
/* No external styles required; Tailwind classes used */
</style>
