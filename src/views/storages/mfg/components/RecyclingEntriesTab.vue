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
        <select
            v-model="filters.status"
            class="border border-gray-300 rounded-xl px-3 py-2"
            @change="reload"
        >
          <option :value="''">{{ $t('all','Բոլորը') }}</option>
          <option value="pending">{{ $t('pending','Սպասման') }}</option>
          <option value="approved">{{ $t('approved','Հաստատված') }}</option>
          <option value="cancelled">{{ $t('cancelled','Չեղարկված') }}</option>
        </select>

        <span v-if="state.loading && rows.length===0" class="text-sm text-gray-500">{{ $t('loading','Բեռնվում է…') }}</span>
      </div>
    </div>

    <!-- List -->
    <div class="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <table class="min-w-full text-sm">
        <thead class="bg-gray-50">
        <tr>
          <th class="px-4 py-3 text-left">{{ $t('identification_number','Մուտք №') }}</th>
          <th class="px-4 py-3 text-left">{{ $t('status','Կարգավիճակ') }}</th>
          <th class="px-4 py-3 text-left">{{ $t('updated_at','Թարմացվել է') }}</th>
          <th class="px-4 py-3 text-right"></th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="row in rows" :key="row.id" class="border-t">
          <td class="px-4 py-3 font-medium">{{ row.identification_number }}</td>
          <td class="px-4 py-3">
            <span class="px-2 py-0.5 rounded text-xs" :class="badgeClass(row.status)">{{ $t(row.status) }}</span>
          </td>
          <td class="px-4 py-3">
            <span :title="row.updated_at">{{ formatDateTime(row.updated_at) }}</span>
            <span class="text-xs text-gray-400 ml-2">({{ fromNow(row.updated_at) }})</span>
          </td>
          <td class="px-4 py-3">
            <div class="flex gap-2 justify-end">
              <button class="px-3 py-1 text-xs bg-sky-600 text-white rounded-md hover:bg-sky-700"
                      @click="openShow(row)">
                {{ $t('details','Մանրամասն') }}
              </button>

              <template v-if="row.status==='pending'">
                <button class="px-3 py-1 text-xs bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                        :disabled="savingId===row.id"
                        @click="approve(row)">
                  {{ savingId===row.id ? $t('processing','Կատարվում է…') : $t('approve','Հաստատել') }}
                </button>
                <button class="px-3 py-1 text-xs bg-rose-600 text-white rounded-md hover:bg-rose-700"
                        :disabled="savingId===row.id"
                        @click="cancel(row)">
                  {{ $t('cancel','Չեղարկել') }}
                </button>
              </template>
            </div>
          </td>
        </tr>

        <tr v-if="!state.loading && rows.length===0">
          <td colspan="4" class="px-4 py-8 text-center text-gray-500">{{ $t('no_data','Տվյալներ չկան') }}</td>
        </tr>
        </tbody>
      </table>

      <div class="p-3 text-center" v-if="state.loading">{{ $t('loading','Լցվում է…') }}</div>
      <div ref="sentinel" class="h-10"></div>
    </div>

    <!-- DETAILS MODAL -->
    <div v-if="showModal.open" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/40" @click="closeShow"></div>
      <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl bg-white rounded-2xl shadow">
        <div class="flex items-center justify-between px-5 py-4 border-b">
          <div class="font-semibold">
            {{ $t('entry') }} — #{{ showModal.entry?.identification_number }}
            <span class="ml-2 text-xs px-2 py-0.5 rounded" :class="badgeClass(showModal.entry?.status)">
              {{ $t(showModal.entry?.status||'') }}
            </span>
          </div>
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
              <tr v-for="it in filteredItems" :key="it.id" class="border-t">
                <td class="px-4 py-3">
                  <div class="font-medium">{{ it.manufacturing_product?.product?.name || ('#'+it.manufacturing_product_id) }}</div>
                </td>
                <td class="px-4 py-3">{{ fmt(it.qty) }} {{ $t(it.measure||'kg') }}</td>
                <td class="px-4 py-3">
                  <span class="px-2 py-0.5 rounded text-xs" :class="badgeClass(it.status)">{{ $t(it.status) }}</span>
                </td>
                <td class="px-4 py-3">
                  <div class="flex justify-end">
                    <button
                        v-if="showModal.entry?.status==='pending' && it.status!=='cancelled'"
                        class="px-3 py-1 text-xs bg-rose-600 text-white rounded-md hover:bg-rose-700"
                        :disabled="itemSavingId===it.id"
                        @click="cancelItem(showModal.entry, it)"
                    >
                      {{ itemSavingId===it.id ? $t('processing','Կատարվում է…') : $t('cancel','Չեղարկել') }}
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="(showModal.entry?.items||[]).length===0">
                <td colspan="4" class="px-4 py-6 text-center text-gray-500">{{ $t('no_data') }}</td>
              </tr>
              </tbody>
            </table>
          </div>

          <div class="flex justify-end gap-2">
            <template v-if="showModal.entry?.status==='pending'">
              <button class="px-3 py-2 rounded-xl bg-emerald-600 text-white" :disabled="savingId===showModal.entry?.id" @click="approve(showModal.entry)">
                {{ savingId===showModal.entry?.id ? $t('processing','Կատարվում է…') : $t('approve','Հաստատել') }}
              </button>
              <button class="px-3 py-2 rounded-xl bg-rose-600 text-white" :disabled="savingId===showModal.entry?.id" @click="cancel(showModal.entry)">
                Չեղարկել
              </button>
            </template>
            <button class="px-3 py-2 rounded-xl border" @click="closeShow">{{ $t('close','Փակել') }}</button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { recycleEntriesApi } from '@/api.js'
