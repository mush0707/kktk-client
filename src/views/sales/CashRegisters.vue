<template>
  <div class="flex flex-col gap-y-2">
    <!-- Header + Breadcrumb -->
    <div class="flex flex-col">
      <div class="dark:border-gray-700 bg-white">
        <div class="flex flex-col gap-y-2 p-4 border-b rounded-md border-gray-200 text-xl">
          <p>Դրամարկղերի կառավարում</p>
          <div class="border border-gray-300"></div>
          <p class="text-sm">Վաճառքների ստորաբաժանում</p>
        </div>
      </div>
      <nav class="flex bg-blue-50 py-2 items-center text-sm" aria-label="Breadcrumb">
        <ol class="inline-flex items-center">
          <li>
            <router-link :to="'/sales'" class="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-slate-100">
              <span class="underline-offset-2 hover:underline">Վաճառքների ստորաբաժանում</span>
            </router-link>
          </li>
          <li aria-hidden="true" class="px-1">
            <svg class="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                  d="M7.05 3.55a1 1 0 0 1 1.4 0l4.5 4.5a1 1 0 0 1 0 1.4l-4.5 4.5a1 1 0 0 1-1.4-1.4L10.79 10 7.05 6.26a1 1 0 0 1 0-1.41z"/>
            </svg>
          </li>
          <li><p class="inline-flex items-center gap-1 rounded-md px-2 py-1">Դրամարկղերի կառավարում</p></li>
        </ol>
      </nav>
    </div>
    <div class="space-y-4 px-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <button class="px-4 py-2 rounded-xl bg-blue-600 text-white" @click="openCreate">
          Ավելացնել դրամարկղ +
        </button>
      </div>

      <!-- Filters -->
      <div class="bg-white space-y-3">
        <div class="grid md:grid-cols-5 gap-3 text-sm">
          <VueSelect
              v-model="storageId"
              :options="storageOpts"
              :loading="loading.storages"
              :is-searchable="true"
              :filterable="false"
              placeholder="Պահեստներ"
              :get-option-label="o => o.name"
              :get-option-value="o => o.id"
              @open="fetchStorages('')"
              @search="q => fetchStorages(q)"
          />
          <select v-model="statusPick" class="border border-gray-300 rounded-xl px-3 py-2">
            <option :value="''">Բոլոր կարգավիճակները</option>
            <option v-for="s in statuses" :key="s" :value="s">{{ statusMeta(s).label }}</option>
          </select>
        </div>
      </div>

      <!-- List -->
      <div class="bg-white rounded-2xl border border-gray-300 divide-y">
        <div class="p-4">Դրամարկղերի ցանկ</div>

        <div v-for="row in rows" :key="row.id" class="p-4">
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <div class="font-medium truncate">
                  № {{ row.number }}
                  <span class="text-slate-400">•</span>
                  <span class="text-slate-600">{{ row.storage?.address || ('storage#' + row.storage_id) }}</span>
                </div>
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                      :class="statusMeta(row.status).classes">
                {{ statusMeta(row.status).label }}
              </span>
              </div>

              <!-- printer badge(s) -->
              <div v-if="row.fiscal_printer" class="mt-1 flex flex-wrap gap-2 text-[11px]">
              <span class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5"
                    :class="row.fiscal_printer.tested ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'">
                Թեստավորված՝ {{ row.fiscal_printer.tested ? 'Այո' : 'Ոչ' }}
              </span>
                <span class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5"
                      :class="row.fiscal_printer.active ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'">
                Սարք՝ {{ row.fiscal_printer.active ? 'Ակտիվ' : 'Պասիվ' }}
              </span>
                <span class="text-slate-500">IP {{ row.fiscal_printer.ip_address }}:{{ row.fiscal_printer.port }}</span>
              </div>

              <!-- staff preview -->
              <div v-if="Array.isArray(row.staff) && row.staff.length" class="mt-1 flex flex-wrap gap-1">
              <span v-for="u in row.staff.slice(0, 5)" :key="u.id"
                    class="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600">
                {{ u.user.name || ('user#' + u.id) }}
              </span>
                <span v-if="row.staff.length > 5" class="text-[11px] text-slate-500">+{{ row.staff.length - 5 }}</span>
              </div>

              <div class="mt-1 text-[11px] text-slate-500">
                Ստեղծվել է՝ <span :title="row.created_at">{{ formatDateTime(row.created_at) }}</span>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex flex-wrap justify-end gap-2 shrink-0">
              <button class="px-3 py-1.5 text-xs font-medium border rounded-md" @click="openAttachStaff(row)">
                Կցել աշխատակիցներ
              </button>
              <button class="px-3 py-1.5 text-xs font-medium border rounded-md" @click="openPrinter(row)">
                ՀԴՄ կարգավորում
              </button>

              <button v-if="row.status!=='active'"
                      class="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-md"
                      @click="doActivate(row)">
                Ակտիվացնել
              </button>
              <button v-else class="px-3 py-1.5 text-xs font-medium text-white bg-amber-600 rounded-md"
                      @click="doOnHold(row)">
                Կասեցնել
              </button>
            </div>
          </div>
        </div>

        <div ref="sentinel" class="h-8"></div>
        <div v-if="loading.list" class="p-4 text-center text-slate-500">Բեռնվում է…</div>
        <div v-if="!loading.list && !rows.length" class="p-6 text-center text-slate-400">Տվյալներ չկան</div>
      </div>

      <!-- Modals -->
      <CashRegisterCreateModal v-model:open="createOpen" @saved="reload"/>
      <CashRegisterAttachStaffModal v-model:open="staffOpen" :cash-register-id="currentId" @saved="reload"/>
      <FiscalPrinterModal v-model:open="printerOpen" :cash-register="currentRow" @saved="reload"/>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive, onMounted, watch, computed} from 'vue'
