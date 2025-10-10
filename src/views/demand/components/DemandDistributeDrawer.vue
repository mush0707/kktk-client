<template>
  <div v-if="open" class="fixed inset-0 z-[40]">
    <!-- overlay -->
    <div class="absolute inset-0 bg-black/40" @click="$emit('close')"></div>

    <!-- drawer -->
    <div
        class="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl animate-[slideIn_.2s_ease-out] overflow-y-auto"
    >
      <!-- header -->
      <div class="p-5 border-b flex items-center justify-between">
        <h3 class="text-lg font-semibold">
          Բաշխել · {{ row?.product?.name || 'Ապրանք' }}
          <span class="text-xs text-gray-500 ml-2">({{ $t(row?.measure ?? 'piece') }})</span>
        </h3>
        <button class="p-2 rounded hover:bg-gray-100" @click="$emit('close')">✕</button>
      </div>

      <div class="p-5 space-y-5">
        <!-- KPI strip -->
        <div
            class="rounded-xl border border-gray-200 bg-slate-50 px-4 py-3 grid grid-cols-3 gap-3 text-sm"
        >
          <div class="flex flex-col">
            <span class="text-slate-500">Պահանջվող քանակ</span>
            <span class="font-semibold">
              {{ fmt(requiredQty) }} {{ $t(row?.measure ?? 'piece') }}
            </span>
          </div>
          <div class="flex flex-col">
            <span class="text-slate-500">Ընտրված</span>
            <span class="font-semibold">{{ fmt(totalSelected) }}</span>
          </div>
          <div class="flex flex-col">
            <span class="text-slate-500">Մնացորդ</span>
            <span
                class="font-semibold"
                :class="remaining>0 ? 'text-amber-700' : remaining<0 ? 'text-rose-700' : 'text-emerald-700'"
            >
              {{ fmt(remaining) }}
            </span>
          </div>
        </div>

        <!-- Available warehouses -->
        <div v-if="filteredAvailable.length" class="rounded-xl border border-gray-200 overflow-hidden">
          <div class="px-4 py-2 bg-gray-50 border-b text-sm font-medium">
            Հասանելի պահեստների ցանկ
          </div>
          <div class="p-3 space-y-2">
<!--            <div class="flex gap-2">-->
<!--              <input-->
<!--                  v-model.trim="wSearch"-->
<!--                  class="px-3 py-2 rounded-xl border w-full"-->
<!--                  placeholder="Փնտրել պահեստով…"-->
<!--              />-->
<!--            </div>-->

            <div v-if="wLoading" class="text-sm text-gray-500">Բեռնվում է…</div>
            <div v-else class="space-y-2 max-h-56 overflow-y-auto">
              <div
                  v-for="w in filteredAvailable"
                  :key="w.storage_id"
                  class="flex items-center justify-between gap-2 border border-gray-200 rounded-xl px-3 py-2 hover:bg-slate-50"
              >
                <div class="font-medium truncate">{{ w.name }}</div>
                <button
                    class="px-3 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700"
                    @click="chooseWarehouse(w)"
                >
                  Ընտրել
                </button>
              </div>
              <div v-if="filteredAvailable.length===0" class="text-sm text-gray-500 px-1">
                Ցանկը դատարկ է
              </div>
            </div>
          </div>
        </div>

        <!-- Selected warehouses -->
        <div class="rounded-xl border border-gray-200 overflow-hidden">
          <div class="px-4 py-2 bg-gray-50 border-b text-sm font-medium">Ընտրված պահեստներ</div>
          <div class="p-3 space-y-3" v-if="selected.length">
            <div
                v-for="(s,i) in selected"
                :key="s.storage_id"
                class="border border-gray-200 rounded-xl p-3 space-y-3"
            >
              <div class="flex items-center justify-between">
                <div class="font-medium">{{ s.name }}</div>
                <div class="flex gap-x-2">
                  <button
                      class="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                      @click="openBalance(s)">Տեսնել մնացորդները
                  </button>
                  <button
                      class="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                      @click="removeSelected(i)"
                  >
                    Հեռացնել
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-5 gap-2 items-end">
                <div class="col-span-3">
                  <label class="text-xs text-gray-600">Քանակ</label>
                  <input
                      v-model.number="s.qty"
                      type="number"
                      min="0"
                      step="0.01"
                      class="w-full px-3 py-2 rounded-xl border border-gray-300"
                      @input="clampQty(i)"
                  />
                </div>
                <div class="col-span-2 text-right text-xs text-gray-500">
                  առավելագույնը՝ {{ fmt(maxForIdx(i)) }}
                </div>
              </div>
            </div>
          </div>
          <div v-else class="p-4 text-sm text-gray-500">Դեռ ոչ մի պահեստ ընտրված չէ</div>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-2">
          <button class="px-3 py-2 rounded-xl border hover:bg-gray-50" @click="$emit('close')">
            Փակել
          </button>
          <button
              class="px-3 py-2 rounded-xl text-white"
              :class="canSubmit ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-gray-400 cursor-not-allowed'"
              :disabled="!canSubmit || submitting"
              @click="submit"
          >
            {{ submitting ? 'Ուղարկվում է…' : 'Պահպանել բաշխումը' }}
          </button>
        </div>
      </div>
    </div>
  </div>
  <!-- balance modal -->
  <StockBalanceModal
      :open="balance.open"
      :storage="balance.storage"
      :product="row?.product"
      @close="balance.open=false"
  />
</template>

