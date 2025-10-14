<template>
  <section class="space-y-3">
    <!-- Sticky baskets -->
    <div v-if="hasAnyBasket" class="sticky bottom-4 z-30 flex gap-4">
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

    <!-- List -->
    <div class="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <table class="min-w-full text-sm">
        <thead class="bg-gray-50">
        <tr>
          <th class="px-6 py-3 text-left">{{ $t('product','Ապրանք') }}</th>
          <th class="px-6 py-3 text-left">{{ $t('qty','Քանակ') }}</th>
          <th class="px-6 py-3 text-left">{{ $t('reserved','Ռեզերվ') }}</th>
          <th class="px-6 py-3 text-right">{{ $t('actions','Գործողություններ') }}</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="row in state.rows" :key="row.id" class="border-t">
          <td class="px-6 py-3">
            <div class="font-medium">{{ row.manufacturing_product.product?.name || ('#'+row.manufacturing_product.product_id) }}</div>
            <div v-if="(row.manufacturing_product.product?.characteristics||[]).length" class="mt-1 flex flex-wrap gap-1">
              <span v-for="c in row.manufacturing_product.product.characteristics" :key="c.id||c.name" class="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                {{ c.name }}
              </span>
            </div>
          </td>
          <td class="px-6 py-3">
            <span class="font-medium">{{ fmt(row.qty) }}</span> {{ $t(row.measure || 'kg') }}
            <div class="text-xs text-gray-500 mt-1">
              {{ $t('available','Մատչելի') }}: {{ fmt(availableFor(row)) }} {{ $t(row.measure || 'kg') }}
            </div>
          </td>
          <td class="px-6 py-3">
            {{ fmt(row.reserved_qty||0) }} {{ $t(row.measure || 'kg') }}
          </td>
          <td class="px-6 py-3">
            <div class="flex justify-end gap-2">
              <button
                  class="px-3 py-1 text-xs font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700"
                  @click="openAddModal(row)"
              >
                {{ $t('writeoff_from_recycle','Դուրս գրել վերամշակումից') }}
              </button>
            </div>
          </td>
        </tr>

        <tr v-if="!state.loading && state.rows.length===0">
          <td colspan="4" class="px-6 py-8 text-center text-gray-500">{{ $t('no_data','Տվյալներ չկան') }}</td>
        </tr>
        </tbody>
      </table>

      <div class="p-3 text-center" v-if="state.loading">{{ $t('loading','Լցվում է…') }}</div>
      <div ref="sentinel" class="h-10"></div>
    </div>

    <!-- Add qty modal -->
    <div v-if="addModal.open" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/40" @click="closeAddModal"></div>
      <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow">
        <div class="flex items-center justify-between px-5 py-4 border-b">
          <div class="font-semibold">Դուրս գրել վերամշակումից</div>
          <button class="p-2 hover:bg-gray-100 rounded-lg" @click="closeAddModal">✕</button>
        </div>
        <div class="p-5 space-y-3 text-sm">
          <div class="font-medium">{{ addModal.row?.manufacturing_product.product?.name }}</div>
          <div class="text-xs text-gray-500">
            {{ $t('available','Մատչելի') }}: {{ fmt(currentAvailable) }} {{ $t(addModal.row?.measure || 'kg') }}
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
                <td class="px-4 py-2">{{ fmt(it.qty) }} {{ $t(it.measure||'kg') }}</td>
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
import { reactive, ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { recyclingMaterialsApi } from '@/api.js'

type ID = number
const props = defineProps<{ storageId: ID }>()
const fmt = (n:any) => Number(n||0).toLocaleString(undefined,{ maximumFractionDigits: 3 })

/* List + infinite scroll */
const state = reactive({ rows:[] as any[], loading:false, end:false, limit:30, offset:0 })
const sentinel = ref<HTMLElement|null>(null)
let io:IntersectionObserver|null = null

async function fetchPage(){
  if (state.loading || state.end) return
  state.loading = true
  try{
    const res = await recyclingMaterialsApi.list(props.storageId, {
      limit: state.limit, offset: state.offset, include: 'product',
    })
    const list = Array.isArray(res) ? res : (res?.data ?? [])
    state.rows.push(...list)
    state.offset += list.length
    if (list.length < state.limit) state.end = true
  } finally { state.loading = false }
}
function reload(){ state.rows=[]; state.end=false; state.offset=0; fetchPage() }
function startObserver(){
  if (!sentinel.value) return
  io = new IntersectionObserver(ents=>{ if (ents[0].isIntersecting) fetchPage() })
  io.observe(sentinel.value)
}
onBeforeUnmount(()=>{ if(io && sentinel.value) io.unobserve(sentinel.value) })

/* availability + basket (outputs) */
type BasketItem = { key:string; id:number; product_id:number; product_name?:string; measure?:string; qty:number }
const baskets = reactive({ outputs: { items: [] as BasketItem[], sending:false } })
const hasAnyBasket = computed(()=> baskets.outputs.items.length>0)
function inBasketQty(id:number){ return baskets.outputs.items.filter(i=>i.id===id).reduce((s,i)=>s+Number(i.qty||0),0) }
function availableFor(row:any){
  const total = Number(row.qty||0)
  const reserved = Number(row.reserved_qty||0)
  const used = inBasketQty(Number(row.id))
  return Math.max(0, total - reserved - used)
}

/* add-to-basket modal */
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
    product_id:Number(r.product_id),
    product_name:r.manufacturing_product.product?.name,
    measure:r.measure,
    qty
  })
  closeAddModal()
}
function removeFromBasket(key:string){
  baskets.outputs.items = baskets.outputs.items.filter(x=> x.key!==key)
}

/* outputs confirm */
const outputsConfirm = reactive<{open:boolean; direction:'to_storage'|'output'|'as_waste'}>({ open:false, direction:'to_storage' })
function openOutputsConfirm(){ outputsConfirm.open=true; outputsConfirm.direction='to_storage' }
function closeOutputsConfirm(){ outputsConfirm.open=false }
async function submitOutputs(){
  const bag = baskets.outputs
  if (!bag.items.length) return
  bag.sending = true
  try{
    const payload = {
      direction: outputsConfirm.direction,
      items: bag.items.map(it=>({ manufacturing_recycle_product_id: it.id, qty:Number(it.qty||0) }))
    }
    await recyclingMaterialsApi.output(props.storageId, payload)
    bag.items = []
    closeOutputsConfirm()
    await reload()
  } finally { bag.sending = false }
}

onMounted(()=>{ reload(); startObserver() })
</script>
