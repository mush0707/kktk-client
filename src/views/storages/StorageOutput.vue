<template>
  <div class="flex flex-col">
    <!-- Header + breadcrumb (քո պահեստային հեդերը պահեցի նույն ոճով) -->
    <div class="dark:border-gray-700 bg-white">
      <div class="flex gap-x-2 items-center p-4 border-b rounded-md border-gray-200 text-xl">
        <p>{{ storage?.address }}</p>
        <p class="text-sm">
          ({{ !storage?.cell ? (storage?.industrial ? $t('industrial') : $t('normal')) : $t('cell') }})
        </p>
      </div>
    </div>
    <nav class="flex bg-blue-50 py-2 items-center text-sm" aria-label="Breadcrumb">
      <ol class="inline-flex items-center">
        <li>
          <router-link to="/storages" class="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-slate-100">
            <span class="underline-offset-2 hover:underline">{{ $t('storages') }}</span>
          </router-link>
        </li>
        <li aria-hidden="true" class="px-1">
          <svg class="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
            <path d="M7.05 3.55a1 1 0 0 1 1.4 0l4.5 4.5a1 1 0 0 1 0 1.4l-4.5 4.5a1 1 0 0 1-1.4-1.4L10.79 10 7.05 6.26a1 1 0 0 1 0-1.41z"/>
          </svg>
        </li>
        <li>
          <router-link :to="`/storages/${storage?.id}`"
                       class="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-slate-100">
            <span class="underline-offset-2 hover:underline">{{ storage?.address }}</span>
          </router-link>
        </li>
        <li aria-hidden="true" class="px-1">
          <svg class="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
            <path d="M7.05 3.55a1 1 0 0 1 1.4 0l4.5 4.5a1 1 0 0 1 0 1.4l-4.5 4.5a1 1 0 0 1-1.4-1.4L10.79 10 7.05 6.26a1 1 0 0 1 0-1.41z"/>
          </svg>
        </li>
        <li>
          <p class="inline-flex items-center gap-1 rounded-md px-2 py-1">
            <span class="underline-offset-2 hover:underline">Ելքերի մատյան</span>
          </p>
        </li>
      </ol>
    </nav>

    <!-- Filters -->
    <div class="flex flex-col gap-3 px-4 py-4">
      <div class="grid md:grid-cols-4 gap-2">
        <input v-model="search" class="border border-gray-300 rounded-xl px-3 py-2 w-full" placeholder="ID / Ապրանք"
               @input="debouncedReload"/>
        <select v-model="status" class="border border-gray-300 rounded-xl px-3 py-2 w-full" @change="reloadFromStart">
          <option value="">Կարգավիճակ՝ բոլորը</option>
          <option value="pending">Սպասման մեջ</option>
          <option value="approved">Հաստատված</option>
          <option value="rejected">Մերժված</option>
        </select>
        <select v-model="block" class="border border-gray-300 rounded-xl px-3 py-2 w-full" @change="reloadFromStart">
          <option value="">Բլոկ՝ բոլորը</option>
          <option value="demand">Պահանջագիր</option>
          <option value="sale">Վաճառք</option>
        </select>
        <div class="grid grid-cols-2 gap-2">
          <input type="date" v-model="date_from" class="border border-gray-300 rounded-xl px-3 py-2 w-full" @change="reloadFromStart"/>
          <input type="date" v-model="date_to" class="border border-gray-300 rounded-xl px-3 py-2 w-full" @change="reloadFromStart"/>
        </div>
      </div>
      <div class="flex gap-2 justify-end">
        <button
            class="px-4 py-2 rounded-xl border border-gray-300 bg-gray-900 text-white"
            @click="applyFilters"
        >
          Կիրառել
        </button>
        <button
            class="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50"
            @click="clearFilters"
        >
          Մաքրել
        </button>
      </div>

      <!-- Table -->
      <div class="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table class="min-w-full text-sm">
          <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left">#</th>
            <th class="px-4 py-3 text-left">Բլոկ</th>
            <th class="px-4 py-3 text-left">Տեսակ</th>
            <th class="px-4 py-3 text-left">Կապ.</th>
