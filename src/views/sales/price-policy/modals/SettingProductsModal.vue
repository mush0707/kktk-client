<template>
  <div v-if="open" class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/30" @click="close"></div>

    <aside class="absolute right-0 top-0 h-screen w-full max-w-4xl bg-white shadow-2xl flex flex-col">
      <div class="flex items-center justify-between px-5 py-3 border-b">
        <h3 class="text-lg font-semibold">Կարգավորման ապրանքներ</h3>
        <button class="px-3 py-1 rounded-xl border" @click="close">✕</button>
      </div>

      <!-- Filters -->
      <div class="px-5 py-3 border-b">
        <div class="grid md:grid-cols-5 gap-3 text-sm">
          <input
              v-model="filters.search"
              placeholder="Փնտրել"
              class="border border-gray-300 rounded-xl px-3 py-2 md:col-span-2"
          />
          <select v-model="statusPick" class="border border-gray-300 rounded-xl px-3 py-2">
            <option :value="''">Բոլոր կարգավիճակները</option>
            <option v-for="s in statuses" :key="s" :value="s">{{ statusMeta(s).label }}</option>
          </select>
        </div>
      </div>

      <!-- List -->
      <div class="flex-1 overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-slate-50 text-left">
          <tr>
            <th class="px-3 py-2">Ապրանք</th>
            <th class="px-3 py-2">Քանակ (մինչև)</th>
            <th class="px-3 py-2">Կարգավիճակ</th>
            <th class="px-3 py-2 text-right">Գործողություններ</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="it in rows" :key="it.product_id" class="border-t align-top">
            <td class="px-3 py-2">
              <div class="flex flex-col gap-y-1">
                <div class="font-medium">{{ it.product?.name || `#${it.product_id}` }}</div>
                <div
                    v-if="Array.isArray(it.product.characteristics) && it.product.characteristics.length"
                    class="hidden sm:flex flex-wrap gap-1"
                >
                <span
                    v-for="(c, i) in it.product.characteristics.slice(0, 3)"
                    :key="i"
                    class="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600"
                >
                  {{ c.name }}
                </span>
                </div>
              </div>
            </td>
            <td class="px-3 py-2">
              {{ it.until_qty }} {{ $t(it.measure ?? 'piece') }}
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
                    v-if="(isLeader || isStaff) && it.status==='pending'"
                    :disabled="busyId===it.product_id"
                    class="px-3 py-1 text-xs font-medium text-white bg-rose-600 rounded-md hover:bg-rose-700 disabled:opacity-50"
                    @click="doProductAction('cancel', it)"
                >Չեղարկել</button>

                <button
                    v-if="(isLeader || isStaff) && it.status==='active'"
                    :disabled="busyId===it.product_id"
                    class="px-3 py-1 text-xs font-medium text-white bg-rose-600 rounded-md hover:bg-rose-700 disabled:opacity-50"
                    @click="doProductAction('cancel', it)"
                >Չեղարկել</button>

                <button
                    v-if="isLeader && it.status==='active'"
                    :disabled="busyId===it.product_id"
                    class="px-3 py-1 text-xs font-medium text-white bg-slate-700 rounded-md hover:bg-slate-800 disabled:opacity-50"
                    @click="doProductAction('archive', it)"
                >Արխիվացնել</button>
              </div>
            </td>
          </tr>
          </tbody>
        </table>

        <div ref="sentinel" class="h-8"></div>
        <div v-if="loading" class="p-4 text-center text-slate-500">Բեռնվում է…</div>
        <div v-if="!loading && !rows.length" class="p-6 text-center text-slate-400">Տվյալներ չկան</div>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { sales, authApi } from '@/api'

const props = defineProps<{ open: boolean; settingId: number | null }>()
const emit  = defineEmits<{ (e:'update:open', v:boolean):void; (e:'done'):void }>()
function close(){ emit('update:open', false) }

/* Role */
type ActorKind = 'department_leader' | 'department_staff'
const actorKind = ref<ActorKind | null>(null)
const isLeader  = computed(() => actorKind.value === 'department_leader')
const isStaff   = computed(() => actorKind.value === 'department_staff')
async function loadActor(){ try { const data = await authApi.getActor(); actorKind.value = data?.kind || null } catch { actorKind.value = null } }

/* Filters */
type Status = 'pending'|'active'|'cancelled'|'archived'
const filters = reactive({ search: '' })
const statuses: Status[] = ['pending','active','cancelled','archived']
const statusPick = ref<string>('')

/* Pagination */
const limit = 20
let offset  = 0
const rows = ref<any[]>([])
const loading = ref(false)
const busyId = ref<number|null>(null)
const settingDiscount = ref<any|null>(null)

function statusMeta(s: Status){
  switch(s){
    case 'active':    return {label:'Ակտիվ',       classes:'bg-green-100 text-green-700 ring-1 ring-green-200'}
    case 'pending':   return {label:'Սպասման մեջ', classes:'bg-amber-100 text-amber-800 ring-1 ring-amber-200'}
    case 'archived':  return {label:'Արխիվացված',  classes:'bg-slate-100 text-slate-700 ring-1 ring-slate-200'}
    case 'cancelled': return {label:'Չեղարկված',   classes:'bg-rose-100 text-rose-700 ring-1 ring-rose-200'}
    default:          return {label:s,             classes:'bg-slate-100 text-slate-700 ring-1 ring-slate-200'}
  }
}

function makeQuery(reset=false){
  const status = statusPick.value ? [statusPick.value as Status] : null
  return { limit, offset: reset ? 0 : offset, search: filters.search || null, status }
}

async function loadMore(){
  if (loading.value || !props.settingId) return
  loading.value = true
  try{
    // GET /sales/discounts/settings/{id}/products
    const { data } = await sales.discounts.settings.products.list(props.settingId, makeQuery())
    const arr = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : [])
    if ('discount' in (data || {})) settingDiscount.value = (data as any).discount
    if (offset === 0) rows.value = arr
    else rows.value.push(...arr)
    if (arr.length === limit) offset += limit
  } finally { loading.value = false }
}
function reload(){ offset = 0; loadMore() }

async function doProductAction(op:'cancel'|'archive', row:any){
  if (!props.settingId) return
  try{
    busyId.value = row.product_id
    if (op === 'cancel')  await sales.discounts.settings.products.cancel(props.settingId, row.id)
    if (op === 'archive') await sales.discounts.settings.products.archive(props.settingId, row.id)
    reload()
  } finally { busyId.value = null }
}

/* Infinite scroll */
const sentinel = ref<HTMLElement|null>(null)
let io: IntersectionObserver|null = null
onMounted(() => {
  loadActor()
  io = new IntersectionObserver((es)=>{ if (es.some(e=>e.isIntersecting)) loadMore() })
  if (sentinel.value) io.observe(sentinel.value)
})

/* Open watcher */
watch(() => props.open, (isOpen) => {
  if (!isOpen) return
  offset = 0
  rows.value = []
  reload()
})

/* Debounced filters */
let ft: number|undefined
watch(() => [filters.search, statusPick.value], () => {
  if (ft) window.clearTimeout(ft)
  ft = window.setTimeout(() => reload(), 300)
})
</script>
