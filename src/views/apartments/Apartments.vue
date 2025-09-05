<template>
  <div class="flex flex-col gap-y-4">
    <div class="dark:border-gray-700">
      <div class="flex flex-col gap-y-4 p-4 shadow-lg border rounded-md border-gray-200 bg-slate-100 text-xl">
        <p>{{ $t('apartments') }}</p>
      </div>
    </div>
    <div class="flex">
      <button type="button" @click="createApartment"
              class="bg-white group text-sm flex gap-x-2 items-center text-violet-500 hover:text-white border border-violet-500 hover:bg-violet-700 focus:ring-4 focus:outline-none focus:ring-violet-300 font-medium rounded-lg px-5 py-2.5 text-center dark:border-violet-300 dark:text-violet-300 dark:hover:text-white dark:hover:bg-violet-400 dark:focus:ring-violet-900">
        {{ $t('new_apartment') }}
        <svg width="21" height="21" class="fill-violet-500 group-hover:fill-white" viewBox="0 0 21 21"
             xmlns="http://www.w3.org/2000/svg">
          <path class="text-violet-500"
                d="M19.037 11.7413H11.2599V19.5185C11.2599 19.8132 11.1428 20.0959 10.9343 20.3044C10.7259 20.5128 10.4432 20.6299 10.1484 20.6299C9.85367 20.6299 9.57097 20.5128 9.36254 20.3044C9.15411 20.0959 9.03701 19.8132 9.03701 19.5185V11.7413H1.25987C0.965097 11.7413 0.682401 11.6242 0.473967 11.4158C0.265534 11.2073 0.148438 10.9247 0.148438 10.6299C0.148438 10.3351 0.265534 10.0524 0.473967 9.84398C0.682401 9.63555 0.965097 9.51845 1.25987 9.51845H9.03701V1.74131C9.03701 1.59536 9.06576 1.45083 9.12161 1.31599C9.17747 1.18114 9.25933 1.05862 9.36254 0.955413C9.46574 0.852207 9.58827 0.77034 9.72311 0.714485C9.85796 0.658631 10.0025 0.629883 10.1484 0.629883C10.2944 0.629883 10.4389 0.658631 10.5738 0.714485C10.7086 0.77034 10.8311 0.852207 10.9343 0.955413C11.0375 1.05862 11.1194 1.18114 11.1753 1.31599C11.2311 1.45083 11.2599 1.59536 11.2599 1.74131V9.51845H19.037C19.183 9.51845 19.3275 9.5472 19.4623 9.60306C19.5972 9.65891 19.7197 9.74078 19.8229 9.84398C19.9261 9.94719 20.008 10.0697 20.0638 10.2046C20.1197 10.3394 20.1484 10.4839 20.1484 10.6299C20.1484 10.7758 20.1197 10.9204 20.0638 11.0552C20.008 11.1901 19.9261 11.3126 19.8229 11.4158C19.7197 11.519 19.5972 11.6009 19.4623 11.6567C19.3275 11.7126 19.183 11.7413 19.037 11.7413Z"/>
        </svg>
      </button>
    </div>
    <div>
      <div class="flex ">
        <div class="flex bg-indigo-50 p-4 flex-col gap-y-2">
          <p class="text-lg">{{ $t('filter') }}</p>
          <div class="flex flex-wrap gap-y-4 gap-x-4">
            <div class="flex flex-col gap-y-2">
              <label>{{ $t('select_building') }}</label>
              <vSelect
                  class="vselect"
                  v-model="filter.building"
                  label="name"
                  track-by="id"
                  :options="buildings"
              />
            </div>
            <div v-if="filter.building?.id" class="flex flex-col gap-y-2">
              <label>{{ $t('select_floor') }}</label>
              <vSelect
                  class="vselect"
                  v-model="filter.floor"
                  label="level"
                  track-by="id"
                  :options="floors"
              />
            </div>
            <div v-if="filter.building?.id" class="flex flex-col gap-y-2">
              <label>{{ $t('status') }}</label>
              <vSelect
                  class="vselect"
                  v-model="filter.status"
                  label="name"
                  track-by="key"
                  :options="[
                    {
                      name: $t('pending'),
                      key: 'pending'
                    },
                    {
                      name: $t('active'),
                      key: 'active'
                    },
                    {
                      name: $t('reserved'),
                      key: 'reserved'
                    },
                    {
                      name: $t('sold'),
                      key: 'sold'
                    }
                ]"
              />
            </div>
          </div>
          <div class="flex flex-wrap gap-x-4 gap-y-4">
            <div class="flex flex-col gap-y-2">
              <label># {{ $t('number') }}</label>
              <input type="number" v-model="filter.number"
                     class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-16 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                     required/>
            </div>
            <div class="flex flex-col gap-y-2">
              <label>{{ $t('rooms_count') }}</label>
              <input type="number" v-model="filter.rooms"
                     class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-16 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                     required/>
            </div>
            <div class="flex flex-col gap-y-2">
              <label>{{ $t('square_meter') }} >=</label>
              <input type="number" v-model="filter.square_meter" step="0.01"
                     class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-24 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                     required/>
            </div>
          </div>

        </div>
      </div>
      <div class="h-[640px] overflow-y-auto" @scroll="onScrollCallback($event, 'apartments','list')">
        <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
          <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th scope="col" class="px-6 py-3">
            </th>
            <th scope="col" class="px-6 py-3">
              {{ $t('status') }}
            </th>
            <th v-if="!this.filter.building?.id" scope="col" class="px-6 py-3">
              {{ $t('building') }}
            </th>
            <th scope="col" class="px-6 py-3">
              {{ $t('entry') }}
            </th>
            <th v-if="!this.filter.floor?.id" scope="col" class="px-6 py-3">
              {{ $t('floor') }}
            </th>
            <th scope="col" class="px-6 py-3">
              {{ $t('number') }}
            </th>
            <th scope="col" class="px-6 py-3">
              {{ $t('rooms') }}
            </th>
            <th scope="col" class="px-6 py-3">
              {{ $t('square_meter') }}
            </th>
            <th scope="col" class="px-6 py-3">
            </th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="apartment in apartments.data"
              class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200">
            <td class="px-6 py-4">
              <label class="inline-flex items-center cursor-pointer">
                <input v-if="apartment.active" @change="switcher(apartment, false)" checked type="checkbox" class="sr-only peer" >
                <input v-else @change="switcher(apartment, true)" type="checkbox" class="sr-only peer" >
                <div class="relative w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 dark:peer-checked:bg-blue-600"></div>
                <span class="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">{{ $t('activate') }}</span>
              </label>
              <div class="flex flex-col gap-y-2">
                <a class="text-blue-500 hover:text-blue-700 underline cursor-pointer" target="_blank" :href="apartment.image">{{ $t('model') }}</a>
                <a class="text-blue-500 hover:text-blue-700 underline cursor-pointer" target="_blank" :href="apartment.parent_image">{{ $t('place_in_model') }}</a>
              </div>
            </td>
            <td class="px-6 py-4">
              {{ $t(apartment.status) }}
            </td>
            <td v-if="!this.filter.building?.id" class="px-6 py-4">
              {{ apartment.building }}
            </td>
            <td class="px-6 py-4">
              {{ apartment.block }}
            </td>
            <td v-if="!this.filter.floor?.id" class="px-6 py-4">
              {{ apartment.floor }}
            </td>
            <td class="px-6 py-4">
              {{ apartment.number }}
            </td>
            <td class="px-6 py-4">
              {{ apartment.rooms }}
            </td>
            <td class="px-6 py-4">
              {{ apartment.square_meter }}
            </td>
            <td class="px-6 py-4">
              <button type="button" @click="editBuilding(apartment.id)"
                      class="text-white bg-indigo-700 hover:bg-indigo-800 focus:ring-4 focus:ring-indigo-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-indigo-600 dark:hover:bg-indigo-700 focus:outline-none dark:focus:ring-indigo-800">
                {{ $t('update') }}
              </button>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
  <AddEditApartment v-if="showAddEditApartment" v-bind:apartment_id="selectedApartmentId" v-bind:buildings="buildings" @updateList="updateList"/>
