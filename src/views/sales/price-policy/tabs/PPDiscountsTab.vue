<template>
  <div class="space-y-4">
    <!-- Header actions -->
    <div class="flex items-center justify-between">
      <button
          class="px-4 py-2 text-sm rounded-xl bg-blue-600 text-white"
          @click="openCreateSetting"
      >
        Ստեղծել զեղչի կարգավորում
      </button>
    </div>

    <!-- Filters -->
    <div class="flex flex-col gap-y-2 bg-white">
      <p>Ֆիլտր</p>
      <div class="grid md:grid-cols-5 gap-3 text-sm">
        <input
            v-model="filters.search"
            placeholder="Փնտրել"
            class="border border-gray-300 rounded-xl px-3 py-2 md:col-span-2"
        />
        <input
            v-model="filters.from_date"
            type="date"
            class="border border-gray-300 rounded-xl px-3 py-2"
        />
        <input
            v-model="filters.to_date"
            type="date"
            class="border border-gray-300 rounded-xl px-3 py-2"
        />
        <select v-model="statusPick" class="border border-gray-300 rounded-xl px-3 py-2">
          <option :value="''">Բոլոր կարգավիճակները</option>
          <option v-for="s in statuses" :key="s" :value="s">{{ statusMeta(s).label }}</option>
        </select>
      </div>
    </div>

    <!-- Settings list -->
    <div class="bg-white rounded-2xl border border-gray-300">
      <div class="p-4">Զեղչերի կարգավորումների ցանկ</div>

      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-slate-50 text-left">
          <tr>
            <th class="px-3 py-2">Զեղչ</th>
            <th class="px-3 py-2">Տոկոս</th>
            <th class="px-3 py-2">Ժամանակահատված</th>
            <th class="px-3 py-2">Կարգավիճակ</th>
            <th class="px-3 py-2 text-right">Գործողություններ</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="it in rows" :key="it.id" class="border-t align-top">
            <td class="px-3 py-2">
              <div class="font-medium">{{ it.discount?.name || '—' }}</div>
            </td>
            <td class="px-3 py-2">
              {{ it.discount?.percentage ?? '—' }}%
            </td>
            <td class="px-3 py-2">
              <div>
                <span class="text-xs text-slate-500">Սկիզբ:</span>
                <span>{{ it.from_date || '—' }}</span>
              </div>
              <div>
                <span class="text-xs text-slate-500">Ավարտ:</span>
                <span>{{ it.to_date || '—' }}</span>
              </div>

              <button v-if="it.status !== 'cancelled' && it.status !== 'archived'"
                  class="mt-2 px-2.5 py-1 text-xs rounded-md border hover:bg-slate-50"
                  @click="openEditPeriod(it)"
              >
                Թարմացնել ժամանակահատվածը
              </button>
            </td>
            <td class="px-3 py-2">
                <span
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                    :class="statusMeta(it.status).classes"
                >
                  {{ statusMeta(it.status).label }}
                </span>
            </td>
            <td class="px-3 py-2">
              <div class="flex flex-wrap gap-2 justify-end">
                <button
                    class="px-3 py-1 text-xs font-medium rounded-md border hover:bg-slate-50"
                    @click="openProducts(it)"
                >
                  Տեսնել ապրանքները
                </button>

                <!-- operations (sequence per your rules) -->
                <button
                    v-if="isLeader && it.status==='pending'"
                    :disabled="busyId===it.id"
                    class="px-3 py-1 text-xs font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:opacity-50"
                    @click="doSettingAction('activate', it)"
                >Ակտիվացնել</button>

                <button
                    v-if="(isLeader || isStaff) && it.status==='pending'"
                    :disabled="busyId===it.id"
                    class="px-3 py-1 text-xs font-medium text-white bg-rose-600 rounded-md hover:bg-rose-700 disabled:opacity-50"
                    @click="doSettingAction('cancel', it)"
                >Չեղարկել</button>

                <button
                    v-if="isLeader && it.status==='active'"
                    :disabled="busyId===it.id"
                    class="px-3 py-1 text-xs font-medium text-white bg-slate-700 rounded-md hover:bg-slate-800 disabled:opacity-50"
                    @click="doSettingAction('archive', it)"
                >Արխիվացնել</button>
              </div>
            </td>
          </tr>
          </tbody>
        </table>
      </div>

      <div ref="sentinel" class="h-8"></div>
      <div v-if="loading" class="p-4 text-center text-slate-500">Բեռնվում է…</div>
      <div v-if="!loading && !rows.length" class="p-6 text-center text-slate-400">Տվյալներ չկան</div>
    </div>

    <!-- Modals -->
    <AttachDiscountRuleModal v-model:open="createOpen" @done="reload" />
    <SettingProductsModal
        v-model:open="productsOpen"
        :setting-id="activeSettingId"
        @done="reload"
    />
    <UpdateSettingPeriodModal
        v-model:open="editPeriodOpen"
        :setting-id="editPeriodItem?.id || null"
        :from-date-init="editPeriodItem?.from_date || ''"
        :to-date-init="editPeriodItem?.to_date || ''"
        @done="reload"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { sales, authApi } from '@/api'
