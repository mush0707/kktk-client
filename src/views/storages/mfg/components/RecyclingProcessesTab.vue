<!-- src/views/storages/mfg/components/RecyclingProcessTab.vue -->
<template>
  <section class="space-y-4">
    <div class="flex items-center justify-between">
      <div class="text-lg text-gray-400 font-medium">{{ $t('processes','Պրոցեսներ') }}</div>
      <button class="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700" @click="openModal">
        Բացել պրոցես
      </button>
    </div>

    <!-- Filters -->
    <div class="bg-white p-4 rounded-2xl border border-gray-200">
      <div class="flex items-center gap-3 flex-wrap">
        <input
            v-model="filters.search"
            :placeholder="$t('search','Փնտրել')"
            class="border border-gray-300 w-72 rounded-xl px-3 py-2"
            @input="debounceReload"
        />
        <select v-model="filters.status" class="border border-gray-300 rounded-xl px-3 py-2" @change="reload">
          <option value="">{{ $t('all','Բոլորը') }}</option>
          <option value="pending">pending</option>
          <option value="approved">approved</option>
          <option value="cancelled">cancelled</option>
        </select>
      </div>
    </div>

    <!-- MAIN LIST -->
    <div class="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <table class="min-w-full text-sm">
        <thead class="bg-gray-50">
        <tr>
          <th class="px-6 py-3 text-left">#</th>
          <th class="px-6 py-3 text-left">{{ $t('product','Արտադրանք') }}</th>
          <th class="px-6 py-3 text-left">{{ $t('qty','Քանակ') }}</th>
          <th class="px-6 py-3 text-left">{{ $t('status','Կարգավիճակ') }}</th>
          <th class="px-6 py-3 text-left">Թարմացվել է</th>
          <th class="px-6 py-3 text-right">{{ $t('actions','Գործողություններ') }}</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="row in list.rows" :key="row.id" class="border-t">
          <td class="px-6 py-3">{{ row.identification_number || row.id }}</td>
          <td class="px-6 py-3">
            <div class="font-medium">{{ row.manufacturing_produce.product?.name || '-' }}</div>
            <div class="text-xs text-gray-500" v-if="(row.produce?.characteristics||[]).length">
                <span v-for="(c,i) in row.manufacturing_produce.product.characteristics" :key="i" class="mr-1">
                  {{ (c.type ?? c.name) || '—' }}
                </span>
            </div>
          </td>
          <td class="px-6 py-3">{{ fmt(row.qty || 0) }} {{ $t(row.measure || 'piece') }}</td>
          <td class="px-6 py-3">
              <span
                  class="px-2 py-0.5 rounded text-xs"
                  :class="row.status==='approved' ? 'bg-emerald-100 text-emerald-700'
                        : row.status==='cancelled' ? 'bg-rose-100 text-rose-700'
                        : 'bg-slate-100 text-slate-700'">
                {{ row.status ? $t(row.status) : $t('pending') }}
              </span>
          </td>
          <td class="px-6 py-3">
            <span :title="row.updated_at">{{ formatDateTime(row.updated_at) }}</span>
            <span class="text-xs text-gray-400 ml-2">({{ fromNow(row.updated_at) }})</span>
          </td>
          <td class="px-6 py-3">
            <div class="flex justify-end gap-2">
              <button class="px-3 py-1 text-xs border rounded-md hover:bg-gray-50" @click="openDetails(row)">
                {{ $t('details','Մանրամասներ') }}
              </button>
              <template v-if="row.status==='pending'">
                <button
                    class="px-3 py-1 text-xs bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50"
                    :disabled="savingId===row.id"
                    @click="approve(row)"
                >
                  {{ savingId===row.id ? $t('processing','Կատարվում է…') : $t('approve','Հաստատել') }}
                </button>
                <button
                    class="px-3 py-1 text-xs bg-rose-600 text-white rounded-md hover:bg-rose-700 disabled:opacity-50"
                    :disabled="savingId===row.id"
                    @click="cancel(row)"
                >
                  {{ $t('cancel','Չեղարկել') }}
                </button>
              </template>
            </div>
          </td>
        </tr>
        <tr v-if="!list.loading && list.rows.length===0">
          <td colspan="6" class="px-6 py-8 text-center text-gray-500">{{ $t('no_data','Տվյալներ չկան') }}</td>
        </tr>
        </tbody>
      </table>
      <div class="p-3 text-center" v-if="list.loading">{{ $t('loading','Լցվում է…') }}</div>
      <div ref="sentinel" class="h-10"></div>
    </div>

    <div v-if="modal.open" class="fixed inset-0 z-50 flex">
      <div class="flex-1 bg-black/40" @click="closeModal"></div>
      <div class="w-full max-w-3xl h-screen overflow-y-auto bg-white shadow-xl p-6">
        <div class="flex items-center justify-between border-b pb-4">
          <div class="text-lg font-semibold">Նոր պրոցես</div>
          <button class="p-2 rounded-lg hover:bg-gray-100" @click="closeModal">✕</button>
        </div>

        <div class="mt-6 grid lg:grid-cols-1 gap-6">
          <!-- LEFT: Produce (target) -->
          <div class="space-y-4 border-b pb-4">
            <div class="flex flex-col gap-y-2">
              <label class="block text-gray-500 mb-1">Արտադրանք</label>
              <VueSelect
                  v-model="form.produceId"
                  @search="searchProduces"
                  :filterable="false"
                  :loading="produce.loading"
                  :is-searchable="true"
                  :get-option-label="o => o.product.name"
                  :get-option-value="o => o.id"
                  :is-multi="false"
                  :options="produce.options"
                  :placeholder="$t('select_product','Ընտրեք արտադրանք')"
                  :noResults="$t('no_results','Արդյունք չի գտնվել')"
              >
                <template #no-options>{{ $t('no_results','Արդյունք չի գտնվել') }}</template>
                <template #option="{ option }">
                  <div class="flex items-center gap-2">
                    <span class="font-medium">{{ option.product.name }}</span>
                    <span class="text-xs text-gray-500" v-if="(option.product.characteristics||[]).length">
                        • {{ option.product.characteristics.map((x)=>x.name).join(', ') }}
                      </span>
                  </div>
                </template>
              </VueSelect>
            </div>

            <div v-if="selectedProduce" class="space-y-4">
              <div class="grid grid-cols-2 gap-3">
                <div class="flex flex-col gap-y-2">
                  <label class="text-xs text-gray-500">Քանակ</label>
                  <input
                      v-model.number="form.qty"
                      type="number" min="0" step="0.001"
                      class="w-full bg-white px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div class="flex flex-col gap-y-2">
                  <label class="text-xs text-gray-500">Չափման միավոր</label>
                  <select v-model="form.measure" class="w-full bg-white px-3 py-2 border border-gray-300 rounded-lg">
                    <option v-for="m in produceMeasureOptions" :key="m" :value="m">{{ $t(m, m) }}</option>
                  </select>
                  <p class="text-xs text-gray-400">
                    {{ $t('based_on_measure_type','Ըստ չափի տեսակի') }}:
                    <span class="font-medium">{{ $t(currentMeasureType) }}</span>
                  </p>
                </div>
              </div>

              <button
                  type="button"
                  class="px-3 py-2 rounded-lg border text-sm hover:bg-gray-50"
                  :disabled="prefill.loading"
                  @click="prefillFromLast"
              >
                {{ prefill.loading ? $t('processing','Կատարվում է…') : 'Լրացնել ֆորման վերջին պրոցեսի տվյալներով' }}
              </button>
            </div>
          </div>

          <!-- RIGHT: Materials -->
          <div class="space-y-4">
            <div class="flex flex-col gap-y-2">
              <label class="block text-gray-500 mb-1">Հումքեր</label>
              <VueSelect
                  v-model="materialSelect.selectedId"
              @search="searchMaterials"
              @update:modelValue="onPickMaterial"
              :filterable="false"
              :loading="materialSelect.loading"
              :is-searchable="true"
              :get-option-label="o => (o.manufacturing_product?.product?.name || ('#'+o.manufacturing_product?.product_id))"
              :get-option-value="o => o.id"
              :is-multi="false"
              :options="materialSelect.options"
              :placeholder="$t('select_material','Ընտրեք հումք')"
              :noResults="$t('no_results','Արդյունք չի գտնվել')"
              >
              <template #no-options>{{ $t('no_results','Արդյունք չի գտնվել') }}</template>
              <template #option="{ option }">
                <div class="flex flex-col">
      <span class="font-medium">
        {{ option.manufacturing_product?.product?.name || ('#'+option.manufacturing_product?.product_id) }}
      </span>
                  <span class="text-xs text-gray-500">
        {{ $t('available','Մատչելի') }}: {{ fmt(Math.max(0, Number(option.qty||0) - Number(option.reserved_qty||0))) }}
        {{ $t(option.measure||'kg') }}
      </span>
                </div>
              </template>
              </VueSelect>
            </div>

            <div class="rounded-xl border border-gray-200 overflow-hidden mt-3">
              <table class="min-w-full text-sm">
                <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left">Հումք</th>
                  <th class="px-4 py-3 text-left">Քանակ</th>
                  <th class="px-4 py-3 text-right"></th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="(it, idx) in form.materials" :key="it.id" class="border-t">
                  <td class="px-4 py-2">
                    <div class="font-medium">
                      {{ it.manufacturing_product?.product?.name || it.manufacturing_recycle_material.manufacturing_product.product?.name }}
                    </div>
                    <div class="text-xs text-gray-500">
                      {{ $t('available','Մատչելի') }}:
                      {{ fmt(Math.max(0, Number(it.manufacturing_recycle_material?.qty || it.qty || 0) - Number(it.manufacturing_recycle_material?.reserved_qty || it.reserved_qty || 0))) }}
                      {{ $t(it.measure||'kg') }}
                    </div>
                  </td>
                  <td class="px-4 py-2">
                    <div class="flex items-center gap-2">
                      <input
                          v-model.number="it.input_qty"
                          type="number"
                          min="0"
                          :max="Math.max(0, Number(it.qty||0) - Number(it.reserved_qty||0))"
                          step="0.001"
                          class="w-40 bg-white px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      <span class="text-xs text-gray-600">{{ $t(it.measure||'kg') }}</span>
                    </div>
                  </td>
                  <td class="px-4 py-2 text-right">
                    <button class="px-2 py-1 text-xs border rounded-lg" @click="removePicked(idx)">
                      {{ $t('remove','Հեռացնել') }}
                    </button>
                  </td>
                </tr>
                <tr v-if="!form.materials.length">
                  <td colspan="3" class="px-4 py-6 text-center text-gray-500">{{ $t('empty','Դատարկ') }}</td>
                </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="mt-6 border-t pt-4 flex items-center justify-end gap-2">
          <button class="px-4 py-2 rounded-xl border" @click="closeModal">{{ $t('cancel','Փակել') }}</button>
          <button
              class="px-4 py-2 rounded-xl bg-indigo-600 text-white disabled:opacity-60"
              :disabled="!canSubmit || saving"
              @click="submit"
          >
            {{ saving ? $t('processing','Կատարվում է…') : $t('save','Պահպանել') }}
          </button>
        </div>
      </div>
    </div>


    <!-- DETAILS MODAL -->
    <div v-if="details.open" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/40" @click="closeDetails"></div>
      <div class="absolute right-0 top-0 h-screen w-full max-w-3xl bg-white shadow-xl transform transition ease-out duration-300">
        <div class="flex items-center justify-between px-5 py-4 border-b">
          <div class="font-semibold">
            {{ $t('details','Մանրամասներ') }} — {{ details.row?.identification_number || details.row?.id }}
          </div>
          <button class="p-2 hover:bg-gray-100 rounded-lg" @click="closeDetails">✕</button>
        </div>

        <div class="p-5 space-y-4 h-[calc(100vh-140px)] overflow-y-auto">
          <div class="grid md:grid-cols-2 gap-3">
            <div>
              <div class="text-xs text-gray-500">{{ $t('product','Արտադրանք') }}</div>
              <div class="font-medium">{{ details.row?.manufacturing_produce.product.name || '-' }}</div>
              <div class="text-xs text-gray-500" v-if="(details.row?.manufacturing_produce.product.characteristics||[]).length">
                <span v-for="(c,i) in details.row?.manufacturing_produce.product.characteristics" :key="i" class="mr-1">
                  {{ (c.type ?? c.name) || '—' }}<template v-if="c.value">: {{ c.value }}</template>
                </span>
              </div>
            </div>
            <div>
              <div class="text-xs text-gray-500">{{ $t('qty','Քանակ') }}</div>
              <div class="font-medium">
                {{ fmt(details.row?.qty || 0) }} {{ $t(details.row?.measure || 'piece') }}
              </div>
            </div>
            <div>
              <div class="text-xs text-gray-500">{{ $t('status','Կարգավիճակ') }}</div>
              <span
                  class="px-2 py-0.5 rounded text-xs"
                  :class="details.row?.status==='approved' ? 'bg-emerald-100 text-emerald-700'
                        : details.row?.status==='cancelled' ? 'bg-rose-100 text-rose-700'
                        : 'bg-slate-100 text-slate-700'">
                {{ details.row?.status ? $t(details.row?.status) : $t('pending') }}
              </span>
            </div>
            <div>
              <div class="text-xs text-gray-500">Թարմացվել է</div>
              <div class="font-medium">
                <span :title="details.row.updated_at">{{ formatDateTime(details.row.updated_at) }}</span>
                <span class="text-xs text-gray-400 ml-2">({{ fromNow(details.row.updated_at) }})</span>
              </div>
            </div>
          </div>

          <div class="rounded-xl border border-gray-200 overflow-hidden">
            <table class="min-w-full text-sm">
              <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left">{{ $t('material','Հումք') }}</th>
                <th class="px-4 py-3 text-left">{{ $t('qty','Քանակ') }}</th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="m in details.materials" :key="m.id || m.manufacturing_recycle_material_id" class="border-t">
                <td class="px-4 py-2">
                  <div class="font-medium">
                    {{ m.manufacturing_product?.product?.name
                  || m.manufacturing_recycle_material.manufacturing_product.product?.name
                  || m.name
                  || ('#'+(m.manufacturing_product?.product_id || m.manufacturing_recycle_material_id || m.id)) }}
                  </div>
                </td>
                <td class="px-4 py-2">
                  {{ fmt(m.qty || m.input_qty || 0) }} {{ $t(m.measure || 'kg') }}
                </td>
              </tr>
              <tr v-if="!details.loading && details.materials.length===0">
                <td colspan="2" class="px-4 py-6 text-center text-gray-500">{{ $t('no_data','Տվյալներ չկան') }}</td>
              </tr>
              </tbody>
            </table>
            <div class="p-3 text-center" v-if="details.loading">{{ $t('loading','Լցվում է…') }}</div>
          </div>
        </div>

        <div class="px-5 py-4 border-t flex justify-end gap-2">
          <template v-if="details.row?.status==='pending'">
            <button
                class="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                :disabled="savingId===details.row?.id"
                @click="approve(details.row!)"
            >
              {{ savingId===details.row?.id ? $t('processing','Կատարվում է…') : $t('approve','Հաստատել') }}
            </button>
            <button
                class="px-4 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
                :disabled="savingId===details.row?.id"
                @click="cancel(details.row!)"
            >
              {{ $t('cancel','Չեղարկել') }}
            </button>
          </template>
          <button class="px-4 py-2 rounded-xl border" @click="closeDetails">{{ $t('close','Փակել') }}</button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import VueSelect from 'vue3-select-component'
