<template>
  <div class="flex flex-col gap-y-4">
    <div class="dark:border-gray-700">
      <div class="flex flex-col gap-y-4 p-4 border rounded-md border-gray-200 bg-slate-100 text-xl">
        <p>{{ $t('storage_control') }}</p>
      </div>
    </div>
    <div
        class="text-sm font-medium text-center text-gray-500 border-b border-gray-200 dark:text-gray-400 dark:border-gray-700">
      <ul class="flex flex-wrap -mb-px">
        <li v-for="(tab, index) in tabs" @click="changeTab(tabs, index)" class="me-2">
          <a href="#" class="inline-block p-4 border-b-2 rounded-t-lg" :class="{
            'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300': !tab.active,
            'text-blue-600 border-blue-600 active dark:text-blue-500 dark:border-blue-500': tab.active
          }">{{ tab.name }}</a>
        </li>
      </ul>
    </div>
    <div v-if="activeTab === 'storages'" class="flex flex-col gap-y-4 px-4">
      <div class="flex">
        <button type="button" @click="createStorage"
                class="bg-white group text-sm flex gap-x-2 items-center text-violet-500 hover:text-white border border-violet-500 hover:bg-violet-700 focus:ring-4 focus:outline-none focus:ring-violet-300 font-medium rounded-lg px-5 py-2.5 text-center dark:border-violet-300 dark:text-violet-300 dark:hover:text-white dark:hover:bg-violet-400 dark:focus:ring-violet-900">
          {{ $t('new_storage') }}
          <svg width="21" height="21" class="fill-violet-500 group-hover:fill-white" viewBox="0 0 21 21"
               xmlns="http://www.w3.org/2000/svg">
            <path class="text-violet-500"
                  d="M19.037 11.7413H11.2599V19.5185C11.2599 19.8132 11.1428 20.0959 10.9343 20.3044C10.7259 20.5128 10.4432 20.6299 10.1484 20.6299C9.85367 20.6299 9.57097 20.5128 9.36254 20.3044C9.15411 20.0959 9.03701 19.8132 9.03701 19.5185V11.7413H1.25987C0.965097 11.7413 0.682401 11.6242 0.473967 11.4158C0.265534 11.2073 0.148438 10.9247 0.148438 10.6299C0.148438 10.3351 0.265534 10.0524 0.473967 9.84398C0.682401 9.63555 0.965097 9.51845 1.25987 9.51845H9.03701V1.74131C9.03701 1.59536 9.06576 1.45083 9.12161 1.31599C9.17747 1.18114 9.25933 1.05862 9.36254 0.955413C9.46574 0.852207 9.58827 0.77034 9.72311 0.714485C9.85796 0.658631 10.0025 0.629883 10.1484 0.629883C10.2944 0.629883 10.4389 0.658631 10.5738 0.714485C10.7086 0.77034 10.8311 0.852207 10.9343 0.955413C11.0375 1.05862 11.1194 1.18114 11.1753 1.31599C11.2311 1.45083 11.2599 1.59536 11.2599 1.74131V9.51845H19.037C19.183 9.51845 19.3275 9.5472 19.4623 9.60306C19.5972 9.65891 19.7197 9.74078 19.8229 9.84398C19.9261 9.94719 20.008 10.0697 20.0638 10.2046C20.1197 10.3394 20.1484 10.4839 20.1484 10.6299C20.1484 10.7758 20.1197 10.9204 20.0638 11.0552C20.008 11.1901 19.9261 11.3126 19.8229 11.4158C19.7197 11.519 19.5972 11.6009 19.4623 11.6567C19.3275 11.7126 19.183 11.7413 19.037 11.7413Z"/>
          </svg>
        </button>
      </div>
    </div>
    <div class="h-[640px] overflow-y-auto">
      <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
        <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
        <tr>
          <th scope="col" class="px-6 py-3">

          </th>
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
              <label class="inline-flex items-center cursor-pointer">
                <input v-if="storage.active" @change="switcher(storage, false)" checked type="checkbox" class="sr-only peer" >
                <input v-else @change="switcher(storage, true)" type="checkbox" class="sr-only peer" >
                <div class="relative w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 dark:peer-checked:bg-blue-600"></div>
                <span class="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">{{ $t('activate') }}</span>
              </label>
            </td>
            <td class="px-6 py-4">
              {{ storage.address }}
            </td>
            <td class="px-6 py-4">
              {{ storage.cell ? $t('cell') : (storage.industrial ? $t('industrial') : $t('normal')) }}
            </td>
            <td class="px-6 py-4">
              <VueSelect
                  v-model="storage.storekeeper_id"
                  :get-option-label="o => o.name"
                  :get-option-value="o => o.id"
                  :options="users"
                  :placeholder="$t('attach_storekeeper')"
                  :noResults="'Արդյունք չի գտնվել'"
                  @update:modelValue="changeStorekeeper(storage)"
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
            </td>
            <td class="px-6 py-4">
              <div class="flex flex-wrap gap-2">
                <button @click="edit(storage)"
                        type="button"
                        class="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-md shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {{ $t('edit') }}
                </button>
                <router-link :to="'/storages/'+storage.id+'/control/departments'"
                             type="button" v-if="!storage.cell"
                             class="px-3 py-1 text-xs font-medium text-white bg-amber-600 rounded-md shadow hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500">
                  {{ $t('departments') }}
                </router-link>
                <router-link :to="'/storages/'+storage.id+'/control/product-types'"
                             type="button" v-if="!storage.cell"
                             class="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded-md shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500">
                  {{ $t('product_types') }}
                </router-link>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  <AddEditStorageModal v-if="showAddEditStorage" v-bind:storage="selectedStorage" @updateList="updateList"/>
