<template>
  <div class="flex flex-col gap-y-4">
    <div class="dark:border-gray-700">
      <div class="flex flex-col gap-y-4 p-4 shadow-lg border rounded-md border-gray-200 bg-slate-100 text-xl">
        <p>{{ $t('houses') }}</p>
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
    <div v-if="activeTab === 'houses'">
      <button type="button" @click="createHouse"
              class="bg-white group text-sm flex gap-x-2 items-center text-violet-500 hover:text-white border border-violet-500 hover:bg-violet-700 focus:ring-4 focus:outline-none focus:ring-violet-300 font-medium rounded-lg px-5 py-2.5 text-center dark:border-violet-300 dark:text-violet-300 dark:hover:text-white dark:hover:bg-violet-400 dark:focus:ring-violet-900">
        {{ $t('new_house') }}
        <svg width="21" height="21" class="fill-violet-500 group-hover:fill-white" viewBox="0 0 21 21"
             xmlns="http://www.w3.org/2000/svg">
          <path class="text-violet-500"
                d="M19.037 11.7413H11.2599V19.5185C11.2599 19.8132 11.1428 20.0959 10.9343 20.3044C10.7259 20.5128 10.4432 20.6299 10.1484 20.6299C9.85367 20.6299 9.57097 20.5128 9.36254 20.3044C9.15411 20.0959 9.03701 19.8132 9.03701 19.5185V11.7413H1.25987C0.965097 11.7413 0.682401 11.6242 0.473967 11.4158C0.265534 11.2073 0.148438 10.9247 0.148438 10.6299C0.148438 10.3351 0.265534 10.0524 0.473967 9.84398C0.682401 9.63555 0.965097 9.51845 1.25987 9.51845H9.03701V1.74131C9.03701 1.59536 9.06576 1.45083 9.12161 1.31599C9.17747 1.18114 9.25933 1.05862 9.36254 0.955413C9.46574 0.852207 9.58827 0.77034 9.72311 0.714485C9.85796 0.658631 10.0025 0.629883 10.1484 0.629883C10.2944 0.629883 10.4389 0.658631 10.5738 0.714485C10.7086 0.77034 10.8311 0.852207 10.9343 0.955413C11.0375 1.05862 11.1194 1.18114 11.1753 1.31599C11.2311 1.45083 11.2599 1.59536 11.2599 1.74131V9.51845H19.037C19.183 9.51845 19.3275 9.5472 19.4623 9.60306C19.5972 9.65891 19.7197 9.74078 19.8229 9.84398C19.9261 9.94719 20.008 10.0697 20.0638 10.2046C20.1197 10.3394 20.1484 10.4839 20.1484 10.6299C20.1484 10.7758 20.1197 10.9204 20.0638 11.0552C20.008 11.1901 19.9261 11.3126 19.8229 11.4158C19.7197 11.519 19.5972 11.6009 19.4623 11.6567C19.3275 11.7126 19.183 11.7413 19.037 11.7413Z"/>
        </svg>
      </button>
      <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
        <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
        <tr>
          <th scope="col" class="px-6 py-3">

          </th>
          <th scope="col" class="px-6 py-3">
            {{ $t('address') }}
          </th>
          <th scope="col" class="px-6 py-3">
            {{ $t('status') }}
          </th>
          <th scope="col" class="px-6 py-3">
            {{ $t('type') }}
          </th>
          <th scope="col" class="px-6 py-3">
            {{ $t('price') }}
          </th>
          <th scope="col" class="px-6 py-3">
          </th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="house in houses"
            class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200">
          <td class="px-6 py-4">
            <label class="inline-flex items-center cursor-pointer">
              <input v-if="house.active" @change="switcher(house, false)" checked type="checkbox" class="sr-only peer" >
              <input v-else @change="switcher(house, true)" type="checkbox" class="sr-only peer" >
              <div class="relative w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 dark:peer-checked:bg-blue-600"></div>
              <span class="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">{{ $t('activate') }}</span>
            </label>
          </td>
          <td class="px-6 py-4">
            {{ house.address }}
          </td>
          <td class="px-6 py-4">
            {{ $t(house.status) }}
          </td>
          <td class="px-6 py-4">
            {{ $t(house.type) }}
          </td>
          <td class="px-6 py-4">
            {{ price(house.price) }}
          </td>
          <td class="px-6 py-4">
            <button type="button" @click="editHouse(house.id)"
                    class="text-white bg-indigo-700 hover:bg-indigo-800 focus:ring-4 focus:ring-indigo-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-indigo-600 dark:hover:bg-indigo-700 focus:outline-none dark:focus:ring-indigo-800">
              {{ $t('update') }}
            </button>
          </td>
        </tr>
        </tbody>
      </table>

    </div>
    <div v-if="activeTab === 'designs'">
      <button type="button" @click="createDesign"
              class="bg-white group text-sm flex gap-x-2 items-center text-blue-500 hover:text-white border border-blue-500 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg px-5 py-2.5 text-center dark:border-blue-300 dark:text-blue-300 dark:hover:text-white dark:hover:bg-blue-400 dark:focus:ring-blue-900">
        {{ $t('new_design') }}
        <svg width="21" height="21" class="fill-blue-500 group-hover:fill-white" viewBox="0 0 21 21"
             xmlns="http://www.w3.org/2000/svg">
          <path class="text-blue-500"
                d="M19.037 11.7413H11.2599V19.5185C11.2599 19.8132 11.1428 20.0959 10.9343 20.3044C10.7259 20.5128 10.4432 20.6299 10.1484 20.6299C9.85367 20.6299 9.57097 20.5128 9.36254 20.3044C9.15411 20.0959 9.03701 19.8132 9.03701 19.5185V11.7413H1.25987C0.965097 11.7413 0.682401 11.6242 0.473967 11.4158C0.265534 11.2073 0.148438 10.9247 0.148438 10.6299C0.148438 10.3351 0.265534 10.0524 0.473967 9.84398C0.682401 9.63555 0.965097 9.51845 1.25987 9.51845H9.03701V1.74131C9.03701 1.59536 9.06576 1.45083 9.12161 1.31599C9.17747 1.18114 9.25933 1.05862 9.36254 0.955413C9.46574 0.852207 9.58827 0.77034 9.72311 0.714485C9.85796 0.658631 10.0025 0.629883 10.1484 0.629883C10.2944 0.629883 10.4389 0.658631 10.5738 0.714485C10.7086 0.77034 10.8311 0.852207 10.9343 0.955413C11.0375 1.05862 11.1194 1.18114 11.1753 1.31599C11.2311 1.45083 11.2599 1.59536 11.2599 1.74131V9.51845H19.037C19.183 9.51845 19.3275 9.5472 19.4623 9.60306C19.5972 9.65891 19.7197 9.74078 19.8229 9.84398C19.9261 9.94719 20.008 10.0697 20.0638 10.2046C20.1197 10.3394 20.1484 10.4839 20.1484 10.6299C20.1484 10.7758 20.1197 10.9204 20.0638 11.0552C20.008 11.1901 19.9261 11.3126 19.8229 11.4158C19.7197 11.519 19.5972 11.6009 19.4623 11.6567C19.3275 11.7126 19.183 11.7413 19.037 11.7413Z"/>
        </svg>
      </button>
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
        <tr v-for="design in designs"
            class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200">
          <td class="px-6 py-4">
            {{ design.name }}
          </td>
          <td class="px-6 py-4">
            <button type="button" @click="editDesign(design.id)"
                    class="text-white bg-indigo-700 hover:bg-indigo-800 focus:ring-4 focus:ring-indigo-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-indigo-600 dark:hover:bg-indigo-700 focus:outline-none dark:focus:ring-indigo-800">
              {{ $t('update') }}
            </button>
          </td>
        </tr>
        </tbody>
      </table>
    </div>
  </div>
  <AddEditHouse v-if="showAddEditHouseModal" v-bind:house_id="selectedHouseId" v-bind:locales="locales" @updateList="updateHouseList"/>
  <AddEditDesign v-if="showAddEditDesignModal" v-bind:design_id="selectedDesignId" v-bind:locales="locales" @updateList="updateDesignList"/>