import AttachDiscountRuleModal from '@/views/sales/price-policy/modals/AttachDiscountRuleModal.vue'
import SettingProductsModal from '@/views/sales/price-policy/modals/SettingProductsModal.vue'
import UpdateSettingPeriodModal from '@/views/sales/price-policy/modals/UpdateSettingPeriodModal.vue'

const editPeriodOpen = ref(false)
const editPeriodItem = ref<any|null>(null)

function openEditPeriod(row:any){
  editPeriodItem.value = row
  editPeriodOpen.value = true
}
type Status = 'pending'|'active'|'cancelled'|'archived'

/* Role */
type ActorKind = 'department_leader' | 'department_staff'
const actorKind = ref<ActorKind | null>(null)
const isLeader  = computed(() => actorKind.value === 'department_leader')
const isStaff   = computed(() => actorKind.value === 'department_staff')
async function loadActor(){
  try { const data = await authApi.getActor(); actorKind.value = data?.kind || null } catch { actorKind.value = null }
}

/* Filters */
const filters = reactive({ search: '', from_date: '', to_date: '' })
const statuses: Status[] = ['pending','active','cancelled','archived']
const statusPick = ref<string>('')

/* Pagination */
const limit = 20
let offset  = 0
const rows  = ref<any[]>([])
const loading = ref(false)

/* Status meta */
function statusMeta(s: Status){
  switch(s){
    case 'active':    return {label:'Ակտիվ',       classes:'bg-green-100 text-green-700 ring-1 ring-green-200'}
    case 'pending':   return {label:'Սպասման մեջ', classes:'bg-amber-100 text-amber-800 ring-1 ring-amber-200'}
    case 'archived':  return {label:'Արխիվացված',  classes:'bg-slate-100 text-slate-700 ring-1 ring-slate-200'}
    case 'cancelled': return {label:'Չեղարկված',   classes:'bg-rose-100 text-rose-700 ring-1 ring-rose-200'}
    default:          return {label:s,             classes:'bg-slate-100 text-slate-700 ring-1 ring-slate-200'}
  }
}

/* Query + fetch */
function makeQuery(reset=false){
  const status = statusPick.value ? [statusPick.value as Status] : null
  return {
    limit,
    offset: reset ? 0 : offset,
    search: filters.search || null,
    from_date: filters.from_date || null,
    to_date: filters.to_date || null,
    status
  }
}
async function loadMore(){
  if (loading.value) return
  loading.value = true
  try{
    // GET /sales/discounts/settings
    const { data } = await sales.discounts.settings.list(makeQuery())
    const arr = Array.isArray(data?.data) ? data.data : []
    if (offset === 0) rows.value = arr
    else rows.value.push(...arr)
    if (arr.length === limit) offset += limit
  } finally { loading.value = false }
}
function reload(){ offset = 0; loadMore() }

/* Infinite scroll */
const sentinel = ref<HTMLElement|null>(null)
let io: IntersectionObserver|null = null
onMounted(() => {
  loadActor()
  reload()
  io = new IntersectionObserver((es)=>{ if (es.some(e=>e.isIntersecting)) loadMore() })
  if (sentinel.value) io.observe(sentinel.value)
})

/* Debounce filters */
let ft: number|undefined
watch(() => [filters.search, filters.from_date, filters.to_date, statusPick.value], () => {
  if (ft) window.clearTimeout(ft)
  ft = window.setTimeout(() => reload(), 300)
})

/* Create modal */
const createOpen = ref(false)
function openCreateSetting(){ createOpen.value = true }

/* Row ops */
const busyId = ref<number|null>(null)
async function doSettingAction(op:'activate'|'cancel'|'archive', row:any){
  try{
    busyId.value = row.id
    if (op==='activate') await sales.discounts.settings.activate(row.id)
    if (op==='cancel')   await sales.discounts.settings.cancel(row.id)
    if (op==='archive')  await sales.discounts.settings.archive(row.id)
    reload()
  } finally { busyId.value = null }
}

/* Products modal */
const productsOpen    = ref(false)
const activeSettingId = ref<number|null>(null)
function openProducts(row:any){
  activeSettingId.value = row.id
  productsOpen.value = true
}
</script>
