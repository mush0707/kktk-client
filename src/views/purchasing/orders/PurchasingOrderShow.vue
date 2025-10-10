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
          <RouterLink to="/purchasing/orders" class="px-3 py-2 rounded-xl border hover:bg-gray-50">
            Վերադառնալ
          </RouterLink>
        </div>
      </div>

      <!-- Tabs bar -->
      <div class="p-2 border-b flex gap-2">
        <button
            class="px-3 py-2 rounded-xl text-sm"
            :class="tab==='stages' ? 'bg-slate-900 text-white' : 'hover:bg-gray-100'"
            @click="tab='stages'"
        >Հանձնման ընդունման փուլեր</button>

        <button
            class="px-3 py-2 rounded-xl text-sm"
            :class="tab==='selected' ? 'bg-slate-900 text-white' : 'hover:bg-gray-100'"
            @click="tab='selected'"
        >Ընտրված հայտեր</button>

        <button
            class="px-3 py-2 rounded-xl text-sm"
            :class="tab==='details' ? 'bg-slate-900 text-white' : 'hover:bg-gray-100'"
            @click="tab='details'"
        >Մանրամասներ</button>
      </div>

      <!-- Meta -->
      <div class="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div>
          <div class="text-slate-500">Գործընկեր</div>
          <div class="font-medium">{{ order?.partner_contract?.partner?.name || '—' }}</div>
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

    <!-- TAB: Stages (new logic: from order.stages) -->
    <div v-if="tab==='stages'" class="bg-white border border-gray-300 rounded-2xl overflow-hidden">
      <div class="p-3 bg-gray-50 border-b text-sm font-medium">Հանձնման ընդունման փուլեր</div>

      <table class="min-w-full text-sm">
        <thead class="bg-gray-50">
        <tr>
          <th class="px-4 py-3 text-left w-[80px]">ID</th>
          <th class="px-4 py-3 text-left">Փուլի անվանումը</th>
          <th class="px-4 py-3 text-left w-[260px]">Ժամանակահատված</th>
          <th class="px-4 py-3 text-left w-[160px]">Կարգավիճակ</th>
          <th class="px-4 py-3 text-left w-[200px]">Պարունակություն</th>
          <th class="px-4 py-3 text-right w-[1%]"></th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="s in stageRows" :key="s.id" class="border-t">
          <td class="px-4 py-2">{{ s.id }}</td>
          <td class="px-4 py-2 font-medium">{{ s.name || '—' }}</td>
          <td class="px-4 py-2">
            <div class="text-xs text-slate-700">
              <div>Սկիզբ՝ {{ s.active_date_start || '—' }}</div>
              <div>Ավարտ՝ {{ s.active_date_finished || '—' }}</div>
            </div>
          </td>
          <td class="px-4 py-2">
            <span class="px-2 py-0.5 rounded text-xs" :class="rowStatusClass(s.status)">
              {{ rowStatusLabel(s.status) }}
            </span>
          </td>
          <td class="px-4 py-2">
            <div class="flex items-center gap-2">
              <span class="text-xs px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                Ապրանք՝ {{ s.productsCount }}
              </span>
              <span class="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">
                Աշխ./Ծառ.՝ {{ s.offeringsCount }}
              </span>
            </div>
          </td>
          <td class="px-4 py-2 text-right">
            <button
                class="px-3 py-1 text-xs rounded-md border hover:bg-gray-50"
                @click="openStage(s.id)"
            >Դիտել</button>
          </td>
        </tr>

        <tr v-if="stageRows.length===0">
          <td colspan="6" class="px-4 py-6 text-center text-slate-500">Փուլեր չկան</td>
        </tr>
        </tbody>
      </table>
    </div>

    <!-- TAB: Selected Applications (stays the same idea) -->
    <div v-if="tab==='selected'" class="bg-white border border-gray-300 rounded-2xl overflow-hidden">
      <div class="p-3 bg-gray-50 border-b flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
        <div class="text-sm font-medium">Ընտրված հայտեր</div>
        <div class="flex flex-wrap items-center gap-2">
          <input
              v-model.trim="qApp"
              @input="debouncedFilter()"
              type="text"
              placeholder="Փնտրել ըստ հայտի համարի (APP-…)"
              class="px-3 py-2 border rounded-xl w-[240px] md:w-[320px]"
          />
          <select
              v-model="deptFilter"
              @change="applyFilter()"
              class="px-3 py-2 border rounded-xl"
          >
            <option :value="null">Բոլոր բաժինները</option>
            <option v-for="d in departments" :key="d.id" :value="d.id">
              {{ d.name }}
            </option>
          </select>
        </div>
      </div>

      <table class="min-w-full text-sm">
        <thead class="bg-gray-50">
        <tr>
          <th class="px-4 py-3 text-left w-[120px]">Տիպ</th>
          <th class="px-4 py-3 text-left w-[180px]">Հայտի №</th>
          <th class="px-4 py-3 text-left">Անվանում</th>
          <th class="px-4 py-3 text-right w-[140px]">Քանակ</th>
          <th class="px-4 py-3 text-left w-[160px]">Չափ</th>
          <th class="px-4 py-3 text-left w-[220px]">Բաժին</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="it in selectedApplicationsFiltered" :key="it._key" class="border-t">
          <td class="px-4 py-2">
            <span
                class="px-2 py-0.5 rounded text-xs"
                :class="it._kind==='product' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'"
            >{{ it._kind==='product' ? 'Ապրանք' : 'Աշխ./Ծառ.' }}</span>
          </td>
          <td class="px-4 py-2 font-medium">
            {{ it.application_identification_number || '—' }}
          </td>
          <td class="px-4 py-2">
            {{ it.name || '—' }}
          </td>
          <td class="px-4 py-2 text-right">
            {{ formatNumber(it.qty) }}
          </td>
          <td class="px-4 py-2">
            <span v-if="it.measure">{{ it.measure }}</span>
            <span v-else class="text-slate-400">—</span>
          </td>
          <td class="px-4 py-2">
            {{ it.department_name || ('ID ' + (it.department_id ?? '—')) }}
          </td>
        </tr>

        <tr v-if="selectedApplicationsFiltered.length===0">
          <td colspan="6" class="px-4 py-6 text-center text-slate-500">Տվյալներ չկան</td>
        </tr>
        </tbody>
      </table>
    </div>

    <!-- TAB: Details (your original two tables) -->
    <div v-if="tab==='details'">
      <!-- Products -->
      <div class="bg-white border border-gray-300 rounded-2xl overflow-hidden mb-4">
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
                <span v-if="r.product?.type?.group?.name" class="ml-1 text-slate-400">
                  ({{ r.product.type.group.name }})
                </span>
              </div>
            </td>
            <td class="px-4 py-2 text-right">{{ formatNumber(r.qty) }}</td>
            <td class="px-4 py-2 text-right">{{ $t ? $t(r.measure || 'piece') : (r.measure || '—') }}</td>
            <td class="px-4 py-2">
              <div v-if="isRecurringRow(r)" class="text-[11px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 inline-block">
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
              <!-- place for actions if needed -->
            </td>
          </tr>
          <tr v-if="(order?.products?.length || 0)===0">
            <td colspan="6" class="px-4 py-6 text-center text-slate-500">Ապրանքներ չկան</td>
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
              <div v-if="isRecurringRow(r)" class="text-[11px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 inline-block">
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
            </td>
          </tr>

          <tr v-if="(order?.offerings?.length || 0)===0">
            <td colspan="6" class="px-4 py-6 text-center text-slate-500">Տողեր չկան</td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Flash -->
    <p v-if="flash.msg" :class="flash.kind==='success' ? 'text-emerald-700' : 'text-rose-600'" class="text-sm px-1">
      {{ flash.msg }}
    </p>

    <!-- Stage details modal -->
    <div v-if="stageModal.open" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/40" @click="closeStage()"></div>
      <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                  w-full max-w-3xl bg-white rounded-2xl shadow-xl overflow-hidden">
        <div class="flex items-center justify-between px-5 py-4 border-b">
          <h3 class="text-lg font-semibold">
            {{ selectedStage?.name || 'Փուլ' }} ·
            <span class="text-sm text-slate-500">ID {{ selectedStage?.id }}</span>
          </h3>
          <button class="p-2 rounded-lg hover:bg-gray-100" @click="closeStage" aria-label="Close">✕</button>
        </div>

        <div class="p-5 space-y-6">
          <div class="text-sm text-slate-700">
            <div>Սկիզբ՝ {{ selectedStage?.active_date_start || '—' }}</div>
            <div>Ավարտ՝ {{ selectedStage?.active_date_finished || '—' }}</div>
            <div class="mt-1">
              Կարգավիճակ՝
              <span class="px-2 py-0.5 rounded text-xs" :class="rowStatusClass(selectedStage?.status)">
                {{ rowStatusLabel(selectedStage?.status) }}
              </span>
            </div>
          </div>

          <!-- Products in stage -->
          <div>
            <div class="p-2 bg-gray-50 border-b text-sm font-medium rounded-t-lg">Ապրանքներ ({{ selectedStage?.products?.length || 0 }})</div>
            <table class="min-w-full text-sm">
              <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left">Անվանում</th>
                <th class="px-4 py-3 text-left w-[120px]">Քանակ</th>
                <th class="px-4 py-3 text-left w-[120px]">Ընդհանուր արժեքի՝ Տոկոս</th>
                <th class="px-4 py-3 text-left w-[160px]">Ակտիվություն</th>
                <th class="px-4 py-3 text-left w-[140px]">Կարգավիճակ</th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="p in (selectedStage?.products || [])" :key="'ps'+p.id" class="border-t">
                <td class="px-4 py-2 font-medium">
                  <div class="flex items-center justify-between">
                    <div class="font-medium truncate">{{ p.application_order_product.product.name }}</div>
                  </div>
                  <div class="mt-1 flex flex-wrap items-center gap-1">
                  <span v-if="p.application_order_product.product.type?.group?.name || p.group_name"
                        class="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {{ p.application_order_product.product.type?.group?.name || p.group_name }}
                  </span>
                    <span v-if="p.application_order_product.product.type?.name || p.type_name"
                          class="text-[11px] px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                    {{ p.application_order_product.product.type?.name || p.type_name }}
                  </span>
                    <span v-if="p.application_order_product.product.measure_type" class="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
                    {{ $t(p.application_order_product.product.measure_type ?? 'piece') }}
                  </span>
                  </div>
                  <div v-if="Array.isArray(p.application_order_product.product.characteristics) && p.application_order_product.product.characteristics.length" class="mt-1 flex flex-wrap gap-1">
                  <span
                      v-for="c in p.application_order_product.product.characteristics"
                      :key="c.id||c.name"
                      class="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-700"
                  >{{ c.name }}</span>
                  </div>
                </td>
                <td class="px-4 py-2">{{ formatNumber(p.application_order_product.qty) }} {{ $t(p.application_order_product.measure) }}</td>
                <td class="px-4 py-2">{{ p.percentage ?? '—' }}<span v-if="p.percentage!=null">%</span></td>
                <td class="px-4 py-2 text-xs">
                  <div>Սկիզբ՝ {{ p.active_date_start || '—' }}</div>
                  <div>Ավարտ՝ {{ p.active_date_finished || '—' }}</div>
                </td>
                <td class="px-4 py-2">
                  <span class="px-2 py-0.5 rounded text-xs" :class="rowStatusClass(p.status)">
                    {{ rowStatusLabel(p.status) }}
                  </span>
                </td>
              </tr>
              <tr v-if="(selectedStage?.products?.length || 0)===0">
                <td colspan="4" class="px-4 py-4 text-center text-slate-500">Ապրանքներ չկան</td>
              </tr>
              </tbody>
            </table>
          </div>

          <!-- Offerings in stage -->
          <div>
            <div class="p-2 bg-gray-50 border-b text-sm font-medium rounded-t-lg">Աշխատանք / Ծառայություն ({{ selectedStage?.offerings?.length || 0 }})</div>
            <table class="min-w-full text-sm">
              <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left">Անվանում</th>
                <th class="px-4 py-3 text-left w-[120px]">Քանակ</th>
                <th class="px-4 py-3 text-left w-[120px]">Ընդհանուր արժեքի՝ Տոկոս</th>
                <th class="px-4 py-3 text-left w-[160px]">Ակտիվություն</th>
                <th class="px-4 py-3 text-left w-[140px]">Կարգավիճակ</th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="o in (selectedStage?.offerings || [])" :key="'os'+o.id" class="border-t">
                <td class="px-4 py-2 font-medium">{{ o.application_order_offering.offering.name || '—' }}</td>
                <td class="px-4 py-2 font-medium">{{ formatNumber(o.application_order_offering.qty) }}</td>
                <td class="px-4 py-2">{{ o.percentage ?? '—' }}<span v-if="o.percentage!=null">%</span></td>
                <td class="px-4 py-2 text-xs">
                  <div>Սկիզբ՝ {{ o.active_date_start || '—' }}</div>
                  <div>Ավարտ՝ {{ o.active_date_finished || '—' }}</div>
                </td>
                <td class="px-4 py-2">
                  <span class="px-2 py-0.5 rounded text-xs" :class="rowStatusClass(o.status)">
                    {{ rowStatusLabel(o.status) }}
                  </span>
                </td>
              </tr>
              <tr v-if="(selectedStage?.offerings?.length || 0)===0">
                <td colspan="4" class="px-4 py-4 text-center text-slate-500">Տողեր չկան</td>
              </tr>
              </tbody>
            </table>
          </div>
        </div> <!-- /p-5 -->
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import {ordersApi, purchasingOrdersApi} from '@/api.js'
import { formatDateTime, fromNow } from '@/utils/dateFormat.js'

