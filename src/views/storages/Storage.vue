<template>
  <div class="flex flex-col gap-y-4">
    <div class="dark:border-gray-700">
      <div class="flex flex-col gap-y-4 p-4 rounded-md bg-slate-100 text-xl">
        <p>{{ $t('storages') }}</p>
      </div>
    </div>

    <div class="h-[640px] overflow-y-auto">
      <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
        <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
        <tr>
          <th scope="col" class="px-6 py-3">
            {{ $t('address') }}
          </th>
          <th scope="col" class="px-6 py-3">
            {{ $t('type') }}
          </th>
          <th scope="col" class="px-6 py-3">
            {{ $t('storekeeper') }}
          </th>
          <th scope="col" class="px-6 py-3">
          </th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="storage in storages"
            class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200">
          <td class="px-6 py-4">
            {{ storage.address }}
          </td>
          <td class="px-6 py-4">
            {{ storage.cell ? $t('cell') : (storage.industrial ? $t('industrial') : $t('normal')) }}
          </td>
          <td class="px-6 py-4">
            {{ storage.storekeeper?.name }}
          </td>
          <td class="px-6 py-4">
            <div class="flex flex-wrap gap-2">
              <router-link :to="'/storages/'+storage.id"
                           type="button" v-if="!storage.cell"
                           class="px-3 py-1 text-xs font-medium text-white bg-amber-600 rounded-md shadow hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500">
                {{ $t('details') }}
              </router-link>
            </div>
          </td>
        </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>

import {defineComponent} from "vue";
import VueSelect from "vue3-select-component";
import api from "@/utils/api.js";

export default defineComponent({
  components: {VueSelect},
  data() {
    return {
      storages: [],
      hasNavigated: false,
    }
  },
  methods: {
    async list() {
      try {
        const response = await api.get("storages", { params: { cell: 0 } })
        this.storages = response.data.data || []

        // auto-navigate when exactly one storage (and it's not a cell)
        if (!this.hasNavigated && this.storages.length === 1 && !this.storages[0]?.cell) {
          this.hasNavigated = true
          this.$router.push(`/storages/${this.storages[0].id}`)
        }
      } catch (e) {
        // optionally handle error
      }
    },
  },
  mounted() {
    this.list();
  }
})
</script>