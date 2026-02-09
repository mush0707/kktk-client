<template>
  <div class="flex flex-col">
    <div class="flex flex-col">
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
            <router-link
                to="/storages"
                class="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-slate-100"
            >
              <span class="underline-offset-2 hover:underline">{{ $t('storages') }}</span>
            </router-link>
          </li>
          <li aria-hidden="true" class="px-1">
            <svg class="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
              <path d="M7.05 3.55a1 1 0 0 1 1.4 0l4.5 4.5a1 1 0 0 1 0 1.4l-4.5 4.5a1 1 0 0 1-1.4-1.4L10.79 10 7.05 6.26a1 1 0 0 1 0-1.41z"/>
            </svg>
          </li>
          <li>
            <router-link
                :to="`/storages/${storage?.id}`"
                class="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-slate-100"
            >
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
              <span class="underline-offset-2 hover:underline">Պահանջագրեր</span>
            </p>
          </li>
        </ol>
      </nav>
    </div>

    <div class="flex flex-col gap-3 px-4 py-4">
      <!-- Filters -->
      <div class="grid md:grid-cols-2 gap-2 items-end">
        <input
            v-model="search"
            class="border border-gray-300 rounded-xl px-3 py-2 w-full"
            placeholder="ID / Ապրանք"
            @input="debouncedReload"
        />
        <select v-model="status" class="border border-gray-300 rounded-xl px-3 py-2 w-full" @change="reloadFromStart">
          <option value="">Բոլորը</option>
          <option value="awaiting_warehouse">Սպասում է պահեստին</option>
          <option value="approved">Հաստատված</option>
          <option value="rejected">Մերժված</option>
          <option value="written_off">Դուրս գրված</option>
        </select>
      </div>

      <!-- Table -->
      <div class="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table class="min-w-full text-sm">
          <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left">#</th>
            <th class="px-4 py-3 text-left">Ստորաբաժանում</th>
            <th class="px-4 py-3 text-left">Ստեղծող</th>
            <th class="px-4 py-3 text-left">Ստեղծվել է</th>
            <th class="px-4 py-3 text-left">Կարգավիճակ</th>
            <th class="px-4 py-3 text-left">Գործողություններ</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="row in rows" :key="row.id" class="border-t">
            <td class="px-4 py-3">{{ row.id }}</td>
            <td class="px-4 py-3">
              {{ originName(row) }}
            </td>
            <td class="px-4 py-3">{{ row.user?.name || row.user_id }}</td>
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
                <button
                    class="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    @click="openView(row)"
                >
                  Դիտել
                </button>

                <template v-if="row.status === 'awaiting_warehouse'">
                  <button
                      class="px-3 py-1 text-xs font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:opacity-50"
                      :disabled="submittingId===row.id"
                      @click="approveRow(row)"
                  >
                    Հաստատել
                  </button>
                  <button
                      class="px-3 py-1 text-xs font-medium text-white bg-rose-600 rounded-md hover:bg-rose-700 disabled:opacity-50"
                      :disabled="submittingId===row.id"
                      @click="openRejectRow(row)"
                  >
                    Մերժել
                  </button>
                </template>

                <template v-else-if="row.status === 'approved'">
                  <button
                      class="px-3 py-1 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                      :disabled="submittingId===row.id"
                      @click="writeOffRow(row)"
                  >
                    Դուրսգրում
                  </button>
                </template>
              </div>
            </td>
          </tr>

          <tr v-if="!loading && rows.length===0">
            <td colspan="5" class="px-4 py-8 text-center text-gray-500">Տվյալներ չկան</td>
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
    <div class="bg-white w-full max-w-6xl rounded-2xl shadow-xl overflow-hidden">
      <div class="px-4 py-3 border-b flex items-center justify-between">
        <div class="font-semibold">
          Պահանջագիր № {{ view.data?.id }}
          <span class="ml-2 text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700">{{ statusLabel(view.data?.status) }}</span>
        </div>

        <button class="p-2 hover:bg-gray-100 rounded" @click="closeView">✕</button>
      </div>

      <div class="p-4">
        <div class="grid md:grid-cols-3 gap-3 mb-4 text-sm text-gray-600">
          <div v-if="view.data?.from_storage?.address"><b>Սկզբնական պահեստ:</b> {{ view.data?.from_storage?.address || view.data?.from_storage_address || '—' }}</div>
          <div v-if="view.data?.department?.name"><b>Ստորաբաժանում:</b> {{ view.data?.department?.name || view.data?.department_name || '—' }}</div>
        </div>
        <div class="mb-3 flex items-center justify-between">
          <div class="text-sm text-slate-600"></div>
          <button
              class="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-sm"
              @click="openExpectedArrivals()"
          >
            Տեսնել սպասվող մուտքերը
            <svg viewBox="0 0 20 20" class="h-4 w-4 text-slate-500" fill="currentColor"><path d="M2 10a1 1 0 011-1h10.586l-3.293-3.293A1 1 0 1111 4.293լ5 5a1 1 0 010 1.414լ-5 5A1 1 0 0110.293 14.7L13.586 11H3a1 1 0 01-1-1z"/></svg>
          </button>
        </div>
        <div class="border rounded-xl overflow-hidden">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-50">
            <tr>
              <th class="px-3 py-2 text-left">Ապրանք</th>
              <th class="px-3 py-2 text-right">Քանակ</th>
              <th class="px-3 py-2 text-left">Ելքագրում</th>
              <th class="px-3 py-2 text-center">Կարգավիճակ</th>
              <th class="px-3 py-2 text-center"></th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="it in filteredItems" :key="it.id" class="border-t">
              <td class="px-3 py-2">
                <div class="font-medium">{{ it.product?.name || it.product_name || it.storage_product_id }}</div>
                <div v-if="(it.product?.characteristics||[]).length" class="mt-1 flex flex-wrap gap-1">
                  <span v-for="c in it.product.characteristics" :key="c.id||c.name" class="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-700">{{ c.name }}</span>
                </div>
              </td>
              <td class="px-3 py-2 text-right tabular-nums">{{ fmt(it.qty) }} {{ $t(it.measure ?? 'piece') }}</td>

              <td class="px-3 py-2 align-top">
                <div v-if="(it.reserves?.length || 0) > 0" class="flex flex-col gap-1">
                  <div v-for="r in it.reserves" :key="r.id" class="text-sm px-2 py-1 rounded border border-slate-200 bg-slate-50">
                    <div class="font-medium">
                      {{ r.cell?.name || 'Չտեղավորվածից' }}
                    </div>
                    <div class="text-xs text-slate-600">
                      {{ fmt(r.qty) }} {{ $t(r.measure || it.measure || 'piece') }}
                    </div>
                  </div>
                </div>
                <span v-else class="text-xs text-slate-400">—</span>
              </td>
              <td class="px-3 py-2 text-center">
                  <span class="p-1" :class="statusPillClass(it.status)">
                    {{ $t(it.status) }}
                  </span>
              </td>
              <td class="px-3 py-2 text-center">
                <div
                    v-if="(it.status==='approved' || it.status==='pending') && (view.data?.status==='awaiting_warehouse' || view.data?.status==='approved')"
                    class="flex gap-2"
                >
                  <button
                      class="px-2 py-1 text-xs rounded bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
                      :disabled="rejectingItemId===it.id"
                      @click="openRejectItem(it)"
                  >
                    <span v-if="rejectingItemId===it.id">Մերժում…</span>
                    <span v-else>Մերժել</span>
                  </button>
                  <button
                      v-if="canAssignCells(view.data, it)"
                      class="flex gap-x-1 items-center px-2 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                      @click="openCellsModal(it)"
                  >
                    Կառուցել ելքագրումը
                    <svg class="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M7.05 3.55a1 1 0 0 1 1.4 0լ4.5 4.5a1 1 0 0 1 0 1.4լ-4.5 4.5a1 1 0 0 1-1.4-1.4Լ10.79 10 7.05 6.26a1 1 0 0 1 0-1.41z"/>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="filteredItems.length===0">
              <td colspan="5" class="px-3 py-6 text-center text-gray-500">Տվյալներ չկան</td>
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

  <!-- Cells Modal -->
  <div v-if="cellsModal.open" class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
    <div class="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden">
      <div class="px-4 py-3 border-b flex items-center justify-between">
        <div class="font-semibold">
          Ելքագրման բջիջներ — {{ cellsModal.item?.product?.name || cellsModal.item?.storage_product_id }}
        </div>
        <button class="p-2 hover:bg-gray-100 rounded" @click="closeCellsModal">✕</button>
      </div>

      <div class="p-5 space-y-4">
        <!-- chips -->
        <div class="flex flex-wrap gap-2">
          <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-slate-100 text-slate-700">
            Պահանջված՝ <b class="ml-1">{{ fmt(cellsModal.item?.qty) }}</b>
            {{ unitShort(cellsModal.item?.storage_product?.measure) }}
          </span>
          <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-indigo-100 text-indigo-700">
            Չտեղավորված առկա՝ <b class="ml-1">{{ fmt(cellsModal.availableNotPlaced) }}</b>
          </span>
        </div>

        <!-- cells table -->
        <div class="border rounded-xl overflow-hidden">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-50">
            <tr>
              <th class="px-3 py-2 text-left">Բջիջ</th>
              <th class="px-3 py-2 text-right">Մնացորդ</th>
              <th class="px-3 py-2 text-right">Ավելի. (առկա)</th>
              <th class="px-3 py-2 text-right">Ելքագրման քանակ</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="row in cellsModal.cells" :key="row.cell_id" class="border-t">
              <td class="px-3 py-2">{{ row.cell_name }}</td>
              <td class="px-3 py-2 text-right tabular-nums">{{ fmt(row.qty) }}</td>
              <td class="px-3 py-2 text-right tabular-nums">{{ fmt(row.available) }}</td>
              <td class="px-3 py-2 text-right">
                <input
                    type="number" min="0" step="0.001"
                    class="border border-slate-300 rounded-lg px-2 py-1 w-32 text-right focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    v-model.number="cellsModal.alloc[row.cell_id]"
                />
              </td>
            </tr>
            <tr v-if="!cellsModal.cells.length">
              <td colspan="4" class="px-3 py-6 text-center text-gray-500">Տվյալ ապրանքը բջիջներում առկա չէ</td>
            </tr>
            </tbody>
          </table>
        </div>

        <!-- bottom cards -->
        <div class="grid sm:grid-cols-2 gap-4">
          <!-- not placed card -->
          <div class="rounded-xl border border-slate-200 p-3">
            <div class="text-sm font-medium mb-2">Չտեղավորվածից ելքագրման քանակ</div>

            <div class="flex items-end gap-3">
              <div class="grow">
                <input
                    type="number" min="0" step="0.001"
                    class="w-full border border-slate-300 rounded-lg px-3 py-2 text-right
                         focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    v-model.number="cellsModal.allocNotPlaced"
                />
                <div class="mt-1 text-xs text-slate-500">
                  Նախկինում ընտրված՝ <b>{{ fmt(cellsModal.prevNotPlaced) }}</b>
                  · Առկա՝ <b>{{ cellsModal.availableNotPlaced!=null ? fmt(cellsModal.availableNotPlaced) : '—' }}</b>
                </div>

                <p v-if="Number(cellsModal.allocNotPlaced||0) < 0" class="text-xs text-rose-600 mt-1">
                  Չի կարող լինել բացասական։
                </p>
              </div>
            </div>
          </div>

          <!-- totals card -->
          <div class="rounded-xl border border-slate-200 p-3">
            <div class="text-sm font-medium mb-2">Ընդհանուր</div>
            <div class="text-sm">
              <div class="flex items-center justify-between">
                <span>Ընդամենը (բջիջներ)</span>
                <b class="tabular-nums">{{ fmt(sumAllocCells) }}</b>
              </div>
              <div class="flex items-center justify-between">
                <span>Ընդամենը (բջիջներ + չտեղավորված)</span>
                <b class="tabular-nums">{{ fmt(sumTotal) }}</b>
              </div>
              <div class="mt-1 text-xs text-slate-500">Սահման՝ {{ fmt(requiredQty) }}</div>
              <p v-if="!totalsMatch" class="text-xs text-amber-700 mt-1">
                Պետք է բաշխել ճշգրիտ {{ fmt(requiredQty) }} քանակ (բջիջներ + չտեղավորվող)։
              </p>
            </div>
          </div>
        </div>

        <!-- footer buttons -->
        <div class="flex justify-end gap-2 pt-1">
          <button class="px-3 py-2 rounded-xl border hover:bg-gray-50" @click="closeCellsModal">Փակել</button>
          <button
              class="px-3 py-2 rounded-xl text-white"
              :class="(!canSave || savingCells) ? 'bg-slate-400 cursor-not-allowed' : 'bg-green-900 hover:bg-green-800'"
              :disabled="!canSave || savingCells"
              @click="saveCellsAlloc"
          >
            <span v-if="savingCells">Պահպանում…</span>
            <span v-else>Պահպանել</span>
          </button>
        </div>

        <!-- validation hints -->
        <p v-if="!totalsMatch" class="text-sm text-amber-700 mt-2">
          Պետք է բաշխել ճշգրիտ <b>{{ fmt(requiredQty) }}</b> քանակ (բջիջներ + չտեղավորված)։
        </p>
        <p v-else-if="Number(cellsModal.allocNotPlaced||0) > Number(cellsModal.availableNotPlaced||0)" class="text-sm text-rose-600 mt-2">
          «Չտեղավորվածից» ընտրած քանակը չի կարող գերազանցել հասանելիին։
        </p>
        <p v-if="cellsModal.error" class="text-sm text-rose-600">{{ cellsModal.error }}</p>
      </div>
    </div>
  </div>

  <!-- Expected Arrivals Modal -->
  <div v-if="expectedModal.open" class="fixed inset-0 z-[55] bg-black/40 flex items-center justify-center p-4">
    <div class="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden">
      <div class="px-4 py-3 border-b flex items-center justify-between">
        <div class="font-semibold">Սպասվող մուտքեր</div>
        <button class="p-2 rounded hover:bg-gray-100" @click="closeExpectedModal">✕</button>
      </div>

      <div class="p-4">
        <div v-if="expectedModal.loading" class="text-sm text-slate-500">Բեռնվում է…</div>
        <div v-else>
          <div v-if="expectedModal.error" class="text-sm text-rose-600 mb-2">{{ expectedModal.error }}</div>

          <div class="border rounded-xl overflow-hidden">
            <table class="min-w-full text-sm">
              <thead class="bg-gray-50">
              <tr>
                <th class="px-3 py-2 text-left">Ապրանք</th>
                <th class="px-3 py-2 text-right">Քանակ</th>
                <th class="px-3 py-2 text-right">Կարգավիճակ</th>
                <th class="px-3 py-2 text-left">Մուտքը սպասվում է մինչև</th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="r in expectedModal.rows" :key="r.id || r.product_id + '-' + r.expected_until" class="border-t">
                <td class="px-3 py-2">{{ r.application_order_product.product?.name }}</td>
                <td class="px-3 py-2 text-right">{{ fmt(r.application_order_product.qty) }} {{ $t(r.application_order_product.measure ?? 'piece') }}</td>
                <td class="px-3 py-2 text-right">{{ $t(r.status) }}</td>
                <td class="px-3 py-2">
                  <span :title="r.expected_until">{{ r.active_date_finished }}</span>
                </td>
              </tr>
              <tr v-if="!expectedModal.rows.length && !expectedModal.loading">
                <td colspan="4" class="px-3 py-6 text-center text-gray-500">Տվյալներ չկան</td>
              </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="px-4 py-3 border-t text-right">
        <button class="px-3 py-2 rounded-xl border hover:bg-gray-50" @click="closeExpectedModal">Փակել</button>
      </div>
    </div>
  </div>

  <RejectReasonModal
      :open="reasonModal.open"
      :title="reasonModal.title"
      :loading="reasonModal.loading"
      @close="reasonModal.open = false"
      @confirm="confirmReject"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { warehouseDemandApi as demandApi, mainApi, warehouseDemandApi } from '@/api.js'
