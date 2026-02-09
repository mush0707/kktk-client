<template>
  <div class="flex flex-col">
    <!-- Header -->
    <div class="dark:border-gray-700 bg-white">
      <div class="flex items-center justify-between p-4 border-b rounded-md border-gray-200">
        <div class="flex items-center gap-2">
          <p class="text-xl font-semibold">{{ $t('staffing_plan') || 'Թեկնածուներ' }}</p>
          <p class="text-sm text-slate-500">({{ $t('hr') || 'Կադրեր' }})</p>
        </div>

      </div>
    </div>

    <!-- Breadcrumb -->
    <nav class="flex bg-blue-50 py-2 items-center text-sm" aria-label="Breadcrumb">
      <ol class="inline-flex items-center">
        <li>
          <router-link
              :to="'/hr'"
              class="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-slate-100"
          >
            <span class="underline-offset-2 hover:underline">{{ $t('hr') || 'Կադրեր' }}</span>
          </router-link>
        </li>
        <li aria-hidden="true" class="px-1">
          <svg class="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
            <path d="M7.05 3.55a1 1 0 0 1 1.4 0l4.5 4.5a1 1 0 0 1 0 1.4l-4.5 4.5a1 1 0 0 1-1.4-1.4L10.79 10 7.05 6.26a1 1 0 0 1 0-1.41z"/>
          </svg>
        </li>
        <li>
          <p class="inline-flex items-center gap-1 rounded-md px-2 py-1">
            <span class="underline-offset-2 hover:underline">{{ $t('staffing_plan') || 'Թեկնածուներ' }}</span>
          </p>
        </li>
      </ol>
    </nav>
  </div>
  <div class="flex flex-col gap-4 px-4 py-4">
    <!-- Page header -->
    <div class="bg-white border border-gray-300 rounded-2xl overflow-hidden">
      <div class="p-4 flex items-center justify-between border-b">
        <div class="text-lg font-semibold">{{ $t('staffing_plan') || 'Հաստիքագրում' }}</div>
        <div class="flex items-center gap-2">
          <input
              v-model="q"
              @input="debouncedSearch"
              :placeholder="$t('search') + '…'"
              class="border border-gray-300 rounded-xl px-3 py-2 w-[220px] md:w-[280px]"
          />
        </div>
      </div>

      <!-- Departments summary table -->
      <div class="p-4">
        <div class="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 text-left">
            <tr>
              <th class="px-4 py-2">{{ $t('department') || 'Բաժին' }}</th>
              <th class="px-4 py-2 w-24">{{ $t('roles') || 'Պաշտոններ' }}</th>
              <th class="px-4 py-2 w-28 hidden md:table-cell">{{ $t('needed') || 'Պակասում է' }}</th>
              <th class="px-4 py-2 hidden md:table-cell">{{ $t('status') || 'Կարգավիճակ' }}</th>
            </tr>
            </thead>
            <tbody>
            <template v-for="(group, depId) in groupedList" :key="depId">
              <!-- Clickable department row -->
              <tr
                  class="border-t cursor-pointer select-none hover:bg-gray-50"
                  role="button"
                  tabindex="0"
                  :aria-expanded="!!expanded[depId]"
                  @click="toggleDepartment(depId)"
                  @keydown.enter.prevent="toggleDepartment(depId)"
                  @keydown.space.prevent="toggleDepartment(depId)"
              >
                <td class="px-4 py-2">
                  <div class="flex items-center gap-2">
                    <span class="font-medium line-clamp-1">{{ group.department?.name || '—' }}</span>
                    <span class="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {{ group.rows.length }}
                      </span>
                  </div>
                  <div v-if="group.department?.slug" class="text-xs text-slate-500 line-clamp-1">
                    {{ group.department.slug }}
                  </div>
                </td>
                <td class="px-4 py-2">{{ group.rows.length }}</td>
                <td class="px-4 py-2 hidden md:table-cell">
                    <span :class="group.totalNeed > 0 ? 'text-amber-700' : 'text-slate-500'">
                      {{ group.totalNeed }}
                    </span>
                </td>
                <td class="px-4 py-2 hidden md:table-cell">
                    <span class="text-xs px-2 py-0.5 rounded"
                          :class="group.totalNeed > 0 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'">
                      {{ group.totalNeed > 0 ? ($t('needs_staff') || 'Պահանջվում է համալրում') : ($t('fully_staffed') || 'Լիովին համալրված') }}
                    </span>
                </td>
              </tr>

              <!-- Nested roles (mobile: cards, desktop: table) -->
              <tr v-if="expanded[depId]">
                <td :colspan="4" class="px-0 md:px-4 pt-2 pb-4 bg-slate-50">
                  <!-- Desktop table (≥md) -->
                  <div class="hidden md:block overflow-x-auto rounded-xl border border-gray-200 bg-white mx-4">
                    <table class="w-full text-sm">
                      <thead class="bg-gray-50 text-left">
                      <tr>
                        <th class="px-3 py-2 w-16">#</th>
                        <th class="px-3 py-2">{{ $t('role') || 'Պաշտոն' }}</th>
                        <th class="px-3 py-2">{{ $t('plan') || 'Պլան' }}</th>
                        <th class="px-3 py-2 w-24">{{ $t('filled') || 'Լցված' }}</th>
                        <th class="px-3 py-2 w-28">{{ $t('needed') || 'Պակասում է' }}</th>
                        <th class="px-3 py-2">{{ $t('vacancy') || 'Թափուր' }}</th>
                        <th class="px-3 py-2 w-0"></th>
                      </tr>
                      </thead>
                      <tbody>
                      <template v-for="row in group.rows" :key="row.id">
                        <tr class="border-t align-top">
                          <td class="px-3 py-2 font-mono">#{{ row.id }}</td>
                          <td class="px-3 py-2">
                            <div class="font-medium">{{ row.role?.name || '—' }}</div>
                            <div class="text-xs text-slate-500">{{ group.department?.slug }}</div>
                            <div class="flex flex-wrap gap-1 mt-1">
                              <template v-for="(st, i) in getRowStages(row).slice(0, 4)" :key="st.__key || `${row.id}-${i}`">
                                <span class="px-2 py-0.5 rounded-full border bg-white text-xs">{{ st.name }}</span>
                              </template>
                              <span v-if="getRowStages(row).length > 4"
                                    class="px-2 py-0.5 rounded-full bg-slate-100 text-xs text-slate-600">
                                    +{{ getRowStages(row).length - 4 }}
                                  </span>
                              <span v-if="getRowStages(row).length === 0" class="text-xs text-slate-400">
                                    {{ $t('no_stages') || 'Փուլեր չկան' }}
                                  </span>
                            </div>
                          </td>
                          <td class="px-3 py-2">
                            <div class="flex flex-col gap-y-2">
                              <p>{{ need(row) + row.filled_count }}</p>
                              <div class="text-gray-500 text-xs" v-if="row.shift">
                                <p class="">Տվյալ հաստիքը հերթափոխով է</p>
                                <p>Պետք է լրացնել <span class="text-red-500">{{ row.position_count }} անգամ {{ row.shift_hours + ' X ' + row.shift_periodicity }}</span> պարբերականությամբ հերթափոխը</p>
                              </div>
                            </div>
                          </td>
                          <td class="px-3 py-2">{{ row.filled_count ?? 0 }}</td>
                          <td class="px-3 py-2">
                            <span :class="need(row) > 0 ? 'text-amber-700' : 'text-slate-500'">{{ need(row) }}</span>
                          </td>
                          <td class="px-3 py-2">
                            <div class="flex items-center gap-2">
                                  <span class="px-2 py-0.5 rounded text-xs" :class="vacancyChipClass(row)">
                                    {{ vacancyChipLabel(row) }}
                                  </span>
                              <span v-if="row.vacancy?.slots" class="text-xs text-slate-500">
                                    ({{ $t('slots') || 'Սլոթեր' }}: {{ row.vacancy.slots }})
                                  </span>
                            </div>
                          </td>
                          <td class="px-3 py-2">
                            <div class="flex items-center gap-2">
                              <button
                                  v-if="!row.vacancy||row.vacancy.status==='canceled'"
                                  class="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                                  @click.stop="openCreate(row)"
                              >
                                {{ $t('add_vacancy') || 'Ավելացնել թափուր' }}
                              </button>
                              <button

                                  class="cursor-pointer px-3 py-1 whitespace-nowrap text-xs font-medium border bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                  @click.stop="toggleStages(row)"
                              >
                                {{ showStages[row.id] ? ($t('hide_stages') || 'Թաքցնել փուլերը') : ($t('show_stages') || 'Ցույց տալ փուլերը') }}
                              </button>
                            </div>
                          </td>
                        </tr>

                        <!-- Stages row (desktop) -->
                        <tr v-if="showStages[row.id]" class="hidden md:table-row">
                          <td :colspan="7" class="px-3 py-3 bg-slate-50 overflow-visible relative z-50">
                            <div class="flex flex-col gap-4 asasa" >
                              <div class="flex flex-wrap gap-2 items-center">
                                <template v-if="stages[row.id]?.items?.length">
                                      <span
                                          v-for="(st, idx) in stages[row.id].items"
                                          :key="st.__key"
                                          class="inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs bg-white border"
                                      >
                                        <span class="font-semibold">{{ idx + 1 }}.</span>
                                        <span>{{ st.name }}</span>
                                        <div class="flex items-center gap-1">
                                          <button class="cursor-pointer px-1 py-0.5 border rounded hover:bg-gray-100 " @click="moveUp(row, idx)" v-if="idx!==0">←</button>
                                          <button class="cursor-pointer px-1 py-0.5 border rounded hover:bg-gray-100" @click="moveDown(row, idx)" v-if="idx!==stages[row.id].items.length-1">→</button>
                                          <button class="cursor-pointer px-1 py-0.5 border rounded hover:bg-red-50 text-red-600" @click="removeStage(row, st)">{{ $t('delete') || 'Ջնջել' }}</button>
                                        </div>
                                      </span>
                                </template>
                                <span v-else class="text-xs text-slate-500">{{ $t('no_stages') || 'Փուլեր չկան' }}</span>
                              </div>

                              <StageSelect
                                  v-model="stages[row.id].selected"
                                  :options="availableFirstPage"
                                  :page-size="200"
                                  :fetch-more="fetchMoreStages"
                                  :saving="stages[row.id].saving"
                                  :placeholder="$t('select_stages') || 'Ընտրեք փուլերը…'"
                                  :save-label="$t('save_stages') || 'Պահպանել փուլերը'"
                                  :clear-label="$t('clear') || 'Մաքրել'"
                                  @save="saveSelectedStages(row, $event)"
                                  @clear="clearSelected(row)"
                                  @search="onStageSearch"
                              />
                            </div>
                          </td>
                        </tr>
                      </template>
                      <tr v-if="!loading && group.rows.length === 0" class="border-t">
                        <td colspan="7" class="p-6 text-center text-gray-500">{{ $t('empty') || 'Դատարկ է' }}</td>
                      </tr>
                      </tbody>
                    </table>
                  </div>

                  <!-- Mobile cards (<md) -->
                  <div class="md:hidden px-3 pt-2 space-y-3">
                    <div v-for="row in group.rows" :key="row.id" class="bg-white rounded-xl border border-gray-200 p-3">
                      <div class="flex items-start justify-between gap-3">
                        <div>
                          <div class="text-sm text-slate-500">#{{ row.id }}</div>
                          <div class="font-medium">{{ row.role?.name || '—' }}</div>
                          <div class="text-xs text-slate-500">{{ group.department?.slug }}</div>
                        </div>
                        <div class="text-right">
                          <div class="text-xs">{{ $t('plan') || 'Պլան' }}: <b>{{ row.position_count ?? '—' }}</b></div>
                          <div class="text-xs">{{ $t('filled') || 'Լցված' }}: <b>{{ row.filled_count ?? 0 }}</b></div>
                          <div class="text-xs">
                            {{ $t('needed') || 'Պակասում է' }}:
                            <b :class="need(row) > 0 ? 'text-amber-700' : 'text-slate-500'">{{ need(row) }}</b>
                          </div>
                        </div>
                      </div>

                      <!-- Stages badges (mobile) -->
                      <div class="flex flex-wrap gap-1 mt-2">
                        <template v-for="(st, i) in getRowStages(row).slice(0, 4)" :key="st.__key || `${row.id}-m-${i}`">
                          <span class="px-2 py-0.5 rounded-full border bg-white text-xs">{{ st.name }}</span>
                        </template>
                        <span v-if="getRowStages(row).length > 4"
                              class="px-2 py-0.5 rounded-full bg-slate-100 text-xs text-slate-600">
                            +{{ getRowStages(row).length - 4 }}
                          </span>
                        <span v-if="getRowStages(row).length === 0" class="text-xs text-slate-400">
                            {{ $t('no_stages') || 'Փուլեր չկան' }}
                          </span>
                      </div>

                      <!-- Vacancy + actions (mobile) -->
                      <div class="flex items-center justify-between mt-3">
                        <div class="flex items-center gap-2">
                            <span class="px-2 py-0.5 rounded text-xs" :class="vacancyChipClass(row)">
                              {{ vacancyChipLabel(row) }}
                            </span>
                          <span v-if="row.vacancy?.slots" class="text-xs text-slate-500">
                              ({{ $t('slots') || 'Սլոթեր' }}: {{ row.vacancy.slots }})
                            </span>
                        </div>
                        <div class="flex items-center gap-2">
                          <button
                              v-if="!row.vacancy"
                              class="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-md"
                              @click.stop="openCreate(row)"
                          >
                            {{ $t('add_vacancy') || 'Թափուր' }}
                          </button>
                          <button
                              class="px-3 py-1 text-xs font-medium border rounded-md"
                              @click.stop="toggleStages(row)"
                          >
                            {{ showStages[row.id] ? ($t('hide_stages') || 'Փակել') : ($t('show_stages') || 'Փուլեր') }}
                          </button>
                        </div>
                      </div>

                      <!-- Stages editor (mobile) -->
                      <div v-if="showStages[row.id]" class="mt-3 border-t pt-3">
                        <div class="flex flex-wrap gap-2 mb-2">
                          <template v-if="stages[row.id]?.items?.length">
                              <span
                                  v-for="(st, idx) in stages[row.id].items"
                                  :key="st.__key"
                                  class="inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs bg-white border"
                              >
                                <span class="font-semibold">{{ idx + 1 }}.</span>
                                <span>{{ st.name }}</span>
                                <div class="flex items-center gap-1">
                                  <button class="px-1 py-0.5 border rounded" @click="moveUp(row, idx)" :disabled="idx===0">↑</button>
                                  <button class="px-1 py-0.5 border rounded" @click="moveDown(row, idx)" :disabled="idx===stages[row.id].items.length-1">↓</button>
                                  <button class="px-1 py-0.5 border rounded text-red-600" @click="removeStage(row, st)">{{ $t('delete') || 'Ջնջել' }}</button>
                                </div>
                              </span>
                          </template>
                          <span v-else class="text-xs text-slate-500">{{ $t('no_stages') || 'Փուլեր չկան' }}</span>
                        </div>

                        <StageSelect
                            v-model="stages[row.id].selected"
                            :options="availableFirstPage"
                            :page-size="200"
                            :fetch-more="fetchMoreStages"
                            :saving="stages[row.id].saving"
                            :placeholder="$t('select_stages') || 'Ընտրեք փուլերը…'"
                            :save-label="$t('save_stages') || 'Պահպանել'"
                            :clear-label="$t('clear') || 'Մաքրել'"
                            @save="saveSelectedStages(row, $event)"
                            @clear="clearSelected(row)"
                            @search="onStageSearch"
                        />
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </template>

            <tr v-if="!loading && groupedList.length === 0">
              <td colspan="4" class="p-6 text-center text-gray-500">{{ $t('empty') || 'Դատարկ է' }}</td>
            </tr>
            </tbody>
          </table>
        </div>

        <div class="p-3 text-center text-sm text-gray-500" v-if="loading || optionsLoading">
          {{ $t('loading') || 'Բեռնվում է' }}…
        </div>
      </div>
    </div>


    <!-- Create Vacancy Modal -->
    <VacancyFormModal

        v-if="modal.open"
        :open="modal.open"
        :row="modal.row"
        :role-position-id="modal.rolePositionId"
        :initial="modal.initial"
        @close="modal.open = false"
        @saved="onSavedVacancy"
    />
  </div>
