<!-- src/views/purchasing/components/application/AddEditApplication.vue -->
<template>
  <div class="flex flex-col gap-y-4 px-4 py-4">
    <!-- Header (shown only in edit mode) -->
    <div v-if="isEdit" class="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div class="flex items-center justify-between p-4 border-b">
        <div class="flex items-center gap-2">
          <div class="text-lg font-semibold">Խմբագրել հայտ № {{ identification_number }}</div>
          <span v-if="headerStatusLabel" class="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
            {{ headerStatusLabel }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <button class="px-3 py-2 rounded-xl border hover:bg-gray-50" @click="goBack">Վերադառնալ</button>
        </div>
      </div>
    </div>

    <!-- Products -->
    <div class="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div class="flex items-center justify-between p-4 border-b">
        <div class="flex flex-col gap-y-2">
          <div class="font-medium">Ապրանքներ</div>
          <input
              ref="prodSearchInput"
              v-model="prodSearch.query"
              @focus="openGlobalProductDd()"
              @input="onGlobalProductQuery(); openGlobalProductDd()"
              placeholder="Փնտրել՝ Անվանում / SKU"
              class="border border-gray-300 rounded-xl px-3 py-2 w-[360px]"
          />
        </div>
        <div v-if="initialStatus !== 'send_to_supplier'" class="flex gap-2 items-center">
          <button
              class="px-3 py-2 text-xs font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:opacity-50"
              @click="openNewProductModal()"
          >
            Նոր ապրանք +
          </button>
        </div>
      </div>

      <table class="min-w-full text-sm">
        <thead class="bg-gray-50">
        <tr>
          <th class="px-4 py-3 text-left w-[80px]">Կարգավիճակ</th>
          <th class="px-4 py-3 text-left w-[420px]">Ապրանք</th>
          <th class="px-4 py-3 text-right w-[160px]">Քանակ</th>
          <th class="px-4 py-3 text-right w-[160px]">Չափ</th>
          <th class="px-4 py-3 text-left w-[360px]">Պարբերականություն</th>
          <th class="px-4 py-3 w-[1%]"></th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="(it,i) in form.products" :key="it.uid" class="bg-white border-b border-gray-200">
          <td class="px-4 py-2">
            <span class="px-2 py-0.5 rounded text-xs" :class="itemStatusClass(it.status)">
              {{ itemStatusLabel(it.status) }}
            </span>
          </td>
          <td class="px-4 py-2">
            <div class="text-xs text-slate-500">
              <b>{{ it.product?.name }}</b>
              <span v-if="it.product?.type?.name || it.product?.type_name" class="ml-1">
                  · {{ it.product?.type?.name || it.product?.type_name }}
                </span>
              <span v-if="it.product?.type?.group?.name || it.product?.group_name" class="ml-1 text-slate-400">
                  ({{ it.product?.type?.group?.name || it.product?.group_name }})
                </span>

              <div v-if="productChars(it.product).length" class="mt-1 flex flex-wrap gap-1">
                  <span
                      v-for="c in productChars(it.product)"
                      :key="c.id || c.type || c.name || c.value"
                      class="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-700"
                  >
                    {{ charLabel(c) }}
                  </span>
              </div>
            </div>
          </td>

          <td class="px-4 py-2 text-right">
            <input
                type="number"
                min="0"
                step="0.001"
                v-model.number="it.qty"
                class="border border-gray-300 rounded-xl px-3 py-2 w-40 text-right"
            />
          </td>

          <td class="px-4 py-2 text-right">
            <select v-model="it.measure" class="border border-gray-300 rounded-xl px-3 py-2 w-40">
              <option v-for="u in measureUnitsFor(it.product)" :key="u" :value="u">{{ $t(u) }}</option>
            </select>
          </td>

          <!-- Periodicity controls -->
          <td class="px-4 py-2">
            <label class="inline-flex items-center gap-2 text-xs text-slate-700">
              <input type="checkbox" v-model="it.periodicity.recurring" />
              Պարբերական
            </label>
            <div class="flex flex-wrap items-center gap-2">

              <template v-if="it.periodicity.recurring">
                <span class="text-xs text-slate-500">Յուրաքանչյուր</span>
                <input type="number" step="0.1" min="0.1"
                       class="w-20 px-2 py-1 border rounded"
                       v-model.number="it.periodicity.recurring_per_month_qty" />
                <span class="text-xs text-slate-500">ամիսը</span>

                <input type="number" step="0.1" min="0.1"
                       class="w-20 px-2 py-1 border rounded"
                       v-model.number="it.periodicity.recurring_qty" />
                <span class="text-xs text-slate-500">անգամ</span>

                <span class="text-xs text-slate-500">մինչև</span>
                <input type="number" step="0.1" min="0.1"
                       class="w-24 px-2 py-1 border rounded"
                       v-model.number="it.periodicity.recurring_deadline_month_qty" />
                <span class="text-xs text-slate-500">ամիս</span>
              </template>
            </div>
            <p v-if="it.periodicity.recurring && !validPeriodicity(it.periodicity)"
               class="mt-1 text-[11px] text-rose-600">
              Վերջնաժամկետը պետք է լինի ընտրված «ամիս»-ի ամբողջական բազմապատիկը
              {{ multiplesExample(it.periodicity.recurring_per_month_qty) }}
              և ≥ ընտրված ամիսը։
            </p>
          </td>

          <td class="px-4 py-2 text-right">
            <div v-if="it.status === 'pending'" class="flex items-center gap-2 justify-end">
              <!-- Update (edit mode only) -->
              <button
                  v-if="isEdit"
                  class="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  :disabled="prodUpdatingUid===it.uid || (it.periodicity.recurring && !validPeriodicity(it.periodicity))"
                  @click="onUpdateProductRow(it)"
              >
                <span v-if="prodUpdatingUid===it.uid">Թարմացնում…</span>
                <span v-else>Թարմացնել</span>
              </button>

              <!-- Delete -->
              <button
                  class="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                  :disabled="prodDeletingUid===it.uid"
                  @click="onDeleteProductRow(i)"
              >
                <span v-if="prodDeletingUid===it.uid">Ջնջում…</span>
                <span v-else>Ջնջել</span>
              </button>
            </div>
          </td>
        </tr>

        <tr v-if="form.products.length===0">
          <td colspan="6" class="px-4 py-6 text-center text-gray-500">
            Ավելացրեք ապրանք վերևի որոնմամբ կամ ստեղծելով նորը
          </td>
        </tr>
        </tbody>
      </table>

      <div v-if="prodFlash"
           :class="[
       'px-4 py-2 text-sm border-t',
       prodFlashType==='success'
         ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
         : 'text-rose-600 bg-rose-50 border-rose-200'
     ]">
        {{ prodFlash }}
      </div>
    </div>

    <!-- Offerings -->
    <div class="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div class="flex items-center justify-between p-4 border-b">
        <div class="flex flex-col gap-y-2">
          <div class="font-medium">Աշխատանք / Ծառայություն</div>
          <input
              ref="offSearchInput"
              v-model="offSearch.query"
              @focus="openOffDd()"
              @input="onOffQuery(); openOffDd()"
              placeholder="Փնտրել Աշխատանք / Ծառայություն"
              class="border border-gray-300 rounded-xl px-3 py-2 w-[360px]"
          />
        </div>
        <div v-if="initialStatus !== 'send_to_supplier'" class="flex items-center gap-2">
          <button
              class="px-3 py-2 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              @click="openNewOfferingModal"
          >
            Նոր Աշխատանք / Ծառայություն +
          </button>
        </div>
      </div>

      <table class="min-w-full text-sm">
        <thead class="bg-gray-50">
        <tr>
          <th class="px-4 py-3 text-left w-[160px]">Կարգավիճակ</th>
          <th class="px-4 py-3 text-left w-[160px]">Տիպ</th>
          <th class="px-4 py-3 text-left w-[360px]">Անվանում (տեսակ)</th>
          <th class="px-4 py-3 text-left">Նկարագրություն</th>
          <th class="px-4 py-3 text-right w-[120px]">Քանակ</th>
          <th class="px-4 py-3 text-left w-[360px]">Պարբերականություն</th>
          <th class="px-4 py-3 w-[1%]"></th>
        </tr>
        </thead>

        <tbody>
        <tr v-for="(it,i) in form.offerings" :key="it.uid" class="bg-white border-b border-gray-200">
          <td class="px-4 py-2">
            <span class="px-2 py-0.5 rounded text-xs" :class="itemStatusClass(it.status)">
              {{ itemStatusLabel(it.status) }}
            </span>
          </td>
          <td class="px-4 py-2">
              <span
                  class="px-2 py-0.5 rounded text-xs"
                  :class="it.offering?.block==='work' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'"
              >
                {{ it.offering?.block === 'work' ? 'Աշխատանք' : 'Ծառայություն' }}
              </span>
          </td>
          <td class="px-4 py-2">
            <div class="font-medium">{{ it.offering?.name }}</div>
            <div class="text-xs text-gray-500 mt-0.5" v-if="it.offering?.type?.name || it.offering?.type_name">
              Տեսակ՝ {{ it.offering?.type?.name || it.offering?.type_name }}
            </div>
          </td>
          <td class="px-4 py-2">
            <div v-if="it._expanded || !tooLong(it.offering?.description)">
              <span class="text-gray-700">{{ it.offering?.description || '—' }}</span>
            </div>
            <div v-else>
              <span class="text-gray-700">{{ truncate(it.offering?.description, 120) }}</span>
              <button class="ml-2 text-indigo-700 hover:underline" @click="it._expanded=true">Դիտել ավելի</button>
            </div>
          </td>
          <td class="px-4 py-2 text-right">
            <input
                type="number"
                min="1"
                step="1"
                v-model.number="it.qty"
                class="border border-gray-300 rounded-xl px-3 py-2 w-24 text-right"
            />
          </td>

          <!-- Periodicity controls -->
          <td class="px-4 py-2">
            <label class="inline-flex items-center gap-2 text-xs text-slate-700">
              <input type="checkbox" v-model="it.periodicity.recurring" />
              Պարբերական
            </label>
            <div class="flex flex-wrap items-center gap-2">

              <template v-if="it.periodicity.recurring">
                <span class="text-xs text-slate-500">Յուրաքանչյուր</span>
                <input type="number" step="0.1" min="0.1"
                       class="w-20 px-2 py-1 border rounded"
                       v-model.number="it.periodicity.recurring_per_month_qty" />
                <span class="text-xs text-slate-500">ամիսը</span>

                <input type="number" step="0.1" min="0.1"
                       class="w-20 px-2 py-1 border rounded"
                       v-model.number="it.periodicity.recurring_qty" />
                <span class="text-xs text-slate-500">անգամ</span>

                <span class="text-xs text-slate-500">մինչև</span>
                <input type="number" step="0.1" min="0.1"
                       class="w-24 px-2 py-1 border rounded"
                       v-model.number="it.periodicity.recurring_deadline_month_qty" />
                <span class="text-xs text-slate-500">ամիս</span>
              </template>
            </div>
            <p v-if="it.periodicity.recurring && !validPeriodicity(it.periodicity)"
               class="mt-1 text-[11px] text-rose-600">
              Վերջնաժամկետը պետք է լինի ընտրված «ամիս»-ի ամբողջական բազմապատիկը
              {{ multiplesExample(it.periodicity.recurring_per_month_qty) }}
              և ≥ ընտրված ամիսը։
            </p>
          </td>

          <td class="px-4 py-2 text-right">
            <div v-if="it.status === 'pending'" class="flex items-center gap-2 justify-end">
              <!-- Update (edit mode only) -->
              <button
                  v-if="isEdit"
                  class="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  :disabled="offUpdatingUid===it.uid || (it.periodicity.recurring && !validPeriodicity(it.periodicity))"
                  @click="onUpdateOfferingRow(it)"
              >
                <span v-if="offUpdatingUid===it.uid">Թարմացնում…</span>
                <span v-else>Թարմացնել</span>
              </button>

              <!-- Delete -->
              <button
                  class="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                  :disabled="offDeletingUid===it.uid"
                  @click="onDeleteOfferingRow(i)"
              >
                <span v-if="offDeletingUid===it.uid">Ջնջում…</span>
                <span v-else>Ջնջել</span>
              </button>
            </div>
          </td>
        </tr>

        <tr v-if="form.offerings.length===0">
          <td colspan="7" class="px-4 py-6 text-center text-gray-500">
            Ավելացրեք աշխատանք/ծառայություն վերևի որոնմամբ կամ ստեղծելով նորը
          </td>
        </tr>
        </tbody>
      </table>

      <div v-if="offFlash"
           :class="[
       'px-4 py-2 text-sm border-t',
       offFlashType==='success'
         ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
         : 'text-rose-600 bg-rose-50 border-rose-200'
     ]">
        {{ offFlash }}
      </div>
    </div>

    <!-- Footer: Initial status + actions (only in create mode) -->
    <div v-if="!isEdit" class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <label class="text-sm text-gray-600">Սկզբնական կարգավիճակ</label>
        <select
            v-model="selectedStatus"
            class="border border-gray-300 rounded-xl px-3 py-2"
            :disabled="!canChooseStatus"
        >
          <option v-for="opt in allowedStatusOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
        <span v-if="!canChooseStatus" class="text-xs text-gray-400">(Տվյալ դերակատարի համար անջատված)</span>
      </div>

      <div class="flex items-center gap-2">
        <button class="px-3 py-2 rounded-xl border hover:bg-gray-50" @click="resetForm">Մաքրել ձևը</button>
        <button
            class="px-4 py-2 rounded-xl bg-indigo-900 text-white hover:bg-indigo-800 disabled:opacity-50"
            :disabled="submitLoading || !canSubmitActor || !allPeriodicityValid"
            @click="submit"
        >
          <span v-if="!submitLoading">Պահպանել հայտը</span>
          <span v-else>Պահպանում…</span>
        </button>
      </div>
    </div>

    <p v-if="submitError" class="text-red-600 text-sm">{{ submitError }}</p>
    <p v-if="submitSuccess" class="text-emerald-600 text-sm">Հայտը հաջողությամբ պահպանվեց։</p>
  </div>

  <!-- Teleported dropdowns -->
  <Teleport to="body">
    <div
        v-if="prodSearch.open && !(productModal && productModal.open)"
        class="product-dd fixed z-[4000] bg-white/95 backdrop-blur border border-gray-200 rounded-xl shadow-2xl max-h-72 overflow-auto"
        :style="{ top: prodSearch.ddTop+'px', left: prodSearch.ddLeft+'px', width: Math.max(420, prodSearch.ddWidth)+'px' }"
        @mouseenter="hoveringDd = true" @mouseleave="hoveringDd = false"
    >
      <div class="px-3 py-2 text-[11px] text-gray-500 border-b bg-gray-50 sticky top-0">Գտնված արդյունքներ</div>
      <div
          v-for="p in prodSearch.options"
          :key="p.id"
          class="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
          @mousedown.prevent="addRowFromProduct(p); prodSearch.open=false; prodSearch.query=''"
      >
        <div class="flex items-center justify-between">
          <div class="font-medium truncate">{{ p.name }}</div>
          <div class="ml-2 shrink-0 text-xs text-gray-500" v-if="p.sku || p.slug">{{ p.sku ?? p.slug }}</div>
        </div>
        <div class="mt-1 flex flex-wrap items-center gap-1">
          <span v-if="p.type?.group?.name || p.group_name"
                class="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700">
            {{ p.type?.group?.name || p.group_name }}
          </span>
          <span v-if="p.type?.name || p.type_name"
                class="text-[11px] px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
            {{ p.type?.name || p.type_name }}
          </span>
          <span v-if="p.measure_type" class="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
            {{ $t(p.measure_type ?? 'piece') }}
          </span>
        </div>
        <div v-if="Array.isArray(p.characteristics) && p.characteristics.length" class="mt-1 flex flex-wrap gap-1">
          <span
              v-for="c in p.characteristics"
              :key="c.id || c.type || c.name"
              class="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-700"
          >
            <template v-if="c.type && c.value">{{ c.type }}: {{ c.value }}</template>
            <template v-else>{{ c.name }}</template>
          </span>
        </div>
      </div>
      <div v-if="!prodSearch.loading && prodSearch.options.length===0" class="px-3 py-3 text-sm text-gray-500">Արդյունք
        չկա
      </div>
      <div v-if="prodSearch.loading" class="px-3 py-3 text-sm text-gray-500">Փնտրում է…</div>
    </div>
  </Teleport>

  <Teleport to="body">
    <div
        v-if="offSearch.open && !(offModal && offModal.open)"
        class="fixed z-[4000] bg-white/95 backdrop-blur border border-gray-200 rounded-xl shadow-2xl max- h-72 overflow-auto product-dd"
        :style="{ top: offSearch.ddTop+'px', left: offSearch.ddLeft+'px', width: Math.max(420, offSearch.ddWidth)+'px' }"
        @mouseenter="hoveringDd = true" @mouseleave="hoveringDd = false"
    >
      <div class="px-3 py-2 text-[11px] text-gray-500 border-b bg-gray-50 sticky top-0">Գտնված արդյունքներ</div>
      <div
          v-for="o in offSearch.options"
          :key="o.id"
          class="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
          @mousedown.prevent="addRowFromOffering(o); offSearch.open=false; offSearch.query=''"
      >
        <div class="flex items-center justify_between">
          <div class="font-medium truncate">{{ o.name }}</div>
          <div class="text-xs text-gray-500 ml-2">{{ o.block === 'work' ? 'Աշխատանք' : 'Ծառայություն' }}</div>
        </div>
        <div class="mt-1 text-xs text-gray-500" v-if="o.type?.name || o.type_name">
          Տեսակ՝ {{ o.type?.name || o.type_name }}
        </div>
        <div class="mt-1 text-xs text-gray-500" v-if="o.description">
          {{ truncate(o.description, 100) }}
        </div>
      </div>
      <div v-if="!offSearch.loading && offSearch.options.length===0" class="px-3 py-3 text-sm text-gray-500">Արդյունք
        չկա
      </div>
      <div v-if="offSearch.loading" class="px-3 py-3 text-sm text-gray-500">Փնտրում է…</div>
    </div>
  </Teleport>

  <!-- Modals -->
  <NewProductModal
      :open="productModal.open"
      :measure-units="measure_units"
      @close="productModal.open=false"
      @created="onProductCreated"
  />
  <NewOfferingModal :open="offModal.open" @close="offModal.open=false" @created="onOfferingCreated"/>
