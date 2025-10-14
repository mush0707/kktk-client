<template>
  <div class="flex flex-col gap-y-2">
    <div class="flex flex-col">
      <div class="dark:border-gray-700 bg-white">
        <div class="flex gap-x-2 items-center p-4 border-b rounded-md border-gray-200 text-xl">
          <p>{{ $t('hr') }}</p>
        </div>
      </div>
    </div>

    <div class="px-4">
      <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        <RouterLink
            :to="'/requests/hr/leave-requests'"
            class="block p-5 rounded-2xl border border-gray-300 bg-white hover:shadow"
        >
          <p class="font-semibold">Արձակուրդների հայտեր</p>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">

</script>
