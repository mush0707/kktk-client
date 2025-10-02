<template>
  <div class="flex flex-col gap-y-2">
    <!-- Վերնամաս՝ պահեստի ինֆո + breadcrumb -->
    <div class="flex flex-col">
      <div class="dark:border-gray-700 bg-white">
        <div class="flex gap-x-2 items-center p-4 border-b rounded-md border-gray-200 text-xl">
          <p>{{ storage?.address }}</p>
          <p class="text-sm">
            ({{ !storage?.cell ? (storage?.industrial ? $t('industrial') : $t('normal')) : $t('cell') }})
          </p>
        </div>
      </div>

      <nav class="flex bg-blue-50 py-2 items-center text-sm" aria-label="Breadcrumb">
        <ol class="inline-flex items-center">
          <li>
            <router-link
                to="/storages"
                class="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-slate-100"
            >
              <span class="underline-offset-2 hover:underline">{{ $t('storages') }}</span>
            </router-link>
          </li>
          <li aria-hidden="true" class="px-1">
            <svg class="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
              <path d="M7.05 3.55a1 1 0 0 1 1.4 0l4.5 4.5a1 1 0 0 1 0 1.4l-4.5 4.5a1 1 0 0 1-1.4-1.4L10.79 10 7.05 6.26a1 1 0 0 1 0-1.41z"/>
            </svg>
          </li>
          <li>
            <router-link
                :to="'/storages/'+storage?.id"
                class="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-slate-100"
            >
              <span class="underline-offset-2 hover:underline">{{ storage?.address }}</span>
            </router-link>
          </li>
          <li aria-hidden="true" class="px-1">
            <svg class="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
              <path d="M7.05 3.55a1 1 0 0 1 1.4 0l4.5 4.5a1 1 0 0 1 0 1.4l-4.5 4.5a1 1 0 0 1-1.4-1.4L10.79 10 7.05 6.26a1 1 0 0 1 0-1.41z"/>
            </svg>
          </li>
          <li>
            <p class="inline-flex items-center gap-1 rounded-md px-2 py-1">
              <span class="underline-offset-2 hover:underline">Ժամանակավոր պահեստ</span>
            </p>
          </li>
        </ol>
      </nav>
    </div>

    <!-- Փնտրում + Ֆիլտր -->
    <div class="p-4">
      <div class="flex items-center gap-3 flex-wrap">
        <input
            v-model="q"
            placeholder="Փնտրել ապրանք"
            class="border border-gray-300 rounded-xl px-3 py-2"
        />

        <select
            v-model="filter.status"
            class="border border-gray-300 rounded-xl px-3 py-2"
            @change="reloadFromStart"
        >
          <option value="">Բոլորը</option>
          <option value="active">Ակտիվ</option>
          <option value="for_produce">Արտադրության համար</option>
          <option value="pending">Սպասման մեջ</option>
          <option value="send_to_production">Ուղարկված է արտադրություն</option>
          <option value="cancelled">Չեղարկված</option>
        </select>

        <span v-if="loading && items.length === 0" class="text-sm text-gray-500">Բեռնվում է…</span>
      </div>
    </div>

    <!-- Ցանկ -->
    <div class="px-4">
      <div class="bg-white border border-gray-300 overflow-hidden">
        <table class="min-w-full text-sm">
          <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-4 text-left">Կարգավիճակ</th>
            <th class="px-6 py-4 text-left">Ապրանք</th>
            <th class="px-6 py-4 text-right">Քանակ</th>
            <th class="px-6 py-4 text-right">Պահ.` Տեղավորում</th>
<!--            <th class="px-6 py-4 text-right">Պահ.` Առաքում</th>-->
<!--            <th class="px-6 py-4">Բաչ/Սերիա</th>-->
            <th class="px-6 py-4">Գործողություններ</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="sp in items" :key="sp.id" class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200">
            <td class="px-6 py-4">
                <span
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs"
                    :class="badgeClass(sp.status)"
                >
                  {{ $t(sp.status) || sp.status }}
                </span>
            </td>
            <td class="px-6 py-4 text-right">
              <div class="flex flex-col">
                <div class="flex flex-wrap items-center gap-1">
                  <span class="font-medium">{{ sp.product?.name || sp.product_id }}</span>
                  <!-- type badge -->
                  <span v-if="sp.product?.type?.name" class="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {{ sp.product.type.name }}
                  </span>
                </div>
                <div v-if="(sp.product?.characteristics || []).length" class="mt-1 flex flex-wrap gap-1">
                  <span v-for="c in sp.product.characteristics" :key="c.id"
                        class="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                    {{ c.name }}
                  </span>
                </div>
              </div>
            </td>
            <td class="px-6 py-4 text-right">{{ formatQty(sp.qty_available) }} {{ $t(sp.measure ?? 'piece') }}</td>
            <td class="px-6 py-4 text-right">{{ formatQty(sp.qty_reserved_place) }} {{ $t(sp.measure ?? 'piece') }}</td>
