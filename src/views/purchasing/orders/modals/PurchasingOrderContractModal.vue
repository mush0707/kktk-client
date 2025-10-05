<template>
  <div v-if="open" class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/40" @click="$emit('close')"></div>

    <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl bg-white rounded-2xl shadow-xl">
      <div class="flex items-center justify-between px-5 py-4 border-b">
        <h3 class="text-lg font-semibold">
          {{ contract ? 'Պայմանագիր' : 'Ստեղծել պայմանագիր' }}
        </h3>
        <button class="p-2 rounded-lg hover:bg-gray-100" @click="$emit('close')" aria-label="Close">✕</button>
      </div>
      <div class="p-5 space-y-6">
        <!-- ======= VIEW MODE (contract exists) ======= -->
        <template v-if="contract">

          <div v-if="contractData?.id" class="space-y-4">
            <div class="text-sm">
              <div>Համար՝ <span class="font-medium">{{ contractData.identification_number }}</span></div>
              <div>Գործընկեր՝ <span class="font-medium">{{ contractData.partner?.name || '—' }} </span></div>
              <div>Կարգավիճակ՝ <span class="px-2 py-0.5 rounded text-xs bg-gray-100">{{ $t(contractData.status) }}</span></div>
              <div>Սկիզբ՝ <span class="px-2 py-0.5 rounded text-xs bg-gray-100">{{ contractData.start_date }}</span></div>
              <div>Ավարտ՝ <span class="px-2 py-0.5 rounded text-xs bg-gray-100">{{ contractData.finished_date }}</span></div>
            </div>

            <!-- Info: contract months from the main order -->
            <div class="text-sm text-gray-600">
              Պայմանագրի տևողությունը` <span class="font-medium">{{ contractMonths }} (ամիս)</span>
            </div>

            <!-- Per-type upload blocks -->
            <div class="space-y-4">
              <div v-if="contractData.status === 'active'" class="flex flex-col gap-y-2">
                <div class="font-medium">Կցել</div>
                <!-- Contract documents list (VIEW MODE) -->
                <div v-for="t in types" :key="t.id" class="border border-gray-300 rounded-xl p-4">
                  <div class="mb-2 flex items-center gap-2">
                    <span class="font-medium">{{ t.name }}</span>
                    <span v-if="t.required" class="text-red-600 text-xs">★ պարտադիր տեսակ</span>
                  </div>
                  <div class="grid md:grid-cols-3 gap-3 items-center">
                    <div class="md:col-span-2">
                      <input type="file" multiple @change="e => onFilesByType('view', t.id, e)" class="w-full px-3 py-2 rounded-xl border border-gray-500"/>
                    </div>
                    <div class="flex justify-end">
                      <button class="px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                              :disabled="saving || !viewUploads[t.id] || viewUploads[t.id].length===0"
                              @click="uploadDocsByType(t.id)">
                        Վերբեռնել
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="(contractData?.documents || []).length" class="space-y-2">
                <div class="font-medium">Կցված փաստաթղթեր</div>
                <div class="overflow-x-auto border border-gray-300 rounded-xl">
                  <table class="min-w-full text-sm">
                    <thead class="bg-gray-50">
                    <tr class="text-left">
                      <th class="px-3 py-2">Կարգավիճակ</th>
                      <th class="px-3 py-2">Տեսակ</th>
                      <th class="px-3 py-2">Թարմացվել է</th>
                      <th class="px-3 py-2 w-0 text-right"></th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr v-for="doc in contractData.documents" :key="doc.id" class="border-t">
                      <td class="px-3 py-2">{{ $t(doc.status) }}</td>
                      <td class="px-3 py-2">{{ doc.type?.name || '—' }}</td>
                      <td class="px-3 py-2">
                        <span :title="doc.updated_at">{{ formatDateTime(doc.updated_at) }}</span>
                        <span class="text-xs text-gray-400 ml-2">({{ fromNow(doc.updated_at) }})</span>
                      </td>
                      <td class="px-3 py-2 text-right">
                        <div class="flex flex-wrap gap-2">
                          <a
                              class="px-3 py-1 text-xs text-white bg-blue-600 rounded-md hover:bg-blue-700"
                              :href="doc.full_path"
                              target="_blank"
                              rel="noopener"
                              download
                          >
                            Ներբեռնել
                          </a>
                          <button v-if="doc.status==='active'"
                                  class="px-3 py-1 text-xs text-white bg-amber-600 rounded-md hover:bg-amber-700"
                                  @click="onArchive(doc.id)">
                            Արխիվացնել
                          </button>
                        </div>
                      </td>
                    </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>

          <div v-else class="text-sm text-gray-500">Բեռնվում է…</div>
        </template>

        <!-- ======= CREATE MODE (no contract) ======= -->
        <template v-else>
          <!-- Info: contract months from the main order -->
          <div class="text-sm text-gray-600">
            Պայմանագրի տևողությունը` <span class="font-medium">{{ contractMonths }} (ամիս)</span>
          </div>

          <div class="grid md:grid-cols-3 gap-4 items-start">
            <div class="md:col-span-1 flex flex-col gap-y-2">
              <label class="text-sm text-gray-600">Գործընկեր <span class="text-red-600">*</span></label>
              <VueSelect
                  v-model="create.partner"
                  @search="partnerList"
                  :filterable="false"
                  :loading="loading"
                  :is-searchable="true"
                  :get-option-label="o => o.name"
                  :get-option-value="o => o.id"
                  :is-multi="false"
                  :options="partners"
                  :placeholder="'Ընտրիր գործընկեր'"
                  :noResults="'Արդյունք չի գտնվել'"
              >
                <template #no-options>
                  Արդյունք չի գտնվել
                </template>
                <template #option="{ option }">
                  <div class="flex items-center gap-2">
                    <span class="font-medium">{{ option.name }}</span>
                  </div>
                </template>
              </VueSelect>
              <p v-if="showRequiredError && !create.partner" class="text-xs text-red-600 mt-1">
                Խնդրում ենք ընտրել գործընկեր
              </p>
            </div>

            <div class="flex flex-col gap-y-2">
              <label class="text-sm text-gray-600">Սկիզբ <span class="text-red-600">*</span></label>
              <input v-model="create.start_date" type="date" class="w-full px-3 py-2 rounded-xl border border-gray-300"/>
            </div>

            <div class="flex flex-col gap-y-2">
              <label class="text-sm text-gray-600">Ավարտ <span class="text-red-600">*</span></label>
              <input v-model="create.finished_date" type="date" class="w-full px-3 py-2 rounded-xl border border-gray-300"/>
              <p class="text-[11px] text-gray-500">
                <span class="flex flex-col">
                  <span>հաշվարկվում է ավտոմատ:</span>
                  <span v-if="create.start_date">({{ contractMonths }} ամիս = {{ exactDays }} օր)</span>
                </span>
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
                  <input type="file" @change="e => onFilesByType('create', t.id, e)" class="w-full px-3 py-2 rounded-xl border border-gray-500"/>
                  <p v-if="showRequiredError && t.required && (!createUploads[t.id] || createUploads[t.id].length===0)" class="text-xs text-red-600 mt-1">
                    Պարտադիր է
                  </p>
                </div>
              </div>
            </div>
          </div>

          <button class="px-3 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                  :disabled="saving"
                  @click="createContract">
            Ստեղծել պայմանագիր
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, computed, watch, onMounted} from 'vue'
import {purchasingOrdersApi, purchasingPartnerApi} from '@/api.js'
import VueSelect from "vue3-select-component";
import { formatDateTime, fromNow } from '@/utils/dateFormat'


