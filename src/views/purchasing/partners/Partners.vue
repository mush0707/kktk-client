<template>
  <div class="flex flex-col">
    <div class="dark:border-gray-700 bg-white">
      <div class="flex gap-x-2 items-center p-4 border-b rounded-md border-gray-200 text-xl">
        <p>{{ $t('partners') }}</p>
        <p class="text-sm">({{ $t('purchasing_department') }})</p>
      </div>
    </div>

    <nav class="flex bg-blue-50 py-2 items-center text-sm" aria-label="Breadcrumb">
      <ol class="inline-flex items-center">
        <li>
          <router-link :to="'/purchasing'" class="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-slate-100">
            <span class="underline-offset-2 hover:underline">{{ $t('purchasing_department') }}</span>
          </router-link>
        </li>
        <li aria-hidden="true" class="px-1">
          <svg class="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
            <path d="M7.05 3.55a1 1 0 0 1 1.4 0l4.5 4.5a1 1 0 0 1 0 1.4l-4.5 4.5a1 1 0 0 1-1.4-1.4L10.79 10 7.05 6.26a1 1 0 0 1 0-1.41z"/>
          </svg>
        </li>
        <li>
          <p class="inline-flex items-center gap-1 rounded-md px-2 py-1">
            <span class="underline-offset-2 hover:underline">{{ $t('partners') }}</span>
          </p>
        </li>
      </ol>
    </nav>
  </div>

  <div class="p-4 space-y-4">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <input
            v-model="q"
            @input="debouncedSearch"
            class="px-3 py-2 rounded-xl border border-gray-300 w-64"
            :placeholder="$t('search') + '…'"
        />
        <select
            v-model="kind"
            @change="resetAndReload"
            class="px-3 py-2 rounded-xl border border-gray-300"
        >
          <option value="">{{ $t('all_types') }}</option>
          <option v-for="k in kinds" :key="k.value" :value="k.value">{{ k.label }}</option>
        </select>
      </div>

      <div class="flex items-center gap-2">
        <button class="px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700" @click="openCreate">
          {{ $t('new_partner') || 'Նոր գործընկեր' }} +
        </button>
      </div>
    </div>

    <!-- List -->
    <div class="bg-white border border-gray-300 overflow-hidden">
      <table class="min-w-full text-sm">
        <thead class="bg-gray-50">
        <tr class="text-left">
          <th class="px-4 py-3">{{ $t('name') }}</th>
          <th class="px-4 py-3">{{ $t('type') }}</th>
          <th class="px-4 py-3">{{ $t('manager') }}</th>
          <th class="px-4 py-3">{{ $t('contracts') }}</th>
          <th class="px-4 py-3 w-0"></th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="row in rows" :key="row.id" class="border-t">
          <td class="px-4 py-3">{{ row.name }}</td>
          <td class="px-4 py-3">
            <span class="px-2 py-0.5 rounded text-xs bg-gray-100">{{ row.category?.name ?? '-' }}</span>
          </td>

          <!-- Manager dropdown -->
          <td class="px-4 py-3">
            <div class="flex items-center gap-2">
              <select
                  class="px-2 py-1 rounded-md border border-gray-300 min-w-48"
                  v-model="selectedManager[row.id]"
                  :disabled="assigning[row.id] || staffLoading"
                  @change="assign(row)"
              >
                <option :value="''">— {{ $t('select_from_list') || 'Ընտրել ցուցակից' }}</option>
                <option v-for="u in staffOptions" :key="u.id" :value="u.id">
                  {{ u.name }} (#{{ u.id }})
                </option>
              </select>
            </div>
          </td>

          <td class="px-4 py-3">{{ row.active_agreements_count ?? 0 }}</td>

          <td class="px-4 py-3">
            <div class="flex items-center gap-2">
              <button
                  class="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-md shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  @click="openEdit(row)"
              >
                Դիտել / Փոփոխել
              </button>
            </div>
          </td>
        </tr>

        <tr v-if="!loading && rows.length === 0">
          <td colspan="5" class="p-6 text-center text-gray-500">{{ $t('empty') }}</td>
        </tr>
        </tbody>
      </table>

      <!-- infinite scroll sentinel -->
      <div ref="sentinel" class="h-8"></div>

      <!-- Footer loader -->
      <div class="p-3 border-t text-center text-sm text-gray-500" v-if="loading">
        {{ $t('loading') }}…
      </div>
    </div>

    <!-- Contracts drawer -->
    <PartnerContracts
        v-if="drawer.open"
        :supplier="drawer.row"
        :open="drawer.open"
        @close="drawer.open = false"
        @saved="resetAndReload"
    />

    <!-- Create/Edit modal -->
    <PartnerFormModal
        v-if="formModal.open"
        :open="formModal.open"
        :row="formModal.row"
        :id="formModal.id"
    @close="formModal.open = false"
    @saved="onSavedPartner"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, watch } from 'vue'
