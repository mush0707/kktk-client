<template>
  <div class="p-4 space-y-4">
    <button class="px-3 py-2 rounded-xl border" @click="reload">Թարմացնել</button>
    <div class="bg-white rounded-2xl border overflow-hidden">
      <table class="min-w-full text-sm">
        <thead class="bg-gray-50">
        <tr>
          <th class="px-4 py-3 text-left">MO #</th>
          <th class="px-4 py-3 text-left">Ապրանք</th>
          <th class="px-4 py-3 text-right">Քանակ</th>
          <th class="px-4 py-3 text-left">Staging row</th>
          <th class="px-4 py-3 text-left">Ամսաթիվ</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="o in items" :key="o.id" class="border-t">
          <td class="px-4 py-3">{{ o.manufacturing_order_id }}</td>
          <td class="px-4 py-3">{{ o.product_id }}</td>
          <td class="px-4 py-3 text-right">{{ o.qty }}</td>
          <td class="px-4 py-3">{{ o.storage_product_id || '-' }}</td>
          <td class="px-4 py-3">{{ o.produced_at || '-' }}</td>
        </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
<script>
import { ref, onMounted } from 'vue';
import { api } from '@/api';
export default {
  name: 'MoOutputs',
  components: { },
  setup(){
    const items = ref([]);
    const reload = async ()=>{ items.value = await api.getMOOutputs(); };
    onMounted(reload);
    return { items, reload };
  }
}
</script>