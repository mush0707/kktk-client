<template>
  <div class="flex flex-col gap-4">
    <!-- Basket -->
    <div class="px-4 pt-4 sticky bottom-4 self-end w-full md:w-[720px] lg:w-[860px]">
      <div class="bg-white border border-gray-300 rounded-2xl shadow-lg p-4">
        <div class="flex items-center justify-between">
          <div class="text-sm">
            <div class="font-medium">Հավաքագրված</div>
            <div class="text-slate-500">
              Ապրանքներ՝ <b>{{ basket.product_row_ids.length }}</b> ·
              Աշխ/Ծառայություն՝ <b>{{ basket.offering_row_ids.length }}</b>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button class="px-3 py-2 rounded-xl border text-sm hover:bg-gray-50"
                    :disabled="submitting || emptyBasket"
                    @click="clearBasket">Մաքրել</button>
            <button class="px-3 py-2 rounded-xl text-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                    :disabled="submitting || emptyBasket"
                    @click="submitBasket">
              <span v-if="!submitting">Ստեղծել պատվեր</span>
              <span v-else>Ուղարկում…</span>
            </button>
          </div>
        </div>

        <!-- chips -->
        <div class="mt-3 flex flex-wrap gap-2">
          <template v-for="pid in basket.product_row_ids" :key="'p'+pid">
            <span class="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700">
              <b>{{ basket.product_rows[pid]?.name || ('product#'+pid) }}</b>
              <span v-if="basket.product_rows[pid]?.type"> · {{ basket.product_rows[pid].type }}</span>
              <span v-if="basket.product_rows[pid]?.group" class="text-slate-400"> ({{ basket.product_rows[pid].group }})</span>
              <span v-if="basket.product_rows[pid]?.sku" class="ml-1 text-[11px] text-slate-500">#{{ basket.product_rows[pid].sku }}</span>
              <span v-if="basket.product_rows[pid]?.qty" class="ml-2">
                {{ basket.product_rows[pid].qty }} {{ $t(basket.product_rows[pid].measure || 'piece') }}
              </span>
               <span
                   v-if="isRecurringVal(basket.product_rows[pid]?.recurring)"
                   class="ml-2 px-2 py-0.5 rounded-full text-[11px] bg-indigo-50 text-indigo-700"
               >
                {{ periodicityChipLabel(
                           basket.product_rows[pid]?.recurring_per_month_qty,
                           basket.product_rows[pid]?.recurring_qty,
                           basket.product_rows[pid]?.recurring_deadline_month_qty
                       ) }}
              </span>
              <span v-else>Մեկ անգամով</span>
              <button class="ml-1" @click="removeFromBasket('product', pid)">×</button>
            </span>
          </template>

          <template v-for="oid in basket.offering_row_ids" :key="'o'+oid">
            <span class="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700">
              <b>{{ basket.offering_rows[oid]?.name || ('offering#'+oid) }}</b>
              <span v-if="basket.offering_rows[oid]?.block"
                    class="ml-1 px-1.5 py-0.5 rounded text-[10px]"
                    :class="basket.offering_rows[oid].block==='work' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'">
                {{ basket.offering_rows[oid].block==='work' ? 'Աշխատանք' : 'Ծառայություն' }}
              </span>
              <span v-if="basket.offering_rows[oid]?.type" class="ml-1">· {{ basket.offering_rows[oid].type }}</span>
              <span v-if="basket.offering_rows[oid]?.qty" class="ml-2">{{ basket.offering_rows[oid].qty }}</span>
               <span
                   v-if="isRecurringVal(basket.offering_rows[oid]?.recurring)"
                   class="ml-2 px-2 py-0.5 rounded-full text-[11px] bg-indigo-50 text-indigo-700"
               >
        {{ periodicityChipLabel(
                   basket.offering_rows[oid]?.recurring_per_month_qty,
                   basket.offering_rows[oid]?.recurring_qty,
                   basket.offering_rows[oid]?.recurring_deadline_month_qty
               ) }}
      </span>
              <span v-else>Մեկ անգամով</span>

              <button class="ml-1" @click="removeFromBasket('offering', oid)">×</button>
            </span>
          </template>
        </div>

        <p v-if="flash.msg" :class="flash.kind==='success'
              ? 'mt-3 text-sm text-emerald-700'
              : 'mt-3 text-sm text-rose-600'">
          {{ flash.msg }}
        </p>
      </div>
    </div>

    <div class="px-4 flex flex-col gap-4">
      <!-- Search -->
      <div class="bg-white border border-gray-300 rounded-2xl p-4 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <input
              v-model.trim="q"
              @input="debouncedFetch()"
              placeholder="Փնտրել ապրանք / աշխատանք / ծառայություն"
              class="border border-gray-300 rounded-xl px-3 py-2 w-[360px]"
          />
        </div>
      </div>

      <!-- Applications list -->
      <div class="bg-white border border-gray-300 rounded-2xl overflow-hidden">
        <div class="px-4 py-4">
          <p>{{ $t('active_application_list') }}</p>
        </div>
        <table class="min-w-full text-sm">
          <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left">Համար</th>
            <th class="px-4 py-3 text-left">Ստորաբաժանում</th>
            <th class="px-4 py-3 text-left">Ստեղծող</th>
            <th class="px-4 py-3 text-left">Կարգավիճակ</th>
            <th class="px-4 py-3 text-right w-[1%]">Թարմացվել է</th>
            <th class="px-4 py-3 text-right w-[1%]"></th>
          </tr>
          </thead>
          <tbody>
          <template v-for="app in rows" :key="app.id">
            <!-- parent row -->
            <tr class="border-b">
              <td class="px-4 py-2">
                {{ app.identification_number }}
              </td>
              <td class="px-4 py-2">
                {{ app.department?.name || '—' }}
              </td>
              <td class="px-4 py-2">
                {{ app.creator?.name || '—' }}
              </td>
              <td class="px-4 py-2">
                <span class="px-2 py-0.5 rounded text-xs" :class="statusClass(app.status)">
                  {{ statusLabel(app.status) }}
                </span>
              </td>
              <td class="px-4 py-3">
                <span :title="app.updated_at">{{ formatDateTime(app.updated_at) }}</span>
                <span class="text-xs text-gray-400 ml-2">({{ fromNow(app.updated_at) }})</span>
              </td>
              <td class="px-4 py-2">
                <div class="flex items-center gap-2 justify-end">
                  <button class="px-3 py-1 rounded border text-xs hover:bg-gray-50"
                          @click="toggle(app)">
                    {{ expanded.has(app.id) ? 'Փակել' : 'Դիտել' }}
                  </button>

                  <!-- Collect parent -> adds ALL child rows to basket -->
                  <button
                      v-if="!allRowsCollected(app)"
                      class="px-3 py-1 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                      @click="collectParent(app)"
                  >
                    Հավաքագրել
                  </button>
                  <span
                      v-else
                      class="px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-700"
                  >
                    Բոլորը հավաքագրված
                  </span>
                </div>
              </td>
            </tr>

            <!-- children rows -->
            <tr v-if="expanded.has(app.id)" class="border-b bg-slate-50/50">
              <td colspan="5" class="px-0">
                <div class="p-3">
                  <div v-if="loadingChildren.has(app.id)" class="text-sm text-slate-500 px-4 py-2">Բեռնում…</div>

                  <template v-else>
                    <!-- products -->
                    <div class="border border-gray-300  rounded-xl overflow-hidden mb-3" v-if="(children[app.id]?.products?.length||0) > 0">
                      <div class="bg-gray-50 px-3 py-2 text-sm font-medium">Ապրանքներ</div>
                      <div class="max-h-[70vh] overflow-auto">
                        <table class="min-w-full text-sm">
                          <thead class="bg-gray-50/70">
                          <tr>
                            <th class="px-3 py-2 text-left">Անվանում</th>
                            <th class="px-3 py-2 text-right w-[120px]">Քանակ</th>
                            <th class="px-3 py-2 text-right w-[120px]">Չափ</th>
                            <th class="px-3 py-2 text-right w-[120px]">Պարբերականություն</th>
                            <th class="px-3 py-2 text-right w-[1%]"></th>
                          </tr>
                          </thead>
                          <tbody>
                          <tr v-for="p in children[app.id]?.products" :key="p.id" class="border-t bg-white">
                            <td class="px-3 py-2">
                              <div class="font-medium">{{ p.product?.name }}</div>
                              <div class="text-xs text-slate-500">
                                <span v-if="p.product?.type?.name">{{ p.product.type.name }}</span>
                                <span v-if="p.product?.type?.group?.name" class="ml-1 text-slate-400">
                                  ({{ p.product.type.group.name }})
                                </span>
                              </div>
                            </td>
                            <td class="px-3 py-2 text-right">{{ formatNumber(p.qty) }}</td>
                            <td class="px-3 py-2 text-right">{{ $t(p.measure ?? 'piece') }}</td>
                            <td class="px-3 py-2 text-right">{{ periodicityLabel(p) }}</td>
                            <td class="px-3 py-2 text-right">
                              <button v-if="!inBasket('product', p.id)"
                                      class="px-3 py-1 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                                      @click="collectRow('product', p)">
                                Հավաքագրել
                              </button>
                              <span
                                  v-else
                                  class="px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-700"
                              >
                                Հավաքագրված
                              </span>
                            </td>
                          </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <!-- offerings -->
                    <div class="border border-gray-300  rounded-xl overflow-hidden" v-if="(children[app.id]?.offerings?.length||0) > 0">
                      <div class="bg-gray-50 px-3 py-2 text-sm font-medium">Աշխատանք / Ծառայություն</div>
                      <table class="min-w-full text-sm">
                        <thead class="bg-gray-50/70">
                        <tr>
                          <th class="px-3 py-2 text-left w-[140px]">Տիպ</th>
                          <th class="px-3 py-2 text-left">Անվանում</th>
                          <th class="px-3 py-2 text-right w-[120px]">Քանակ</th>
                          <th class="px-3 py-2 text-right w-[120px]">Պարբերականություն</th>
                          <th class="px-3 py-2 text-right w-[1%]"></th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr v-for="o in children[app.id]?.offerings" :key="o.id" class="border-t bg-white">
                          <td class="px-3 py-2">
                              <span class="px-2 py-0.5 rounded text-xs"
                                    :class="o.offering?.block==='work' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'">
                                {{ o.offering?.block === 'work' ? 'Աշխատանք' : 'Ծառայություն' }}
                              </span>
                          </td>
                          <td class="px-3 py-2">
                            <div class="font-medium">{{ o.offering?.name }}</div>
                            <div class="text-xs text-slate-500" v-if="o.offering?.type?.name">
                              Տեսակ՝ {{ o.offering.type.name }}
                            </div>
                          </td>
                          <td class="px-3 py-2 text-right">{{ formatNumber(o.qty) }}</td>
                          <td class="px-3 py-2 text-right">{{ periodicityLabel(o) }}</td>
                          <td class="px-3 py-2 text-right">
                            <button v-if="!inBasket('offering', o.id)"
                                    class="px-3 py-1 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                                    @click="collectRow('offering', o)">
                              Հավաքագրել
                            </button>
                            <span
                                v-else
                                class="px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-700"
                            >
                              Հավաքագրված
                            </span>
                          </td>
                        </tr>
                        </tbody>
                      </table>
                    </div>

                    <div v-if="(children[app.id]?.products?.length||0)===0 && (children[app.id]?.offerings?.length||0)===0"
                         class="text-sm text-slate-500 px-4 py-2">
                      Տողեր չկան
                    </div>
                  </template>
                </div>
              </td>
            </tr>
          </template>

          <tr v-if="!loading && rows.length===0">
            <td colspan="6" class="px-4 py-6 text-center text-slate-500">Արդյունք չկա</td>
          </tr>
          <tr v-if="loading && rows.length===0">
            <td colspan="6" class="px-4 py-6 text-center text-slate-500">Բեռնում…</td>
          </tr>

          <tr v-if="loadingMore">
            <td colspan="6" class="px-4 py-4 text-center text-slate-500">Բեռնում ավելին…</td>
          </tr>
          <tr v-if="!loading && !loadingMore && eof && rows.length">
            <td colspan="6" class="px-4 py-4 text-center text-slate-400 text-xs">Ավարտ</td>
          </tr>

          <!-- sentinel for infinite scroll -->
          <tr>
            <td colspan="6">
              <div ref="sentinel" class="h-2"></div>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, computed, onBeforeUnmount } from 'vue';
