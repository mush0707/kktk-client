<!-- src/views/hr/modals/HireEmployeeModal.vue -->
<template>
  <div class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/40" @click="$emit('close')"></div>

    <div
        class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl bg-white rounded-2xl shadow-xl">
      <!-- Header -->
      <div class="flex items-center justify-between px-5 py-4 border-b">
        <h3 class="text-lg font-semibold">
          {{ $t('employment_contract') }}
        </h3>
        <button class="p-2 rounded-lg hover:bg-gray-100" @click="$emit('close')" aria-label="Close">✕</button>
      </div>

      <!-- Body -->
      <div class="p-5 space-y-6 text-sm max-h-[75vh] overflow-y-auto">
        <!-- Contract -->
        <section class="grid md:grid-cols-3 gap-4">
          <div class="md:col-span-1 flex flex-col gap-2">
            <label class="text-sm text-gray-600">{{ $t('work_time_type') || 'Աշխ. ժամերի տեսակ' }} <span
                class="text-red-600">*</span></label>
            <select v-model="form.contract.work_time_type" class="w-full px-3 py-2 rounded-xl border border-gray-300">
              <option value="full">{{ $t('full') || 'Լրիվ' }}</option>
              <option value="part">{{ $t('part') || 'Կիսա' }}</option>
              <option value="shift">{{ $t('shift') || 'Փուլի' }}</option>
            </select>
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-sm text-gray-600">{{ $t('start_date') || 'Սկիզբ' }} <span
                class="text-red-600">*</span></label>
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

          <div class="flex flex-col gap-2">
            <label class="text-sm text-gray-600">{{ $t('base_rate') || 'Դրույք/աշխ.' }}</label>
            <input v-model.number="form.contract.base_rate" type="number" step="0.01"
                   class="w-full px-3 py-2 rounded-xl border border-gray-300"/>
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm text-gray-600">{{ $t('currency') || 'Արժույթ' }}</label>
            <select disabled v-model="form.contract.currency"
                    class="w-full px-3 py-2 rounded-xl border border-gray-300">
              <option value="AMD">AMD</option>
            </select>
          </div>
        </section>

        <!-- Work Schedule (Preset select + auto-fill) -->
        <section class="space-y-3">
          <div class="font-medium">{{ $t('work_schedule') || 'Աշխատաժամերի գրաֆիկ' }}</div>

          <div class="border rounded-xl p-4 bg-gray-50 grid md:grid-cols-2 gap-4">
            <div class="md:col-span-2">
              <label class="text-sm text-gray-600">Գրաֆիկ <span class="text-red-600">*</span></label>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                <select v-model="presetKey" @change="applyPreset"
                        class="w-full px-3 py-2 rounded-xl border border-gray-300">
                  <option :value="''" disabled>{{ $t('select') || 'Ընտրել' }}</option>
                  <option v-for="opt in filteredPresets" :key="opt.key" :value="opt.key">
                    {{ opt.label }}
                  </option>
                  <option v-if="form.contract.work_time_type === 'part'" :selected="true" value="custom">+ Այլ</option>
                  <option v-else value="custom">+ Այլ</option>
                </select>
                <input
                    v-model.trim="form.schedule.name"
                    :disabled="presetKey !== 'custom'"
                    class="w-full px-3 py-2 rounded-xl border border-gray-300 disabled:bg-gray-100"
                    placeholder="օր.՝ 5-օրյա 8 ժամ / 24/48"
                />
              </div>
              <p v-if="showRequired && !form.schedule.name" class="text-xs text-red-600">
                {{ $t('field_required') || 'Պարտադիր դաշտ' }}</p>
            </div>

            <!-- Summed -->
            <div>

              <div class="mt-2 space-y-2">
                <label class="text-sm text-gray-600">{{ $t('period_days') }} <span class="text-red-600">*</span></label>
                <input type="number" min="1" v-model.number="form.schedule.period_days"
                       class="w-full px-3 py-2 rounded-xl border border-gray-300" placeholder="օր.՝ 30 կամ 90"/>
                <p v-if="showRequired && (!form.schedule.period_days || form.schedule.period_days < 1)"
                   class="text-xs text-red-600">
                  {{ $t('enter_valid_value') || 'Մուտքագրեք ճիշտ արժեք' }}
                </p>
                <p class="text-[11px] text-gray-500">
                  {{ $t('sum_accounting_hint') || 'Գումարային հաշվառում՝ նորման հաշվարկային շրջանի կտրվածքով' }}</p>
              </div>
            </div>

            <!-- Pattern (non-summed) -->
          </div>

          <!-- Assignment info (no extra dates) -->
          <div class="rounded-xl border p-3 bg-white text-[13px] text-slate-600">
            {{ $t('assignment_info') || 'Գրաֆիկը ավտոմատ կկցվի աշխատողին պայմանագրի օրերով' }}:
            <span class="px-1.5 py-0.5 rounded bg-gray-100 ml-1">{{ form.contract.start_date || '—' }}</span>
            →
            <span class="px-1.5 py-0.5 rounded bg-gray-100">{{ form.contract.end_date || '—' }}</span>
          </div>
        </section>

        <!-- Leave Types (multi-select) -->
        <section class="space-y-3">
          <div class="flex items-center justify-between">
            <div class="font-medium">{{ $t('leave_types') || 'Անհասանելիքի տեսակներ' }}</div>
            <div class="text-xs text-slate-500" v-if="selectedLeaveTypeIds.length">
              {{ selectedLeaveTypeIds.length }} {{ $t('selected') || 'ընտրված' }}
            </div>
          </div>

          <div class="border rounded-xl p-4 bg-gray-50 space-y-3">
            <!-- Chips (selected) -->
            <div v-if="selectedLeaveTypeIds.length" class="flex flex-wrap gap-2">
              <button
                  v-for="lt in selectedLeaveTypeIds.map(id => leaveTypesMap[id]).filter(Boolean)"
                  :key="lt.id"
                  type="button"
                  class="flex items-center gap-1 px-2 py-1 rounded-full bg-white border text-xs hover:bg-gray-50"
                  @click="toggleLeaveType(lt.id)"
              >
                <span>{{ lt.name }}</span>
                <span class="text-slate-400">✕</span>
              </button>
            </div>

            <!-- Search + Actions -->
            <div class="flex flex-col md:flex-row gap-2">
              <input
                  v-model.trim="leaveSearch"
                  class="w-full px-3 py-2 rounded-xl border border-gray-300"
                  :placeholder="$t('search_placeholder') || 'Որոնել տեսակով…'"
              />
              <div class="flex gap-2">
                <button type="button"
                        class="px-3 py-2 rounded-xl border hover:bg-gray-50"
                        @click="selectAllFiltered"
                        :disabled="!filteredLeaveTypes.length">
                  {{ $t('select_all') || 'Նշել բոլորը' }}
                </button>
                <button type="button"
                        class="px-3 py-2 rounded-xl border hover:bg-gray-50"
                        @click="clearAll">
                  {{ $t('clear') || 'Մաքրել' }}
                </button>
              </div>
            </div>

            <!-- List -->
            <div class="max-h-56 overflow-auto rounded-lg border bg-white">
              <div v-if="!filteredLeaveTypes.length" class="p-3 text-sm text-slate-500">
                {{ $t('nothing_found') || 'Ցուցակը դատարկ է' }}
              </div>
              <label v-for="lt in filteredLeaveTypes" :key="lt.id"
                     class="flex items-center gap-2 px-3 py-2 border-b last:border-b-0 hover:bg-gray-50">
                <input type="checkbox"
                       class="rounded"
                       :value="lt.id"
                       :checked="selectedLeaveTypeIds.includes(lt.id)"
                       @change="toggleLeaveType(lt.id)">
                <span class="text-sm">{{ lt.name }}</span>
              </label>
            </div>

            <p v-if="showRequired && leaveTypesRequired && !selectedLeaveTypeIds.length"
               class="text-xs text-red-600">
              {{ $t('field_required') || 'Պարտադիր դաշտ' }}
            </p>
          </div>
        </section>

        <!-- Documents (optional typed) -->
        <section v-if="docTypes.length" class="space-y-4">
          <div class="font-medium">{{ $t('documents') || 'Փաստաթղթեր' }}</div>
          <div v-for="t in docTypes" :key="t.id" class="border border-gray-300 rounded-xl p-4">
            <div class="mb-2 flex items-center gap-2">
              <span class="font-medium">{{ t.name }}</span>
              <span v-if="t.required" class="text-red-600 text-xs">★ {{ $t('required') || 'պարտադիր' }}</span>
            </div>
            <input type="file" :accept="fileAccept" multiple @change="e => onFilesByType(t.id, e)"
                   class="w-full px-3 py-2 rounded-xl border border-gray-500"/>
            <p v-if="showRequired && t.required && !(uploads[t.id]?.length)" class="text-xs text-red-600 mt-1">
              {{ $t('required') || 'Պարտադիր է' }}
            </p>
          </div>
        </section>

      </div>

      <!-- Footer -->
      <div class="p-4 border-t flex items-center justify-end gap-2">
        <button class="px-3 py-2 rounded-xl border hover:bg-gray-50" @click="$emit('close')" :disabled="saving">
          {{ $t('cancel') || 'Չեղարկել' }}
        </button>
        <button class="px-3 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                :disabled="saving || !canSubmit"
                @click="submit">
          <span v-if="saving">{{ $t('saving') || 'Պահպանում…' }}</span>
          <span v-else>{{ $t('hire') || 'Ընդունել աշխատանքի' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, onMounted, reactive, ref, watch} from 'vue'
import VueDatePicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import {contractsApi, leaveTypeApi} from '@/api.ts'

const props = defineProps<{ employee: any }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'saved', payload?: any): void }>()
const leaveTypes = ref([])

