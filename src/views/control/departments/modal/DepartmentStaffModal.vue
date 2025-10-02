<template>
  <div id="department-staff-modal" tabindex="-1" aria-hidden="true"
       class="bg-slate-800/25 fixed top-0 left-0 right-0 z-50 hidden w-full overflow-x-hidden overflow-y-auto md:inset-0 max-h-full">
    <div class="relative h-screen overflow-y-auto bg-white w-full max-w-4xl ">
      <div class="flex items-center justify-between p-4 rounded-t dark:border-gray-600">
        <div class="flex flex-col gap-y-2">
          <p class="text-lg">{{ $t('company_department') }}: {{ this.department.name }}</p>
          <p class="text-xl">{{ $t('manage_staff') }}</p>
        </div>
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
        <div class="flex flex-col gap-y-2">
          <label>{{ $t('attach_member') }}</label>
          <VueSelect
              v-model="staff_id"
              :get-option-label="o => o.name"
              :get-option-value="o => o.id"
              :options="users"
              :placeholder="$t('attach_member')"
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
          <div class="flex">
            <button v-if="!loading" type="button" @click="attachStaff"
                    class="bg-white group text-sm flex gap-x-2 items-center text-violet-500 hover:text-white border border-violet-500 hover:bg-violet-700 focus:ring-4 focus:outline-none focus:ring-violet-300 font-medium rounded-lg px-5 py-2.5 text-center dark:border-violet-300 dark:text-violet-300 dark:hover:text-white dark:hover:bg-violet-400 dark:focus:ring-violet-900">
              {{ $t('attach') }}
              <svg width="21" height="21" class="fill-violet-500 group-hover:fill-white" viewBox="0 0 21 21"
                   xmlns="http://www.w3.org/2000/svg">
                <path class="text-violet-500"
                      d="M19.037 11.7413H11.2599V19.5185C11.2599 19.8132 11.1428 20.0959 10.9343 20.3044C10.7259 20.5128 10.4432 20.6299 10.1484 20.6299C9.85367 20.6299 9.57097 20.5128 9.36254 20.3044C9.15411 20.0959 9.03701 19.8132 9.03701 19.5185V11.7413H1.25987C0.965097 11.7413 0.682401 11.6242 0.473967 11.4158C0.265534 11.2073 0.148438 10.9247 0.148438 10.6299C0.148438 10.3351 0.265534 10.0524 0.473967 9.84398C0.682401 9.63555 0.965097 9.51845 1.25987 9.51845H9.03701V1.74131C9.03701 1.59536 9.06576 1.45083 9.12161 1.31599C9.17747 1.18114 9.25933 1.05862 9.36254 0.955413C9.46574 0.852207 9.58827 0.77034 9.72311 0.714485C9.85796 0.658631 10.0025 0.629883 10.1484 0.629883C10.2944 0.629883 10.4389 0.658631 10.5738 0.714485C10.7086 0.77034 10.8311 0.852207 10.9343 0.955413C11.0375 1.05862 11.1194 1.18114 11.1753 1.31599C11.2311 1.45083 11.2599 1.59536 11.2599 1.74131V9.51845H19.037C19.183 9.51845 19.3275 9.5472 19.4623 9.60306C19.5972 9.65891 19.7197 9.74078 19.8229 9.84398C19.9261 9.94719 20.008 10.0697 20.0638 10.2046C20.1197 10.3394 20.1484 10.4839 20.1484 10.6299C20.1484 10.7758 20.1197 10.9204 20.0638 11.0552C20.008 11.1901 19.9261 11.3126 19.8229 11.4158C19.7197 11.519 19.5972 11.6009 19.4623 11.6567C19.3275 11.7126 19.183 11.7413 19.037 11.7413Z"/>
              </svg>
            </button>
            <button v-else type="button"
                    class="text-white flex justify-center bg-indigo-700 hover:bg-indigo-800 focus:ring-4 focus:ring-indigo-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-indigo-600 dark:hover:bg-indigo-700 focus:outline-none dark:focus:ring-indigo-800">
              <svg aria-hidden="true" class="w-6 h-6 text-gray-200 animate-spin dark:text-gray-600 fill-indigo-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
              </svg>
            </button>
          </div>
        </div>
        <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
          <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th scope="col" class="px-6 py-3">
              {{ $t('name') }}
            </th>
            <th scope="col" class="px-6 py-3">
            </th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="row in staff"
              class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200">
            <td class="px-6 py-4">
              {{ row.name }}
            </td>
            <td class="px-6 py-4">
              <button @click="detachStaff(row)"
                      type="button"
                      class="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded-md shadow hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500">
                {{ $t('delete') }}
              </button>
            </td>
          </tr>
          </tbody>
        </table>
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
      users: [],
      staff: [],
      modalObj: null,
      staff_id: null,
      loading: false
    }
  },
  props: ['department'],
  methods: {
    async attachStaff() {
      if(!this.staff_id) {
        toast.error(this.$t('pick_staff'));
        return;
      }
      this.loading = true;
      await api.post("departments/"+this.department.id+"/staff/"+this.staff_id).then((response) => {
        toast.success(this.$t('staff_attached_successfully'));
        this.loading = false;
        this.list();
      }).catch((response) => {
        this.loading = false;
      })
    },
    async detachStaff(row) {
      if(confirm(this.$t('are_you_sure'))) {
        row.loading = true;
        await api.delete("departments/"+this.department.id+"/staff/"+row.user_id).then((response) => {
          toast.success(this.$t('staff_detached_successfully'));
          this.list();
          row.loading = false;
        }).catch((response) => {
          row.loading = false;
        })
      }
    },
    async userList() {
      await api.get("users").then((response) => {
        this.users = response.data.data.data
      }).catch((response) => {
      })
    },
    async list() {
      await api.get("departments/"+this.department.id+"/staff-list").then((response) => {
        this.staff = response.data.data
      }).catch((response) => {
      })
    },
  },
  mounted() {
    this.modalObj = new Modal(document.getElementById('department-staff-modal'), {
      placement: 'top-right',
      closable: true, backdropClasses: 'bg-gray-900/50 dark:bg-gray-900/80 fixed inset-0 z-40 modal-backdrop',
      onHide: () => {
        this.$parent.showDepartmentStaff = false;
      },
    })
    this.modalObj.show();
    this.userList();
    this.list();
  }
}
</script>