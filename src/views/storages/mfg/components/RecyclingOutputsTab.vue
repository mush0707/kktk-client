<template>
  <section class="space-y-3">
    <!-- Filters -->
    <div class="bg-white p-4 rounded-2xl border border-gray-200">
      <div class="flex items-center gap-3 flex-wrap">
        <input
            v-model.trim="filters.search"
            :placeholder="$t('search_by_number','Փնտրել ելքի № կամ ապրանք')"
            class="border border-gray-300 rounded-xl px-3 py-2 w-64"
            @input="debouncedReload"
        />
        <select v-model="filters.status" class="border border-gray-300 rounded-xl px-3 py-2" @change="reload">
          <option value="">{{ $t('all','Բոլորը') }}</option>
          <option value="pending">{{ $t('pending','Սպասում է') }}</option>
          <option value="approved">{{ $t('approved','Հաստատված') }}</option>
          <option value="written_off">{{ $t('written_off','Դուրս գրված') }}</option>
          <option value="cancelled">{{ $t('cancelled','Չեղարկված') }}</option>
        </select>
        <input type="date" v-model="filters.start_date" class="border border-gray-300 rounded-xl px-3 py-2" @change="reload" />
        <input type="date" v-model="filters.end_date" class="border border-gray-300 rounded-xl px-3 py-2" @change="reload" />
        <span v-if="state.loading && rows.length===0" class="text-sm text-gray-500">{{ $t('loading','Բեռնվում է…') }}</span>
      </div>
    </div>

    <!-- List -->
    <div class="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <table class="min-w-full text-sm">
        <thead class="bg-gray-50">
        <tr>
          <th class="px-4 py-3 text-left">Ելք №</th>
          <th class="px-4 py-3 text-left">{{ $t('status','Կարգավիճակ') }}</th>
          <th class="px-4 py-3 text-left">Ուղղություն</th>
          <th class="px-4 py-3 text-left">{{ $t('date','Ամսաթիվ') }}</th>
          <th class="px-4 py-3 text-right">{{ $t('actions','Գործողություններ') }}</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="row in rows" :key="row.id" class="border-t">
          <td class="px-4 py-3 font-medium">{{ row.identification_number }}</td>
          <td class="px-4 py-3">
            <span class="px-2 py-0.5 rounded text-xs" :class="chip(row.status)">{{ $t(row.status) }}</span>
          </td>
          <td class="px-4 py-3 font-medium">{{ $t(row.direction) }}</td>
          <td class="px-4 py-3">
            <span :title="row.updated_at">{{ formatDateTime(row.updated_at) }}</span>
            <span class="text-xs text-gray-400 ml-2">({{ fromNow(row.updated_at) }})</span>
          </td>
          <td class="px-4 py-3">
            <div class="flex gap-2 justify-end">
              <button class="px-3 py-1 text-xs bg-sky-600 text-white rounded-md hover:bg-sky-700" @click="openDetails(row)">
                {{ $t('details','Մանրամասն') }}
              </button>

              <template v-if="row.status==='pending'">
                <button class="px-3 py-1 text-xs bg-emerald-600 text-white rounded-md hover:bg-emerald-700" @click="setStatus(row,'approved')">
                  {{ $t('approve','Հաստատել') }}
                </button>
                <button
                    class="px-3 py-1 text-xs bg-rose-600 text-white rounded-md hover:bg-rose-700"
                    @click="setStatus(row,'cancelled')">
                  {{ $t('cancel','Չեղարկել') }}
                </button>
              </template>

              <template v-else-if="row.status==='approved'">
                <button class="px-3 py-1 text-xs bg-emerald-600 text-white rounded-md hover:bg-emerald-700" @click="setStatus(row,'written_off')">
                  Դուրս գրել
                </button>
                <button class="px-3 py-1 text-xs bg-rose-600 text-white rounded-md hover:bg-rose-700" @click="setStatus(row,'cancelled')">
                  {{ $t('cancel','Չեղարկել') }}
                </button>
              </template>
              <!-- written_off / cancelled -> only Details -->
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
    <div v-if="details.open" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/40" @click="closeDetails"></div>
      <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl bg-white rounded-2xl shadow">
        <div class="flex items-center justify-between px-5 py-4 border-b">
          <div class="font-semibold">
            {{ $t('details') }} — #{{ details.entry?.identification_number }}
          </div>
          <button class="p-2 hover:bg-gray-100 rounded-lg" @click="closeDetails">✕</button>
        </div>
        <div class="p-5 space-y-3">
          <div class="rounded-xl border border-gray-200 overflow-hidden">
            <table class="min-w-full text-sm">
              <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left">{{ $t('product','Ապրանք') }}</th>
                <th class="px-4 py-3 text-left">{{ $t('qty','Քանակ') }}</th>
                <th class="px-4 py-3 text-left">{{ $t('status','Կարգավիճակ') }}</th>
                <th class="px-4 py-3 text-right"></th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="p in (details.entry?.products || [])" :key="p.id" class="border-t">
                <td class="px-4 py-2">
                  <div class="font-medium">{{ p.product?.name || ('#'+p.product_id) }}</div>
                </td>
                <td class="px-4 py-2">{{ fmt(p.qty) }} {{ $t(p.measure || 'kg') }}</td>
                <td class="px-4 py-2">
                  <span class="px-2 py-0.5 rounded text-xs" :class="chip(p.status)">{{ $t(p.status) }}</span>
                </td>
                <td class="px-4 py-2 text-right">
                  <button
                      v-if="p.status !== 'cancelled'"
                      class="px-3 py-1 text-xs bg-rose-600 text-white rounded-md hover:bg-rose-700"
                      @click="cancelProduct(details.entry, p)"
                  >
                    {{ $t('cancel','Չեղարկել') }}
                  </button>
                </td>
              </tr>
              <tr v-if="(details.entry?.products || []).length===0">
                <td colspan="4" class="px-4 py-6 text-center text-gray-500">{{ $t('no_data') }}</td>
              </tr>
              </tbody>
            </table>
          </div>
          <div class="flex justify-end">
            <button
                class="px-3 py-2 rounded-xl border"
                @click="closeDetails">{{ $t('close','Փակել') }}</button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { recycleOutputsApi } from '@/api.js'