</template>

<script>
import AddEditApartment from "@/views/apartments/modals/AddEditApartment.vue";
import api from "@/utils/api.js";
import {useToast} from "vue-toastification";
import vSelect from "vue-select";
const toast = useToast();

export default {
  components: {vSelect, AddEditApartment},
  data() {
    return {
      showAddEditApartment: false,
      selectedApartmentId: null,
      buildings: [],
      apartments: {
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
      filter: {
        building: null,
        floor: null,
        number: null,
        rooms: null,
        square_meter: null
      },
      floors: []
    }
  },
  watch: {
    'filter.building'() {
      if (!this.filter.building) {
        this.floors = [];
        this.filter.floor = null;
      } else {
        this.getFloorsByBuildingId();
      }
      this.resetPaginationSettings('apartments');
      this.list();
    },
    'filter.floor'() {
      this.resetPaginationSettings('apartments');
      this.list();
    },
    'filter.number'() {
      this.resetPaginationSettings('apartments');
      this.list();
    },
    'filter.rooms'() {
      this.resetPaginationSettings('apartments');
      this.list();
    },
    'filter.square_meter'() {
      this.resetPaginationSettings('apartments');
      this.list();
    },
  },
  methods: {
    updateList() {
      this.resetPaginationSettings('apartments');
      this.list();
    },
    getBuildings() {
      api.get("buildings").then((response) => {
        this.buildings = response.data.data
      }).catch((response) => {
      })
    },
    getFloorsByBuildingId() {
      api.get("buildings/" + this.filter.building.id + "/floors").then((response) => {
        this.floors = response.data.data
      }).catch((response) => {
      })
    },
    switcher(apartment, switcher) {
      apartment.active = switcher;
      api.patch("apartments/"+apartment.id+"/switcher", {
        active: apartment.active ? 1 : 0
      }).then((response) => {
        if(apartment.active) {
          toast.success(this.$t('apartment_activated'));
        } else {
          toast.success(this.$t('apartment_disabled'));
        }
        apartment.status = response.data.data;
      }).catch((response) => {
        apartment.active = !apartment.active;
      })
    },
    list() {
      api.get("apartments", {
        params: {
          limit: this.apartments.settings.limit,
          offset: this.apartments.settings.offset,
          building_id: this.filter.building?.id,
          floor_id: this.filter.floor?.id,
          number: this.filter.number,
          rooms: this.filter.rooms,
          square_meter: this.filter.square_meter,
        }
      }).then((response) => {
        if (this.apartments.settings.offset > 0) {
          this.apartments.prependedData = response.data.data
          this.apartments.data = this.apartments.data.concat(response.data.data);
        } else {
          this.apartments.data = response.data.data
        }
      }).catch((response) => {
      })
    },
    createApartment() {
      this.selectedApartmentId = null;
      this.showAddEditApartment = true;
    },
    editBuilding(id) {
      this.selectedApartmentId = id;
      this.showAddEditApartment = true;
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
    this.getBuildings();
    this.list();
  }
}
</script>