<!-- src/views/purchasing/components/application/NewApplication.vue -->
<template>
  <div class="flex flex-col gap-y-4 px-4 py-4">
    <!-- Head removed: department/creator block is NOT needed; department comes from actor -->

    <!-- Products -->
    <div class="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div class="flex items-center justify-between p-4 border-b">
        <div class="font-medium">Ապրանքներ</div>
        <button class="px-3 py-2 rounded-xl border hover:bg-gray-50 text-sm" @click="addProductRow">Ավելացնել տող
        </button>
      </div>
      <table class="min-w-full text-sm">
        <thead class="bg-gray-50">
        <tr>
          <th class="px-4 py-3 text-left w-[420px]">Ապրանք</th>
          <th class="px-4 py-3 text-right w-[160px]">Քանակ</th>
          <th class="px-4 py-3 text-right w-[160px]">Չափ</th>
          <th class="px-4 py-3 w-[1%]"></th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="(it,i) in form.products" :key="it.uid" class="bg-white border-b border-gray-200">
          <td class="px-4 py-2">
            <div class="flex gap-2">
              <input
                  v-model="it.query"
                  @input="onProductQuery(it)"
                  placeholder="Անուն / SKU"
                  class="border border-gray-300 rounded-xl px-3 py-2 w-full"
              />
              <div class="relative">
                <button class="px-3 py-2 rounded-xl border hover:bg-gray-50">Ընտրել</button>
                <div v-if="it.open"
                     class="absolute z-10 mt-1 bg-white border rounded-xl w-[420px] max-h-72 overflow-auto shadow">
                  <div
                      v-for="p in it.options"
                      :key="p.id"
                      class="px-3 py-2 hover:bg-gray-50 cursor-pointer"
                      @click="selectProduct(it,p)"
                  >
                    <div class="font-medium">{{ p.name }}</div>
                    <div class="text-xs text-gray-500">{{ p.sku ?? p.slug }}</div>
                  </div>
                  <div v-if="!it.loading && it.options.length===0" class="px-3 py-2 text-sm text-gray-500">Չկա</div>
                  <div v-if="it.loading" class="px-3 py-2 text-sm text-gray-500">Փնտրում է…</div>
                </div>
              </div>
            </div>
            <div class="text-xs text-slate-500 mt-1" v-if="it.product">
              Ընտրված՝ <b>{{ it.product.name }}</b>
            </div>
          </td>

          <td class="px-4 py-2 text-right">
            <input type="number" min="0" step="0.001" v-model.number="it.qty"
                   class="border border-gray-300 rounded-xl px-3 py-2 w-40 text-right"/>
          </td>

          <td class="px-4 py-2 text-right">
            <select v-model="it.measure" class="border border-gray-300 rounded-xl px-3 py-2 w-40">
              <option v-for="u in measureUnitsFor(it.product)" :key="u" :value="u">{{ u }}</option>
            </select>
          </td>

          <td class="px-4 py-2 text-right">
            <button class="px-2 py-1 rounded border hover:bg-gray-50" @click="removeProductRow(i)">Ջնջել</button>
          </td>
        </tr>

        <tr v-if="form.products.length===0">
          <td colspan="4" class="px-4 py-6 text-center text-gray-500">Ավելացրեք գոնե մեկ ապրանք</td>
        </tr>
        </tbody>
      </table>
    </div>

    <!-- Offerings -->
    <div class="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div class="flex items-center justify-between p-4 border-b">
        <div class="font-medium">Աշխատանք / Ծառայություն</div>
        <button class="px-3 py-2 rounded-xl border hover:bg-gray-50 text-sm" @click="addOfferingRow">Ավելացնել տող
        </button>
      </div>
      <table class="min-w-full text-sm">
        <thead class="bg-gray-50">
        <tr>
          <th class="px-4 py-3 text-left w-[420px]">Առաջարկ</th>
          <th class="px-4 py-3 text-right w-[160px]">Քանակ</th>
          <th class="px-4 py-3 w-[1%]"></th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="(it,i) in form.offerings" :key="it.uid" class="bg-white border-b border-gray-200">
          <td class="px-4 py-2">
            <div class="flex gap-2">
              <input
                  v-model="it.query"
                  @input="onOfferingQuery(it)"
                  placeholder="Փնտրել առաջարկ"
                  class="border border-gray-300 rounded-xl px-3 py-2 w-full"
              />
              <div class="relative">
                <button class="px-3 py-2 rounded-xl border hover:bg-gray-50">Ընտրել</button>
                <div v-if="it.open"
                     class="absolute z-10 mt-1 bg-white border rounded-xl w-[420px] max-h-72 overflow-auto shadow">
                  <div
                      v-for="o in it.options"
                      :key="o.id"
                      class="px-3 py-2 hover:bg-gray-50 cursor-pointer"
                      @click="selectOffering(it,o)"
                  >
                    <div class="font-medium">{{ o.name }}</div>
                    <div class="text-xs text-gray-500">{{ o.block }}</div>
                  </div>
                  <div v-if="!it.loading && it.options.length===0" class="px-3 py-2 text-sm text-gray-500">Չկա</div>
                  <div v-if="it.loading" class="px-3 py-2 text-sm text-gray-500">Փնտրում է…</div>
                </div>
              </div>
            </div>
            <div class="text-xs text-slate-500 mt-1" v-if="it.offering">
              Ընտրված՝ <b>{{ it.offering.name }}</b> · {{ it.offering.block }}
            </div>
          </td>

          <td class="px-4 py-2 text-right">
            <input type="number" min="1" step="1" v-model.number="it.qty"
                   class="border border-gray-300 rounded-xl px-3 py-2 w-40 text-right"/>
          </td>

          <td class="px-4 py-2 text-right">
            <button class="px-2 py-1 rounded border hover:bg-gray-50" @click="removeOfferingRow(i)">Ջնջել</button>
          </td>
        </tr>

        <tr v-if="form.offerings.length===0">
          <td colspan="3" class="px-4 py-6 text-center text-gray-500">Ավելացրեք առաջարկ (անհրաժեշտության դեպքում)</td>
        </tr>
        </tbody>
      </table>
    </div>

    <!-- Actions -->
    <div class="flex items-center justify-end gap-2">
      <button class="px-3 py-2 rounded-xl border hover:bg-gray-50" @click="resetForm">Մաքրել ձևը</button>
      <button class="px-4 py-2 rounded-xl bg-indigo-900 text-white hover:bg-indigo-800" :disabled="submitLoading"
              @click="submit">
        <span v-if="!submitLoading">Ստեղծել հայտ</span>
        <span v-else>Պահպանում…</span>
      </button>
    </div>

    <p v-if="submitError" class="text-red-600 text-sm">{{ submitError }}</p>
    <p v-if="submitSuccess" class="text-emerald-600 text-sm">Հայտը հաջողությամբ ստեղծվեց։</p>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive, onMounted} from 'vue'
