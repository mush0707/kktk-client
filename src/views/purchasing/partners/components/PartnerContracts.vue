<template>
  <div class="fixed inset-0 z-40" v-if="open">
    <div class="absolute inset-0 bg-black/30" @click="$emit('close')"></div>
    <div class="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-xl p-5 overflow-y-auto">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold">{{ form.id ? 'Մատակարար' : 'Նոր մատակարար' }}</h2>
        <button class="p-2 rounded-lg hover:bg-gray-100" @click="$emit('close')">✕</button>
      </div>


      <div class="space-y-3">
        <label class="block">
          <span class="text-sm text-gray-600">Անուն</span>
          <input v-model="form.name" class="w-full px-3 py-2 rounded-xl border" placeholder="Անվանում">
        </label>


        <label class="block">
          <span class="text-sm text-gray-600">Տեսակ</span>
          <select v-model="form.kind" class="w-full px-3 py-2 rounded-xl border">
            <option v-for="k in kinds" :key="k.value" :value="k.value">{{ k.label }}</option>
          </select>
        </label>


        <label class="block">
          <span class="text-sm text-gray-600">Հիմնական մենեջեր</span>
          <input v-model="form.manager_id" class="w-full px-3 py-2 rounded-xl border" placeholder="User ID">
        </label>


        <div class="grid md:grid-cols-2 gap-3">
          <label class="block">
            <span class="text-sm text-gray-600">TIN</span>
            <input v-model="form.tin" class="w-full px-3 py-2 rounded-xl border" placeholder="ՀՎՀՀ">
          </label>
          <label class="block">
            <span class="text-sm text-gray-600">Հիմնական արժույթ</span>
            <input v-model="form.default_currency_id" class="w-full px-3 py-2 rounded-xl border" placeholder="Currency ID">
          </label>
        </div>


        <div class="flex items-center gap-2">
          <button :disabled="saving" class="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
                  @click="save">Պահպանել</button>
          <button class="px-4 py-2 rounded-xl border" @click="$emit('close')">Փակել</button>
        </div>


        <div class="border rounded-xl p-3">
          <p class="font-medium mb-2">Պայմանագրեր</p>
          <div v-if="agreements.length===0" class="text-sm text-gray-500">—</div>
          <ul class="space-y-2">
            <li v-for="a in agreements" :key="a.id" class="flex items-center justify-between">
              <div>
                <div class="font-medium">#{{ a.code }} · {{ a.status }}</div>
                <div class="text-xs text-gray-500">Valid: {{ a.valid_from }} → {{ a.valid_to }}</div>
              </div>
              <button class="px-3 py-1.5 rounded-lg border text-sm">Բացել</button>
            </li>
          </ul>
        </div>
      </div>


    </div>
  </div>
</template>
<script setup>
import {watch, ref} from 'vue'
import {purchasingPartnerApi} from '@/api'


const props = defineProps({ open: Boolean, supplier: { type: Object, default: null } })
const emit = defineEmits(['close','saved'])


const kinds = [
  { value: 'legal_entity', label: 'Իրավաբանական անձ' },
  { value: 'legal_group', label: 'Իրավաբանական խմբավորում' },
  { value: 'sole_entrepreneur', label: 'Անհատ ձեռնարկատեր' },
  { value: 'individual', label: 'Ֆիզ. անձ' },
  { value: 'nonresident_legal', label: 'Ոչ ռեզ. իրավաբանական' },
  { value: 'nonresident_branch', label: 'Ոչ ռեզ. մասնաճյուղ' },
]


const form = ref({})
const saving = ref(false)
const agreements = ref([])


watch(()=>props.supplier, async (v)=>{
  form.value = { ...(v||{}) }
  agreements.value = []
  if(v?.id){
    try{
      const { data } = await purchasingPartnerApi.getContracts(v.id)
      agreements.value = data?.data ?? data ?? []
    } catch {}
  }
},{immediate:true})


async function save(){
  saving.value = true
  try{
    if(form.value.id){
      await api.put(`/suppliers/${form.value.id}`, form.value)
    } else {
      await api.post(`/suppliers`, form.value)
    }
    emit('saved')
    emit('close')
  } finally {
    saving.value = false
  }
}
</script>