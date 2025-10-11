<template>
  <div class="flex flex-col gap-y-2">
    <div class="flex flex-col">
      <div class="dark:border-gray-700 bg-white">
        <div class="flex gap-x-2 items-center p-4 border-b rounded-md border-gray-200 text-xl">
          <p>{{ $t('accounting') }}</p>
        </div>
      </div>
    </div>
    <div class="px-4">
      <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        <RouterLink to="/accounting/invoices" class="block p-5 rounded-2xl border border-gray-300 bg-white hover:shadow">
          <p class="font-semibold">{{$t('invoices')}}</p>
        </RouterLink>
        <RouterLink :to="'/accounting/role-positions'" class="block p-5 rounded-2xl border border-gray-300 bg-white hover:shadow">
          <p class="font-semibold">հաստիքագրում</p>
        </RouterLink>
        <RouterLink :to="'/accounting/vacancy'" class="block p-5 rounded-2xl border border-gray-300 bg-white hover:shadow">
          <p class="font-semibold">Թափուր աշխատատեղեր</p>
        </RouterLink>
        <RouterLink :to="'/accounting/candidates'" class="block p-5 rounded-2xl border border-gray-300 bg-white hover:shadow">
          <p class="font-semibold">Կանդիդատ</p>
        </RouterLink>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
const route = useRoute()
const storage = ref(null)


 </script>