<template>
  <div class="flex flex-col gap-y-4">
    <div class="dark:border-gray-700">
      <div class="flex flex-col gap-y-4 p-4 border rounded-md border-gray-200 bg-slate-100 text-xl">
        <p>{{ $t('departments_control') }}</p>
      </div>
    </div>
    <div class="flex px-4">
      <button type="button" @click="createDepartment"
              class="bg-white group text-sm flex gap-x-2 items-center text-violet-500 hover:text-white border border-violet-500 hover:bg-violet-700 focus:ring-4 focus:outline-none focus:ring-violet-300 font-medium rounded-lg px-5 py-2.5 text-center dark:border-violet-300 dark:text-violet-300 dark:hover:text-white dark:hover:bg-violet-400 dark:focus:ring-violet-900">
        {{ $t('new_company_department') }}
        <svg width="21" height="21" class="fill-violet-500 group-hover:fill-white" viewBox="0 0 21 21"
             xmlns="http://www.w3.org/2000/svg">
          <path class="text-violet-500"
                d="M19.037 11.7413H11.2599V19.5185C11.2599 19.8132 11.1428 20.0959 10.9343 20.3044C10.7259 20.5128 10.4432 20.6299 10.1484 20.6299C9.85367 20.6299 9.57097 20.5128 9.36254 20.3044C9.15411 20.0959 9.03701 19.8132 9.03701 19.5185V11.7413H1.25987C0.965097 11.7413 0.682401 11.6242 0.473967 11.4158C0.265534 11.2073 0.148438 10.9247 0.148438 10.6299C0.148438 10.3351 0.265534 10.0524 0.473967 9.84398C0.682401 9.63555 0.965097 9.51845 1.25987 9.51845H9.03701V1.74131C9.03701 1.59536 9.06576 1.45083 9.12161 1.31599C9.17747 1.18114 9.25933 1.05862 9.36254 0.955413C9.46574 0.852207 9.58827 0.77034 9.72311 0.714485C9.85796 0.658631 10.0025 0.629883 10.1484 0.629883C10.2944 0.629883 10.4389 0.658631 10.5738 0.714485C10.7086 0.77034 10.8311 0.852207 10.9343 0.955413C11.0375 1.05862 11.1194 1.18114 11.1753 1.31599C11.2311 1.45083 11.2599 1.59536 11.2599 1.74131V9.51845H19.037C19.183 9.51845 19.3275 9.5472 19.4623 9.60306C19.5972 9.65891 19.7197 9.74078 19.8229 9.84398C19.9261 9.94719 20.008 10.0697 20.0638 10.2046C20.1197 10.3394 20.1484 10.4839 20.1484 10.6299C20.1484 10.7758 20.1197 10.9204 20.0638 11.0552C20.008 11.1901 19.9261 11.3126 19.8229 11.4158C19.7197 11.519 19.5972 11.6009 19.4623 11.6567C19.3275 11.7126 19.183 11.7413 19.037 11.7413Z"/>
        </svg>
      </button>
    </div>
    <div class="h-[640px] overflow-y-auto">
      <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
        <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
        <tr>
          <th scope="col" class="px-6 py-3">

          </th>
          <th scope="col" class="px-6 py-3">
            {{ $t('name') }}
          </th>
          <th scope="col" class="px-6 py-3">
            {{ $t('leader') }}
          </th>
          <th scope="col" class="px-6 py-3">
          </th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="department in departments"
            class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200">
          <td class="px-6 py-4">
            <label class="inline-flex items-center cursor-pointer">
              <input v-if="department.active" @change="switcher(department, false)" checked type="checkbox" class="sr-only peer" >
              <input v-else @change="switcher(department, true)" type="checkbox" class="sr-only peer" >
              <div class="relative w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 dark:peer-checked:bg-blue-600"></div>
              <span class="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">{{ $t('activate') }}</span>
            </label>
          </td>
          <td class="px-6 py-4">
            {{ department.name }}
          </td>
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
            <div class="flex flex-wrap gap-2">
              <button @click="edit(department)"
                      type="button"
                      class="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-md shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {{ $t('edit') }}
              </button>
              <button @click="attachStaff(department)"
                      type="button"
                      class="px-3 py-1 text-xs font-medium text-white bg-sky-600 rounded-md shadow hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500">
                {{ $t('manage_staff') }}
              </button>

              <router-link v-if="department.active" :to="'/departments/'+department.id+'/control/product-types'"
                           type="button"
                           class="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded-md shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500">
                {{ $t('product_types') }}
              </router-link>
              <button @click="managePositions(department)"
                      type="button"
                      class="px-3 py-1 text-xs font-medium text-white bg-amber-600 rounded-md shadow hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500">
                {{ $t('positions') || 'Հաստիքներ' }}
              </button>
            </div>
          </td>
        </tr>
        </tbody>
      </table>
    </div>
  </div>
  <AddEditDepartmentModal v-if="showAddEditDepartment" v-bind:department="selectedDepartment" @updateList="updateList" />
  <DepartmentStaffModal v-if="showDepartmentStaff" v-bind:department="selectedDepartment" />
  <DepartmentPositionsModal
      v-if="showDepartmentPositions"
      :department="selectedDepartment"
      @close="showDepartmentPositions = false"
  />
</template>

<script>
import AddEditDepartmentModal from "@/views/control/departments/modal/AddEditDepartmentModal.vue";
import api from "@/utils/api.js";
import VueSelect from "vue3-select-component";
import {useToast} from "vue-toastification";
import DepartmentStaffModal from "@/views/control/departments/modal/DepartmentStaffModal.vue";
import DepartmentPositionsModal from "@/views/control/departments/modal/DepartmentPositionsModal.vue";
const toast = useToast();

export default {
  components: {DepartmentPositionsModal, DepartmentStaffModal, VueSelect, AddEditDepartmentModal},
  data() {
    return {
      showAddEditDepartment: false,
      showDepartmentStaff: false,
      showDepartmentPositions: false,
      selectedDepartment: null,
      departments: [],
      users: []
    }
  },
  methods: {
    createDepartment() {
      this.selectedDepartment = null;
      this.showAddEditDepartment = true;
    },
    updateList() {
      this.list();
    },
    edit(department) {
      this.selectedDepartment = department;
      this.showAddEditDepartment = true;
    },
    attachStaff(department) {
      this.selectedDepartment = department;
      this.showDepartmentStaff = true;
    },
    async list() {
      await api.get("departments").then((response) => {
        this.departments = response.data.data
      }).catch((response) => {
      })
    },
    async userList() {
      await api.get("users").then((response) => {
        this.users = response.data.data.data
      }).catch((response) => {
      })
    },
    switcher(department, switcher) {
      department.active = switcher;
      api.patch("departments/"+department.id+"/switcher", {
        active: department.active ? 1 : 0
      }).then((response) => {
        if(department.active) {
          toast.success(this.$t('department_activated'));
        } else {
          toast.success(this.$t('department_disabled'));
        }
        department.status = response.data.data;
      }).catch((response) => {
        department.active = !department.active;
      })
    },
    changeLeader(department) {
      if(!department.leader_id) {
        toast.error(this.$t('cannot_remove_leader_can_change'));
      } else {
        this.attachLeader(department);
      }
    },
    attachLeader(department) {
      api.patch("departments/attach/"+department.id+"/" + department.leader_id).then((response) => {
        toast.success(this.$t('leader_successfully_attached'));
      }).catch((response) => {
      })
    },
    managePositions(department) {
      this.selectedDepartment = department;
      this.showDepartmentPositions = true;
    },
  },
  mounted() {
    this.list();
    this.userList();
  }
}
</script>