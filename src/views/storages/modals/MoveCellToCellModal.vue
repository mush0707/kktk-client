<script setup lang="ts">

</script>

<template>

</template>

<style scoped>

</style><template>
  <button class="px-3 py-1 rounded-xl border" @click="$emit('close')">Փակել</button>
  </div>
  <div>
    <p class="text-sm text-gray-600">Ապրանք #{{ row.product_id }} · ընթացիկ բջիջ {{ row.storage_cell_id }}</p>
  </div>
  <div class="grid grid-cols-2 gap-3">
    <div>
      <label class="text-xs text-gray-500">Քանակ</label>
      <input v-model.number="qty" type="number" min="0" step="0.001" class="w-full border rounded-xl px-3 py-2" />
    </div>
    <div>
      <label class="text-xs text-gray-500">Թիրախ բջիջ ID</label>
      <input v-model.number="toCellId" type="number" min="1" class="w-full border rounded-xl px-3 py-2" />
    </div>
  </div>
  <div class="flex justify-end gap-2">
    <button class="px-4 py-2 rounded-xl border" @click="$emit('close')">Չեղարկել</button>
    <button class="px-4 py-2 rounded-xl border bg-gray-900 text-white" @click="save">Տեղափոխել</button>
  </div>
  </div>
  </div>
</template>
<script>
import { ref } from 'vue';
export default {
  name: 'MoveCellToCellModal',
  props: { cellStock: { type: Object, required: true } },
  emits: ['close','done'],
  setup(props, { emit }){
    const row = props.cellStock;
    const qty = ref(0);
    const toCellId = ref(null);
    const save = async () => {
      await fetch('/api/storage_movements', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({
          product_id: row.product_id,
          qty: qty.value,
          fromable_type: 'storage_cells',
          fromable_id: row.storage_cell_id,
          toable_type: 'storage_cells',
          toable_id: toCellId.value,
          reason: 'relocation'
        })});
      emit('done');
      emit('close');
    };
    return { row, qty, toCellId, save };
  }
}
</script>