</template>

<script setup>
import {ref, reactive, computed, onMounted} from 'vue'
import {rolePositionApi, interviewStageApi} from '@/api.js'
import {useI18n} from 'vue-i18n'
import VacancyFormModal from './components/VacancyFormModal.vue'
import StageSelect from './components/StageSelect.vue'
import {useToast} from "vue-toastification";

const {t} = useI18n({useScope: 'global'})

const q = ref('')
const rows = ref([])
const loading = ref(false)

const expanded = reactive({})
const showStages = reactive({})

const modal = ref({open: false, row: null, rolePositionId: null, initial: null})

const availableFirstPage = ref([])
const optionsLoading = ref(false)

const stages = reactive({})
const toast = useToast();

function ensureStageState(rowId) {
  if (!stages[rowId]) stages[rowId] = {saving: false, items: [], selected: []}
}

/* helpers */
function mapRawStagesToItems(raw, row) {
  return (raw || []).map((it, idx) => ({
    id: it.id ?? null,
    role_position_id: row.id,
    name: it.name ?? it.title ?? '',
    order: it.order ?? idx + 1,
    __key: `${it.id ?? 'n'}-${row.id}-${it.order ?? idx + 1}`
  }))
}

function getRowStages(row) {
  if (stages[row.id]?.items?.length) return stages[row.id].items
  const arr = row.interview_stages ?? row.stages ?? []
  return mapRawStagesToItems(arr, row)
}