const props = defineProps({
  open: Boolean,
  orderId: { type: [Number, String], required: true },
  contract: { type: Object, default: null }, // { id } կամ null
  withTrashed: Boolean,
})
const emit = defineEmits(['close','saved'])

const saving = ref(false)
const types = ref([]) // [{id,name,required}]

// VIEW
const contractData = ref(null)
const viewUploads = ref({}) // { [typeId]: File[] }

// CREATE
const create = ref({
  partner: null,        // VueSelect binds full object {id,name}
  start_date: '',
  finished_date: ''
})
const createUploads = ref({}) // { [typeId]: File[] }
const showRequiredError = ref(false)

/* ===== Partners (VueSelect) ===== */
const partners = ref([])
const loading = ref(false)

/** Request partners from /purchasing/partners with ?q=search */
async function partnerList(search = '') {
  loading.value = true
  try {
    let resp = null

    resp = await purchasingPartnerApi.list({ search: search, limit: 50 })
    const list = resp?.data?.data ?? resp?.data ?? resp ?? []
    partners.value = list.map(p => ({ id: p.id, name: p.name }))
  } catch (e) {
    console.log(e);
    partners.value = []
  } finally {
    loading.value = false
  }
}
async function onArchive(docId) {
  if (!props.contract?.id) return
  if (!confirm('Արխիվացնել փաստաթուղթը?')) return

  saving.value = true
  try {
    // Assumes API method exists: archiveContractDocument(orderId, contractId, documentId)
    await purchasingOrdersApi.archiveContractDocument(props.orderId, props.contract.id, docId)
    await loadContract() // refresh contractData to reflect archived status
  } catch (e) {
  } finally {
    saving.value = false
  }
}
/* ===== Document types ===== */
async function loadTypes(){
  try{
    const {data} = await purchasingOrdersApi.getContractDocTypes(props.orderId)
    const arr = (data?.data ?? data ?? []).map(d => ({
      id: d.id,
      name: d.name,
      required: !!(d.required ?? d.pivot?.required)
    }))
    types.value = arr
  }catch{
    types.value = []
  }
}

