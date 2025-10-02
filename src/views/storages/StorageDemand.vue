<template>
  <div class="flex flex-col">
    <div class="bg-white">
      <div class="flex items-center justify-between p-4 border-b border-gray-200 rounded-md">
        <div class="text-xl font-semibold">Պահանջագրեր դեպի պահեստ</div>
      </div>
    </div>
    <!-- Header + tabs -->
    <div class="bg-white">
      <div class="flex items-center justify-between p-4 border-b border-gray-200 rounded-md">
        <div class="flex items-center gap-1">
          <button
              :class="tabBtnClass('list')"
              @click="tab='list'"
          >
            Պահանջագրերի ցանկ
          </button>
          <button
              :class="tabBtnClass('new')"
              @click="tab='new'"
          >
            Նոր պահանջագիր
          </button>
        </div>
      </div>
    </div>

    <!-- Body -->
    <StorageDemandList v-if="tab==='list'" />
    <StorageNewDemand v-else />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import StorageDemandList from './components/demand/StorageDemandList.vue'
import StorageNewDemand from './components/demand/StorageNewDemand.vue'

const tab = ref<'list'|'new'>('list')

const tabBtnClass = (k:'list'|'new') =>
    `px-3 py-2 rounded-xl border border-indigo-900 text-sm ${
        tab.value===k ? 'bg-indigo-900 text-white' : 'bg-white hover:bg-gray-50'
    }`
</script>
