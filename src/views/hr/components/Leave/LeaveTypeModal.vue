<template>
  <div v-if="open" class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/40" @click="$emit('close')"></div>
    <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-xl">
      <div class="flex items-center justify-between px-5 py-4 border-b">
        <h3 class="text-lg font-semibold">
          {{ isEdit ? 'Փոփոխել արձակուրդի տեսակը' : 'Ստեղծել արձակուրդի տեսակը' }}
        </h3>
        <button class="p-2 rounded-lg hover:bg-gray-100" @click="$emit('close')" aria-label="Close">✕</button>
      </div>

      <div class="p-5 space-y-6">
        <!-- Form fields -->
        <div class="grid gap-4">
          <!-- Mode -->
          <div class="flex flex-col gap-y-2">
            <label class="text-sm text-gray-600">Ռեժիմ <span class="text-red-600">*</span></label>
            <select disabled class="w-full px-3 py-2 rounded-xl border border-gray-300">
              <option value="days_countdown" selected>Օրերի Հետհաշվարկով</option>
            </select>
          </div>

          <!-- Name -->
          <div class="flex flex-col gap-y-2">
            <label class="text-sm text-gray-600">Անուն <span class="text-red-600">*</span></label>
            <input v-model.trim="form.name" class="w-full px-3 py-2 rounded-xl border border-gray-300" placeholder="օր. Տարեկան արձակուրդ"/>
          </div>

          <!-- Days (only for days_countdown) -->
          <div v-if="form.mode==='days_countdown'" class="flex flex-col gap-y-2">
            <label class="text-sm text-gray-600">Օրերի քանակ <span class="text-red-600">*</span></label>
            <input v-model.number="form.days" type="number" min="1" class="w-full px-3 py-2 rounded-xl border border-gray-300"/>
          </div>

          <!-- Public holidays extras -->
          <template v-if="form.mode==='public_holidays'">
            <!-- specific_year -->
            <div class="flex flex-col gap-y-2">
              <label class="text-sm text-gray-600">Տարը <span class="text-red-600">*</span></label>
              <select v-model.number="form.specific_year" @change="onYearChange" class="w-full px-3 py-2 rounded-xl border border-gray-300">
                <option :value="undefined">Ընտրեք…</option>
                <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
              </select>
            </div>

            <!-- holiday (VueSelect) -->
            <div class="flex flex-col gap-y-2">
              <label class="text-sm text-gray-600">Տոն (holidays) <span class="text-red-600">*</span></label>

              <VueSelect
                  v-model="selectedHoliday"
                  @search="fetchHolidays"
                  :filterable="false"
                  :loading="holidaysLoading"
                  :is-searchable="true"
                  :get-option-label="o => o?.name ?? ''"
                  :get-option-value="o => o?.id"
                  :is-multi="false"
                  :options="holidays"
                  :placeholder="'Ընտրեք տոնը…'"
                  :noResults="'Արդյունք չի գտնվել'"
              >
                <template #no-options>Արդյունք չի գտնվել</template>
                <template #option="{ option }">
                  <div class="flex items-center gap-2">
                    <span class="font-medium">{{ option.name }}</span>
                    <span v-if="option.fixed_day" class="text-xs text-slate-500">({{ option.fixed_day }})</span>
                  </div>
                </template>
              </VueSelect>
              <p class="text-xs text-slate-500" v-if="!form.specific_year">
                Նախ ընտրեք տարին՝ ճիշտ ցուցակ ստանալու համար։
              </p>
            </div>
          </template>

          <!-- Months after contract start -->
          <div class="flex flex-col gap-y-2">
            <label class="text-sm text-gray-600">{{$t('months_after_contract_start')}} <span class="text-red-600">*</span></label>
            <input v-model.number="form.months_after_contract_start" type="number" min="1" class="w-full px-3 py-2 rounded-xl border border-gray-300"/>
          </div>

          <!-- Affects balance -->
          <div class="flex flex-col gap-y-2">
            <label class="text-sm text-gray-600">{{$t('affects_balance')}} <span class="text-red-600">*</span></label>
            <select v-model="form.affects_balance" class="w-full px-3 py-2 rounded-xl border border-gray-300">
              <option :value="true">Այո</option>
              <option :value="false">Ոչ</option>
            </select>
          </div>
        </div>

        <div v-if="formError" class="rounded-xl border border-red-200 bg-red-50 text-red-800 p-2 text-sm">
          {{ formError }}
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end gap-2 pt-2 border-t">
          <button class="px-3 py-2 rounded-xl border hover:bg-gray-50" @click="$emit('close')">Փակել</button>
          <button class="px-3 py-2 rounded-xl text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50" :disabled="saving" @click="submit">
            {{ isEdit ? 'Պահպանել' : 'Ստեղծել' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import VueSelect from "vue3-select-component";

import { leaveTypeApi, holidaysApi } from '@/api.ts' // make sure holidaysApi exists

type Holiday = { id: number; name: string; fixed_day?: string | null }
type LeaveType = any

const props = defineProps<{
  open: boolean
  modelValue?: LeaveType | null
}>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'saved'): void }>()

const isEdit = computed(() => !!props.modelValue?.id)