<!--            <td class="px-6 py-4 text-right">{{ formatQty(sp.qty_reserved_dispatch) }} {{ $t(sp.measure ?? 'piece') }}</td>-->
<!--            <td class="px-6 py-4 text-gray-500">-->
<!--              {{ sp.batch_no || '-' }} / {{ sp.serial_no || '-' }}-->
<!--            </td>-->
            <td class="px-6 py-4">
              <!-- ACTIVE վիճակ -->
              <div class="flex justify-center gap-2">
                <button v-if="sp.status === 'active'"
                    class="px-3 py-1 text-xs font-medium text-white bg-amber-600 rounded-md shadow hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    @click="openPlace(sp)"
                >
                  Տեղավորել → բջիջ
                </button>
                <button v-if="sp.status === 'for_produce'"
                    class="px-3 py-1 text-xs font-medium text-white bg-indigo-600 rounded-md shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    :disabled="consumingId === sp.id"
                    @click="quickConsume(sp)"
                >
                  {{ consumingId === sp.id ? 'Կատարվում է…' : 'Սպառել → արտադրություն' }}
                </button>
              </div>

              <!-- PENDING վիճակ -->
              <div v-if="sp.status === 'pending' && storage.industrial" class="flex justify-center">
                <button
                    class="px-3 py-1 text-xs font-medium text-white bg-emerald-600 rounded-md shadow hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    :disabled="activatingId === sp.id"
                    @click="activateRow(sp)"
                >
                  {{ activatingId === sp.id ? 'Ակտիվացվում է…' : 'Ակտիվացնել' }}
                </button>
              </div>

              <!-- Մնացած վիճակներում գործողություն չենք տալիս -->
            </td>
          </tr>

          <!-- դատարկ վիճակ -->
          <tr v-if="!loading && items.length === 0">
            <td colspan="7" class="px-4 py-8 text-center text-gray-500">Տվյալներ չկան</td>
          </tr>
          </tbody>
        </table>
      </div>

      <!-- լոադեր / սենթինել -->
      <div ref="sentinel" class="h-12 flex items-center justify-center">
        <span v-if="loading && items.length > 0" class="text-sm text-gray-500">Լցվում է…</span>
        <span v-else-if="endReached && items.length > 0" class="text-xs text-gray-400">Վերջ</span>
      </div>
    </div>

    <!-- Մոդալներ -->
    <AllocateToCellModal
        v-if="showPlace"
        :storage-product="selected"
        @close="showPlace = false"
        @created="reloadFromStart"
    />
    <AllocateToDispatchModal
        v-if="showDispatch"
        :storage-product="selected"
        @close="showDispatch = false"
        @created="reloadFromStart"
    />
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { mainApi, wmsApi } from '@/api.js' // քո միասնական service/instance
import AllocateToCellModal from '@/views/storages/modals/AllocatedToCellModal.vue'
import AllocateToDispatchModal from '@/views/storages/modals/AllocatedToDispatchModal.vue'
import { useToast } from 'vue-toastification'
import { formatQty } from '@/utils/numberFormat'

