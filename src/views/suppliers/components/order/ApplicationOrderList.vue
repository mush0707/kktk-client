<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRouter } from 'vue-router'
import {ordersApi, authApi, suppliersApplicationsApi} from '@/api.js'
import { formatDateTime, fromNow } from '@/utils/dateFormat.js'

const router = useRouter()

// flash (optional)
const flash = ref('')
function setFlash(msg:string){ flash.value = msg; setTimeout(()=> flash.value='', 2500) }

// submitting state
const submittingId = ref<number | null>(null)

// actor
const actor = ref<any>(null)
const actorKind = computed(() => String(actor.value?.kind || ''))
async function loadActor () {
  try { actor.value = await authApi.getActor() } catch { actor.value = null }
}

// permissions
function isStaff(){ return actorKind.value === 'department_staff' }
function isLeader(){ return actorKind.value === 'department_leader' }

function canSendToApprove(row:any){
  if (row.status !== 'pending') return false
  // only creator should see draft at all; BE enforces; FE extra guard:
  const isCreator = Number(row.creator_id) === Number(actor.value?.user?.id)
  return isCreator && (isStaff() || isLeader())
}

function canStop(row:any) {
  if (row.status !== 'active') return false
  return isLeader();
}

function canFinish(row:any) {
  if (row.status !== 'active') return false
  return isLeader();
}
function canDecline(row:any) {
  if (row.status !== 'active') return false
  return isLeader();
}
function canSendToPurchasing(row: any) {
  const isCreator = Number(row.creator_id) === Number(actor.value?.user?.id)
  if (isLeader() && row.status === 'pending' && isCreator) return true
  if (isLeader() && row.status === 'send_to_approve') return true
  return false
}

function canCancel(row: any) {
  const isCreator = Number(row.creator_id) === Number(actor.value?.user?.id)
  if (row.status === 'pending' && isCreator) return true
  if (isLeader() && (row.status === 'send_to_approve' || row.status === 'pending')) return true
  return false
}


// actions
async function onSendToApprove(row: any) {
  if (!canSendToApprove(row)) return
  submittingId.value = row.id
  try {
    await ordersApi.sendToApprove(row.id)
    row.status = 'send_to_approve'
    setFlash('Ուղարկվեց հաստատման')
  } catch (e:any) {
    setFlash(e?.response?.data?.message || 'Չհաջողվեց ուղարկել հաստատման')
  } finally {
    submittingId.value = null
  }
}
async function onStop(row: any) {
  if (!canSendToApprove(row)) return
  submittingId.value = row.id
  try {
    await ordersApi.onStop(row.id)
    row.status = 'on_stop'
    setFlash('Պայմանագիրը կանգնեցվեց')
  } catch (e:any) {
    setFlash(e?.response?.data?.message || 'Չհաջողվեց ուղարկել հաստատման')
  } finally {
    submittingId.value = null
  }
}

async function onFinish(row: any) {
  if (!canFinish(row)) return
  submittingId.value = row.id
  try {
    await ordersApi.onFinish(row.id)
    row.status = 'on_stop'
    setFlash('Պատվերը հաջողությամբ ավարտվեց')
  } catch (e:any) {
    setFlash(e?.response?.data?.message || 'Չհաջողվեց ուղարկել հաստատման')
  } finally {
    submittingId.value = null
  }
}

async function onDecline(row: any) {
  if (!canDecline(row)) return
  submittingId.value = row.id
  try {
    await ordersApi.onDecline(row.id)
    row.status = 'on_stop'
    setFlash('Պատվերը հաջողությամբ ավարտվեց')
  } catch (e:any) {
    setFlash(e?.response?.data?.message || 'Չհաջողվեց ուղարկել հաստատման')
  } finally {
    submittingId.value = null
  }
}
async function onSendToPurchasing(row: any) {
  if (!canSendToPurchasing(row)) return
  submittingId.value = row.id
  try {
    await ordersApi.sendToPurchasing(row.id)
    row.status = 'send_to_purchasing'
    setFlash('Ուղարկվեց գնումներ')
  } catch (e:any) {
    setFlash(e?.response?.data?.message || 'Չհաջողվեց ուղարկել գնումներ')
  } finally {
    submittingId.value = null
  }
}

