<template>
  <div class="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl w-full max-w-xl p-4 space-y-4">
      <div class="flex items-center justify-between">
        <div class="font-semibold">Պլանավորել առաքում</div>
        <button class="px-3 py-1 rounded-xl border" @click="$emit('close')">Փակել</button>
      </div>


      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="text-xs text-gray-500">Քանակ</label>
          <input v-model.number="qty" type="number" min="0" step="0.001" class="w-full border rounded-xl px-3 py-2"/>
        </div>
        <div>
          <label class="text-xs text-gray-500">Ելքային փաստաթուղթ ID</label>
          <input v-model.number="docId" type="number" min="1" class="w-full border rounded-xl px-3 py-2"/>
        </div>
      </div>


      <div class="flex justify-end gap-2">
        <button class="px-4 py-2 rounded-xl border" @click="$emit('close')">Չեղարկել</button>
        <button class="px-4 py-2 rounded-xl border bg-gray-900 text-white" @click="save">Պահել</button>
      </div>
    </div>
  </div>
</template>
<script>
import { ref } from 'vue';
import { mfgApi, wmsApi } from '@/api.ts';

export default {
  name: 'AllocateToDispatchModal',
  props: { storageProduct: { type: Object, required: true } },
  emits: ['close','created'],
  setup(props, { emit }){
    const qty = ref(0);
    const docId = ref(null);


    const save = async () => {
      await vue.createAllocation({
        storage_product_id: props.storageProduct.id,
        reservation_kind: 'dispatch',
        outbound_document_type: 'sales_orders',
        outbound_document_id: docId.value,
        qty_reserved: qty.value,
      });
      emit('created');
      emit('close');
    };


    return { qty, docId, save };
  }
}
</script>