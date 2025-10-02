<template>
  <div class="flex flex-col gap-y-4">
    <div class="dark:border-gray-700">
      <div class="flex flex-col gap-y-4 p-4 border rounded-md border-gray-200 bg-slate-100 text-xl">
        <p>{{ $t('invoices') }}</p>
      </div>
    </div>
    <div
        class="text-sm font-medium text-center text-gray-500 border-b border-gray-200 dark:text-gray-400 dark:border-gray-700">
      <ul class="flex flex-wrap -mb-px">
        <li v-for="(tab, index) in tabs" @click="changeTab(index)" class="me-2">
          <a href="#" class="inline-block p-4 border-b-2 rounded-t-lg" :class="{
            'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300': !tab.active,
            'text-blue-600 border-blue-600 active dark:text-blue-500 dark:border-blue-500': tab.active
          }">{{ tab.name }}</a>
        </li>
      </ul>
    </div>
    <div v-if="activeTab === 'list'">
      <div class="space-y-4">
        <!-- Filters -->
        <div class="flex flex-col gap-y-2 p-4 rounded-md shadow-lg bg-indigo-50">
          <div class="flex">
            <div class="border-b border-gray-300 pb-2">
              <p class="text-lg">{{ $t('filter') }}</p>
            </div>
          </div>
          <div class="flex flex-wrap gap-4">
            <div class="flex flex-col gap-y-2">
              <label>{{ $t('from') }}</label>
              <DatePicker
                  :teleport="true"
                  z-index="3000"
                  :enable-time-picker="true"
                  auto-apply
                  :clearable="false"
                  @closed="onClosedDatePicker('from')"
                  :placeholder="$t('select_date')"
                  v-model="filter.from"
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
                  @closed="onClosedDatePicker('to')"
                  :placeholder="$t('select_date')"
                  v-model="filter.to"
              ></DatePicker>
            </div>
          </div>
          <div class="flex flex-wrap gap-4">
            <div class="flex flex-col gap-y-2">
              <label>{{ $t('status') }}</label>
              <select v-model="filter.status"
                      class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
                <option v-for="status in statuses" :value="status.key">{{ status.name }}</option>
              </select>
            </div>
            <div class="flex flex-col gap-y-2">
              <label>{{ $t('buyer') }}</label>
              <VueSelect
                  v-model="filter.buyer_id"
                  @search="buyerList"
                  :filterable="false"
                  :loading="loading"
                  :is-searchable="true"
                  :get-option-label="o => o.name"
                  :get-option-value="o => o.id"
                  :is-multi="false"
                  :options="buyers"
                  :placeholder="$t('select_buyer')"
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
              <label>{{ $t('seller') }}</label>
              <VueSelect
                  v-model="filter.seller_id"
                  @search="sellerList"
                  :filterable="false"
                  :loading="loading"
                  :is-searchable="true"
                  :get-option-label="o => o.name"
                  :get-option-value="o => o.id"
                  :is-multi="false"
                  :options="sellers"
                  :placeholder="$t('select_seller')"
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
            <input type="search" v-model="filter.search"
                   class="block w-full p-4 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                   :placeholder="$t('search')"/>
          </div>
        </div>
        <!-- Table -->
        <div class="h-[640px] overflow-y-auto overflow-x-auto bg-white" @scroll="onScrollCallback($event, 'invoices','list')">
          <table class="w-full text-sm">
            <thead class="text-left bg-slate-50">
            <tr class="h-10">
              <th class="px-3 py-2">ID</th>
              <th class="px-3 py-2">{{ $t('status') }}</th>
              <th class="px-3 py-2">Սերիա/Համար</th>
              <th class="px-3 py-2">Ամսաթիվ</th>
              <th class="px-3 py-2">Վաճառող</th>
              <th class="px-3 py-2">Գնորդ</th>
              <th class="px-3 py-2 text-right">Ընդամենը</th>
              <th class="px-3 py-2">Արժույթ</th>
              <th class="px-3 py-2"></th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="row in invoices.data" :key="row.id" class="border-t">
              <td class="px-3 py-2">{{ row.id }}</td>
              <td class="px-3 py-2">{{ $t(row.status) }}</td>
              <td class="px-3 py-2">
                <span v-if="row.series">{{ row.series }}-</span>{{ row.number || '—' }}
              </td>
              <td class="px-3 py-2 whitespace-nowrap">{{ formatHyAm(row.issue_date) }}</td>
              <td class="px-3 py-2">{{ row.seller?.name }}</td>
              <td class="px-3 py-2">{{ row.buyer?.name }}</td>
              <td class="px-3 py-2 text-right">{{ formatMoney(row.grand_total) }}</td>
              <td class="px-3 py-2">{{ row.currency }}</td>
              <td class="px-3 py-2">
                <div class="flex gap-x-2" v-if="!row.loading">
                  <router-link :to="'/accounting/invoices/'+row.id"
                               class="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-md shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {{ $t('details') }}
                  </router-link>
                  <button @click="switchStatus(row, 'ready')" v-if="row.status === 'draft'"
                          type="button"
                          class="px-3 py-1 text-xs font-medium text-white bg-indigo-600 rounded-md shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    Պատրաստ ուղարկման
                  </button>
                  <button @click="switchStatus(row, 'sent')" v-if="row.status === 'draft' || row.status === 'ready'"
                      type="button"
                      class="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded-md shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500">
                    Ուղարկել e-invoice
                  </button>
                  <button @click="switchStatus(row, 'accepted')" v-if="row.status === 'sent'"
                          type="button"
                          class="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded-md shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500">
                    Հաստատել
                  </button>
                  <button @click="switchStatus(row, 'cancelled')" v-if="row.status !== 'accepted'"
                          type="button"
                          class="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded-md shadow hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500">
                    Չեղարկել
                  </button>
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

            <tr v-if="!loading && invoices.data.length === 0">
              <td colspan="8" class="px-3 py-6 text-center text-slate-500">Չկան արդյունքներ</td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <div v-if="activeTab === 'new_invoice'">
      <NewInvoice @updateList="updateList"/>
    </div>
  </div>
