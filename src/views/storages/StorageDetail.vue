<template>
  <div class="flex flex-col gap-y-2">
    <div class="flex flex-col">
      <div class="dark:border-gray-700 bg-white">
        <div class="flex gap-x-2 items-center p-4 border-b rounded-md border-gray-200 text-xl">
          <p>{{ storage?.address }}</p>
          <p class="text-sm">({{
              !storage?.cell ? (storage?.industrial ? $t('industrial') : $t('normal')) : $t('cell')
            }})</p>
        </div>
      </div>
      <nav class="flex bg-blue-50 py-2 items-center text-sm" aria-label="Breadcrumb">
        <ol class="inline-flex items-center">

          <li>
            <router-link :to="'/storages'"
                         class="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-slate-100">
              <span class="underline-offset-2 hover:underline">{{ $t('storages') }}</span>
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
              <span class="underline-offset-2 hover:underline">{{ storage?.address }}</span>
            </p>
          </li>
        </ol>
      </nav>
    </div>
    <div class="px-4">
      <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        <RouterLink :to="'/storages/'+storage?.id+'/entries'" class="block p-5 rounded-2xl border border-gray-300 bg-white hover:shadow">
          <p class="font-semibold">Մուտքեր</p>
          <!--          <p class="text-sm text-gray-500">storage_products · նոր արտադրված ապրանք</p>-->
        </RouterLink>
        <RouterLink :to="'/storages/'+storage?.id+'/staging'" class="block p-5 rounded-2xl border border-gray-300 bg-white hover:shadow">
          <p class="font-semibold">Ապրանքացանկ</p>
<!--          <p class="text-sm text-gray-500">storage_products · նոր արտադրված ապրանք</p>-->
        </RouterLink>
        <RouterLink to="/wms/allocations" class="block p-5 rounded-2xl border border-gray-300 bg-white hover:shadow">
          <p class="font-semibold">Պատվերներ</p>
<!--          <p class="text-sm text-gray-500">place / dispatch · storage_staging_allocations</p>-->
        </RouterLink>
        <RouterLink
            :to="`/storages/${storage?.id}/inventory`"
            class="block p-5 rounded-2xl border border-gray-300 bg-white hover:shadow"
        >
          <p class="font-semibold">Բջջային մնացորդ</p>
<!--          <p class="text-sm text-gray-500">storage_cell_products</p>-->
        </RouterLink>
        <RouterLink
            :to="`/storages/${storage?.id}/placements`"
            class="block p-5 rounded-2xl border border-gray-300 bg-white hover:shadow"
        >
          <p class="font-semibold">Տեղավորումներ</p>
          <span v-if="pendingCount>0"
                class="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
          {{ pendingCount }}
        </span>
        </RouterLink>
        <RouterLink
            :to="`/storages/${storage?.id}/demands`"
            class="block p-5 rounded-2xl border border-gray-300 bg-white hover:shadow"
        >
          <p class="font-semibold">Պահանջագրեր</p>
        </RouterLink>
        <RouterLink
            :to="`/storages/${storage?.id}/outputs`"
            class="block p-5 rounded-2xl border border-gray-300 bg-white hover:shadow"
        >
          <p class="font-semibold">Ելքերի մատյան</p>
        </RouterLink>
<!--        <RouterLink to="/wms/hierarchy" class="block p-5 rounded-2xl border border-gray-300 bg-white hover:shadow">-->
<!--          <p class="font-semibold">Պահեստի խորություններ</p>-->
<!--&lt;!&ndash;          <p class="text-sm text-gray-500">Բաժին → Սեքցիա → Դարակ → Բջիջ</p>&ndash;&gt;-->
<!--        </RouterLink>-->
<!--        <RouterLink-->
<!--            :to="`/storages/${storage?.id}/movements`"-->
<!--            class="block p-5 rounded-2xl border border-gray-300 bg-white hover:shadow"-->
<!--        >-->
<!--          <p class="font-semibold">Շարժերի մատյան</p>-->
<!--&lt;!&ndash;          <p class="text-sm text-gray-500">storage_movements · audit</p>&ndash;&gt;-->
<!--        </RouterLink>-->
        <RouterLink :to="'/storages/'+storage?.id+'/manufacturing'" class="block p-5 rounded-2xl border border-gray-300 bg-white hover:shadow">
          <p class="font-semibold">Արտադրամաս</p>
<!--          <p class="text-sm text-gray-500">MO Outputs → storage_products</p>-->
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
const pendingCount = ref(0)

const load = async () => {
  const id = Number(route.params.id)
  storage.value = await mainApi.getStorageById(id)
  pendingCount.value = await wmsApi.getPendingPlacementsCount(id)
}

onMounted(load)
watch(() => route.params.id, load)
</script>