</template>

<script setup lang="ts">
import {ref, reactive, computed, onMounted, onBeforeUnmount} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {suppliersApplicationsApi, productsApi, offeringsApi, authApi} from '@/api.js'
import NewProductModal from '@/views/product/components/NewProduct.vue'
import NewOfferingModal from '@/views/offering/components/NewOffering.vue'

/* Router / edit mode */
const route = useRoute()
const router = useRouter()
const appId = computed(() => Number(route.params.id || 0))
const isEdit = computed(() => !!appId.value)
const ITEM_STATUS_LABELS: Record<string, string> = {
  pending: 'Սպասման մեջ',
  approved: 'Հաստատված',
  cancelled: 'Չեղարկված',
  rejected: 'Մերժված',
  written_off: 'Դուրս գրված',
}

function itemStatusLabel(s?: string) {
  const v = String(s || '').toLowerCase()
  return ITEM_STATUS_LABELS[v] || s || '—'
}

function itemStatusClass(s?: string) {
  const v = String(s || '').toLowerCase()
  if (v === 'approved') return 'bg-emerald-100 text-emerald-700'
  if (v === 'rejected') return 'bg-amber-100 text-amber-700'
  if (v === 'cancelled') return 'bg-rose-100 text-rose-700'
  if (v === 'written_off') return 'bg-indigo-100 text-indigo-700'
  return 'bg-slate-100 text-slate-700' // pending & default
}

