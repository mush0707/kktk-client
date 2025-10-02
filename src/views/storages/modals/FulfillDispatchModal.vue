<template>
  <div class="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl w-full max-w-xl p-4 space-y-4">
      <div class="flex items-center justify-between">
        <div class="font-semibold">Կատարել առաքում</div>
        <button class="px-3 py-1 rounded-xl border" @click="$emit('close')">Փակել</button>
      </div>
      <div>
        <p class="text-sm text-gray-600">Ալլոկացիա #{{ allocation.id }} · փաստաթուղթ {{ allocation.outbound_document_type }} #{{ allocation.outbound_document_id }}</p>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="text-xs text-gray-500">Քանակ</label>
          <input v-model.number="qty" type="number" min="0" step="0.001" class="w-full border rounded-xl px-3 py-2" />
        </div>
      </div>
      <div class="flex justify-end gap-2">
        <button class="px-4 py-2 rounded-xl border" @click="$emit('close')">Չեղարկել</button>
        <button class="px-4 py-2 rounded-xl border bg-gray-900 text-white" @click="save">Կատարել</button>
      </div>
    </div>
  </div>
</template>
<script>
import { ref } from 'vue';
import { api } from '@/api';
export default {
  name: 'FulfillDispatchModal',
  props: { allocation: { type: Object, required: true } },
  emits: ['close','done'],
  setup(props, { emit }){
    const qty = ref(0);
    const save = async () => {
      await api.fulfillDispatch(props.allocation.id, qty.value);
      emit('done');
      emit('close');
    };
    return { qty, save };
  }
}
</script>