import { ordersCollectApi, suppliersApplicationsApi, authApi } from '@/api.js';
import { formatDateTime, fromNow } from '@/utils/dateFormat.js';

// search + paging
const q = ref('');
let t: any = null;
function debouncedFetch(): void {
  if (t) clearTimeout(t);
  t = setTimeout(fetchRows, 250);
}
const limit = ref(20);
const offset = ref(0);
const eof = ref(false);
const sentinel = ref<HTMLElement | null>(null);
/** @type {IntersectionObserver|null} */
let io: IntersectionObserver | null = null;
const loadingMore = ref(false);

// list state
const rows = ref<any[]>([]);
const loading = ref(false);

// expanded children cache
const expanded = reactive<Set<number>>(new Set());
const children = reactive<Record<number, { products: any[]; offerings: any[] }>>({});
const loadingChildren = reactive<Set<number>>(new Set());

// basket
type ProductRowView = {
  id: number; name: string; type?: string; group?: string; qty?: number; measure?: string; sku?: string;
  recurring?: boolean | number;
  recurring_per_month_qty?: number;
  recurring_qty?: number;
  recurring_deadline_month_qty?: number;
};
type OfferingRowView = {
  id: number; name: string; block?: 'work' | 'service'; type?: string; qty?: number; desc?: string;
  recurring?: boolean | number;
  recurring_per_month_qty?: number;
  recurring_qty?: number;
  recurring_deadline_month_qty?: number;
};
const basket = reactive<{
  product_row_ids: number[];
  offering_row_ids: number[];
  product_rows: Record<number, ProductRowView>;
  offering_rows: Record<number, OfferingRowView>;
}>({
  product_row_ids: [],
  offering_row_ids: [],
  product_rows: {},
  offering_rows: {},
});
const emptyBasket = computed(() => basket.product_row_ids.length === 0 && basket.offering_row_ids.length === 0);
function clearBasket(): void { basket.product_row_ids = []; basket.offering_row_ids = []; }

