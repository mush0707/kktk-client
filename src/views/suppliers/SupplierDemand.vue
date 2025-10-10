<template>
  <div class="flex flex-col">
    <div class="bg-white">
      <div class="flex items-center justify-between p-4 border-b border-gray-200 rounded-md">
        <div class="text-xl font-semibold">Հայտեր ֊ մատակարար</div>
      </div>
    </div>
  </div>
  <div class="flex flex-col gap-4 px-4 py-4">
    <!-- Search / toolbar -->
    <div class="bg-white border border-gray-300 rounded-2xl p-4 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <input v-model.trim="q" @input="debouncedFetch()" placeholder="Փնտրել՝պահանջագրի համար, ապրանքի անվանում"
               class="border border-gray-300 rounded-xl px-3 py-2 w-[360px]"/>
        <select v-model="department" @change="reloadFromStart" class="border border-gray-300 rounded-xl px-3 py-2">
          <option value="" selected>{{ $t('all_departments') || 'Բոլոր բաժինները' }}</option>
          <option v-for="d in departmentOptions" :key="d.id" :value="d.id">{{ d.name }}</option>
        </select>
        <select v-model="status" class="border border-gray-300 rounded-xl px-3 py-2 w-full" @change="reloadFromStart">
          <option value="">Բոլորը</option>
          <option value="sent">Ուղարկված</option>
          <option value="in_progress">Ընթացքի մեջ</option>
          <option value="rejected">Մերժված</option>
          <option value="finished">Ավարտված</option>
        </select>
      </div>
    </div>

    <div class="bg-white border border-gray-300 rounded-2xl overflow-hidden">
      <div class="px-4 py-4">
        <p class="text-sm text-slate-600">Պահանջագրերի ապրանքացանկ</p>
      </div>

      <table class="min-w-full text-sm">
        <thead class="bg-gray-50">
        <tr>
          <th class="px-4 py-3 text-left">Պահանջագրի Համար</th>
          <th class="px-4 py-3 text-left">Ստորաբաժանում</th>
          <th class="px-4 py-3 text-left">Կարգավիճակ</th>
          <th class="px-4 py-3 text-right">Թարմացվել է</th>
          <th class="px-4 py-3 text-right"></th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="o in rows" :key="o.id" class="border-t">
          <td class="px-4 py-2">
            {{ o.identification_number || o.number || ('#' + o.id) }}</td>
          <td class="px-4 py-2">
            <span class="flex flex-col gap-y-2">
                <span class="font-bold">{{ o.department.name }}</span>
            </span>
          </td>
          <td class="px-4 py-2">
            <span class="px-2 py-0.5 rounded text-xs" :class="statusClass(o.status)">{{ $t(o.status) }}</span>
          </td>
          <td class="px-4 py-3 text-right">
            <span :title="o.updated_at">{{ formatDateTime(o.updated_at) }}</span>
            <span class="text-xs text-gray-400 ml-2">({{ fromNow(o.updated_at) }})</span>
          </td>
          <td class="px-4 py-2">
            <div class="flex items-center gap-2 justify-end">
              <button
                  v-if="canFinishRow(o)"
                  class="px-3 py-1 text-xs font-medium text-white bg-emerald-700 rounded-md hover:bg-emerald-800 disabled:opacity-50"
                  :disabled="finishingId===o.id"
                  @click="finishRow(o)"
              >
                {{ finishingId===o.id ? 'Ավարտվում է…' : 'Ավարտել' }}
              </button>
              <RouterLink :to="'/suppliers/demands/' + o.id"
                          class="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >Դիտել
              </RouterLink>
              <button
                  v-if="canSatisfy(o)"
                  class="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                  :disabled="submittingId===o.id"
                  @click="onSatisfy(o)"
              >
                Բավարարել
              </button>
              <button
                  v-if="canReject(o)"
                  class="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                  :disabled="submittingId===o.id"
                  @click="onReject(o)"
              >
                Մերժել
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
          <td colspan="7">
            <div ref="sentinel" class="h-2"></div>
          </td>
        </tr>
        </tbody>
      </table>
    </div>

    <p v-if="flash" class="text-sm text-slate-600">{{ flash }}</p>
  </div>
  <RejectReasonModal
      :open="rejectModal.open"
      :title="rejectModal.title"
      :loading="rejectModal.loading"
      @close="rejectModal.open=false"
      @confirm="confirmReject"
  />
</template>
<script setup lang="ts">

import {formatDateTime, fromNow} from "@/utils/dateFormat.ts";
import {computed, onBeforeUnmount, onMounted, ref} from "vue";
import {supplierDemandsApi, directoriesApi, ordersApi, authApi} from "@/api.ts";
import RejectReasonModal from '@/components/RejectReasonModal.vue'
const q = ref('')
const actor = ref<any>(null)
let t: any = null
// flash (optional)
const flash = ref('')
const submittingId = ref<number|null>(null)
const kind = computed(()=> String(actor.value?.kind||''))

function isStaff(){ return kind.value === 'department_staff' }
function isLeader(){ return kind.value === 'department_leader' }
const rejectModal = ref<{
  open: boolean,
  loading: boolean,
  title: string,
  target: any|null
}>({ open:false, loading:false, title:'Մերժել պահանջագիրը', target:null })
function setFlash(msg: string) {
  flash.value = msg;
  setTimeout(() => flash.value = '', 2500)
}