/* route & state */
const route = useRoute()
const id = computed(() => Number(route.params.id || 0))

const order = ref<any>(null)
const loading = ref(false)
const busyKey = ref<string | null>(null)

const flash = ref({ msg: '', kind: 'success' as 'success' | 'error' })
let ft: any = null
function setFlash(msg: string, kind: 'success' | 'error' = 'success') {
  flash.value = { msg, kind }
  if (ft) clearTimeout(ft)
  ft = setTimeout(() => (flash.value.msg = ''), 2500)
}

/* labels/classes */
const STATUS_LABELS: Record<string, string> = {
  draft: 'Սևագիր',
  pending: 'Սպասում է',
  processing: 'Ընթացքի մեջ',
  sent: 'Ուղարկված',
  done: 'Ավարտված',
  cancelled: 'Չեղարկված',
  active: 'Ակտիվ',
  send_to_purchasing: 'Ուղարկված գնումներ',
}
function statusLabel(s?: string) {
  return STATUS_LABELS[s || ''] || s || '—'
}
function statusClass(s?: string) {
  if (s === 'done') return 'bg-emerald-100 text-emerald-700'
  if (s === 'processing' || s === 'active') return 'bg-indigo-100 text-indigo-700'
  if (s === 'sent' || s === 'send_to_purchasing') return 'bg-blue-100 text-blue-700'
  if (s === 'pending') return 'bg-amber-100 text-amber-700'
  if (s === 'cancelled') return 'bg-rose-100 text-rose-700'
  return 'bg-slate-100 text-slate-700'
}
const ROW_STATUS_LABELS: Record<string, string> = {
  active: 'Ակտիվ',
  pending: 'Սպասում է',
  cancelled: 'Չեղարկված',
  draft: 'Սևագիր',
  send_to_purchasing: 'Ուղարկված գնումներ',
}
function rowStatusLabel(s?: string) {
  return ROW_STATUS_LABELS[s || ''] || STATUS_LABELS[s || ''] || s || '—'
}
function rowStatusClass(s?: string) {
  if (s === 'cancelled') return 'bg-rose-100 text-rose-700'
  if (s === 'pending') return 'bg-amber-100 text-amber-700'
  if (s === 'active' || s === 'processing') return 'bg-indigo-100 text-indigo-700'
  if (s === 'sent' || s === 'send_to_purchasing') return 'bg-blue-100 text-blue-700'
  if (s === 'done' || s === 'success') return 'bg-emerald-100 text-emerald-700'
  if (s === 'draft') return 'bg-slate-100 text-slate-700'
  return 'bg-slate-100 text-slate-700'
}