// helpers
function inBasket(type: 'product' | 'offering', id: number | string): boolean {
  const norm = Number(id);
  const arr = type === 'product' ? basket.product_row_ids : basket.offering_row_ids;
  return arr.includes(norm);
}
function isRecurringRow(r: any): boolean {
  const v = r?.recurring;
  return v === true || v === 1 || v === '1';
}

function periodicityLabel(r: any): string {
  if(!r.recurring) {
    return `Մեկ անգամով`
  }
  const every = Number(r?.recurring_per_month_qty);
  const times = Number(r?.recurring_qty);
  const deadline = Number(r?.recurring_deadline_month_qty);
  const fmt = (n: number) => formatNumber(n, { maximumFractionDigits: 6 });
  return `յուրաքանչյուր ${fmt(every)} ամիսը ${fmt(times)} անգամ · մինչև ${fmt(deadline)} ամիս`;
}
// ✅ checks only after children are loaded; otherwise returns false (so button is visible)
function allRowsCollected(app: any): boolean {
  const cache = children[Number(app?.id)];
  if (!cache) return false; // children not loaded yet -> allow "Collect"
  const rowsToCheck = [
    ...(Array.isArray(cache.products) ? cache.products.map(r => ({ t: 'product', id: r.id })) : []),
    ...(Array.isArray(cache.offerings) ? cache.offerings.map(r => ({ t: 'offering', id: r.id })) : []),
  ];
  if (rowsToCheck.length === 0) return false;
  return rowsToCheck.every(r => inBasket(r.t as 'product' | 'offering', r.id));
}

