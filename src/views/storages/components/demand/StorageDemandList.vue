<!-- src/views/demand/tabs/DemandListTab.vue -->
<template>
  <div class="flex flex-col gap-3 px-4 py-4">
    <!-- Filters -->
    <div class="grid md:grid-cols-2 gap-2 items-end">
      <input
          v-model="search"
          class="border border-gray-300 rounded-xl px-3 py-2 w-full"
          placeholder="ID / Ապրանք"
          @input="debouncedReload"
      />
      <select v-model="status" class="border border-gray-300 rounded-xl px-3 py-2 w-full" @change="reloadFromStart">
        <option value="">Բոլորը</option>
        <option value="draft">Սևագիր</option>
        <option value="awaiting_approval">Սպասում է հաստատման</option>
        <option value="awaiting_warehouse">Սպասում է պահեստին</option>
        <option value="approved">Հաստատված</option>
        <option value="rejected">Մերժված</option>
        <option value="cancelled">Չեղարկված</option>
      </select>
    </div>

    <!-- Table -->
    <div class="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <table class="min-w-full text-sm">
        <thead class="bg-gray-50">
        <tr>
          <th class="px-4 py-3 text-left">#</th>
          <th class="px-4 py-3 text-left">Պահեստ</th>
          <th class="px-4 py-3 text-left">Ստեղծող</th>
          <th class="px-4 py-3 text-left">Ստեղծվել է</th>
          <th class="px-4 py-3 text-left">Կարգավիճակ</th>
          <th class="px-4 py-3 text-left">Գործողություններ</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="row in rows" :key="row.id" class="border-t">
          <td class="px-4 py-3">{{ row.id }}</td>
          <td class="px-4 py-3">{{ row.storage?.address || row.storage_id }}</td>
          <td class="px-4 py-3">{{ row.user?.name || row.user_id }}</td>
          <td class="px-4 py-3">
            <span :title="row.created_at">{{ formatDateTime(row.created_at) }}</span>
            <span class="text-xs text-gray-400 ml-2">({{ fromNow(row.created_at) }})</span>
          </td>
          <td class="px-4 py-3">
              <span class="px-2 py-0.5 rounded text-xs" :class="statusClass(row.status)">
                {{ statusLabel(row.status) }}
              </span>
          </td>

          <td class="px-4 py-3">
            <div class="flex flex-wrap gap-2">
              <button
                  class="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-md shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  @click="openView(row)"
              >
                Դիտել
              </button>

              <!-- actions only if not final (approved/cancelled) -->
              <template v-if="!isFinal(row)">
                <!-- only draft -->
                <button
                    v-if="canSubmitForApproval(row)"
                    class="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded-md shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                    @click="onSubmitForApproval(row)"
                    :disabled="submittingId===row.id"
                >
                  Ուղարկել հաստատման
                </button>

                <!-- only draft (creator/staff), or superadmin -->
                <button
                    v-if="canCancel(row)"
                    class="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded-md shadow hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                    @click="onCancel(row)"
                    :disabled="submittingId===row.id"
                >
                  Չեղարկել
                </button>

                <!-- only awaiting_warehouse (no longer for approved) -->
                <button
                    v-if="canSendToWarehouse(row)"
                    class="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded-md shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                    @click="onSubmitToWarehouse(row)"
                    :disabled="submittingId===row.id"
                >
                  Ուղարկել պահեստ
                </button>
              </template>
            </div>
          </td>
        </tr>

        <tr v-if="!loading && rows.length===0">
          <td :colspan="6" class="px-4 py-8 text-center text-gray-500">Տվյալներ չկան</td>
        </tr>
        </tbody>
      </table>

      <div class="p-3 text-center text-sm" v-if="loading">Լցվում է…</div>
    </div>

    <!-- infinite scroll sentinel -->
    <div ref="sentinel" class="h-10 flex items-center justify-center">
      <span v-if="loading && rows.length>0" class="text-sm text-gray-500">Լցվում է…</span>
      <span v-else-if="endReached && rows.length>0" class="text-xs text-gray-400">Վերջ</span>
    </div>
  </div>

  <!-- View modal -->
  <div v-if="viewModal.open" class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
    <div class="bg-white w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden">
      <div class="px-4 py-3 border-b flex items-center justify-between">
        <div class="font-semibold">
          Պահանջագիր № {{ viewModal.data?.id }}
          <span class="ml-2 text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700">
            {{ statusLabel(viewModal.data?.status) }}
          </span>
        </div>
        <button class="p-2 hover:bg-gray-100 rounded" @click="closeView">✕</button>
      </div>

      <div class="p-4">
        <div class="grid md:grid-cols-3 gap-3 mb-4 text-sm text-gray-600">
          <div><b>Թիրախ պահեստ:</b> {{ viewModal.data?.storage?.address || '—' }}</div>
        </div>

        <div class="border rounded-xl overflow-hidden">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-50">
            <tr>
              <th class="px-3 py-2 text-left">Ապրանք</th>
              <th class="px-3 py-2 text-right">Քանակ</th>
              <th class="px-3 py-2 text-right">Չափ</th>
              <th class="px-3 py-2 text-center">Կարգավիճակ</th>
              <th class="px-3 py-2 text-center">Գործողություններ</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="it in viewItems" :key="it.id" class="border-t">
              <td class="px-3 py-2">
                <div class="font-medium">{{ it.product?.name || it.product_name || it.storage_product_id }}</div>
                <div v-if="(it.product?.characteristics||[]).length" class="mt-1 flex flex-wrap gap-1">
                    <span
                        v-for="c in it.product.characteristics"
                        :key="c.id||c.name"
                        class="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-700"
                    >{{ c.name }}</span>
                </div>
              </td>
              <td class="px-3 py-2 text-right tabular-nums">{{ fmt(it.qty) }}</td>
              <td class="px-3 py-2 text-right">{{ unitShort(it.storage_product.measure) }}</td>
              <td class="px-3 py-2 text-center">
                  <span :class="statusPillClass(it.status)" class="px-2 py-0.5 rounded text-xs">
                    {{ itemStatusLabel(it.status) }}
                  </span>
              </td>
              <td class="px-3 py-2 text-center">
                <button
                    v-if="canCancelItem(it)"
                    class="px-2 py-1 text-xs rounded bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
                    :disabled="cancelLoadingId === it.id"
                    @click="cancelItem(it)"
                >
                  <span v-if="cancelLoadingId === it.id">Չեղարկում…</span>
                  <span v-else>Չեղարկել</span>
                </button>
              </td>
            </tr>

            <tr v-if="viewItems.length===0">
              <td colspan="5" class="px-3 py-6 text-center text-gray-500">Տվյալներ չկան</td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="px-4 py-3 border-t text-right">
        <button class="px-3 py-2 rounded-xl border hover:bg-gray-50" @click="closeView">Փակել</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted, onBeforeUnmount, watch} from 'vue'
