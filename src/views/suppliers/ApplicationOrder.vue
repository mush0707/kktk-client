<template>
  <div class="flex flex-col">
    <div class="bg-white">
      <div class="flex items-center justify-between p-4 border-b border-gray-200 rounded-md">
        <div class="text-xl font-semibold">Պատվերներ ֊ մատակարար</div>
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
            Պատվերների ցանկ
          </button>
          <button
              :class="tabBtnClass('collect')"
              @click="tab='collect'"
          >
            Հայտերի հավաքագրում
          </button>
          <button
              :class="tabBtnClass('stages')"
              @click="tab='stages'"
          >
            Փուլեր / Ակտեր
          </button>
        </div>
      </div>
    </div>

    <!-- Body -->
    <ApplicationOrderList v-if="tab==='list'" />
    <ApplicationOrderStageControl v-if="tab==='stages'" />
    <CollectApplicationOrder v-else-if="tab==='collect'" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ApplicationOrderList from './components/order/ApplicationOrderList.vue'
import CollectApplicationOrder from './components/order/CollectApplicationOrder.vue'
import ApplicationOrderStageControl from './components/order/ApplicationOrderStageControl.vue'

const tab = ref<'list'|'collect'|'stages'>('list')

const tabBtnClass = (k:'list'|'collect'|'stages') =>
    `px-3 py-2 rounded-xl border border-indigo-900 text-sm ${
        tab.value===k ? 'bg-indigo-900 text-white' : 'bg-white hover:bg-gray-50'
    }`
</script>
