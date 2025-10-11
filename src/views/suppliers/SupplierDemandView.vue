<template>
  <div class="flex flex-col">
    <div class="dark:border-gray-700 bg-white">
      <div class="flex gap-x-2 items-center p-4 border-b rounded-md border-gray-200 text-xl">
        <p>{{ $t('demands') }}</p>
        <p class="text-sm">({{ $t('suppliers_department') }})</p>
      </div>
    </div>
    <nav class="flex bg-blue-50 py-2 items-center text-sm" aria-label="Breadcrumb">
      <ol class="inline-flex items-center">
        <li>
          <router-link :to="'/suppliers/demands'" class="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-slate-100">
            <span class="underline-offset-2 hover:underline">{{ $t('demands') }}</span>
          </router-link>
        </li>
        <li aria-hidden="true" class="px-1">
          <svg class="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
            <path d="M7.05 3.55a1 1 0 0 1 1.4 0l4.5 4.5a1 1 0 0 1 0 1.4l-4.5 4.5a1 1 0 0 1-1.4-1.4L10.79 10 7.05 6.26a1 1 0 0 1 0-1.41z"/>
          </svg>
        </li>
        <li>
          <p class="inline-flex items-center gap-1 rounded-md px-2 py-1">
            <span class="underline-offset-2 hover:underline">{{ demand?.identification_number }}</span>
          </p>
        </li>
      </ol>
    </nav>
  </div>

  <div>
    <div class="flex flex-col gap-4 px-4 py-4">
      <div v-if="demand?.id" class="flex flex-col gap-y-2">
        <p>Հասցեատեր՝ {{ demand.department.name }}</p>
        <p>Թարմացվել է՝
          <span class="fled">
            <span :title="demand.updated_at">{{ formatDateTime(demand.updated_at) }}</span>
            <span class="text-xs text-gray-400 ml-2">({{ fromNow(demand.updated_at) }})</span>
          </span>
        </p>
      </div>

      <!-- Global “Satisfy” -->
      <div class="flex justify-end">
        <button
            v-if="canSatisfyProducts"
            class="px-3 py-1.5 text-sm font-medium text-white rounded-md disabled:opacity-50"
            :class="satisfying ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'"
            :disabled="satisfying"
            @click="satisfyAllProducts"
        >
          {{ satisfying ? 'ՈՒղարկվում է…' : 'Բավարարել' }}
        </button>
      </div>

      <!-- Offerings -->
      <div v-if="demand?.offerings.length" class="bg-white border border-gray-300 rounded-2xl overflow-hidden">
        <p class="text-sm text-slate-600 p-4">Ծառայություն / Աշխատանք</p>
        <table class="min-w-full text-sm">
          <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left">Գնման հայտի հիմքով</th>
            <th class="px-4 py-3 text-left">Անվանում</th>
            <th class="px-4 py-3 text-right">Քանակ</th>
            <th class="px-4 py-3 text-left">Կարգավիճակ</th>
            <th class="px-4 py-3 text-right">Թարմացվել է</th>
            <th class="px-4 py-3 text-right"></th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="o in demand?.offerings ?? []" :key="o.id" class="border-t">
            <td class="px-4 py-2">
                <span class="flex flex-col gap-y-2">
                  <span v-if="o.order_offering?.order.id">
                    <router-link
                        :to="'/suppliers/orders/'+o.order_offering?.order.id"
                        target="_blank"
                        class="text-blue-600 hover:text-blue-800 underline underline-offset-2"
                    >
                      Գնման պատվեր #{{ o.order_offering?.order.identification_number }}
                    </router-link>
                  </span>
                </span>
            </td>
            <td class="px-4 py-2">
              <div class="flex items-center justify-between">
                <div class="font-medium truncate">{{ o.offering.name }}</div>
              </div>
            </td>
            <td class="px-3 py-2 text-right">{{ formatNumber(o.qty) }}</td>
            <td class="px-4 py-2">
                <span class="px-2 py-0.5 rounded text-xs" :class="offeringStatusClass(o.status)">
                  {{ offeringStatusLabel(o.status) }}
                </span>
            </td>
            <td class="px-4 py-3 text-right">
              <span :title="o.updated_at">{{ formatDateTime(o.updated_at) }}</span>
              <span class="text-xs text-gray-400 ml-2">({{ fromNow(o.updated_at) }})</span>
            </td>
            <td class="px-4 py-2">
              <div class="flex items-center gap-2 justify-end">
                <button
                    v-if="canReject(o)"
                    class="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                    :disabled="submittingId===o.id"
                    @click="onRejectOffering(o)"
                >
                  Մերժել
                </button>
              </div>
            </td>
          </tr>
          </tbody>
        </table>
      </div>

      <!-- Products -->
      <div class="bg-white border border-gray-300 rounded-2xl overflow-hidden">
        <div class="flex items-center justify-between p-4">
          <p class="text-sm text-slate-600">Ապրանքացանկ</p>
        </div>

        <table class="min-w-full text-sm">
          <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left">Գնման հայտի հիմքով</th>
            <th class="px-4 py-3 text-left">Ապրանք</th>
            <th class="px-4 py-3 text-right">Քանակ</th>
            <th class="px-4 py-3 text-left">Կարգավիճակ</th>
            <th class="px-4 py-3 text-right">Թարմացվել է</th>
            <th class="px-3 py-2 text-left">Բաշխումներ</th>
            <th class="px-4 py-3 text-right"></th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="o in demand?.products ?? []" :key="o.id" class="border-t">
            <td class="px-4 py-2">
                <span class="flex flex-col gap-y-2">
                  <span v-if="o.order_product?.order.id">
                    <router-link
                        :to="'/suppliers/orders/'+o.order_product?.order.id"
                        target="_blank"
                        class="text-blue-600 hover:text-blue-800 underline underline-offset-2"
                    >
                      Գնման պատվեր #{{ o.order_product?.order.identification_number }}
                    </router-link>
                  </span>
                </span>
            </td>

            <td class="px-4 py-2">
              <div class="flex items-center justify-between">
                <div class="font-medium truncate">{{ o.product.name }}</div>
              </div>
              <div class="mt-1 flex flex-wrap items-center gap-1">
                  <span v-if="o.product.type?.group?.name || o.product.group_name" class="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {{ o.product.type?.group?.name || o.product.group_name }}
                  </span>
                <span v-if="o.product.type?.name || o.product.type_name" class="text-[11px] px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                    {{ o.product.type?.name || o.product.type_name }}
                  </span>
                <span v-if="o.product.measure_type" class="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
                    {{ $t(o.product.measure_type ?? 'piece') }}
                  </span>
              </div>
              <div
                  v-if="Array.isArray(o.product.characteristics) && o.product.characteristics.length"
                  class="mt-1 flex flex-wrap gap-1"
              >
                  <span v-for="c in o.product.characteristics" :key="c.id||c.name" class="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                    {{ c.name }}
                  </span>
              </div>
            </td>

            <td class="px-3 py-2 text-right">
              {{ formatNumber(o.qty) }} {{ $t(o.measure ?? 'piece') }}
            </td>

            <td class="px-4 py-2">
                <span class="px-2 py-0.5 rounded text-xs" :class="productStatusClass(o.status)">
                  {{ productStatusLabel(o.status) }}
                </span>
            </td>

            <td class="px-4 py-3 text-right">
              <span :title="o.updated_at">{{ formatDateTime(o.updated_at) }}</span>
              <span class="text-xs text-gray-400 ml-2">({{ fromNow(o.updated_at) }})</span>
            </td>

            <!-- Distributions column -> open modal -->
            <td class="px-4 py-3">
              <button
                  class="px-3 py-1 text-xs font-medium border rounded-md hover:bg-gray-50"
                  @click="openDistributions(o)"
              >
                Տեսնել բաշխումները
              </button>
            </td>

            <td class="px-4 py-2">
              <div class="flex items-center gap-2 justify-end">
                <button
                    v-if="canReject(o)"
                    class="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                    :disabled="submittingId===o.id"
                    @click="onRejectProduct(o)"
                >
                  Մերժել
                </button>

                <button
                    v-if="canDistributeProduct(o)"
                    class="px-3 py-1 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    @click="openDistribute(o)"
                >
                  Բաշխել
                </button>

                <!-- Direct access to “fill rejected” drawer if this product still has pending -->
                <button
                    v-if="needsRefill(o)"
                    class="px-3 py-1 text-xs font-medium text-white bg-violet-600 rounded-md hover:bg-violet-700"
                    @click="openFillRejectedModal(o)"
                >
                  Լրացնել մերժված քանակը
                </button>
              </div>
            </td>
          </tr>
          </tbody>
        </table>
      </div>

      <p v-if="flash" class="text-sm text-slate-600">{{ flash }}</p>
    </div>

    <!-- Reject modal -->
    <RejectReasonModal
        :open="rejectModal.open"
        :title="rejectModal.title"
        :loading="rejectModal.loading"
        @close="rejectModal.open=false"
        @confirm="confirmReject"
    />

    <!-- Distributions Modal -->
    <div v-if="distModal.open" class="fixed inset-0 z-10">
      <div class="absolute inset-0 bg-black/40" @click="closeDistributions"></div>
      <div
          class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
               w-full max-w-2xl bg-white rounded-2xl shadow-xl"
      >
        <div class="px-5 py-4 border-b flex items-center justify-between">
          <div>
            <div class="font-semibold">Բաշխումները — {{ distModal.row?.product?.name }}</div>
            <div class="text-xs text-slate-500 mt-0.5">
              Պահանջ՝ <b>{{ formatNumber(distNeedQty) }}</b> {{ $t(distModal.row?.measure || 'piece') }} ·
              Լրացված՝
              <b :class="distFulfilledQty >= distNeedQty ? 'text-emerald-700' : 'text-amber-700'">
                {{ formatNumber(distFulfilledQty) }}
              </b>
              <template v-if="distRemainingQty > 0">
                · Մնացորդ՝ <b class="text-rose-700">{{ formatNumber(distRemainingQty) }}</b>
              </template>
            </div>
          </div>
          <button class="p-2 rounded hover:bg-gray-100" @click="closeDistributions">✕</button>
        </div>

        <div class="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div class="rounded-xl border border-slate-200 overflow-hidden">
            <div class="px-4 py-2 bg-slate-50 border-b text-sm font-medium">Ակտիվ / Հաստատված</div>
            <div class="divide-y">
              <div
                  v-for="r in activeReserves"
                  :key="'a'+(r.id ?? r.storage_id ?? Math.random())"
                  class="px-4 py-2 flex items-center justify-between text-sm"
              >
                <div class="flex flex-col">
                  <span class="font-medium">{{ r.storage?.address || r.storage_name }}</span>
                </div>
                <div class="tabular-nums">
                  {{ formatNumber(r.qty) }}
                </div>
              </div>
              <div v-if="activeReserves.length===0" class="px-4 py-6 text-center text-slate-500 text-sm">
                Դատարկ է
              </div>
            </div>
          </div>

          <div class="rounded-xl border border-slate-200 overflow-hidden">
            <div class="px-4 py-2 bg-slate-50 border-b text-sm font-medium">Մերժված</div>
            <div class="divide-y">
              <div
                  v-for="r in rejectedReserves"
                  :key="'r'+(r.id ?? r.storage_id ?? Math.random())"
                  class="px-4 py-2 flex items-center justify-between text-sm"
              >
                <div class="flex flex-col">
                  <span class="font-medium">{{ r.cell?.name || r.storage?.address || 'Չտեղավորվածից' }}</span>
                  <span class="text-xs text-rose-600" v-if="r.reject_reason">Պատճառ․ {{ r.reject_reason }}</span>
                </div>
                <div class="tabular-nums">
                  {{ formatNumber(r.qty) }} <span class="text-slate-400">{{ $t(r.measure || 'piece') }}</span>
                </div>
              </div>
              <div v-if="rejectedReserves.length===0" class="px-4 py-6 text-center text-slate-500 text-sm">
                Չկան մերժված տողեր
              </div>
            </div>
          </div>
        </div>

        <div class="px-5 py-4 border-t flex items-center justify-end gap-2 bg-slate-50 rounded-b-2xl">
          <button class="px-3 py-2 rounded-xl border hover:bg-gray-50" @click="closeDistributions">Փակել</button>
          <button
              v-if="canFillRejectedCurrent"
              class="px-3 py-2 rounded-xl text-white bg-indigo-600 hover:bg-indigo-700"
              @click="fillRejectedFromModal"
          >
            Լրացնել մերժված քանակը
          </button>
        </div>
      </div>
    </div>

    <!-- Drawer (existing) -->
    <DemandDistributeDrawer
        :open="distribute.open"
        :row="distribute.row"
        :submit="submitDistribution"
        @distributed="onDistributed"
        @close="distribute.open=false"
    />
  </div>