<!--            <th class="px-4 py-3 text-left">Ստեղծել է</th>-->
<!--            <th class="px-4 py-3 text-left">Ապրանքների քանակ</th>-->
            <th class="px-4 py-3 text-left">Ժամանակ</th>
            <th class="px-4 py-3 text-left">Կարգավիճակ</th>
            <th class="px-4 py-3 text-left"></th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="r in rows" :key="r.id" class="border-t">
            <td class="px-4 py-3">{{ r.id }}</td>
            <td class="px-4 py-3">{{ blockLabel(r.block) }}</td>
            <td class="px-4 py-3">{{ typeLabel(r.type) }}</td>
            <td class="px-4 py-3">
              <span v-if="r.block==='demand' && r.demand_id">Պահանջագիր № {{ r.demand_id }}</span>
              <span v-else>—</span>
              <div class="text-xs text-gray-500 mt-1">
                <template v-if="r.demand?.department?.name"><b>Ստորաբաժանում․</b> {{ r.demand.department.name }}
                </template>
                <template v-else-if="r.demand?.from_storage?.address"><b>Սկզբն․ պահեստ․</b>
                  {{ r.demand.from_storage.address }}
                </template>
              </div>
            </td>
<!--            <td class="px-4 py-3">{{ r.user?.name || r.user_id }}</td>-->
<!--            <td class="px-4 py-3">{{ r.items_qty_sum ?? r.items_count }}</td>-->
            <td class="px-4 py-3">
              <div>
                <b>Ստեղծ. </b>
                <span :title="r.created_at">{{ formatDateTime(r.created_at) }}</span>
                <span class="text-xs text-gray-400 ml-1">({{ fromNow(r.created_at) }})</span>
              </div>
              <div class="mt-0.5">
                <b>Թարմ. </b>
                <span :title="r.updated_at">{{ formatDateTime(r.updated_at) }}</span>
                <span class="text-xs text-gray-400 ml-1">({{ fromNow(r.updated_at) }})</span>
              </div>
            </td>
            <td class="px-4 py-3">
              <span class="px-2 py-0.5 rounded text-xs" :class="statusClass(r.status)">{{
                  statusLabel(r.status)
                }}</span>
            </td>
            <td class="px-4 py-3">
              <button class="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                      @click="openView(r)">Դիտել
              </button>
            </td>
          </tr>
          <tr v-if="!loading && rows.length===0">
            <td colspan="8" class="px-4 py-8 text-center text-gray-500">Տվյալներ չկան</td>
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
  </div>

  <!-- View modal -->
  <div v-if="view.open" class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
    <div class="bg-white w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden">
      <div class="px-4 py-3 border-b flex items-center justify-between">
        <div class="font-semibold">
          Ելք № {{ view.data?.id }}
          <span class="ml-2 text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700">{{
              statusLabel(view.data?.status)
            }}</span>
        </div>
        <button class="p-2 hover:bg-gray-100 rounded" @click="closeView">✕</button>
      </div>

      <div class="p-4 space-y-3">
        <div class="text-sm text-gray-600 grid md:grid-cols-3 gap-3">
          <div><b>Բլոկ:</b> {{ blockLabel(view.data?.block) }}</div>
          <div><b>Տեսակ:</b> {{ typeLabel(view.data?.type) }}</div>
          <div v-if="view.data?.demand_id"><b>Կապ․ պահանջագիր №</b> {{ view.data?.demand_id }}</div>
          <div v-if="originName(view.data?.demand)" class="md:col-span-3">
            <b>Ստորաբաժանում / Սկզբնական պահեստ:</b> {{ originName(view.data?.demand) }}
          </div>
        </div>

        <div class="border rounded-xl overflow-hidden">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-50">
            <tr>
              <th class="px-3 py-2 text-left">Ապրանք</th>
              <th class="px-3 py-2 text-right">Քանակ</th>
              <th class="px-3 py-2 text-right">Չափ</th>
              <th class="px-3 py-2 text-center">Կարգավիճակ</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="it in (view.data?.products||[])" :key="it.id" class="border-t">
              <td class="px-3 py-2">
                <div class="font-medium">{{ it.storage_product?.product?.name || it.storage_product_id }}</div>
                <div v-if="(it.storage_product?.product?.characteristics||[]).length" class="mt-1 flex flex-wrap gap-1">
                  <span v-for="c in it.storage_product.product.characteristics" :key="c.id||c.name"
                        class="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-700">{{ c.name }}</span>
                </div>
              </td>
              <td class="px-3 py-2 text-right tabular-nums">{{ fmt(it.qty) }}</td>
              <td class="px-3 py-2 text-right">{{ unitShort(it.storage_product?.measure) }}</td>
              <td class="px-3 py-2 text-center">
                <span :class="itemStatusPill(it.status)"
                      class="px-2 py-0.5 rounded text-xs">{{ itemStatusLabel(it.status) }}</span>
              </td>
            </tr>
            <tr v-if="(view.data?.products||[]).length===0">
              <td colspan="4" class="px-3 py-6 text-center text-gray-500">Տվյալներ չկան</td>
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
import {ref, computed, onMounted, onBeforeUnmount} from 'vue'
import {useRoute} from 'vue-router'
import {mainApi, warehouseOutputsApi as api} from '@/api.js'
import {formatDateTime, fromNow} from '@/utils/dateFormat'