import VueSelect from 'vue3-select-component'
import {sales, org} from '@/api'
import {formatDateTime} from '@/utils/dateFormat'
import CashRegisterCreateModal from '@/views/sales/modals/CashRegisterCreateModal.vue'
import CashRegisterAttachStaffModal from '@/views/sales/modals/CashRegisterAttachStaffModal.vue'
import FiscalPrinterModal from '@/views/sales/modals/FiscalPrinterModal.vue'

type CRStatus = 'pending' | 'active' | 'on_hold'
const statuses: CRStatus[] = ['pending', 'active', 'on_hold']
const statusMeta = (s: CRStatus | string) => ({
  pending: {label: 'Սպասման մեջ', classes: 'bg-amber-100 text-amber-800 ring-1 ring-amber-200'},
  active: {label: 'Ակտիվ', classes: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200'},
  on_hold: {label: 'Կասեցված', classes: 'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-200'},
}[s as CRStatus] || {label: String(s), classes: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200'})

/* filters */
const storageId = ref<string>('')  // storage filter
const storageOpts = ref<any[]>([])
const statusPick = ref<string>('')

const loading = reactive({list: false, storages: false})
const rows = ref<any[]>([])
const limit = 20
let offset = 0

function makeQuery(reset = false) {
  const params: any = {limit, offset: reset ? 0 : offset}
  if (storageId.value) params.storage_id = storageId.value
  if (statusPick.value) params.status = statusPick.value
  return params
}

async function loadMore() {
  if (loading.list) return
  loading.list = true
  try {
    const {data} = await sales.cashRegisters.list(makeQuery())
    const arr = Array.isArray(data?.data) ? data.data : []
    if (offset === 0) rows.value = arr
    else rows.value.push(...arr)
    if (arr.length === limit) offset += limit
  } finally {
    loading.list = false
  }
}

function reload() {
  offset = 0;
  loadMore()
}

/* storages select */
async function fetchStorages(q: string | null) {
  loading.storages = true
  try {
    const {data} = await org.storages.search({limit: 20, offset: 0, search: q && q.trim() !== '' ? q : null})
    const arr = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : [])
    storageOpts.value = arr.map((s: any) => ({id: String(s.id), name: String(s.address || ('storage#' + s.id))}))
  } finally {
    loading.storages = false
  }
}

const sentinel = ref<HTMLElement | null>(null)
let io: IntersectionObserver | null = null

onMounted(() => {
  reload()
  io = new IntersectionObserver(es => {
    if (es.some(e => e.isIntersecting)) loadMore()
  })
  if (sentinel.value) io.observe(sentinel.value)
})

let ft: number | undefined
watch(() => [storageId.value, statusPick.value], () => {
  if (ft) window.clearTimeout(ft)
  ft = window.setTimeout(() => reload(), 300)
})

/* actions */
async function doActivate(row: any) {
  await sales.cashRegisters.activate(row.id)
  reload()
}

async function doOnHold(row: any) {
  await sales.cashRegisters.onHold(row.id)
  reload()
}

/* modals state */
const createOpen = ref(false)
const staffOpen = ref(false)
const printerOpen = ref(false)
const currentId = ref<number | null>(null)
const currentRow = ref<any | null>(null)

function openCreate() {
  createOpen.value = true
}

function openAttachStaff(row: any) {
  currentId.value = row.id;
  staffOpen.value = true
}

function openPrinter(row: any) {
  currentRow.value = row;
  printerOpen.value = true
}
onMounted(() => {
  fetchStorages();
});
</script>