import { formatDateTime, fromNow } from '@/utils/dateFormat'
import RejectReasonModal from '@/components/RejectReasonModal.vue'

const route = useRoute()
const storageId = computed(() => Number(route.params.id))

/* list state */
const rows = ref<any[]>([])
const loading = ref(false)
const submittingId = ref<number|null>(null)
const limit = ref(50)
const offset = ref(0)
const endReached = ref(false)
const search = ref('')
const status = ref('awaiting_warehouse')
const storage = ref<any>(null)

/* reject modal (row/item) */
const reasonModal = ref<{
  open: boolean
  loading: boolean
  title: string
  kind: 'row' | 'item'
  target: any | null
}>({
  open: false,
  loading: false,
  title: 'Մերժել',
  kind: 'row',
  target: null
})

function openRejectRow(row:any) {
  reasonModal.value = {
    open: true,
    loading: false,
    title: `Մերժել պահանջագիրը №${row.id}`,
    kind: 'row',
    target: row
  }
}

const view = ref<{open:boolean, data:any|null, rowRef:any|null}>({ open:false, data:null, rowRef: null })
const rejectingItemId = ref<number|null>(null)

function openRejectItem(it:any) {
  reasonModal.value = {
    open: true,
    loading: false,
    title: `Մերժել ապրանքը՝ ${it.product?.name || it.product_name || it.id}`,
    kind: 'item',
    target: it
  }
}

