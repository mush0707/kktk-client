<template>
  <div id="add-edit-product-modal" tabindex="-1" aria-hidden="true"
       class="bg-slate-800/25 fixed top-0 left-0 right-0 z-50 hidden w-full overflow-x-hidden overflow-y-auto md:inset-0 max-h-full">
    <div class="relative h-screen overflow-y-auto bg-white w-full max-w-4xl ">
      <div class="flex items-center justify-between p-4 rounded-t dark:border-gray-600">

        <p class="text-xl">{{ this.product ? $t('edit_product') : $t('new_product') }}</p>
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
        <form @submit="store" class="flex flex-col gap-y-2">
          <div class="flex flex-col gap-y-2">
            <label>{{ $t('select_type') }}</label>
            <VueSelect
                v-model="form.type_id"
                @search="typeList"
                :filterable="false"
                :loading="loading"
                :is-searchable="true"
                :get-option-label="o => o.name"
                :get-option-value="o => o.id"
                :is-multi="false"
                :options="types"
                :placeholder="$t('select_type')"
                :noResults="'Արդյունք չի գտնվել'"
            >
              <template #no-options>
                Արդյունք չի գտնվել
              </template>
              <!-- Յուրաքանչյուր տարբերակի (option) ցուցադրում -->
              <template #option="{ option }">
                <div class="flex items-center gap-2">
                  <span class="font-medium">{{ option.name }} {{ option.industrial ? '(' + $t('industrial') + ')' : null }}</span>
                </div>
              </template>

            </VueSelect>
          </div>
          <div class="flex flex-col gap-y-2">
            <label>{{ $t('name') }}</label>
            <input type="text" name="name" v-model="form.name"
                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div class="flex flex-col gap-y-2">
            <label class="block font-medium text-gray-900 dark:text-white">{{ $t('measure') }}</label>
            <select v-model="form.measure_type" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
              <option v-for="measure in measure_units" :value="measure.key">{{ measure.name }}</option>
            </select>
          </div>
          <div class="flex items-center">
            <input v-model="form.is_own" id="own-checkbox" type="checkbox" value="" class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600">
            <label for="own-checkbox" class="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">{{ $t('own') }}</label>
          </div>
          <div class="p-2 bg-indigo-50 rounded-lg flex flex-col gap-y-2">
            <label>{{ $t('characteristics') }}</label>
            <div class="flex flex-col gap-y-2">
              <div class="flex items-center" v-for="(characteristic, index) in form.characteristics">
                <input type="text" v-model="characteristic.type" :placeholder="$t('characteristic_type_example')"
                       class="w-full bg-white px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                <input type="text" v-model="characteristic.value" :placeholder="$t('characteristic_value_example')"
                       class="w-full bg-white px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                <button @click="removeCharacteristic(index)"
                    type="button"
                    class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white bg-rose-600 hover:bg-rose-700 focus:ring-4 focus:ring-rose-300 transition-colors shadow-md"
                >
                  <svg
                      class="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 6l12 12M6 18L18 6" />
                  </svg>
                </button>
              </div>
            </div>
            <div class="flex">
              <button @click="newCharacteristic"
                  type="button"
                  class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white bg-violet-600 hover:bg-violet-700 focus:ring-4 focus:ring-violet-300 transition-colors shadow-md"
              >
                <svg
                    class="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
          <div>
            <button v-if="!loading"
                    class="text-white bg-indigo-700 hover:bg-indigo-800 focus:ring-4 focus:ring-indigo-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-indigo-600 dark:hover:bg-indigo-700 focus:outline-none dark:focus:ring-indigo-800">
              {{ $t('save') }}
            </button>
            <button v-else type="button"
                    class="text-white flex justify-center bg-indigo-700 hover:bg-indigo-800 focus:ring-4 focus:ring-indigo-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-indigo-600 dark:hover:bg-indigo-700 focus:outline-none dark:focus:ring-indigo-800">
              <svg aria-hidden="true" class="w-6 h-6 text-gray-200 animate-spin dark:text-gray-600 fill-indigo-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
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
        name: null,
        characteristics: [],
        measure_type: 'piece',
        is_own: false,
        industrial: false,
        type_id: null
      },
      measure_units: [
        {
          name: this.$t('piece'),
          key: 'piece'
        },
        {
          name: this.$t('capacity'),
          key: 'capacity'
        },
        {
          name: this.$t('weight'),
          key: 'weight'
        },
        {
          name: this.$t('width'),
          key: 'length'
        },
      ],
      types: [],
      loading: false
    }
  },
  props: ['product'],
  emits: ['updateList'],
  methods: {
    async typeList(search) {
      this.loading = true;
      await api.get("products/types", {
        params: {
          limit: 50,
          search: search
        }
      }).then((response) => {
        this.loading = false;
        this.types = response.data.data
      }).catch((response) => {
        this.loading = false;
      })
    },
    newCharacteristic() {
      let lastCharacteristic = this.form.characteristics[this.form.characteristics.length - 1];
      if(lastCharacteristic) {
        if(!lastCharacteristic.type?.length || !lastCharacteristic.value?.length) {
          toast.error(this.$t('fill_last_characteristic'));
          return;
        }
      }
      this.form.characteristics.push({
        type: null,
        value: null
      })
    },
    removeCharacteristic(index) {
      this.form.characteristics.splice(index, 1);
    },
    store(e) {
      e.preventDefault();
      if(!this.form.type_id) {
        toast.error(this.$t('type_required'));
        return;
      }
      if(!this.form.name?.length) {
        toast.error(this.$t('name_required'));
        return;
      }
      if(!this.form.measure_type?.length) {
        toast.error(this.$t('measure_required'));
        return;
      }
      let error = false;
      let characteristics = this.form.characteristics?.filter((characteristic) => {
        if(!characteristic.type?.length && characteristic.value?.length) {
          return;
        }
        return characteristic
      }).map((characteristic) => {
        if(!characteristic.type?.length || !characteristic.value?.length) {
          toast.error(this.$t('fill_characteristic_value_and_type'));
          error = true;
        }
        return characteristic;
      })
      if(!error) {
        this.loading = true;
        let url = 'products';
        if(this.product) {
          url += '/' + this.product.id;
        }
        api.post(url, {
          name: this.form.name,
          type_id: this.form.type_id,
          measure_type: this.form.measure_type,
          is_own: this.form.is_own ? 1 : 0,
          characteristics: characteristics
        }).then((response) => {
          this.loading = false;
          toast.success(this.$t('product_successfully_created'));
          this.modalObj.hide();
          this.$emit('updateList')
        }).catch((response) => {
          this.loading = false;
        })
      }
    }
  },
  mounted() {
    this.modalObj = new Modal(document.getElementById('add-edit-product-modal'), {
      placement: 'top-right',
      closable: true, backdropClasses: 'bg-gray-900/50 dark:bg-gray-900/80 fixed inset-0 z-40 modal-backdrop',
      onHide: () => {
        this.$parent.showAddEditProduct = false;
      },
    })
    this.modalObj.show();
    this.typeList();
    if(this.product) {
      this.form = this.product;
      if(!this.form.characteristics) {
        this.form.characteristics = [];
      }
    }
  }
}
</script>