<script setup lang="ts">
/**
 * Standalone Supplier Distribute Drawer
 * - Parent passes: open, row (demand product row), and submit fn
 * - Emits: 'close', 'distributed' (payload: { productId, items[] })
 *
 * Expected row shape (minimal):
 * {
 *   id: number,                // demand product row id or related id you need
 *   qty: number,               // required qty
 *   measure: string,           // 'kg' | 'piece' | ...
 *   product: { id:number, name:string, type_id?:number }
 *   storages?: Array<{ storage_id:number; storage_name?:string; qty:number }>
 * }
 *
 * submit(row, payload) must be provided by parent and return a Promise.
 * payload = {
 *   product_id: number,        // we'll send row.product?.id by default
 *   items: [{ storage_id:number, qty:number, measure:string }]
 * }
 */

import { ref, computed, watch, onMounted } from 'vue'
import { storagesApi } from '@/api.js'
import StockBalanceModal from "@/views/storages/components/StockBalanceModal.vue"; // adjust if needed

const props = defineProps<{
  open: boolean
  row: any | null
  // Parent-provided submit function: (row, payload) => Promise<any>
  submit: (row: any, payload: { product_id: number; items: Array<{ storage_id:number; qty:number; measure:string }> }) => Promise<any>
}>()
const emit = defineEmits<{ (e:'close'):void; (e:'distributed', p:{ productId:number; items:Array<{storage_id:number; storage_name:string; qty:number}> }):void }>()

/* state */
const wLoading = ref(false)
const wSearch  = ref('')
const warehouses = ref<Array<{ storage_id:number; name:string }>>([])
const selected   = ref<Array<{ storage_id:number; name:string; qty:number|null }>>([])
const submitting = ref(false)

/* math helpers */
const EPS = 1e-6
const num = (v:any) => (v==null || v==='') ? 0 : Number(v)
const round6 = (v:number) => Math.round(v*1e6)/1e6
const eq6 = (a:number,b:number) => Math.abs(a-b)<=EPS

const requiredQty = computed(() => round6(num(props.row?.qty ?? 0)))
const totalSelected = computed(() => round6(selected.value.reduce((s,x)=> s + num(x.qty), 0)))
const remaining = computed(() => round6(requiredQty.value - totalSelected.value))

const canSubmit = computed(() =>
    selected.value.length > 0 &&
    eq6(totalSelected.value, requiredQty.value) &&
    !submitting.value
)

/* UI helpers */
function fmt(v:any){
  if(v==null||v==='') return '—'
  const n = Number(v)
  return isFinite(n)
      ? new Intl.NumberFormat('hy-AM',{ maximumFractionDigits:6, useGrouping:false }).format(n)
      : String(v)
}

function maxForIdx(i:number){
  const other = round6(totalSelected.value - num(selected.value[i].qty))
  const maxForThis = round6(requiredQty.value - other)
  return Math.max(0, maxForThis)
}

function clampQty(i:number){
  const maxForThis = maxForIdx(i)
  if (num(selected.value[i].qty) > maxForThis) selected.value[i].qty = maxForThis
  if (num(selected.value[i].qty) < 0) selected.value[i].qty = 0
}

/* fetch warehouses */
async function reloadWarehouses(){
  if (!props.row) return
  wLoading.value = true
  try {
    // You can adapt filter logic here to your backend needs
    const typeId = props.row?.product?.type_id
    let list:any[] = []
    if (typeId) {
      const data = await storagesApi.getMatchedStoragePointsByProductTypeId(typeId)
      list = data?.data ?? data ?? []
    } else {
      // fallback: list all
      const data = await storagesApi.list()
      list = data?.data ?? data ?? []
    }

    const chosenIds = new Set(selected.value.map(s => s.storage_id))
    warehouses.value = list
        .map((w:any) => ({ storage_id: Number(w.storage_id ?? w.id), name: String(w.storage.address ?? 'Պահեստ') }))
        .filter(w => !chosenIds.has(w.storage_id))
  } finally {
    wLoading.value = false
  }
}

onMounted(() => { if (props.open) reloadWarehouses() })
watch(() => props.open, v => {
  if (v){
    selected.value = []
    wSearch.value = ''
    reloadWarehouses()
  }
})

/* choose/remove */
function chooseWarehouse(w:{ storage_id:number; name:string }){
  selected.value.push({ ...w, qty: null })
  warehouses.value = warehouses.value.filter(x => x.storage_id !== w.storage_id)
}
function removeSelected(i:number){
  const s = selected.value[i]
  selected.value.splice(i,1)
  warehouses.value.push({ storage_id: s.storage_id, name: s.name })
}

/* filter */
const filteredAvailable = computed(() => {
  const q = wSearch.value.trim().toLowerCase()
  if (!q) return warehouses.value
  return warehouses.value.filter(w => w.name.toLowerCase().includes(q))
})

/* submit */
async function submit(){
  if (!canSubmit.value || !props.row) return
  submitting.value = true
  try{
    const payload = {
      product_id: Number(props.row.product?.id ?? props.row.id),
      items: selected.value.map(s => ({
        storage_id: s.storage_id,
        qty: Number(s.qty || 0),
        measure: props.row?.measure || 'piece'
      }))
    }
    // parent-provided API call
    await props.submit(props.row, payload)

    // Emit normalized data for parent to write into the table row
    emit('distributed', {
      productId: Number(props.row?.id ?? props.row?.product?.id),
      items: selected.value.map(s => ({
        storage_id: s.storage_id,
        storage_name: s.name,
        qty: round6(num(s.qty))
      }))
    })
    emit('close')
  } finally {
    submitting.value = false
  }
}
const balance = ref<{ open: boolean, storage: any | null }>({open: false, storage: null})

function openBalance(s: any) {
  balance.value = {open: true, storage: s}
}
</script>

<style scoped>
@keyframes slideIn {
  from { transform: translateX(100%); }
  to   { transform: translateX(0); }
}
</style>
