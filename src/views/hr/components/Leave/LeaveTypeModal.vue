<template>
  <div v-if="open" class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/40" @click="$emit('close')"></div>
    <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-xl">
      <div class="flex items-center justify-between px-5 py-4 border-b">
        <h3 class="text-lg font-semibold">
          {{ isEdit ? 'Փոփոխել արձակուրդի տեսակը' : 'Ստեղծել արձակուրդի տեսակը' }}
        </h3>
        <button
            class="p-2 rounded-lg hover:bg-gray-100"
            @click="$emit('close')"
            aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div class="p-5 space-y-6">
        <!-- Form fields -->
        <div class="grid gap-4">
          <div class="flex flex-col gap-y-2">
            <label class="text-sm text-gray-600">Անուն <span class="text-red-600">*</span></label>
            <input
                v-model.trim="form.name"
                class="w-full px-3 py-2 rounded-xl border border-gray-300"
                placeholder="օր. Տարեկան արձակուրդ"
            />
          </div>

          <div class="flex flex-col gap-y-2">
            <label class="text-sm text-gray-600">Օրերի քանակ <span class="text-red-600">*</span></label>
            <input
                v-model.number="form.days"
                type="number"
                min="0"
                class="w-full px-3 py-2 rounded-xl border border-gray-300"
                placeholder="օր. 20"
            />
          </div>

          <div class="flex flex-col gap-y-2">
            <label class="text-sm text-gray-600">Տարիների քանակ</label>
            <input
                v-model.number="form.years_count"
                type="number"
                min="1"
                class="w-full px-3 py-2 rounded-xl border border-gray-300"
                placeholder="օր. 1"
            />
          </div>

          <div class="flex flex-col gap-y-2">
            <label class="text-sm text-gray-600">{{$t('months_after_contract_start')}}</label>
            <input
                v-model.number="form.months_after_contract_start"
                type="number"
                min="1"
                class="w-full px-3 py-2 rounded-xl border border-gray-300"
                placeholder="օր. 6"
            />
          </div>

          <div class="flex flex-col gap-y-2">
            <label class="text-sm text-gray-600">{{$t('affects_balance')}}</label>
            <select
                v-model="form.affects_balance"
                class="w-full px-3 py-2 rounded-xl border border-gray-300"
            >
              <option :value="true">Այո</option>
              <option :value="false">Ոչ</option>
            </select>
          </div>
        </div>

        <div
            v-if="formError"
            class="rounded-xl border border-red-200 bg-red-50 text-red-800 p-2 text-sm"
        >
          {{ formError }}
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end gap-2 pt-2 border-t">
          <button class="px-3 py-2 rounded-xl border hover:bg-gray-50" @click="$emit('close')">
            Փակել
          </button>
          <button
              class="px-3 py-2 rounded-xl text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              :disabled="saving"
              @click="submit"
          >
            {{ isEdit ? 'Պահպանել' : 'Ստեղծել' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, onMounted, ref, watch} from 'vue'
import {type LeaveType, leaveTypeApi} from '@/api.ts' // adjust to your API path

const props = defineProps<{
  open: boolean
  modelValue?: LeaveType | null
}>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved'): void
}>()

const isEdit = computed(() => !!props.modelValue?.id)

const form = ref({
  name: '',
  days: 0,
  years_count: 1,
  affects_balance: true,
  months_after_contract_start: true
})
const formError = ref('')
const saving = ref(false)

function seedForm() {
  if (!props.modelValue) {
    form.value = {name: '', days: 0, years_count: 1, affects_balance: true}
    return
  }

  form.value.name = props.modelValue.name || ''
  form.value.days = props.modelValue.days || 0
  form.value.years_count = props.modelValue.years_count || 1
  form.value.affects_balance = Boolean(props.modelValue.affects_balance)
  form.value.months_after_contract_start = props.modelValue.months_after_contract_start || 0
}

function validate(): string {
  if (!form.value.name?.trim()) return 'Անունը պարտադիր է'
  if (!form.value.days || form.value.days < 0) return 'Օրերի քանակը պարտադիր է'
  if (!form.value.months_after_contract_start || form.value.months_after_contract_start < 0) return 'Ամիսներ պայմանագրի սկսվելուց հետո պարտադիր է'
  if (!form.value.years_count || form.value.years_count < 1) return 'Տարիների քանակը պարտադիր է'
  return ''
}

async function submit() {
  formError.value = validate()
  if (formError.value) return
  saving.value = true

  try {
    const payload = {...form.value}

    if (isEdit.value && props.modelValue?.id) {
      await leaveTypeApi.update(props.modelValue.id, payload)
    } else {
      await leaveTypeApi.create(payload)
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