import {recyclingProcessApi, recyclingMaterialsApi, recyclingProduceApi} from '@/api.js'
import { formatDateTime, fromNow } from '@/utils/dateFormat'

type ID = number
const props = defineProps<{ storageId: ID }>()
const fmt = (n:any) => Number(n||0).toLocaleString(undefined,{ maximumFractionDigits:3 })

/* ───────── List + infinite scroll ───────── */
const list = reactive({ rows:[] as any[], loading:false, end:false, limit:30, offset:0 })
const sentinel = ref<HTMLElement|null>(null)
let io:IntersectionObserver|null = null
const filters = reactive({ search:'', status:'' })
let t:any=null
function debounceReload(){ clearTimeout(t); t=setTimeout(reload, 300) }

async function fetchPage(){
  if (list.loading || list.end) return
  list.loading = true
  try{
    const res = await recyclingProcessApi.list(props.storageId, {
      limit: list.limit,
      offset: list.offset,
      search: filters.search || undefined,
      status: filters.status || undefined,
    })
    const data = Array.isArray(res) ? res : (res?.data?.data ?? [])
    list.rows.push(...data)
    list.offset += data.length
    if (data.length < list.limit) list.end = true
  } finally { list.loading = false }
}
function reload(){ list.rows=[]; list.offset=0; list.end=false; fetchPage() }
function startObserver(){
  if (!sentinel.value) return
  io = new IntersectionObserver(es => { if (es[0].isIntersecting) fetchPage() })
  io.observe(sentinel.value)
}
onBeforeUnmount(()=>{ if(io && sentinel.value) io.unobserve(sentinel.value) })

