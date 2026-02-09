<template>
  <div class="flex flex-col gap-y-2">
    <!-- Header + Breadcrumb -->
    <div class="flex flex-col">
      <div class="dark:border-gray-700 bg-white">
        <div class="flex flex-col gap-y-2 p-4 border-b rounded-md border-gray-200 text-xl">
          <p>Գնային քաղաքականություն</p>
          <div class="border border-gray-300"></div>
          <p class="text-sm">Վաճառքների ստորաբաժանում</p>
        </div>
      </div>
      <nav class="flex bg-blue-50 py-2 items-center text-sm" aria-label="Breadcrumb">
        <ol class="inline-flex items-center">
          <li>
            <router-link :to="'/sales'" class="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-slate-100">
              <span class="underline-offset-2 hover:underline">Վաճառքների ստորաբաժանում</span>
            </router-link>
          </li>
          <li aria-hidden="true" class="px-1">
            <svg class="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
              <path d="M7.05 3.55a1 1 0 0 1 1.4 0l4.5 4.5a1 1 0 0 1 0 1.4l-4.5 4.5a1 1 0 0 1-1.4-1.4L10.79 10 7.05 6.26a1 1 0 0 1 0-1.41z"/>
            </svg>
          </li>
          <li><p class="inline-flex items-center gap-1 rounded-md px-2 py-1">Գնային քաղաքականություն</p></li>
        </ol>
      </nav>
    </div>

    <!-- Tabs -->
    <div class="px-4">
      <div class="flex flex-col gap-y-2">
        <div class="inline-flex gap-1 rounded-xl border border-gray-200 bg-white p-1">
          <button v-for="t in tabs"
              class="px-4 py-2 rounded-lg text-sm font-medium"
              :class="tab===t.key ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-50'"
              @click="tab=t.key"
          >
            {{ t.label }}
          </button>
        </div>
        <div class="p-4 bg-white  rounded-2xl shadow">
          <PriceTabProducts v-if="tab==='products'"/>
          <PriceTabPortionItems v-else-if="tab==='portionItems'"/>
          <PriceTabDiscounts v-else />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, onMounted} from 'vue'
import {sales} from '@/api'
import PriceTabProducts from './price-policy/tabs/PPProductsTab.vue'
import PriceTabPortionItems from './price-policy/tabs/PPPortionItemsTab.vue'
import PriceTabDiscounts from './price-policy/tabs/PPDiscountsTab.vue'

const tabs = [
  { key: 'products', label: 'Ապրանքներ' },
  { key: 'portionItems', label: 'Չափաբաժիններ' },
  { key: 'discounts', label: 'Զեղչեր' },
]
const tab = ref<'products'|'portionItems'|'discounts'>('products')

</script>
