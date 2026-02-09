<template>
  <div class="flex flex-col gap-y-2">
    <div class="flex flex-col">
      <div class="dark:border-gray-700 bg-white">
        <div class="flex gap-x-2 items-center p-4 border-b rounded-md border-gray-200 text-xl">
          <p>Վաճառքների ստորաբաժանում</p>
        </div>
      </div>
    </div>
    <div class="px-4">
      <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        <RouterLink :to="'/sales/discounts'" class="block p-5 rounded-2xl border border-gray-300 bg-white hover:shadow">
          <p class="font-semibold">Զեղչերի կառավարում</p>
        </RouterLink>
        <RouterLink :to="'/sales/pricing-policy'" class="block p-5 rounded-2xl border border-gray-300 bg-white hover:shadow">
          <p class="font-semibold">Գնային քաղաքականություն</p>
        </RouterLink>
        <RouterLink :to="'/sales/cash-registers'" class="block p-5 rounded-2xl border border-gray-300 bg-white hover:shadow">
          <p class="font-semibold">Դրամարկղերի կառավարում</p>
        </RouterLink>
        <RouterLink
            v-if="posAllowed"
            to="/sales/sale"
            class="block p-5 rounded-2xl border border-gray-300 bg-white hover:shadow"
        >
          <p class="font-semibold">Դրամարկղ</p>
          <p class="mt-1 text-xs text-slate-500">Աշխատեք վաճառքի զամբյուղով և նշմամբ</p>
        </RouterLink>
      </div>
      <div v-if="checking" class="text-xs text-slate-500 mt-2">Ստուգվում է հասանելիությունը…</div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { sales } from '@/api'

const checking = ref(false)
const posAllowed = ref(false)

onMounted(async () => {
  try {
    checking.value = true
    const { data } = await sales.sale.check()
    posAllowed.value = !!data?.data // show if not null
  } catch { posAllowed.value = false }
  finally { checking.value = false }
})
</script>