async function loadContract(){
  if (!props.contract?.id) return
  const {data} = await purchasingOrdersApi.getOrderContract(props.orderId, props.contract.id, props.withTrashed ? 1 : 0)
  contractData.value = data?.data ?? data
}

/** Load order meta to get contract_months_qty for auto-calc */
const orderMeta = ref(null)
async function loadOrderMeta() {
  try {
    const { data } = await purchasingOrdersApi.getById(props.orderId)
    orderMeta.value = data?.data ?? data ?? null
  } catch (e) {
    orderMeta.value = null
  }
}

/* ===== Date helpers: exact month addition & day diff ===== */
function toDate(val) {
  if (!val) return null
  const d = new Date(val)
  return isNaN(d.getTime()) ? null : d
}

/** Add N months exactly (calendar-aware, 28/29/30/31 accounted by Date.setMonth) */
function addMonthsExact(date, monthsInt) {
  const d = new Date(date.getTime())
  d.setMonth(d.getMonth() + monthsInt)
  return d
}

/** Whole-day difference */
function diffDays(a, b) {
  const MS = 24 * 60 * 60 * 1000
  const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())
  const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())
  return Math.round((utc2 - utc1) / MS)
}

/* ===== Derived: contract months & finished date auto-calc ===== */
const contractMonths = computed(() => {
  const fromOrder = Number(orderMeta.value?.contract_months_qty ?? 0)
  const fromContract = Number(props.contract?.contract_months_qty ?? 0)
  return fromOrder || fromContract || 0
})

/** EXACT day count between start and start + contractMonths (calendar-precise) */
const exactDays = computed(() => {
  const months = Number(contractMonths.value || 0)
  const start = toDate(create.value.start_date)
  if (!start || !months) return 0
  const end = addMonthsExact(start, months)
  return diffDays(start, end)
})

/** Auto-set finished_date whenever start_date or months change */
watch([() => create.value.start_date, contractMonths], ([start, months]) => {
  const s = toDate(start)
  const m = Number(months || 0)
  if (!s || !m) return
  const end = addMonthsExact(s, m)
  const iso = end.toISOString().slice(0, 10)
  create.value.finished_date = iso
})

/* ===== Uploads / Create ===== */
function onFilesByType(ctx, typeId, e){
  const files = Array.from(e.target.files || [])
  if (ctx === 'view') {
    viewUploads.value = { ...viewUploads.value, [typeId]: files }
  } else {
    createUploads.value = { ...createUploads.value, [typeId]: files }
  }
}

const canCreateBase = computed(()=> !!(create.value.partner && create.value.start_date && create.value.finished_date))
const requiredOk = computed(()=>{
  return types.value
      .filter(t => t.required)
      .every(t => (createUploads.value[t.id] && createUploads.value[t.id].length > 0))
})
const canCreate = computed(()=> canCreateBase.value && requiredOk.value)

async function uploadDocsByType(typeId){
  const files = viewUploads.value[typeId] || []
  if (files.length === 0) return
  saving.value = true
  try{
    const fd = new FormData()
    fd.append('type_id', String(typeId))
    for (const f of files) fd.append('documents[]', f)
    await purchasingOrdersApi.updateContractDocument(props.orderId, props.contract.id, fd)
    viewUploads.value[typeId] = []
    await loadContract()
    alert('Փաստաթուղթը վերբեռնվեց')
  } finally { saving.value = false }
}

async function createContract(){
  showRequiredError.value = true
  if (!canCreate.value) return

  saving.value = true
  try{
    const fd = new FormData()
    fd.append('partner_id', String(create.value.partner || ''))
    fd.append('start_date', create.value.start_date)
    fd.append('finished_date', create.value.finished_date)

    // documents[i][type_id], documents[i][documents][]
    let idx = 0
    for (const t of types.value) {
      const files = createUploads.value[t.id] || []
      if (files.length === 0) continue
      fd.append(`documents[${idx}][type_id]`, String(t.id))
      for (const f of files) fd.append(`documents[${idx}][documents][]`, f)
      idx++
    }

    await purchasingOrdersApi.storeContract(props.orderId, fd)
    alert('Պայմանագիրը ստեղծվեց')
    emit('saved')
    emit('close')
  } finally { saving.value = false }
}

/* ===== Watches / Mount ===== */
watch(()=>props.contract, async (v)=>{
  contractData.value = null
  if (v?.id) await loadContract()
})

onMounted(async ()=>{
  await Promise.all([loadTypes(), loadOrderMeta()])
  // նախնական partner list (դատարկ որոնումով)
  partnerList('')
  if (props.contract?.id) await loadContract()
})
</script>