/* Presets (editable to your taste) */
const schedulePresets = [
  {
    key: '5x8',
    label: '5-օրյա 8 ժամ',
    is_sum_accounting: false,
    period_days: null,
    patternMap: {1: 8, 2: 8, 3: 8, 4: 8, 5: 8, 6: 0, 7: 0},
  },
  {
    key: '6x7',
    label: '6-օրյա 7 ժամ',
    is_sum_accounting: false,
    period_days: null,
    patternMap: {1: 7, 2: 7, 3: 7, 4: 7, 5: 7, 6: 7, 7: 0},
  },
  {
    key: '24_48',
    label: '24/48 (գումարային)',
    is_sum_accounting: false,
    period_days: 30, // փոփոխիր ըստ կանոնների՝ 30/60/90
    patternMap: null, // pattern չի պետք գումարայինի դեպքում
  },
  {
    key: '12_12',
    label: '12/12 (գումարային)',
    is_sum_accounting: false,
    period_days: 30,
    patternMap: null,
  },
]

const presetKey = ref<string>('')

const filteredPresets = computed(() => {
  if (form.contract.work_time_type === 'full') {
    return schedulePresets.filter(p => p.key === '5x8' || p.key === '6x7')
  } else if (form.contract.work_time_type === 'shift') {
    return schedulePresets.filter(p => p.key === '24_48' || p.key === '12_12')
  } else if (form.contract.work_time_type === 'part') {
    return [] // only allow custom
  }
  return []
})
/* Form */
const form = reactive({
  contract: {
    start_date: '' as string,
    end_date: '' as string | '',
    work_time_type: 'full',
    base_rate: null as number | null,
    currency: 'AMD',
    status: 'active'
  },
  schedule: {
    name: '' as string,
    is_sum_accounting: false,
    period_days: null as number | null,
    patternMap: {1: 8, 2: 8, 3: 8, 4: 8, 5: 8, 6: 0, 7: 0} as Record<number, number>
  }
})