import {formatDateTime, fromNow} from "@/utils/dateFormat.ts";

type ID = number
const props = defineProps<{ storageId: ID }>()

/* ─── State ─── */
const LIMIT = 30
const rows = ref<any[]>([])
const state = reactive({ loading:false, end:false, offset:0 })
const filters = reactive<{ search:string; status:string; start_date:string|undefined; end_date:string|undefined }>({
  search: '', status: '', start_date: undefined, end_date: undefined
})
const sentinel = ref<HTMLElement|null>(null)
let io:IntersectionObserver|null = null

/* ─── Helpers ─── */
const fmt = (n:any) => Number(n||0).toLocaleString(undefined,{ maximumFractionDigits:3 })
const formatDate = (v:any) => { try { return new Date(v).toLocaleString() } catch { return String(v||'') } }
const chip = (s?:string) => {
  switch ((s||'').toLowerCase()){
    case 'approved': return 'bg-indigo-100 text-indigo-700'
    case 'pending': return 'bg-amber-100 text-amber-700'
    case 'written_off': return 'bg-emerald-100 text-emerald-700'
    case 'cancelled': return 'bg-rose-100 text-rose-700'
    default: return 'bg-slate-100 text-slate-700'
  }
}

/* ─── Data ─── */
async function fetchPage(){
  if (state.loading || state.end) return
  state.loading = true
  try{
    const res = await recycleOutputsApi.getOutputs(props.storageId,{
      limit: LIMIT,
      offset: state.offset,
      search: filters.search || undefined,               // by identification_number
      status: filters.status || undefined,
      start_date: filters.start_date || undefined,
      end_date: filters.end_date || undefined,
    })
    const list = Array.isArray(res) ? res : (res?.data ?? [])
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
function debouncedReload(){ clearTimeout(t); t=setTimeout(reload, 300) }

/* ─── Actions ─── */
async function setStatus(row:any, status:'approved'|'written_off'|'cancelled'){
  // adapt to your API naming
  if (status==='approved') await recycleOutputsApi.approveOutput(props.storageId, row.id)
  else if (status==='written_off') await recycleOutputsApi.writeoffOutput(props.storageId, row.id)
  else await recycleOutputsApi.cancelOutput(props.storageId, row.id)
  row.status = status
}
const details = reactive({ open:false, entry:null as any })
async function openDetails(row:any){
  const full = await recycleOutputsApi.getOutputById(props.storageId, row.id, { include:'products.product' })
  details.entry = full.data
  details.open = true
}
function closeDetails(){ details.open=false; details.entry=null }
async function cancelProduct(entry:any, product:any){
  await recycleOutputsApi.cancelOutputProduct(props.storageId, entry.id, product.id)
  product.status = 'cancelled'
}

/* ─── Infinite scroll ─── */
function startObserver(){
  if (!sentinel.value) return
  io = new IntersectionObserver(ents => { if (ents[0].isIntersecting) fetchPage() })
  io.observe(sentinel.value)
}
onBeforeUnmount(()=>{ if (io && sentinel.value) io.unobserve(sentinel.value) })

/* ─── Mount ─── */
onMounted(async () => {
  await reload()
  startObserver()
})
</script>
