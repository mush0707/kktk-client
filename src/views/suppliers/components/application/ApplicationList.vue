<!-- src/views/suppliers/applications/ApplicationsList.vue -->
<template>
  <div class="flex flex-col gap-3 px-4 py-4">
    <!-- Filters -->
    <div class="grid md:grid-cols-2 gap-2 items-end">
      <input
          v-model="search"
          class="border border-gray-300 rounded-xl px-3 py-2 w-full"
          placeholder="ID / Ստորաբաժանում"
          @input="debouncedReload"
      />
      <select v-model="status" class="border border-gray-300 rounded-xl px-3 py-2 w-full" @change="reloadFromStart">
        <option value="">Բոլորը</option>
        <option value="draft">Սևագիր</option>
        <option value="send_to_approve">Ուղ. հաստատման</option>
        <option value="send_to_supplier">Ուղ. մատակարարին</option>
        <option value="cancelled">Չեղարկված</option>
        <option value="rejected_from_supplier">Մերժվել է մատակարարից</option>
        <option value="part_of_order">Գնման պատվերի առարկա</option>
      </select>
    </div>

    <!-- Table -->
    <div class="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <table class="min-w-full text-sm">
        <thead class="bg-gray-50">
        <tr>
          <th class="px-4 py-3 text-left">#</th>
          <th class="px-4 py-3 text-left">Ստեղծող</th>
          <th class="px-4 py-3 text-left">Բաժին</th>
          <th class="px-4 py-3 text-left">Ստեղծվել է</th>
          <th class="px-4 py-3 text-left">Կարգավիճակ</th>
          <th class="px-4 py-3 text-left">Գործողություններ</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="row in rows" :key="row.id" class="border-t">
          <td class="px-4 py-3">{{ row.identification_number }}</td>
          <td class="px-4 py-3">{{ row.creator?.name || row.creator_id }}</td>
          <td class="px-4 py-3">{{ row.department?.name || row.department_id }}</td>
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
              <router-link
                  v-if="canViewEdit(row)"
                  :to="'/suppliers/applications/'+row.id"
                  class="px-3 py-1 text-xs font-medium text-white bg-sky-600 rounded-md shadow hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                Տեսնել / Խմբագրել
              </router-link>
              <button
                  v-if="canSendToApprove(row)"
                  class="px-3 py-1 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  :disabled="submittingId===row.id"
                  @click="onSendToApprove(row)"
              >
                Ուղարկել հաստատման
              </button>

              <button
                  v-if="canSendToSupplier(row)"
                  class="px-3 py-1 text-xs font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:opacity-50"
                  :disabled="submittingId===row.id"
                  @click="onSendToSupplier(row)"
              >
                Ուղարկել մատակարարին
              </button>
              <button
                  v-if="canCancel(row)"
                  class="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                  :disabled="submittingId===row.id"
                  @click="onCancel(row)"
              >
                Չեղարկել
              </button>
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
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { suppliersApplicationsApi, authApi } from '@/api.js'
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

function reloadFromStart() {
  rows.value = []
  offset.value = 0
  endReached.value = false
  fetchPage()
}
function canViewEdit(row:any){
  const st = String(row?.status || '').toLowerCase()
  if (st === 'draft') return true                      // draft → բոլորին
  return String(actor.value?.kind||'') === 'department_leader'  // մնացածն՝ միայն leader
}
const debouncedReload = (() => { let t:any=null; return () => { clearTimeout(t); t=setTimeout(reloadFromStart,300) }})()

const isSuppliersDept = computed(()=> String(actor.value?.department_slug||'') === 'suppliers')
const kind = computed(()=> String(actor.value?.kind||''))