/* ───────── Create modal state ───────── */
const modal = reactive({ open:false })
const saving = ref(false)

function openModal(){
  modal.open = true
  // preload produce list for empty search
  searchProduces('')
}
function closeModal(){ modal.open = false }

/* Produce select returns numeric id */
const form = reactive({
  produceId: null as number|null,
  qty: 0,
  measure: 'piece',
  materials: [] as any[],
})

/* Cache of produce options (for label/measure lookup) */
const produce = reactive({ loading:false, options: [] as any[] })

/* When we have an id, find the full object */
const selectedProduce = computed(()=> {
  if (!form.produceId) return null
  return produce.options.find((o:any)=> Number(o.id) === Number(form.produceId)) || null
})

/* Map measure_type -> options */
const measureMap: Record<string,string[]> = {
  weight: ['tonn','kg','g'],
  capacity: ['l','ml'],
  length: ['m','sm','mm'],
  piece: ['piece'],
}
const currentMeasureType = computed(()=> selectedProduce.value?.product.measure_type || 'piece')
const produceMeasureOptions = computed(()=> measureMap[currentMeasureType.value] || measureMap.piece)

/* Keep measure default in sync when product changes */
watch(selectedProduce, (p)=>{
  form.measure = (measureMap[p?.measure_type || 'piece']?.[0]) || 'piece'
})

