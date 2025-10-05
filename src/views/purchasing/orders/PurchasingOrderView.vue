<template>
  <div class="flex flex-col">
    <div class="dark:border-gray-700 bg-white">
      <div class="flex gap-x-2 items-center p-4 border-b rounded-md border-gray-200 text-xl">
        <p>{{ $t('suppliers_orders') }}</p>
        <p class="text-sm">({{
            $t('purchasing')
          }})</p>
      </div>
    </div>
    <nav class="flex bg-blue-50 py-2 items-center text-sm" aria-label="Breadcrumb">
      <ol class="inline-flex items-center">

        <li>
          <router-link :to="'/purchasing'"
                       class="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-slate-100">
            <span class="underline-offset-2 hover:underline">{{ $t('purchasing') }}</span>
          </router-link>
        </li>
        <li aria-hidden="true" class="px-1">
          <svg class="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
            <path
                d="M7.05 3.55a1 1 0 0 1 1.4 0l4.5 4.5a1 1 0 0 1 0 1.4l-4.5 4.5a1 1 0 0 1-1.4-1.4L10.79 10 7.05 6.26a1 1 0 0 1 0-1.41z"/>
          </svg>
        </li>
        <li>
          <router-link :to="'/purchasing/orders'"
                       class="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-slate-100">
            <span class="underline-offset-2 hover:underline">{{ $t('suppliers_orders') }}</span>
          </router-link>
        </li>
        <li aria-hidden="true" class="px-1">
          <svg class="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
            <path
                d="M7.05 3.55a1 1 0 0 1 1.4 0l4.5 4.5a1 1 0 0 1 0 1.4l-4.5 4.5a1 1 0 0 1-1.4-1.4L10.79 10 7.05 6.26a1 1 0 0 1 0-1.41z"/>
          </svg>
        </li>
        <li>
          <p class="inline-flex items-center gap-1 rounded-md px-2 py-1">
            <span class="underline-offset-2 hover:underline">{{ order?.identification_number }}</span>
          </p>
        </li>
      </ol>
    </nav>
  </div>
  <div class="p-4 space-y-4" v-if="order">
    <div class="flex items-center justify-between">
      <div class="flex flex-col gap-y-2">
        <h1 class="text-xl font-semibold">Պատվեր #{{ order.identification_number }}</h1>
        <div class="flex flex-col">
          <p v-if="order.partner_contract" class="text-sm text-gray-600">
            Գործընկեր՝ {{ order.partner_contract?.partner?.name || order.partner?.name || '-' }} ·
          </p>
          <p>
            Կարգավիճակ՝ <span class="px-2 py-0.5 rounded text-xs bg-gray-100">{{ $t(order.status) }}</span>
          </p>
        </div>
      </div>

      <router-link class="px-3 py-2 rounded-xl border hover:bg-gray-50" :to="'/purchasing/orders'">
        Վերադառնալ ցանկ
      </router-link>
    </div>
    <div v-if="order.status === 'send_to_purchasing'" class="p-4 mb-4 text-sm text-blue-800 rounded-lg bg-blue-50 dark:bg-gray-800 dark:text-blue-400" role="alert">
      <span class="font-medium">Ինֆորմացիա։</span> Այս սցենարը նախատեսված է Հիմնական(Մաքսիում) գների, կանխավճարի տոկոսային արժեքի և պայմանգրի նախատեսվող ժամկետի ներմուծման համար։
    </div>
    <div v-if="order.status === 'send_to_purchasing'" class="p-4 mb-4 text-sm text-indigo-800 rounded-lg bg-indigo-50 dark:bg-gray-800 dark:text-indigo-400" role="alert">
      <span class="font-medium">Հուշում։</span> Լրացնել բոլոր թվային դաշտերը և սեղմել «Թարմացնել» կոճակը։
    </div>
    <!-- Prices Editor combines both modes -->
    <OrderPricesEditor
        :order="order"
        @updated="reload"
    />
  </div>

  <div v-else class="p-4 text-sm text-gray-500">Բեռնվում է…</div>
</template>

<script setup>
import {ref, onMounted} from 'vue'
import {useRoute} from 'vue-router'
import {purchasingOrdersApi} from '@/api.js'
import OrderPricesEditor from './components/PurchasingOrderPriceEditor.vue'

const route = useRoute()
const id = Number(route.params.id)
const order = ref(null)

async function load(){
  const {data} = await purchasingOrdersApi.getById(id)
  order.value = data?.data ?? data
}
async function reload(){
  await load()
}

onMounted(load)
</script>
