<!-- src/views/sales/DiscountFormModal.vue -->
<template>
  <div v-if="open" class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/30" @click="close"></div>

    <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-xl w-full max-w-2xl">
      <!-- Header -->
      <div class="flex items-center justify-between px-5 py-3 border-b">
        <h3 class="text-lg font-semibold">{{ form.id ? t('edit_discount') : t('create_discount') }}</h3>
        <button class="px-3 py-1 rounded-xl border border-gray-300" @click="close">✕</button>
      </div>

      <!-- Body -->
      <div class="p-5 space-y-4 text-sm">
        <div class="grid md:grid-cols-2 gap-3">
          <!-- TYPE -->
          <Autocomplete
              v-model="form.type"
              :options="types"
              label="Տեսակ"
              :required="true"
              placeholder="Լիկվիդացիա"
              :error="errors.type"
              option-label="name"
              option-key="id"
              :emit-label="true"
          />

          <!-- NAME -->
          <div class="flex flex-col gap-y-2">
            <label>Անվանում <span class="text-red-500">*</span></label>
            <input
                v-model="form.name"
                :placeholder="'Պարենային ապրանքներ'"
                class="border border-gray-300 rounded-xl px-3 py-2"
            />
          </div>

          <!-- PERCENTAGE -->
          <div class="flex flex-col gap-y-2">
            <label>{{ t('discount_percentage') }} <span class="text-red-500">*</span></label>
            <input
                v-model.number="form.percentage"
                type="number"
                min="0.01"
                max="100"
                step="0.01"
                placeholder="10"
                class="border border-gray-300 rounded-xl px-3 py-2"
                :disabled="readOnlyExtraFields"
            />
          </div>
          <div class="flex flex-col justify-end">
            <div class="flex items-center mb-4">
              <input
                  id="for-customer"
                  type="checkbox"
                  v-model="form.for_customer"
                  :true-value="1"
                  :false-value="0"
                  :disabled="readOnlyExtraFields"
                  class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-blue-500"
              />
              <label for="for-customer" class="ms-2 text-sm font-medium text-gray-900">Հաճախորդի զեղչ</label>
            </div>
          </div>
          <!-- DATES -->
<!--          <div class="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">-->
<!--            <div class="flex flex-col gap-y-2">-->
<!--              <label>Սկիզբ</label>-->
<!--              <input-->
<!--                  v-model="form.from_date"-->
<!--                  type="date"-->
<!--                  class="border rounded-xl border-gray-300 px-3 py-2"-->
<!--                  :disabled="readOnlyExtraFields"-->
<!--                  :min="minToday"-->
<!--                  @change="validateDates"-->
<!--              />-->
<!--              <p v-if="errors.from_date" class="text-xs text-red-600">{{ errors.from_date }}</p>-->
<!--            </div>-->

