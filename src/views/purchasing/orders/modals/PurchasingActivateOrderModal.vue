<template>
  <div v-if="open" class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/40" @click="$emit('close')"></div>

    <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl bg-white rounded-2xl shadow-xl">
      <div class="flex items-center justify-between px-5 py-4 border-b">
        <h3 class="text-lg font-semibold">Ակտիվացնել</h3>
        <button class="p-2 rounded-lg hover:bg-gray-100" @click="$emit('close')" aria-label="Close">✕</button>
      </div>

      <div class="p-5 space-y-6">
        <!-- Info: contract months from the main order -->
        <div class="text-sm text-gray-600">
          Պայմանագրի տևողությունը` <span class="font-medium">{{ contractMonths }} (ամիս)</span>
        </div>

        <div class="grid md:grid-cols-3 gap-4 items-start">
          <div class="flex flex-col gap-y-2">
            <label class="text-sm text-gray-600">Սկիզբ <span class="text-red-600">*</span></label>
            <input v-model="form.start_date" type="date" class="w-full px-3 py-2 rounded-xl border border-gray-300"/>
          </div>

          <div class="flex flex-col gap-y-2">
            <label class="text-sm text-gray-600">Ավարտ <span class="text-red-600">*</span></label>
            <input v-model="form.finished_date" type="date" class="w-full px-3 py-2 rounded-xl border border-gray-300"/>
            <p class="text-[11px] text-gray-500" v-if="form.start_date">
              ({{ contractMonths }} ամիս = {{ exactDays }} օր)
            </p>
          </div>
        </div>

        <div class="space-y-4">
          <div class="font-medium">Փաստաթղթեր</div>

          <div v-for="t in types" :key="t.id" class="border border-gray-300 rounded-xl p-4">
            <div class="mb-2 flex items-center gap-2">
              <span class="font-medium">{{ t.name }}</span>
              <span v-if="t.required" class="text-red-600 text-xs">★ պարտադիր</span>
            </div>
            <div class="grid md:grid-cols-3 gap-3 items-center">
              <div class="md:col-span-3">
                <input type="file" multiple @change="e => onFilesByType(t.id, e)" class="w-full px-3 py-2 rounded-xl border border-gray-500"/>
                <p v-if="showRequiredError && t.required && (!uploads[t.id] || uploads[t.id].length===0)" class="text-xs text-red-600 mt-1">
                  Պարտադիր է առնվազն 1 փաստաթուղթ
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t">
          <button class="px-3 py-2 rounded-xl border hover:bg-gray-50" @click="$emit('close')">Փակել</button>
          <button class="px-3 py-2 rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                  :disabled="saving"
                  @click="submit">
            Ակտիվացնել
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, watch, onMounted} from 'vue'
import { purchasingOrdersApi } from '@/api.js'
import { useToast } from 'vue-toastification'

const props = defineProps<{
  open: boolean,
  orderId: number
}>()
const emit = defineEmits(['close','saved'])
const toast = useToast()

const saving = ref(false)
const types = ref<Array<{id:number; name:string; required?:boolean}>>([])

const form = ref({
  start_date: '',
  finished_date: ''
})
const uploads = ref<Record<number, File[]>>({})
const showRequiredError = ref(false)

// ===== Load document types for activate =====
async function loadTypes(){
  try{
    const {data} = await purchasingOrdersApi.getActiveOrderDocTypes()
    const arr = (data?.data ?? data ?? []).map((d:any) => ({
      id: d.id,
      name: d.name,
      required: !!(d.required ?? d.pivot?.required)
    }))
    types.value = arr
  }catch{
    types.value = []
  }
}

// ===== Get order meta to read contract_months_qty for precise end-date =====
const orderMeta = ref<any>(null)
async function loadOrderMeta() {
  try {
    const { data } = await purchasingOrdersApi.getById(props.orderId)
    orderMeta.value = data?.data ?? data ?? null
  } catch (e) {
    orderMeta.value = null
  }
}

const contractMonths = computed(() => Number(orderMeta.value?.contract_months_qty || 0))

// Calendar-precise helpers
function toDate(val: string) {
  if (!val) return null
  const d = new Date(val)
  return isNaN(d.getTime()) ? null : d
}
function addMonthsExact(date: Date, monthsInt: number) {
  const d = new Date(date.getTime())
  d.setMonth(d.getMonth() + monthsInt)
  return d
}
function diffDays(a: Date, b: Date) {
  const MS = 24 * 60 * 60 * 1000
  const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())
  const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())
  return Math.round((utc2 - utc1) / MS)
}
const exactDays = computed(() => {
  const months = Number(contractMonths.value || 0)
  const start = toDate(form.value.start_date)
  if (!start || !months) return 0
  const end = addMonthsExact(start, months)
  return diffDays(start, end)
})
watch([() => form.value.start_date, contractMonths], ([start, months]) => {
  const s = toDate(start as string)
  const m = Number(months || 0)
  if (!s || !m) return
  const end = addMonthsExact(s, m)
  form.value.finished_date = end.toISOString().slice(0,10)
})

// uploads
function onFilesByType(typeId:number, e:Event){
  const files = Array.from((e.target as HTMLInputElement)?.files || [])
  uploads.value = { ...uploads.value, [typeId]: files as File[] }
}

const canSubmitBase = computed(()=> !!(form.value.start_date && form.value.finished_date))
const requiredOk = computed(()=>{
  return types.value
      .filter(t => t.required)
      .every(t => (uploads.value[t.id] && uploads.value[t.id].length > 0))
})
const canSubmit = computed(()=> canSubmitBase.value && requiredOk.value)

async function submit(){
  showRequiredError.value = true
  if (!canSubmit.value) {
    toast.error('Լրացրեք պարտադիր դաշտերը')
    return
  }
  saving.value = true
  try{
    const fd = new FormData()
    fd.append('start_date', form.value.start_date)
    fd.append('finished_date', form.value.finished_date)

    // documents[i][type_id], documents[i][documents][]
    let idx = 0
    for (const t of types.value) {
      const files = uploads.value[t.id] || []
      if (files.length === 0) continue
      fd.append(`documents[${idx}][type_id]`, String(t.id))
      for (const f of files) fd.append(`documents[${idx}][documents][]`, f)
      idx++
    }

    // ✅ ուղարկում ենք purchasingOrdersApi.activate(orderId, FormData)
    await purchasingOrdersApi.activate(props.orderId, fd)
    toast.success('Պատվերը ակտիվացվեց')
    emit('saved')
    emit('close')
  } catch (e:any) {
    toast.error(e?.response?.data?.message || 'Չհաջողվեց ակտիվացնել')
  } finally {
    saving.value = false
  }
}

onMounted(async ()=>{
  await Promise.all([loadTypes(), loadOrderMeta()])
})
</script>
