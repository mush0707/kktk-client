<!-- src/components/RejectReasonModal.vue -->
<template>
  <div v-if="open" class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/40" @click="$emit('close')"></div>
    <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                w-full max-w-lg bg-white rounded-2xl shadow-xl">
      <div class="px-5 py-4 border-b font-semibold">{{ title || 'Մերժման պատճառ' }}</div>
      <div class="p-5 space-y-3">
        <label class="text-sm text-gray-600">Պատճառ *</label>
        <textarea
            v-model.trim="reason"
            rows="5"
            class="w-full border rounded-xl px-3 py-2"
            placeholder="Գրի՛ր պատճառը…"
        ></textarea>
        <p v-if="!reason" class="text-xs text-rose-600">Պարտադիր դաշտ</p>
      </div>
      <div class="px-5 py-4 border-t flex items-center justify-end gap-2">
        <button class="px-3 py-2 rounded-xl border hover:bg-gray-50" @click="$emit('close')">Փակել</button>
        <button
            class="px-3 py-2 rounded-xl text-white"
            :class="reason && !loading ? 'bg-rose-600 hover:bg-rose-700' : 'bg-gray-400 cursor-not-allowed'"
            :disabled="!reason || loading"
            @click="$emit('confirm', reason)"
        >
          {{ loading ? 'Ուղարկվում է…' : 'Մերժել' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, watch} from 'vue'
const props = defineProps<{ open:boolean; title?:string; loading?:boolean }>()
const emit  = defineEmits<{(e:'close'):void; (e:'confirm', reason:string):void}>()
const reason = ref('')
watch(() => props.open, v => { if (v) reason.value = '' })
</script>
