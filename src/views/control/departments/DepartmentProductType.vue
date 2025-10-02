<template>
  <div class="flex flex-col gap-y-2">
    <div class="flex flex-col">
      <div class="dark:border-gray-700 bg-white">
        <div class="flex flex-col p-4 border-b rounded-md border-gray-200">
          <div class="flex gap-x-2 items-center">
            <p>{{ $t('company_department') }}: {{ department?.name }}</p>
          </div>
          <p class=" text-xl">{{ $t('product_types') }}</p>
        </div>
      </div>
      <nav class="flex bg-blue-50 py-2 px-4 items-center text-sm" aria-label="Breadcrumb">
        <ol class="inline-flex items-center">
          <li>
            <router-link :to="'/departments/control'"
                         class="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-slate-100">
              <span class="underline-offset-2 hover:underline">{{ $t('departments_control') }}</span>
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
    </div>
    <div class="flex flex-col gap-y-4 p-4">
      <div>
        <div class="flex flex-col gap-y-2">
          <label>{{ $t('select_group') }}</label>
          <VueSelect
              v-model="form.group_id"
              @update:modelValue="selectGroup"
              @search="groupList"
              :filterable="false"
              :loading="loading"
              :is-searchable="true"
              :get-option-label="o => o.name"
              :get-option-value="o => o.id"
              :is-multi="false"
              :options="groups"
              :placeholder="$t('select_group')"
              :noResults="'Արդյունք չի գտնվել'"
          >
            <template #no-options>
              Արդյունք չի գտնվել
            </template>
            <!-- Յուրաքանչյուր տարբերակի (option) ցուցադրում -->
            <template #option="{ option }">
              <div class="flex items-center gap-2">
                    <span class="font-medium">{{
                        option.name
                      }} {{ option.industrial ? '(' + $t('industrial') + ')' : null }}</span>
              </div>
            </template>

          </VueSelect>
        </div>
      </div>

      <div
          class="text-sm font-medium text-center text-gray-500 border-b border-gray-200 dark:text-gray-400 dark:border-gray-700">
        <ul class="flex flex-wrap -mb-px">
          <li v-for="(tab, index) in selected_groups" @click="changeTab(index)" class="me-2 relative">
            <a href="#" class="inline-block p-4 border-b-2 rounded-t-lg" :class="{
            'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300': !tab.active,
            'text-blue-600 border-blue-600 active dark:text-blue-500 dark:border-blue-500': tab.active
          }">{{ tab.name }}</a>
            <button v-if="!tab.loading" @click="removeGroup(tab, index)"
                    type="button"
                    class="absolute top-0 right-0 items-center justify-center w-6 h-6 text-xs font-bold rounded-full border text-red-500 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-300"
            >
              ×
            </button>
            <button v-else
                    type="button"
                    class="absolute top-0 right-0 items-center justify-center w-6 h-6 text-xs font-bold rounded-full border text-red-500 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-300"
            >
              <svg aria-hidden="true" class="w-6 h-6 text-gray-200 animate-spin dark:text-gray-600 fill-indigo-600"
                   viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                    fill="currentColor"/>
                <path
                    d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                    fill="currentFill"/>
              </svg>
            </button>
          </li>
        </ul>
      </div>
      <div v-if="active_select_group" class="flex flex-col gap-y-2">
        <div>
          <label for="search" class="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white">Search</label>
          <div class="relative">
            <div class="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
              <svg class="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true"
                   xmlns="http://www.w3.org/2000/svg"
                   fill="none" viewBox="0 0 20 20">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
              </svg>
            </div>
            <input type="search" v-model="type_filter.search"
                   class="block w-full p-4 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                   :placeholder="$t('search')"/>
          </div>
        </div>
        <div class="max-h-[640px] overflow-y-auto" @scroll="onScrollCallback($event, 'types','typeList')">
          <div class="flex items-center px-6">
            <input v-if="activate_all" @change="activateAll($event.target.checked, true)" checked
                   :id="'activate_all'" type="checkbox" value=""
                   class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600">
            <input v-else :id="'activate_all'" @change="activateAll($event.target.checked, true)"
                   v-model="activate_all" type="checkbox" value=""
                   class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600">
            <label :for="'activate_all'"
                   class="m-2 text-sm font-medium text-gray-900 dark:text-gray-300">{{ $t('select_all') }}</label>
          </div>
          <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
            <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" class="px-6 py-3">
              </th>
              <th scope="col" class="px-6 py-3">
                {{ $t('name') }}
              </th>
              <th scope="col" class="px-6 py-3">
                {{ $t('industrial') }}
              </th>

            </tr>
            </thead>
            <tbody>
            <tr v-for="type in types.data"
                class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200">
              <td class="px-6 py-4">
                <div class="flex items-center">
                  <input v-if="(type.checked || with_ids.includes(type.id)) && !without_ids.includes(type.id)"
                         @change="rowChecked(type, $event.target.checked)" checked
                         :id="'type-'+type.id" type="checkbox" value=""
                         class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600">
                  <input v-else :id="'type-'+type.id" @change="rowChecked(type, $event.target.checked)"
                         type="checkbox" value=""
                         class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600">
                  <label :for="'type-'+type.id" class="m-2 text-sm font-medium text-gray-900 dark:text-gray-300">{{
                      $t('selected')
                    }}</label>
                </div>
              </td>
              <td class="px-6 py-4">
                {{ type.name }}
              </td>
              <td class="px-6 py-4">
                {{ type.industrial ? $t('yes') : $t('no') }}
              </td>

            </tr>
            </tbody>
          </table>
        </div>
        <div>
          <button v-if="!loading" @click="store"
                  class="text-white bg-indigo-700 hover:bg-indigo-800 focus:ring-4 focus:ring-indigo-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-indigo-600 dark:hover:bg-indigo-700 focus:outline-none dark:focus:ring-indigo-800">
            {{ $t('save') }}
          </button>
          <button v-else type="button"
                  class="text-white flex justify-center bg-indigo-700 hover:bg-indigo-800 focus:ring-4 focus:ring-indigo-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-indigo-600 dark:hover:bg-indigo-700 focus:outline-none dark:focus:ring-indigo-800">
            <svg aria-hidden="true" class="w-6 h-6 text-gray-200 animate-spin dark:text-gray-600 fill-indigo-600"
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
    </div>
    
  </div>