function need(row) {
  let total = Number(row?.position_count ?? 0)
  if(row.shift) {
    total += row.shift_periodicity / row.shift_hours
  }
  const filled = Number(row?.filled_count ?? 0)
  return Math.max(0, total - filled)
}

function vacancyChipClass(row) {
  if (row?.vacancy) return 'bg-green-100 text-green-700'
  if (need(row) > 0) return 'bg-amber-100 text-amber-700'
  return 'bg-slate-100 text-slate-700'
}

function vacancyChipLabel(row) {
  if (row?.vacancy) return t(row.vacancy.status) || (t('open') || 'Բաց')
  if (need(row) > 0) return t('no_open_vacancy') || 'Բաց աշխատատեղ չկա'
  return t('fully_staffed') || 'Լիովին համալրված'
}

/* group rows by department and precompute totals */
const grouped = computed(() => {
  const lower = (q.value || '').toLowerCase()
  const filtered = rows.value.filter(r => {
    if (!lower) return true
    const text = [r?.role?.name, r?.department?.name, r?.department?.slug, r?.vacancy?.status]
        .filter(Boolean).join(' ').toLowerCase()
    return text.includes(lower)
  })
  const map = {}
  for (const r of filtered) {
    const depId = r.department_id || r.department?.id || 0
    if (!map[depId]) map[depId] = {department: r.department, rows: [], totalNeed: 0}
    map[depId].rows.push(r)
  }
  for (const k of Object.keys(map)) {
    map[k].totalNeed = map[k].rows.reduce((s, r) => s + need(r), 0)
  }
  return map
})
const groupedList = computed(() => Object.entries(grouped.value).map(([id, val]) => ({depId: Number(id), ...val})))