function goBack() {
  router.back()
}

/* Flash helpers */
const prodFlash = ref('')
const offFlash = ref('')
const prodFlashType = ref<'success' | 'error'>('error')
const offFlashType = ref<'success' | 'error'>('error')
let flashTimer: any = null

function setFlash(scope: 'prod' | 'off', msg: string, kind: 'success' | 'error' = 'error') {
  if (flashTimer) clearTimeout(flashTimer)
  if (scope === 'prod') {
    prodFlash.value = msg;
    prodFlashType.value = kind
  } else {
    offFlash.value = msg;
    offFlashType.value = kind
  }
  flashTimer = setTimeout(() => {
    prodFlash.value = '';
    offFlash.value = ''
  }, 2500)
}

/* Modals */
const productModal = reactive({open: false})
const offModal = reactive({open: false})

function openNewProductModal() {
  closeAllDd();
  productModal.open = true
}

async function onProductCreated(p: any) {
  await addRowFromProduct(p);
  productModal.open = false
}

function openNewOfferingModal() {
  closeAllDd();
  offModal.open = true
}

async function onOfferingCreated(o: any) {
  await addRowFromOffering(o);
  offModal.open = false
}

/* Global product search */
const prodSearchInput = ref<HTMLInputElement | null>(null)
const prodSearch = reactive({
  query: '',
  options: [] as any[],
  loading: false,
  open: false,
  ddTop: 0,
  ddLeft: 0,
  ddWidth: 420
})
const hoveringDd = ref(false)
let onScrollHandler: any = null