</template>
<script>
import api from "@/utils/api.js";
import VueSelect from "vue3-select-component";
import {useToast} from "vue-toastification";
import {reactive} from "vue";

const toast = useToast();

export default {
  components: {VueSelect},
  data() {
    return {
      department: {
        name: null
      },
      groups: [],
      loading: false,
      form: {
        group_id: null,
      },
      selected_groups: [],
      department_product_group: null,
      active_select_group: null,
      type_filter: {
        search: null
      },
      types: {
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
      activate_all: true,
      without_ids: reactive([]),
      with_ids: reactive([])
    }
  },
  watch: {
    'type_filter.search'() {
      this.resetPaginationSettings('types')
      this.typeList();
    },
  },
  methods: {
    activateAll(activate_all, manual = true) {
      if (manual) {
        if (activate_all) {
          this.without_ids = [];
        } else {
          this.with_ids = [];
        }
        this.types.data = this.types.data.map((type) => {
          type.checked = activate_all;
          return type;
        })
      } else {
        if (activate_all) {
          this.without_ids = this.department_product_group.types.map((type) => {
            return type.id;
          })
        } else {
          this.with_ids = this.department_product_group.types.map((type) => {
            return type.id;
          })
        }
      }
      this.activate_all = activate_all;
    },
    changeTab(index) {
      this.selected_groups.map((tab, localIndex) => {
        tab.active = index === localIndex;
        if (tab.active) {
          this.active_select_group = tab.slug
          this.getProductStorage(tab)
          this.resetPaginationSettings('types');
          this.typeList();
        }
      })
    },
    async removeGroup(group, groupIndex) {
      if (confirm(this.$t('are_you_sure'))) {
        group.loading = true;
        let url = "departments/" + this.$route.params.id + "/product-groups/" + group.id;
        await api.delete(url).then((response) => {
          this.selected_groups.splice(groupIndex, 1)
          toast.success(this.$t('group_successfully_deleted'));
          group.loading = false;
          this.changeTab(0);
        }).catch((response) => {
          group.loading = false;
        })
      }
    },
    selectGroup(newVal) {
      const selectedId = typeof newVal === 'object' ? newVal?.id : newVal;
      if (!selectedId) return;

      // find in current options (handle "3" vs 3)
      const idx = this.groups.findIndex(g => String(g.id) === String(selectedId));
      if (idx === -1) {
        this.form.group_id = null;
        return;
      }

      const picked = this.groups[idx];

      // add to selected (avoid duplicates)
      if (!this.selected_groups.some(g => String(g.id) === String(picked.id))) {
        this.selected_groups.push(picked);
      }

      // remove from options (force new array reference)
      const next = this.groups.slice();
      next.splice(idx, 1);
      this.groups = next;

      if (this.selected_groups.length === 1) this.changeTab(0);
      this.form.group_id = null;
    },
    async getDepartmentById() {
      await api.get("departments/" + this.$route.params.id).then((response) => {
        this.department = response.data.data
      }).catch((response) => {
      })
    },
    async existDepartmentGroupList() {
      let url = "departments/" + this.$route.params.id + "/product-groups";
      await api.get(url).then((response) => {
        this.selected_groups = response.data.data ?? []
        if (this.selected_groups.length) {
          this.changeTab(0);
        }
      }).catch((response) => {
      })
    },
    async getProductStorage(group) {
      let url = "departments/" + this.$route.params.id + "/product-groups/" + group.id;
      await api.get(url).then((response) => {
        this.department_product_group = response.data.data
        if (this.department_product_group) {
          this.activate_all = !!this.department_product_group.checked;
          this.activateAll(this.activate_all, false);
        }
      }).catch((response) => {
      })
    },
    rowChecked(type, checked) {
      if (this.activate_all) {
        if (!checked) {
          this.without_ids.push(type.id);
        }
      } else {
        if (checked) {
          this.with_ids.push(type.id)
        }
      }
    },
    async store() {
      let group_id = null
      this.selected_groups.map((group) => {
        if (group.slug === this.active_select_group) {
          group_id = group.id;
        }
      })
      this.loading = true;
      let url = "departments/" + this.$route.params.id + "/product-groups";
      await api.post(url, {
        group_id: group_id,
        checked: this.activate_all,
        ids: this.activate_all ? this.without_ids : this.with_ids,
      }).then((response) => {
        toast.success(this.$t('information_saved'));
        this.loading = false;
      }).catch((response) => {
        this.loading = false;
      })
    },
    async groupList(search) {
      try {
        let url = "products/groups";
        const {data} = await api.get(url, {
          params: {limit: 40, offset: 0, search},
        });

        const selectedIds = new Set(this.selected_groups.map(g => String(g.id)));

        // exclude already-selected groups so the removed item doesn’t reappear
        this.groups = (data.data ?? []).filter(g => !selectedIds.has(String(g.id)));
      } catch (e) {
        // silent fail as before
      }
    },
    async typeList() {
      let group_id = null
      this.selected_groups.map((group) => {
        if (group.slug === this.active_select_group) {
          group_id = group.id;
        }
      })
      let url = "products/types";
      await api.get(url, {
        params: {
          limit: this.types.settings.limit,
          offset: this.types.settings.offset,
          search: this.type_filter.search,
          group_id: group_id,
          department_id: this.department.id
        }
      }).then((response) => {
        let data = response.data.data;
        data = data.map((type) => {
          type.checked = this.activate_all;
          return type;
        })
        if (this.types.settings.offset > 0) {
          this.types.prependedData = data
          this.types.data = this.types.data.concat(data);
        } else {
          this.types.data = data
        }
      }).catch((response) => {
        console.log(response);
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
    this.getDepartmentById();
    this.groupList();
    this.existDepartmentGroupList();
  }
}
</script>
