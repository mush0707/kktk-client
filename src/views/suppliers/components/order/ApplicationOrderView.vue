<template>
  <div class="flex flex-col gap-4 px-4 py-4">
    <!-- Header -->
    <div class="bg-white border border-gray-300 rounded-2xl overflow-hidden">
      <div class="p-4 flex items-center justify-between border-b">
        <div class="flex items-center gap-3">
          <div class="text-lg font-semibold">
            Պատվեր № {{ order?.identification_number || order?.number || ('#' + id) }}
          </div>
          <span v-if="order" class="px-2 py-0.5 rounded text-xs" :class="statusClass(order.status)">
            {{ statusLabel(order.status) }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <RouterLink to="/suppliers/orders" class="px-3 py-2 rounded-xl border hover:bg-gray-50">Վերադառնալ
          </RouterLink>
        </div>
      </div>

      <div class="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div>
          <div class="text-slate-500">Մատակարար</div>
          <div class="font-medium">{{ order?.partner?.name || '—' }}</div>
        </div>
        <div>
          <div class="text-slate-500">Ստեղծող</div>
          <div class="font-medium">{{ order?.creator?.name || '—' }}</div>
        </div>
        <div>
          <div class="text-slate-500">Թարմացվել է</div>
          <div class="font-medium">
            <span :title="order?.updated_at">{{ formatDateTime(order?.updated_at) }}</span>
            <span class="text-xs text-gray-400 ml-2">({{ fromNow(order?.updated_at) }})</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Products -->
    <div class="bg-white border border-gray-300 rounded-2xl overflow-hidden">
      <div class="p-3 bg-gray-50 border-b text-sm font-medium">Ապրանքներ</div>
      <table class="min-w-full text-sm">
        <thead class="bg-gray-50">
        <tr>
          <th class="px-4 py-3 text-left">Անվանում</th>
          <th class="px-4 py-3 text-right w-[120px]">Քանակ</th>
          <th class="px-4 py-3 text-right w-[120px]">Չափ</th>
          <th class="px-4 py-3 text-left w-[140px]">Պարբերականություն</th>
          <th class="px-4 py-3 text-left w-[140px]">Կարգավիճակ</th>
          <th class="px-4 py-3 text-right w-[1%]"></th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="r in (order?.products || [])" :key="'p'+r.id" class="border-t">
          <td class="px-4 py-2">
            <div class="font-medium">{{ r.product?.name }}</div>
            <div class="text-xs text-slate-500">
              <span v-if="r.product?.type?.name">{{ r.product.type.name }}</span>
              <span v-if="r.product?.type?.group?.name" class="ml-1 text-slate-400">({{
                  r.product.type.group.name
                }})</span>
            </div>
          </td>
          <td class="px-4 py-2 text-right">{{ formatNumber(r.qty) }}</td>
          <td class="px-4 py-2 text-right">{{ $t(r.measure || 'piece') }}</td>
          <td class="px-4 py-2">
            <div
                v-if="isRecurringRow(r)"
                class="text-[11px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 inline-block"
            >
              {{ periodicityLabel(r) }}
            </div>
            <span v-else class="text-slate-500">Մեկ անգամով</span>
          </td>
          <td class="px-4 py-2">
              <span class="px-2 py-0.5 rounded text-xs" :class="rowStatusClass(r.status)">
                {{ rowStatusLabel(r.status) }}
              </span>
          </td>
          <td class="px-4 py-2 text-right">
            <button
                v-if="canCancelRow(r)"
                class="px-3 py-1 text-xs font-medium text-white bg-rose-600 rounded-md hover:bg-rose-700 disabled:opacity-50"
                :disabled="busyKey === 'p:'+r.id"
                @click="cancelProductRow(r)"
            >
              <span v-if="busyKey === 'p:'+r.id">Չեղարկում…</span>
              <span v-else>Չեղարկել</span>
            </button>
          </td>
        </tr>

        <tr v-if="!loading && (order?.products?.length || 0)===0">
          <td colspan="6" class="px-4 py-6 text-center text-slate-500">Ապրանքներ չկան</td>
        </tr>
        <tr v-if="loading && (order?.products?.length || 0)===0">
          <td colspan="6" class="px-4 py-6 text-center text-slate-500">Բեռնում…</td>
        </tr>
        </tbody>
      </table>
    </div>

    <!-- Offerings -->
    <div class="bg-white border border-gray-300 rounded-2xl overflow-hidden">
      <div class="p-3 bg-gray-50 border-b text-sm font-medium">Աշխատանք / Ծառայություն</div>
      <table class="min-w-full text-sm">
        <thead class="bg-gray-50">
        <tr>
          <th class="px-4 py-3 text-left w-[140px]">Տիպ</th>
          <th class="px-4 py-3 text-left">Անվանում</th>
          <th class="px-4 py-3 text-right w-[120px]">Քանակ</th>
          <th class="px-4 py-3 text-left w-[140px]">Պարբերականություն</th>
          <th class="px-4 py-3 text-left w-[140px]">Կարգավիճակ</th>
          <th class="px-4 py-3 text-right w-[1%]"></th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="r in (order?.offerings || [])" :key="'o'+r.id" class="border-t">
          <td class="px-4 py-2">
              <span class="px-2 py-0.5 rounded text-xs"
                    :class="r.offering?.block==='work' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'">
                {{ r.offering?.block === 'work' ? 'Աշխատանք' : 'Ծառայություն' }}
              </span>
          </td>
          <td class="px-4 py-2">
            <div class="font-medium">{{ r.offering?.name }}</div>
            <div class="text-xs text-slate-500" v-if="r.offering?.type?.name">Տեսակ՝ {{ r.offering.type.name }}</div>
          </td>
          <td class="px-4 py-2 text-right">{{ formatNumber(r.qty) }}</td>
          <td class="px-4 py-2">
            <div
                v-if="isRecurringRow(r)"
                class="text-[11px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 inline-block"
            >
              {{ periodicityLabel(r) }}
            </div>
            <span v-else class="text-slate-500">Մեկ անգամով</span>
          </td>
          <td class="px-4 py-2">
              <span class="px-2 py-0.5 rounded text-xs" :class="rowStatusClass(r.status)">
                {{ rowStatusLabel(r.status) }}
              </span>
          </td>
          <td class="px-4 py-2 text-right">
            <button
                v-if="canCancelRow(r)"
                class="px-3 py-1 text-xs font-medium text-white bg-rose-600 rounded-md hover:bg-rose-700 disabled:opacity-50"
                :disabled="busyKey === 'o:'+r.id"
                @click="cancelOfferingRow(r)"
            >
              <span v-if="busyKey === 'o:'+r.id">Չեղարկում…</span>
              <span v-else>Չեղարկել</span>
            </button>
          </td>
        </tr>

        <tr v-if="!loading && (order?.offerings?.length || 0)===0">
          <td colspan="6" class="px-4 py-6 text-center text-slate-500">Տողեր չկան</td>
        </tr>
        <tr v-if="loading && (order?.offerings?.length || 0)===0">
          <td colspan="6" class="px-4 py-6 text-center text-slate-500">Բեռնում…</td>
        </tr>
        </tbody>
      </table>
    </div>

    <p v-if="flash.msg" :class="flash.kind==='success' ? 'text-emerald-700' : 'text-rose-600'" class="text-sm px-1">
      {{ flash.msg }}
    </p>
  </div>
</template>

<script setup lang="ts">
import {ref, onMounted, computed} from 'vue'
import {useRoute, RouterLink} from 'vue-router'
import {ordersApi} from '@/api.js'
import {formatDateTime, fromNow} from '@/utils/dateFormat.js'

const route = useRoute()
const id = computed(() => Number(route.params.id || 0))

const order = ref<any>(null)
const loading = ref(false)
const busyKey = ref<string | null>(null)

const flash = ref({msg: '', kind: 'success' as 'success' | 'error'})
let ft: any = null

function setFlash(msg: string, kind: 'success' | 'error' = 'success') {
  flash.value = {msg, kind};
  if (ft) clearTimeout(ft);
  ft = setTimeout(() => flash.value.msg = '', 2500)
}

// labels/classes
const STATUS_LABELS: Record<string, string> = {
  draft: 'Սևագիր',
  pending: 'Սպասում է',
  processing: 'Ընթացքի մեջ',
  sent: 'Ուղարկված',
  done: 'Ավարտված',
  cancelled: 'Չեղարկված',
  send_to_purchasing: 'Ուղարկված գնումներ',
}

function statusLabel(s?: string) {
  return STATUS_LABELS[s || ''] || s || '—'
}

function isRecurringRow(r: any): boolean {
  const v = r?.recurring;
  return v === true || v === 1 || v === '1';
}

function periodicityLabel(r: any): string {
  const every = Number(r?.recurring_per_month_qty);
  const times = Number(r?.recurring_qty);
  const deadline = Number(r?.recurring_deadline_month_qty);
  const fmt = (n: number) => formatNumber(n, {maximumFractionDigits: 6});
  if (!(every > 0) || !(times > 0) || !(deadline > 0)) return '—';
  return `Յուրաքանչյուր ${fmt(every)} ամիսը ${fmt(times)} անգամ · մինչև ${fmt(deadline)} ամիս`;
}

function statusClass(s?: string) {
  if (s === 'done') return 'bg-emerald-100 text-emerald-700'
  if (s === 'processing') return 'bg-indigo-100 text-indigo-700'
  if (s === 'sent') return 'bg-blue-100 text-blue-700'
  if (s === 'send_to_purchasing') return 'bg-blue-100 text-blue-700'
  if (s === 'pending') return 'bg-amber-100 text-amber-700'
  if (s === 'cancelled') return 'bg-rose-100 text-rose-700'
  return 'bg-slate-100 text-slate-700'
}

const ROW_STATUS_LABELS: Record<string, string> = {
  active: 'Ակտիվ',
  pending: 'Սպասում է',
  cancelled: 'Չեղարկված',
  send_to_purchasing: 'Ուղարկված գնումներ',
}

function rowStatusLabel(s?: string) {
  return ROW_STATUS_LABELS[s || ''] || STATUS_LABELS[s || ''] || s || '—'
}

function rowStatusClass(s?: string) {
  if (s === 'cancelled') return 'bg-rose-100 text-rose-700'
  if (s === 'pending') return 'bg-amber-100 text-amber-700'
  if (s === 'send_to_purchasing') return 'bg-blue-100 text-blue-700'
  return 'bg-slate-100 text-slate-700'
}

// permissions: allow cancel when row not cancelled and order not finished
function canCancelRow(r: any) {
  const os = String(order.value?.status || '')
  const rs = String(r?.status || '')
  const orderLocked = ['done', 'cancelled'].includes(os)
  return !orderLocked && rs !== 'cancelled'
}

// fetch one
async function fetchOrder() {
  loading.value = true
  try {
    const res = await ordersApi.get(id.value)
    order.value = res?.data ?? res ?? null
  } finally {
    loading.value = false
  }
}

// cancel row actions
async function cancelProductRow(r: any) {
  if (!confirm('Չեղարկե՞լ ապրանքի տողը։')) return
  busyKey.value = 'p:' + r.id
  try {
    await ordersApi.deleteProductRow(id.value, r.id) // PATCH /orders/:id/products/:rowId/cancel
    r.status = 'cancelled'
    setFlash('Ապրանքի տողը չեղարկվեց', 'success')
  } catch (e: any) {
    setFlash(e?.response?.data?.message || 'Չհաջողվեց չեղարկել', 'error')
  } finally {
    busyKey.value = null
  }
}

async function cancelOfferingRow(r: any) {
  if (!confirm('Չեղարկե՞լ աշխատանք/ծառայություն տողը։')) return
  busyKey.value = 'o:' + r.id
  try {
    await ordersApi.deleteOfferingRow(id.value, r.id) // PATCH /orders/:id/offerings/:rowId/cancel
    r.status = 'cancelled'
    setFlash('Տողը չեղարկվեց', 'success')
  } catch (e: any) {
    setFlash(e?.response?.data?.message || 'Չհաջողվեց չեղարկել', 'error')
  } finally {
    busyKey.value = null
  }
}

// utils
function formatNumber(value: any, {maximumFractionDigits = 6, minimumFractionDigits = 0, locale = 'en-US'} = {}) {
  if (value === null || value === undefined || value === '') return ''
  const num = typeof value === 'string' ? Number(value) : value
  if (!isFinite(num)) return String(value)
  return new Intl.NumberFormat(locale, {maximumFractionDigits, minimumFractionDigits, useGrouping: false}).format(num)
}

onMounted(fetchOrder)
</script>