import { storageDemandApi, authApi } from '@/api.js'
import { formatDateTime, fromNow } from '@/utils/dateFormat'

const actor = ref<any>(null)
const rows = ref<any[]>([])
const loading = ref(false)
const submittingId = ref<number|null>(null)

const limit = ref(50)
const offset = ref(0)
const endReached = ref(false)

const search = ref('')
const status = ref('')
watch(status, () => reloadFromStart()) // ապահովության համար, անգամ առանց @change-ի

function reloadFromStart() {
  rows.value = []
  offset.value = 0
  endReached.value = false
  fetchPage()           // քո արդեն առկա էջավորմամբ loader-ը
}

// ----- columns visibility (եթե superadmin՝ ցույց տուր երկուսը)
const showStorageCol = computed(() => !belongsToStorageOrDepartment())
const showDepartmentCol = computed(() => !belongsToStorageOrDepartment())
const extraCols = computed(() => (showStorageCol.value ? 1 : 0) + (showDepartmentCol.value ? 1 : 0))
const isSuper = computed(() => actor.value?.kind === 'superadmin')
function belongsToStorageOrDepartment() {
  const kind = actor.value?.kind
  return [
    'storekeeper',
    'storage_department_leader',
    'storage_department_staff',
    'department_leader',
    'department_staff',
  ].includes(kind)
}
function isFinal(row:any) {
  // «պահեստ ուղարկված» և «չեղարկված» վիճակներում այլ կոճակներ չկան
  return row.status === 'approved' || row.status === 'cancelled'
}
const viewModal = ref({ open:false, data:null as any, rowRef: null as any })
const cancelLoadingId = ref<number|null>(null)

function fmt(n:any){ return Number(n||0).toLocaleString(undefined,{ maximumFractionDigits:6 }) }
function unitShort(m:any){
  const k = String(m||'').toLowerCase()
  return ({kg:'կգ', g:'գ', tonn:'տ', t:'տ', l:'լ', ml:'մլ', m3:'մ³', m:'մ', cm:'սմ', mm:'մմ', piece:'հատ', pcs:'հատ'})[k] || ''
}