function openGlobalProductDd() {
  const el = prodSearchInput.value as HTMLElement | null
  if (!el) return
  const r = el.getBoundingClientRect()
  prodSearch.ddTop = Math.round(r.bottom + window.scrollY)
  prodSearch.ddLeft = Math.round(r.left + window.scrollX)
  prodSearch.ddWidth = Math.round(r.width)
  prodSearch.open = true
}

async function onGlobalProductQuery() {
  prodSearch.loading = true
  try {
    prodSearch.options = await productsApi.search({search: prodSearch.query, limit: 15, is_own: 0}) || []
  } finally {
    prodSearch.loading = false;
    prodSearch.open = true
  }
}

function closeAllDd() {
  prodSearch.open = false;
  offSearch.open = false
}

/* Form */
const measure_units = [
  {key: 'piece', name: 'հատ'},
  {key: 'weight', name: 'քաշ'},
  {key: 'length', name: 'երկարություն'},
  {key: 'capacity', name: 'ծավալ'},
]

type Periodicity = {
  recurring: boolean;
  recurring_per_month_qty: number;
  recurring_qty: number;
  recurring_deadline_month_qty: number;
};

type Product = {
  id: number; name: string; sku?: string | null; slug?: string | null;
  measure_type?: 'piece' | 'capacity' | 'weight' | 'length';
  status?: string; group_name?: string; type_name?: string; group?: any; type?: any;
  characteristics?: any[]; characteristic_ids?: any[];
}
type Offering = {
  id: number;
  name: string;
  block: 'service' | 'work';
  type?: any;
  type_name?: string;
  status?: string;
  description?: string
}

