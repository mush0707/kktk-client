<template>
  <div class="p-2">
    <div class="flex flex-col gap-y-2">
      <input type="text" v-model="form.department_name"
             class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
             :placeholder="$t('department_name')"/>

      <button
          type="button" @click="newSection"
          class="inline-flex items-center justify-center h-10 w-40 gap-2 rounded-full border border-slate-300 bg-white hover:bg-slate-50 active:bg-slate-100 shadow-sm"
          aria-label="Add"
      >
        <span class="text-xl leading-none">+</span> {{ $t('new_section') }}
      </button>
      <div class="border-l border-gray-500 p-2" v-for="(section, sectionIndex) in form.sections">
        <div class="flex flex-col gap-y-2 relative">
          <p>{{ $t('section') }}</p>
          <span v-if="!section.section_id" class="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
            <span class="relative flex h-1.5 w-1.5">
              <span class="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
              <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            {{ $t('new') }}
          </span>
          <div class="flex items-center gap-x-2">
            <input type="text" v-model="section.section_name"
                   class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                   :placeholder="$t('section_name')"/>
            <div v-if="!section.section_id">
              <button v-if="sectionIndex > 0" @click="form.sections.splice(sectionIndex, 1)"
                      type="button"
                      class="inline-flex items-center justify-center w-8 h-8 text-lg font-bold rounded-full text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300"
              >
                ×
              </button>
            </div>
            <div v-else>
              <div v-if="!section.loading" class="flex gap-x-2">
                <button @click="updateSection(section)" :title="$t('update')"
                        type="button"
                        class="inline-flex items-center justify-center w-8 h-8 text-lg font-bold rounded-full text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  ✓
                </button>
                <button v-if="sectionIndex > 0" @click="removeSection(section, sectionIndex)"
                        type="button"
                        class="inline-flex items-center justify-center w-8 h-8 text-lg font-bold rounded-full text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300"
                >
                  ×
                </button>
              </div>
              <button v-else
                      type="button"
                      class="inline-flex items-center justify-center w-8 h-8 text-lg font-bold rounded-full text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                <svg aria-hidden="true" class="w-6 h-6 text-gray-200 animate-spin dark:text-gray-600 fill-indigo-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                  <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                </svg>
              </button>
            </div>
          </div>
          <button
              type="button" @click="newShelf(sectionIndex)"
              class="inline-flex items-center justify-center h-10 w-44 gap-2 rounded-full border border-slate-300 bg-white hover:bg-slate-50 active:bg-slate-100 shadow-sm"
              aria-label="Add"
          >
            <span class="text-xl leading-none">+</span> {{ $t('new_shelf') }}
          </button>
          <div class="border-l border-gray-500 p-2" v-for="(shelf, shelfIndex) in section.shelves">
            <p class="pb-2">{{ $t('shelf') }}</p>
            <span v-if="!shelf.shelf_id" class="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
              <span class="relative flex h-1.5 w-1.5">
                <span class="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
                <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              {{ $t('new') }}
            </span>
            <div class="flex items-center gap-x-2">
              <input type="text" v-model="shelf.shelf_name"
                     class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                     :placeholder="$t('shelf_name')"/>

              <div v-if="!shelf.shelf_id">
                <button v-if="shelfIndex > 0" @click="form.sections[sectionIndex].shelves.splice(shelfIndex, 1)"
                        type="button"
                        class="inline-flex items-center justify-center w-8 h-8 text-lg font-bold rounded-full text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300"
                >
                  ×
                </button>
              </div>
              <div v-else>
                <div class="flex gap-x-2" v-if="!shelf.loading">
                  <button @click="updateShelf(section, shelf)" :title="$t('update')"
                          type="button"
                          class="inline-flex items-center justify-center w-8 h-8 text-lg font-bold rounded-full text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    ✓
                  </button>
                  <button v-if="shelfIndex > 0" @click="removeShelf(section, shelf, sectionIndex, shelfIndex)"
                          type="button"
                          class="inline-flex items-center justify-center w-8 h-8 text-lg font-bold rounded-full text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300"
                  >
                    ×
                  </button>
                </div>
                <button v-else
                        type="button"
                        class="inline-flex items-center justify-center w-8 h-8 text-lg font-bold rounded-full text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  <svg aria-hidden="true" class="w-6 h-6 text-gray-200 animate-spin dark:text-gray-600 fill-indigo-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                    <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                  </svg>
                </button>
              </div>
            </div>
            <div class="p-2 bg-blue-50 flex flex-col gap-y-2">
              <p>{{ $t('cells') }}</p>
              <div class="flex flex-wrap gap-2">
                <div class="flex flex-col justify-end">
                  <select v-model="cell_generation.volume_measure"
                          class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
                    <option v-for="measure in measure_lengths" :value="measure.key">{{ measure.name }}</option>
                  </select>
                </div>
                <div class="flex flex-col gap-y-2">
                  <label>{{ $t('width_small') }}</label>
                  <input type="number" step="0.01" v-model="cell_generation.width"
                         class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-24 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                         :placeholder="$t('width_small')"/>
                </div>
                <div class="flex flex-col gap-y-2">
                  <label>{{ $t('length_small') }}</label>
                  <input type="number" step="0.01" v-model="cell_generation.length"
                         class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-24 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                         :placeholder="$t('length_small')"/>
                </div>
                <div class="flex flex-col gap-y-2">
                  <label>{{ $t('depth_small') }}</label>
                  <input type="number" step="0.01" v-model="cell_generation.depth"
                         class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-24 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                         :placeholder="$t('depth_small')"/>
                </div>
                <div class="flex flex-col justify-end">
                  <select v-model="cell_generation.capacity_measure"
                          class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
                    <option v-for="measure in measure_weights" :value="measure.key">{{ measure.name }}</option>
                  </select>
                </div>
                <div class="flex flex-col gap-y-2">
                  <label>{{ $t('capacity_small') }}</label>
                  <input type="number" step="0.01" v-model="cell_generation.capacity"
                         class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-24 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                         :placeholder="$t('capacity_small')"/>
                </div>
              </div>
              <div class="flex gap-x-2">
                <div class="flex flex-col gap-y-2">
                  <label>{{ $t('quantity') }}</label>
                  <input type="number" step="0.01" v-model="cell_generation.quantity"
                         class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-24 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                         :placeholder="$t('quantity')"/>
                </div>
                <div class="flex flex-col justify-end">
                  <div class="flex">
                    <button @click="generateCells(sectionIndex, shelfIndex)"
                            type="button"
                            class="px-3 py-1.5 text-xs font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    >
                      {{ $t('generate') }}
                    </button>
                  </div>
                </div>
              </div>
              <div v-if="shelf.cells?.length">
                <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                  <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th scope="col" class="px-6 py-3">

                    </th>
                    <th scope="col" class="px-6 py-3">
                      {{ $t('volume_measure') }}
                    </th>
                    <th scope="col" class="px-6 py-3">
                      {{ $t('width') }}
                    </th>
                    <th scope="col" class="px-6 py-3">
                      {{ $t('length') }}
                    </th>
                    <th scope="col" class="px-6 py-3">
                      {{ $t('depth') }}
                    </th>
                    <th scope="col" class="px-6 py-3">
                      {{ $t('capacity_measure') }}
                    </th>
                    <th scope="col" class="px-6 py-3">
                      {{ $t('capacity') }}
                    </th>
                    <th scope="col" class="px-6 py-3">
                    </th>
                  </tr>
                  </thead>
                  <tbody>
                  <tr v-for="(cell, cellIndex) in shelf.cells"
                      :key="cell._key ?? cell.cell_id ?? cellIndex"
                      class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200">
                    <td class="px-6 py-4">
                      <div class="flex gap-x-1 items-center">
                       <span v-if="!cell.cell_id" class="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                          <span class="relative flex h-1.5 w-1.5">
                            <span class="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
                            <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                          </span>
                          {{ $t('new') }}
                        </span>
                        <input type="text" step="0.01" v-model="cell.cell_name"
                               class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-24 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                               :placeholder="$t('name')"/>
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <select v-model="cell.volume_measure"
                              class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
                        <option v-for="measure in measure_lengths" :value="measure.key">{{ measure.name }}</option>
                      </select>
                    </td>
                    <td class="px-6 py-4">
                      <input type="number" step="0.01" v-model="cell.width"
                             class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-24 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                             :placeholder="$t('width')"/>
                    </td>
                    <td class="px-6 py-4">
                      <input type="number" step="0.01" v-model="cell.length"
                             class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-24 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                             :placeholder="$t('length')"/>
                    </td>
                    <td class="px-6 py-4">
                      <input type="number" step="0.01" v-model="cell.depth"
                             class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-24 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                             :placeholder="$t('depth')"/>
                    </td>
                    <td class="px-6 py-4">
                      <select v-model="cell.capacity_measure"
                              class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
                        <option v-for="measure in measure_weights" :value="measure.key">{{ measure.name }}</option>
                      </select>
                    </td>
                    <td class="px-6 py-4">
                      <input type="number" step="0.01" v-model="cell.capacity"
                             class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-24 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                             :placeholder="$t('capacity')"/>
                    </td>
                    <td class="px-6 py-4">

                      <button v-if="!cell.cell_id" @click="form.sections[sectionIndex].shelves[shelfIndex].cells.splice(cellIndex, 1)"
                              type="button"
                              class="inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded-full text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300"
                      >
                        ×
                      </button>
                      <div v-else>
                        <div class="flex gap-x-2" v-if="!cell.loading">
                          <button @click="updateCell(section, shelf, cell)"
                                  type="button"
                                  class="inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded-full text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
                          >
                            ✓
                          </button>
                          <button @click="removeCell(section, shelf, cell, sectionIndex, shelfIndex, cellIndex)"
                                  type="button"
                                  class="inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded-full text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300"
                          >
                            ×
                          </button>
                        </div>
                        <button v-else
                                type="button"
                                class="inline-flex items-center justify-center w-8 h-8 text-lg font-bold rounded-full text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        >
                          <svg aria-hidden="true" class="w-6 h-6 text-gray-200 animate-spin dark:text-gray-600 fill-indigo-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
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
        </div>
      </div>
    </div>
    <div>
      <button v-if="!loading" type="button" @click="store"
              class="text-white bg-indigo-700 hover:bg-indigo-800 focus:ring-4 focus:ring-indigo-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-indigo-600 dark:hover:bg-indigo-700 focus:outline-none dark:focus:ring-indigo-800">
        {{ department !== null ? $t('update') : $t('save') }}
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