</template>

<script setup lang="ts">
import { authApi, supplierDemandsApi } from "@/api.ts";
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { formatDateTime, fromNow } from "@/utils/dateFormat.ts";
import DemandDistributeDrawer from "@/views/demand/components/DemandDistributeDrawer.vue";
import RejectReasonModal from "@/components/RejectReasonModal.vue";
import { useToast } from "vue-toastification";

const toast = useToast();
const route = useRoute();
const flash = ref("");
const actor = ref<any>(null);
const kind = computed(() => String(actor.value?.kind || ""));
const distribute = ref<{ open: boolean; row: any | null }>({ open: false, row: null });

/* ---------- number helpers ---------- */
const EPS = 1e-6;
const eq6 = (a: number, b: number) => Math.abs(Number(a) - Number(b)) <= EPS;
const num = (v: any) => (v == null || v === "") ? 0 : Number(v);

// գումարում ենք արդեն դուրսգրված քանակը
function sumWrittenOff(row: any) {
  const list = Array.isArray(row?.reserves) ? row.reserves
      : Array.isArray(row?.storages) ? row.storages
          : [];
  return list.reduce((s: number, it: any) => {
    const st = String(it?.status || "").toLowerCase();
    return s + (st === "written_off" ? num(it.qty) : 0);
  }, 0);
}