async function confirmReject(reason: string) {
  const modal = reasonModal.value
  const target = modal.target
  if (!target) return

  modal.loading = true
  try {
    if (modal.kind === 'row') {
      submittingId.value = target.id
      await demandApi.reject(storageId.value, target.id, { reason })
      target.status = 'rejected'
    } else {
      rejectingItemId.value = target.id
      const demandId = view.value?.data?.id
      await demandApi.rejectItem(storageId.value, demandId, target.id, { reason })
      target.status = 'rejected'
    }
    modal.open = false
  } finally {
    modal.loading = false
    submittingId.value = null
    rejectingItemId.value = null
  }
}

/* storage */
async function loadStorage() {
  storage.value = await mainApi.getStorageById(storageId.value)
}

/* formatting helpers */
function fmt(n:any){ return Number(n||0).toLocaleString(undefined,{ maximumFractionDigits:6 }) }
function unitShort(m:any){
  const k = String(m||'').toLowerCase()
  return ({kg:'կգ', g:'գ', tonn:'տ', t:'տ', l:'լ', ml:'մլ', m3:'մ³', m:'մ', cm:'սմ', mm:'մմ', piece:'հատ', pcs:'հատ'})[k] || ''
}
function canAssignCells(parent:any){
  const parentStatus = String(parent?.status||'').toLowerCase()
  return ['approved','awaiting_warehouse'].includes(parentStatus)
}
function originName(r:any) {
  if (r?.department?.name) return r.department.name
  if (r?.from_storage?.address) return r.from_storage.address
  if (r?.department_name) return r.department_name
  if (r?.from_storage_address) return r.from_storage_address
  return '—'
}

