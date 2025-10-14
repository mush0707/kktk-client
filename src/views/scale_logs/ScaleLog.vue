<template>
  <div class="flex flex-col gap-y-4">
    <div class="dark:border-gray-700">
      <div class="flex flex-col gap-y-4 p-4 rounded-md bg-slate-100 text-xl">
        <p>{{ $t('scale_logs') }}</p>
      </div>
    </div>
    <div>
      <div class="flex gap-4 px-4">
        <button
            type="button"
            @click="syncScaleLogsFromProvider"
            class="px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:outline-none focus:ring-indigo-300 dark:focus:ring-indigo-800"
        >
          {{ $t('sync_scale_logs') }}
        </button>

        <button
            type="button" v-if="!loadingImport"
            @click="importSuppliers"
            class="px-5 py-2.5 rounded-lg text-sm font-medium text-indigo-600 border border-indigo-600 hover:bg-indigo-50 focus:ring-4 focus:outline-none focus:ring-indigo-300 dark:focus:ring-indigo-800"
        >
          {{ $t('import_suppliers') }}
        </button>
        <button
            type="button" v-else
            class="px-5 py-2.5 rounded-lg text-sm font-medium text-indigo-600 border border-indigo-600 hover:bg-indigo-50 focus:ring-4 focus:outline-none focus:ring-indigo-300 dark:focus:ring-indigo-800"
        >
          <svg aria-hidden="true" class="w-5 h-5 text-gray-200 animate-spin dark:text-gray-600 fill-indigo-600"
               viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                fill="currentColor"/>
            <path
                d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                fill="currentFill"/>
          </svg>
        </button>
      </div>
    </div>
    <div class="flex flex-col gap-y-4">
      <div class="flex flex-col gap-y-2 p-4 rounded-md shadow-lg bg-indigo-50">
        <div class="flex">
          <div class="border-b border-gray-300 pb-2">
            <p class="text-lg">{{ $t('filter') }}</p>
          </div>
        </div>
        <div class="flex flex-wrap gap-4">
          <div class="flex flex-col justify-end gap-y-2">
            <VueSelect
                v-model="filter.supplier_id"
                :loading="loading"
                :get-option-label="o => o.name"
                :get-option-value="o => o.id"
                :is-multi="false"
                :options="supplierList"
                :placeholder="$t('select_supplier')"
                :noResults="'Արդյունք չի գտնվել'"
            >
              <template #no-options>
                Արդյունք չի գտնվել
              </template>
              <template #option="{ option }">
                <div class="flex items-center gap-2">
                  <span class="font-medium">{{ option.name }}</span>
                </div>
              </template>
            </VueSelect>
          </div>
          <div class="flex flex-col gap-y-2">
            <label>{{ $t('from') }}</label>
            <DatePicker
                :teleport="true"
                z-index="3000"
                :enable-time-picker="true"
                auto-apply
                :clearable="false"
                @closed="onClosedDatePicker('date_start')"
                :placeholder="$t('select_date')"
                v-model="filter.date_start"
            />
          </div>
          <div class="flex flex-col gap-y-2">
            <label>{{ $t('to') }}</label>
            <DatePicker
                :teleport="true"
                z-index="3000"
                :enable-time-picker="true"
                auto-apply
                :clearable="false"
                @closed="onClosedDatePicker('date_end')"
                :placeholder="$t('select_date')"
                v-model="filter.date_end"
            />
          </div>
        </div>
      </div>
      <div>
        <label for="search" class="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white">Search</label>
        <div class="relative">
          <div class="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
            <svg class="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"
                 fill="none" viewBox="0 0 20 20">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
            </svg>
          </div>
          <input type="search" v-model="filter.search" id="search"
                 class="block w-full p-4 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                 :placeholder="$t('search')"/>
        </div>
      </div>
      <div class="h-[640px] overflow-y-auto" @scroll="onScrollCallback($event, 'logs','list')">
        <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
          <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th scope="col" class="px-6 py-3">
              {{ $t('status') }}
            </th>
            <th scope="col" class="px-6 py-3">
              {{ $t('license_plate') }}
            </th>
            <th scope="col" class="px-6 py-3">
              {{ $t('type') }}
            </th>
            <th scope="col" class="px-6 py-3">
              {{ $t('supplier') }}
            </th>
            <th scope="col" class="px-6 py-3">
              {{ $t('gross') }}
            </th>
            <th scope="col" class="px-6 py-3">
              {{ $t('netto') }}
            </th>
            <th scope="col" class="px-6 py-3">
              {{ $t('container') }}
            </th>
            <th scope="col" class="px-6 py-3">
              Կշեռքի ժամեր
            </th>
            <th scope="col" class="px-6 py-3">
              Թարմացվել է
            </th>
            <th scope="col" class="px-6 py-3">
            </th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="log in logs.data"
              :key="log.id"
              class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200">
            <td class="px-6 py-4">
              <div class="flex flex-col gap-y-2">
                <p v-if="log.storage_id" class="flex flex-col gap-y-1 font-bold">
                  <span>Դեպի՝ {{ log.storage.address }}</span>
                  <span>Որպես՝ {{ log.product.name }}</span>
                </p>
                <p v-else>{{ $t(log.status) }}</p>

              </div>

            </td>
            <td class="px-6 py-4">
              {{ log.license_plate }}
            </td>
            <td class="px-6 py-4">
              {{ $t(log.type) }}
            </td>
            <td class="px-6 py-4">
              {{ log.supplier }}
            </td>
            <td class="px-6 py-4">
              {{ log.gross }} {{ $t(log.measure) }}
            </td>
            <td class="px-6 py-4">
              {{ log.netto }} {{ $t(log.measure) }}
            </td>
            <td class="px-6 py-4">
              {{ log.container }} {{ $t(log.measure) }}
            </td>
            <td class="px-6 py-4">
              <div class="flex flex-col gap-y-2">
                <p>{{ log.time }}</p>
                <p>{{ log.updated_time }}</p>
              </div>
            </td>
            <td class="px-6 py-4">
              <span :title="log.updated_at">{{ formatDateTime(log.updated_at) }}</span>
              <span class="text-xs text-gray-400 ml-2">({{ fromNow(log.updated_at) }})</span>
            </td>
            <td class="px-6 py-4">
              <div v-if="!log.loading" class="flex flex-wrap gap-2">
                <div class="flex flex-wrap gap-2" v-if="log.status === 'active'">
                  <button @click="switchStatus(log, 'approved')"
                          type="button"
                          class="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded-md shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500">
                    {{ $t('accept') }}
                  </button>
                  <button @click="switchStatus(log, 'duplicate')"
                          type="button"
                          class="px-3 py-1 text-xs font-medium text-white bg-yellow-600 rounded-md shadow hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500">
                    {{ $t('duplicate') }}
                  </button>
                </div>
                <div class="flex flex-wrap gap-2" v-if="log.status === 'approved'">
                  <button @click="openStorageModal(log)"
                          type="button"
                          class="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded-md shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500">
                    Դեպի պահեստ
                  </button>
                  <!-- UPDATED: send_to_cell now goes through prepareSendToCell -->
                  <button @click="prepareSendToCell(log)"
                          type="button"
                          class="px-3 py-1 text-xs font-medium text-white bg-yellow-600 rounded-md shadow hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500">
                    {{ $t('send_to_cell') }}
                  </button>
                </div>
              </div>
              <div v-else>
                <button
                    type="button"
                    class="px-3 py-1 text-xs font-medium text-white bg-indigo-600 rounded-md shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <svg aria-hidden="true" class="w-4 h-4 text-gray-200 animate-spin dark:text-gray-600 fill-indigo-600"
                       viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                        fill="currentColor"/>
                    <path
                        d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                        fill="currentFill"/>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
          </tbody>
        </table>

      </div>
    </div>
  </div>

  <!-- Sync modal -->
  <SyncScaleLogsModal v-if="showSyncScaleLogsModal"/>

  <!-- Choose Storage modal -->
  <div v-if="chooseStorage.open" class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/40" @click="closeChooseStorageModal"></div>
    <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-xl">
      <div class="flex items-center justify-between px-5 py-4 border-b">
        <h3 class="text-lg font-semibold">{{ $t('choose_storage','Ընտրել պահեստ') }}</h3>
        <button class="p-2 rounded-lg hover:bg-gray-100" @click="closeChooseStorageModal" aria-label="Close">✕</button>
      </div>
      <div class="space-y-2">
        <div class="text-sm text-gray-600">
          Ընտրել բջիջ
        </div>
        <div>
          <select v-model.number="chooseStorage.selectedId" class="w-full border border-gray-300 rounded-xl px-3 py-2">
            <template v-for="s in storages" :key="s.id">
              <option :value="s.id" v-if="s.cell">
                {{ s.address || s.name || ('#'+s.id) }}
              </option>
            </template>
          </select>
        </div>
      </div>
      <div class="px-5 py-4 border-t flex justify-end gap-2">
        <button class="px-4 py-2 rounded-xl border" @click="closeChooseStorageModal">{{ $t('cancel','Չեղարկել') }}</button>
        <button
            class="px-4 py-2 rounded-xl border bg-amber-900 text-white disabled:opacity-60"
            :disabled="!chooseStorage.selectedId || chooseStorage.submitting"
            @click="confirmSendToCell"
        >
          <svg v-if="chooseStorage.submitting" class="h-4 w-4 animate-spin inline-block mr-2" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" d="M4 12a8 8 0 018-8" stroke="currentColor" stroke-width="4"/>
          </svg>
          <span>{{ $t('continue','Շարունակել') }}</span>
        </button>
      </div>
    </div>
  </div>

  <div v-if="toStorageModal.open" class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/40" @click="closeToStorageModal"></div>
    <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-xl">
      <div class="flex items-center justify-between px-5 py-4 border-b">
        <h3 class="text-lg font-semibold">Դեպի պահեստ</h3>
        <button class="p-2 rounded-lg hover:bg-gray-100" @click="closeToStorageModal" aria-label="Close">✕</button>
      </div>
      <div class="p-5 space-y-4">
        <div class="flex flex-col gap-y-2">
          <label class="text-sm text-gray-600">
            Ընտրել ապրանքը <span class="text-rose-700">*</span>
          </label>
          <div class="flex flex-col justify-end gap-y-2">
            <VueSelect
                v-model="toStorageModal.product_id"
                :loading="loading"
                :get-option-label="o => o.name"
                :get-option-value="o => o.id"
                :is-multi="false"
                :options="production_products"
                placeholder="Ընտրել ապրանք"
                :noResults="'Արդյունք չի գտնվել'"
            >
              <template #no-options>
                Արդյունք չի գտնվել
              </template>
              <template #option="{ option }">
                <div class="flex items-center gap-2">
                  <span class="font-medium">{{ option.name }}</span>
                </div>
              </template>
            </VueSelect>
          </div>
        </div>
        <div class="flex flex-col gap-y-2">
          <label class="text-sm text-gray-600">
            Ընտրել պահեստ <span class="text-rose-700">*</span>
          </label>
          <div>
            <select v-model.number="toStorageModal.selectedId" class="w-full border border-gray-300 rounded-xl px-3 py-2">
              <template v-for="s in storages" :key="s.id">
                <option :value="s.id" v-if="s.industrial">
                  {{ s.address || s.name || ('#'+s.id) }}
                </option>
              </template>
            </select>
          </div>
        </div>
      </div>
      <div class="px-5 py-4 border-t flex justify-end gap-2">
        <button class="px-4 py-2 rounded-xl border" @click="closeChooseStorageModal">{{ $t('cancel','Չեղարկել') }}</button>
        <button
            class="px-4 py-2 rounded-xl border bg-emerald-900 text-white disabled:opacity-60"
            :disabled="!toStorageModal.selectedId || !toStorageModal.product_id || toStorageModal.submitting"
            @click="confirmToStorage"
        >
          <svg v-if="toStorageModal.submitting" class="h-4 w-4 animate-spin inline-block mr-2" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" d="M4 12a8 8 0 018-8" stroke="currentColor" stroke-width="4"/>
          </svg>
          <span>{{ $t('continue','Շարունակել') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import SyncScaleLogsModal from "@/views/scale_logs/modals/SyncScaleLogsModal.vue";
import api from "@/utils/api.js";
import {useToast} from "vue-toastification";
import VueSelect from "vue3-select-component";
import {productsApi, wmsApi} from "@/api.js";
import { formatDateTime, fromNow } from '@/utils/dateFormat'

const toast = useToast();
export default {
  components: {VueSelect, SyncScaleLogsModal},
  data() {
    return {
      showSyncScaleLogsModal: false,
      loadingImport: false,
      logs: {
        data: [],
        prependedData: [],
        settings: {
          scrollProcessingTime: null,
          scrollHeight: null,
          scrollTop: null,
          clientHeight: null,
          offset: null,
          limit: 20,
        }
      },
      supplierList: [],
      filter: {
        supplier_id: null,
        search: null,
        date_start: null,
        date_end: null
      },
      loading: false,

      storages: [],
      production_products: [],
      chooseStorage: {
        open: false,
        selectedId: null,
        submitting: false,
        log: null, // the log we are processing
      },
      toStorageModal: {
        open: false,
        selectedId: null,
        product_id: null,
        submitting: false,
        log: null, // the log we are processing
      },
    }
  },
  watch: {
    'filter.search'() {
      this.resetPaginationSettings('logs')
      this.list();
    },
    'filter.supplier_id'() {
      this.resetPaginationSettings('logs')
      this.list();
    },
    'filter.date_start'() {
      this.resetPaginationSettings('logs')
      this.list();
    },
    'filter.date_end'() {
      this.resetPaginationSettings('logs')
      this.list();
    }
  },
  methods: {
    formatDateTime,
    fromNow,
    syncScaleLogsFromProvider() {
      this.showSyncScaleLogsModal = true;
    },
    onClosedDatePicker(key) {
      if (this.filter[key] && this.filter[key] instanceof Date) {
        this.filter[key].setHours(9, 0, 0, 0) // 🕘 պահել 09:00
      }
    },
    async importSuppliers() {
      this.loadingImport = true
      api.post('scale_logs/import-suppliers').then((response) => {
        this.loadingImport = false;
        toast.success(this.$t('suppliers_successfully_imported'));
      }).catch((response) => {
        this.loadingImport = false;
      })
    },
    async suppliers(search) {
      await api.get("scale_logs/suppliers").then((response) => {
        this.supplierList = response.data.data
      }).catch((response) => {
      })
    },
    openStorageModal(log) {
      const list = this.storages.filter((storage) => {
        if(!storage.cell) {
          return storage;
        }
      });
      if (list.length === 0) {
        log.loading = false;
        toast.error('Հասանելի արտադրամասեր չկան');
        return;
      }

      this.toStorageModal.log = log;
      this.toStorageModal.open = true;
    },

    // Generic status switch (unchanged for most statuses)
    async switchStatus(log, status) {
      if (status === 'send_to_cell') {
        // Route through the new flow
        return this.prepareSendToCell(log);
      }
      if (confirm(this.$t('are_you_sure'))) {
        log.loading = true;
        await api.patch("scale_logs/" + log.id + "/" + status).then((response) => {
          log.status = status;
          toast.success(this.$t('status_updated_successfully'));
          log.loading = false;
        }).catch((response) => {
          log.loading = false;
        })
      }
    },
    async getStorages() {
      const res = await wmsApi.getStorages({ is_active: 1 });
      this.storages = Array.isArray(res?.data) ? res.data : (res ?? []);
    },
    async getProductionProducts() {
      const res = await productsApi.search({ industrial: 1, limit: 150 });
      this.production_products = Array.isArray(res?.data) ? res.data : (res ?? []);
    },
    // NEW: prepare send_to_cell, decide auto vs. modal
    async prepareSendToCell(log) {
      const list = this.storages.filter((storage) => {
        if(storage.cell) {
          return storage;
        }
      });
      if (list.length === 0) {
        log.loading = false;
        toast.error(this.$t('no_storages_available','Հասանելի պահեստներ չկան'));
        return;
      }

      if (list.length === 1) {
        // Auto-send directly with the single storage id
        const sid = Number(list[0].id);
        await this.doSendToCell(log, sid);
        return;
      }

      // Multiple: open modal to choose
      this.chooseStorage.log = log;
      this.chooseStorage.selectedId = Number(list[0].id);
      this.chooseStorage.open = true;
      log.loading = false; // free row actions while modal is open
    },

    async confirmSendToCell() {
      if (!this.chooseStorage.selectedId || !this.chooseStorage.log) return;
      this.chooseStorage.submitting = true;
      await this.doSendToCell(this.chooseStorage.log, Number(this.chooseStorage.selectedId));
      this.chooseStorage.submitting = false;
      this.closeChooseStorageModal();
    },

    async confirmToStorage() {
      if (!this.toStorageModal.selectedId || !this.toStorageModal.product_id || !this.toStorageModal.log) return;
      this.toStorageModal.submitting = true;
      await this.doToStorage(this.toStorageModal.log, Number(this.toStorageModal.selectedId), this.toStorageModal.product_id ? Number(this.toStorageModal.product_id) : null);
      this.toStorageModal.submitting = false;
      this.closeToStorageModal();
    },

    // NEW: close modal
    closeChooseStorageModal() {
      this.chooseStorage.open = false;
      this.chooseStorage.selectedId = null;
      this.chooseStorage.log = null;
    },
    closeToStorageModal() {
      this.toStorageModal.open = false;
      this.toStorageModal.selectedId = null;
      this.toStorageModal.product_id = null;
      this.toStorageModal.log = null;
    },

    // NEW: actually call backend for send_to_cell with storage_id payload
    async doSendToCell(log, storageId) {
      try {
        // (Optional) confirm prompt; remove if not desired
        if (!confirm(this.$t('are_you_sure'))) return;

        log.loading = true;
        await api.patch(`scale_logs/${log.id}/send_to_cell/${storageId}`, { storage_id: storageId })
            .then(() => {
              // You can set a new status if API returns it; here we assume success -> maybe keep 'approved' or switch
              log.status = 'send_to_cell';
              toast.success(this.$t('status_updated_successfully'));
            })
            .catch(() => {})
            .finally(() => { log.loading = false; });
      } catch (e) {
        log.loading = false;
      }
    },
    async doToStorage(log, storageId, productId) {
      try {
        // (Optional) confirm prompt; remove if not desired
        if (!confirm(this.$t('are_you_sure'))) return;
        log.loading = true;
        await api.patch(`scale_logs/${log.id}/to_storage`, { product_id: productId, storage_id: storageId })
            .then(() => {
              log.status = 'to_storage';
              toast.success(this.$t('status_updated_successfully'));
            })
            .catch(() => {})
            .finally(() => { log.loading = false; });
      } catch (e) {
        log.loading = false;
      }
    },

    async list() {
      await api.get("scale_logs", {
        params: {
          limit: this.logs.settings.limit,
          offset: this.logs.settings.offset,
          search: this.filter.search,
          timezone: this.$getTimezone(),
          date_start: this.filter.date_start ? new Date(this.filter.date_start).toISOString() : null,
          date_end: this.filter.date_end ? new Date(this.filter.date_end).toISOString() : null,
          supplier_id: this.filter.supplier_id
        }
      }).then((response) => {
        if (this.logs.settings.offset > 0) {
          this.logs.prependedData = response.data.data
          this.logs.data = this.logs.data.concat(response.data.data);
        } else {
          this.logs.data = response.data.data
        }
      }).catch((response) => {
      })
    },

    async onScrollCallback(event, listName, listMethodName) {
      const self = this;
      if (!self.scrollProcessingTime) {
        if (event.target.scrollLeft === 0) {
          self[listName].settings.scrollHeight = event.target.scrollHeight
          self[listName].settings.scrollTop = event.target.scrollTop
          self[listName].settings.clientHeight = event.target.clientHeight
          if (self[listName].settings.scrollTop + self[listName].settings.clientHeight + 50 >= self[listName].settings.scrollHeight) {
            if (!self[listName].settings.offset) {
              if (self[listName].settings.limit === self[listName].data.length) {
                self[listName].settings.offset += self[listName].settings.limit;
              }
            } else {
              if (self[listName].data.length >= self[listName].settings.limit) {
                self.scrollProcessingTime = Date.now();
                self[listMethodName]().then(function () {
                  if (self[listName].prependedData.length === self[listName].settings.limit) {
                    self.scrollProcessingTime = null;
                    self[listName].settings.offset += self[listName].settings.limit;
                  }
                });
              }
            }
          }
        }
      }
    },
    async resetPaginationSettings(listName) {
      this[listName].settings.offset = null;
      this[listName].prependedData = [];
      this.scrollProcessingTime = null;
    },
  },
  mounted() {
    this.suppliers();
    this.list();
    this.getStorages();
    this.getProductionProducts();
    // Optional eager load of storages; commented to keep lazy:
    // this.fetchStorages();
  }
}
</script>