// մնացորդ՝ բիզնես կանոն
function calcPendingQty(row: any) {
  if (row?.pending_qty != null) return Math.max(0, num(row.pending_qty));
  return Math.max(0, num(row?.qty) - sumWrittenOff(row));
}

function openFillRejectedModal(row:any){
  // հաշվում ենք այնքան, որքան պետք է լրացվի
  const pending = calcPendingQty(row)

  // Drawer-ին փոխանցում ենք pending-ը որպես qty,
  // իսկ սկզբնականը պահում ենք __original_qty-ում (եթե պետք գա ցուցադրել)
  distribute.value = {
    open: true,
    row: {
      ...row,
      __original_qty: row.qty,
      qty: pending,          // 👈 drawer-ի "Պահանջվող քանակ"-ը հիմա սա կցուցադրի (օր.՝ 10)
    }
  }
}

function formatNumber(
    value: any,
    { maximumFractionDigits = 6, minimumFractionDigits = 0, locale = "en-US" } = {}
) {
  if (value === null || value === undefined || value === "") return "";
  const n = typeof value === "string" ? Number(value) : value;
  if (!isFinite(n)) return String(value);
  return new Intl.NumberFormat(locale, { maximumFractionDigits, minimumFractionDigits, useGrouping: false }).format(n);
}