function statusLabel(s:string){
  return ({
    draft:'Սևագիր',
    send_to_approve:'Ուղ. հաստատման',
    send_to_supplier:'Ուղ. մատակարարին',
    cancelled:'Չեղարկված',
    rejected_from_supplier:'Մերժվել է մատակարարից',
    part_of_order:'Գնման պատվերի առարկա',
    send_to_purchasing:'Ուղ. գնման',
    rejected_from_purchasing:'Մերժվել է գնման բաժնից',
    finished:'Ավարտված',
  } as any)[s] || s
}
function statusClass(s:string){
  return ({
    draft:'bg-gray-100 text-gray-700',
    send_to_approve:'bg-amber-100 text-amber-700',
    send_to_supplier:'bg-blue-100 text-blue-700',
    cancelled:'bg-slate-100 text-slate-600',
    rejected_from_supplier:'bg-rose-100 text-rose-700',
    part_of_order:'bg-indigo-100 text-indigo-700',
  } as any)[s] || 'bg-gray-100 text-gray-700'
}
function dt(s?:string){ return s ? new Date(s).toLocaleString() : '—' }

/* actions availability
   - department_staff:
       draft -> can send_to_approve
   - department_leader:
       draft -> can send_to_approve & send_to_supplier
       send_to_approve -> can send_to_supplier
*/
function isStaff(){ return kind.value === 'department_staff' }
function isLeader(){ return kind.value === 'department_leader' }

function canSendToApprove(row:any){
  if (row.status !== 'draft') return false
  // only creator should see draft at all; BE enforces; FE extra guard:
  const isCreator = Number(row.creator_id) === Number(actor.value?.user?.id)
  return isCreator && (isStaff() || isLeader())
}
function canSendToSupplier(row:any){
  const isCreator = Number(row.creator_id) === Number(actor.value?.user?.id)
  if (isLeader() && row.status === 'draft' && isCreator) return true
  if (isLeader() && row.status === 'send_to_approve') return true
  return false
}

function canCancel(row:any){
  const isCreator = Number(row.creator_id) === Number(actor.value?.user?.id)
  if (row.status === 'draft' && isCreator) return true
  if (isLeader() && (row.status === 'send_to_approve' || row.status === 'draft')) return true
  return false
}

async function onSendToApprove(row:any){
  if (!canSendToApprove(row)) return
  submittingId.value = row.id
  try { await suppliersApplicationsApi.sendToApprove(row.id); afterAction(row.id,'send_to_approve') }
  finally { submittingId.value = null }
}
async function onSendToSupplier(row:any){
  if (!canSendToSupplier(row)) return
  submittingId.value = row.id
  try { await suppliersApplicationsApi.sendToSupplier(row.id); afterAction(row.id,'send_to_supplier') }
  finally { submittingId.value = null }
}
async function onCancel(row:any){
  if (!canCancel(row)) return
  if (!confirm('Չեղարկե՞լ հայտը։')) return
  submittingId.value = row.id
  try { await suppliersApplicationsApi.cancel(row.id); afterAction(row.id,'cancelled') }
  finally { submittingId.value = null }
}
function afterAction(id:number, st:string){
  const i = rows.value.findIndex(r=> r.id===id)
  if (i!==-1) rows.value[i].status = st
}

/* paging */
const sentinel = ref<HTMLElement|null>(null)
let io:IntersectionObserver|null = null

async function fetchPage(){
  if (loading.value || endReached.value) return
  loading.value = true
  try{
    const page = await suppliersApplicationsApi.list({
      limit: limit.value,
      offset: offset.value,
      search: (search.value||'').trim() || undefined,
      status: status.value || undefined,
    })
    const list = Array.isArray(page)? page : (page?.data ?? page?.rows ?? [])
    rows.value.push(...list)
    offset.value += list.length
    if (list.length < limit.value) endReached.value = true
  } finally { loading.value = false }
}
function startIO(){
  if(!sentinel.value) return
  io = new IntersectionObserver((entries)=>{ if(entries[0].isIntersecting) fetchPage() })
  io.observe(sentinel.value)
}
function stopIO(){ if(io && sentinel.value) io.unobserve(sentinel.value); io=null }

/* actor */
async function loadActor(){ try{ actor.value = await authApi.getActor() }catch{ actor.value = null } }

onMounted(async ()=>{
  await loadActor()
  await fetchPage()
  startIO()
})
onBeforeUnmount(stopIO)
</script>
