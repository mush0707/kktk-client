<template>
  <div class="p-4 space-y-4">
    <div class="bg-white rounded-2xl border overflow-hidden">
      <table class="min-w-full text-sm">
        <thead class="bg-gray-50">
        <tr>
          <th class="px-4 py-3 text-left">Բջիջ</th>
          <th class="px-4 py-3 text-left">Ապրանք</th>
          <th class="px-4 py-3 text-right">Քանակ</th>
          <th class="px-4 py-3 text-right">Պահ.`</th>
          <th class="px-4 py-3">Բաչ/Սերիա</th>
          <th class="px-4 py-3">Գործողություն</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="cs in items" :key="cs.id" class="border-t">
          <td class="px-4 py-3">{{ cs.storage_cell_id }}</td>
          <td class="px-4 py-3">{{ cs.product?.name || cs.product_id }}</td>
          <td class="px-4 py-3 text-right">{{ cs.qty }}</td>
          <td class="px-4 py-3 text-right">{{ cs.reserved_qty }}</td>
          <td class="px-4 py-3 text-gray-500">{{ cs.batch_no || '-' }} / {{ cs.serial_no || '-' }}</td>
          <td class="px-4 py-3">
            <button class="px-3 py-2 rounded-xl border hover:bg-gray-50" @click="openMove(cs)">Տեղափոխել բջիջ→բջիջ</button>
          </td>
        </tr>
        </tbody>
      </table>
    </div>


    <MoveCellToCellModal v-if="showMove" :cell-stock="selected" @close="showMove=false" @done="reload" />
  </div>
</template>
<script>
import { ref, onMounted } from 'vue';
import { api } from '@/api';
import MoveCellToCellModal from '@/views/storages/modals/MoveCellToCellModal.vue';
export default {
  name: 'CellStock',
  components: { MoveCellToCellModal },
  setup(){
    const storages = ref([]);
    const items = ref([]);
    const filters = ref({ storage_id: undefined });
    const showMove = ref(false);
    const selected = ref(null);
    const reload = async () => { items.value = await api.getCellStocks(filters.value.storage_id); };
    const openMove = (row) => { selected.value = row; showMove.value = true; };
    onMounted(async ()=>{ storages.value = await api.getStorages(); await reload(); });
    return { storages, items, filters, reload, showMove, selected, openMove };
  }
}
</script>