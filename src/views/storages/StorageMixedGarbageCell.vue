<template>
  <div class="flex flex-col gap-y-4">
    <!-- Header -->
    <div class="dark:border-gray-700">
      <div class="flex items-center justify-between p-4 rounded-md bg-slate-100">
        <p class="text-xl font-semibold">{{ $t('storage_cells') }}</p>
      </div>
    </div>

    <!-- Top summary cards -->
    <div class="px-4">
      <div class="grid md:grid-cols-3 gap-3">
        <div class="rounded-2xl border border-gray-200 bg-white p-4">
          <div class="text-sm text-gray-500">Ընդհանուր առկա</div>
          <div class="mt-1 text-2xl font-semibold">
            {{ fmt(summary.available_qty) }} {{ $t('kg','կգ․') }}
          </div>
        </div>
        <div class="rounded-2xl border border-gray-200 bg-white p-4">
          <div class="text-sm text-gray-500">Ռեզերվ</div>
          <div class="mt-1 text-2xl font-semibold">
            {{ fmt(summary.reserved_qty) }} {{ $t('kg','կգ․') }}
          </div>
        </div>
        <div class="rounded-2xl border border-gray-200 bg-white p-4">
          <div class="text-sm text-gray-500">Ընդհանուր թաղված</div>
          <div class="mt-1 text-2xl font-semibold">
            {{ fmt(summary.buried_qty) }} {{ $t('kg','կգ․') }}
          </div>
        </div>
      </div>
    </div>
    <div class="px-4">
      <div class="rounded-2xl border border-gray-200 bg-white p-4 mt-4">
        <div class="flex items-end flex-wrap">
          <div class="flex flex-col gap-y-2">
            <label class="text-xs text-gray-600">Քանակ (կգ) (Մատչելի՝ {{ fmt(remainingQty) }} {{ $t('kg','կգ․') }})</label>
            <input
                type="number"
                min="0"
                step="0.001"
                v-model.number="bury.qty"
                class="border border-gray-300 rounded-xl px-3 py-2 w-44"
            />
          </div>
          <div class="flex flex-col justify-center">
            <button
                :disabled="!canSendBury || bury.saving"
                @click="sendBury"
                class="inline-flex items-center gap-2 px-4 py-2 rounded-xl border bg-rose-600 text-white disabled:opacity-60"
            >
              <svg v-if="bury.saving" class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" d="M4 12a8 8 0 018-8" stroke="currentColor" stroke-width="4"/>
              </svg>
              <span v-if="bury.saving">Կատարվում է…</span>
              <span v-else>Թաղել</span>
            </button>
          </div>

          <p v-if="bury.error" class="text-sm text-rose-600">{{ bury.error }}</p>
        </div>
      </div>
    </div>
    <!-- Tabs -->
    <div class="px-4">
      <div class="inline-flex rounded-xl border border-gray-200 bg-white p-1">
        <button
            class="px-4 py-2 rounded-lg text-sm font-medium"
            :class="tab==='entries' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-50'"
            @click="tab='entries'"
        >
          Մուտքային գրառումներ
        </button>
        <button
            class="px-4 py-2 rounded-lg text-sm font-medium"
            :class="tab==='buries' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-50'"
            @click="tab='buries'"
        >
          Թաղված աղբի պատմություն
        </button>
        <button
            class="px-4 py-2 rounded-lg text-sm font-medium"
            :class="tab==='planning' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-50'"
            @click="tab='planning'"
        >
          Պատվերներ
        </button>
        <button
            class="px-4 py-2 rounded-lg text-sm font-medium"
            :class="tab==='output_history' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-50'"
            @click="tab='output_history'"
        >
          Ելքերի պատմություն
        </button>
      </div>
    </div>

    <!-- Filters (Entries tab) -->
    <div v-if="tab==='entries'" class="flex flex-col gap-y-4 px-4">
      <div class="flex flex-col gap-y-3 p-4 rounded-2xl border border-gray-200 bg-white">
        <div class="border-b border-gray-200 pb-2">
          <p class="text-lg font-medium">{{ $t('filter') }}</p>
        </div>

        <div class="flex flex-wrap gap-4">
          <!-- Supplier -->
          <div class="flex flex-col justify-end gap-y-2 min-w-[240px]">
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
              <template #no-options>Արդյունք չի գտնվել</template>
              <template #option="{ option }">
                <div class="flex items-center gap-2">
                  <span class="font-medium">{{ option.name }}</span>
                </div>
              </template>
            </VueSelect>
          </div>

          <!-- Status -->
          <div class="flex flex-col gap-y-2 min-w-[220px]">
            <label class="text-xs text-gray-600">{{ $t('status','Կարգավիճակ') }}</label>
            <select v-model="filter.status" class="border border-gray-300 rounded-xl px-3 py-2">
              <option value="">Բոլորը</option>
              <option value="pending">Սպասման մեջ</option>
              <option value="in_progress">Ընթացքում</option>
              <option value="finished">Ավարտված</option>
              <option value="cancelled">Չեղարկված</option>
            </select>
          </div>

          <!-- Dates -->
          <div class="flex flex-col gap-y-2">
            <label class="text-xs text-gray-600">{{ $t('from') }}</label>
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
            <label class="text-xs text-gray-600">{{ $t('to') }}</label>
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

      <!-- Search -->
      <div>
        <label for="search" class="mb-2 text-sm font-medium text-gray-900 sr-only">Search</label>
        <div class="relative">
          <div class="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
            <svg class="w-4 h-4 text-gray-500" aria-hidden="true" viewBox="0 0 20 20" fill="none">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
            </svg>
          </div>
          <input
              type="search"
              v-model="filter.search"
              id="search"
              class="block w-full p-4 ps-10 text-sm border border-gray-300 rounded-xl bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500"
              :placeholder="$t('search')"
          />
        </div>
      </div>

      <!-- Entries list -->
      <div class="h-[640px] overflow-y-auto" @scroll="onScrollCallback($event, 'logs','list')">
        <div class="rounded-2xl border border-gray-200 overflow-hidden bg-white">
          <table class="w-full text-sm text-left text-gray-700">
            <thead class="text-xs uppercase bg-gray-50">
            <tr>
              <th class="px-6 py-3">#</th>
              <th class="px-6 py-3">{{ $t('license_plate') }}</th>
              <th class="px-6 py-3">{{ $t('supplier') }}</th>
              <th class="px-6 py-3">{{ $t('netto') }}</th>
              <th class="px-6 py-3">{{ $t('status','Կարգավիճակ') }}</th>
              <th class="px-6 py-3">{{ $t('created') }}</th>
              <th class="px-6 py-3 text-right"></th>
            </tr>
            </thead>
            <tbody>
            <tr
                v-for="log in logs.data"
                :key="log.id"
                class="border-t border-gray-100"
            >
              <td class="px-6 py-4">
                <div class="font-medium">{{ log.identification_number }}</div>
              </td>
              <td class="px-6 py-4">
                <div class="font-medium">{{ log.license_plate }}</div>
              </td>

              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <!--                    <span class="inline-flex items-center rounded-full bg-indigo-50 text-indigo-700 text-[11px] px-2 py-0.5">-->
                  <!--                      {{ $t('supplier') }}-->
                  <!--                    </span>-->
                  <span>{{ log.supplier_name }}</span>
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="font-medium">{{ log.qty }}</span> {{ $t(log.measure) }}
              </td>
              <td class="px-6 py-4">
                  <span
                      class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                      :class="badgeClass(log.status)"
                  >
                    {{ $t(log.status) }}
                  </span>
              </td>
              <td class="px-4 py-3">
                <span :title="log.created_at">{{ formatDateTime(log.created_at) }}</span>
                <span class="text-xs text-gray-400 ml-2">({{ fromNow(log.created_at) }})</span>
              </td>

              <td class="px-6 py-4">
                <div v-if="!log.loading" class="flex justify-end">
                  <button
                      v-if="log.status === 'pending'"
                      @click="approve(log)"
                      type="button"
                      class="px-3 py-1 text-xs font-medium text-white bg-emerald-600 rounded-md shadow hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    Հաստատել
                  </button>
                </div>
                <div v-else class="flex justify-end">
                  <button type="button"
                          class="px-3 py-1 text-xs font-medium text-white bg-emerald-600 rounded-md shadow focus:outline-none">
                    <svg aria-hidden="true" class="w-4 h-4 animate-spin fill-white" viewBox="0 0 100 101" fill="none">
                      <path
                          d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908Z"
                          fill="currentColor"/>
                      <path
                          d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                          fill="currentFill"/>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="!loading && logs.data.length===0">
              <td colspan="7" class="px-6 py-10 text-center text-gray-500">
                {{ $t('no_data','Տվյալներ չկան') }}
              </td>
            </tr>
            </tbody>
          </table>
        </div>

      </div>
    </div>
    <div v-if="tab==='buries'" class="flex flex-col gap-y-4 px-4">
      <div class="flex flex-col gap-y-3 p-4 rounded-2xl border border-gray-200 bg-white">
        <div class="border-b border-gray-200 pb-2">
          <p class="text-lg font-medium">{{ $t('filter') }}</p>
        </div>

        <div class="flex flex-wrap gap-4">
          <!-- Dates -->
          <div class="flex flex-col gap-y-2">
            <label class="text-xs text-gray-600">{{ $t('from') }}</label>
            <DatePicker
                :teleport="true"
                z-index="3000"
                :enable-time-picker="true"
                auto-apply
                :clearable="false"
                @closed="onClosedDatePicker('date_start')"
                :placeholder="$t('select_date')"
                v-model="bury_filter.date_start"
            />
          </div>
          <div class="flex flex-col gap-y-2">
            <label class="text-xs text-gray-600">{{ $t('to') }}</label>
            <DatePicker
                :teleport="true"
                z-index="3000"
                :enable-time-picker="true"
                auto-apply
                :clearable="false"
                @closed="onClosedDatePicker('date_end')"
                :placeholder="$t('select_date')"
                v-model="bury_filter.date_end"
            />
          </div>
        </div>
      </div>

      <!-- Entries list -->
      <div class="h-[640px] overflow-y-auto" @scroll="onScrollCallback($event, 'logs','list')">
        <div class="rounded-2xl border border-gray-200 overflow-hidden bg-white">
          <table class="w-full text-sm text-left text-gray-700">
            <thead class="text-xs uppercase bg-gray-50">
            <tr>
              <th class="px-6 py-3">Քանակ</th>
              <th class="px-6 py-3">Թարմացվել է</th>
              <th class="px-6 py-3">Կարգավիճակ</th>
              <th class="px-6 py-3"></th>
            </tr>
            </thead>
            <tbody>
            <tr
                v-for="bury in buries.data"
                :key="bury.id"
                class="border-t border-gray-100"
            >
              <td class="px-6 py-4">
                <div class="font-medium">{{ bury.qty }} {{ $t(bury.measure ?? 'piece') }}</div>
              </td>
              <td class="px-4 py-3">
                <span :title="bury.updated_at">{{ formatDateTime(bury.updated_at) }}</span>
                <span class="text-xs text-gray-400 ml-2">({{ fromNow(bury.updated_at) }})</span>
              </td>
              <td class="px-6 py-4">
                  <span
                      class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                      :class="badgeClass(bury.status)"
                  >
                    {{ $t(bury.status) }}
                  </span>
              </td>
              <td class="px-6 py-4">
                <div v-if="!bury.loading" class="flex justify-end">
                  <button
                      v-if="bury.status !== 'cancelled'"
                      @click="cancelBury(bury)"
                      type="button"
                      class="px-3 py-1 text-xs font-medium text-white bg-rose-600 rounded-md shadow hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    Չեղարկել
                  </button>
                </div>
                <div v-else class="flex justify-end">
                  <button type="button"
                          class="px-3 py-1 text-xs font-medium text-white bg-rose-600 rounded-md shadow focus:outline-none">
                    <svg aria-hidden="true" class="w-4 h-4 animate-spin fill-white" viewBox="0 0 100 101" fill="none">
                      <path
                          d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908Z"
                          fill="currentColor"/>
                      <path
                          d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                          fill="currentFill"/>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="!loading && buries.data.length===0">
              <td colspan="7" class="px-6 py-10 text-center text-gray-500">
                {{ $t('no_data','Տվյալներ չկան') }}
              </td>
            </tr>
            </tbody>
          </table>
        </div>

      </div>
    </div>

    <!-- Planning outputs tab -->
    <div v-else class="px-4">
      <div class="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-600">
        <div class="text-lg font-medium mb-1">Կլինի շուտով</div>
        <div class="text-sm">Պլանավորվող ելքերի բաժինը մշակման փուլում է</div>
      </div>
    </div>
  </div>