async function onCancel(row:any){
  if (!canCancel(row)) return
  if (!confirm('Չեղարկե՞լ հայտը։')) return
  submittingId.value = row.id
  try { await ordersApi.cancel(row.id); row.status = 'cancelled' }
  finally { submittingId.value = null }
}
// alias to match template if you still use onSendToSupplier
const onSendToSupplier = onSendToPurchasing

// search + paging
const q = ref('')
const status = ref('')

let t: any = null
function debouncedFetch(){ if(t) clearTimeout(t); t = setTimeout(()=> fetchRows(true), 250) }

const limit = ref(20)
const offset = ref(0)
const eof = ref(false)
const rows = ref<any[]>([])
const loading = ref(false)
const loadingMore = ref(false)

// infinite scroll
const sentinel = ref<HTMLElement | null>(null)
let io: IntersectionObserver | null = null
function setupInfiniteScroll(){
  if (io) { io.disconnect(); io = null }
  if (!sentinel.value) return
  io = new IntersectionObserver((entries)=>{
    const e = entries[0]
    if (e && e.isIntersecting) fetchRows(false)
  }, { root: null, rootMargin: '200px', threshold: 0 })
  io.observe(sentinel.value)
}

// status helpers
const STATUS_LABELS: Record<string, string> = {
  draft: 'Սևագիր',
  pending: 'Սպասում է',
  send_to_approve: 'Ուղարկված հաստատման',
  send_to_purchasing: 'Ուղարկված գնումներ',
  processing: 'Ընթացքի մեջ',
  sent: 'Ուղարկված',
  done: 'Ավարտված',
  cancelled: 'Չեղարկված',
  active: 'Ակտիվ',
  rejected: 'Չեղարկված (գնումներից)'
}
function statusLabel(s?: string){ return STATUS_LABELS[s || ''] || s || '—' }
function statusClass(s?: string){
  if (s === 'done') return 'bg-emerald-100 text-emerald-700'
  if (s === 'active') return 'bg-emerald-100 text-emerald-700'
  if (s === 'processing') return 'bg-indigo-100 text-indigo-700'
  if (s === 'send_to_approve') return 'bg-indigo-100 text-indigo-700'
  if (s === 'sent') return 'bg-blue-100 text-blue-700'
  if (s === 'send_to_purchasing') return 'bg-blue-100 text-blue-700'
  if (s === 'pending') return 'bg-amber-100 text-amber-700'
  if (s === 'cancelled') return 'bg-rose-100 text-rose-700'
  if (s === 'rejected') return 'bg-rose-100 text-rose-700'
  return 'bg-slate-100 text-slate-700'
}