/* row actions */
async function writeOffRow(row:any){
  if (!confirm('Կատարե՞լ դուրսգրում')) return
  submittingId.value = row.id
  try {
    await demandApi.writeOff(storageId.value, row.id)
    row.status = 'written_off'
  } finally {
    submittingId.value = null
  }
}
function statusLabel(s:string){
  return ({
    awaiting_warehouse:'Սպասում է պահեստին',
    approved:'Հաստատված',
    rejected:'Մերժված',
    written_off:'Դուրսգրված',
  } as any)[s] || s
}
function statusClass(s:string){
  return ({
    awaiting_warehouse:'bg-blue-100 text-blue-700',
    approved:'bg-emerald-100 text-emerald-700',
    rejected:'bg-rose-100 text-rose-700'
  } as any)[s] || 'bg-gray-100 text-gray-700'
}
function statusPillClass(s?: string) {
  const v = String(s || '').toLowerCase()
  switch (v) {
    case 'approved': return 'bg-emerald-100 text-emerald-700'
    case 'rejected': return 'bg-rose-100 text-rose-700'
    case 'cancelled': return 'bg-rose-100 text-rose-700'
    case 'written_off': return 'bg-indigo-100 text-indigo-700'
    default: return 'bg-slate-100 text-slate-700'
  }
}

