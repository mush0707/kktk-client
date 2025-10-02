<!-- src/components/products/NewProductModal.vue -->
<template>
  <div v-if="open" class="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
    <div class="bg-white rounded-2xl p-4 w-full max-w-2xl">
      <div class="flex items-center justify-between mb-3">
        <div class="font-medium">Ավելացնել նոր ապրանք</div>
        <button class="p-1" @click="$emit('close')">✕</button>
      </div>

      <form @submit.prevent="storeProduct" class="flex flex-col gap-y-2">
        <!-- Group autocomplete -->
        <div class="flex flex-col gap-y-2">
          <label>Խումբ</label>
          <div class="relative">
            <input
                v-model="groupQuery"
                @input="onGroupInput"
                @focus="groupOpen = true"
                @blur="onGroupBlur"
                :class="inputClass(errors.group)"
                placeholder="Խմբի անվանումը"
            />
            <div
                v-if="showGroupDd"
                class="absolute z-10 mt-1 bg-white border border-gray-200 rounded-lg w-full max-h-64 overflow-auto shadow"
            >
              <div
                  v-for="g in groupOptions"
                  :key="g.id"
                  class="px-3 py-2 hover:bg-gray-50 cursor-pointer"
                  @click="selectGroup(g)"
              >
                {{ g.name }}
              </div>
              <div v-if="!loadingGroups && groupOptions.length===0" class="px-3 py-2 text-sm text-gray-500">Արդյունք չկա</div>
              <div v-if="loadingGroups" class="px-3 py-2 text-sm text-gray-500">Փնտրում է…</div>
            </div>
            <p v-if="errors.group" class="text-xs text-rose-600 mt-1">Խմբի ընտրությունը պարտադիր է</p>

          </div>
        </div>

        <!-- Type autocomplete -->
        <div class="flex flex-col gap-y-2">
          <label>Տեսակ</label>
          <div class="relative">
            <input
                v-model="typeQuery"
                @input="onTypeInput"
                @focus="typeOpen = true"
                @blur="onTypeBlur"
                :class="inputClass(errors.type)"
                placeholder="Տեսակի անվանումը"
            />
            <div
                v-if="showTypeDd"
                class="absolute z-10 mt-1 bg-white border border-gray-200 rounded-lg w-full max-h-64 overflow-auto shadow"
            >
              <div
                  v-for="t in typeOptions"
                  :key="t.id"
                  class="px-3 py-2 hover:bg-gray-50 cursor-pointer"
                  @click="selectType(t)"
              >
                <span class="font-medium">{{ t.name }}</span>
                <span v-if="t.industrial" class="text-xs text-gray-500 ml-1">(արտադրական)</span>
              </div>
              <div v-if="!loadingTypes && typeOptions.length===0" class="px-3 py-2 text-sm text-gray-500">Արդյունք չկա</div>
              <div v-if="loadingTypes" class="px-3 py-2 text-sm text-gray-500">Փնտրում է…</div>
            </div>
            <p v-if="errors.type" class="text-xs text-rose-600 mt-1">Տեսակի ընտրությունը պարտադիր է</p>
          </div>
        </div>

        <!-- Name -->
        <div class="flex flex-col gap-y-2">
          <label>Անուն</label>
          <input
              v-model="productForm.name"
              :class="inputClass(errors.name)"
              type="text"
          />
          <p v-if="errors.name" class="text-xs text-rose-600 mt-1">Անվանումը պարտադիր է</p>

        </div>

        <!-- Measure -->
        <div class="flex flex-col gap-y-2">
          <label class="block font-medium text-gray-900">Չափման տեսակ</label>
          <select
              v-model="productForm.measure_type"
              :class="selectClass(errors.measure)"
          >
            <option v-for="m in measureUnits" :key="m.key" :value="m.key">{{ m.name }}</option>
          </select>
          <p v-if="errors.measure" class="text-xs text-rose-600 mt-1">Չափման տեսակը պարտադիր է</p>

        </div>

        <!-- Characteristics -->
        <div class="p-2 bg-indigo-50 rounded-lg flex flex-col gap-y-2">
          <label>Բնութագրեր</label>
          <div class="flex flex-col gap-y-2">
            <div class="flex items-center gap-2" v-for="(c, i) in productForm.characteristics" :key="i">
              <input v-model="c.type"  class="w-full bg-white px-3 py-2 border border-gray-300 rounded-lg" placeholder="Տիպ (օր. գույն)" />
              <input v-model="c.value" class="w-full bg-white px-3 py-2 border border-gray-300 rounded-lg" placeholder="Արժեք (օր. կարմիր)" />
              <button type="button" class="px-3 py-2 rounded-lg text-white bg-rose-600 hover:bg-rose-700" @click="removeCharacteristic(i)">✕</button>
            </div>
          </div>
          <div class="flex">
            <button type="button" class="px-4 py-2 rounded-lg text-white bg-violet-600 hover:bg-violet-700" @click="newCharacteristic">Ավելացնել</button>
          </div>
        </div>

        <!-- Actions -->
        <div>
          <button v-if="!savingProduct" :disabled="savingProduct || !canSave" class="text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg text-sm px-5 py-2.5">
            Պահպանել
          </button>
          <button v-else type="button" class="text-white flex justify-center bg-indigo-700 rounded-lg text-sm px-5 py-2.5">
            Պահպանում…
          </button>
        </div>

        <p v-if="productError" class="text-sm text-rose-600">{{ productError }}</p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { productsApi } from '@/api.js'

type MeasureUnit = { key:string; name:string }