function isCancelled(r:any){
  return String(r?.status || '').toLowerCase() === 'cancelled'
}
// Item statuses: "Սպասման մեջ", "Հաստատված", "Չեղարկված", "Մերժված", "Դուրս գրված"
function itemStatusLabel(s?:string){
  const v = String(s||'').toLowerCase()
  if (v==='pending') return 'Սպասման մեջ'
  if (v==='approved') return 'Հաստատված'
  if (v==='cancelled') return 'Չեղարկված'
  if (v==='rejected') return 'Մերժված'
  if (v==='written_off') return 'Դուրս գրված'
  return s || '—'
}
function statusPillClass(s?:string){
  const v = String(s||'').toLowerCase()
  if (v==='approved') return 'bg-emerald-100 text-emerald-700'
  if (v==='rejected') return 'bg-amber-100 text-amber-700'
  if (v==='cancelled') return 'bg-rose-100 text-rose-700'
  if (v==='written_off') return 'bg-indigo-100 text-indigo-700'
  return 'bg-slate-100 text-slate-700' // pending & default
}

async function openView(row:any){
  viewModal.value.open = true
  viewModal.value.rowRef = row     // պահում ենք հղումը ցանկի իրական տողին
  viewModal.value.data = null

  const data = await storageDemandApi.get(row.id)
  viewModal.value.data = data
}
function closeView(){
  viewModal.value.open = false
  viewModal.value.data = null
}
function setListRowStatus(id:number, status:string){
  const idx = items.value.findIndex((x:any)=> x.id === id)
  if (idx !== -1) items.value[idx].status = status
}

const viewItems = computed(()=> Array.isArray(viewModal.value.data?.items) ? viewModal.value.data.items : [])

// ⬇️ Չեղարկման կանոններ
function canCancelItem(it:any){
  // item must be pending
  const isPending = String(it.status||'').toLowerCase()==='pending'
  if (!isPending) return false

  const parentStatus = String(viewModal.value.data?.status||'').toLowerCase()
  const kind = String(actor.value?.kind||'')

  // superadmin → միշտ թույլ տանք pending item-ը (մինչև ուղարկվելը)
  if (kind==='superadmin') {
    return parentStatus==='draft' || parentStatus==='awaiting_approval'
  }

  // պահեստի բաժնի ղեկավար կամ ստորաբաժանման աշխատակից → parent must be draft
  if (kind==='storage_department_leader' || kind==='department_staff') {
    return parentStatus==='draft'
  }

  // պահեստապետ կամ ստորաբաժանման ղեկավար → parent must be awaiting_approval
  if (kind==='storekeeper' || kind==='department_leader') {
    return parentStatus==='awaiting_approval'
  }

  // այլ դեպքերում՝ ոչ
  return false
}

async function cancelItem(it:any){
  if (!canCancelItem(it)) return
  if (!confirm('Չեղարկե՞լ ընտրված տողը։')) return

  cancelLoadingId.value = it.id
  try {
    await storageDemandApi.cancelItem(viewModal.value.data.id, it.id)

    // բերում ենք թարմացված պահանջագիրը
    const fresh = await storageDemandApi.get(viewModal.value.data.id)
    viewModal.value.data = fresh

    // եթե backend-ը արդեն դրեց ամբողջ պահանջագիրը cancelled,
    // ապա անմիջապես թարմացնենք նաև ցանկի տողի status-ը rowRef-ի միջոցով
    if (String(fresh.status || '').toLowerCase() === 'cancelled') {
      if (viewModal.value.rowRef) {
        viewModal.value.rowRef.status = 'cancelled'   // ← սա բավարար է՝ rowRef-ը ռեակտիվ է
      }
    }
  } finally {
    cancelLoadingId.value = null
  }
}

function setListRowStatusById(id:number, status:string){
  const idx = list.value.findIndex((r:any)=> r.id === id)
  if (idx !== -1) list.value[idx].status = status
}

// labels & colors
function statusLabel(s:string){
  return ({
    draft:'Սևագիր',
    awaiting_approval:'Սպասում է հաստատման',
    awaiting_warehouse:'Սպասում է պահեստին',
    approved:'Հաստատված',
    rejected:'Մերժված',
    cancelled:'Չեղարկված',
    written_off:'Դուրս գրված',
  } as any)[s] || s
}
function statusClass(s:string){
  return ({
    draft:'bg-gray-100 text-gray-700',
    awaiting_approval:'bg-amber-100 text-amber-700',
    awaiting_warehouse:'bg-blue-100 text-blue-700',
    approved:'bg-emerald-100 text-emerald-700',
    rejected:'bg-rose-100 text-rose-700',
    cancelled:'bg-slate-100 text-slate-600',
    written_off:'bg-indigo-100 text-indigo-700',
  } as any)[s] || 'bg-gray-100 text-gray-700'
}
function dt(s?:string){ return s ? new Date(s).toLocaleString() : '—' }