/* recurring helpers reused in Details tab */
function isRecurringRow(r: any): boolean {
  const v = r?.recurring
  return v === true || v === 1 || v === '1'
}
function periodicityLabel(r: any): string {
  const every = Number(r?.recurring_per_month_qty)
  const times = Number(r?.recurring_qty)
  const deadline = Number(r?.recurring_deadline_month_qty)
  const fmt = (n: number) => formatNumber(n, { maximumFractionDigits: 6 })
  if (!(every > 0) || !(times > 0) || !(deadline > 0)) return '—'
  return `Յուրաքանչյուր ${fmt(every)} ամիսը ${fmt(times)} անգամ · մինչև ${fmt(deadline)} ամիս`
}

/* utils */
function formatNumber(value: any, { maximumFractionDigits = 6, minimumFractionDigits = 0, locale = 'en-US' } = {}) {
  if (value === null || value === undefined || value === '') return ''
  const num = typeof value === 'string' ? Number(value) : value
  if (!isFinite(num)) return String(value)
  return new Intl.NumberFormat(locale, { maximumFractionDigits, minimumFractionDigits, useGrouping: false }).format(num)
}

/* fetch one */
async function fetchOrder() {
  loading.value = true
  try {
    const res = await purchasingOrdersApi.show(id.value)
    order.value = res?.data?.data ?? res ?? null
  } finally {
    loading.value = false
  }
}