/* Prefill from last process for selected produce */
const prefill = reactive({ loading:false })
async function prefillFromLast(){
  if (!form.produceId) return
  prefill.loading = true
  try{
    const res = await recyclingProcessApi.prefillLast(props.storageId, form.produceId)
    const data = Array.isArray(res) ? res[0] : (res?.data?.data ?? res) || {}
    if (data.qty) form.qty = Number(data.qty)
    if (data.measure) form.measure = data.measure
    if (Array.isArray(data.materials)) {
      form.materials = data.materials.map((m:any)=>({
        ...m,
        input_qty: Number(m.qty || m.input_qty || 0),
      }))
    }
  } finally { prefill.loading = false }
}

/* Materials picker */
const materialSelect = reactive({
  loading:false,
  options: [] as any[],
  selected: null as any,
})
function materialLabel(o:any){
  return o?.manufacturing_product?.product?.name || `#${o?.manufacturing_product?.product_id||o?.id}`
}
function availableFor(row:any){
  const total = Number(row.manufacturing_recycle_material.qty || row.qty||0)
  const reserved = Number(row.manufacturing_recycle_material.reserved_qty || row.reserved_qty||0)
  return Math.max(0, total - reserved)
}
async function searchMaterials(search: string) {
  materialSelect.loading = true
  try {
    const res = await recyclingMaterialsApi.list(props.storageId, { limit: 20, offset: 0, search })
    const all = Array.isArray(res) ? res : (res?.data ?? [])
    const pickedIds = new Set(form.materials.map((m:any) => m.id))
    materialSelect.options = all.filter((o:any) => !pickedIds.has(o.id))
  } finally {
    materialSelect.loading = false
  }
}
function onPickMaterial(id: number | null) {
  if (!id) return
  const opt = materialSelect.options.find((o:any) => o.id === id)
  if (!opt) { materialSelect.selectedId = null; return }
  // prevent duplicates
  if (form.materials.some((m:any) => m.id === id)) { materialSelect.selectedId = null; return }

  const item = {
    id: opt.id,
    measure: opt.measure,
    qty: Number(opt.qty || 0),
    reserved_qty: Number(opt.reserved_qty || 0),
    input_qty: 0,
    manufacturing_product: opt.manufacturing_product, // keep nested product for name rendering
  }
  form.materials.unshift(item)
  materialSelect.options = materialSelect.options.filter((o:any) => o.id !== id)
  materialSelect.selectedId = null
}
function removePicked(idx: number) {
  const [it] = form.materials.splice(idx, 1)
  if (it) {
    // return to dropdown options so it can be picked again
    materialSelect.options.unshift(it)
  }
}

