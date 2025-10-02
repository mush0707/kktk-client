<template>
  <div id="sync-scale-logs-modal" tabindex="-1" aria-hidden="true"
       class="bg-slate-800/25 fixed top-0 left-0 right-0 z-50 hidden w-full overflow-x-hidden overflow-y-auto md:inset-0 max-h-full">
    <div class="relative overflow-y-auto bg-white w-full max-w-4xl ">
      <div class="flex items-center justify-between p-4 rounded-t dark:border-gray-600">

        <p class="text-xl">{{ $t('sync_scale_logs') }}</p>
        <button type="button"
                class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white"
                @click="modalObj.hide()">
          <svg aria-hidden="true" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"
               xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clip-rule="evenodd"></path>
          </svg>
          <span class="sr-only">Close modal</span>
        </button>
      </div>
      <div class="px-4 pb-4">
        <form @submit="sync" class="flex flex-col gap-y-2">
          <div class="flex flex-col gap-y-2">
            <label>{{ $t('from') }}</label>
            <DatePicker
                :teleport="true"
                z-index="3000"
                :enable-time-picker="true"
                auto-apply
                :clearable="false"
                @closed="onClosedDatePicker('start_date')"
                :placeholder="$t('select_date')"
                v-model="form.start_date"
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
                @closed="onClosedDatePicker('end_date')"
                :placeholder="$t('select_date')"
                v-model="form.end_date"
            ></DatePicker>
          </div>
          <div class="flex flex-col gap-y-2">
            <label>{{ $t('select_trucks') }}</label>
            <VueSelect
                v-model="form.trucks"
                @search="truckList"
                :filterable="false"
                :loading="loading"
                :is-searchable="true"
                :get-option-label="o => o.license_plate"
                label="license_plate"
                track-by="id"
                :is-multi="true"
                :options="trucks"
                :placeholder="$t('select_trucks')"
                :noResults="'Արդյունք չի գտնվել'"
            >
              <template #no-options>
                Արդյունք չի գտնվել
              </template>
              <!-- Յուրաքանչյուր տարբերակի (option) ցուցադրում -->
              <template #option="{ option }">
                <div class="flex items-center gap-2">
                  <span class="font-medium">{{ option.license_plate }}</span>
                </div>
              </template>

            </VueSelect>
          </div>
          <div class="mt-4">
            <button
                type="submit" v-if="!loading"
                class="px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:outline-none focus:ring-indigo-300 dark:focus:ring-indigo-800"
            >
              {{ $t('sync_scale_logs') }}
            </button>
            <button
                type="button" v-else
                class="px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:outline-none focus:ring-indigo-300 dark:focus:ring-indigo-800"
            >
              <svg aria-hidden="true" class="w-5 h-5 text-gray-200 animate-spin dark:text-gray-600 fill-indigo-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
<script>
import {Modal} from "flowbite";
import VueSelect from "vue3-select-component";
import api from "@/utils/api.js";
import {useToast} from "vue-toastification";
const toast = useToast();

export default {
  components: {VueSelect},
  data() {
    return {
      modalObj: null,
      form: {
        start_date: null,
        end_date: null,
        trucks: null
      },
      trucks: [],
      loading: false
    }
  },
  methods: {
    onClosedDatePicker(key) {
      if (this.form[key] && this.form[key] instanceof Date) {
        this.form[key].setHours(9, 0, 0, 0) // 🕘 պահել 09:00
      }
    },
    async truckList(search) {
      this.loading = true;
      await api.get("trucks", {
        params: {
          limit: 50,
          search: search
        }
      }).then((response) => {
        this.loading = false;
        this.trucks = response.data.data
      }).catch((response) => {
        this.loading = false;
      })
    },
    async sync(e) {
      e.preventDefault();
      if(!this.form.start_date) {
        toast.error(this.$t('select_from'));
        return;
      }
      this.loading = true;
      await api.post("scale_logs/sync", {
        date_start: this.form.date_start ? new Date(this.form.date_start).toISOString() : null,
        date_end: this.form.date_end ? new Date(this.form.date_end).toISOString() : null,
        truck_ids: this.form.trucks.map((truck) => {
          return truck.id
        }),
      }).then((response) => {
        this.loading = false;
        this.trucks = response.data.data
      }).catch((response) => {
        this.loading = false;
      })
    }
  },
  mounted() {
    this.modalObj = new Modal(document.getElementById('sync-scale-logs-modal'), {
      placement: 'center',
      closable: true, backdropClasses: 'bg-gray-900/50 dark:bg-gray-900/80 fixed inset-0 z-40 modal-backdrop',
      onHide: () => {
        this.$parent.showSyncScaleLogsModal = false;
      },
    })
    this.modalObj.show();
    this.truckList();
  }
}
</script>
