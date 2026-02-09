<template>
  <div class="border border-gray-300 rounded-2xl bg-white">
    <!-- Top bar -->
    <div class="flex items-center justify-between px-4 py-2 border-b">
      <div class="flex items-center gap-2">
        <div class="text-sm text-slate-600" v-if="initialPicked">
          Մեկնարկ — <b>{{ formatDateTime(initialPicked) }}</b>
        </div>
        <div class="text-sm text-amber-700" v-else>
          Ընտրեք մեկնարկային օրը և ժամը
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button class="px-2 py-1 rounded-lg border" @click="prevMonth" aria-label="Prev">‹</button>
        <div class="text-sm font-medium">{{ monthLabel }}</div>
        <button class="px-2 py-1 rounded-lg border" @click="nextMonth" aria-label="Next">›</button>
      </div>
    </div>

    <!-- Controls -->
    <div class="flex flex-wrap items-center gap-3 px-4 py-3 border-b">
      <div class="flex items-center gap-2">
        <label class="text-sm text-slate-600">Սկիզբ (ժամ)</label>
        <input type="time" v-model="startTimeStr" class="px-2 py-1 rounded-lg border" />
      </div>
      <div class="text-xs text-slate-500">
        Շարքն ավտոմատ կկազմվի ամեն {{ shiftPeriodicity }} ժամը մեկ՝ հերթափոխ՝ {{ shiftHours }} ժ:
      </div>
    </div>

    <div class="px-4 py-2">
      <!-- Legend -->
      <div class="ml-auto flex items-center gap-3 text-xs text-slate-600">
        <span class="inline-flex items-center gap-1">
          <span class="inline-block w-2.5 h-2.5 rounded bg-emerald-500"></span> Տվյալ աշխատակցի հերթափոխը
        </span>
        <span class="inline-flex items-center gap-1">
          <span class="inline-block w-2.5 h-2.5 rounded bg-indigo-500"></span> Տվյալ հաստիքում ակտիվ աշխատակիցների հերթափոխներ
        </span>
<!--        <span class="inline-flex items-center gap-1">-->
<!--          <span class="inline-block w-2.5 h-2.5 rounded bg-emerald-300"></span> Ակտիվ գրաֆիկ (նույն աշխատողը)-->
<!--        </span>-->
      </div>
    </div>

    <!-- Calendar grid -->
    <div class="p-4">
      <div class="grid grid-cols-7 text-xs text-slate-500 mb-1">
        <div v-for="d in WEEKDAYS" :key="d" class="text-center">{{ d }}</div>
      </div>
      <div class="grid grid-cols-7 gap-1">
        <div
            v-for="cell in cells"
            :key="cell.key"
            class="h-28 p-1 rounded-lg border hover:bg-slate-50 cursor-pointer relative"
            :class="{
            'opacity-40': cell.outside,
            'ring-2 ring-emerald-300': isSameDate(cell.date, initialPicked)
          }"
            @click="onPickDay(cell.date)"
        >
          <div class="flex items-center justify-between">
            <span class="text-[11px] text-slate-600">{{ cell.date.getDate() }}</span>
            <span
                v-if="isBounded(cell.date)"
                class="text-[10px] px-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200"
            >թույլատր.</span
            >
          </div>

          <!-- your generated plan for that day -->
          <ul class="mt-1 space-y-1 overflow-y-auto max-h-[80px]">
            <li
                v-for="ev in eventsSelfByDay(cell.date)"
                :key="ev.key"
                class="text-[11px] px-1.5 py-0.5 border rounded bg-emerald-50 border-emerald-200 text-emerald-800"
                title="Ձեր հերթափոխը"
            >
              {{ timeLabel(ev.start) }}–{{ timeLabel(ev.end) }}
            </li>

            <!-- peers (green if isSelf) -->
            <li
                v-for="pev in eventsPeersByDay(cell.date)"
                :key="pev.key"
                class="text-[11px] px-1.5 py-0.5 border rounded"
                :class="pev.isSelf
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-indigo-50 border-indigo-200 text-indigo-800'"
                :title="peerTitle(pev.peerIdx, pev.isSelf)"
            >
              {{ timeLabel(pev.start) }}–{{ timeLabel(pev.end) }}
              <span class="opacity-60">— {{ peerName(pev.peerIdx, pev.isSelf) }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

type PeerRow = {
  shift: number | boolean
  shift_hours: number | null
  shift_periodicity: number | null
  start_date: string | null
  start_time: string | null
  end_date: string | null
  // Optional extras (from parent)
  employee_id?: number | null | string
  isSelf?: boolean
  color?: string
  // For showing the name: contract.employee.first_name + " " + contract.employee.last_name
  contract?: {
    employee?: {
      first_name?: string | null
      last_name?: string | null
    } | null
  } | null
}

type Ev = { start: Date; end: Date; key: string }
type EvPeer = Ev & { peerIdx: number; isSelf?: boolean; color?: string }

const props = withDefaults(
    defineProps<{
      mode?: 'shift' | 'pattern'
      startDate: string | Date | null
      endDate?: string | Date | ''
      shiftHours: number
      shiftPeriodicity: number
      existing?: PeerRow[]
      /** if provided and existing rows have employee_id, matching rows are considered "self" */
      selfEmployeeId?: number | null
      /** when true, do NOT render peers that match self (old active self graph) */
      hideSelfPeers?: boolean
    }>(),
    {
      mode: 'shift',
      endDate: '',
      selfEmployeeId: null,
      hideSelfPeers: true
    }
)

const emit = defineEmits<{
  (e: 'built', payload: { built: boolean; plan: Array<{ start: string; end: string }> }): void
  (e: 'save', payload: { plan: Array<{ start: string; end: string }> }): void
}>()

const WEEKDAYS = ['Երկ', 'Երք', 'Չրք', 'Հնգ', 'Ուր', 'Շբթ', 'Կիր']

// calendar state
const viewYear = ref<number>(new Date().getFullYear())
const viewMonth = ref<number>(new Date().getMonth()) // 0-11
const initialPicked = ref<Date | null>(null)
const startTimeStr = ref('09:00')

const monthLabel = computed(() =>
    new Date(viewYear.value, viewMonth.value, 1).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long'
    })
)