/* ---------- distribution completeness (for "Բավարարել") ---------- */
function sumStoragesQty(p: any) {
  const list = Array.isArray(p?.storages) ? p.storages : [];
  // count only storages that are NOT cancelled/rejected
  return list
      .filter((s: any) => String(s.status) !== "cancelled_from_storage")
      .reduce((s: number, it: any) => s + num(it?.qty), 0);
}
function isProductFullyDistributed(p: any) {
  const need = num(p?.qty);
  if (!(need > 0)) return false;
  return eq6(sumStoragesQty(p), need);
}

// Show “Բավարարել” when there is ANY pending quantity
const canSatisfyProducts = computed(() => {
  const prods = demand.value?.products || [];
  if (prods.length === 0) return false;
  const hasPending = prods.some((r: any) => num(r.pending_qty) > 0);
  return hasPending;
});

// Whether a single row needs refill (pending remains)
function needsRefill(row: any) {
  return num(row?.pending_qty) > 0;
}

const satisfying = ref(false);
async function satisfyAllProducts() {
  if (!demand.value?.id) return;
  satisfying.value = true;
  try {
    await supplierDemandsApi.onSatisfy(demand.value.id);
    for (const p of (demand.value.products || [])) p.status = "to_storage";
    toast.success("Պահանջագիրը բավարարած է");
  } catch (e: any) {
    // optional toast on error
  } finally {
    satisfying.value = false;
  }
}