// permissions (frontend-side; backend final authority)
const isStaff = computed(()=> ['storage_department_staff','department_staff'].includes(actor.value?.kind))
const isLeaderOrKeeper = computed(()=> ['storage_department_leader','department_leader','storekeeper','superadmin'].includes(actor.value?.kind))

function canSubmitForApproval(row:any) {
  const kind = String(actor.value?.kind||'')

  // superadmin → միշտ true
  // if (isSuper.value) return true
  // staff և storage_department_leader կարող են «submit_for_approval» միայն draft վիճակում
  const allowedKinds = ['superadmin','department_staff','storage_department_staff','storage_department_leader']
  return row.status === 'draft' && allowedKinds.includes(kind)
}

function canApprove(row:any) {
  const kind = String(actor.value?.kind||'')

  // if (isSuper.value) return true
  // storekeeper կամ department_leader՝ «awaiting_approval»
  const allowedKinds = ['superadmin','storekeeper','department_leader']
  return row.status === 'awaiting_approval' && allowedKinds.includes(kind)
}

function canSendToWarehouse(row:any) {
  const kind = String(actor.value?.kind||'')
  const allowedKinds = ['superadmin','storekeeper','department_leader']
  // if (isSuper.value) return true
  // storekeeper կամ department_leader՝ «awaiting_warehouse» կամ «approved»
  return (row.status === 'awaiting_approval' || row.status === 'approved') && allowedKinds.includes(kind)
}

function canCancel(row:any) {
  if (isSuper.value) return true
  // draft վիճակում՝ միայն ստեղծողը (user_id) կամ staff/leader (ըստ քո կանոնների)
  const isCreator = Number(row.user_id) === Number(actor.value?.user?.id)
  return row.status === 'draft' && isCreator
}

// actions
async function onSubmitForApproval(row:any){
  if(!confirm('Ուղարկել հաստատման՞')) return
  submittingId.value = row.id
  try { await storageDemandApi.submitForApproval(row.id); resetAndReload() } finally { submittingId.value = null }
}
async function onCancel(row:any){
  if(!confirm('Չեղարկե՞լ սևագիրը')) return
  submittingId.value = row.id
  try { await storageDemandApi.cancel(row.id); resetAndReload() } finally { submittingId.value = null }
}
async function onApprove(row:any){
  if(!confirm('Հաստատե՞լ պահանջագիրը')) return
  submittingId.value = row.id
  try { await storageDemandApi.approve(row.id); resetAndReload() } finally { submittingId.value = null }
}
async function onSubmitToWarehouse(row:any){
  if(!confirm('Ուղարկե՞լ պահեստ')) return
  submittingId.value = row.id
  try { await storageDemandApi.submitToWarehouse(row.id); resetAndReload() } finally { submittingId.value = null }
}

// paging
const sentinel = ref<HTMLElement|null>(null)
let io:IntersectionObserver|null = null

async function fetchPage(){
  if(loading.value || endReached.value) return
  loading.value = true
  try{
    const page = await storageDemandApi.list({
      limit: limit.value,
      offset: offset.value,
      search: (search.value||'').trim() || undefined,
      status: status.value || undefined,
    })
    const list = Array.isArray(page)? page : (page?.data ?? page?.rows ?? [])
    rows.value.push(...list)
    offset.value += list.length
    if(list.length < limit.value) endReached.value = true
  } finally { loading.value = false }
}
function resetAndReload(){
  rows.value = []
  endReached.value = false
  offset.value = 0
  fetchPage()
}
const debouncedReload = (() => {
  let t:any=null
  return () => { clearTimeout(t); t=setTimeout(resetAndReload,300) }
})()

function startIO(){
  if(!sentinel.value) return
  io = new IntersectionObserver((entries)=>{
    const [e] = entries
    if(e.isIntersecting) fetchPage()
  })
  io.observe(sentinel.value)
}
function stopIO(){ if(io && sentinel.value) io.unobserve(sentinel.value); io=null }

// actor
async function loadActor(){
  try { actor.value = await authApi.getActor() } catch { actor.value = null }
}

onMounted(async ()=>{
  await loadActor()
  await fetchPage()
  startIO()
})
onBeforeUnmount(stopIO)
</script>
