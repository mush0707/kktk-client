<!-- src/views/mfg/MoList.vue -->
<template>
  <div class="flex flex-col gap-y-2">
    <!-- Header + breadcrumb -->
    <div class="flex flex-col">
      <div class="dark:border-gray-700 bg-white">
        <div class="flex gap-x-2 items-center p-4 border-b rounded-md border-gray-200 text-xl">
          <p>{{ storage?.address }}</p>
          <p class="text-sm">
            ({{ !storage?.cell ? (storage?.industrial ? $t('industrial') : $t('normal')) : $t('cell') }})
          </p>
        </div>
      </div>

      <nav class="flex bg-blue-50 py-2 items-center text-sm" aria-label="Breadcrumb">
        <ol class="inline-flex items-center">
          <li>
            <router-link to="/storages" class="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-slate-100">
              <span class="underline-offset-2 hover:underline">{{ $t('storages') }}</span>
            </router-link>
          </li>
          <li aria-hidden="true" class="px-1">
            <svg class="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
              <path d="M7.05 3.55a1 1 0 0 1 1.4 0l4.5 4.5a1 1 0 0 1 0 1.4l-4.5 4.5a1 1 0 0 1-1.4-1.4L10.79 10 7.05 6.26a1 1 0 0 1 0-1.41z"/>
            </svg>
          </li>
          <li>
            <router-link :to="'/storages/'+storage?.id" class="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-slate-100">
              <span class="underline-offset-2 hover:underline">{{ storage?.address }}</span>
            </router-link>
          </li>
          <li aria-hidden="true" class="px-1">
            <svg class="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
              <path d="M7.05 3.55a1 1 0 0 1 1.4 0l4.5 4.5a1 1 0 0 1 0 1.4l-4.5 4.5a1 1 0 0 1-1.4-1.4L10.79 10 7.05 6.26a1 1 0 0 1 0-1.41z"/>
            </svg>
          </li>
          <li>
            <p class="inline-flex items-center gap-1 rounded-md px-2 py-1">
              <span class="underline-offset-2 hover:underline">{{ $t('manufacturing','Արտադրամաս') }}</span>
            </p>
          </li>
        </ol>
      </nav>
    </div>

    <!-- Tabs -->
    <div class="px-4">
      <div class="inline-flex gap-1 rounded-xl border border-gray-200 bg-white p-1">
        <button
            class="px-4 py-2 rounded-lg text-sm font-medium"
            :class="tab==='entries' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-50'"
            @click="switchTab('entries')"
        >
          {{ $t('entries','Մուտքեր') }}
        </button>
        <button
            class="px-4 py-2 rounded-lg text-sm font-medium"
            :class="tab==='raw' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-50'"
            @click="switchTab('raw')"
        >
          Հումք / Արտադրանք
        </button>
        <button
            class="px-4 py-2 rounded-lg text-sm font-medium"
            :class="tab==='recycling' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-50'"
            @click="switchTab('recycling')"
        >
          Վերամշակում
        </button>
        <button
            class="px-4 py-2 rounded-lg text-sm font-medium"
            :class="tab==='orders' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-50'"
            @click="switchTab('orders')"
        >
          {{ $t('orders','Պատվերներ') }}
        </button>
        <button
            class="px-4 py-2 rounded-lg text-sm font-medium"
            :class="tab==='history' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-50'"
            @click="switchTab('history')"
        >
          Ելքեր
        </button>
      </div>
    </div>

    <!-- ENTRIES TAB -->
    <section v-if="tab==='entries'" class="px-4 space-y-3">
      <ManufacturingEntriesTab :storage-id="Number(route.params.id)" />
    </section>

    <!-- RAW MATERIALS TAB -->
    <section v-else-if="tab==='raw'" class="px-4 space-y-3">
      <ManufacturingRawTab :storage-id="Number(route.params.id)" />
    </section>
    <section v-else-if="tab==='history'" class="px-4 space-y-3">
      <ManufacturingOutputsTab :storage-id="Number(route.params.id)" />
    </section>
    <section v-else-if="tab==='recycling'" class="px-4 space-y-3">
      <ManufacturingRecyclingTab :storage-id="Number(route.params.id)"/>
    </section>
    <!-- Simple placeholders to keep layout, without extra logic -->
    <section v-else class="px-4">
      <div class="bg-white border border-gray-200 rounded-2xl p-10 text-center text-gray-500">
        {{ $t('coming_soon','Կլինի շուտով') }}
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { mainApi } from '@/api.js'
import ManufacturingEntriesTab from '@/views/storages/mfg/components/ManufacturingEntriesTab.vue'
import ManufacturingRawTab from '@/views/storages/mfg/components/ManufacturingProductsTab.vue'
import ManufacturingOutputsTab from '@/views/storages/mfg/components/ManufacturingOutputsTab.vue'
import ManufacturingRecyclingTab from '@/views/storages/mfg/components/ManufacturingRecyclingTab.vue'

const route = useRoute()
const storage = ref<any|null>(null)
const tab = ref<'entries'|'raw'|'recycling'|'production'|'orders'|'history'>('entries')

function switchTab(t:any){ tab.value = t }

onMounted(async () => {
  const storageId = Number(route.params.id)
  storage.value = await mainApi.getStorageById(storageId)
})

watch(() => route.params.id, async () => {
  const storageId = Number(route.params.id)
  storage.value = await mainApi.getStorageById(storageId)
  switchTab('entries')
})
</script>

<style scoped>
/* optional tiny tweaks */
</style>