const actor = ref<any>(null)

const form = reactive({
  department_id: undefined as number | undefined,
  products: [] as Array<{
    uid: string;
    status?: string;
    row_id?: number | null;
    product: Product | null;
    qty: number;
    measure: string;
    periodicity: Periodicity;
  }>,
  offerings: [] as Array<{
    uid: string;
    status?: string;
    row_id?: number | null;
    offering: Offering | null;
    qty: number;
    _expanded?: boolean;
    periodicity: Periodicity;
  }>,
})

/* Periodicity helpers + validation */
function defaultPeriodicity(): Periodicity {
  return { recurring: false, recurring_per_month_qty: 1, recurring_qty: 1, recurring_deadline_month_qty: 1 }
}

function validPeriodicity(p: Periodicity): boolean {
  if (!p?.recurring) return true;
  const em = Number(p.recurring_per_month_qty);
  const dl = Number(p.recurring_deadline_month_qty);
  const times = Number(p.recurring_qty);
  if (!(em > 0 && dl > 0 && times > 0)) return false;
  if (dl + 1e-9 < em) return false;
  const ratio = dl / em;
  // dl must be an integer multiple of em (allowing floating em)
  return Math.abs(ratio - Math.round(ratio)) < 1e-9;
}

function multiplesExample(em: number, howMany = 3): string {
  const x = Number(em);
  if (!(x > 0)) return '';
  const arr = Array.from({ length: howMany }, (_, i) => (i + 1) * x);
  return `(օր․ ${formatNumber(x, { maximumFractionDigits: 6 })} → ${arr
      .map(v => formatNumber(v, { maximumFractionDigits: 6 }))
      .join(', ')} …)`;
}

function mapPeriodicityFromApi(r: any): Periodicity {
  const toNum = (v: any) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : NaN;
  };
  const recurring =
      r?.recurring === true ||
      r?.recurring === 1 ||
      r?.recurring === '1';

  if (!recurring) return defaultPeriodicity();

  const every = toNum(r?.recurring_per_month_qty);
  const times = toNum(r?.recurring_qty);
  const deadline = toNum(r?.recurring_deadline_month_qty);

  return {
    recurring: true,
    recurring_per_month_qty: Number.isFinite(every) && every > 0 ? every : 1,
    recurring_qty: Number.isFinite(times) && times > 0 ? times : 1,
    recurring_deadline_month_qty: Number.isFinite(deadline) && deadline > 0
        ? deadline
        : (Number.isFinite(every) && every > 0 ? every : 1),
  };
}

const allPeriodicityValid = computed(() => {
  const pOK = form.products.every(it => validPeriodicity(it.periodicity));
  const oOK = form.offerings.every(it => validPeriodicity(it.periodicity));
  return pOK && oOK;
});

function existsProduct(id: number) {
  return form.products.some(r => Number(r.product?.id) === Number(id) && r.status === 'pending')
}

function existsOffering(id: number) {
  return form.offerings.some(r => Number(r.offering?.id) === Number(id) && r.status === 'pending')
}

/* Row loading flags */
const prodUpdatingUid = ref<string | null>(null)
const prodDeletingUid = ref<string | null>(null)
const offUpdatingUid = ref<string | null>(null)
const offDeletingUid = ref<string | null>(null)