/* fetch page */
async function fetchPage(){
  if(loading.value || endReached.value) return
  loading.value = true
  try{
    const page = await demandApi.list(storageId.value, {
      limit: limit.value,
      offset: offset.value,
      search: (search.value || '').trim() || undefined,
      status: status.value || undefined,
    })
    const list = Array.isArray(page) ? page : (page?.data ?? page?.rows ?? [])
    rows.value.push(...list)
    offset.value += list.length
    if(list.length < limit.value) endReached.value = true
  } finally { loading.value = false }
}
function reloadFromStart(){
  endReached.value = false
  offset.value = 0
  rows.value = []
  fetchPage()
}
const debouncedReload = (() => {
  let t:any=null
  return () => { clearTimeout(t); t=setTimeout(reloadFromStart,300) }
})()

/* infinite scroll */
const sentinel = ref<HTMLElement|null>(null)
let io:IntersectionObserver|null = null
function startIO(){
  if(!sentinel.value) return
  io = new IntersectionObserver((entries)=>{
    const [e] = entries
    if(e.isIntersecting) fetchPage()
  })
  io.observe(sentinel.value)
}
function stopIO(){ if(io && sentinel.value) io.unobserve(sentinel.value); io=null }

/* approve / reject from list */
async function approveRow(row:any){
  if (!confirm('Հաստատե՞լ պահանջագիրը')) return
  submittingId.value = row.id
  try {
    await demandApi.approve(storageId.value, row.id)
    row.status = 'approved'
  } catch (e:any) {
    const httpStatus = e?.response?.status
    const errCode    = e?.response?.data?.code ?? e?.code
    if (httpStatus === 412 || Number(errCode) === 412) {
      await openView(row)
    }
  } finally {
    submittingId.value = null
  }
}