/* TAB state */
const tab = ref<'stages' | 'selected' | 'details'>('stages')

/* ---- NEW: Stages tab logic (from order.stages) ---- */
type StageRow = {
  id: number
  name: string
  status?: string
  active_date_start?: string | null
  active_date_finished?: string | null
  productsCount: number
  offeringsCount: number
}
const stageRows = computed<StageRow[]>(() => {
  const stages = (order.value?.stages || []) as any[]
  return stages.map(s => ({
    id: s.id,
    name: s.name,
    status: s.status,
    active_date_start: s.active_date_start || null,
    active_date_finished: s.active_date_finished || null,
    productsCount: Array.isArray(s.products) ? s.products.length : 0,
    offeringsCount: Array.isArray(s.offerings) ? s.offerings.length : 0,
  }))
})

// modal
const stageModal = ref<{ open: boolean; id: number | null }>({ open: false, id: null })
const selectedStage = computed<any | null>(() => {
  const sid = stageModal.value.id
  if (!sid) return null
  return (order.value?.stages || []).find((s: any) => s.id === sid) || null
})
function openStage(id: number) {
  stageModal.value = { open: true, id }
}
function closeStage() {
  stageModal.value.open = false
  stageModal.value.id = null
}

/* ---- Selected Applications tab ---- */
const departments = ref<{ id: number; name: string }[]>([])
async function fetchDepartments() {
  try {
    const res = await ordersApi.listDepartments?.()
    departments.value = res?.data ?? res ?? []
  } catch {
    departments.value = departments.value // noop
  }
}