/* expand/collapse */
function toggleDepartment(depId) {
  expanded[depId] = !expanded[depId]
  if (expanded[depId] && !availableFirstPage.value.length) loadFirstPage(200)
}

/* debounce search */
let debounceTimer

function debouncedSearch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => reloadAll(), 300)
}

/* loaders */
async function loadRolePositions() {
  const {data} = await rolePositionApi.list({search: q.value || undefined, limit: 100})
  rows.value = (data?.data ?? data ?? []).map(r => ({...r}))
}

async function loadFirstPage(limit = 200) {
  optionsLoading.value = true
  try {
    const res = await interviewStageApi.list({limit, offset: 0})
    const page = res?.data?.data ?? res?.data ?? res ?? []
    availableFirstPage.value = page.map(x => ({id: x.id ?? null, name: String(x.name ?? x.title ?? '').trim()}))
  } finally {
    optionsLoading.value = false
  }
}

async function fetchMoreStages(offset) {
  const res = await interviewStageApi.list({limit: 200, offset})
  const page = res?.data?.data ?? res?.data ?? res ?? []
  return page.map(x => ({id: x.id ?? null, name: String(x.name ?? x.title ?? '').trim()}))
}

/* wire saved stages into local */
function attachStagesFromRow(row) {
  ensureStageState(row.id)
  const items = getRowStages(row)
  stages[row.id].items = items
  stages[row.id].selected = items.map(({id, name}) => ({id, name}))
}