/* view modal */
async function openView(row:any){
  view.value.open = true
  view.value.rowRef = row
  view.value.data = await demandApi.get(storageId.value, row.id)
}
function closeView(){ view.value.open = false; view.value.data = null }

/* items to show inside view */
const filteredItems = computed(() => {
  const items = Array.isArray(view.value.data?.items) ? view.value.data.items : []
  return items.filter((it:any)=> ['pending','approved','rejected','written_off'].includes(String(it.status||'')))
})

/* Cells modal state */
const cellsModal = ref({
  open:false,
  demand_id: 0,
  item_id: 0,
  item: null as any,
  cells: [] as any[],
  alloc: {} as Record<number, number>,     // cell_id -> qty (user input)
  prevNotPlaced: 0 as number,              // previously selected (from API)
  allocNotPlaced: 0 as number,             // user input for not placed
  availableNotPlaced: 0 as number,         // available not placed (from API)
  error: '',
})
const savingCells = ref(false)

/* totals */
const sumAllocCells = computed(() =>
    Object.values(cellsModal.value.alloc).reduce((a,b)=> a + Number(b||0), 0)
)
const requiredQty = computed(() => Number(cellsModal.value.item?.qty || 0))
const sumTotal = computed(() =>
    Number(sumAllocCells.value) + Number(cellsModal.value.allocNotPlaced || 0)
)
const totalsMatch = computed(() => {
  const eps = 1e-9
  return Math.abs(Number(sumTotal.value) - Number(requiredQty.value)) < eps
})

/* validation for save button */
const canSave = computed(() => {
  // 1) not placed cannot exceed available
  if (Number(cellsModal.value.allocNotPlaced||0) > Number(cellsModal.value.availableNotPlaced||0)) return false
  // 2) each cell non-negative
  for (const qty of Object.values(cellsModal.value.alloc)) {
    if (Number(qty||0) < 0) return false
  }
  // 3) total must equal required
  return totalsMatch.value
})