function rememberProductRowView(row: any): void {
  const id = Number(row.id ?? row.row_id);
  const p = row.product || {};
  const t = p.type || {};
  const g = t.group || {};
  basket.product_rows[id] = {
    id,
    name: p.name,
    type: t.name || row.product?.type_name,
    group: g.name || row.product?.group_name,
    qty: Number(row.qty ?? 1),
    measure: String(row.measure ?? 'piece'),
    sku: p.sku || p.slug || '',
    recurring: row?.recurring,
    recurring_per_month_qty: Number(row?.recurring_per_month_qty ?? 0),
    recurring_qty: Number(row?.recurring_qty ?? 0),
    recurring_deadline_month_qty: Number(row?.recurring_deadline_month_qty ?? 0),
  };
}
function rememberOfferingRowView(row: any): void {
  const id = Number(row.id ?? row.row_id);
  const o = row.offering || {};
  const t = o.type || {};
  basket.offering_rows[id] = {
    id,
    name: o.name,
    block: o.block,
    type: t.name || row.offering?.type_name,
    qty: Number(row.qty ?? 1),
    desc: o.description || '',
    recurring: row?.recurring,
    recurring_per_month_qty: Number(row?.recurring_per_month_qty ?? 0),
    recurring_qty: Number(row?.recurring_qty ?? 0),
    recurring_deadline_month_qty: Number(row?.recurring_deadline_month_qty ?? 0),
  };
}
function isRecurringVal(v: any): boolean {
  return v === true || v === 1 || v === '1';
}
function periodicityChipLabel(
    em?: number, times?: number, deadline?: number
): string {
  const fmt = (n?: number) => formatNumber(n ?? 0, { maximumFractionDigits: 6 });
  return `յուրաքանչյուր ${fmt(em)} ամիսը ${fmt(times)} անգամ · մինչև ${fmt(deadline)} ամիս`;
}
function addToBasket(type: 'product' | 'offering', id: number, row: any): void {
  const arr = type === 'product' ? basket.product_row_ids : basket.offering_row_ids;
  if (!arr.includes(id)) arr.push(id);
  if (type === 'product') rememberProductRowView(row);
  else rememberOfferingRowView(row);
}
function removeFromBasket(kind: 'product' | 'offering', id: number): void {
  if (kind === 'product') {
    basket.product_row_ids = basket.product_row_ids.filter(x => x !== id);
    delete basket.product_rows[id];
  } else {
    basket.offering_row_ids = basket.offering_row_ids.filter(x => x !== id);
    delete basket.offering_rows[id];
  }
}