/* Search produces (fills options cache used by selectedProduce) */
async function searchProduces(search:string){
  produce.loading = true
  try{
    const res = await recyclingProduceApi.list(props.storageId, {
      search: search,
      limit: 50,
      status: 'active'
    })
    const list = Array.isArray(res) ? res : (res?.data ?? [])
    console.log(list);
    // Keep already selected produce (if not in results) appended for label/measure lookup
    const selected = selectedProduce.value
    produce.options = selected && !list.find((o:any)=> Number(o.id)===Number(selected.id))
        ? [selected, ...list]
        : list
  } finally { produce.loading = false }
}

/* Submit */
const canSubmit = computed(()=>{
  if (!form.produceId) return false
  if (!form.qty || form.qty<=0) return false
  // materials qty must be valid
  for (const m of form.materials) {
    const max = availableFor(m)
    if (!m.input_qty || m.input_qty<=0 || m.input_qty>max) return false
  }
  return true
})
async function submit(){
  if (!canSubmit.value || saving.value) return
  saving.value = true
  try{
    const payload = {
      manufacturing_produce_id: Number(form.produceId),
      qty: Number(form.qty),
      measure: form.measure,
      materials: form.materials.map((m:any)=>({
        manufacturing_recycle_material_id: Number(m.id),
        qty: Number(m.input_qty),
        measure: m.measure || 'piece'
      }))
    }
    await recyclingProcessApi.create(props.storageId, payload)
    closeModal()
    reload()
  } finally { saving.value = false }
}