/* open/close & load */
async function openCellsModal(item:any){
  cellsModal.value.open = true
  cellsModal.value.item_id = item.id
  cellsModal.value.demand_id = view.value.data.id
  cellsModal.value.item = item
  cellsModal.value.error = ''
  cellsModal.value.cells = []
  cellsModal.value.alloc = {}
  cellsModal.value.allocNotPlaced = 0
  cellsModal.value.prevNotPlaced = 0
  cellsModal.value.availableNotPlaced = 0

  const sid = Number(route.params.id)
  const dto = await demandApi.getItemCells(sid, view.value.data.id, item.id)

  cellsModal.value.cells = dto?.cells || []
  for (const a of (dto?.allocated || [])) {
    cellsModal.value.alloc[a.cell_id] = Number(a.qty || 0)
  }

  // map "not placed" fields
  cellsModal.value.prevNotPlaced = Number(dto?.not_placed_qty || 0)
  cellsModal.value.allocNotPlaced = Number(dto?.not_placed_qty || 0)      // prefill with previous selection
  cellsModal.value.availableNotPlaced = Number(dto?.available_not_placed_qty || 0)
}
function closeCellsModal(){ cellsModal.value.open=false }

/* save */
async function saveCellsAlloc(){
  if (!canSave.value) return
  savingCells.value = true
  cellsModal.value.error = ''

  try {
    const measure = String(
        cellsModal.value.item?.measure ??
        cellsModal.value.item?.storage_product?.measure ??
        'piece'
    )

    const allocations: Array<{cell_id: number|null; qty:number; measure:string}> = []

    // from cells
    for (const [cellIdStr, qtyAny] of Object.entries(cellsModal.value.alloc)) {
      const qty = Number(qtyAny || 0)
      const cell_id = Number(cellIdStr)
      if (qty > 0) allocations.push({ cell_id, qty, measure })
    }

    // from "not placed"
    const np = Number(cellsModal.value.allocNotPlaced || 0)
    if (np > 0) allocations.push({ cell_id: null, qty: np, measure })

    await demandApi.upsertItemCells(
        Number(route.params.id),
        cellsModal.value.demand_id,
        cellsModal.value.item_id,
        { allocations }
    )

    // refresh the demand view
    const fresh = await demandApi.get(Number(route.params.id), cellsModal.value.demand_id)
    view.value.data = fresh

    closeCellsModal()
  } catch (e:any) {
    cellsModal.value.error = e?.response?.data?.message || e.message || 'Սխալ'
  } finally {
    savingCells.value = false
  }
}

/* expected arrivals modal */
const expectedModal = ref<{open:boolean; loading:boolean; rows:any[]; error:string}>({
  open:false, loading:false, rows:[], error:''
})
function unique<T>(arr:T[]) { return Array.from(new Set(arr)) }
async function openExpectedArrivals(){
  const ids = unique(
      (filteredItems.value || [])
          .map((it:any) => Number(it?.product?.id ?? it?.product_id ?? 0))
          .filter((id:number) => id>0)
  )
  if (ids.length===0){
    expectedModal.value = { open:true, loading:false, rows:[], error:'Չկան ապրանքներ' }
    return
  }

  expectedModal.value.open = true
  expectedModal.value.loading = true
  expectedModal.value.rows = []
  expectedModal.value.error = ''

  try{
    const dto = await demandApi.getExpectedArrivals(storageId.value, { product_ids: ids })
    expectedModal.value.rows = Array.isArray(dto?.data) ? dto.data : (dto ?? [])
  }catch(e:any){
    expectedModal.value.error = e?.response?.data?.message || e.message || 'Չհաջողվեց ստանալ ցուցակը'
  }finally{
    expectedModal.value.loading = false
  }
}
function closeExpectedModal(){ expectedModal.value.open=false }

/* lifecycle */
onMounted(async () => {
  await loadStorage()
  reloadFromStart()
  startIO()
})
onBeforeUnmount(stopIO)

/* list approve from modal header button */

</script>