import {purchasingApi, productsApi, offeringsApi, authApi} from '@/api.js'

type Product = {
  id: number;
  name: string;
  sku?: string | null;
  slug?: string | null;
  measure_type?: 'piece' | 'capacity' | 'weight' | 'length'
}
type Offering = { id: number; name: string; block: 'service' | 'work' }

const actor = ref<any>(null)

const form = reactive({
  storage_id:    undefined as number | undefined,
  department_id: undefined as number | undefined, // ← comes from actor
  products: [] as Array<{
    uid: string;
    product: Product | null;
    query: string;
    options: Product[];
    loading: boolean;
    open: boolean;
    qty: number;
    measure: string
  }>,
  offerings: [] as Array<{
    uid: string;
    offering: Offering | null;
    query: string;
    options: Offering[];
    loading: boolean;
    open: boolean;
    qty: number
  }>,
})

function addProductRow() {
  form.products.push({
    uid: crypto.randomUUID(),
    product: null,
    query: '',
    options: [],
    loading: false,
    open: false,
    qty: 1,
    measure: 'pcs'
  })
}

function removeProductRow(i: number) {
  form.products.splice(i, 1)
}

function addOfferingRow() {
  form.offerings.push({
    uid: crypto.randomUUID(),
    offering: null,
    query: '',
    options: [],
    loading: false,
    open: false,
    qty: 1
  })
}