function toDate(v: string | Date | null | undefined): Date | null {
  if (!v) return null
  if (v instanceof Date) return v
  const s = String(v)
  if (!s) return null
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  const dt = new Date(s)
  return Number.isNaN(+dt) ? null : dt
}

const startBound = computed<Date | null>(() => toDate(props.startDate))
const endBound = computed<Date | null>(() => toDate(props.endDate || null))

function clampToBounds(dt: Date): boolean {
  const s = startBound.value
  const e = endBound.value
  if (s && dt < startOfDay(s)) return false
  if (e && dt > endOfDay(e)) return false
  return true
}

function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}
function endOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

function isSameDate(a: Date | null, b: Date | null): boolean {
  if (!a || !b) return false
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function isBounded(d: Date): boolean {
  return clampToBounds(d)
}

const cells = computed(() => {
  const first = new Date(viewYear.value, viewMonth.value, 1)
  const start = new Date(first)
  const startWeekday = (first.getDay() + 6) % 7 // Monday=0
  start.setDate(first.getDate() - startWeekday)

  const list: Array<{ key: string; date: Date; outside: boolean }> = []
  for (let i = 0; i < 42; i++) {
    const day = new Date(start)
    day.setDate(start.getDate() + i)
    list.push({
      key: day.toISOString().slice(0, 10),
      date: day,
      outside: day.getMonth() !== viewMonth.value
    })
  }
  return list
})

function prevMonth() {
  const m = viewMonth.value - 1
  if (m < 0) {
    viewMonth.value = 11
    viewYear.value -= 1
  } else {
    viewMonth.value = m
  }
}
function nextMonth() {
  const m = viewMonth.value + 1
  if (m > 11) {
    viewMonth.value = 0
    viewYear.value += 1
  } else {
    viewMonth.value = m
  }
}

function parseTimeStr(s: string): { h: number; m: number } {
  const [hh, mm] = (s || '09:00').split(':').map(n => Number(n))
  const h = Number.isFinite(hh) ? hh : 9
  const m = Number.isFinite(mm) ? mm : 0
  return { h, m }
}

function onPickDay(d: Date) {
  if (!isBounded(d)) return
  const { h, m } = parseTimeStr(startTimeStr.value)
  const picked = new Date(d)
  picked.setHours(h, m, 0, 0)
  if (!clampToBounds(picked)) return
  initialPicked.value = picked
  rebuildPlan()
}

/* ───────── Your plan ───────── */
const plan = ref<Ev[]>([])

function addHours(dt: Date, hrs: number) {
  const x = new Date(dt)
  x.setHours(x.getHours() + hrs)
  return x
}

function rebuildPlan() {
  plan.value = []
  const start = initialPicked.value
  if (!start) {
    emit('built', { built: false, plan: [] })
    return
  }

  const hours = Number(props.shiftHours || 0)
  const period = Number(props.shiftPeriodicity || 0)
  if (!hours || !period) {
    emit('built', { built: false, plan: [] })
    return
  }

  const until = endBound.value ? endOfDay(endBound.value) : addHours(start, 24 * 60)
  let cur = new Date(start)

  while (cur <= until) {
    const end = addHours(cur, hours)
    if (clampToBounds(cur) && clampToBounds(end)) {
      plan.value.push({ start: new Date(cur), end, key: `self-${cur.toISOString()}` })
    }
    cur = addHours(cur, period)
  }

  emit('built', { built: plan.value.length > 0, plan: serializePlan(plan.value) })
}

/* ───────── Peers plan (from existing[]) ───────── */
const peerPlans = ref<EvPeer[]>([])

function parsePeerAnchor(p: PeerRow): Date | null {
  if (p.start_time) {
    const t = new Date(p.start_time.replace(' ', 'T'))
    if (!Number.isNaN(+t)) return t
  }
  if (p.start_date) {
    const { h, m } = parseTimeStr('09:00')
    const d = toDate(p.start_date)
    if (d) {
      const x = new Date(d)
      x.setHours(h, m, 0, 0)
      return x
    }
  }
  return null
}

function fullNameFromPeer(row?: PeerRow): string {
  const fn = (row?.contract?.employee?.first_name ?? '').toString().trim()
  const ln = (row?.contract?.employee?.last_name ?? '').toString().trim()
  const name = [fn, ln].filter(Boolean).join(' ')
  return name
}

function peerName(idx: number, isSelf?: boolean) {
  const row = (props.existing || [])[idx]
  const name = fullNameFromPeer(row)
  return name
}

function rebuildPeers() {
  peerPlans.value = []
  const peers = props.existing || []

  const windowEnd = endBound.value
      ? endOfDay(endBound.value)
      : (() => {
        const anchor = startBound.value || new Date(viewYear.value, viewMonth.value, 1)
        return addHours(anchor, 24 * 60)
      })()

  peers.forEach((row, idx) => {
    const isShift = row.shift === true || Number(row.shift ?? 0) === 1
    if (!isShift) return
    const hours = Number(row.shift_hours || 0)
    const period = Number(row.shift_periodicity || 0)
    const anchor = parsePeerAnchor(row)
    if (!anchor || !hours || !period) return

    // Detect "self" peer row: explicit flag OR by employee_id equality
    const rowIsSelf =
        (row as any).isSelf === true ||
        (props.selfEmployeeId != null &&
            row.employee_id != null &&
            Number(row.employee_id) === Number(props.selfEmployeeId))

    // If we're editing this employee, don't render their old active schedule from peers
    if (rowIsSelf && props.hideSelfPeers) return

    const until = windowEnd
    let cur = new Date(anchor)
    const peerEndBound = row.end_date ? endOfDay(new Date(row.end_date)) : null

    while (cur <= until) {
      const end = addHours(cur, hours)
      const withinSelfBounds = !peerEndBound || end <= peerEndBound
      if (clampToBounds(cur) && clampToBounds(end) && withinSelfBounds) {
        peerPlans.value.push({
          start: new Date(cur),
          end,
          key: `peer-${idx}-${cur.toISOString()}`,
          peerIdx: idx,
          isSelf: rowIsSelf,
          color: rowIsSelf ? '#22c55e' : (row as any).color || '#6366f1'
        })
      }
      cur = addHours(cur, period)
    }
  })
}

function serializePlan(list: Ev[]) {
  return list.map(ev => ({
    start: ev.start.toISOString(),
    end: ev.end.toISOString()
  }))
}

/* per-day getters */
function eventsSelfByDay(d: Date) {
  const s = startOfDay(d).getTime()
  const e = endOfDay(d).getTime()
  return plan.value.filter(ev => {
    const t = ev.start.getTime()
    return t >= s && t <= e
  })
}
function eventsPeersByDay(d: Date) {
  const s = startOfDay(d).getTime()
  const e = endOfDay(d).getTime()
  return peerPlans.value.filter(ev => {
    const t = ev.start.getTime()
    return t >= s && t <= e
  })
}

/* small helpers for UI */
function timeLabel(d: Date) {
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}
function formatDateTime(d: Date | null) {
  if (!d) return ''
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
function peerTitle(idx: number, isSelf?: boolean) {
  const r = (props.existing || [])[idx]
  const h = r?.shift_hours ?? '—'
  const p = r?.shift_periodicity ?? '—'
  const name = fullNameFromPeer(r)
  const who = isSelf ? (name ? `Ձեր ակտիվ գրաֆիկ — ${name}` : 'Ձեր ակտիվ գրաֆիկ') : (name || `Գործակից #${idx + 1}`)
  return `${who} • ${h}ժ / ${p}ժ`
}

/* watchers & lifecycle */
watch(() => [props.startDate, props.endDate], () => {
  const s = startBound.value
  if (s) {
    viewYear.value = s.getFullYear()
    viewMonth.value = s.getMonth()
  }
  rebuildPlan()
  rebuildPeers()
})

watch(() => [props.shiftHours, props.shiftPeriodicity], () => {
  rebuildPlan()
})

watch(
    () => [props.existing, props.selfEmployeeId, props.hideSelfPeers],
    () => {
      rebuildPeers()
    },
    { deep: true }
)

onMounted(() => {
  const s = startBound.value
  if (s) {
    viewYear.value = s.getFullYear()
    viewMonth.value = s.getMonth()
  }
  // preselect contract start day with default time
  if (s) {
    const { h, m } = parseTimeStr(startTimeStr.value)
    const picked = new Date(s)
    picked.setHours(h, m, 0, 0)
    if (clampToBounds(picked)) {
      initialPicked.value = picked
    }
  }
  rebuildPlan()
  rebuildPeers()
})

watch(startTimeStr, () => {
  if (!initialPicked.value) return
  const { h, m } = parseTimeStr(startTimeStr.value)
  const d = new Date(initialPicked.value)
  d.setHours(h, m, 0, 0)
  if (!clampToBounds(d)) return
  initialPicked.value = d
  rebuildPlan()
})

function emitSave() {
  emit('save', { plan: serializePlan(plan.value) })
}
</script>