<!--            <div class="flex flex-col gap-y-2">-->
<!--              <label>Ավարտ</label>-->
<!--              <input-->
<!--                  v-model="form.to_date"-->
<!--                  type="date"-->
<!--                  class="border rounded-xl border-gray-300 px-3 py-2"-->
<!--                  :disabled="readOnlyExtraFields"-->
<!--                  :min="minToday"-->
<!--                  @change="validateDates"-->
<!--              />-->
<!--              <p v-if="errors.to_date" class="text-xs text-red-600">{{ errors.to_date }}</p>-->
<!--            </div>-->
<!--          </div>-->
        </div>

        <!-- Actions -->
        <div class="flex gap-2">
          <button
              class="bg-blue-600 text-white px-4 py-2 rounded-xl disabled:opacity-50"
              :disabled="saving || !valid"
              @click="save"
          >
            {{ form.id ? t('save') : t('create') }}
          </button>
          <button class="px-4 py-2 rounded-xl border border-gray-300" @click="resetForm">
            {{ t('reset') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, watch, ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { sales } from '@/api'
import Autocomplete from '@/components/ui/Autocomplete.vue'
import type { Discount } from '@/types/sales/discounts'

const { t } = useI18n()

const props = defineProps<{ open: boolean; item?: Discount | null }>()
const emit = defineEmits<{ (e: 'update:open', v: boolean): void; (e: 'saved'): void }>()

/** UI state */
const saving = ref(false)
const errors = reactive<{ type?: string; from_date?: string; to_date?: string }>({})

/** Types */
type DiscountType = { id: number; name: string; code?: string }
const types = ref<DiscountType[]>([])

/** Form (type is string) */
const form = reactive<{ id?: number; type: string; name: string; percentage: number | null; from_date: string | null; to_date: string | null, for_customer: boolean | null }>({
  id: undefined,
  type: '',
  name: '',
  percentage: null,
  from_date: null,
  to_date: null,
})

/** Read-only fields when editing and status !== pending */
const readOnlyExtraFields = computed(() => props.item && props.item.status !== 'pending')

/** Today (local, YYYY-MM-DD) for :min */
const minToday = computed(() => {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
})

/** Load types and keep current type present */
async function fetchTypes() {
  try {
    const { data } = await sales.discounts.types({ limit: 50, offset: 0 })
    const arr = Array.isArray(data?.data) ? (data.data as DiscountType[]) : []
    types.value = (form.type && !arr.some(x => x.name === form.type))
        ? [{ id: -1, name: form.type }, ...arr]
        : arr
  } catch { /* optional toast */ }
}

/** Simple required for type */
watch(() => form.type, (v) => {
  errors.type = v ? undefined : (t('field_is_required') || 'Պարտադիր դաշտ է')
})

/** Date validation */
function validateDates() {
  // Clear when dates are disabled (editing non-pending)
  if (readOnlyExtraFields.value) {
    errors.from_date = undefined
    errors.to_date = undefined
    return
  }

  const from = form.from_date ? new Date(form.from_date + 'T00:00:00') : null
  const to   = form.to_date   ? new Date(form.to_date   + 'T00:00:00') : null
  const today = new Date(minToday.value + 'T00:00:00')

  errors.from_date = undefined
  errors.to_date = undefined

  // Only validate if present (dates are optional)
  if (from) {
    if (from < today) {
      errors.from_date = 'Ամսաթիվը չի կարող անցյալում լինել'
    }
  }
  if (to) {
    if (to < today) {
      errors.to_date = 'Ամսաթիվը չի կարող անցյալում լինել'
    }
  }
  // from must be strictly earlier than to if both present
  if (from && to && from >= to) {
    errors.from_date = 'Սկիզբը պետք է լինի ավելի վաղ, քան Ավարտը'
    errors.to_date = errors.to_date || errors.from_date
  }
}

/** Prefill for edit or reset for create */
watch(() => props.item, (it) => {
  if (it) {
    form.id = it.id
    form.type = it.type?.name || it['discount_type']?.name || ''
    form.name = it.name
    form.percentage = it.percentage
    form.from_date = it.from_date
    form.to_date = it.to_date
    form.for_customer = it.for_customer
  } else {
    resetForm()
  }
  fetchTypes()
  validateDates()
}, { immediate: true })

watch(() => props.open, (isOpen) => { if (isOpen) { fetchTypes(); validateDates() } })

/** Valid state */
const valid = computed(() => {
  const pctOk = props.item && props.item.status !== 'pending'
      ? true
      : !!form.percentage && Number(form.percentage) > 0

  const noDateErrors = !errors.from_date && !errors.to_date
  return !!form.type && !!form.name && pctOk && noDateErrors
})

function resetForm() {
  form.id = undefined
  form.type = ''
  form.name = ''
  form.percentage = null
  form.for_customer = null
  form.from_date = null
  form.to_date = null
  errors.type = undefined
  errors.from_date = undefined
  errors.to_date = undefined
}

function close() { emit('update:open', false) }

async function save() {
  errors.type = form.type ? undefined : (t('field_is_required') || 'Պարտադիր դաշտ է')
  validateDates()
  if (!valid.value) return

  saving.value = true
  try {
    if (form.id) {
      if(props.item.status !== 'pending') {
        await sales.discounts.update(form.id, { type: form.type, name: form.name })
      } else {
        await sales.discounts.update(form.id,{
          type: form.type,
          name: form.name,
          percentage: Number(form.percentage),
          from_date: form.from_date,
          to_date: form.to_date,
          for_customer: form.for_customer,
        })
      }
    } else {
      await sales.discounts.create({
        type: form.type,
        name: form.name,
        percentage: Number(form.percentage),
        from_date: form.from_date,
        to_date: form.to_date,
        for_customer: form.for_customer,
      })
    }
    emit('saved'); close()
  } finally { saving.value = false }
}

onMounted(() => { if (props.open) { fetchTypes(); validateDates() } })
</script>