/* ---------- Distribute drawer ---------- */
function openDistribute(row: any) { distribute.value = { open: true, row }; }
async function submitDistribution(row: any, payload: any) {
  await supplierDemandsApi.distributeProduct(row.demand_request_id, row.id, payload);
}
function onDistributed(payload: { productId: number; items: Array<{ storage_id: number; storage_name: string; qty: number }> }) {
  const p = (demand.value?.products || []).find((x: any) => Number(x.id) === Number(payload.productId));
  if (p) {
    p.storages = payload.items.map(it => ({
      storage_id: it.storage_id,
      storage_name: it.storage_name,
      qty: it.qty
    }));
  }
}

/* ---------- Reject ---------- */
const submittingId = ref<number | null>(null);
const rejectModal = ref<{
  open: boolean, loading: boolean, title: string,
  target: any | null, kind: "product" | "offering" | "demand"
}>({ open: false, loading: false, title: "Մերժել", target: null, kind: "demand" });

function offeringStatusClass(s: string) {
  return ({
    sent: "bg-emerald-100 text-emerald-700",
    finished: "bg-emerald-100 text-emerald-700",
    approved_from_supplier: "bg-blue-100 text-blue-700",
    in_progress: "bg-blue-100 text-blue-700",
    rejected: "bg-rose-100 text-rose-700",
    cancelled_from_department: "bg-rose-100 text-rose-700",
  } as any)[s] || "bg-gray-100 text-gray-700";
}
function productStatusClass(s: string) {
  return ({
    sent: "bg-emerald-100 text-emerald-700",
    finished: "bg-emerald-100 text-emerald-700",
    to_storage: "bg-blue-100 text-blue-700",
    rejected: "bg-rose-100 text-rose-700",
    cancelled_from_storage: "bg-rose-100 text-rose-700",
  } as any)[s] || "bg-gray-100 text-gray-700";
}
const PRODUCT_STATUS_LABELS: Record<string, string> = {
  sent: "Ակտիվ",
  finished: "Ավարտված",
  to_storage: "Դեպի պահեստ",
  rejected: "Մերժված",
  cancelled_from_storage: "Մերժված պահեստից",
};
const OFFERING_STATUS_LABELS: Record<string, string> = {
  sent: "Ակտիվ",
  finished: "Ավարտված",
  approved_from_supplier: "Հաստատված",
  in_progress: "Ընթացքի մեջ",
  rejected: "Մերժված",
  cancelled_from_department: "Մերժված պահեստից",
};
function productStatusLabel(s?: string) { return PRODUCT_STATUS_LABELS[s || ""] || s || "—"; }
function offeringStatusLabel(s?: string) { return OFFERING_STATUS_LABELS[s || ""] || s || "—"; }