// fixed years_count = 1 (removed from UI)
const form = ref<{
  name: string
  mode: 'days_countdown' | 'public_holidays'
  days: number | null
  specific_year?: number | undefined
  holiday_id?: number | null
  months_after_contract_start: number
  affects_balance: boolean
}>({
  name: '',
  mode: 'days_countdown',
  days: 24,
  specific_year: undefined,
  holiday_id: null,
  months_after_contract_start: 6,
  affects_balance: true,
})

const formError = ref('')
const saving = ref(false)

// years for dropdown (next year down to -4)
const years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() + 1 - i)

// holidays select state
const holidays = ref<Holiday[]>([])
const holidaysLoading = ref(false)
const selectedHoliday = ref<Holiday | null>(null)
let holidaysSearchTerm = ''

async function fetchHolidays(search = '') {
  holidaysSearchTerm = search
  if (!form.value.specific_year) { holidays.value = []; return }
  holidaysLoading.value = true
  try {
    const res = await holidaysApi.list({
      limit: 20,
      offset: 0,
      search: search || undefined,
      year: form.value.specific_year, // IMPORTANT: filter by selected year
    })
    // normalize
    const arr = Array.isArray(res?.data) ? res.data : (res?.data ?? res ?? [])
    holidays.value = Array.isArray(arr) ? arr : []
  } finally {
    holidaysLoading.value = false
  }
}

function onYearChange() {
  // when year changes, refresh holidays options; drop current selection
  selectedHoliday.value = null
  form.value.holiday_id = null
  fetchHolidays(holidaysSearchTerm)
}

// keep holiday_id in sync with VueSelect selected object
watch(selectedHoliday, (h) => {
  form.value.holiday_id = h?.id ?? null
})

// when mode changes, toggle dependent fields
watch(
    () => form.value.mode,
    (m) => {
      if (m === 'public_holidays') {
        form.value.days = null
      } else {
        if (!form.value.days) form.value.days = 24
        form.value.specific_year = undefined
        form.value.holiday_id = null
        selectedHoliday.value = null
      }
    }
)

function seedForm() {
  if (!props.modelValue) {
    form.value = {
      name: '',
      mode: 'days_countdown',
      days: 24,
      specific_year: undefined,
      holiday_id: null,
      months_after_contract_start: 6,
      affects_balance: true,
    }
    selectedHoliday.value = null
    return
  }

  // infer mode from incoming model if present; fallback to days_countdown
  const inferredMode: 'days_countdown' | 'public_holidays' =
      props.modelValue.mode ??
      (props.modelValue?.specific_year || props.modelValue?.holiday_id ? 'public_holidays' : 'days_countdown')

  form.value.name = props.modelValue.name ?? ''
  form.value.mode = inferredMode
  form.value.days = inferredMode === 'days_countdown' ? (props.modelValue.days ?? 24) : null
  form.value.specific_year = inferredMode === 'public_holidays' ? (props.modelValue.specific_year ?? undefined) : undefined
  form.value.holiday_id = inferredMode === 'public_holidays' ? (props.modelValue.holiday_id ?? null) : null
  form.value.months_after_contract_start = props.modelValue.months_after_contract_start ?? 6
  form.value.affects_balance = Boolean(props.modelValue.affects_balance)

  // preload holidays if needed and seed selectedHoliday
  if (inferredMode === 'public_holidays') {
    fetchHolidays()
    if (props.modelValue.holiday_id && props.modelValue.holiday) {
      selectedHoliday.value = props.modelValue.holiday
    } else {
      selectedHoliday.value = null
    }
  } else {
    selectedHoliday.value = null
  }
}

function validate(): string {
  if (!form.value.name?.trim()) return 'Անունը պարտադիր է'
  if (form.value.mode === 'days_countdown') {
    if (!form.value.days || form.value.days < 1) return 'Օրերի քանակը պարտադիր է'
  } else {
    if (!form.value.specific_year) return 'Տարին պարտադիր է'
    if (!form.value.holiday_id) return 'Տոնը պարտադիր է'
  }
  if (!form.value.months_after_contract_start || form.value.months_after_contract_start < 1)
    return 'Ամիսներ պայմանագրի սկսվելուց հետո պարտադիր է'
  return ''
}

async function submit() {
  formError.value = validate()
  if (formError.value) return
  saving.value = true

  try {
    // years_count is always 1
    const base: any = {
      name: form.value.name,
      years_count: 1,
      affects_balance: form.value.affects_balance,
      months_after_contract_start: form.value.months_after_contract_start,
      mode: form.value.mode,
    }

    if (form.value.mode === 'days_countdown') {
      base.days = form.value.days
      base.specific_year = null
      base.holiday_id = null
    } else {
      base.days = null
      base.specific_year = form.value.specific_year
      base.holiday_id = form.value.holiday_id
    }

    if (isEdit.value && props.modelValue?.id) {
      await leaveTypeApi.update(props.modelValue.id, base)
    } else {
      await leaveTypeApi.create(base)
    }

    emit('saved')
  } finally {
    saving.value = false
  }
}

watch(
    () => props.open,
    (v) => {
      if (v) {
        seedForm()
        formError.value = ''
      }
    }
)

onMounted(() => {
  if (props.open) seedForm()
})
</script>