/* Apply preset */
function applyPreset() {
  const p = schedulePresets.find(x => x.key === presetKey.value)
  if (!p) {
    // custom
    form.schedule.name = ''
    return
  }
  form.schedule.name = p.label
  form.schedule.is_sum_accounting = p.is_sum_accounting
  form.schedule.period_days = p.period_days as any
  if (p.patternMap) {
    form.schedule.patternMap = {...p.patternMap}
  } else {
    // if summed, clear any previous pattern
    form.schedule.patternMap = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0}
  }
}

/* Doc types & uploads */
const fileAccept = '.pdf,image/*'
const docTypes = ref<Array<{ id: number; name: string; required: boolean }>>([])
const uploads = ref<Record<number, File[]>>({})

// Watch work_time_type to auto-select presetKey
watch(() => form.contract.work_time_type, (newType) => {
  if (newType === 'part') {
    presetKey.value = 'custom'
    applyPreset() // reset form.schedule fields for custom
  } else {
    presetKey.value = '' // reset for full/shift
    applyPreset()
  }
})

function onFilesByType(typeId: number, e: Event) {
  const files = Array.from((e.target as HTMLInputElement).files || [])
  uploads.value = {...uploads.value, [typeId]: files}
}

/* UI */
const showRequired = ref(false)
const saving = ref(false)

/* Helpers */
const DOW = ['Երկ', 'Երք', 'Չրք', 'Հնգ', 'Ուր', 'Շբթ', 'Կիր']