/* Details modal */
const details = reactive<{ open:boolean; row:any|null; loading:boolean; materials:any[] }>({
  open:false, row:null, loading:false, materials:[]
})
async function openDetails(row:any){
  details.row = row
  details.open = true
  if (Array.isArray(row.materials) && row.materials.length) { details.materials = row.materials; return }
  details.loading = true
  try{
    const res = await recyclingProcessApi.getById?.(props.storageId, row.id)
    const data = Array.isArray(res) ? res[0] : (res?.data ?? res)
    details.materials = data?.materials || []
  } catch { details.materials = [] } finally { details.loading=false }
}
function closeDetails(){ details.open=false; details.row=null; details.materials=[]; details.loading=false }

/* Approve / Cancel */
const savingId = ref<number|null>(null)
async function approve(row:any){
  if (!row?.id || savingId.value) return
  savingId.value = row.id
  try{ await recyclingProcessApi.approve(props.storageId, row.id); row.status='approved'; if(details.row?.id===row.id) details.row.status='approved' }
  finally{ savingId.value=null }
}
async function cancel(row:any){
  if (!row?.id || savingId.value) return
  savingId.value = row.id
  try{ await recyclingProcessApi.cancel(props.storageId, row.id); row.status='cancelled'; if(details.row?.id===row.id) details.row.status='cancelled' }
  finally{ savingId.value=null }
}

/* Mount */
onMounted(()=>{ reload(); startObserver() })
</script>