/* reload */
async function reloadAll() {
  loading.value = true
  try {
    await loadRolePositions()
    for (const r of rows.value) {
      if (showStages[r.id]) attachStagesFromRow(r)
    }
  } finally {
    loading.value = false
  }
}

/* vacancy modal */
function openCreate(row) {
  let rowClone = {...row}
  rowClone.vacancy = null
  modal.value = {open: true, rowClone, rolePositionId: row.id, initial: {slots: Math.max(1, need(row))}}
}

async function onSavedVacancy() {
  modal.value.open = false
  await reloadAll()
}

/* stages controls */
function toggleStages(row) {
  showStages[row.id] = !showStages[row.id]
  if (showStages[row.id]) {
    attachStagesFromRow(row)
    if (!availableFirstPage.value.length) loadFirstPage(200)
  }
}

function onStageSearch(_q) {
}

async function saveSelectedStages(row, normalized) {
  ensureStageState(row.id)
  const s = stages[row.id]
  if (s.saving) return
  s.saving = true
  try {
    await rolePositionApi.updateStages(row.id, {stages: normalized})
    s.items = normalized.map((it, i) => ({
      ...it, role_position_id: row.id, order: i + 1, __key: `${it.id ?? 'n'}-${row.id}-${i + 1}`
    }))
    s.selected = s.items.map(({id, name}) => ({id, name}))
    row.interview_stages = normalized
    row.stages = normalized
    toast.success(t('stages_saved'));

  } finally {
    s.saving = false
  }
}

