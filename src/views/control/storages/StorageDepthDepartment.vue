<template>
  <div class="flex flex-col gap-y-2">
    <div class="flex flex-col">
      <div class="dark:border-gray-700 bg-white">
        <div class="flex flex-col p-4 border-b rounded-md border-gray-200">
          <div class="text-md flex gap-x-2 items-center">
            <p>{{ storage?.address }}</p>
            <p class="text-sm">({{
                !storage?.cell ? (storage?.industrial ? $t('industrial') : $t('normal')) : $t('cell')
              }})</p>
          </div>
          <div class=" text-xl">
            <p>{{ $t('department') }}: {{ department.name }}</p>
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
              <router-link :to="'/storages/'+this.storage?.id+'/control/departments'"
                           class="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-slate-100">
                <span class="underline-offset-2 hover:underline">{{ this.storage?.address }}</span>
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
                <span class="underline-offset-2 hover:underline">{{ department?.name }}</span>
              </p>
            </li>
          </ol>
        </nav>
        <div v-if="department !== null">
          <DepartmentAddEditComponent v-bind:storage="storage" v-bind:department="department" @afterStore="afterStore"/>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from "@/utils/api.js";
import DepartmentAddEditComponent from "@/views/control/storages/components/DepartmentAddEditComponent.vue";
import {useToast} from "vue-toastification";
const toast = useToast();

export default {
  components: {DepartmentAddEditComponent},
  data() {
    return {
      storage: {},
      department: {},
    }
  },
  methods: {
    async getStorageById() {
      await api.get("storages/" + this.$route.params.id).then((response) => {
        this.storage = response.data.data
      }).catch((response) => {
      })
    },
    async getDepartmentById() {
      await api.get("storages/" + this.$route.params.id + "/departments/"+ this.$route.params.department_id).then((response) => {
        this.department = response.data.data
      }).catch((response) => {
      })
    },
    afterStore() {
      toast.success(this.$t('department_successfully_updated'));
    }
  },
  mounted() {
    this.getStorageById();
    this.getDepartmentById();
  }
}
</script>