import { purchasingPartnerApi, purchasingApi } from '@/api.js'
import PartnerContracts from './components/PartnerContracts.vue'
import PartnerFormModal from './components/PartnerFormModal.vue'

/** Search & filters */
const q = ref('')
const kind = ref('')

/** Pagination for infinite scroll */
const LIMIT = 20
const offset = ref(0)
const total = ref(0)

/** Data & state */
const rows = ref([])
const loading = ref(false)
const eof = ref(false)

/** Staff dropdown data */
const staffOptions = ref([])
const staffLoading = ref(false)
const selectedManager = reactive({})   // { [partnerId]: userId }
const assigning = reactive({})         // { [partnerId]: boolean }

/** Drawers / Modals */
const drawer = ref({ open: false, row: null })
const formModal = ref({ open: false, row: null, id: null })

/** Kinds dict (filter) */
const kinds = [
  { value: 'legal-entity',       label: 'Իրավաբանական անձ' },
  { value: 'legal-group',        label: 'Իրավաբանական խմբավորում' },
  { value: 'sole_entrepreneur',  label: 'Անհատ ձեռնարկատեր' },
  { value: 'individual',         label: 'Ֆիզ. անձ' },
  { value: 'nonresident_legal',  label: 'Ոչ ռեզ. իրավաբանական' },
  { value: 'nonresident_branch', label: 'Ոչ ռեզ. մասնաճյուղ' }
]

function openContracts(row){ drawer.value = { open: true, row } }
function openCreate(){ formModal.value = { open: true, row: null, id: null } }
/** VIEW/EDIT button => բացում ենք modal-ը միայն id-ով.
 * Modal-ը ինքն է կանչում purchasingPartnerApi.get(id) ու լցնում ձևը:
 */
function openEdit(row){ formModal.value = { open: true, row: null, id: row.id } }

/** Load staff (manager list) */
async function loadStaff() {
  staffLoading.value = true
  try {
    const { data } = await purchasingApi.staffList({ limit: 200 })
    staffOptions.value = data?.data ?? data ?? []
  } finally { staffLoading.value = false }
}

/** Fetch page */
async function fetchNext() {
  if (loading.value || eof.value) return
  loading.value = true
  try {
    const { data } = await purchasingPartnerApi.list({
      search: q.value || undefined,
      category_slug: kind.value || undefined, // եթե backend-ը սպասում է "kind", փոխիր այստեղ
      limit: LIMIT,
      offset: offset.value
    })
    const batch = data
    total.value = data.total ?? total.value ?? 0

    for (const r of batch) {
      if (selectedManager[r.id] === undefined) selectedManager[r.id] = r?.manager?.id ?? ''
    }
    rows.value.push(...batch)

    if (batch.length < LIMIT) eof.value = true
    else offset.value = data.next_offset ?? offset.value + LIMIT
  } finally { loading.value = false }
}

/** Assign manager on dropdown change */
async function assign(row) {
  const userId = selectedManager[row.id]
  if (!userId) return
  assigning[row.id] = true
  try {
    await purchasingPartnerApi.assignManager(row.id, userId) // եթե սպասում է { user_id }, փոխիր ըստ api.js
    const u = staffOptions.value.find(s => String(s.id) === String(userId))
    if (u) row.manager = { id: u.id, name: u.name, avatar: u.avatar }
  } finally { assigning[row.id] = false }
}

/** Reset & reload */
async function resetAndReload() {
  rows.value = []
  offset.value = 0
  eof.value = false
  await fetchNext()
}

/** After save in modal */
async function onSavedPartner() {
  formModal.value.open = false
  await resetAndReload()
}

/** Debounced search */
let t
function debouncedSearch(){ clearTimeout(t); t = setTimeout(() => resetAndReload(), 300) }
watch(kind, () => { resetAndReload() })

/** Infinite scroll */
const sentinel = ref(null)
let io
onMounted(async () => {
  await loadStaff()
  io = new IntersectionObserver(
      entries => { if (entries.some(e => e.isIntersecting)) fetchNext() },
      { root: null, rootMargin: '0px 0px 200px 0px', threshold: 0 }
  )
  if (sentinel.value) io.observe(sentinel.value)
  resetAndReload()
})
onBeforeUnmount(() => { if (io && sentinel.value) io.unobserve(sentinel.value) })
</script>
