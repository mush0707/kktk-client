<template>
  <div v-if="open" class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/40" @click="$emit('close')"></div>

    <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                w-full max-w-lg bg-white rounded-2xl shadow-xl">
      <div class="flex items-center justify-between px-5 py-4 border-b">
        <h3 class="text-lg font-semibold">Մնացորդ</h3>
        <button class="p-2 rounded hover:bg-gray-100" @click="$emit('close')">✕</button>
      </div>

      <div class="p-5 space-y-4">
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div class="text-gray-500">Պահեստ</div>
            <div class="font-medium">{{ storage?.name || '—' }}</div>
          </div>
          <div>
            <div class="text-gray-500">Ապրանք</div>
            <div class="font-medium">{{ product?.name || '—' }}</div>
          </div>
        </div>

        <div class="rounded-xl border border-gray-300 overflow-hidden">
          <div class="px-4 py-2 bg-gray-50 border-b text-sm font-medium">Մնացորդի տվյալներ</div>
          <div class="p-4 text-sm">
            <div v-if="loading" class="text-gray-500">Բեռնվում է…</div>
            <template v-else>
              <div class="grid grid-cols-2 gap-3">
                <div class="text-gray-500">Քանակ</div>
                <div class="font-medium">{{ fmt((balance?.qty_available ?? 0) - (balance?.qty_reserved_dispatch ?? 0)- (balance?.qty_reserved_production ?? 0)) }} {{ $t(balance?.measure ?? 'piece') }}</div>

<!--                <div class="text-gray-500">Վերջ. թարմացում</div>-->
<!--                <div class="font-medium">{{ balance?.updated_at || '—' }}</div>-->
              </div>
            </template>
          </div>
        </div>
      </div>

      <div class="px-5 py-4 border-t flex items-center justify-end">
        <button class="px-3 py-2 rounded-xl border hover:bg-gray-50" @click="$emit('close')">Փակել</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, watch} from 'vue'
import {storagesApi} from '@/api.js'

const props = defineProps<{ open:boolean, storage:any|null, product:any|null }>()
const emit = defineEmits<{ (e:'close'): void }>()
const loading = ref(false)
const balance = ref<any>(null)

async function load(){
  if (!props.open || !props.storage || !props.product) return
  loading.value = true
  try {
    const storage_id = props.storage.storage_id
    const product_id = props.product.product_id ?? props.product.id
    // backend call: storage_id + product_id
    const data = await storagesApi.getResidueByProductId(storage_id, product_id)
    balance.value = data?.data ?? data ?? { qty: 0 }
  } finally { loading.value = false }
}

watch(() => [props.open, props.storage?.id, props.product?.id, props.product?.product_id], load, { immediate: true })

function fmt(v:any){ if(v==null||v==='') return '—'; const n=Number(v); return isFinite(n)?new Intl.NumberFormat('hy-AM',{maximumFractionDigits:6, useGrouping:false}).format(n):String(v) }
</script>