const route = useRoute()
const storageId = computed(() => Number(route.params.id))
const storage = ref<any>(null)

const rows = ref<any[]>([])
const loading = ref(false)
const limit = ref(50)
const offset = ref(0)
const endReached = ref(false)

const search = ref('')
const status = ref('')
const block = ref('')
const date_from = ref<string | undefined>(undefined)
const date_to = ref<string | undefined>(undefined)

function fmt(n: any) {
  return Number(n || 0).toLocaleString(undefined, {maximumFractionDigits: 6})
}

function unitShort(m: any) {
  const k = String(m || '').toLowerCase();
  return ({
    kg: 'կգ',
    g: 'գ',
    tonn: 'տ',
    t: 'տ',
    l: 'լ',
    ml: 'մլ',
    m3: 'մ³',
    m: 'մ',
    cm: 'սմ',
    mm: 'մմ',
    piece: 'հատ',
    pcs: 'հատ'
  })[k] || ''
}

function statusLabel(s: string) {
  return ({pending: 'Սպասման մեջ', approved: 'Հաստատված', rejected: 'Մերժված'} as any)[s] || s
}

function statusClass(s: string) {
  return ({
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-rose-100 text-rose-700'
  } as any)[s] || 'bg-slate-100 text-slate-700'
}

function blockLabel(s?: string) {
  return s === 'demand' ? 'Պահանջագիր' : (s === 'sale' ? 'Վաճառք' : '—')
}

function typeLabel(s?: string) {
  return s === 'immediately' ? 'Անմիջապես' : (s === 'at_the_chosen_period' ? 'Տրված միջակայքով' : '—')
}
function applyFilters() {
  reloadFromStart();               // արդեն υπάρող ֆունկցիան
}

function clearFilters() {
  search.value = '';
  status.value = '';
  block.value = '';
  date_from.value = undefined as any; // կամ '' եթե նախընտրում ես
  date_to.value   = undefined as any;
  reloadFromStart();
}
function originName(d: any) {
  if (!d) return '—'
  if (d?.department?.name) return d.department.name
  if (d?.from_storage?.address) return d.from_storage.address
  return d?.department_name || d?.from_storage_address || '—'
}

async function loadStorage() {
  storage.value = await mainApi.getStorageById(storageId.value)
}

async function fetchPage() {
  if (loading.value || endReached.value) return
  loading.value = true
  try {
    const page = await api.list(storageId.value, {
      limit: limit.value, offset: offset.value,
      search: (search.value || '').trim() || undefined,
      status: status.value || undefined,
      block: block.value || undefined,
      date_from: date_from.value || undefined,
      date_to: date_to.value || undefined,
    })
    const list = Array.isArray(page) ? page : (page?.data ?? page?.rows ?? [])
    rows.value.push(...list)
    offset.value += list.length
    if (list.length < limit.value) endReached.value = true
  } finally {
    loading.value = false
  }
}

function reloadFromStart() {
  endReached.value = false;
  offset.value = 0;
  rows.value = [];
  fetchPage()
}

const debouncedReload = (() => {
  let t: any = null;
  return () => {
    clearTimeout(t);
    t = setTimeout(reloadFromStart, 300)
  }
})()

const sentinel = ref<HTMLElement | null>(null)
let io: IntersectionObserver | null = null

function startIO() {
  if (!sentinel.value) return;
  io = new IntersectionObserver((e) => {
    if (e[0].isIntersecting) fetchPage()
  });
  io.observe(sentinel.value)
}

function stopIO() {
  if (io && sentinel.value) io.unobserve(sentinel.value);
  io = null
}

const view = ref<{ open: boolean, data: any | null }>({open: false, data: null})

async function openView(row: any) {
  view.value.open = true;
  view.value.data = await api.get(storageId.value, row.id)
}

function closeView() {
  view.value.open = false;
  view.value.data = null
}

function itemStatusLabel(s?: string) {
  const v = String(s || '').toLowerCase();
  if (v === 'approved') return 'Հաստատված';
  if (v === 'rejected') return 'Մերժված';
  if (v === 'pending') return 'Սպասման մեջ';
  return s || '—'
}

function itemStatusPill(s?: string) {
  const v = String(s || '').toLowerCase();
  return v === 'approved' ? 'bg-emerald-100 text-emerald-700' : (v === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700')
}

onMounted(async () => {
  await loadStorage();
  reloadFromStart();
  startIO()
})
onBeforeUnmount(stopIO)
</script>
