<!-- src/views/storages/mfg/components/RecyclingProducesTab.vue -->
<template>
  <section class="space-y-3">
    <div class="flex items-center justify-between">
      <div class="text-lg text-gray-400 font-medium">Արտադրանք</div>
      <div class="flex gap-2">
        <button class="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700" @click="openNewProduce">
          Կցել նոր արտադրանք
        </button>
        <button class="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700" @click="openExistModal">
          Ընտրել առկա արտադրանքներից
        </button>
      </div>
    </div>

    <!-- Sticky basket (outputs) -->
    <div v-if="hasAnyBasket" class="flex bottom-4">
      <div
          v-if="baskets.outputs.items.length"
          class="rounded-2xl border border-amber-200/70 bg-gradient-to-r from-amber-50 to-yellow-50 shadow-sm"
      >
        <div class="flex flex-col md:flex-row items-start md:items-center gap-3 p-4">
          <div class="flex items-center gap-2 text-sm">
            <span class="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 border border-amber-200 shadow-xs">
              <svg class="h-4 w-4 text-amber-600" viewBox="0 0 24 24" fill="none">
                <path d="M3 3h2l2.4 12.1a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L21 7H6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="9" cy="20" r="1.5" fill="currentColor"/>
                <circle cx="18" cy="20" r="1.5" fill="currentColor"/>
              </svg>
              <span class="font-medium">{{ $t('outputs','Ելքեր') }}</span>
              <span class="font-semibold">{{ baskets.outputs.items.length }}</span>
            </span>
          </div>
          <div class="md:ml-auto flex items-stretch gap-2 w-full md:w-auto">
            <button
                type="button"
                class="inline-flex justify-center items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-amber-700 disabled:opacity-50 w-full md:w-auto"
                :disabled="baskets.outputs.sending || !baskets.outputs.items.length"
                @click="openOutputsConfirm"
            >
              <svg v-if="baskets.outputs.sending" class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" d="M4 12a8 8 0 018-8" stroke="currentColor" stroke-width="4"/>
              </svg>
              <span>{{ $t('send','Ուղարկել') }}</span>
            </button>
          </div>
        </div>
      </div>
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
          <option value="on_hold">Կանգնեցված</option>
          <option value="active">Ակտիվ</option>
        </select>
      </div>
    </div>

    <!-- List -->
    <div class="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <table class="min-w-full text-sm">
        <thead class="bg-gray-50">
        <tr>
          <th class="px-6 py-3 text-left">Արտադրանք</th>
          <th class="px-6 py-3 text-left">Քանակ / Ռեզերվ</th>
          <th class="px-6 py-3 text-left">{{ $t('status','Կարգավիճակ') }}</th>
          <th class="px-6 py-3 text-right">{{ $t('actions','Գործողություններ') }}</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="p in state.rows" :key="p.id" class="border-t">
          <td class="px-6 py-3">
            <div class="font-medium">{{ p.product?.name || '-' }}</div>
            <div class="text-xs text-gray-500" v-if="(p.product?.characteristics||[]).length">
              <span v-for="(c,i) in p.product.characteristics" :key="i" class="mr-1">{{ c.name }}</span>
            </div>
          </td>
          <td class="px-6 py-3">
            <div>
              <span class="font-medium">{{ fmt(p.qty || 0) }}</span>
              /
              <span class="text-gray-600">{{ fmt(p.reserved_qty || 0) }}</span>
              {{ $t(p.measure || 'piece') }}
            </div>
            <div class="text-xs text-gray-500 mt-1">
              {{ $t('available','Մատչելի') }}:
              {{ fmt(availableFor(p)) }} {{ $t(p.measure || 'piece') }}
            </div>
          </td>
          <td class="px-6 py-3">
              <span
                  class="px-2 py-0.5 rounded text-xs"
                  :class="p.status==='active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'"
              >
                {{ $t(p.status) }}
              </span>
          </td>
          <td class="px-6 py-3">
            <div class="flex justify-end gap-2">
              <button
                  v-if="p.status==='on_hold'"
                  class="px-3 py-1 text-xs bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                  @click="activate(p)"
              >
                Ակտիվացնել
              </button>
              <button
                  v-else
                  class="px-3 py-1 text-xs bg-rose-600 text-white rounded-md hover:bg-rose-700"
                  @click="onHold(p)"
              >
                Կանգնեցնել
              </button>

              <!-- NEW: write-off from recycling when available > 0 -->
              <button
                  v-if="availableFor(p) > 0"
                  class="px-3 py-1 text-xs font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700"
                  @click="openAddModal(p)"
              >
                {{ $t('writeoff_from_recycle','Դուրս գրել վերամշակումից') }}
              </button>

              <router-link
                  class="px-3 py-1 text-xs bg-sky-600 text-white rounded-md hover:bg-sky-700"
                  :to="`/storages/${storageId}/manufacturing/produce/${p.id}/history`"
              >
                Մանրամասներ
              </router-link>
            </div>
          </td>
        </tr>
        <tr v-if="!state.loading && state.rows.length===0">
          <td colspan="4" class="px-6 py-8 text-center text-gray-500">{{ $t('no_data') }}</td>
        </tr>
        </tbody>
      </table>
      <div class="p-3 text-center" v-if="state.loading">{{ $t('loading') }}</div>
      <div ref="sentinel" class="h-10"></div>
    </div>

    <!-- NEW PRODUCE MODAL (unchanged UI) -->
    <div v-if="newModal.open" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/40" @click="closeNewProduce"></div>
      <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-white rounded-2xl shadow">
        <div class="flex items-center justify-between px-5 py-4 border-b">
          <div class="font-semibold">New produce</div>
          <button class="p-2 hover:bg-gray-100 rounded-lg" @click="closeNewProduce">✕</button>
        </div>

        <div class="p-5 space-y-4">
          <!-- Name -->
          <div class="flex flex-col gap-y-2">
            <label>Անուն</label>
            <input
                v-model="productForm.name"
                :class="inputClass(errors.name)"
                type="text"
                placeholder="Օր. Պլաստիկ պելետ"
            />
            <p v-if="errors.name" class="text-xs text-rose-600 mt-1">Անվանումը պարտադիր է</p>
          </div>

          <!-- Measure -->
          <div class="flex flex-col gap-y-2">
            <label class="block font-medium text-gray-900">Չափման տեսակ</label>
            <select v-model="productForm.measure_type" :class="selectClass(errors.measure_type)">
              <option value="">{{ $t('select','Ընտրել') }}</option>
              <option v-for="m in measureUnits" :key="m.key" :value="m.key">{{ m.name }}</option>
            </select>
            <p v-if="errors.measure_type" class="text-xs text-rose-600 mt-1">Չափման տեսակը պարտադիր է</p>
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
        </div>

        <div class="px-5 py-4 border-t flex justify-end gap-2">
          <button class="px-4 py-2 rounded-xl border" @click="closeNewProduce">{{ $t('cancel','Փակել') }}</button>
          <button
              class="px-4 py-2 rounded-xl bg-emerald-600 text-white disabled:opacity-60"
              :disabled="saving"
              @click="saveNewProduce"
          >
            {{ saving ? $t('processing','Կատարվում է…') : $t('save','Պահպանել') }}
          </button>
        </div>
      </div>
    </div>

    <!-- EXISTING PRODUCES PICKER MODAL (unchanged except save handler) -->
    <div v-if="existModal.open" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/40" @click="closeExistModal"></div>
      <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-white rounded-2xl shadow">
        <div class="flex items-center justify-between px-5 py-4 border-b">
          <div class="font-semibold">Ընտրել առկա արտադրանքներից</div>
          <button class="p-2 hover:bg-gray-100 rounded-lg" @click="closeExistModal">✕</button>
        </div>
        <div class="p-5 space-y-4">
          <div>
            <label class="text-xs text-gray-500 block mb-1">{{ $t('search','Փնտրել') }}</label>
            <VueSelect
                v-model="existModal.selectedId"
                @search="searchExist"
                @update:modelValue="onPickExistId"
                :filterable="false"
                :loading="existModal.loading"
                :is-searchable="true"
                :get-option-label="o => o.name"
                :get-option-value="o => o.id"
                :is-multi="false"
                :options="existModal.options"
                :placeholder="$t('select_product','Ընտրեք արտադրանք')"
                :noResults="$t('no_results','Արդյունք չի գտնվել')"
            >
              <template #no-options>{{ $t('no_results','Արդյունք չի գտնվել') }}</template>
              <template #option="{ option }">
                <div class="flex flex-col gap-2">
                  <span class="font-medium">{{ option.name }}</span>
                  <span class="text-xs text-gray-500" v-if="(option.characteristics||[]).length">
                    • {{ option.characteristics.map((x:any)=>`${x.name}`).join(', ') }}
                  </span>
                </div>
              </template>
            </VueSelect>
          </div>

          <!-- Selected list (prepended) -->
          <div class="rounded-xl border border-gray-200 overflow-hidden">
            <table class="min-w-full text-sm">
              <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left">Արտադրանք</th>
                <th class="px-4 py-3 text-right"></th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="it in existModal.picked" :key="it.id" class="border-t">
                <td class="px-4 py-2">
                  <div class="font-medium">{{ it.name }}</div>
                  <div class="text-xs text-gray-500" v-if="(it.characteristics||[]).length">
                    <span v-for="(c,i) in it.characteristics" :key="i" class="mr-1">{{ c.name }}</span>
                  </div>
                </td>
                <td class="px-4 py-2 text-right">
                  <button class="px-3 py-2 rounded-lg text-white bg-rose-600 hover:bg-rose-700" @click="unpickExist(it.id)">
                    {{ $t('remove','Հեռացնել') }}
                  </button>
                </td>
              </tr>
              <tr v-if="!existModal.picked.length">
                <td colspan="3" class="px-4 py-6 text-center text-gray-500">{{ $t('empty','Դատարկ') }}</td>
              </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="px-5 py-4 border-t flex justify-end gap-2">
          <button class="px-4 py-2 rounded-xl border" @click="closeExistModal">{{ $t('close','Փակել') }}</button>
          <button
              class="px-4 py-2 rounded-xl bg-indigo-600 text-white disabled:opacity-60"
              :disabled="existModal.saving || !existModal.picked.length"
              @click="submitExistPicked"
          >
            {{ existModal.saving ? $t('processing','Կատարվում է…') : $t('save','Պահել') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Add qty modal (outputs) -->
    <div v-if="addModal.open" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/40" @click="closeAddModal"></div>
      <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow">
        <div class="flex items-center justify-between px-5 py-4 border-b">
          <div class="font-semibold">Դուրս գրել վերամշակումից</div>
          <button class="p-2 hover:bg-gray-100 rounded-lg" @click="closeAddModal">✕</button>
        </div>
        <div class="p-5 space-y-3 text-sm">
          <div class="font-medium">{{ addModal.row?.product?.name }}</div>
          <div class="text-xs text-gray-500">
            {{ $t('available','Մատչելի') }}: {{ fmt(currentAvailable) }} {{ $t(addModal.row?.measure || 'piece') }}
          </div>
          <div>
            <label class="text-xs text-gray-500">{{ $t('qty','Քանակ') }}</label>
            <input
                v-model.number="addModal.qty"
                type="number"
                min="0"
                step="0.001"
                class="border rounded-xl px-3 py-2 w-full"
            />
            <p class="text-xs text-gray-400 mt-1">
              {{ $t('max','Առավելագույն') }}: {{ fmt(currentAvailable) }}
            </p>
          </div>
        </div>
        <div class="px-5 py-4 border-t flex justify-end gap-2">
          <button class="px-4 py-2 rounded-xl border" @click="closeAddModal">{{ $t('cancel','Փակել') }}</button>
          <button
              class="px-4 py-2 rounded-xl text-white disabled:opacity-60 bg-amber-600 hover:bg-amber-700"
              :disabled="!canAdd"
              @click="confirmAdd"
          >
            {{ $t('add_to_basket','Ավելացնել զամբյուղ') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Outputs confirm (direction + list) -->
    <div v-if="outputsConfirm.open" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/40" @click="closeOutputsConfirm"></div>
      <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-2xl shadow">
        <div class="flex items-center justify-between px-5 py-4 border-b">
          <div class="font-semibold">{{ $t('outputs','Ելքեր') }} — {{ $t('confirm','Հաստատում') }}</div>
          <button class="p-2 hover:bg-gray-100 rounded-lg" @click="closeOutputsConfirm">✕</button>
        </div>
        <div class="p-5 space-y-4">
          <div class="grid md:grid-cols-3 gap-3">
            <div class="flex flex-col gap-y-2">
              <label class="text-xs text-gray-500">{{ $t('direction','Ուղղություն') }}</label>
              <select v-model="outputsConfirm.direction" class="border border-gray-300 rounded-xl px-3 py-2 w-full">
                <option value="to_production">Դեպի արտադրամաս</option>
                <option value="output">Ելք</option>
                <option value="as_waste">Աղբ</option>
              </select>
            </div>
          </div>

          <div class="rounded-xl border border-gray-200 overflow-hidden">
            <table class="min-w-full text-sm">
              <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left">{{ $t('product') }}</th>
                <th class="px-4 py-3 text-left">{{ $t('qty') }}</th>
                <th class="px-4 py-3 text-right"></th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="it in baskets.outputs.items" :key="it.key" class="border-t">
                <td class="px-4 py-2">{{ it.product_name || ('#'+it.product_id) }}</td>
                <td class="px-4 py-2">{{ fmt(it.qty) }} {{ $t(it.measure||'piece') }}</td>
                <td class="px-4 py-2 text-right">
                  <button class="px-2 py-1 text-xs border rounded-lg" @click="removeFromBasket(it.key)">
                    {{ $t('remove','Հեռացնել') }}
                  </button>
                </td>
              </tr>
              <tr v-if="!baskets.outputs.items.length">
                <td colspan="3" class="px-4 py-6 text-center text-gray-500">{{ $t('empty','Դատարկ') }}</td>
              </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="px-5 py-4 border-t flex justify-end gap-2">
          <button class="px-4 py-2 rounded-xl border" @click="closeOutputsConfirm">{{ $t('close','Փակել') }}</button>
          <button
              class="px-4 py-2 rounded-xl bg-amber-600 text-white disabled:opacity-60"
              :disabled="baskets.outputs.sending || !baskets.outputs.items.length"
              @click="submitOutputs"
          >
            {{ baskets.outputs.sending ? $t('processing','Կատարվում է…') : $t('send','Ուղարկել') }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, onBeforeUnmount, computed } from 'vue'
import VueSelect from 'vue3-select-component'
import { recyclingProduceApi } from '@/api.js'

type ID = number
const props = defineProps<{ storageId: ID }>()
const emit = defineEmits<{ (e:'updated'): void }>()
const fmt = (n:any) => Number(n||0).toLocaleString(undefined,{ maximumFractionDigits: 3 })

/* list + filters + infinite scroll */
const state = reactive({ rows:[] as any[], loading:false, end:false, limit:30, offset:0 })
const filters = reactive({ search:'', status:'' })
const sentinel = ref<HTMLElement|null>(null)
let io:IntersectionObserver|null = null
let timer:any=null
function debounceReload(){ clearTimeout(timer); timer=setTimeout(reload, 300) }

async function fetchPage(){
  if (state.loading || state.end) return
  state.loading = true
  try{
    const res = await recyclingProduceApi.list(props.storageId, {
      limit: state.limit, offset: state.offset,
      search: filters.search || undefined,
      status: filters.status || undefined,
    })
    const list = Array.isArray(res) ? res : (res?.data ?? [])
    state.rows.push(...list)
    state.offset += list.length
    if (list.length < state.limit) state.end = true
  } finally { state.loading=false }
}
function reload(){ state.rows=[]; state.end=false; state.offset=0; fetchPage() }
function startObserver(){
  if (!sentinel.value) return
  io = new IntersectionObserver(ents=>{ if (ents[0].isIntersecting) fetchPage() })
  io.observe(sentinel.value)
}
onBeforeUnmount(()=>{ if (io && sentinel.value) io.unobserve(sentinel.value) })

/* availability helpers */
function inBasketQty(id:number){
  return baskets.outputs.items.filter(i=>i.id===id).reduce((s,i)=> s + Number(i.qty||0), 0)
}
function availableFor(row:any){
  const total = Number(row.qty||0)
  const reserved = Number(row.reserved_qty||0)
  const used = inBasketQty(Number(row.id))
  return Math.max(0, total - reserved - used)
}

/* actions */
function openNewProduce(){
  newModal.open = true
  productForm.name = ''
  productForm.measure_type = ''
  productForm.characteristics = []
  errors.name = false
  errors.measure_type = false
}
async function activate(row:any){
  await recyclingProduceApi.activate(props.storageId, row.id)
  row.status = 'active'
  emit('updated')
}
async function onHold(row:any){
  await recyclingProduceApi.onHold(props.storageId, row.id)
  row.status = 'on_hold'
  emit('updated')
}

/* New Produce modal state */
const newModal = reactive({ open:false })
const saving = ref(false)
const productForm = reactive<{name:string; measure_type:string; characteristics: Array<{type:string; value:string}>}>({
  name: '',
  measure_type: '',
  characteristics: [],
})
const errors = reactive<{name:boolean; measure_type:boolean}>({ name:false, measure_type:false })
const measureUnits = [
  { key: 'piece',   name: 'հատ' },
  { key: 'weight',  name: 'քաշ (կգ/տ/գ)' },
  { key: 'length',  name: 'երկարություն (մ/սմ/մմ)' },
  { key: 'capacity',name: 'ծավալ (լ/մլ)' },
]
function inputClass(err:boolean){
  return `w-full bg-white px-3 py-2 border rounded-lg ${err?'border-rose-500 focus:outline-rose-500':'border-gray-300 focus:outline-indigo-500'}`
}
function selectClass(err:boolean){
  return `w-full bg-white px-3 py-2 border rounded-lg ${err?'border-rose-500 focus:outline-rose-500':'border-gray-300 focus:outline-indigo-500'}`
}
function newCharacteristic(){ productForm.characteristics.push({ type:'', value:'' }) }
function removeCharacteristic(i:number){ productForm.characteristics.splice(i,1) }
function closeNewProduce(){ newModal.open = false }
async function saveNewProduce(){
  errors.name = !productForm.name?.trim()
  errors.measure_type = !productForm.measure_type
  if (errors.name || errors.measure_type) return
  saving.value = true
  try{
    const payload = {
      name: productForm.name.trim(),
      measure_type: productForm.measure_type,
      characteristics: productForm.characteristics
          .filter(c => (c.type||'').trim() || (c.value||'').trim())
          .map(c => ({ type: (c.type||'').trim(), value: (c.value||'').trim() })),
    }
    await recyclingProduceApi.create(props.storageId, payload)
    closeNewProduce()
    reload()
    emit('updated')
  } finally { saving.value = false }
}

/* existing produces picker */
const existModal = reactive({
  open: false,
  loading: false,
  saving: false,
  options: [] as any[],
  selectedId: null as number | null,
  picked: [] as any[],
})

async function submitExistPicked(){
  if (!existModal.picked.length) return
  existModal.saving = true
  try {
    const product_ids = existModal.picked.map((p:any) => p.id)
    await recyclingProduceApi.addExisting(props.storageId, { product_ids })
    await reload()
    closeExistModal()
  } finally { existModal.saving = false }
}
function openExistModal(){
  existModal.open = true
  existModal.picked = []
  existModal.options = []
  existModal.selectedId = null
  searchExist('')
}
function closeExistModal(){
  existModal.open = false
  existModal.loading = false
  existModal.selectedId = null
}
async function searchExist(search: string){
  existModal.loading = true
  try{
    const res = await recyclingProduceApi.getProducts({ search, limit: 50, industrial: 1 })
    const list = Array.isArray(res) ? res : (res?.data ?? [])
    const pickedIds = new Set(existModal.picked.map((p:any)=> p.id))
    existModal.options = list.filter((o:any)=> !pickedIds.has(o.id))
  } finally { existModal.loading = false }
}
function onPickExistId(id: number | null){
  if (!id) return
  if (existModal.picked.some((p:any)=> p.id === id)) { existModal.selectedId = null; return }
  const obj = existModal.options.find((o:any)=> o.id === id)
  if (!obj) { existModal.selectedId = null; return }
  existModal.picked.unshift(obj)
  existModal.options = existModal.options.filter((o:any)=> o.id !== id)
  existModal.selectedId = null
}
function unpickExist(id: number){
  const idx = existModal.picked.findIndex((x:any)=> x.id === id)
  if (idx >= 0){
    const [it] = existModal.picked.splice(idx, 1)
    if (!existModal.options.some((o:any)=> o.id === id)) existModal.options.unshift(it)
  }
}

/* OUTPUTS basket (write-off) */
type BasketItem = { key:string; id:number; product_id:number; product_name?:string; measure?:string; qty:number }
const baskets = reactive({ outputs: { items: [] as BasketItem[], sending:false } })
const hasAnyBasket = computed(()=> baskets.outputs.items.length>0)

const addModal = reactive<{open:boolean; row:any|null; qty:number}>({ open:false, row:null, qty:0 })
function openAddModal(row:any){ addModal.open = true; addModal.row=row; addModal.qty=0 }
function closeAddModal(){ addModal.open=false; addModal.row=null; addModal.qty=0 }
const currentAvailable = computed(()=> addModal.row ? availableFor(addModal.row) : 0)
const canAdd = computed(()=> Number(addModal.qty||0)>0 && Number(addModal.qty||0)<=currentAvailable.value)
function confirmAdd(){
  if (!canAdd.value || !addModal.row) return
  const r:any = addModal.row
  const qty = Number(addModal.qty||0)
  const list = baskets.outputs.items
  const exist = list.find(i=> i.id===Number(r.id))
  if (exist) exist.qty = Number(exist.qty||0) + qty
  else list.unshift({
    key:`outputs-${r.id}-${Date.now()}`,
    id:Number(r.id),
    product_id:Number(r.product_id || r.product?.id || r.id),
    product_name:r.product?.name,
    measure:r.measure,
    qty
  })
  closeAddModal()
}
function removeFromBasket(key:string){
  baskets.outputs.items = baskets.outputs.items.filter(x=> x.key!==key)
}

/* outputs confirm + submit */
const outputsConfirm = reactive<{open:boolean; direction:'to_storage'|'output'|'as_waste'}>({
  open:false, direction:'to_storage'
})
function openOutputsConfirm(){ outputsConfirm.open=true; outputsConfirm.direction='to_storage' }
function closeOutputsConfirm(){ outputsConfirm.open=false }

async function submitOutputs(){
  const bag = baskets.outputs
  if (!bag.items.length) return
  bag.sending = true
  try{
    const payload = {
      direction: outputsConfirm.direction,
      items: bag.items.map(it => ({
        manufacturing_produce_id: it.id, // adjust to your backend name if differs
        qty: Number(it.qty||0)
      }))
    }
    // If you use a different endpoint, swap this call:
    await recyclingProduceApi.output(props.storageId, payload)
    bag.items = []
    closeOutputsConfirm()
    await reload()
    emit('updated')
  } finally { bag.sending = false }
}

onMounted(()=>{ reload(); startObserver() })
</script>
