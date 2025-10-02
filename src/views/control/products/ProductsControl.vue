<template>
  <div class="flex flex-col gap-y-4">
    <div class="dark:border-gray-700">
      <div class="flex flex-col gap-y-4 p-4 border rounded-md border-gray-200 bg-slate-100 text-xl">
        <p>{{ $t('products_control') }}</p>
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
    <div v-if="activeTab === 'products'" class="flex flex-col gap-y-4">
      <div class="flex px-4">
        <button type="button" @click="createProduct"
                class="bg-white group text-sm flex gap-x-2 items-center text-violet-500 hover:text-white border border-violet-500 hover:bg-violet-700 focus:ring-4 focus:outline-none focus:ring-violet-300 font-medium rounded-lg px-5 py-2.5 text-center dark:border-violet-300 dark:text-violet-300 dark:hover:text-white dark:hover:bg-violet-400 dark:focus:ring-violet-900">
          {{ $t('new_product') }}
          <svg width="21" height="21" class="fill-violet-500 group-hover:fill-white" viewBox="0 0 21 21"
               xmlns="http://www.w3.org/2000/svg">
            <path class="text-violet-500"
                  d="M19.037 11.7413H11.2599V19.5185C11.2599 19.8132 11.1428 20.0959 10.9343 20.3044C10.7259 20.5128 10.4432 20.6299 10.1484 20.6299C9.85367 20.6299 9.57097 20.5128 9.36254 20.3044C9.15411 20.0959 9.03701 19.8132 9.03701 19.5185V11.7413H1.25987C0.965097 11.7413 0.682401 11.6242 0.473967 11.4158C0.265534 11.2073 0.148438 10.9247 0.148438 10.6299C0.148438 10.3351 0.265534 10.0524 0.473967 9.84398C0.682401 9.63555 0.965097 9.51845 1.25987 9.51845H9.03701V1.74131C9.03701 1.59536 9.06576 1.45083 9.12161 1.31599C9.17747 1.18114 9.25933 1.05862 9.36254 0.955413C9.46574 0.852207 9.58827 0.77034 9.72311 0.714485C9.85796 0.658631 10.0025 0.629883 10.1484 0.629883C10.2944 0.629883 10.4389 0.658631 10.5738 0.714485C10.7086 0.77034 10.8311 0.852207 10.9343 0.955413C11.0375 1.05862 11.1194 1.18114 11.1753 1.31599C11.2311 1.45083 11.2599 1.59536 11.2599 1.74131V9.51845H19.037C19.183 9.51845 19.3275 9.5472 19.4623 9.60306C19.5972 9.65891 19.7197 9.74078 19.8229 9.84398C19.9261 9.94719 20.008 10.0697 20.0638 10.2046C20.1197 10.3394 20.1484 10.4839 20.1484 10.6299C20.1484 10.7758 20.1197 10.9204 20.0638 11.0552C20.008 11.1901 19.9261 11.3126 19.8229 11.4158C19.7197 11.519 19.5972 11.6009 19.4623 11.6567C19.3275 11.7126 19.183 11.7413 19.037 11.7413Z"/>
          </svg>
        </button>
      </div>
      <div>
        <label for="search" class="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white">Search</label>
        <div class="relative">
          <div class="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
            <svg class="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"
                 fill="none" viewBox="0 0 20 20">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
            </svg>
          </div>
          <input type="search" v-model="filter.search"
                 class="block w-full p-4 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                 :placeholder="$t('search')"/>
        </div>
      </div>
      <div class="h-[640px] overflow-y-auto" @scroll="onScrollCallback($event, 'products','productList')">
        <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
          <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th scope="col" class="px-6 py-3">
              {{ $t('type') }}
            </th>
            <th scope="col" class="px-6 py-3">
              {{ $t('name') }}
            </th>
            <th scope="col" class="px-6 py-3">
              {{ $t('measure') }}
            </th>
            <th scope="col" class="px-6 py-3">
              {{ $t('own') }}
            </th>
            <th scope="col" class="px-6 py-3">
            </th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="product in products.data"
              class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200">
            <td class="px-6 py-4">
              {{ product.type_name }}
            </td>
            <td class="px-6 py-4">
              {{ product.name }}
            </td>
            <td class="px-6 py-4">
              {{ $t(product.measure_type) }}
            </td>
            <td class="px-6 py-4">
              {{ product.is_own ? $t('yes') : $t('no') }}
            </td>
            <td class="px-6 py-4">
              <div v-if="!product.loading" class="flex flex-wrap gap-2">
                <button @click="editProduct(product)"
                        type="button" v-if="!product.default"
                        class="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-md shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {{ $t('edit') }}
                </button>
