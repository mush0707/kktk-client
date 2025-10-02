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
              <!-- Յուրաքանչյուր տարբերակի (option) ցուցադրում -->
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
            ></DatePicker>
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
            ></DatePicker>
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
              {{ $t('created') }}
            </th>
            <th scope="col" class="px-6 py-3">
              {{ $t('updated') }}
            </th>
            <th scope="col" class="px-6 py-3">
            </th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="log in logs.data"
              class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200">
            <td class="px-6 py-4">
              {{ $t(log.status) }}
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
              {{ log.time }}
            </td>
            <td class="px-6 py-4">
              {{ log.updated_time }}
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
                  <button @click="switchStatus(log, 'to_production')"
                          type="button"
                          class="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded-md shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500">
                    {{ $t('to_production') }}
                  </button>
                  <button @click="switchStatus(log, 'send_to_cell')"
                          type="button"
                          class="px-3 py-1 text-xs font-medium text-white bg-yellow-600 rounded-md shadow hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500">
                    {{ $t('send_to_cell') }}
                  </button>
                </div>
                <!--                <button v-if="truck.status === 'active'" @click="switchStatus(truck, 'broke')"-->
                <!--                        type="button"-->
                <!--                        class="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded-md shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500">-->
                <!--                  {{ $t('broke') }}-->
                <!--                </button>-->
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
  <SyncScaleLogsModal v-if="showSyncScaleLogsModal"/>
</template>
<script>
import SyncScaleLogsModal from "@/views/scale_logs/modals/SyncScaleLogsModal.vue";
import api from "@/utils/api.js";
import {useToast} from "vue-toastification";
import VueSelect from "vue3-select-component";

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
      loading: false
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
    async switchStatus(log, status) {
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
  }
}
</script>