function removeOfferingRow(i: number) {
  form.offerings.splice(i, 1)
}

function measureUnitsFor(p: Product | null) {
  const map: any = {piece: ['pcs', 'pack'], weight: ['kg', 'g'], length: ['m', 'cm'], capacity: ['l', 'ml']}
  return map[p?.measure_type || 'piece'] || ['pcs']
}

async function onProductQuery(it: any) {
  it.loading = true
  try {
    it.options = await productsApi.search({q: it.query, per_page: 15}) || []
  } finally {
    it.loading = false;
    it.open = true
  }
}

function selectProduct(it: any, p: Product) {
  it.product = p;
  it.open = false;
  if (!it.measure) it.measure = measureUnitsFor(p)[0]
}

async function onOfferingQuery(it: any) {
  it.loading = true
  try {
    it.options = await offeringsApi.search({q: it.query, per_page: 15}) || []
  } finally {
    it.loading = false;
    it.open = true
  }
}

function selectOffering(it: any, o: Offering) {
  it.offering = o;
  it.open = false
}

const submitLoading = ref(false)
const submitError = ref('')
const submitSuccess = ref(false)

async function submit() {
  submitError.value = ''; submitSuccess.value = false

  const isSuper = String(actor.value?.kind || '').toLowerCase() === 'superadmin'
  const hasDep  = Number.isFinite(Number(form.department_id))
  const hasStor = Number.isFinite(Number(form.storage_id))

  if (!isSuper && !hasDep && !hasStor) {
    submitError.value = 'Actor-ից պետք է գա department_id կամ storage_id'
    return
  }

  const productItems  = form.products
      .filter(p => p.product && p.qty > 0)
      .map(p => ({ product_id: p.product!.id, qty: p.qty, measure: p.measure }))

  const offeringItems = form.offerings
      .filter(o => o.offering && o.qty > 0)
      .map(o => ({ offering_id: o.offering!.id, qty: o.qty }))

  if (!productItems.length && !offeringItems.length) {
    submitError.value = 'Ավելացրեք ապրանք կամ առաջարկ'
    return
  }

  submitLoading.value = true
  try {
    const payload: any = { products: productItems, offerings: offeringItems }
    if (hasDep)      payload.department_id = Number(form.department_id)
    else if (hasStor) payload.storage_id   = Number(form.storage_id)
    // if superadmin with neither — send without ids; BE decides default

    await purchasingApi.create(payload)
    submitSuccess.value = true
    resetForm()
  } catch (e: any) {
    submitError.value = e?.response?.data?.message || 'Չհաջողվեց պահպանել'
  } finally { submitLoading.value = false }
}

function resetForm() {
  form.products = [];
  form.offerings = [];
  addProductRow()
}

// Load actor and derive department_id
async function loadActor() {
  try {
    const a = await authApi.getActor()

    const depId =
        Number(a?.department_id) ||
        Number(a?.department?.id) ||
        (Array.isArray(a?.department_ids) ? Number(a.department_ids[0]) : NaN)

    const storId =
        Number(a?.storage_id) ||
        Number(a?.storage?.id) ||
        (Array.isArray(a?.storage_ids) ? Number(a.storage_ids[0]) : NaN)

    form.department_id = Number.isFinite(depId) ? depId : undefined
    form.storage_id    = Number.isFinite(storId) ? storId : undefined

    // If both exist, prefer department_id. If neither exists, keep undefined.
  } catch {
    form.department_id = undefined
    form.storage_id    = undefined
  }
}

onMounted(async () => {
  await loadActor();
  resetForm()
})
</script>
