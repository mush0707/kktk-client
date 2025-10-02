<template>
  <div class="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl w-full max-w-xl p-4 space-y-4">
      <div class="flex items-center justify-between">
        <div class="font-semibold">Ավելացնել ելքային արտադրանք</div>
        <button class="px-3 py-1 rounded-xl border" @click="$emit('close')">Փակել</button>
      </div>


      <div class="space-y-2">
        <label class="text-xs text-gray-500">MO</label>
        <select v-model.number="moId" class="w-full border rounded-xl px-3 py-2">
          <option :value="undefined">— Ընտրել —</option>
          <option v-for="m in mos" :key="m.id" :value="m.id">{{ m.number }} · {{ m.order_kind }}</option>
        </select>
      </div>


      <div class="space-y-2">
        <label class="text-xs text-gray-500">Ապրանք</label>
        <input v-model="productQuery" placeholder="Փնտրել" class="w-full border rounded-xl px-3 py-2" @input="searchProducts" />
        <select v-model.number="productId" class="w-full border rounded-xl px-3 py-2">
          <option :value="undefined">— Ընտրել ապրանք —</option>
          <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
      </div>

      <div>
        <label class="text-xs text-gray-500">Քանակ</label>
        <input
            v-model.number="qty"
            type="number"
            min="0"
            step="0.001"
            class="w-full border rounded-XL px-3 py-2"
        />
      </div>

      <div class="flex justify-end gap-2">
        <button class="px-4 py-2 rounded-xl border" @click="$emit('close')">Չեղարկել</button>
        <button
            class="px-4 py-2 rounded-xl border bg-gray-900 text-white"
            :disabled="!moId || !productId || qty <= 0"
            @click="save"
        >
          Ավելացնել
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { mfgApi } from '@/api.mfg'
import { api } from '@/api'

export default {
  name: 'AddMoOutputModal',
  emits: ['close', 'done'],
  setup (_, { emit }) {
    const mos = ref([])
    const moId = ref()
    const products = ref([])
    const productId = ref()
    const productQuery = ref('')
    const qty = ref(0)

    const load = async () => {
      // Ցուցադրել բոլոր «released» MO-ները (կներառի նաև reprocess-ը)
      mos.value = await mfgApi.getMOs({ status: 'released' })
    }

    const searchProducts = async () => {
      products.value = await api.getProducts(productQuery.value || '')
    }

    const save = async () => {
      await mfgApi.addMOOutput(moId.value, productId.value, qty.value)
      emit('done')
      emit('close')
    }

    onMounted(() => {
      load()
      searchProducts()
    })

    return { mos, moId, products, productId, productQuery, qty, save, searchProducts }
  }
}
</script>
