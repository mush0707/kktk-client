<!-- src/views/mfg/MoList.vue -->
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
              <span class="underline-offset-2 hover:underline">Արտադրամաս</span>
            </p>
          </li>
        </ol>
      </nav>
    </div>

    <!--Փնտրում + Ֆիլտր-->
    <div class="p-4">
      <div class="flex items-center gap-3 flex-wrap">
        <input
            v-model="q"
            placeholder="Փնտրել սեսիայի համար (№)"
            class="border border-gray-300 rounded-xl px-3 py-2"
        />

        <select
            v-model="status"
            class="border border-gray-300 rounded-xl px-3 py-2"
            @change="reloadFromStart"
        >
          <option value="open">Բաց</option>
          <option value="">Բոլորը</option>
          <option value="released">Թողարկված</option>
          <option value="in_progress">Ընթացքի մեջ</option>
          <option value="completed">Ավարտված</option>
          <option value="cancelled">Չեղարկված</option>
          <option value="draft">Սևագիր</option>
        </select>

        <span v-if="loading && rows.length === 0" class="text-sm text-gray-500">Բեռնվում է…</span>
      </div>
    </div>

    <!-- Ցանկ -->
    <div class="px-4">
      <div class="bg-white border border-gray-300 overflow-hidden rounded-xl">
        <table class="min-w-full text-sm">
          <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-4 text-left">Սեսիա №</th>
            <th class="px-6 py-4 text-left">Կարգավիճակ</th>
<!--            <th class="px-6 py-4 text-left">Ելքերի գումար</th>-->
            <th class="px-6 py-4 text-left">Ստեղծված</th>
            <th class="px-6 py-4"></th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="mo in rows" :key="mo.id" class="border-t">
            <td class="px-6 py-4 font-mono">{{ mo.number }}</td>
            <td class="px-6 py-4">
              <span class="text-xs px-2 py-1 rounded" :class="badgeClass(mo.status)">{{ $t(mo.status) }}</span>
            </td>
<!--            <td class="px-6 py-4">{{ mo.qty_output_total ?? 0 }}</td>-->
            <td class="px-6 py-4 text-gray-500">
              <span :title="mo.created_at">
                {{ formatDateTime(mo.created_at) }}
              </span>
              <span class="text-xs text-gray-400 ml-2">({{ fromNow(mo.created_at) }})</span>
            </td>
            <td class="px-6 py-4">
              <router-link
                  :to="`/storages/${storage?.id}/manufacturing/${mo.id}`"
                  class="px-3 py-1 text-xs font-medium text-white bg-emerald-600 rounded-md shadow hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >Բացել</router-link>
            </td>
          </tr>

          <tr v-if="!loading && rows.length === 0">
            <td colspan="5" class="px-6 py-10 text-center text-gray-500">Տվյալներ չկան</td>
          </tr>
          </tbody>
        </table>
      </div>

      <!-- Infinite scroll սենթինել -->
      <div ref="sentinel" class="h-12 flex items-center justify-center">
        <span v-if="loading && rows.length > 0" class="text-sm text-gray-500">Լցվում է…</span>
        <span v-else-if="endReached && rows.length > 0" class="text-xs text-gray-400">Վերջ</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { mainApi, mfgApi } from '@/api.js' // քո պահեստի service-ը
import { formatDateTime, fromNow } from '@/utils/dateFormat'
type ID = number

const route = useRoute()

// Պահեստի տվյալներ (header)
const storage = ref<any | null>(null)

// Ցուցակ և վիճակ
const rows = ref<any[]>([])
const loading = ref(false)
const endReached = ref(false)

// Ֆիլտրեր
const q = ref('')
const status = ref<'open' | '' | 'released' | 'in_progress' | 'completed' | 'cancelled' | 'draft'>('open')

const filters = ref({
  output_storage_id: undefined as ID | undefined,
  limit: 50,
  offset: 0,
  number_like: '' as string | undefined,
  status: undefined as any
})

// badge helper
const badgeClass = (s: string) => {
  switch (s) {
    case 'released': return 'bg-blue-100 text-blue-700'
    case 'in_progress': return 'bg-indigo-100 text-indigo-700'
    case 'completed': return 'bg-emerald-100 text-emerald-700'
    case 'cancelled': return 'bg-rose-100 text-rose-700'
    case 'draft': return 'bg-slate-100 text-slate-700'
    default: return 'bg-slate-100 text-slate-700'
  }
}

// UI status → backend param
const mapStatus = (s: string) => {
  if (s === 'open') return ['released', 'in_progress']
  if (!s) return undefined
  return s
}

// Էջային բերում
const fetchPage = async () => {
  if (loading.value || endReached.value) return
  loading.value = true
  try {
    const page = await mfgApi.getMOs({
      order_kind: 'reprocess',
      output_storage_id: filters.value.output_storage_id,
      limit: filters.value.limit,
      offset: filters.value.offset,
      number_like: filters.value.number_like,
      status: mapStatus(status.value),
    })
    const list = Array.isArray(page) ? page : (page?.data ?? [])
    rows.value.push(...list)
    filters.value.offset += list.length
    if (list.length < filters.value.limit) endReached.value = true
  } finally {
    loading.value = false
  }
}

// Սկսել սկզբից
const reloadFromStart = async () => {
  rows.value = []
  endReached.value = false
  filters.value.offset = 0
  filters.value.number_like = q.value || undefined
  await fetchPage()
}

// Պահեստ բեռնել router-ից
const loadByRoute = async () => {
  const storageId = Number(route.params.id)
  filters.value.output_storage_id = Number.isFinite(storageId) ? storageId : undefined

  if (filters.value.output_storage_id) {
    // քո արդեն գոյություն ունեցող service-ը
    storage.value = await mainApi.getStorageById(filters.value.output_storage_id)
  } else {
    storage.value = null
  }

  await reloadFromStart()
}

// Որոնում՝ debounce
let t: any
watch(q, (val) => {
  clearTimeout(t)
  t = setTimeout(() => {
    filters.value.number_like = val || undefined
    reloadFromStart()
  }, 300)
})

// Կարգավիճակ՝ reload
watch(status, reloadFromStart)

// Infinite scroll
const sentinel = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null
const startObserver = () => {
  if (!sentinel.value) return
  observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) fetchPage()
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