/* Add product row (create vs edit) */
async function addRowFromProduct(p: Product) {
  if (existsProduct(p.id)) {
    setFlash('prod', 'Այս ապրանքն արդեն ավելացված է ցանկում');
    return
  }
  const base = {
    uid: crypto.randomUUID(),
    product: p,
    qty: 1,
    status: 'pending',
    measure: measureUnitsFor(p)[0],
    periodicity: defaultPeriodicity(),
  }

  if (!isEdit.value) {
    form.products.push({...base, row_id: null})
    return
  }

  // persist immediately in edit mode
  try {
    prodUpdatingUid.value = base.uid
    const created = await suppliersApplicationsApi.addProductRow(appId.value, {
      product_id: base.product.id,
      qty: base.qty,
      measure: base.measure,
      recurring: {
        recurring: !!base.periodicity.recurring,
        recurring_per_month_qty: Number(base.periodicity.recurring_per_month_qty),
        recurring_qty: Number(base.periodicity.recurring_qty),
        recurring_deadline_month_qty: Number(base.periodicity.recurring_deadline_month_qty),
      }
    })
    const row = created?.data ?? created
    form.products.push(mapApiProductRow(row))
  } catch (e: any) {
    setFlash('prod', e?.response?.data?.message || 'Չհաջողվեց ավելացնել ապրանքը')
  } finally {
    if (prodUpdatingUid.value === base.uid) prodUpdatingUid.value = null
  }
}

/* Update & delete product row (edit mode) */
async function onUpdateProductRow(it: any) {
  if (!isEdit.value) return
  if (!it?.row_id) {
    setFlash('prod', 'Տողը դեռ պահպանված չէ');
    return
  }
  if (it.periodicity.recurring && !validPeriodicity(it.periodicity)) {
    setFlash('prod', 'Սխալ պարբերականություն');
    return;
  }
  prodUpdatingUid.value = it.uid
  try {
    const updated = await suppliersApplicationsApi.updateProductRow(appId.value, it.row_id, {
      qty: it.qty,
      product_id: it.product.id,
      measure: it.measure,
      recurring: {
        recurring: !!it.periodicity.recurring,
        recurring_per_month_qty: Number(it.periodicity.recurring_per_month_qty),
        recurring_qty: Number(it.periodicity.recurring_qty),
        recurring_deadline_month_qty: Number(it.periodicity.recurring_deadline_month_qty),
      }
    })
    // optional: sync with server response
    if (updated?.data) {
      const mapped = mapApiProductRow(updated.data)
      it.qty = mapped.qty
      it.measure = mapped.measure
      it.periodicity = mapped.periodicity
    }
    setFlash('prod', 'Պահպանված է', 'success')
  } catch (e: any) {
    setFlash('prod', e?.response?.data?.message || 'Չհաջողվեց թարմացնել տողը')
  } finally {
    prodUpdatingUid.value = null
  }
}

async function onDeleteProductRow(i: number) {
  const it = form.products[i]
  if (!it) return
  if (!isEdit.value || !it.row_id) {
    form.products.splice(i, 1)
    return
  }
  if (!confirm('Ջնջե՞լ ապրանքի տողը։')) return
  prodDeletingUid.value = it.uid
  try {
    await suppliersApplicationsApi.deleteProductRow(appId.value, it.row_id)
    it.status = 'cancelled';
  } catch (e: any) {
    setFlash('prod', e?.response?.data?.message || 'Չհաջողվեց ջնջել տողը')
  } finally {
    prodDeletingUid.value = null
  }
}

function measureUnitsFor(p: Product | null) {
  const map: any = {piece: ['piece', 'pack'], weight: ['kg', 'g', 'tonn'], length: ['m', 'cm'], capacity: ['l', 'ml']}
  return map[p?.measure_type || 'piece'] || ['piece']
}

function productChars(p: any) {
  const a = Array.isArray(p?.characteristics) ? p.characteristics : []
  const b = Array.isArray(p?.characteristic_ids) ? p.characteristic_ids : []
  return a.length ? a : b
}

function charLabel(c: any) {
  return (c?.type && c?.value) ? `${c.type}: ${c.value}` : (c?.name ?? String(c ?? ''))
}

/* Offerings header search */
const offSearchInput = ref<HTMLInputElement | null>(null)
const offSearch = reactive({
  query: '',
  options: [] as any[],
  loading: false,
  open: false,
  ddTop: 0,
  ddLeft: 0,
  ddWidth: 420
})

function openOffDd() {
  const el = offSearchInput.value as HTMLElement | null
  if (!el) return
  const r = el.getBoundingClientRect()
  offSearch.ddTop = Math.round(r.bottom + window.scrollY)
  offSearch.ddLeft = Math.round(r.left + window.scrollX)
  offSearch.ddWidth = Math.round(r.width)
  offSearch.open = true
}

async function onOffQuery() {
  offSearch.loading = true;
  try {
    offSearch.options = await offeringsApi.search({search: offSearch.query, limit: 15}) || []
  } finally {
    offSearch.loading = false;
    offSearch.open = true
  }
}