const toast = useToast()
const route = useRoute()

// պահեստ
const storage = ref(null)

// ցուցակ և վիճակ
const items = ref([])
const loading = ref(false)
const endReached = ref(false)
const normChars = (obj) => {
  const raw = obj?.characteristics
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string') { try { return JSON.parse(raw || '[]') } catch { return [] } }
  return []
}
// ֆիլտր
const filter = ref({
  storage_id: undefined,
  limit: 50,
  offset: 0,
  search: '',
  status: '' // ← Նոր ֆիլտր՝ '' | active | pending | send_to_production | cancelled
})

// որոնում՝ debounce
const q = ref('')
let debounceTimer
watch(q, (val) => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    filter.value.search = val || ''
    reloadFromStart()
  }, 300)
})

// badge class helper
const badgeClass = (status) => {
  switch (status) {
    case 'active': return 'bg-emerald-100 text-emerald-700'
    case 'pending': return 'bg-amber-100 text-amber-700'
    case 'send_to_production': return 'bg-indigo-100 text-indigo-700'
    case 'cancelled': return 'bg-rose-100 text-rose-700'
    default: return 'bg-slate-100 text-slate-700'
  }
}

// Գործողություններ
const showPlace = ref(false)
const showDispatch = ref(false)
const selected = ref(null)
const consumingId = ref(null)
const activatingId = ref(null)

const openPlace = (sp) => { selected.value = sp; showPlace.value = true }
const openDispatch = (sp) => { selected.value = sp; showDispatch.value = true }

const quickConsume = async (sp) => {
  try {
    consumingId.value = sp.id
    await wmsApi.quickConsume(sp.id) // backend-ը անում է ամբողջ consume+mark send_to_production
    toast.success('Սպառումը գրանցվեց')
    await reloadFromStart()
  } finally {
    consumingId.value = null
  }
}

const activateRow = async (sp) => {
  try {
    activatingId.value = sp.id
    await wmsApi.activateEntry(sp.id) // Նոր էնդփոինթ՝ pending → active
    sp.status = 'active';
    toast.success('Տողը ակտիվացվեց')
    await reloadFromStart()
  } finally {
    activatingId.value = null
  }
}

// մեկ «էջ» բերում (limit/offset)
const fetchPage = async () => {
  if (loading.value || endReached.value) return
  loading.value = true
  try {
    const page = await wmsApi.getStaging({
      storage_id: filter.value.storage_id,
      limit: filter.value.limit,
      offset: filter.value.offset,
      search: filter.value.search,
      status: filter.value.status || undefined
    })
    const list = Array.isArray(page) ? page : (page?.data ?? [])
    items.value.push(...list)
    filter.value.offset += list.length
    if (list.length < filter.value.limit) endReached.value = true
  } finally {
    loading.value = false
  }
}

// reload սկզբից
const reloadFromStart = async () => {
  endReached.value = false
  items.value = []
  filter.value.offset = 0
  await fetchPage()
}

// route-ից storage_id + պահեստի տվյալներ
const loadByRoute = async () => {
  const storageId = Number(route.params.id)
  filter.value.storage_id = Number.isFinite(storageId) ? storageId : undefined

  if (filter.value.storage_id) {
    storage.value = await mainApi.getStorageById(filter.value.storage_id)
  } else {
    storage.value = null
  }
  await reloadFromStart()
}

// Infinite scroll — IntersectionObserver
const sentinel = ref(null)
let observer = null
const startObserver = () => {
  if (!sentinel.value) return
  observer = new IntersectionObserver((entries) => {
    const [entry] = entries
    if (entry.isIntersecting) fetchPage()
  })
  observer.observe(sentinel.value)
}

onMounted(async () => {
  await loadByRoute()
  startObserver()
})
watch(() => route.params.id, loadByRoute)

onBeforeUnmount(() => {
  if (observer && sentinel.value) observer.unobserve(sentinel.value)
  observer = null
})
</script>