<!--                <button @click="destroyProduct(product)"-->
<!--                        type="button" v-if="!product.default"-->
<!--                        class="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded-md shadow hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500">-->
<!--                  {{ $t('delete') }}-->
<!--                </button>-->
              </div>
              <div v-else>
                <button
                    type="button"
                    class="px-3 py-1 text-xs font-medium text-white bg-indigo-600 rounded-md shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <svg aria-hidden="true" class="w-4 h-4 text-gray-200 animate-spin dark:text-gray-600 fill-indigo-600"
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
            </td>
          </tr>
          </tbody>
        </table>
      </div>

    </div>
    <div v-if="activeTab === 'types'" class="flex flex-col gap-y-4">
      <div class="flex px-4">
        <button type="button" @click="createType"
                class="bg-white group text-sm flex gap-x-2 items-center text-violet-500 hover:text-white border border-violet-500 hover:bg-violet-700 focus:ring-4 focus:outline-none focus:ring-violet-300 font-medium rounded-lg px-5 py-2.5 text-center dark:border-violet-300 dark:text-violet-300 dark:hover:text-white dark:hover:bg-violet-400 dark:focus:ring-violet-900">
          {{ $t('new_type') }}
          <svg width="21" height="21" class="fill-violet-500 group-hover:fill-white" viewBox="0 0 21 21"
               xmlns="http://www.w3.org/2000/svg">
            <path class="text-violet-500"
                  d="M19.037 11.7413H11.2599V19.5185C11.2599 19.8132 11.1428 20.0959 10.9343 20.3044C10.7259 20.5128 10.4432 20.6299 10.1484 20.6299C9.85367 20.6299 9.57097 20.5128 9.36254 20.3044C9.15411 20.0959 9.03701 19.8132 9.03701 19.5185V11.7413H1.25987C0.965097 11.7413 0.682401 11.6242 0.473967 11.4158C0.265534 11.2073 0.148438 10.9247 0.148438 10.6299C0.148438 10.3351 0.265534 10.0524 0.473967 9.84398C0.682401 9.63555 0.965097 9.51845 1.25987 9.51845H9.03701V1.74131C9.03701 1.59536 9.06576 1.45083 9.12161 1.31599C9.17747 1.18114 9.25933 1.05862 9.36254 0.955413C9.46574 0.852207 9.58827 0.77034 9.72311 0.714485C9.85796 0.658631 10.0025 0.629883 10.1484 0.629883C10.2944 0.629883 10.4389 0.658631 10.5738 0.714485C10.7086 0.77034 10.8311 0.852207 10.9343 0.955413C11.0375 1.05862 11.1194 1.18114 11.1753 1.31599C11.2311 1.45083 11.2599 1.59536 11.2599 1.74131V9.51845H19.037C19.183 9.51845 19.3275 9.5472 19.4623 9.60306C19.5972 9.65891 19.7197 9.74078 19.8229 9.84398C19.9261 9.94719 20.008 10.0697 20.0638 10.2046C20.1197 10.3394 20.1484 10.4839 20.1484 10.6299C20.1484 10.7758 20.1197 10.9204 20.0638 11.0552C20.008 11.1901 19.9261 11.3126 19.8229 11.4158C19.7197 11.519 19.5972 11.6009 19.4623 11.6567C19.3275 11.7126 19.183 11.7413 19.037 11.7413Z"/>
          </svg>
        </button>
      </div>
      <div>
        <label for="search" class="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white">Search</label>
        <div class="relative">
          <div class="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
            <svg class="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"
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
      <div class="h-[640px] overflow-y-auto" @scroll="onScrollCallback($event, 'types','typeList')">
        <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
          <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th scope="col" class="px-6 py-3">
              {{ $t('group') }}
            </th>
            <th scope="col" class="px-6 py-3">
              {{ $t('name') }}
            </th>
            <th scope="col" class="px-6 py-3">
              {{ $t('industrial') }}
            </th>
            <th scope="col" class="px-6 py-3">
            </th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="type in types.data"
              class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200">
            <td class="px-6 py-4">
              {{ type.group?.name }}
            </td>
            <td class="px-6 py-4">
              {{ type.name }}
            </td>
            <td class="px-6 py-4">
              {{ type.industrial ? $t('yes') : $t('no') }}
            </td>
            <td class="px-6 py-4">
              <div v-if="!type.loading" class="flex flex-wrap gap-2">
                <button @click="editType(type)"
                        type="button" v-if="!type.default"
                        class="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-md shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {{ $t('edit') }}
                </button>
                <button @click="destroyType(type)"
                        type="button" v-if="!type.default"
                        class="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded-md shadow hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500">
                  {{ $t('delete') }}
                </button>
              </div>
              <div v-else>
                <button
                    type="button"
                    class="px-3 py-1 text-xs font-medium text-white bg-indigo-600 rounded-md shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <svg aria-hidden="true" class="w-4 h-4 text-gray-200 animate-spin dark:text-gray-600 fill-indigo-600"
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
            </td>
          </tr>
          </tbody>
        </table>
      </div>

    </div>
    <div v-if="activeTab === 'groups'" class="flex flex-col gap-y-4">
      <div class="flex px-4">
        <button type="button" @click="createGroup"
                class="bg-white group text-sm flex gap-x-2 items-center text-violet-500 hover:text-white border border-violet-500 hover:bg-violet-700 focus:ring-4 focus:outline-none focus:ring-violet-300 font-medium rounded-lg px-5 py-2.5 text-center dark:border-violet-300 dark:text-violet-300 dark:hover:text-white dark:hover:bg-violet-400 dark:focus:ring-violet-900">
          {{ $t('new_group') }}
          <svg width="21" height="21" class="fill-violet-500 group-hover:fill-white" viewBox="0 0 21 21"
               xmlns="http://www.w3.org/2000/svg">
            <path class="text-violet-500"
                  d="M19.037 11.7413H11.2599V19.5185C11.2599 19.8132 11.1428 20.0959 10.9343 20.3044C10.7259 20.5128 10.4432 20.6299 10.1484 20.6299C9.85367 20.6299 9.57097 20.5128 9.36254 20.3044C9.15411 20.0959 9.03701 19.8132 9.03701 19.5185V11.7413H1.25987C0.965097 11.7413 0.682401 11.6242 0.473967 11.4158C0.265534 11.2073 0.148438 10.9247 0.148438 10.6299C0.148438 10.3351 0.265534 10.0524 0.473967 9.84398C0.682401 9.63555 0.965097 9.51845 1.25987 9.51845H9.03701V1.74131C9.03701 1.59536 9.06576 1.45083 9.12161 1.31599C9.17747 1.18114 9.25933 1.05862 9.36254 0.955413C9.46574 0.852207 9.58827 0.77034 9.72311 0.714485C9.85796 0.658631 10.0025 0.629883 10.1484 0.629883C10.2944 0.629883 10.4389 0.658631 10.5738 0.714485C10.7086 0.77034 10.8311 0.852207 10.9343 0.955413C11.0375 1.05862 11.1194 1.18114 11.1753 1.31599C11.2311 1.45083 11.2599 1.59536 11.2599 1.74131V9.51845H19.037C19.183 9.51845 19.3275 9.5472 19.4623 9.60306C19.5972 9.65891 19.7197 9.74078 19.8229 9.84398C19.9261 9.94719 20.008 10.0697 20.0638 10.2046C20.1197 10.3394 20.1484 10.4839 20.1484 10.6299C20.1484 10.7758 20.1197 10.9204 20.0638 11.0552C20.008 11.1901 19.9261 11.3126 19.8229 11.4158C19.7197 11.519 19.5972 11.6009 19.4623 11.6567C19.3275 11.7126 19.183 11.7413 19.037 11.7413Z"/>
          </svg>
        </button>
      </div>
      <div>
        <label for="search" class="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white">Search</label>
        <div class="relative">
          <div class="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
            <svg class="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"
                 fill="none" viewBox="0 0 20 20">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
            </svg>
          </div>
          <input type="search" v-model="group_filter.search"
                 class="block w-full p-4 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                 :placeholder="$t('search')"/>
        </div>
      </div>
      <div class="h-[640px] overflow-y-auto" @scroll="onScrollCallback($event, 'groups','groupList')">
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
          <tr v-for="group in groups.data"
              class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200">
            <td class="px-6 py-4">
              {{ group.name }}
            </td>
            <td class="px-6 py-4">
              <div v-if="!group.loading" class="flex flex-wrap gap-2">
                <button @click="editGroup(group)"
                        type="button" v-if="!group.default"
                        class="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-md shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {{ $t('edit') }}
                </button>
                <button @click="destroyGroup(group)"
                        type="button" v-if="!group.default"
                        class="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded-md shadow hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500">
                  {{ $t('delete') }}
                </button>
              </div>
              <div v-else>
                <button
                    type="button"
                    class="px-3 py-1 text-xs font-medium text-white bg-indigo-600 rounded-md shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <svg aria-hidden="true" class="w-4 h-4 text-gray-200 animate-spin dark:text-gray-600 fill-indigo-600"
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
            </td>
          </tr>
          </tbody>
        </table>
      </div>

    </div>
  </div>
  <AddEditProductTypeModal v-if="showAddEditProductType" v-bind:type="selectedType" @updateList="typeList"/>
  <AddEditProductGroupModal v-if="showAddEditProductGroup" v-bind:group="selectedGroup" @updateList="groupList"/>
  <AddEditProductModal v-if="showAddEditProduct" v-bind:product="selectedProduct" @updateList="productList"/>
