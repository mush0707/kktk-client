<!-- src/views/storages/mfg/components/ManufacturingRecyclingTab.vue -->
<template>
  <section class="border-l border-gray-300 px-4 space-y-4 mt-2">
    <p class="text-gray-500 text-xl">Վերամշակում</p>
    <!-- Subtabs -->
    <div class="inline-flex gap-1 rounded-xl border border-gray-200 bg-white p-1">
      <button
          class="px-4 py-2 rounded-lg text-sm font-medium"
          :class="subtab==='entries' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-50'"
          @click="subtab='entries'"
      >
        Մուտքեր
      </button>
      <button
          class="px-4 py-2 rounded-lg text-sm font-medium"
          :class="subtab==='materials' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-50'"
          @click="subtab='materials'"
      >
        Հումք
      </button>
      <button
          class="px-4 py-2 rounded-lg text-sm font-medium"
          :class="subtab==='produces' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-50'"
          @click="subtab='produces'"
      >
        Արտադրանք
      </button>
      <button
          class="px-4 py-2 rounded-lg text-sm font-medium"
          :class="subtab==='process' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-50'"
          @click="subtab='process'"
      >
        Պրոցեսներ
      </button>
      <button
          class="px-4 py-2 rounded-lg text-sm font-medium"
          :class="subtab==='outputs' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-50'"
          @click="subtab='outputs'"
      >
        Ելքեր
      </button>
    </div>

    <!-- Subtab content -->
    <div v-if="subtab==='entries'">
      <RecyclingEntriesTab :storage-id="storageId" @updated="$emit('updated')" />
    </div>
    <div v-else-if="subtab==='materials'">
      <RecyclingMaterialsTab :storage-id="storageId" @updated="$emit('updated')" />
    </div>
    <div v-else-if="subtab==='produces'">
      <RecyclingProducesTab :storage-id="storageId" @updated="$emit('updated')" />
    </div>
    <div v-else-if="subtab==='process'">
      <RecyclingProcessesTab :storage-id="storageId" @updated="$emit('updated')" />
    </div>
    <div v-else-if="subtab==='outputs'">
      <RecyclingOutputsTab :storage-id="storageId" @updated="$emit('updated')" />
    </div>
    <div v-else class="bg-white border border-gray-200 rounded-2xl p-10 text-center text-gray-500">
      {{ $t('coming_soon','Կլինի շուտով') }}
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import RecyclingEntriesTab from '@/views/storages/mfg/components/RecyclingEntriesTab.vue'
import RecyclingOutputsTab from '@/views/storages/mfg/components/RecyclingOutputsTab.vue'
import RecyclingMaterialsTab from '@/views/storages/mfg/components/RecyclingMaterialsTab.vue'
import RecyclingProducesTab from '@/views/storages/mfg/components/RecyclingProducesTab.vue'
import RecyclingProcessesTab from '@/views/storages/mfg/components/RecyclingProcessesTab.vue'

type ID = number
defineProps<{ storageId: ID }>()
defineEmits<{ (e:'updated'): void }>()

const subtab = ref<'entries'|'process'|'produces'|'materials'|'outputs'>('entries')
</script>