// flash
const flash = reactive<{ msg: string; kind: 'success' | 'error' }>({ msg: '', kind: 'success' });
let ft: any = null;
function setFlash(msg: string, kind: 'success' | 'error' = 'success'): void {
  flash.msg = msg; flash.kind = kind;
  if (ft) clearTimeout(ft);
  ft = setTimeout(() => (flash.msg = ''), 2500);
}

// status mapping (Orders view labels)
const STATUS_LABELS: Record<string, string> = { send_to_supplier: 'Ուղ․ Մատակարարին' };
function statusLabel(s?: string): string { return STATUS_LABELS[s || ''] || s || '—'; }
function statusClass(s?: string): string {
  if (s === 'send_to_supplier') return 'bg-indigo-100 text-indigo-700';
  if (s === 'send_to_approve') return 'bg-amber-100 text-amber-700';
  if (s === 'pending') return 'bg-slate-100 text-slate-700';
  return 'bg-slate-100 text-slate-700';
}

// fetch parents
async function fetchRows(reset = true): Promise<void> {
  if (reset) {
    loading.value = true;
    eof.value = false;
    offset.value = 0;
    rows.value = [];
  } else {
    if (eof.value || loadingMore.value) return;
    loadingMore.value = true;
  }

  try {
    const res = await ordersCollectApi.applicationList({
      item_search: q.value || '',
      limit: limit.value,
      offset: offset.value,
    });
    const data = res?.data ?? res ?? [];
    if (Array.isArray(data) && data.length) {
      rows.value.push(...data);
      offset.value += data.length;
      if (data.length < limit.value) eof.value = true;
    } else {
      eof.value = true;
    }
  } finally {
    loading.value = false;
    loadingMore.value = false;
  }
}