</template>
<script>
import api from "@/utils/api.js";
import {useToast} from "vue-toastification";
import {reactive} from "vue";
import { toRaw } from "vue";
const toast = useToast();

export default {
  data() {
    return {
      loading: false,
      measure_lengths: [
        {
          name: this.$t('millimeter'),
          key: 'mm'
        },
        {
          name: this.$t('centimeter'),
          key: 'cm'
        },
        {
          name: this.$t('meter'),
          key: 'm'
        }
      ],
      measure_weights: [
        {
          name: this.$t('gram'),
          key: 'g'
        },
        {
          name: this.$t('kilogram'),
          key: 'kg'
        },
        {
          name: this.$t('tonn'),
          key: 'tonn'
        }
      ],
      cell_generation: {
        length: null,
        width: null,
        depth: null,
        volume_measure: 'm',
        capacity: null,
        capacity_measure: 'kg',
        quantity: 1,
        cell_name: null
      },
      form: reactive({
        department_name: null,
        sections: [
          {
            section_name: null,
            shelves: [
              {
                shelf_name: null,
                cells: []
              }
            ]
          }
        ]
      }),
    }
  },
  props: ['storage', 'department', 'tree'],
  emits: ['afterStore'],
  methods: {
    cloneCellTemplate() {
      // get a non-reactive snapshot of the template
      const raw = toRaw(this.cell_generation);
      // shallow copy is enough (all fields are primitives)
      const c = { ...raw };

      // ensure fresh identity & defaults
      c.cell_id = null;
      c._key = (crypto?.randomUUID?.() ?? (Date.now() + Math.random()).toString(36));

      return c;
    },

    generateCells(sectionIndex, shelfIndex) {
      let error = false;
      Object.keys(this.cell_generation).forEach((key) => {
        if (!this.cell_generation[key] && key !== 'cell_name') {
          if (!error) {
            toast.error(this.$t('fill_all_fields_for_cell_generation'));
            error = true;
          }
        }
      });
      if (error) return;

      const target = this.form.sections[sectionIndex].shelves[shelfIndex].cells;
      for (let i = 1; i <= this.cell_generation.quantity; i++) {
        target.push(this.cloneCellTemplate());     // ⟵ clone per row
      }
    },
    newShelf(sectionIndex, push = true) {
      let shelves = this.form.sections[sectionIndex].shelves;
      let lastShelf = shelves[shelves.length - 1];
      if (!lastShelf.shelf_name?.length) {
        if (push) {
          toast.error(this.$t('need_to_fill_last_section_shelf'));
          return;
        }
        toast.error(this.$t('need_to_fill_last_shelf'));
        return;
      }
      if (!lastShelf.cells?.length) {
        if (push) {
          toast.error(this.$t('need_to_fill_last_section_shelf_one_cell'));
          return;
        }
        toast.error(this.$t('need_to_fill_last_shelf_one_cell'));
        return;
      }
      let error = false;
      Object.keys(lastShelf.cells).map((key) => {
        if (!lastShelf.cells[key]) {
          if (!error) {
            if (push) {
              toast.error(this.$t('need_to_fill_last_section_shelf_cells'));
              error = true;
            } else {
              toast.error(this.$t('need_to_fill_last_shelf_cells'));
              error = true;
            }
          }
        }
      })
      if (!error) {
        if (push) {
          this.pushNewShelf(sectionIndex);
          return;
        }
        return !error;
      }
    },
    pushNewShelf(sectionIndex) {
      this.form.sections[sectionIndex].shelves.push({
        shelf_name: null,
        cells: []
      });
    },
    newSection() {
      if (!this.form.department_name?.length) {
        toast.error(this.$t('need_to_fill_department_name'));
        return;
      }
      let lastSection = this.form.sections[this.form.sections.length - 1];
      if (!lastSection.section_name?.length) {
        toast.error(this.$t('need_to_fill_last_section_name'));
        return;
      }
      let filled = this.newShelf(this.form.sections.length - 1, false);
      if (filled) {
        this.form.sections.push({
          section_name: null,
          shelves: [
            {
              shelf_name: null,
              cells: []
            }
          ]
        })
      }
    },
    store() {
      let error = false;
      this.form.sections.map((section) => {
        if (!error && !section.section_id) {
          if (!section.section_name?.length) {
            toast.error(this.$t('need_to_fill_all_section_names'));
            error = true;
          }
        }
      })
      if (!error) {
        this.form.sections.map((section) => {
          section.shelves.map((shelf) => {
            if (!error && !shelf.shelf_id) {
              if (!shelf.shelf_name?.length) {
                toast.error(this.$t('need_to_fill_all_shelf_names'));
                error = true;
              }
            }
          })
        })
      }
      if (!error) {
        this.form.sections.map((section) => {
          section.shelves.map((shelf) => {
            if(!shelf.cells?.length) {
              toast.error(this.$t('need_to_fill_one_cell'));
              error = true;
              return;
            }
            shelf.cells.map((cell) => {
              if (!error) {
                Object.keys(cell).map((key) => {
                  if (!cell[key]) {
                    if (!error) {
                      if (this.department !== null) {
                        if (!cell.cell_name?.length) {
                          toast.error(this.$t('need_to_fill_all_cell_values'));
                          error = true;
                        }
                      }
                    }
                  }
                })
              }
            })
          })
        })
      }
      if (!error) {
        this.loading = true;
        let url = "storages/" + this.storage.id + "/depth/department"
        let method = 'post';
        if (this.department !== null) {
          method = 'patch';
        }
        api.request({
          method,
          url,
          data: {
            department_id: this.department?.id,
            department_name: this.form.department_name,
            sections: this.form.sections
          }
        }).then((response) => {
          this.loading = false;
          this.$emit('afterStore');
          if(this.department !== null) {
            this.getTree();
          }
        }).catch((response) => {
          this.loading = false;
        })
      }
    },
    updateSection(section) {
      section.loading = true;
      api.patch("storages/"+this.storage.id+"/depth/department/"+this.department.id+"/section", {
        section_name: section.section_name,
        section_id: section.section_id
      }).then((response) => {
        section.loading = false;
        toast.success(this.$t('section_successfully_updated'));
      }).catch((response) => {
        section.loading = false;
      })
    },
    removeSection(section, sectionIndex) {
      if(confirm('are_you_sure')) {
        section.loading = true;
        api.delete("storages/"+this.storage.id+"/depth/department/"+this.department.id+"/section/"+section.section_id).then((response) => {
          this.form.sections.splice(sectionIndex, 1);
          toast.success(this.$t('section_successfully_removed'));
          section.loading = false;
        }).catch((response) => {
          section.loading = false;
        })
      }
    },
    updateShelf(section, shelf) {
      shelf.loading = true;
      api.patch("storages/"+this.storage.id+"/depth/department/"+this.department.id+"/section/"+section.section_id+"/shelf", {
        shelf_name: shelf.shelf_name,
        shelf_id: shelf.shelf_id
      }).then((response) => {
        shelf.loading = false;
        toast.success(this.$t('shelf_successfully_updated'));
      }).catch((response) => {
        shelf.loading = false;
      })
    },
    removeShelf(section, shelf, sectionIndex, shelfIndex) {
      if(confirm('are_you_sure')) {
        shelf.loading = true;
        api.delete("storages/"+this.storage.id+"/depth/department/"+this.department.id+"/section/"+section.section_id+"/shelf/"+shelf.shelf_id).then((response) => {
          this.form.sections[sectionIndex].shelves.splice(shelfIndex, 1);
          toast.success(this.$t('shelf_successfully_removed'));
          shelf.loading = false;
        }).catch((response) => {
          shelf.loading = false;
        })
      }
    },
    updateCell(section, shelf, cell) {
      cell.loading = true;
      api.patch("storages/"+this.storage.id+"/depth/department/"+this.department.id+"/section/"+section.section_id+"/shelf/"+shelf.shelf_id+"/cell", {
        cell_id: cell.cell_id,
        cell_name: cell.cell_name,
        length: cell.length,
        width: cell.width,
        depth: cell.depth,
        volume_measure: cell.volume_measure,
        capacity: cell.capacity,
        capacity_measure: cell.capacity_measure,
      }).then((response) => {
        cell.loading = false;
        toast.success(this.$t('cell_successfully_updated'));
      }).catch((response) => {
        cell.loading = false;
      })
    },
    removeCell(section, shelf, cell, sectionIndex, shelfIndex, cellIndex) {
      if(confirm(this.$t('are_you_sure'))) {
        cell.loading = true;
        api.delete("storages/"+this.storage.id+"/depth/department/"+this.department.id+"/section/"+section.section_id+"/shelf/"+shelf.shelf_id+"/cell/"+cell.cell_id).then((response) => {
          this.form.sections[sectionIndex].shelves[shelfIndex].cells.splice(cellIndex, 1);
          toast.success(this.$t('cell_successfully_removed'));
          cell.loading = false;
        }).catch((response) => {
          cell.loading = false;
        })
      }
    },
    async getTree() {
      await api.get("storages/" + this.$route.params.id + "/departments/"+ this.$route.params.department_id+'/tree').then((response) => {
        this.form = response.data.data
      }).catch((response) => {
      })
    },
  },
  mounted() {
    if (this.department !== null) {
      this.getTree()
    }
  }
}
</script>