/* Add offering row (create vs edit) */
async function addRowFromOffering(o: any) {
  if (existsOffering(o.id)) {
    setFlash('off', 'Այս աշխատանքը/ծառայությունը արդեն ավելացված է ցանկում');
    return
  }
  const base = {uid: crypto.randomUUID(), offering: o, qty: 1, _expanded: false, status: 'pending', periodicity: defaultPeriodicity()}

  if (!isEdit.value) {
    form.offerings.push({...base, row_id: null})
    return
  }

  try {
    offUpdatingUid.value = base.uid
    const created = await suppliersApplicationsApi.addOfferingRow(appId.value, {
      offering_id: base.offering.id,
      qty: base.qty,
      status: 'pending',
      recurring: {
        recurring: !!base.periodicity.recurring,
        recurring_per_month_qty: Number(base.periodicity.recurring_per_month_qty),
        recurring_qty: Number(base.periodicity.recurring_qty),
        recurring_deadline_month_qty: Number(base.periodicity.recurring_deadline_month_qty),
      }
    })
    const row = created?.data ?? created
    form.offerings.push(mapApiOfferingRow(row))
  } catch (e: any) {
    setFlash('off', e?.response?.data?.message || 'Չհաջողվեց ավելացնել աշխատանք/ծառայություն')
  } finally {
    if (offUpdatingUid.value === base.uid) offUpdatingUid.value = null
  }
}

/* Update & delete offering row (edit mode) */
async function onUpdateOfferingRow(it: any) {
  if (!isEdit.value) return
  if (!it?.row_id) {
    setFlash('off', 'Տողը դեռ պահպանված չէ');
    return
  }
  if (it.periodicity.recurring && !validPeriodicity(it.periodicity)) {
    setFlash('off', 'Սխալ պարբերականություն');
    return;
  }
  offUpdatingUid.value = it.uid
  try {
    const updated = await suppliersApplicationsApi.updateOfferingRow(appId.value, it.row_id, {
      qty: it.qty,
      offering_id: it.offering.id,
      recurring: {
        recurring: !!it.periodicity.recurring,
        recurring_per_month_qty: Number(it.periodicity.recurring_per_month_qty),
        recurring_qty: Number(it.periodicity.recurring_qty),
        recurring_deadline_month_qty: Number(it.periodicity.recurring_deadline_month_qty),
      }
    })
    if (updated?.data) {
      const mapped = mapApiOfferingRow(updated.data)
      it.qty = mapped.qty
      it.periodicity = mapped.periodicity
    }
    setFlash('off', 'Պահպանված է', 'success')
  } catch (e: any) {
    setFlash('off', e?.response?.data?.message || 'Չհաջողվեց թարմացնել տողը')
  } finally {
    offUpdatingUid.value = null
  }
}

async function onDeleteOfferingRow(i: number) {
  const it = form.offerings[i]
  if (!it) return
  if (!isEdit.value || !it.row_id) {
    form.offerings.splice(i, 1)
    return
  }
  if (!confirm('Ջնջե՞լ աշխատանք/ծառայություն տողը։')) return
  offDeletingUid.value = it.uid
  try {
    await suppliersApplicationsApi.deleteOfferingRow(appId.value, it.row_id)
    it.status = 'cancelled';
  } catch (e: any) {
    setFlash('off', e?.response?.data?.message || 'Չհաջողվեց ջնջել տողը')
  } finally {
    offDeletingUid.value = null
  }
}

/* Trunc helpers */
function truncate(s?: string, n = 120) {
  if (!s) return '';
  return s.length > n ? s.slice(0, n) + '…' : s
}

function tooLong(s?: string) {
  return !!s && s.length > 120
}

/* Actor + status rules (create mode) */
const actorKind = computed(() => String(actor.value?.kind || ''))

const STATUS_LABELS: Record<string, string> = {
  draft: 'Սևագիր',
  send_to_approve: 'Ուղարկել հաստատման',
  send_to_supplier: 'Ուղարկել մատակարարին',
}
const allowedStatusValues = computed<string[]>(() => {
  if (actorKind.value === 'department_staff') return ['draft', 'send_to_approve']
  if (actorKind.value === 'department_leader') return ['draft', 'send_to_supplier']
  return ['draft']
})
const allowedStatusOptions = computed(() => allowedStatusValues.value.map(v => ({
  value: v,
  label: STATUS_LABELS[v] || v
})))
const selectedStatus = ref<string>('draft')
const canChooseStatus = computed(() => ['department_staff', 'department_leader'].includes(actorKind.value))
const canSubmitActor = computed(() => ['department_staff', 'department_leader'].includes(actorKind.value))

/* Header status label (edit mode) */
const initialStatus = ref<string>('') // also used below
const headerStatusLabel = computed(() => STATUS_LABELS[String(initialStatus.value)] || String(initialStatus.value || ''))

/* Submit (create) */
const submitLoading = ref(false)
const submitError = ref('')
const submitSuccess = ref(false)

function formatNumber(
    value: any,
    { maximumFractionDigits = 6, minimumFractionDigits = 0, locale = 'en-US' } = {}
): string {
  if (value === null || value === undefined || value === '') return '';
  const num = typeof value === 'string' ? Number(value) : value;
  if (!isFinite(num)) return String(value);
  return new Intl.NumberFormat(locale, { maximumFractionDigits, minimumFractionDigits, useGrouping: false }).format(num);
}

