<template>
  <section class="space-y-3">
    <!-- Filters -->
    <div class="bg-white p-4 rounded-2xl border border-gray-200">
      <div class="flex items-center gap-3 flex-wrap">
        <input
            v-model="filters.search"
            :placeholder="$t('search_by_number','Փնտրել մուտք № կամ ապրանք')"
            class="border border-gray-300 w-96 rounded-xl px-3 py-2"
            @input="debounceReload"
        />
        <!-- Status filter -->
        <select
            v-model="filters.status"
            class="border border-gray-300 rounded-xl px-3 py-2"
            @change="reload"
        >
          <option value="">{{ $t('all','Բոլորը') }}</option>
          <option value="pending">{{ $t('pending','Սպասում է') }}</option>
          <option value="approved">{{ $t('approved','Հաստատված') }}</option>
          <option value="cancelled">{{ $t('cancelled','Չեղարկված') }}</option>
        </select>

        <span v-if="state.loading && rows.length===0" class="text-sm text-gray-500">
          {{ $t('loading','Բեռնվում է…') }}
        </span>
      </div>
    </div>

    <!-- List -->
    <div class="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <table class="min-w-full text-sm">
        <thead class="bg-gray-50">
        <tr>
          <th class="px-4 py-3 text-left">{{ $t('identification_number','Մուտք №') }}</th>
          <th class="px-4 py-3 text-left">{{ $t('status','Կարգավիճակ') }}</th>
          <th class="px-4 py-3 text-left">Թարմացվել է</th>
          <th class="px-4 py-3 text-right">{{ $t('actions','Գործողություններ') }}</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="row in rows" :key="row.id" class="border-t">
          <td class="px-4 py-3 font-medium">{{ row.identification_number }}</td>
          <td class="px-4 py-3">
            <span class="px-2 py-0.5 rounded text-xs" :class="badgeClass(row.status)">{{ $t(row.status) }}</span>
          </td>
          <td class="px-4 py-3">
              <span :title="row.updated_at">
                {{ formatDateTime(row.updated_at) }}
              </span>
            <span class="text-xs text-gray-400 ml-2">({{ fromNow(row.updated_at) }})</span>
          </td>
          <td class="px-4 py-3">
            <div class="flex gap-2 justify-end">
              <button
                  class="px-3 py-1 text-xs bg-sky-600 text-white rounded-md hover:bg-sky-700"
                  @click="openShow(row)"
              >
                {{ $t('show','Դիտել') }}
              </button>
              <template v-if="row.status==='pending'">
                <button
                    class="px-3 py-1 text-xs bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                    @click="openApprove(row)"
                >
                  {{ $t('approve','Հաստատել') }}
                </button>
                <button
                    class="px-3 py-1 text-xs bg-rose-600 text-white rounded-md hover:bg-rose-700"
                    @click="cancelEntry(row)"
                >
                  {{ $t('cancel','Չեղարկել') }}
                </button>
              </template>
            </div>
          </td>
        </tr>
        <tr v-if="!state.loading && rows.length===0">
          <td colspan="3" class="px-4 py-8 text-center text-gray-500">{{ $t('no_data','Տվյալներ չկան') }}</td>
        </tr>
        </tbody>
      </table>
      <div class="p-3 text-center" v-if="state.loading">{{ $t('loading','Լցվում է…') }}</div>
      <div ref="sentinel" class="h-10"></div>
    </div>

    <!-- SHOW MODAL (offline search) -->
    <div v-if="showModal.open" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/40" @click="closeShow"></div>
      <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl bg-white rounded-2xl shadow">
        <div class="flex items-center justify-between px-5 py-4 border-b">
          <div class="font-semibold">{{ $t('entry') }} — #{{ showModal.entry?.identification_number }}</div>
          <button class="p-2 hover:bg-gray-100 rounded-lg" @click="closeShow">✕</button>
        </div>
        <div class="p-5 space-y-3">
          <input v-model="showModal.q" :placeholder="$t('search','Փնտրել')" class="border border-gray-300 rounded-xl px-3 py-2 w-full" />
          <div class="rounded-xl border border-gray-200 overflow-hidden">
            <table class="min-w-full text-sm">
              <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left">{{ $t('product','Ապրանք') }}</th>
                <th class="px-4 py-3 text-left">{{ $t('qty','Քանակ') }}</th>
                <th class="px-4 py-3 text-left">{{ $t('status','Կարգավիճակ') }}</th>
                <th class="px-4 py-3 text-right">{{ $t('actions','Գործողություններ') }}</th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="p in filteredShowProducts" :key="p.id" class="border-t">
                <td class="px-4 py-3">
                  <div class="font-medium">{{ p.product?.name || ('#'+p.product_id) }}</div>
                  <div class="text-xs text-gray-500" v-if="(p.product?.characteristics||[]).length">
                    <span v-for="c in p.product.characteristics" :key="c.id||c.name" class="mr-1">{{ c.name }}</span>
                  </div>
                </td>
                <td class="px-4 py-3">{{ fmt(p.qty) }} {{ $t(p.measure||'kg') }}</td>
                <td class="px-4 py-3">
                  <span class="px-2 py-0.5 rounded text-xs" :class="badgeClass(p.status)">{{ $t(p.status) }}</span>
                </td>
                <td class="px-4 py-3">
                  <div class="flex justify-end">
                    <button
                        v-if="p.status!=='cancelled' && showModal.entry?.status==='pending'"
                        class="px-3 py-1 text-xs bg-rose-600 text-white rounded-md hover:bg-rose-700"
                        @click="cancelProduct(showModal.entry, p)"
                    >
                      {{ $t('cancel','Չեղարկել') }}
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="(showModal.entry?.products||[]).length===0">
                <td colspan="4" class="px-4 py-8 text-center text-gray-500">{{ $t('no_data') }}</td>
              </tr>
              </tbody>
            </table>
          </div>
          <div class="flex justify-end">
            <button class="px-3 py-2 rounded-xl border" @click="closeShow">{{ $t('close','Փակել') }}</button>
          </div>
        </div>
      </div>
    </div>

    <!-- APPROVE MODAL -->
    <div v-if="approveModal.open" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/40" @click="closeApprove"></div>
      <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl bg-white rounded-2xl shadow">
        <div class="flex items-center justify-between px-5 py-4 border-b">
          <div class="font-semibold">{{ $t('approve_entry','Հաստատել մուտքը') }} — #{{ approveModal.entry?.identification_number }}</div>
          <button class="p-2 hover:bg-gray-100 rounded-lg" @click="closeApprove">✕</button>
        </div>
        <div class="p-5 space-y-3">
          <input v-model="approveModal.q" :placeholder="$t('search','Փնտրել')" class="border rounded-xl px-3 py-2 w-full" />
          <div class="rounded-xl border border-gray-200 overflow-hidden">
            <table class="min-w-full text-sm">
              <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left">{{ $t('product') }}</th>
                <th class="px-4 py-3 text-left">{{ $t('qty','Ընդամենը') }}</th>
                <th class="px-4 py-3 text-left">{{ $t('qty_approved','Հաստ.') }}</th>
                <th class="px-4 py-3 text-left">{{ $t('qty_cancelled','Չեղ.') }}</th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="row in filteredApproveRows" :key="row.id" class="border-t">
                <td class="px-4 py-3">
                  <div class="font-medium">{{ row.product?.name || ('#'+row.product_id) }}</div>
                </td>
                <td class="px-4 py-3">{{ fmt(row._total) }} {{ $t(row.measure||'kg') }}</td>
                <td class="px-4 py-3">
                  <input
                      type="number" min="0" step="0.001"
                      class="border rounded-xl px-2 py-1 w-28"
                      v-model.number="row._approved"
                      @input="syncApproveCancel(row, 'approved')"
                  />
                </td>
                <td class="px-4 py-3">
                  <input
                      type="number" min="0" step="0.001"
                      class="border rounded-xl px-2 py-1 w-28"
                      v-model.number="row._cancelled"
                      @input="syncApproveCancel(row, 'cancelled')"
                  />
                </td>
              </tr>
              <tr v-if="approveModal.rows.length===0">
                <td colspan="4" class="px-4 py-6 text-center text-gray-500">{{ $t('no_data') }}</td>
              </tr>
              </tbody>
            </table>
          </div>
          <div class="flex justify-end gap-2">
            <button class="px-3 py-2 rounded-xl border" @click="closeApprove">{{ $t('cancel','Փակել') }}</button>
            <button
                class="px-3 py-2 rounded-xl bg-emerald-600 text-white disabled:opacity-60"
                :disabled="approveModal.saving"
                @click="submitApprove"
            >
              {{ approveModal.saving ? $t('processing','Կատարվում է…') : $t('approve','Հաստատել') }}
            </button>
          </div>
        </div>
      </div>
    </div>

  </section>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { mfgEntriesApi } from '@/api.js'