// fetch
async function fetchRows(reset = true){
  if (reset) {
    loading.value = true; eof.value = false; offset.value = 0; rows.value = []
  } else {
    if (eof.value || loadingMore.value) return
    loadingMore.value = true
  }
  try{
    const res = await ordersApi.list({ search: q.value || '', limit: limit.value, offset: offset.value, status: status.value })
    const data = res?.data ?? res ?? []
    if (Array.isArray(data) && data.length) {
      rows.value.push(...data)
      offset.value += data.length
      if (data.length < limit.value) eof.value = true
    } else {
      eof.value = true
    }
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

onMounted(async ()=>{
  await loadActor()
  await fetchRows(true)
  setupInfiniteScroll()
})
onBeforeUnmount(()=>{ if (io) io.disconnect(); io = null })
</script>

<template>
  <div class="flex flex-col gap-4 px-4 py-4">
    <!-- Search / toolbar -->
    <div class="bg-white border border-gray-300 rounded-2xl p-4 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <input v-model.trim="q" @input="debouncedFetch()" placeholder="Փնտրել պատվեր՝ համար, բաժին, մատակարար…" class="border border-gray-300 rounded-xl px-3 py-2 w-[360px]" />
        <select v-model="status" class="border border-gray-300 rounded-xl px-3 py-2 w-full" @change="fetchRows(true)">
          <option value="">Բոլորը</option>
          <option value="active">Ակտիվ</option>
          <option value="cancelled">Չեղարկված</option>
          <option value="rejected">Չեղարկված գնումներից</option>
          <option value="rejected_from_supplier">Մերժվել է մատակարարից</option>
          <option value="archived">Ավարտված</option>
        </select>
      </div>
<!--      <div class="text-sm text-slate-500">-->
<!--        {{ rows.length }} արդյունք{{ eof && rows.length ? ' · ավարտ' : '' }}-->
<!--      </div>-->
    </div>

    <!-- Orders list -->
    <div class="bg-white border border-gray-300 rounded-2xl overflow-hidden">
      <div class="px-4 py-4">
        <p class="text-sm text-slate-600">{{ $t('orders_list') || 'Պատվերների ցանկ' }}</p>
      </div>

      <table class="min-w-full text-sm">
        <thead class="bg-gray-50">
        <tr>
          <th class="px-4 py-3 text-left">Համար</th>
          <th class="px-4 py-3 text-left">Գործընկեր</th>
          <th class="px-4 py-3 text-left">Ստեղծող</th>
          <th class="px-4 py-3 text-left">Կարգավիճակ</th>
          <th class="px-4 py-3 text-right">Թարմացվել է</th>
          <th class="px-4 py-3 text-right"></th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="o in rows" :key="o.id" class="border-t">
          <td class="px-4 py-2">{{ o.identification_number || o.number || ('#' + o.id) }}</td>
          <td class="px-4 py-2">
            <span class="flex flex-col gap-y-2">
                <span class="font-bold">{{ o.partner_contract?.partner?.name || '—' }}</span>
                <span>{{ o.partner_contract?.identification_number ? 'Պայմանագիր №'+o.partner_contract?.identification_number : '—' }}</span>
            </span>

          </td>
          <td class="px-4 py-2">{{ o.creator?.name || '—' }}</td>
          <td class="px-4 py-2">
            <span class="px-2 py-0.5 rounded text-xs" :class="statusClass(o.status)">{{ statusLabel(o.status) }}</span>
          </td>
          <td class="px-4 py-3 text-right">
            <span :title="o.updated_at">{{ formatDateTime(o.updated_at) }}</span>
            <span class="text-xs text-gray-400 ml-2">({{ fromNow(o.updated_at) }})</span>
          </td>
          <td class="px-4 py-2">
            <div class="flex items-center gap-2 justify-end">
              <RouterLink :to="'/suppliers/orders/' + o.id"
                          class="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >Դիտել</RouterLink>
<!--              <button-->
<!--                  v-if="canStop(o)"-->
<!--                  class="px-3 py-1 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"-->
<!--                  @click="onStop(o)"-->
<!--              >-->
<!--                Կանգնեցնել-->
<!--              </button>-->
              <button
                  v-if="canFinish(o)"
                  class="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                  :disabled="submittingId===o.id"
                  @click="onFinish(o)"
              >
                Ավարտել
              </button>
              <button
                  v-if="canDecline(o)"
                  class="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                  :disabled="submittingId===o.id"
                  @click="onDecline(o)"
              >
                Մերժել
              </button>
              <button
                  v-if="canSendToApprove(o)"
                  class="px-3 py-1 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  :disabled="submittingId===o.id"
                  @click="onSendToApprove(o)"
              >
                Ուղարկել հաստատման
              </button>

              <button
                  v-if="canSendToPurchasing(o)"
                  class="px-3 py-1 text-xs font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:opacity-50"
                  :disabled="submittingId===o.id"
                  @click="onSendToPurchasing(o)"
              >
                Ուղարկել գնումներ
              </button>
              <button
                  v-if="canCancel(o)"
                  class="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                  :disabled="submittingId===o.id"
                  @click="onCancel(o)"
              >
                Չեղարկել
              </button>
            </div>
          </td>
        </tr>

        <!-- empty / loading -->
        <tr v-if="!loading && rows.length===0">
          <td colspan="7" class="px-4 py-6 text-center text-slate-500">Արդյունք չկա</td>
        </tr>
        <tr v-if="loading && rows.length===0">
          <td colspan="7" class="px-4 py-6 text-center text-slate-500">Բեռնում…</td>
        </tr>

        <!-- paging indicators -->
        <tr v-if="loadingMore">
          <td colspan="7" class="px-4 py-4 text-center text-slate-500">Բեռնում ավելին…</td>
        </tr>
        <tr v-if="!loading && !loadingMore && eof && rows.length">
          <td colspan="7" class="px-4 py-4 text-center text-slate-400 text-xs">Ավարտ</td>
        </tr>

        <!-- sentinel -->
        <tr>
          <td colspan="7"><div ref="sentinel" class="h-2"></div></td>
        </tr>
        </tbody>
      </table>
    </div>

    <p v-if="flash" class="text-sm text-slate-600">{{ flash }}</p>
  </div>
</template>
