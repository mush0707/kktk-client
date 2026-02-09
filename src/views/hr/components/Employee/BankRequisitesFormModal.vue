<template>
  <div v-if="open" class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/30" @click="$emit('close')"></div>

    <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-white rounded-2xl shadow-xl">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-gray-200">
        <div class="text-lg font-semibold">
          Բանկային տվյալներ
        </div>
        <button class="px-3 py-1 rounded-xl border hover:bg-gray-50" @click="$emit('close')">✕</button>
      </div>

      <!-- Body -->
      <div class="p-4 grid grid-cols-1 gap-4 text-sm">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div class="flex flex-col gap-y-2">
            <label class="text-xs text-slate-500">Բանկի անուն <span class="text-red-500">*</span></label>
            <input
                v-model.trim="form.bank_name"
                class="w-full border border-gray-300 rounded-xl px-3 py-2"
                placeholder="օր. Ameriabank"
            />
            <p v-if="errors.bank_name" class="text-xs text-red-600">{{ errors.bank_name }}</p>
          </div>

          <div class="flex flex-col gap-y-2">
            <label class="text-xs text-slate-500">Բանկի դրամային հաշվեհամար <span class="text-red-500">*</span></label>
            <input
                v-model.trim="form.bank_account"
                type="number"
                class="w-full border border-gray-300 rounded-xl text-sm px-3 py-2"
                placeholder="Մուտքագրել հաշվեհամար"
            />
            <p v-if="errors.bank_account" class="text-xs text-red-600">{{ errors.bank_account }}</p>
          </div>
        </div>

        <div v-if="uiError" class="rounded-xl border border-red-200 bg-red-50 text-red-800 p-2 text-sm">
          {{ uiError }}
        </div>
      </div>

      <!-- Footer -->
      <div class="p-4 border-t border-gray-200 flex items-center justify-end gap-2">
        <button :disabled="saving" class="px-3 py-2 rounded-xl border hover:bg-gray-50" @click="$emit('close')">
          {{ t('cancel') || 'Չեղարկել' }}
        </button>
        <button
            :disabled="saving"
            class="px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
            @click="submit"
        >
          <span v-if="saving">{{ t('saving') || 'Պահպանում…' }}</span>
          <span v-else>{{ t('save') || 'Պահպանել' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { reactive, watch, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {employeesApi} from "@/api.ts";

const { t } = useI18n({ useScope: 'global' })

type BankForm = {
  bank_name: string | null
  bank_account: string | null
}

const props = defineProps<{
  open: boolean
  initial?: Partial<BankForm>    // optional prefill
  extraPayload?: Record<string, any> // optional extra fields (e.g., employee_id)
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved', payload?: any): void
}>()

const form = reactive<BankForm>({
  bank_name: null,
  bank_account: null
})

const errors = reactive<Record<string, string>>({})
const uiError = ref('')
const saving = ref(false)

function reset() {
  form.bank_name = null
  form.bank_account = null
  uiError.value = ''
  Object.keys(errors).forEach(k => delete errors[k])
}

function prefill() {
  if (!props.initial) return
  Object.assign(form, props.initial)
}

watch(() => props.open, v => {
  if (v) {
    reset()
    prefill()
  }
})

function validate(): boolean {
  uiError.value = ''
  Object.keys(errors).forEach(k => delete errors[k])

  if (!form.bank_name?.trim()) {
    errors.bank_name = 'Մուտքագրեք բանկի անունը'
  }

  const ok = Object.keys(errors).length === 0
  if (!ok) {
    uiError.value = 'Խնդրում ենք ուղղել բանկային տվյալները'
  }
  return ok
}

async function submit() {
  if (!validate()) return
  saving.value = true
  try {
    const payload = {
      bank_name: form.bank_name ?? '',
      bank_account: form.bank_account ?? '',
      ...(props.extraPayload || {})
    }
    console.log(props.extraPayload);
    const res = await employeesApi.updateBankRequisites(props.extraPayload.employee_id, payload)
    emit('saved', res?.data ?? res)
    emit('close')
  } finally {
    saving.value = false
  }
}
</script>
