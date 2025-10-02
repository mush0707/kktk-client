<template>
  <div v-if="open" class="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
    <div class="bg-white rounded-2xl p-4 w-full max-w-2xl">
      <div class="flex items-center justify-between mb-3">
        <div class="font-medium">Ավելացնել աշխատանք / ծառայություն</div>
        <button class="p-1" @click="$emit('close')">✕</button>
      </div>

      <form @submit.prevent="storeOffering" class="flex flex-col gap-y-3">
        <!-- 1) Block -->
        <div class="flex flex-col gap-y-1">
          <label class="text-xs text-gray-500">Տիպ</label>
          <select v-model="form.block" :class="selectClass(errors.block)">
            <option value="work">Աշխատանք</option>
            <option value="service">Ծառայություն</option>
          </select>
          <p v-if="errors.block" class="text-xs text-rose-600 mt-1">Ընտրեք «Աշխատանք» կամ «Ծառայություն»</p>
        </div>

        <!-- 2) Type autocomplete -->
        <div class="flex flex-col gap-y-1">
          <label class="text-xs text-gray-500">Տեսակի անվանում</label>
          <div class="relative">
            <input
                v-model="typeQuery"
                @input="onTypeInput"
                @focus="typeOpen=true"
                @blur="onTypeBlur"
                :class="inputClass(errors.type)"
                placeholder="Օր. Վերանորոգում / Տրանսպորտ"
            />
            <div
                v-if="showTypeDd"
                class="absolute z-10 mt-1 bg-white border border-gray-200 rounded-lg w-full max-h-64 overflow-auto shadow"
            >
              <div
                  v-for="t in typeOptions"
                  :key="t.id"
                  class="px-3 py-2 hover:bg-gray-50 cursor-pointer"
                  @mousedown.prevent="selectType(t)"
              >
                {{ t.name }}
              </div>
              <div v-if="!loadingTypes && typeOptions.length===0" class="px-3 py-2 text-sm text-gray-500">Արդյունք չկա
              </div>
              <div v-if="loadingTypes" class="px-3 py-2 text-sm text-gray-500">Փնտրում է…</div>
            </div>
            <p v-if="errors.type" class="text-xs text-rose-600 mt-1">Տեսակը պարտադիր է</p>
          </div>
        </div>

        <!-- 3) Name -->
        <div class="flex flex-col gap-y-1">
          <label class="text-xs text-gray-500">{{
              form.block === 'work' ? 'Աշխատանքի անվանում' : 'Ծառայության անվանում'
            }}</label>
          <input v-model="form.name" :class="inputClass(errors.name)"
                 placeholder="Օր. Սենյակի ներկում / Տեղադրման ծառայություն"/>
          <p v-if="errors.name" class="text-xs text-rose-600 mt-1">Անվանումը պարտադիր է</p>
        </div>

        <!-- 4) Description -->
        <div class="flex flex-col gap-y-1">
          <label class="text-xs text-gray-500">Նկարագրություն</label>
          <textarea v-model="form.description" class="w-full px-3 py-2 border border-gray-300 rounded-lg" rows="3"/>
        </div>

        <!-- Actions -->
        <div class="flex gap-2">
          <button
              :disabled="saving || !canSave"
              class="text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg text-sm px-5 py-2.5 disabled:opacity-60"
          >Պահպանել
          </button>
          <button type="button" class="px-4 py-2 rounded-lg border hover:bg-gray-50" @click="$emit('close')">Չեղարկել
          </button>
        </div>

        <p v-if="error" class="text-sm text-rose-600">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import {reactive, ref, computed} from 'vue'
import {offeringsApi} from '@/api.js'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'created', offering: any): void }>()

const form = reactive({
  block: 'work' as 'work' | 'service',
  type_id: undefined as number | undefined,
  name: '',
  description: '',
})

/* validation helpers */
const errors = reactive({block: false, type: false, name: false})
const canSave = computed(() => !!form.block && !!(selectedTypeName.value || typeQuery.value.trim()) && !!form.name.trim())

function inputClass(err: boolean) {
  return ['w-full px-3 py-2 border rounded-lg', err ? 'border-rose-500' : 'border-gray-300'].join(' ')
}

function selectClass(err: boolean) {
  return ['w-full px-3 py-2 border rounded-lg', err ? 'border-rose-500' : 'border-gray-300'].join(' ')
}

function validate() {
  errors.block = !form.block
  errors.type = !(selectedTypeName.value || typeQuery.value.trim())
  errors.name = !form.name.trim()
  return !(errors.block || errors.type || errors.name)
}

/* type autocomplete */
const typeQuery = ref('')
const typeOptions = ref<any[]>([])
const loadingTypes = ref(false)
const typeOpen = ref(false)
const selectedTypeName = ref('')
const showTypeDd = computed(() => typeOpen.value && (loadingTypes.value || typeOptions.value.length > 0))

let tTimer: any = null

function onTypeInput() {
  typeOpen.value = true
  clearTimeout(tTimer)
  const q = typeQuery.value.trim()
  if (!q) {
    typeOptions.value = [];
    return
  }
  tTimer = setTimeout(async () => {
    loadingTypes.value = true
    try {
      typeOptions.value = await offeringsApi.searchTypes({search: q, limit: 15})
    } finally {
      loadingTypes.value = false
    }
  }, 250)
}

function selectType(t: any) {
  form.type_id = t.id
  selectedTypeName.value = t.name
  typeQuery.value = t.name
  typeOptions.value = []
  typeOpen.value = false
}

function onTypeBlur() {
  setTimeout(() => typeOpen.value = false, 120)
}

/* submit */
const saving = ref(false)
const error = ref('')

async function storeOffering() {
  error.value = ''
  if (!validate()) {
    error.value = 'Լրացրեք պարտադիր դաշտերը';
    return
  }

  saving.value = true
  try {
    const payload: any = {
      block: form.block,
      type_id: form.type_id,
      name: form.name,
      description: form.description || null,
      // names are useful server-side if կստեղծվի նոր type
      type: selectedTypeName.value || typeQuery.value.trim(),
    }
    const created = await offeringsApi.createFromDepartment(payload)
    emit('created', created)
    emit('close')
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Չհաջողվեց պահպանել'
  } finally {
    saving.value = false
  }
}
</script>