function debouncedFetch() {
  if (t) clearTimeout(t);
  t = setTimeout(() => fetchRows(true), 250)
}

const limit = ref(20)
const offset = ref(0)
const eof = ref(false)
const rows = ref<any[]>([])
const status = ref('')

const loading = ref(false)
const loadingMore = ref(false)
const department = ref('')
const departmentOptions = ref([])
const STATUS_LABELS: Record<string, string> = {
  sent: 'Ակտիվ',
  finished: 'Ավարտված',
  in_progress: 'Ընթացքի մեջ',
  rejected: 'Մերժված',
}

function statusClass(s: string) {
  return ({
    sent: 'bg-emerald-100 text-emerald-700',
    finished: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-rose-100 text-rose-700',
    in_progress: 'bg-gray-100 text-gray-700',
  } as any)[s] || 'bg-gray-100 text-gray-700'
}

function statusLabel(s?: string) {
  return STATUS_LABELS[s || ''] || s || '—'
}

// infinite scroll
const sentinel = ref<HTMLElement | null>(null)
let io: IntersectionObserver | null = null

function reloadFromStart() {
  rows.value = []
  offset.value = 0
  fetchRows()
}
function canSatisfy(row:any) {
  if (row.status !== 'sent') return false
  return isLeader();
}
function canReject(row:any) {
  if (row.status !== 'sent') return false
  return isLeader();
}
function setupInfiniteScroll() {
  if (io) {
    io.disconnect();
    io = null
  }
  if (!sentinel.value) return
  io = new IntersectionObserver((entries) => {
    const e = entries[0]
    if (e && e.isIntersecting) fetchRows(false)
  }, {root: null, rootMargin: '200px', threshold: 0})
  io.observe(sentinel.value)
}

async function onSatisfy(row: any) {
  if (!canSatisfy(row)) return
  submittingId.value = row.id
  try {
    await supplierDemandsApi.onSatisfy(row.id)
    row.status = 'in_progress'
    setFlash('Պահանջագիրը հաջողությամբ բավարարվել է')
  } catch (e:any) {
    setFlash(e?.response?.data?.message || 'Չհաջողվեց ուղարկել հաստատման')
  } finally {
    submittingId.value = null
  }
}

function onReject(row:any) {
  if (!canReject(row)) return
  rejectModal.value = {
    open: true,
    loading: false,
    title: `Մերժել պահանջագիրը № ${row.identification_number || row.id}`,
    target: row
  }
}

async function confirmReject(reason:string) {
  const row = rejectModal.value.target
  if (!row) return
  rejectModal.value.loading = true
  submittingId.value = row.id
  try {
    await supplierDemandsApi.reject(row.id, { reason })   // ← reason փոխանցվում է backend
    row.status = 'rejected'
    setFlash('Պահանջագիրը հաջողությամբ մերժվեց')
  } catch (e:any) {
    setFlash(e?.response?.data?.message || 'Չհաջողվեց մերժել')
  } finally {
    submittingId.value = null
    rejectModal.value.open = false
    rejectModal.value.loading = false
  }
}

async function fetchDepartments(reset = true) {
  const res = await directoriesApi.departments()
  departmentOptions.value = res?.data ?? res ?? []
}

async function fetchRows(reset = true) {
  if (reset) {
    loading.value = true;
    eof.value = false;
    offset.value = 0;
    rows.value = []
  } else {
    if (eof.value || loadingMore.value) return
    loadingMore.value = true
  }
  try {
    const res = await supplierDemandsApi.list({
      limit: limit.value,
      offset: offset.value,
      search: (q.value || '').trim() || undefined,
      status: status.value || undefined,
      department_id: department.value,
      without_statuses: ['pending', 'cancelled']
    })
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

async function canFinish(row: any) {

}
// finish: state
const finishingId = ref<number|null>(null)

// finish: visibility rule
function canFinishRow(row:any){
  const aOK = Array.isArray(row?.not_finished_products) && row.not_finished_products.length === 0
  const bOK = Array.isArray(row?.not_finished_offerings) && row.not_finished_offerings.length === 0
  // Ըստ պահանջի՝ միայն եթե երկուսն էլ դատարկ են. Լրացուցիչ՝ ստուգում ենք, որ հիմա ընթացակազմում է
  return aOK && bOK && String(row?.status) === 'in_progress'
}

// finish: action
async function finishRow(row:any){
  if (!confirm('Ավարտե՞լ պահանջագիրը')) return
  finishingId.value = row.id
  try {
    // 👇 հարմարեցրու քո API անունին, եթե տարբեր է
    await supplierDemandsApi.finish(row.id)
    // Optimistic UI
    row.status = 'finished'
  } catch (e:any) {
    // optional: ցուցադրել սխալ
    // toast.error(e?.response?.data?.message || 'Չհաջողվեց ավարտել պահանջագիրը')
  } finally {
    finishingId.value = null
  }
}

async function loadActor(){ try{ actor.value = await authApi.getActor() }catch{ actor.value = null } }

onMounted(async () => {
  await loadActor()
  await fetchRows(true);
  await fetchDepartments();
  setupInfiniteScroll();
});
onBeforeUnmount(() => {
  if (io) io.disconnect();
  io = null;
});
</script>