</template>

<script>
import VueSelect from "vue3-select-component";
import api from "@/utils/api.js";
import { useToast } from "vue-toastification";
import { formatDateTime, fromNow } from '@/utils/dateFormat'

const toast = useToast();

export default {
  components: { VueSelect },
  data() {
    return {
      tab: 'entries',

      summary: {
        available_qty: 0,
        reserved_qty: 0,
        buried_qty: 0,
      },
      bury: {
        qty: 0,
        saving: false,
        error: ''
      },
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
      buries: {
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
        date_end: null,
        status: '', // ← NEW
      },
      bury_filter: {
        date_start: null,
        date_end: null,
      },
      loading: false,
    }
  },
  watch: {
    'filter.search'() {
      this.resetPaginationSettings('logs');
      this.list();
    },
    'filter.supplier_id'() {
      this.resetPaginationSettings('logs');
      this.list();
    },
    'filter.date_start'() {
      this.resetPaginationSettings('logs');
      this.list();
    },
    'filter.date_end'() {
      this.resetPaginationSettings('logs');
      this.list();
    },
    'filter.status'() { // ← NEW
      this.resetPaginationSettings('logs');
      this.list();
    },
    'bury_filter.date_start'() {
      this.resetPaginationSettings('buries');
      this.buryList();
    },
    'bury_filter.date_end'() {
      this.resetPaginationSettings('buries');
      this.buryList();
    },
  },
  computed: {
    remainingQty(){
      console.log(this.summary?.available_qty);
      const a = Number(this.summary?.available_qty || 0)
      const r = Number(this.summary?.reserved_qty || 0)
      return Math.max(0, a - r)
    },
    canSendBury() {
      return Number(this.bury.qty) > 0 &&
          Number(this.bury.qty) <= this.remainingQty &&
          !this.bury.saving
    }
  },
  methods: {
    formatDateTime,
    fromNow,
    fmt(n){ return Number(n || 0).toLocaleString(undefined,{ maximumFractionDigits: 3 }) },

    badgeClass(status){
      switch (String(status || '').toLowerCase()){
        case 'pending':      return 'bg-amber-100 text-amber-700';
        case 'in_progress':  return 'bg-indigo-100 text-indigo-700';
        case 'finished':     return 'bg-emerald-100 text-emerald-700';
        case 'cancelled':    return 'bg-rose-100 text-rose-700';
        default:             return 'bg-slate-100 text-slate-700';
      }
    },

    onClosedDatePicker(key) {
      if (this.filter[key] && this.filter[key] instanceof Date) {
        this.filter[key].setHours(9, 0, 0, 0)
      }
    },

    async fetchSummary() {
      try {
        const { id } = this.$route.params;
        const res = await api.get(`storages/mixed_garbage/${id}/summary`);
        const data = res?.data?.data || {};
        this.summary.available_qty = Number(data.available_qty || 0);
        this.summary.reserved_qty  = Number(data.reserved_qty || 0);
        this.summary.buried_qty  = Number(data.buried_qty || 0);
      } catch (e) {
        // optional: toast
      }
    },

    async suppliers() {
      await api.get("scale_logs/suppliers").then((response) => {
        this.supplierList = response.data.data
      }).catch(() => {})
    },

    async approve(log) {
      if (confirm(this.$t('are_you_sure'))) {
        log.loading = true;
        await api.patch(`storages/mixed_garbage/${this.$route.params.id}/${log.id}/approve`).then(() => {
          log.status = 'finished';
          this.fetchSummary();
          toast.success(this.$t('status_updated_successfully'));
          log.loading = false;
        }).catch(() => {
          log.loading = false;
        })
      }
    },
    async cancelBury(bury) {
      if (confirm(this.$t('are_you_sure'))) {
        bury.loading = true;
        await api.delete(`storages/mixed_garbage/${this.$route.params.id}/bury/${bury.id}`).then(() => {
          bury.status = 'cancelled';
          this.fetchSummary();
          toast.success(this.$t('status_updated_successfully'));
          bury.loading = false;
        }).catch(() => {
          bury.loading = false;
        })
      }
    },

    async list() {
      const { id } = this.$route.params;
      await api.get(`storages/mixed_garbage/${id}/entries`, {
        params: {
          limit: this.logs.settings.limit,
          offset: this.logs.settings.offset,
          search: this.filter.search,
          timezone: this.$getTimezone?.(),
          date_start: this.filter.date_start ? new Date(this.filter.date_start).toISOString() : null,
          date_end: this.filter.date_end ? new Date(this.filter.date_end).toISOString() : null,
          supplier_id: this.filter.supplier_id,
          status: this.filter.status || undefined, // ← NEW
        }
      }).then((response) => {
        const rows = response?.data?.data || []
        if (this.logs.settings.offset > 0) {
          this.logs.prependedData = rows
          this.logs.data = this.logs.data.concat(rows);
        } else {
          this.logs.data = rows
        }
      }).catch(() => {})
    },
    async buryList() {
      const { id } = this.$route.params;
      await api.get(`storages/mixed_garbage/${id}/buries`, {
        params: {
          limit: this.buries.settings.limit,
          offset: this.buries.settings.offset,
          date_start: this.bury_filter.date_start ? new Date(this.bury_filter.date_start).toISOString() : null,
          date_end: this.bury_filter.date_end ? new Date(this.fibury_filterlter.date_end).toISOString() : null,
        }
      }).then((response) => {
        const rows = response?.data?.data || []
        if (this.buries.settings.offset > 0) {
          this.buries.prependedData = rows
          this.buries.data = this.buries.data.concat(rows);
        } else {
          this.buries.data = rows
        }
      }).catch(() => {})
    },

    async sendBury(){
      this.bury.error = ''
      if (!this.canSendBury) return
      this.bury.saving = true
      try{
        const { id } = this.$route.params
        await api.patch(`storages/mixed_garbage/${id}/bury`, {
          qty: Number(this.bury.qty)
        })
        this.bury.qty = 0
        // refresh summary (and list if needed)
        await this.fetchSummary()
        await this.buryList()
        toast.success('Պահպանվեց')
      }catch(e){
        this.bury.error = e?.response?.data?.message || e?.message || 'Error'
      }finally{
        this.bury.saving = false
      }
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
                self[listName].settings.offset = (self[listName].settings.offset || 0) + self[listName].settings.limit;
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
  async mounted() {
    await Promise.all([this.suppliers(), this.fetchSummary(), this.list(), this.buryList()]);
  }
}
</script>