import { formatDateTime, fromNow } from '@/utils/dateFormat'

type ID = number
const props = defineProps<{ storageId: ID }>()
const emit = defineEmits<{ (e:'updated'): void }>()

/* state */
const LIMIT = 30
const state = reactive({ loading:false, end:false, offset:0 })
const filters = reactive<{ search: string; status: ''|'pending'|'approved'|'cancelled' }>({ search:'', status:'' })
const rows = ref<any[]>([])
const sentinel = ref<HTMLElement|null>(null)
let io:IntersectionObserver|null = null

/* list */
async function fetchPage(){
  if (state.loading || state.end) return
  state.loading = true
  try{
    const list = await mfgEntriesApi.list(props.storageId, {
      limit: LIMIT,
      offset: state.offset,
      search: filters.search || undefined,
      status: filters.status || undefined,  // ← pass enum filter
    })
    rows.value.push(...list)
    state.offset += list.length
    if (list.length < LIMIT) state.end = true
  } finally { state.loading = false }
}
async function reload(){
  rows.value = []; state.end=false; state.offset=0
  await fetchPage()
}
let t:any=null
function debounceReload(){ clearTimeout(t); t=setTimeout(reload, 300) }

/* observer */
function startObserver(){
  if (!sentinel.value) return
  io = new IntersectionObserver(ents => { if (ents[0].isIntersecting) fetchPage() })
  io.observe(sentinel.value)
}
onBeforeUnmount(()=>{ if(io && sentinel.value) io.unobserve(sentinel.value) })