const props = defineProps<{
  open: boolean
  measureUnits: MeasureUnit[]
}>()

const emit = defineEmits<{
  (e:'close'): void
  (e:'created', product:any): void
}>()
const errors = reactive({ group:false, type:false, name:false, measure:false })
const canSave = computed(() =>
    !!(selectedGroupName.value || groupQuery.value.trim()) &&
    !!(selectedTypeName.value  || typeQuery.value.trim()) &&
    !!productForm.name?.trim() &&
    !!productForm.measure_type
)
function inputClass(hasError:boolean){
  return [
    'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500',
    hasError ? 'border-rose-500' : 'border-gray-300'
  ].join(' ')
}
function selectClass(hasError:boolean){
  return [
    'bg-gray-50 border text-gray-900 text-sm rounded-lg block w-full p-2.5',
    hasError ? 'border-rose-500' : 'border-gray-300'
  ].join(' ')
}
function onGroupBlur() {
  globalThis.setTimeout(() => { groupOpen.value = false }, 100)
}
function onTypeBlur() {
  globalThis.setTimeout(() => { typeOpen.value = false }, 100)
}
function validateRequired() {
  const hasGroup   = !!(selectedGroupName.value || groupQuery.value.trim())
  const hasType    = !!(selectedTypeName.value  || typeQuery.value.trim())
  const hasName    = !!productForm.name?.trim()
  const hasMeasure = !!productForm.measure_type

  errors.group   = !hasGroup
  errors.type    = !hasType
  errors.name    = !hasName
  errors.measure = !hasMeasure

  return hasGroup && hasType && hasName && hasMeasure
}
// form state
const productForm = reactive({
  group_id: undefined as number|undefined,
  type_id:  undefined as number|undefined,
  name: '',
  measure_type: 'piece',
  characteristics: [] as Array<{type:string; value:string}>,
})
const selectedGroupName = ref<string>('')
const selectedTypeName  = ref<string>('')
// reset when opened
watch(() => props.open, (v) => { if (v) resetForm() })

function newCharacteristic(){ productForm.characteristics.push({ type:'', value:'' }) }
function removeCharacteristic(i:number){ productForm.characteristics.splice(i,1) }
function resetForm(){
  productForm.group_id = undefined
  productForm.type_id = undefined
  productForm.name = ''
  productForm.measure_type = props.measureUnits?.[0]?.key || 'piece'
  productForm.characteristics = []
  groupQuery.value = ''
  typeQuery.value = ''
  groupOptions.value = []
  typeOptions.value = []
  productError.value = ''
  selectedGroupName.value = ''
  selectedTypeName.value  = ''
}

// ── GROUP autocomplete
const groupQuery = ref('')
const groupOptions = ref<any[]>([])
const loadingGroups = ref(false)
const groupOpen = ref(false)
const typeOpen  = ref(false)

const showGroupDd = computed(() =>
    groupOpen.value && (loadingGroups.value || groupOptions.value.length > 0)
)
let gTimer:any=null
function onGroupInput() {
  groupOpen.value = true
  clearTimeout(gTimer)
  const q = groupQuery.value.trim()
  if (!q) { groupOptions.value = []; return }
  gTimer = setTimeout(async () => {
    loadingGroups.value = true
    try { groupOptions.value = await productsApi.searchGroups({ search: q, limit: 15 }) }
    finally { loadingGroups.value = false }
  }, 250)
}
function selectGroup(g:any){
  productForm.group_id = g.id
  selectedGroupName.value = g.name            // ← save name
  groupQuery.value = g.name
  groupOptions.value = []
  groupOpen.value = false
}

// ── TYPE autocomplete
const typeQuery = ref('')
const typeOptions = ref<any[]>([])
const loadingTypes = ref(false)
const showTypeDd = computed(() =>
    typeOpen.value && (loadingTypes.value || typeOptions.value.length > 0)
)
let tTimer:any=null
function onTypeInput() {
  typeOpen.value = true
  clearTimeout(tTimer)
  const q = typeQuery.value.trim()
  if (!q) { typeOptions.value = []; return }
  tTimer = setTimeout(async () => {
    loadingTypes.value = true
    try {
      const params:any = { search: q, limit: 15 }
      if (productForm.group_id) params.group_id = productForm.group_id
      typeOptions.value = await productsApi.searchTypes(params)
    } finally { loadingTypes.value = false }
  }, 250)
}
function selectType(t:any){
  productForm.type_id = t.id
  selectedTypeName.value = t.name             // ← save name
  typeQuery.value = t.name
  typeOptions.value = []
  typeOpen.value = false
  if (!productForm.group_id && t.group_id) productForm.group_id = t.group_id
}
// create
const savingProduct = ref(false)
const productError  = ref('')
async function storeProduct(){
  productError.value = ''
  if (!validateRequired()) {
    console.log(productError);
    productError.value = 'Լրացրեք պարտադիր դաշտերը'
    return
  }
  savingProduct.value = true
  try{
    const payload:any = {
      type_id: productForm.type_id,
      name: productForm.name,
      measure_type: productForm.measure_type,
      group: selectedGroupName.value || groupQuery.value.trim(),
      type:  selectedTypeName.value  || typeQuery.value.trim(),
    }
    if (productForm.characteristics.length) payload.characteristic_ids = productForm.characteristics
    const created = await productsApi.createFromDepartment(payload)
    emit('created', created)
    emit('close')
  } catch(e:any){
    productError.value = e?.response?.data?.message || 'Չհաջողվեց պահպանել'
  } finally { savingProduct.value = false }
}
</script>
