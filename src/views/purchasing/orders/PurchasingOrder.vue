<template>
  <div class="flex flex-col">
    <div class="dark:border-gray-700 bg-white">
      <div class="flex gap-x-2 items-center p-4 border-b rounded-md border-gray-200 text-xl">
        <p>{{ $t('suppliers_orders') }}</p>
        <p class="text-sm">({{ $t('purchasing') }})</p>
      </div>
    </div>
    <nav class="flex bg-blue-50 py-2 items-center text-sm" aria-label="Breadcrumb">
      <ol class="inline-flex items-center">
        <li>
          <router-link :to="'/purchasing'"
                       class="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-slate-100">
            <span class="underline-offset-2 hover:underline">{{ $t('purchasing') }}</span>
          </router-link>
        </li>
        <li aria-hidden="true" class="px-1">
          <svg class="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
            <path
                d="M7.05 3.55a1 1 0 0 1 1.4 0l4.5 4.5a1 1 0 0 1 0 1.4l-4.5 4.5a1 1 0 0 1-1.4-1.4L10.79 10 7.05 6.26a1 1 0 0 1 0-1.41z"/>
          </svg>
        </li>
        <li>
          <p class="inline-flex items-center gap-1 rounded-md px-2 py-1">
            <span class="underline-offset-2 hover:underline">{{ $t('suppliers_orders') }}</span>
          </p>
        </li>
      </ol>
    </nav>
  </div>

  <div class="p-4 space-y-4">
    <div class="flex flex-col gap-y-2">
      <h1 class="text-xl font-semibold">Գնումների պատվերներ</h1>
      <div class="flex gap-2">
        <input v-model="q" @input="debouncedSearch" class="px-3 py-2 rounded-xl border border-gray-300 w-64" placeholder="Փնտրել (պայմանագիր/գործընկեր)…"/>
      </div>
    </div>

    <div class="bg-white border border-gray-300 overflow-hidden">
      <table class="min-w-full text-sm">
        <thead class="bg-gray-50">
        <tr class="text-left">
          <th class="px-4 py-3">#</th>
          <th class="px-4 py-3">Գործընկեր / Պայմանագիր</th>
          <th class="px-4 py-3">Կարգավիճակ</th>
          <th class="px-4 py-3">Թարմացվել է</th>
          <th class="px-4 py-3"></th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="row in rows" :key="row.id" class="border-t">
          <td class="px-4 py-3">{{ row.identification_number }}</td>
          <td class="px-4 py-3">
            <div class="flex flex-col" v-if="row.partner_contract">
              <span class="font-medium">{{ row.partner_contract?.partner?.name || '-' }}</span>
              <span class="text-xs text-gray-500">Պայմ. #{{ row.partner_contract?.identification_number ?? '—' }}</span>

              <div class="flex gap-2 mt-2">
                <button v-if="row.status==='announce_tender'"
                        class="px-3 py-1 text-xs text-white bg-red-600 rounded-md hover:bg-red-700"
                        @click="cancelContract(row)">
                  Արխիվացնել պայմանագիրը
                </button>

                <!-- NEW: open archived contracts list (if any) -->
                <button
                    v-if="(row.partner_contract_with_trashed || []).length > 0"
                    class="px-3 py-1 text-xs text-white bg-slate-600 rounded-md hover:bg-slate-700"
                    @click="openArchived(row)"
                >
                  Տեսնել պայմանագրերը
                </button>
              </div>
            </div>
            <div v-else>
              {{ $t('missing') }}
              <!-- NEW: but still can have archived contracts -->
              <div class="mt-2">
                <button
                    v-if="(row.partner_contract_with_trashed || []).length > 0"
                    class="px-3 py-1 text-xs text-white bg-slate-600 rounded-md hover:bg-slate-700"
                    @click="openArchived(row)"
                >
                  Տեսնել պայմանագրերը
                </button>
              </div>
            </div>
          </td>
          <td class="px-4 py-3">
            <span class="flex flex-col gap-y-2">
              <span class="px-2 py-0.5 rounded text-xs bg-gray-100">{{ $t(row.status) }}</span>
              <span class="flex flex-col gap-y-2">
                <span v-if="row.max_price_updated" class="ml-2 text-xs text-green-600">Հիմնական ինֆորմացիան լրացված է ✔</span>
                <span v-if="row.price_updated" class="ml-2 text-xs text-emerald-600">Գնման գները լրացված են ✔</span>
              </span>
            </span>
          </td>
          <td class="px-4 py-3">
            <span :title="row.updated_at">{{ formatDateTime(row.updated_at) }}</span>
            <span class="text-xs text-gray-400 ml-2">({{ fromNow(row.updated_at) }})</span>
          </td>
          <td class="px-4 py-3">
            <div class="flex flex-wrap gap-2">
              <!-- send_to_purchasing -->
              <button v-if="row.status==='send_to_purchasing'"
                      class="px-3 py-1 text-xs text-white bg-blue-600 rounded-md hover:bg-blue-700"
                      @click="openEditor(row.id)">
                Դիտել / Լրացնել
              </button>
              <button v-if="row.status==='send_to_purchasing'"
                      class="px-3 py-1 text-xs text-white bg-amber-600 rounded-md hover:bg-amber-700"
                      @click="onAnnounce(row)">
                Հայտարարել տենդեր
              </button>
              <button v-if="row.status==='send_to_purchasing'"
                      class="px-3 py-1 text-xs text-white bg-red-600 rounded-md hover:bg-red-700"
                      @click="onReject(row.id)">
                Չեղարկել
              </button>

              <div v-if="row.status === 'announce_tender'" class="flex flex-wrap gap-2">
                <button v-if="row.partner_contract_id"
                        class="px-3 py-1 text-xs text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                        @click="openEditor(row.id)">
                  Թարմացնել գնման գները
                </button>

                <button v-if="row.status==='announce_tender' && !row.partner_contract_id"
                        class="px-3 py-1 text-xs text-white bg-slate-700 rounded-md hover:bg-slate-800"
                        @click="openContract(row)">
                  Ստեղծել պայմանագիր
                </button>
                <button v-if="row.status==='announce_tender' && row.partner_contract_id"
                        class="px-3 py-1 text-xs text-white bg-slate-500 rounded-md hover:bg-slate-600"
                        @click="openContract(row)">
                  Դիտել / Փոփոխել պայմանագիրը
                </button>

                <button v-if="row.price_updated && row.partner_contract_id"
                        class="px-3 py-1 text-xs text-white bg-emerald-600 rounded-md hover:bg-emerald-700"
                        :disabled="!row.partner_contract_id || !row.price_updated"
                        @click="onActivate(row.id)">
                  Ակտիվացնել
                </button>
              </div>
            </div>
          </td>
        </tr>

        <tr v-if="!loading && rows.length===0">
          <td colspan="5" class="p-6 text-center text-gray-500">Դատարկ է</td>
        </tr>
        </tbody>
      </table>

      <div class="p-3 border-t text-center text-sm text-gray-500" v-if="loading">Բեռնվում է…</div>
      <div ref="sentinel" class="h-8"></div>
    </div>

    <!-- Contract modal (existing) -->
    <OrderContractModal
        v-if="contractModal.open"
        :open="contractModal.open"
        :order-id="contractModal.orderId"
        :contract="contractModal.contract"
        :with-trashed="contractModal.withTrashed"
        @close="contractModal.open=false"
        @saved="resetAndReload"
    />

    <!-- NEW: Archived contracts list modal -->
    <div v-if="archivedModal.open" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/40" @click="archivedModal.open=false"></div>
      <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-2xl shadow-xl">
        <div class="flex items-center justify-between px-5 py-4 border-b">
          <h3 class="text-lg font-semibold">Արխիվացված պայմանագրեր</h3>
          <button class="p-2 rounded-lg hover:bg-gray-100" @click="archivedModal.open=false" aria-label="Close">✕</button>
        </div>
        <div class="p-5">
          <table class="min-w-full text-sm border rounded-xl overflow-hidden">
            <thead class="bg-gray-50">
            <tr class="text-left">
              <th class="px-3 py-2">#</th>
              <th class="px-3 py-2">Կարգավիճակ</th>
              <th class="px-3 py-2">Ստեղծվել է</th>
              <th class="px-3 py-2 w-0"></th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="c in archivedModal.contracts" :key="c.id" class="border-t">
              <td class="px-3 py-2 font-medium">{{ c.identification_number }}</td>
              <td class="px-3 py-2">
                <span v-if="c.deleted_at" class="ml-2 text-xs text-rose-600">արխիվ</span>
                <span v-else class="px-2 py-0.5 rounded text-xs bg-gray-100">{{ $t(c.status) }}</span>
              </td>
              <td class="px-3 py-2">
                <span :title="c.created_at">{{ formatDateTime(c.created_at) }}</span>
              </td>
              <td class="px-3 py-2 text-right">
                <button
                    class="px-3 py-1 text-xs text-white bg-slate-600 rounded-md hover:bg-slate-700"
                    @click="viewArchived(c)"
                >
                  Դիտել
                </button>
              </td>
            </tr>
            <tr v-if="!archivedModal.contracts || archivedModal.contracts.length===0">
              <td colspan="4" class="px-3 py-6 text-center text-gray-500">Չկա արխիվացված պայմանագիր</td>
            </tr>
            </tbody>
          </table>
        </div>
        <div class="px-5 py-4 border-t text-right">
          <button class="px-3 py-2 rounded-xl border hover:bg-gray-50" @click="archivedModal.open=false">Փակել</button>
        </div>
      </div>
    </div>
  </div>
  <ActivateOrderModal
      v-if="activateModal.open"
      :open="activateModal.open"
      :order-id="activateModal.orderId"
      @close="activateModal.open=false"
      @saved="resetAndReload"
  />
