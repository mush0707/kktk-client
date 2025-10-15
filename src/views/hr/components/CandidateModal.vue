<template>
  <div v-if="open" class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/40" @click="$emit('close')"></div>

    <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl bg-white rounded-2xl shadow-xl">
      <div class="flex items-center justify-between px-5 py-4 border-b">
        <h3 class="text-lg font-semibold">{{ isEdit ? 'Փոփոխել թեկնածուին' : 'Ստեղծել թեկնածու' }}</h3>
        <button class="p-2 rounded-lg hover:bg-gray-100" @click="$emit('close')" aria-label="Close">✕</button>
      </div>

      <div class="p-5 space-y-6">
        <!-- Base info -->
        <div class="grid md:grid-cols-2 gap-4">
          <div class="flex flex-col gap-y-2">
            <label class="text-sm text-gray-600">Անուն <span class="text-red-600">*</span></label>
            <input v-model.trim="form.first_name" class="w-full px-3 py-2 rounded-xl border border-gray-300"/>
          </div>
          <div class="flex flex-col gap-y-2">
            <label class="text-sm text-gray-600">Ազգանուն <span class="text-red-600">*</span></label>
            <input v-model.trim="form.last_name" class="w-full px-3 py-2 rounded-xl border border-gray-300"/>
          </div>
          <div class="flex flex-col gap-y-2">
            <label class="text-sm text-gray-600">Email <span class="text-red-600">*</span></label>
            <input v-model.trim="form.email" type="email" class="w-full px-3 py-2 rounded-xl border border-gray-300"/>
          </div>
          <div class="flex flex-col gap-y-2">
            <label class="text-sm text-gray-600">Հեռախոս <span class="text-red-600">*</span></label>
            <input v-model.trim="form.phone" class="w-full px-3 py-2 rounded-xl border border-gray-300"/>
          </div>
          <div>
            <label class="text-xs text-slate-500">{{ $t('gender') || 'Սեռ' }}<span class="text-red-600">*</span></label>
            <select
                v-model="form.gender"
                class="w-full px-3 py-2 rounded-xl border border-gray-300"
             >
              <option :value="null">—</option>
              <option value="male">{{ $t('male') || 'Արական' }}</option>
              <option value="female">{{ $t('female') || 'Իգական' }}</option>
            </select>
          </div>
          <div>
            <label class="text-xs text-slate-500">{{ $t('birth_date') || 'Ծննդյան ամսաթիվ' }}<span class="text-red-600">*</span></label>
            <DatePicker
                :teleport="true"
                z-index="3000"
                :enable-time-picker="false"
                auto-apply
                :clearable="false"
                :placeholder="$t('select_date')"
                v-model="form.birth_date"
                :max-date="maxDate"
                :flow="flow"
            ></DatePicker>
          </div>
        </div>


        <div v-if="formError" class="rounded-xl border border-red-200 bg-red-50 text-red-800 p-2 text-sm">{{ formError }}</div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t">
          <button class="px-3 py-2 rounded-xl border hover:bg-gray-50" @click="$emit('close')">Փակել</button>
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
import { ref, computed, watch, onMounted } from 'vue'
import { candidateApi, type Candidate, type CandidateDocType } from '@/api'

const props = defineProps<{
  open: boolean
  modelValue?: Candidate | null
}>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved'): void
}>()

const isEdit = computed(() => !!props.modelValue?.id)

const form = ref({
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  gender: null,
  birth_date:''
})
const formError = ref('')
const flow = ref(['year','month', 'calendar']);


const saving = ref(false)
const progress = ref(0)




function seedForm(){
  if(!props.modelValue) {
    form.value = { first_name: '', last_name: '', email: '', phone: '' }

    return
  }
  form.value.first_name = props.modelValue.first_name || ''
  form.value.last_name  = props.modelValue.last_name  || ''
  form.value.email      = props.modelValue.email      || ''
  form.value.phone      = props.modelValue.phone      || ''
  form.value.gender     = props.modelValue.gender     || null
  form.value.birth_date = props.modelValue.birth_date || ''
}

function validate(): string {
  if(!form.value.first_name?.trim()) return 'Անուն *'
  if(!form.value.last_name?.trim())  return 'Ազգանուն *'
  if(!form.value.email?.trim())      return 'Email *'
  return ''
}





async function submit(){
  formError.value = validate()
  // if(formError.value) return
  saving.value = true
  try{
    const fd = new FormData()
    fd.append('first_name', form.value.first_name)
    fd.append('last_name', form.value.last_name)
    fd.append('email', form.value.email)
    fd.append('phone', form.value.phone || '')
    fd.append('gender', form.value.gender || '')
    if (form?.value?.birth_date) {
      const d = new Date(form?.value?.birth_date)
      form.value.birth_date = d?.toISOString()?.slice(0, 10)
      fd.append('birth_date', form.value.birth_date || '')
    }
    if (isEdit.value && props.modelValue?.id) {
      await candidateApi.update(props.modelValue.id, fd)
    } else {
      await candidateApi.create(fd)
    }
    emit('saved'); emit('close')
  } finally {
    saving.value = false
    progress.value = 0
  }
}

watch(() => props.open, (v) => {
  if(v){
    seedForm()
    formError.value = ''
  }
})

onMounted(async () => {
   if(props.open) seedForm()
})

const  maxDate = computed(() => {
  const d = new Date()
  d.setFullYear(d.getFullYear() - 18)
  return d.toISOString().slice(0, 10)
})
</script>