</template>

<script>
import AddEditHouse from "@/views/houses/modals/AddEditHouse.vue";
import AddEditDesign from "@/views/houses/modals/AddEditDesign.vue";
import api from "@/utils/api.js";
import {useToast} from "vue-toastification";
const toast = useToast();

export default {
  components: {
    AddEditHouse,
    AddEditDesign
  },
  data() {
    return {
      showAddEditHouseModal: false,
      showAddEditDesignModal: false,
      locales: [],
      selectedHouseId: null,
      selectedDesignId: null,
      tabs: [
        {
          name: this.$t('houses'),
          key: 'houses',
          active: 1
        },
        {
          name: this.$t('designs'),
          key: 'designs',
          active: 0
        }
      ],
      activeTab: 'houses',
      designs: [],
      houses: [],
    }
  },
  methods: {
    createHouse() {
      this.selectedHouseId = null;
      this.showAddEditHouseModal = true;
    },
    createDesign() {
      this.selectedDesignId = null;
      this.showAddEditDesignModal = true;
    },
    editDesign(id) {
      this.selectedDesignId = id;
      this.showAddEditDesignModal = true;
    },
    editHouse(id) {
      this.selectedHouseId = id;
      this.showAddEditHouseModal = true;
    },
    updateDesignList() {
      this.getDesigns();
    },
    updateHouseList() {
      this.getHouses();
    },
    getLocales() {
      api.get("locales").then((response) => {
        this.locales = response.data.data
      }).catch((response) => {
      })
    },
    getDesigns() {
      api.get("designs").then((response) => {
        this.designs = response.data.data
      }).catch((response) => {
      })
    },
    getHouses() {
      api.get("houses").then((response) => {
        this.houses = response.data.data
      }).catch((response) => {
      })
    },
    changeTab(tabs, index) {
      tabs.map((tab, localIndex) => {
        tab.active = index === localIndex;
        if (tab.active) {
          this.activeTab = tab.key
        }
      })
    },
    price(amount) {
      let intlFormat = new Intl.NumberFormat('hy-AM', {
        style: 'currency',
        currency: 'amd'
      })
      amount = intlFormat.format(amount);
      amount = amount.replace('AMD', '֏')
      return amount;
    },
    switcher(house, switcher) {
      console.log(switcher);
      house.active = switcher;
      api.patch("houses/"+house.id+"/switcher", {
        active: house.active ? 1 : 0
      }).then((response) => {
        if(house.active) {
          toast.success(this.$t('house_activated'));
        } else {
          toast.success(this.$t('house_disabled'));
        }
        house.status = response.data.data;
      }).catch((response) => {
        house.active = !house.active;
      })
    },
  },
  mounted() {
    this.getLocales();
    this.getDesigns();
    this.getHouses();
  }
}
</script>