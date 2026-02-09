<template>
  <div v-if="open" class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/30" @click="close"></div>

    <aside class="absolute right-0 top-0 h-screen w-full max-w-md bg-white shadow-2xl flex flex-col">
      <div class="flex items-center justify-between px-5 py-3 border-b">
        <h3 class="text-lg font-semibold">Թարմացնել ժամանակահատվածը</h3>
        <button class="px-3 py-1 rounded-xl border" @click="close">✕</button>
      </div>

      <div class="p-5 space-y-4 text-sm">
        <div class="flex flex-col">
          <label class="text-sm font-medium mb-1">Սկիզբ</label>
          <input
              v-model="fromDate"
              type="date"
              class="border border-gray-300 rounded-xl px-3 py-2"
              :min="today"
          />
          <p v-if="errors.from_date" class="mt-1 text-xs text-rose-600">{{ errors.from_date }}</p>
        </div>

        <div class="flex flex-col">
          <label class="text-sm font-medium mb-1">Ավարտ</label>
          <input
              v-model="toDate"
              type="date"
              class="border border-gray-300 rounded-xl px-3 py-2"
              :min="fromDate || today"
          />
          <p v-if="errors.to_date" class="mt-1 text-xs text-rose-600">{{ errors.to_date }}</p>
        </div>
      </div>

      <div class="p-4 border-t flex gap-2 justify-end">
        <div class="flex-1 text-xs text-rose-600" v-if="formError">{{ formError }}</div>
        <button class="px-4 py-2 rounded-xl border" @click="close">Փակել</button>
        <button
            class="px-4 py-2 rounded-xl bg-blue-600 text-white disabled:opacity-50"
            :disabled="saving || !canSubmit"
            @click="save"
        >
          Պահպանել
        </button>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { sales } from '@/api'

const props = defineProps<{
  open: boolean
  settingId: number | null
  fromDateInit?: string
  toDateInit?: string
}>()
const emit = defineEmits<{ (e:'update:open', v:boolean):void; (e:'done'):void }>()

const fromDate = ref<string>(props.fromDateInit || '')
const toDate   = ref<string>(props.toDateInit || '')
const saving   = ref(false)
const formError = ref('')
const errors = ref<{ from_date?: string; to_date?: string }>({})

const today = new Date().toISOString().slice(0,10)

watch(() => props.open, (isOpen) => {
  if (!isOpen) return
  fromDate.value = props.fromDateInit || ''
  toDate.value   = props.toDateInit   || ''
  formError.value = ''
  errors.value = {}
})

watch(fromDate, (v) => {
  if (v && v < today) fromDate.value = today
  if (toDate.value && v && toDate.value < v) toDate.value = v
})
watch(toDate, (v) => {
  if (v && fromDate.value && v < fromDate.value) toDate.value = fromDate.value
})

const canSubmit = computed(() => {
  formError.value = ''
  errors.value = {}
  // If you want to allow empty dates, relax these checks.
  if (!fromDate.value) { errors.value.from_date = 'Լրացրեք from_date'; return false }
  if (fromDate.value < today) { errors.value.from_date = 'from_date չի կարող լինել այսօրից ցածր'; return false }
  if (toDate.value && toDate.value < fromDate.value) { errors.value.to_date = 'to_date չի կարող լինել from_date-ից ցածր'; return false }
  return true
})

function close(){ emit('update:open', false) }

async function save(){
  if (!props.settingId || !canSubmit.value) return
  saving.value = true
  try {
    // Backend should support: PATCH /sales/discounts/settings/{id}
    // with { from_date, to_date }
    await sales.discounts.settings.updatePeriod(props.settingId, {
      from_date: fromDate.value || null,
      to_date: toDate.value || null,
    })
    emit('done')
    close()
  } finally { saving.value = false }
}
</script>