</template>
<script>
import AddEditStorageModal from '@/views/control/storages/modal/AddEditStorageModal.vue'
import api from "@/utils/api.js";
import VueSelect from "vue3-select-component";
import {useToast} from "vue-toastification";
const toast = useToast();

export default {
  components: {
    VueSelect,
    AddEditStorageModal,
  },
  data() {
    return {
      showAddEditStorageDepth: false,
      tabs: [
        {
          name: this.$t('storages'),
          key: 'storages',
          active: 1
        },
        {
          name: this.$t('staff'),
          key: 'staff',
          active: 0
        }
      ],
      activeTab: 'storages',
      showAddEditStorage: false,
      selectedStorage: null,
      storages: [],
      users: []
    }
  },
  methods: {
    openNewDepartment(storage) {
      this.selectedStorage = storage;
      this.showAddEditStorageDepth = true;
    },
    changeStorekeeper(storage) {
      if(!storage.storekeeper_id) {
        toast.error(this.$t('cannot_remove_storekeeper_can_change'));
      } else {
        this.attachStorekeeper(storage);
      }
    },
    createStorage() {
      this.selectedStorage = null;
      this.showAddEditStorage = true;
    },
    edit(storage) {
      this.selectedStorage = storage;
      this.showAddEditStorage = true;
    },
    changeTab(tabs, index) {
      tabs.map((tab, localIndex) => {
        tab.active = index === localIndex;
        if (tab.active) {
          this.activeTab = tab.key
        }
      })
    },
    switcher(storage, switcher) {
      storage.active = switcher;
      api.patch("storages/"+storage.id+"/switcher", {
        active: storage.active ? 1 : 0
      }).then((response) => {
        if(storage.active) {
          toast.success(this.$t('storage_activated'));
        } else {
          toast.success(this.$t('storage_disabled'));
        }
        storage.status = response.data.data;
      }).catch((response) => {
        storage.active = !storage.active;
      })
    },
    attachStorekeeper(storage) {
      api.patch("storages/attach/"+storage.id+"/" + storage.storekeeper_id).then((response) => {
        toast.success(this.$t('storekeeper_successfully_attached'));
      }).catch((response) => {
      })
    },
    updateList() {
      this.list();
    },
    async list() {
      await api.get("storages").then((response) => {
        this.storages = response.data.data
      }).catch((response) => {
      })
    },
    async userList() {
      await api.get("users").then((response) => {
        this.users = response.data.data.data
      }).catch((response) => {
      })
    },
  },
  mounted() {
    this.list();
    this.userList();
  }
}
</script>