type ID = number
import { formatDateTime, fromNow } from '@/utils/dateFormat'

const props = defineProps<{ storageId: ID }>()
const emit = defineEmits<{ (e:'updated'): void }>()

/* state */
const LIMIT = 30
const state = reactive({ loading:false, end:false, offset:0 })
const filters = reactive<{ search:string; status:string|'' }>({ search:'', status:'' })
const rows = ref<any[]>([])
const sentinel = ref<HTMLElement|null>(null)
let io:IntersectionObserver|null = null
let t:any = null

const fmt = (n:any) => Number(n||0).toLocaleString(undefined,{ maximumFractionDigits: 3 })
const formatDateTime = (v:any) => { try{ return new Date(v).toLocaleString() }catch{ return String(v||'') } }
function badgeClass(s?:string){
  switch ((s||'').toLowerCase()){
    case 'pending': return 'bg-amber-100 text-amber-700'
    case 'approved': return 'bg-indigo-100 text-indigo-700'
    case 'cancelled': return 'bg-rose-100 text-rose-700'
    default: return 'bg-slate-100 text-slate-700'
  }
}

/* fetch list */
async function fetchPage(){
  if (state.loading || state.end) return
  state.loading = true
  try{
    const list = await recycleEntriesApi.list(props.storageId, {
      limit: LIMIT,
      offset: state.offset,
      search: filters.search || undefined,
      status: filters.status || undefined,
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
function debounceReload(){ clearTimeout(t); t=setTimeout(reload, 300) }

/* observer */
function startObserver(){
  if (!sentinel.value) return
  io = new IntersectionObserver(ents => { if (ents[0].isIntersecting) fetchPage() })
  io.observe(sentinel.value)
}
onBeforeUnmount(()=>{ if (io && sentinel.value) io.unobserve(sentinel.value) })

/* details modal */
const showModal = reactive({ open:false, entry:null as any, q:'' })
const filteredItems = computed(()=>{
  const q = (showModal.q||'').toLowerCase().trim()
  const list = showModal.entry?.items || []
  if (!q) return list
  return list.filter((it:any)=>{
    const name = (it.manufacturing_product?.product?.name||'').toLowerCase()
    return name.includes(q) || String(it.manufacturing_product_id).includes(q)
  })
})
async function openShow(row:any){
  const full = await recycleEntriesApi.getById(props.storageId, row.id)
  showModal.entry = full
  showModal.q = ''
  showModal.open = true
}
function closeShow(){ showModal.open=false; showModal.entry=null; showModal.q='' }

/* actions */
const savingId = ref<number|null>(null)
const itemSavingId = ref<number|null>(null)

async function approve(entry: any) {
  try {
    savingId.value = entry.id
    await recycleEntriesApi.approve(props.storageId, entry.id)

    // reflect changes in the table row
    const i = rows.value.findIndex((r:any) => r.id === entry.id)
    if (i > -1) rows.value[i].status = 'approved'
    if (showModal.entry) showModal.entry.status = 'approved'

    // if current filter hides this status, remove it from the list
    if (filters.status && filters.status !== 'approved') {
      rows.value = rows.value.filter((r:any) => r.id !== entry.id)
    }
  } finally {
    savingId.value = null
  }
}

async function cancel(entry: any) {
  try {
    savingId.value = entry.id
    await recycleEntriesApi.cancel(props.storageId, entry.id)

    // reflect changes in the table row
    const i = rows.value.findIndex((r:any) => r.id === entry.id)
    if (i > -1) rows.value[i].status = 'cancelled'
    if (showModal.entry) showModal.entry.status = 'cancelled'

    // if current filter hides this status, remove it from the list
    if (filters.status && filters.status !== 'cancelled') {
      rows.value = rows.value.filter((r:any) => r.id !== entry.id)
    }
  } finally {
    savingId.value = null
  }
}
async function cancelItem(entry:any, item:any){
  try{
    itemSavingId.value = item.id
    await recycleEntriesApi.cancelItem(props.storageId, entry.id, item.id)
    item.status = 'cancelled'
  } finally { itemSavingId.value = null }
}

/* mount */
onMounted(async () => {
  await reload()
  startObserver()
})
</script>
