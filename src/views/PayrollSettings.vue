<!-- src/views/payroll/PayrollSettings.vue -->
<template>
  <div class="p-6 space-y-6">
    <h1 class="text-2xl font-semibold mb-4">{{ t('payroll_settings') || 'Payroll Settings' }}</h1>

    <div v-if="loading" class="text-gray-500">{{ t('loading') || 'Loading...' }}</div>
    <div v-if="error" class="text-red-600">{{ error }}</div>

    <div v-if="payroll && !loading" class="space-y-8">
      <!-- General Payroll Settings -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-2xl p-6 space-y-4">
        <h2 class="text-lg font-medium">{{ t('general_settings') || 'General Settings' }}</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label class="block">
            <span class="text-sm font-medium">{{ t('income_tax') || 'Income Tax (%)' }}</span>
            <input
                v-model.number="payroll.income_tax"
                type="number"
                step="0.0001"
                class="mt-1 w-full border rounded-md p-2"
            />
          </label>

          <label class="block">
            <span class="text-sm font-medium">{{ t('daily_penalty_percentage') || 'Daily Penalty (%)' }}</span>
            <input
                v-model.number="payroll.daily_penalty_percentage"
                type="number"
                step="0.0001"
                min="0"
                class="mt-1 w-full border rounded-md p-2"
            />
            <small class="text-gray-500">
              {{ t('current') || 'Current' }}: {{ PRESETS.daily_penalty_percentage ?? 0 }}
              <span v-if="payroll.daily_penalty_percentage !== PRESETS.daily_penalty_percentage" class="text-amber-600">
                ({{ t('changed') || 'changed' }})
              </span>
            </small>
          </label>
        </div>
      </div>

      <!-- Pension Rules -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-2xl p-6 space-y-5">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-medium">{{ t('pension_rules') || 'Pension Rules' }}</h2>
        </div>

        <!-- Mandatory (default) -->
        <div>
          <h3 class="text-sm font-semibold mb-2">{{ t('mandatory_rules') || 'Mandatory (Law-based)' }}</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label class="block">
              <span class="text-sm font-medium">{{ t('low_rate') || 'Low Rate (%)' }}</span>
              <input
                  v-model.number="payroll.pension_low_rate"
                  type="number"
                  step="0.0001"
                  min="0"
                  class="mt-1 w-full border rounded-md p-2"
              />
              <small class="text-gray-500">
                {{ t('current') || 'Current' }}: {{ PRESETS.pension_low_rate ?? 0 }}
                <span v-if="payroll.pension_low_rate !== PRESETS.pension_low_rate" class="text-amber-600">
                  ({{ t('changed') || 'changed' }})
                </span>
              </small>
            </label>

            <label class="block">
              <span class="text-sm font-medium">{{ t('high_rate') || 'High Rate (%)' }}</span>
              <input
                  v-model.number="payroll.pension_high_rate"
                  type="number"
                  step="0.0001"
                  min="0"
                  class="mt-1 w-full border rounded-md p-2"
              />
              <small class="text-gray-500">
                {{ t('current') || 'Current' }}: {{ PRESETS.pension_high_rate ?? 0 }}
                <span v-if="payroll.pension_high_rate !== PRESETS.pension_high_rate" class="text-amber-600">
                  ({{ t('changed') || 'changed' }})
                </span>
              </small>
            </label>

            <label class="block">
              <span class="text-sm font-medium">{{ t('threshold') || 'Threshold (֏)' }}</span>
              <input
                  v-model.number="payroll.pension_threshold"
                  type="number"
                  step="1000"
                  min="0"
                  inputmode="numeric"
                  class="mt-1 w-full border rounded-md p-2"
              />
              <small class="text-gray-500">
                {{ t('current') || 'Current' }}: {{ fmt(PRESETS.pension_threshold as number) }} ֏
                <span v-if="payroll.pension_threshold !== PRESETS.pension_threshold" class="text-amber-600">
                  ({{ t('changed') || 'changed' }})
                </span>
              </small>
            </label>

            <label class="block">
              <span class="text-sm font-medium">{{ t('state_rate') || 'State Rate (%)' }}</span>
              <input
                  v-model.number="payroll.pension_state_rate"
                  type="number"
                  step="0.0001"
                  min="0"
                  class="mt-1 w-full border rounded-md p-2"
              />
              <small class="text-gray-500">
                {{ t('current') || 'Current' }}: {{ PRESETS.pension_state_rate ?? 0 }}
                <span v-if="payroll.pension_state_rate !== PRESETS.pension_state_rate" class="text-amber-600">
                  ({{ t('changed') || 'changed' }})
                </span>
              </small>
            </label>

            <label class="block">
              <span class="text-sm font-medium">{{ t('state_cap') || 'State Cap (֏/mo)' }}</span>
              <input
                  v-model.number="payroll.pension_state_cap"
                  type="number"
                  step="1000"
                  min="0"
                  inputmode="numeric"
                  class="mt-1 w-full border rounded-md p-2"
              />
              <small class="text-gray-500">
                {{ t('current') || 'Current' }}: {{ fmt(PRESETS.pension_state_cap as number) }} ֏
                <span v-if="payroll.pension_state_cap !== PRESETS.pension_state_cap" class="text-amber-600">
                  ({{ t('changed') || 'changed' }})
                </span>
              </small>
            </label>

            <label class="block">
              <span class="text-sm font-medium">{{ t('base_cap') || 'Base Income Cap (֏)' }}</span>
              <input
                  v-model.number="payroll.pension_base_cap"
                  type="number"
                  step="1000"
                  min="0"
                  inputmode="numeric"
                  class="mt-1 w-full border rounded-md p-2"
              />
              <small class="text-gray-500">
                {{ t('current') || 'Current' }}: {{ fmt(PRESETS.pension_base_cap as number) }} ֏
                <span v-if="payroll.pension_base_cap !== PRESETS.pension_base_cap" class="text-amber-600">
                  ({{ t('changed') || 'changed' }})
                </span>
              </small>
            </label>

            <label class="block">
              <span class="text-sm font-medium">{{ t('employee_cap') || 'Employee Cap (֏/mo)' }}</span>
              <input
                  v-model.number="payroll.pension_employee_cap"
                  type="number"
                  step="1000"
                  min="0"
                  inputmode="numeric"
                  class="mt-1 w-full border rounded-md p-2"
              />
              <small class="text-gray-500">
                {{ t('current') || 'Current' }}: {{ fmt(PRESETS.pension_employee_cap as number) }} ֏
                <span v-if="payroll.pension_employee_cap !== PRESETS.pension_employee_cap" class="text-amber-600">
                  ({{ t('changed') || 'changed' }})
                </span>
              </small>
            </label>
          </div>
        </div>

        <!-- Voluntary (post-2018) -->
        <div class="pt-2 border-t">
          <h3 class="text-sm font-semibold mb-2">{{ t('voluntary_rules') || 'Voluntary (post-2018)' }}</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label class="inline-flex items-center gap-2">
              <input type="checkbox" v-model="payroll.voluntary_state_support" class="rounded" />
              <span class="text-sm">{{ t('voluntary_state_support') || 'State support applies' }}</span>
            </label>

            <label class="block">
              <span class="text-sm font-medium">{{ t('voluntary_flat_rate') || 'Voluntary Flat Rate (%)' }}</span>
              <input
                  v-model.number="payroll.voluntary_flat_rate"
                  type="number"
                  step="0.0001"
                  min="0"
                  class="mt-1 w-full border rounded-md p-2"
              />
              <small class="text-gray-500">
                {{ t('current') || 'Current' }}: {{ PRESETS.voluntary_flat_rate ?? 0 }}
                <span v-if="payroll.voluntary_flat_rate !== PRESETS.voluntary_flat_rate" class="text-amber-600">
                  ({{ t('changed') || 'changed' }})
                </span>
              </small>
            </label>
          </div>
        </div>

        <!-- Live Preview -->
        <div class="mt-4 border-t pt-4 space-y-3">
          <div class="flex flex-wrap items-center gap-3">
            <span class="text-sm font-medium">{{ t('test_salary') || 'Test Salary (֏)' }}</span>
            <input v-model.number="testSalary" type="number" class="border rounded-md p-2 w-48" />

            <label class="inline-flex items-center gap-2 ml-4">
              <span class="text-sm">{{ t('preview_scheme') || 'Preview scheme' }}:</span>
              <select v-model="previewScheme" class="border rounded-md p-2 text-sm">
                <option value="mandatory">{{ t('mandatory') || 'Mandatory' }}</option>
                <option value="voluntary">{{ t('voluntary') || 'Voluntary' }}</option>
              </select>
            </label>
          </div>

          <div class="text-sm text-gray-700 flex flex-wrap gap-6">
            <span>
              {{ t('employee_pays') || 'Employee pays' }}:
              <b>{{ calcPensionPreview(testSalary).employee.toLocaleString() }} ֏</b>
            </span>
            <span>
              {{ t('state_topup') || 'State top-up' }}:
              <b>{{ calcPensionPreview(testSalary).state.toLocaleString() }} ֏</b>
            </span>
            <span>
              {{ t('base_income') || 'Base Income' }}:
              <b>{{ calcPensionPreview(testSalary).base.toLocaleString() }} ֏</b>
            </span>
          </div>
        </div>
      </div>

      <!-- Military Settings -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-2xl p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-medium">{{ t('military_settings') || 'Military Settings' }}</h2>
          <button @click="addMilitarySetting" class="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700">
            + {{ t('add') || 'Add' }}
          </button>
        </div>

        <div v-if="payroll?.military_settings.length === 0" class="text-gray-500">
          {{ t('no_military_settings') || 'No military settings yet.' }}
        </div>

        <div
            v-for="(item, index) in payroll?.military_settings"
            :key="item.id || index"
            class="border rounded-xl p-4 mb-3"
        >
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <label class="block">
              <span class="text-sm font-medium">{{ t('salary') || 'Salary' }}</span>
              <input v-model.number="item.salary" type="number" class="mt-1 w-full border rounded-md p-2" />
            </label>

            <label class="block">
              <span class="text-sm font-medium">{{ t('fee') || 'Fee' }}</span>
              <input v-model.number="item.fee" type="number" class="mt-1 w-full border rounded-md p-2" />
            </label>

            <div class="flex justify-end">
              <button
                  @click="removeMilitarySetting(index)"
                  class="mt-6 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                {{ t('delete') || 'Delete' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Save Button -->
      <div class="flex justify-end">
        <button
            @click="saveSettings"
            :disabled="saving"
            class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {{ saving ? (t('saving') || 'Saving...') : (t('save_changes') || 'Save Changes') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { payrollSettingApi } from '@/api.ts'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'

const { t } = useI18n()
const toast = useToast()

interface MilitarySetting {
  id?: number
  salary: number
  fee: number
}

interface PayrollSetting {
  id?: number
  income_tax: number
  daily_penalty_percentage: number
  military_settings: MilitarySetting[]

  // Mandatory pension (decimal fractions)
  pension_enabled: boolean
  pension_low_rate: number
  pension_high_rate: number
  pension_threshold: number
  pension_state_rate: number
  pension_state_cap: number
  pension_base_cap: number
  pension_employee_cap: number

  // Voluntary pension
  voluntary_flat_rate: number
  voluntary_state_support: boolean
}

// Presets
const PRESETS: Partial<PayrollSetting> = {
  pension_enabled: true,
  pension_low_rate: 0.05,
  pension_high_rate: 0.10,
  pension_threshold: 500_000,
  pension_state_rate: 0.05,
  pension_state_cap: 25_000,
  pension_base_cap: 1_125_000,
  pension_employee_cap: 87_500,

  voluntary_flat_rate: 0.05,
  voluntary_state_support: false,

  daily_penalty_percentage: 0
}

const payroll = ref<PayrollSetting | null>(null)
const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)

const testSalary = ref<number>(500_000)
const previewScheme = ref<'mandatory' | 'voluntary'>('mandatory')

function fmt(n: number) {
  try {
    return n?.toLocaleString?.() ?? String(n)
  } catch {
    return String(n)
  }
}

function normalizeSettings(input: any): PayrollSetting {
  const p = { ...PRESETS, ...input } as PayrollSetting
  p.military_settings = Array.isArray(p.military_settings) ? p.military_settings : []

  const num = (v: any, d = 0) => (v === null || v === undefined || v === '' ? d : Number(v))

  p.income_tax = num(p.income_tax)
  p.daily_penalty_percentage = num(p.daily_penalty_percentage, PRESETS.daily_penalty_percentage as number)

  p.pension_low_rate = num(p.pension_low_rate, PRESETS.pension_low_rate as number)
  p.pension_high_rate = num(p.pension_high_rate, PRESETS.pension_high_rate as number)
  p.pension_threshold = num(p.pension_threshold, PRESETS.pension_threshold as number)
  p.pension_state_rate = num(p.pension_state_rate, PRESETS.pension_state_rate as number)
  p.pension_state_cap = num(p.pension_state_cap, PRESETS.pension_state_cap as number)
  p.pension_base_cap = num(p.pension_base_cap, PRESETS.pension_base_cap as number)
  p.pension_employee_cap = num(p.pension_employee_cap, PRESETS.pension_employee_cap as number)

  p.voluntary_flat_rate = num(p.voluntary_flat_rate, PRESETS.voluntary_flat_rate as number)
  p.voluntary_state_support = Boolean(p.voluntary_state_support ?? PRESETS.voluntary_state_support)

  p.pension_enabled = Boolean(p.pension_enabled ?? PRESETS.pension_enabled)

  return p
}

const fetchSettings = async () => {
  loading.value = true
  try {
    const { data } = await payrollSettingApi.getData()
    const raw = data?.data ?? data ?? {}
    payroll.value = normalizeSettings(raw)
  } catch (e) {
    error.value = t('failed_to_load_settings') || 'Failed to load settings.'
  } finally {
    loading.value = false
  }
}

const addMilitarySetting = () => {
  if (!payroll.value) return
  payroll.value.military_settings.push({ salary: 0, fee: 0 })
}

const removeMilitarySetting = (index: number) => {
  if (!payroll.value) return
  payroll.value.military_settings.splice(index, 1)
}

const saveSettings = async () => {
  if (!payroll.value) return
  saving.value = true
  try {
    await payrollSettingApi.update(payroll.value.id, payroll.value)
    toast.success(t('settings_saved_successfully') || 'Settings saved successfully!')
  } catch (e) {
    error.value = t('failed_to_save_settings') || 'Failed to save settings.'
  } finally {
    saving.value = false
  }
}

// Live preview (both schemes)
function calcPensionPreview(S: number) {
  if (!payroll.value || !payroll.value.pension_enabled) {
    // For voluntary we don't depend on pension_enabled; keep 0 here for simplicity
    if (previewScheme.value === 'voluntary' && payroll.value) {
      const cfg = payroll.value
      const Seff = Math.min(Number(S || 0), cfg.pension_base_cap)
      const employee = cfg.voluntary_flat_rate * Seff
      const state = cfg.voluntary_state_support
          ? Math.min(cfg.pension_state_rate * Math.min(Seff, cfg.pension_threshold), cfg.pension_state_cap)
          : 0
      return { employee: Math.round(employee), state: Math.round(state), base: Math.round(Seff) }
    }
    return { employee: 0, state: 0, base: S || 0 }
  }

  const cfg = payroll.value
  const Seff = Math.min(Number(S || 0), cfg.pension_base_cap)
  const th = Math.min(cfg.pension_threshold, cfg.pension_base_cap)

  if (previewScheme.value === 'voluntary') {
    const employee = cfg.voluntary_flat_rate * Seff
    const state = cfg.voluntary_state_support
        ? Math.min(cfg.pension_state_rate * Math.min(Seff, th), cfg.pension_state_cap)
        : 0
    return { employee: Math.round(Math.max(0, employee)), state: Math.round(Math.max(0, state)), base: Math.round(Seff) }
  }

  // mandatory
  const employeeSeg =
      cfg.pension_low_rate * Math.min(Seff, th) +
      cfg.pension_high_rate * Math.max(Seff - th, 0)

  const employee = Math.min(Math.max(0, employeeSeg), cfg.pension_employee_cap)
  const state = Math.min(cfg.pension_state_rate * Math.min(Seff, th), cfg.pension_state_cap)

  return {
    employee: Math.round(employee),
    state: Math.round(state),
    base: Math.round(Seff)
  }
}

onMounted(fetchSettings)
</script>

<style scoped>
/* optional component-scoped styles */
</style>