</template>

<script setup lang="ts">
import {ref, onMounted, onBeforeUnmount} from 'vue'
import {useRouter} from 'vue-router'
import {purchasingOrdersApi} from '@/api.js'
import OrderContractModal from './modals/PurchasingOrderContractModal.vue'
import ActivateOrderModal from './modals/PurchasingActivateOrderModal.vue'
import { formatDateTime, fromNow } from '@/utils/dateFormat'
import {useToast} from "vue-toastification";
const toast = useToast();
const router = useRouter()

const q = ref('')
const rows = ref<any[]>([])
const loading = ref(false)
const eof = ref(false)
const LIMIT = 20
const offset = ref(0)
const sentinel = ref<HTMLElement | null>(null)
let t: any, io: IntersectionObserver | null

const contractModal = ref<{ open: boolean; orderId: number | null; contract: { id: number } | null }>({ open:false, orderId:null, contract:null })
const activateModal = ref<{open:boolean, orderId: number|null}>({ open:false, orderId: null })

// NEW: archived contracts list modal state
const archivedModal = ref<{ open: boolean; orderId: number | null; contracts: any[] }>({
  open: false,
  orderId: null,
  contracts: []
})

function openEditor(id: number){ router.push('/purchasing/orders/'+id) }

async function openContract(row: any){
  contractModal.value = { open:true, orderId: row.id, contract: row.partner_contract_id ? { id: row.partner_contract_id } : null }
}

