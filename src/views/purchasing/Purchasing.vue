<template>
  <div class="flex flex-col gap-y-2">
    <div class="flex flex-col">
      <div class="dark:border-gray-700 bg-white">
        <div class="flex gap-x-2 items-center p-4 border-b rounded-md border-gray-200 text-xl">
          <p>{{ $t('purchasing_department') }}</p>
        </div>
      </div>
    </div>
    <div class="px-4">
      <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        <RouterLink :to="'/purchasing/partners'" class="block p-5 rounded-2xl border border-gray-300 bg-white hover:shadow">
          <p class="font-semibold">Գործընկերներ</p>
          <!--          <p class="text-sm text-gray-500">storage_products · նոր արտադրված ապրանք</p>-->
        </RouterLink>
        <RouterLink :to="'/purchasing/orders'" class="block p-5 rounded-2xl border border-gray-300 bg-white hover:shadow">
          <p class="font-semibold">Պատվերներ</p>
          <!--          <p class="text-sm text-gray-500">storage_products · նոր արտադրված ապրանք</p>-->
        </RouterLink>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { mainApi, wmsApi } from '@/api.js'
const route = useRoute()
const storage = ref(null)

const load = async () => {

}

onMounted(load)
</script>