function setupInfiniteScroll(): void {
  if (io) { io.disconnect(); io = null; }
  if (!sentinel.value) return;
  io = new IntersectionObserver((entries) => {
    const e = entries[0];
    if (e && e.isIntersecting) fetchRows(false);
  }, { root: null, rootMargin: '200px', threshold: 0 });
  io.observe(sentinel.value);
}

// expand + load children
async function toggle(app: any): Promise<void> {
  const id = Number(app.id);
  if (expanded.has(id)) { expanded.delete(id); return; }
  expanded.add(id);
  if (children[id]) return;
  loadingChildren.add(id);
  try {
    const res = await ordersCollectApi.getApplicationById(id);
    const data = res?.data ?? res ?? {};
    children[id] = {
      products: Array.isArray(data.products) ? data.products : [],
      offerings: Array.isArray(data.offerings) ? data.offerings : [],
    };
  } finally {
    loadingChildren.delete(id);
  }
}

// collect parent (all children rows)
async function collectParent(app: any): Promise<void> {
  const id = Number(app.id);
  if (!children[id]) {
    await toggle(app); // loads children & expands
  }
  addAll(id);
  setFlash('Ավելացվեց basket-ի մեջ', 'success');
}
function addAll(id: number): void {
  const ch = children[id] || { products: [], offerings: [] };
  ch.products.forEach((r: any) => addToBasket('product', Number(r.id), r));
  ch.offerings.forEach((r: any) => addToBasket('offering', Number(r.id), r));
}

// collect single child row
function collectRow(type: 'product' | 'offering', row: any): void {
  addToBasket(type, Number(row.id), row);
  setFlash('Ավելացվեց basket-ի մեջ', 'success');
}

function formatNumber(
    value: any,
    { maximumFractionDigits = 6, minimumFractionDigits = 0, locale = 'en-US' } = {}
): string {
  if (value === null || value === undefined || value === '') return '';
  const num = typeof value === 'string' ? Number(value) : value;
  if (!isFinite(num)) return String(value);
  return new Intl.NumberFormat(locale, { maximumFractionDigits, minimumFractionDigits, useGrouping: false }).format(num);
}

// submit basket
const submitting = ref(false);
async function submitBasket(): Promise<void> {
  if (emptyBasket.value) return;
  submitting.value = true;
  try {
    await ordersCollectApi.store({
      application_product_ids: basket.product_row_ids,
      application_offering_ids: basket.offering_row_ids,
    });
    clearBasket();
    await fetchRows(true);
    setFlash('Հավաքագրումը հաջողությամբ ուղարկվեց', 'success');
  } catch (e: any) {
    setFlash(e?.response?.data?.message || 'Չհաջողվեց ուղարկել', 'error');
  } finally {
    submitting.value = false;
  }
}

onMounted(async () => {
  await fetchRows(true);
  setupInfiniteScroll();
});
onBeforeUnmount(() => { if (io) io.disconnect(); io = null; });
</script>