type SelectedItem = {
  _key: string
  _kind: 'product' | 'offering'
  application_id?: number | null
  application_identification_number?: string | null
  department_id?: number | null
  department_name?: string | null
  name?: string | null
  qty?: number | string | null
  measure?: string | null
}
const selectedApplications = computed<SelectedItem[]>(() => {
  const o = order.value || {}

  const prod: SelectedItem[] = (o.products || []).map((r: any) => {
    const ap = r.application_product?.application
    return {
      _key: `p-${r.id}`,
      _kind: 'product',
      application_id: ap?.id ?? null,
      application_identification_number: ap?.identification_number ?? null,
      department_id: ap?.department_id ?? null,
      department_name: ap?.department?.name ?? null,
      name: r.product?.name ?? null,
      qty: r.qty ?? null,
      measure: r.measure ?? null,
    }
  })

  const off: SelectedItem[] = (o.offerings || []).map((r: any) => {
    const ap = r.application_offering?.application
    return {
      _key: `o-${r.id}`,
      _kind: 'offering',
      application_id: ap?.id ?? null,
      application_identification_number: ap?.identification_number ?? null,
      department_id: ap?.department_id ?? null,
      department_name: ap?.department?.name ?? null,
      name: r.offering?.name ?? null,
      qty: r.qty ?? null,
      measure: null,
    }
  })

  return [...prod, ...off]
})

const qApp = ref('')
const deptFilter = ref<number | null>(null)
let fto: any = null
function debouncedFilter() { if (fto) clearTimeout(fto); fto = setTimeout(applyFilter, 250) }
function applyFilter() { /* computed reacts automatically */ }

const selectedApplicationsFiltered = computed(() => {
  const q = qApp.value.trim().toLowerCase()
  const dept = deptFilter.value
  return selectedApplications.value.filter(it => {
    const okDept = dept == null ? true : it.department_id === Number(dept)
    const okQ = q === '' ? true : (it.application_identification_number || '').toLowerCase().includes(q)
    return okDept && okQ
  })
})

onMounted(async () => {
  await Promise.all([fetchOrder(), fetchDepartments()])
})
</script>

<style scoped>
.input { @apply w-full px-3 py-2 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-blue-500; }
.label { @apply block text-sm text-gray-600 mb-1; }
.btn-ghost { @apply px-2 py-1 rounded hover:bg-gray-100; }
</style>