function onRejectProduct(row: any) {
  if (!canReject(row)) return;
  rejectModal.value = {
    open: true, loading: false,
    title: `Մերժել ապրանք՝ ${row.product?.name || ("#" + row.id)}`,
    target: row, kind: "product"
  };
}
function onRejectOffering(row: any) {
  if (!canReject(row)) return;
  rejectModal.value = {
    open: true, loading: false,
    title: `Մերժել աշխատանք / ծառայություն՝ ${row.offering?.name || ("#" + row.id)}`,
    target: row, kind: "offering"
  };
}
async function confirmReject(reason: string) {
  const t = rejectModal.value.target;
  if (!t) return;
  rejectModal.value.loading = true;
  submittingId.value = t.id;
  try {
    if (rejectModal.value.kind === "product") {
      await supplierDemandsApi.rejectProduct(t.demand_request_id, t.id, { reason });
      t.status = "rejected";
      setFlash("Ապրանքը մերժվեց");
    } else if (rejectModal.value.kind === "offering") {
      await supplierDemandsApi.rejectOffering(t.demand_request_id, t.id, { reason });
      t.status = "rejected";
      setFlash("Աշխատանք / ծառայությունը մերժվեց");
    } else {
      await supplierDemandsApi.reject(demand.value.id, { reason });
      demand.value.status = "rejected";
      setFlash("Պահանջագիրը մերժվեց");
    }
  } catch (e: any) {
    setFlash(e?.response?.data?.message || "Չհաջողվեց մերժել");
  } finally {
    submittingId.value = null;
    rejectModal.value.open = false;
    rejectModal.value.loading = false;
  }
}
function canReject(row: any) { return String(row.status) === "sent" && isLeader(); }
function canDistributeProduct(row: any) { return String(row?.status) === "sent"; }
function isStaff() { return kind.value === "department_staff"; }
function isLeader() { return kind.value === "department_leader"; }

/* ---------- Demand fetch ---------- */
const id = computed(() => Number(route.params.id || 0));
const loading = ref(false);
const demand = ref<any>(null);
async function fetchDemand() {
  loading.value = true;
  try {
    const res = await supplierDemandsApi.get(id.value);
    demand.value = res?.data ?? res ?? null;
  } finally { loading.value = false; }
}

/* ---------- Distributions modal state ---------- */
const distModal = ref<{ open: boolean; row: any | null }>({ open: false, row: null });
function openDistributions(row: any) { distModal.value = { open: true, row }; }
function closeDistributions() { distModal.value = { open: false, row: null }; }

// quantities for current distributions modal row
const distNeedQty = computed(() => num(distModal.value.row?.qty));
const distFulfilledQty = computed(() => {
  // Prefer BE-provided filled_qty if present, else compute (exclude cancelled_from_storage)
  const filled = distModal.value.row?.filled_qty;
  if (filled != null) return num(filled);
  return sumStoragesQty(distModal.value.row);
});
const distRemainingQty = computed(() => Math.max(0, distNeedQty.value - distFulfilledQty.value));

const activeReserves = computed(() => {
  const list = Array.isArray(distModal.value.row?.storages) ? distModal.value.row.storages : [];
  return list.filter((r: any) => String(r.status) !== "cancelled_from_storage");
});
const rejectedReserves = computed(() => {
  const list = Array.isArray(distModal.value.row?.storages) ? distModal.value.row.storages : [];
  return list.filter((r: any) => String(r.status) === "cancelled_from_storage");
});
const canFillRejectedCurrent = computed(() => distFulfilledQty.value + EPS < distNeedQty.value);

// from distributions modal, open drawer to refill rejected amount
function fillRejectedFromModal() {
  if (!distModal.value.row) return;
  openFillRejectedModal(distModal.value.row);
}

/* ---------- misc ---------- */
function setFlash(msg: string) { flash.value = msg; setTimeout(() => flash.value = "", 3000); }
async function loadActor() { try { actor.value = await authApi.getActor(); } catch { actor.value = null; } }

onMounted(async () => {
  await loadActor();
  await fetchDemand();
});
</script>