function clearSelected(row) {
  ensureStageState(row.id)
  stages[row.id].selected = []
}

async function removeStage(row, stage) {
  ensureStageState(row.id)
  const s = stages[row.id]
  if (s.saving) return
  s.saving = true
  try {
    const next = s.items
        .filter(it => it !== stage)
        .map((it, i) => ({id: it.id ?? null, name: it.name ?? '', order: i + 1}))
    await rolePositionApi.updateStages(row.id, {stages: next})
    s.items = next.map((it, i) => ({
      ...it, role_position_id: row.id, order: i + 1, __key: `${it.id ?? 'n'}-${row.id}-${i + 1}`
    }))
    s.selected = s.items.map(({id, name}) => ({id, name}))
    row.interview_stages = next
    row.stages = next
  } finally {
    s.saving = false
  }
}

function moveUp(row, idx) {
  const s = stages[row.id]
  if (!s || idx <= 0) return
  const arr = [...s.items]
  ;[arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]]
  reindexAndSave(row, arr)
}

function moveDown(row, idx) {
  const s = stages[row.id]
  if (!s || idx >= s.items.length - 1) return
  const arr = [...s.items]
  ;[arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]]
  reindexAndSave(row, arr)
}

async function reindexAndSave(row, arr) {
  ensureStageState(row.id)
  const s = stages[row.id]
  s.saving = true
  try {
    const normalized = arr.map((it, i) => ({id: it.id ?? null, name: it.name ?? '', order: i + 1}))
    await rolePositionApi.updateStages(row.id, {stages: normalized})
    s.items = normalized.map((it, i) => ({
      ...it, role_position_id: row.id, order: i + 1, __key: `${it.id ?? 'n'}-${row.id}-${i + 1}`
    }))
    s.selected = s.items.map(({id, name}) => ({id, name}))
    row.interview_stages = normalized
    row.stages = normalized
  } finally {
    s.saving = false
  }
}

onMounted(async () => {
  await reloadAll()
})
</script>

<style scoped>
/* Keep any floating dropdown (StageSelect) above tables */
:deep(.stage-select-dropdown) {
  position: fixed;
  z-index: 60;
}
</style>