async function submit() {
  submitError.value = ''
  submitSuccess.value = false

  if (!form.department_id) {
    submitError.value = 'Ընտրեք ստորաբաժանումը'
    return
  }
  if (!allowedStatusValues.value.includes(selectedStatus.value)) {
    submitError.value = 'Այս կարգավիճակը հասանելի չէ Ձեր դերակատարի համար'
    return
  }

  if (!allPeriodicityValid.value) {
    submitError.value = 'Պարբերականության դաշտերը սխալ են լրացված'
    return
  }

  const productItems = form.products
      .filter(p => p.product && p.qty > 0)
      .map(p => ({
        product_id: p.product!.id,
        qty: p.qty,
        measure: p.measure,
        // ⬇️ periodicity info included per row
        recurring: {
          recurring: !!p.periodicity.recurring,
          recurring_per_month_qty: Number(p.periodicity.recurring_per_month_qty),
          recurring_qty: Number(p.periodicity.recurring_qty),
          recurring_deadline_month_qty: Number(p.periodicity.recurring_deadline_month_qty),
        }
      }))

  const offeringItems = form.offerings
      .filter(o => o.offering && o.qty > 0)
      .map(o => ({
        offering_id: o.offering!.id,
        qty: o.qty,
        // ⬇️ periodicity info included per row
        recurring: {
          recurring: !!o.periodicity.recurring,
          recurring_per_month_qty: Number(o.periodicity.recurring_per_month_qty),
          recurring_qty: Number(o.periodicity.recurring_qty),
          recurring_deadline_month_qty: Number(o.periodicity.recurring_deadline_month_qty),
        }
      }))

  if (!productItems.length && !offeringItems.length) {
    submitError.value = 'Ավելացրեք ապրանք կամ առաջարկ'
    return
  }

  submitLoading.value = true
  try {
    await suppliersApplicationsApi.create({
      department_id: form.department_id,
      status: selectedStatus.value,
      products: productItems,
      offerings: offeringItems,
    })
    submitSuccess.value = true
    resetForm()
  } catch (e: any) {
    submitError.value = e?.response?.data?.message || 'Չհաջողվեց պահպանել'
  } finally {
    submitLoading.value = false
  }
}

function resetForm() {
  form.products = []
  form.offerings = []
  selectedStatus.value = allowedStatusValues.value[0] || 'draft'
  prodSearch.query = ''
  prodSearch.open = false
  offSearch.query = ''
  offSearch.open = false
  prodFlash.value = ''
  offFlash.value = ''
}

/* Map API rows -> UI rows (edit mode) */
function mapApiProductRow(r: any) {
  const p = r.product || {}
  const type = p.type || {}
  const group = type.group || {}
  return {
    uid: crypto.randomUUID(),
    row_id: Number(r.id),
    status: r.status,
    product: {
      id: p.id, name: p.name, sku: p.sku, slug: p.slug,
      measure_type: p.measure_type,
      type: {...type, group},
      characteristics: p.characteristics || [],
      characteristic_ids: p.characteristic_ids || [],
    },
    qty: Number(r.qty || 1),
    measure: String(r.measure || (measureUnitsFor(p)[0] || 'piece')),
    periodicity: mapPeriodicityFromApi(r),
  }
}

function mapApiOfferingRow(r: any) {
  const o = r.offering || {}
  return {
    uid: crypto.randomUUID(),
    row_id: Number(r.id),
    status: r.status,
    offering: {
      id: o.id, name: o.name, block: o.block,
      type: o.type || {},
      description: o.description || '',
    },
    qty: Number(r.qty || 1),
    _expanded: false,
    periodicity: mapPeriodicityFromApi(r),
  }
}

/* Load actor + (optional) existing app */
async function loadActor() {
  try {
    actor.value = await authApi.getActor()
  } catch {
    actor.value = null
  }

  const kind = String(actor.value?.kind || '')
  if (kind !== 'superadmin') {
    const a = actor.value || {}
    form.department_id =
        Number(a.department_id) ||
        Number(a?.department?.id) ||
        Number((Array.isArray(a.department_ids) && a.department_ids[0])) ||
        form.department_id
  }
  selectedStatus.value = allowedStatusValues.value[0] || 'draft'
}

let identification_number: string | null = null;

async function loadForEdit() {
  if (!isEdit.value) return
  try {
    const app = await suppliersApplicationsApi.get(appId.value)
    initialStatus.value = String(app?.status || '')

    const prodRows = Array.isArray(app?.products) ? app.products : []
    form.products = prodRows.map((r: any) => mapApiProductRow(r))
    identification_number = app.identification_number;
    const offRows = Array.isArray(app?.offerings) ? app.offerings : []
    form.offerings = offRows.map((r: any) => mapApiOfferingRow(r))
  } catch (e: any) {
    console.error('Failed to load application', e)
  }
}

/* Lifecycle */
onMounted(async () => {
  onScrollHandler = (e: Event) => {
    const t = e.target as HTMLElement | null
    if (t && (t.closest && t.closest('.product-dd'))) return
    if (hoveringDd.value) return
    closeAllDd()
  }
  window.addEventListener('scroll', onScrollHandler, true)
  window.addEventListener('resize', closeAllDd)

  await loadActor()
  await loadForEdit()
})
onBeforeUnmount(() => {
  if (onScrollHandler) window.removeEventListener('scroll', onScrollHandler, true)
  window.removeEventListener('resize', closeAllDd)
})
</script>