function displayDate(d: Date) {
  if (!d) return ''
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const weeklyHours = computed(() => [1, 2, 3, 4, 5, 6, 7].reduce((s, d) => s + Number(form.schedule.patternMap[d] || 0), 0))

/* Validation */
const dateError = computed(() => {
  if (!form.contract.start_date || !form.contract.end_date) return ''
  return (form.contract.end_date < form.contract.start_date) ? 'Ավարտը պետք է լինի Սկզբից հետո' : ''
})
const patternError = computed(() => {
  if (form.schedule.is_sum_accounting) return ''
  const anyPositive = [1, 2, 3, 4, 5, 6, 7].some(d => Number(form.schedule.patternMap[d] || 0) > 0)
  if (!anyPositive) return 'Նշեք գոնե մեկ օրվա ժամ'
  if (weeklyHours.value > 84) return 'Շաբաթական ժամերը վտանգավոր բարձր են'
  return ''
})
const requiredDocsOk = computed(() => docTypes.value
    .filter(t => t.required)
    .every(t => (uploads.value[t.id]?.length || 0) > 0)
)


/* Submit — creates contract, schedule, and links schedule to employee for the contract dates */
async function submit() {
  showRequired.value = true
  if (!canSubmit.value) return

  saving.value = true

  const payload: any = {
    employee_id: props.employee.id,
    department_id: props.employee.department_id,
    role_id: props.employee.role_id,
    contract: {
      start_date: form.contract.start_date,
      end_date: form.contract.end_date || null,
      work_time_type: form.contract.work_time_type,
      base_rate: form.contract.base_rate,
      currency: form.contract.currency,
      status: form.contract.status,
      // NEW: selected leave types
      leave_type_ids: selectedLeaveTypeIds.value
    },
    work_schedule: {
      name: form.schedule.name,
      is_sum_accounting: true,
      period_days: form.schedule.period_days,
      pattern: null
    },
    work_scheduling: {
      start_date: form.contract.start_date,
      end_date: form.contract.end_date || null
    }
  }

  const created = await contractsApi.create(payload)

  for (const t of docTypes.value) {
    const files = uploads.value[t.id] || []
    for (const f of files) {
      const fd = new FormData()
      fd.append('type_id', String(t.id))
      fd.append('documents[]', f)
      await contractsApi.uploadDocument(created.data.id, fd)
    }
  }

  emit('saved', created)
  emit('close')
  saving.value = false
}

/* Load doc types */
async function loadDocTypes() {
  try {
    const r = await contractsApi.getDocTypes?.()
    const list = (r?.data ?? r ?? []).map((d: any) => ({
      id: d.id,
      name: d.name,
      required: !!(d.required ?? d.pivot?.required)
    }))
    docTypes.value = list
  } catch {
    docTypes.value = []
  }
}

const getLeaveTypes = async () => {
  try {
    const data = await leaveTypeApi.list()
    leaveTypes.value = data?.data ?? data ?? []
  } catch (e) {
    console.log(e);
  }
}


onMounted(async () => {
  await loadDocTypes()
  await getLeaveTypes()
})


// --- add these refs/computeds near other refs ---
const selectedLeaveTypeIds = ref<number[]>([])
const leaveSearch = ref<string>('')

// if you ever want to make selection mandatory, set to true:
const leaveTypesRequired = false

const leaveTypesMap = computed<Record<number, any>>(() => {
  const map: Record<number, any> = {}
  ;(leaveTypes.value || []).forEach((x: any) => {
    if (x?.id) map[x.id] = x
  })
  return map
})

const filteredLeaveTypes = computed(() => {
  const q = (leaveSearch.value || '').toLowerCase().trim()
  const list = (leaveTypes.value || [])
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

function selectAllFiltered() {
  const ids = filteredLeaveTypes.value.map((x: any) => x.id).filter(Boolean)
  const set = new Set<number>(selectedLeaveTypeIds.value)
  ids.forEach(id => set.add(id))
  selectedLeaveTypeIds.value = Array.from(set)
}

function clearAll() {
  selectedLeaveTypeIds.value = []
}

// --- adjust canSubmit if you make leave types required ---
const canSubmit = computed(() => {
  const base =
      !!form.contract.work_time_type &&
      !!form.contract.start_date &&
      !dateError.value &&
      !!form.schedule.name &&
      (form.schedule.is_sum_accounting ? !!form.schedule.period_days : !patternError.value)

  const leaveOk = leaveTypesRequired ? selectedLeaveTypeIds.value.length > 0 : true
  return base && requiredDocsOk.value && leaveOk
})

// --- include leave types in payload (inside submit()) ---

</script>