</template>
<script>
import NewInvoice from '@/views/accounting/components/NewInvoice.vue'
import api from "@/utils/api.js";
import VueSelect from "vue3-select-component";

export default {
  components: {
    VueSelect,
    NewInvoice
  },
  data() {
    return {
      tabs: [
        {
          name: this.$t('list'),
          key: 'list',
          active: 1
        },
        {
          name: this.$t('new_invoice'),
          key: 'new_invoice',
          active: 0
        }
      ],
      filter: {
        buyer_id: null,
        seller_id: null,
        from: null,
        to: null,
        search: null,
        status: null
      },
      activeTab: 'list',
      loading: false,
      invoices: {
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
      buyers: [],
      sellers: [],
      statuses: [
        {
          name: this.$t('draft'),
          key: 'draft'
        },
        {
          name: this.$t('ready'),
          key: 'ready'
        },
        {
          name: this.$t('sent'),
          key: 'sent'
        },
        {
          name: this.$t('accepted'),
          key: 'accepted'
        },
        {
          name: this.$t('rejected'),
          key: 'rejected'
        },
        {
          name: this.$t('cancelled'),
          key: 'cancelled'
        }
      ]
    }
  },
  watch: {
    'filter.buyer_id'() {
      this.resetPaginationSettings('invoices')
      this.list();
    },
    'filter.seller_id'() {
      this.resetPaginationSettings('invoices')
      this.list();
    },
    'filter.from'() {
      this.resetPaginationSettings('invoices')
      this.list();
    },
    'filter.to'() {
      this.resetPaginationSettings('invoices')
      this.list();
    },
    'filter.search'() {
      this.resetPaginationSettings('invoices')
      this.list();
    },
    'filter.status'() {
      this.resetPaginationSettings('invoices')
      this.list();
    }
  },
  methods: {
    changeTab(index) {
      this.tabs.map((tab, localIndex) => {
        tab.active = index === localIndex;
        if (tab.active) {
          this.activeTab = tab.key
        }
      })
    },
    onClosedDatePicker(key) {
      if (this.filter[key] && this.filter[key] instanceof Date) {
        this.filter[key].setHours(9, 0, 0, 0) // 🕘 պահել 09:00
      }
    },
    updateList() {
      this.changeTab(0);
      this.list();
    },
    async switchStatus(row, status) {
      if(confirm(this.$t('are_you_sure'))) {
        row.loading = true;
        await api.patch("accounting/invoices/"+row.id+"/switch/"+status).then((response) => {
          row.loading = false;
          row.status = status;
        }).catch((response) => {
          row.loading = false;
        })
      }
    },
    async list() {
      await api.get("accounting/invoices", {
        params: {
          limit: this.invoices.settings.limit,
          offset: this.invoices.settings.offset,
          buyer_id: this.filter.buyer_id,
          seller_id: this.filter.seller_id,
          from: this.filter.from ? new Date(this.filter.from).toISOString() : null,
          to: this.filter.to ? new Date(this.filter.to).toISOString() : null,
          search: this.filter.search,
          status: this.filter.status,
        }
      }).then((response) => {
        if (this.invoices.settings.offset > 0) {
          this.invoices.prependedData = response.data.data
          this.invoices.data = this.invoices.data.concat(response.data.data);
        } else {
          this.invoices.data = response.data.data
        }
      }).catch((response) => {
      })
    },
    formatHyAm(iso) {
      if (!iso) return '—';
      const d = new Date(iso);
      return new Intl.DateTimeFormat('hy-AM', {
        timeZone: 'Asia/Yerevan',
        year: 'numeric', month: '2-digit', day: '2-digit',
      }).format(d);
    },
    async buyerList(search) {
      await api.get("partners", {
        params: {
          limit: 40,
          search: search,
          type: 'buyer'
        }
      }).then((response) => {
        this.buyers = response.data.data
      }).catch((response) => {
      })
    },
    async sellerList(search) {
      await api.get("partners", {
        params: {
          limit: 40,
          search: search,
          type: 'seller'
        }
      }).then((response) => {
        this.sellers = response.data.data
      }).catch((response) => {
      })
    },
    formatMoney(n) {
      const num = Number(n || 0);
      return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
    this.list();
    this.buyerList();
    this.sellerList();
  }
}
</script>