</template>
<script>
import AddEditProductTypeModal from '@/views/control/products/modal/AddEditProductTypeModal.vue'
import AddEditProductModal from '@/views/control/products/modal/AddEditProductModal.vue'
import AddEditProductGroupModal from '@/views/control/products/modal/AddEditProductGroupModal.vue'
import api from "@/utils/api.js";
import {useToast} from "vue-toastification";
const toast = useToast();

export default {
  components: {
    AddEditProductTypeModal,
    AddEditProductModal,
    AddEditProductGroupModal
  },
  data() {
    return {
      tabs: [
        {
          name: this.$t('products'),
          key: 'products',
          active: 1
        },
        {
          name: this.$t('types'),
          key: 'types',
          active: 0
        },
        {
          name: this.$t('groups'),
          key: 'groups',
          active: 0
        }
      ],
      activeTab: 'products',
      showAddEditProductGroup: false,
      showAddEditProductType: false,
      showAddEditProduct: false,
      selectedType: null,
      selectedProduct: null,
      selectedGroup: null,
      group_filter: {
        search: null
      },
      type_filter: {
        search: null
      },
      filter: {
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
      products: {
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
      groups: {
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
    }
  },
  watch: {
    'filter.search'() {
      this.resetPaginationSettings('products')
      this.productList();
    },
    'type_filter.search'() {
      this.resetPaginationSettings('types')
      this.typeList();
    },
    'group_filter.search'() {
      this.resetPaginationSettings('groups')
      this.groupList();
    },
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
    createProduct() {
      this.selectedProductId = null
      this.showAddEditProduct = true;
    },
    createType() {
      this.selectedType = null;
      this.showAddEditProductType = true;
    },
    createGroup() {
      this.selectedGroup = null;
      this.showAddEditProductGroup = true;
    },
    editProduct(product) {
      this.selectedProduct = product;
      this.showAddEditProduct = true;
    },
    editType(type) {
      this.selectedType = type;
      this.showAddEditProductType = true;
    },
    editGroup(group) {
      this.selectedGroup = group;
      this.showAddEditProductGroup = true;
    },
    async typeList() {
      await api.get("products/types", {
        params: {
          limit: this.types.settings.limit,
          offset: this.types.settings.offset,
          search: this.type_filter.search,
        }
      }).then((response) => {
        if (this.types.settings.offset > 0) {
          this.types.prependedData = response.data.data
          this.types.data = this.types.data.concat(response.data.data);
        } else {
          this.types.data = response.data.data
        }
      }).catch((response) => {
      })
    },
    async groupList() {
      await api.get("products/groups", {
        params: {
          limit: this.groups.settings.limit,
          offset: this.groups.settings.offset,
          search: this.group_filter.search,
        }
      }).then((response) => {
        if (this.groups.settings.offset > 0) {
          this.groups.prependedData = response.data.data
          this.groups.data = this.groups.data.concat(response.data.data);
        } else {
          this.groups.data = response.data.data
        }
      }).catch((response) => {
      })
    },
    async productList() {
      await api.get("products", {
        params: {
          limit: this.products.settings.limit,
          offset: this.products.settings.offset,
          search: this.filter.search,
        }
      }).then((response) => {
        if (this.products.settings.offset > 0) {
          this.products.prependedData = response.data.data
          this.products.data = this.products.data.concat(response.data.data);
        } else {
          this.products.data = response.data.data
        }
      }).catch((response) => {
      })
    },
    async destroyType(type) {
      if (confirm(this.$t('are_you_sure'))) {
        type.loading = true;
        await api.delete("products/types/" + type.id).then((response) => {
          toast.success(this.$t('type_deleted_successfully'));
          type.loading = false;
          this.typeList();
        }).catch((response) => {
          type.loading = false;
        })
      }
    },
    async destroyGroup(group) {
      if (confirm(this.$t('are_you_sure'))) {
        group.loading = true;
        await api.delete("products/groups/" + group.id).then((response) => {
          toast.success(this.$t('group_deleted_successfully'));
          group.loading = false;
          this.groupList();
        }).catch((response) => {
          group.loading = false;
        })
      }
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
    this.typeList();
    this.groupList();
    this.productList();
  }
}
</script>
