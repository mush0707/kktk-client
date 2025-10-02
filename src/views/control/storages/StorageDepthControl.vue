<template>
  <div class="flex flex-col gap-y-2">
    <div class="flex flex-col">
      <div class="dark:border-gray-700 bg-white">
        <div class="flex gap-x-2 items-center p-4 border-b rounded-md border-gray-200 text-xl">
          <p>{{ storage?.address }}</p>
          <p class="text-sm">({{
              !storage?.cell ? (storage?.industrial ? $t('industrial') : $t('normal')) : $t('cell')
            }})</p>
        </div>
      </div>
      <nav class="flex bg-blue-50 py-2 items-center text-sm" aria-label="Breadcrumb">
        <ol class="inline-flex items-center">

          <li>
            <router-link :to="'/storages/control'"
                         class="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-slate-100">
              <span class="underline-offset-2 hover:underline">{{ $t('storages') }}</span>
            </router-link>
          </li>
          <li aria-hidden="true" class="px-1">
            <svg class="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                  d="M7.05 3.55a1 1 0 0 1 1.4 0l4.5 4.5a1 1 0 0 1 0 1.4l-4.5 4.5a1 1 0 0 1-1.4-1.4L10.79 10 7.05 6.26a1 1 0 0 1 0-1.41z"/>
            </svg>
          </li>
          <li>
            <p class="inline-flex items-center gap-1 rounded-md px-2 py-1">
              <span class="underline-offset-2 hover:underline">{{ storage?.address }}</span>
            </p>
          </li>
        </ol>
      </nav>
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
    <div v-if="activeTab === 'departments'">
      <div class="h-[640px] overflow-y-auto">
        <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
          <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th scope="col" class="px-6 py-3">
              {{ $t('leader') }}
            </th>
            <th scope="col" class="px-6 py-3">
              {{ $t('name') }}
            </th>
            <th scope="col" class="px-6 py-3">
              {{ $t('sections_count') }}
            </th>
            <th scope="col" class="px-6 py-3">
              {{ $t('shelves_count') }}
            </th>
            <th scope="col" class="px-6 py-3">
              {{ $t('cells_count') }}
            </th>
            <th scope="col" class="px-6 py-3">
            </th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="department in departments"
              class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200">
            <td class="px-6 py-4">
              <VueSelect
                  v-model="department.leader_id"
                  :get-option-label="o => o.name"
                  :get-option-value="o => o.id"
                  :options="users"
                  :placeholder="$t('attach_leader')"
                  :noResults="'Արդյունք չի գտնվել'"
                  @update:modelValue="changeLeader(department)"
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
              {{ department.name }}
            </td>
            <td class="px-6 py-4">
              {{ department.sections_count }}
            </td>
            <td class="px-6 py-4">
              {{ department.shelves_count }}
            </td>
            <td class="px-6 py-4">
              {{ getRowCellsCount(department.sections) }}
            </td>
            <td class="px-6 py-4">
              <div class="flex gap-x-2">
                <router-link :to="'/storages/'+storage.id+'/control/departments/'+department.id"
                        type="button"
                        class="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-md shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {{ $t('edit') }}
                </router-link>
                <router-link :to="'/storages/'+storage.id+'/control/product-types/'+department.id"
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
    <div v-if="activeTab === 'new_department'">
      <DepartmentAddEditComponent v-bind:storage="storage" @afterStore="afterStore" v-bind:department="null"/>
    </div>
  </div>
</template>

<script>
import api from "@/utils/api.js";
import {useToast} from "vue-toastification";
import VueSelect from "vue3-select-component";
import DepartmentAddEditComponent from "@/views/control/storages/components/DepartmentAddEditComponent.vue";

const toast = useToast();

export default {
  components: {DepartmentAddEditComponent, VueSelect},
  data() {
    return {
      tabs: [
        {
          name: this.$t('departments'),
          key: 'departments',
          active: 1
        },
        {
          name: this.$t('new_department'),
          key: 'new_department',
          active: 0
        }
      ],
      activeTab: 'departments',
      storage: {
        address: null
      },


      loading: false,
      departments: [],
      users: []
    }
  },
  methods: {
    changeTab(tabs, index) {
      tabs.map((tab, localIndex) => {
        tab.active = index === localIndex;
        if (tab.active) {
          this.activeTab = tab.key
        }
      })
    },
    async userList() {
      await api.get("users").then((response) => {
        this.users = response.data.data.data
      }).catch((response) => {
      })
    },
    afterStore() {
      this.changeTab(this.tabs, 0);
      this.departmentList();
    },
    getRowCellsCount(sections) {
      let cells_count = 0;
      sections.map((section) => {
        cells_count += section.cells_count;
      })
      return cells_count;
    },
    async getStorageById() {
      await api.get("storages/" + this.$route.params.id).then((response) => {
        this.storage = response.data.data
      }).catch((response) => {
      })
    },

    async departmentList() {
      await api.get("storages/"+this.$route.params.id+"/departments").then((response) => {
        this.departments = response.data.data
      }).catch((response) => {
      })
    },
    attachLeader(department) {
      api.patch("storages/"+this.storage.id+"/departments/" + department.id + "/attach-leader/" +  + department.leader_id).then((response) => {
        toast.success(this.$t('leader_successfully_attached'));
      }).catch((response) => {
      })
    },
    changeLeader(department) {
        this.attachLeader(department);
    },
  },
  mounted() {
    this.getStorageById();
    this.departmentList();
    this.userList();
  }
}
</script>