// NEW: open modal listing archived contracts from row.partner_contract_with_trashed
function openArchived(row: any) {
  archivedModal.value.open = true
  archivedModal.value.orderId = Number(row.id)
  archivedModal.value.contracts = Array.isArray(row.partner_contract_with_trashed) ? row.partner_contract_with_trashed : []
}

// NEW: when user clicks "Դիտել" inside archived modal
function viewArchived(c: any) {
  if (!archivedModal.value.orderId || !c?.id) return
  // open the same modal as usual but with contract id from archived list
  contractModal.value = {
    open: true,
    orderId: archivedModal.value.orderId,
    contract: { id: Number(c.id) },
    withTrashed: 1
  }
  archivedModal.value.open = false
}

async function onAnnounce(row: any){
  if (!row.max_price_updated) {
    const ok = confirm('Ակտուալ գները դատարկ են, ցանկանում ե՞ք հայտարարել տենդեր')
    if (!ok) return
  }
  await purchasingOrdersApi.announceTender(row.id)
  resetAndReload()
}

async function onReject(id: number){
  if (!confirm('Չեղարկե՞լ պատվերը')) return
  await purchasingOrdersApi.reject(id)
  resetAndReload()
}

async function onActivate(rowOrId:any){
  // list template-ում կարող է գալ row կամ id -> normalize
  const id = typeof rowOrId === 'object' ? rowOrId?.id : rowOrId
  if (!id) return
  activateModal.value = { open: true, orderId: Number(id) }
}

// Existing cancel contract (archives active contract)
async function cancelContract(row: any) {
  const orderId = Number(row?.id)
  const contractId = Number(row?.partner_contract?.id)
  if (!orderId || !contractId) {
    toast.error('Պայմանագիրը չի գտնվել')
    return
  }
  if (!confirm('Արխիվացնել պայմանագիրը?')) return
  await purchasingOrdersApi.cancelOrderContract(orderId, contractId)
  resetAndReload()
}

async function fetchNext(){
  if (loading.value || eof.value) return
  loading.value = true
  try{
    const {data} = await purchasingOrdersApi.list({ limit: LIMIT, offset: offset.value, search: q.value || undefined })
    const batch = data?.data ?? data ?? []
    rows.value.push(...batch)
    if (batch.length < LIMIT) eof.value = true
    else offset.value += LIMIT
  } finally { loading.value = false }
}

async function resetAndReload(){
  rows.value = []; eof.value = false; offset.value = 0
  await fetchNext()
}

function debouncedSearch(){
  clearTimeout(t); t = setTimeout(resetAndReload, 300)
}

onMounted(()=>{
  io = new IntersectionObserver(e => { if (e.some(x=>x.isIntersecting)) fetchNext() }, {rootMargin:'0px 0px 200px'})
  if (sentinel.value) io.observe(sentinel.value)
  resetAndReload()
})
onBeforeUnmount(()=>{ if (io && sentinel.value) io.unobserve(sentinel.value) })
</script>
