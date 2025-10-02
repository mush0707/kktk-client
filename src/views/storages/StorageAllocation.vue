<template>
  <div class="p-4 space-y-4">
    <select v-model="filters.kind" class="border rounded-xl px-3 py-2">
      <option value="">Բոլորը</option>
      <option value="place">Տեղավորում</option>
      <option value="dispatch">Առաքում</option>
    </select>
    <button class="px-3 py-2 rounded-xl border" @click="reload">Թարմացնել</button>
    <div class="bg-white rounded-2xl border overflow-hidden">
      <table class="min-w-full text-sm">
        <thead class="bg-gray-50">
        <tr>
          <th class="px-4 py-3 text-left">SP #</th>
          <th class="px-4 py-3 text-left">Տեսակ</th>
          <th class="px-4 py-3 text-left">Թիրախ</th>
          <th class="px-4 py-3 text-right">Պահ. քանակ</th>
          <th class="px-4 py-3 text-left">Կարգավիճակ</th>
          <th class="px-4 py-3">Գործողություն</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="a in items" :key="a.id" class="border-t">
          <td class="px-4 py-3">{{ a.storage_product_id }}</td>
          <td class="px-4 py-3">{{ a.reservation_kind === 'place' ? 'Տեղավորում' : 'Առաքում' }}</td>
          <td class="px-4 py-3">
            <span v-if="a.reservation_kind==='place'">Բջիջ: {{ a.storage_cell_id }}</span>
            <span v-else>Փաստաթուղթ: {{ a.outbound_document_type }} #{{ a.outbound_document_id }}</span>
          </td>
          <td class="px-4 py-3 text-right">{{ a.qty_reserved }}</td>
          <td class="px-4 py-3">{{ statusLabel(a.status) }}</td>
          <td class="px-4 py-3">
            <div class="flex gap-2">
              <button v-if="a.reservation_kind==='place'" class="px-3 py-2 rounded-xl border hover:bg-gray-50" @click="openFulfillPlacement(a)">Կատարել տեղավորում</button>
              <button v-else class="px-3 py-2 rounded-xl border hover:bg-gray-50" @click="openFulfillDispatch(a)">Կատարել առաքում</button>
            </div>
          </td>
        </tr>
        </tbody>
      </table>
    </div>


    <FulfillPlacementModal v-if="showPlace" :allocation="selected" @close="showPlace=false" @done="reload" />
    <FulfillDispatchModal v-if="showDispatch" :allocation="selected" @close="showDispatch=false" @done="reload" />
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { api } from '@/api';
import FulfillPlacementModal from '@/views/storages/modals/FulfillPlacementModal.vue';
import FulfillDispatchModal from '@/views/storages/modals/FulfillDispatchModal.vue';


export default {
  name: 'AllocationsList',
  components: { FulfillPlacementModal, FulfillDispatchModal },
  setup(){
    const filters = ref({ kind: '' });
    const items = ref([]);
    const showPlace = ref(false);
    const showDispatch = ref(false);
    const selected = ref(null);


    const reload = async ()=>{ items.value = await api.getAllocations({ reservation_kind: filters.value.kind || undefined }); };
    const statusLabel = (s) => ({ reserved:'Պահված', partially_fulfilled:'Մասամբ կատարված', fulfilled:'Կատարված', cancelled:'Չեղարկված' }[s] || s);
    const openFulfillPlacement = (a) => { selected.value = a; showPlace.value = true; };
    const openFulfillDispatch = (a) => { selected.value = a; showDispatch.value = true; };


    onMounted(reload);
    return { filters, items, reload, statusLabel, showPlace, showDispatch, selected, openFulfillPlacement, openFulfillDispatch };
  }
}
</script>