/* chips */
function badgeClass(s?:string){
  switch ((s||'').toLowerCase()){
    case 'pending': return 'bg-amber-100 text-amber-700'
    case 'approved': return 'bg-indigo-100 text-indigo-700'
    case 'in_progress': return 'bg-blue-100 text-blue-700'
    case 'finished': return 'bg-emerald-100 text-emerald-700'
    case 'cancelled': return 'bg-rose-100 text-rose-700'
    default: return 'bg-slate-100 text-slate-700'
  }
}
const fmt = (n:any) => Number(n||0).toLocaleString(undefined,{ maximumFractionDigits: 3 })

/* SHOW modal (getById + offline search) */
const showModal = reactive({ open:false, entry:null as any, q:'' })
const filteredShowProducts = computed(()=>{
  const q = (showModal.q||'').toLowerCase().trim()
  const list = showModal.entry?.products || []
  if (!q) return list
  return list.filter((p:any)=>{
    const name = (p.product?.name||'').toLowerCase()
    return name.includes(q) || String(p.product_id).includes(q)
  })
})
async function openShow(row:any){
  const entry = await mfgEntriesApi.getById(props.storageId, row.id)
  showModal.entry = entry
  showModal.q = ''
  showModal.open = true
}
function closeShow(){ showModal.open=false; showModal.entry=null; showModal.q='' }

/* CANCEL product / entry */
async function cancelProduct(entry:any, product:any){
  await mfgEntriesApi.cancelProduct(props.storageId, entry.id, product.id)
  product.status = 'cancelled'
}
async function cancelEntry(row:any){
  await mfgEntriesApi.cancel(props.storageId, row.id)
  row.status = 'cancelled'
  emit('updated')
}

/* APPROVE modal */
const approveModal = reactive({
  open:false, entry:null as any, rows:[] as any[], q:'', saving:false
})
const filteredApproveRows = computed(()=>{
  const q = (approveModal.q||'').toLowerCase().trim()
  if (!q) return approveModal.rows
  return approveModal.rows.filter((r:any)=>{
    const name = (r.product?.name||'').toLowerCase()
    return name.includes(q) || String(r.product_id).includes(q)
  })
})
async function openApprove(row:any){
  const entry = await mfgEntriesApi.getById(props.storageId, row.id)
  const wr = (entry.products||[]).map((p:any)=>({
    id: p.id,
    product_id: p.product_id,
    product: p.product,
    measure: p.measure,
    _total: Number(p.qty || 0),
    _approved: Number(p.qty || 0),
    _cancelled: 0
  }))
  approveModal.entry = entry
  approveModal.rows = wr
  approveModal.q = ''
  approveModal.open = true
}

async function submitApprove(){
  if (!approveModal.entry) return
  approveModal.saving = true
  try{
    const payload = {
      products: approveModal.rows.map((r:any)=>({
        manufacturing_entry_product_id: r.id,
        qty_approved: Number(r._approved||0),
        qty_cancelled: Number(r._cancelled||0),
      }))
    }
    await mfgEntriesApi.approve(props.storageId, approveModal.entry.id, payload)
    const idx = rows.value.findIndex((x:any)=> x.id===approveModal.entry.id)
    if (idx>=0){
      const anyApproved = payload.products.some((p:any)=> p.qty_approved > 0)
      rows.value[idx].status = anyApproved ? 'approved' : 'cancelled'
    }
    closeApprove()
    emit('updated')
  } finally {
    approveModal.saving = false
  }
}
function closeApprove(){ approveModal.open=false; approveModal.entry=null; approveModal.rows=[]; approveModal.q='' }

/* keep approved + cancelled in sync so that approved + cancelled === total */
function syncApproveCancel(row:any, changed:'approved'|'cancelled'){
  const total = Number(row._total||0)
  let a = Number(row._approved||0)
  let c = Number(row._cancelled||0)
  if (changed==='approved'){
    if (a<0) a=0
    if (a>total) a=total
    row._approved = a
    row._cancelled = +(total - a).toFixed(6)
  } else {
    if (c<0) c=0
    if (c>total) c=total
    row._cancelled = c
    row._approved = +(total - c).toFixed(6)
  }
}

/* mount */
onMounted(async () => {
  await reload()
  startObserver()
})
</script>
