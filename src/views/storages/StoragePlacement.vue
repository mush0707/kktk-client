<!-- src/views/storages/StoragePlacement.vue -->
<template>
  <div class="flex flex-col gap-y-2">
    <!-- 🔹 Storage Header + Breadcrumb -->
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
                :to="`/storages/${storage?.id}`"
                class="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-slate-100"
            >
              <span class="underline-offset-2 hover:underline">{{ storage?.address }}</span>
            </router-link>
          </li>
          <li aria-hidden="true" class="px-1">
            <svg class="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
              <path d="M7.05 3.55a1 1 0 0 1 1.4 0l4.5 4.5a1 1 0 0 1 0 1.4լ-4.5 4.5a1 1 0 0 1-1.4-1.4L10.79 10 7.05 6.26a1 1 0 0 1 0-1.41z"/>
            </svg>
          </li>
          <li>
            <p class="inline-flex items-center gap-1 rounded-md px-2 py-1">
              <span class="underline-offset-2 hover:underline">Տեղավորումներ (հաստատում)</span>
            </p>
          </li>
        </ol>
      </nav>
    </div>

    <!-- Ֆիլտրեր -->
    <div class="p-4 flex items-center gap-2">
      <input
          v-model="q"
          placeholder="Փնտրել ապրանք/բջիջ"
          class="border border-gray-300 rounded-xl px-3 py-2"
      />
      <select v-model="status" class="border border-gray-300 rounded-xl px-3 py-2">
        <option value="pending">Սպասման մեջ</option>
        <option value="approved">Հաստատված</option>
        <option value="cancelled">Չեղարկված</option>
        <option value="">Բոլորը</option>
      </select>
    </div>

    <!-- Աղյուսակ -->
    <div class="px-4">
      <div class="bg-white border border-gray-300 overflow-hidden">
        <table class="min-w-full text-sm">
          <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-4 text-left">Ապրանք</th>
            <th class="px-6 py-4">Տեսակ</th>
            <th class="px-6 py-4">Որ բջջից</th>
            <th class="px-6 py-4">Բջիջ</th>
            <th class="px-6 py-4 text-right">Քանակ</th>
            <th class="px-6 py-4">Կարգավիճակ</th>
            <th class="px-6 py-4"></th>
          </tr>
          </thead>
          <tbody>
          <tr
              v-for="p in items"
              :key="p.id"
              class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200"
          >
            <td class="px-6 py-4">
              <div class="font-medium">{{ p.product?.name || p.product_id }}</div>
              <div v-if="formatChars(p).length" class="mt-1 flex flex-wrap gap-1">
                  <span
                      v-for="c in formatChars(p)"
                      :key="c.id || c.name"
                      class="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-700"
                  >
                    {{ c.name }}
                  </span>
              </div>
            </td>

            <td class="px-6 py-4 text-center">
              <span class="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs">
                {{ p.from_cell_id ? 'Տեղափոխություն' : 'Տեղավորում' }}
              </span>
            </td>
            <td class="px-6 py-4 text-center">
              {{ p.from_cell?.name || p.from_cell_name || p.from_cell_id || '—' }}
            </td>
            <td class="px-6 py-4 text-center">{{ p.cell?.name || p.cell_id }}</td>

            <td class="px-6 py-4 text-right">
              {{ fmt(p.qty) }}
              <span v-if="unitShort(p.measure)" class="text-gray-500">{{ unitShort(p.measure) }}</span>
            </td>

            <td class="px-6 py-4 text-center">
              <span v-if="p.status==='pending'" class="px-2 py-0.5 rounded bg-amber-100 text-amber-700 text-xs">Սպասման մեջ</span>
              <span v-else-if="p.status==='approved'" class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-xs">Հաստատված</span>
              <span v-else class="px-2 py-0.5 rounded bg-rose-100 text-rose-700 text-xs">Չեղարկված</span>
            </td>

            <td class="px-6 py-4">
              <div class="flex gap-2" v-if="p.status==='pending'">
                <button
                    class="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded-md shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                    @click="approve(p)"
                >
                  Հաստատել
                </button>
                <button
                    class="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded-md shadow hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                    @click="cancel(p)"
                >
                  Չեղարկել
                </button>
              </div>
            </td>
          </tr>

          <tr v-if="!loading && items.length===0">
            <td colspan="7" class="px-4 py-8 text-center text-gray-500">Տվյալներ չկան</td>
          </tr>
          </tbody>
        </table>
      </div>

      <!-- infinite scroll sentinel -->
      <div ref="sentinel" class="h-12 flex items-center justify-center">
        <span v-if="loading && items.length>0" class="text-sm text-gray-500">Լցվում է…</span>
        <span v-else-if="endReached && items.length>0" class="text-xs text-gray-400">Վերջ</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { mainApi, wmsApi } from '@/api.js'
import { useToast } from 'vue-toastification'
const toast = useToast()

const route = useRoute()
const storage = ref(null)

const items = ref([])
const loading = ref(false)

// server-side search + status filters
const q = ref('')
const status = ref('pending')

// pagination state
const limit = ref(50)
const offset = ref(0)
const endReached = ref(false)

// infinite scroll
const sentinel = ref(null)
let observer = null

// formatters
const fmt = (n)=> Number(n||0) ? Number(n).toLocaleString(undefined,{maximumFractionDigits:6}) : '—'
const unitShort = (m) =>
    ({kg:'կգ', g:'գ', tonn:'տ', t:'տ', l:'լ', ml:'մլ', m3:'մ³', m:'մ', cm:'սմ', mm:'մմ', piece:'հատ', pcs:'հատ'}[String(m||'').toLowerCase()] || '')

// characteristic chip helper (array or JSON string safe)
const formatChars = (row) => {
  const prod = row?.product
  if (!prod) return []
  const ch = prod.characteristics ?? prod.characteristic_ids
  let ids = []
  if (Array.isArray(ch)) ids = ch
  else if (typeof ch === 'string') { try { ids = JSON.parse(ch || '[]') } catch { ids = [] } }
  // if backend already maps to [{id,name}] return that
  if (Array.isArray(prod.characteristics) && prod.characteristics.length && typeof prod.characteristics[0] === 'object') {
    return prod.characteristics
  }
  return []
}

// load storage header once
const loadStorage = async () => {
  const id = Number(route.params.id)
  storage.value = await mainApi.getStorageById(id)
}

// fetch one page
const fetchPage = async () => {
  if (loading.value || endReached.value) return
  loading.value = true
  try {
    const id = Number(route.params.id)
    const page = await wmsApi.getPlacements(id, {
      status: status.value || undefined,
      search: q.value || undefined,
      limit: limit.value,
      offset: offset.value,
    })
    const list = Array.isArray(page) ? page : (page?.data ?? page?.rows ?? [])
    items.value.push(...list)
    offset.value += list.length
    if (list.length < limit.value) endReached.value = true
  } finally {
    loading.value = false
  }
}

// reset + first page
const reloadFromStart = async () => {
  endReached.value = false
  items.value = []
  offset.value = 0
  await fetchPage()
}

// approve / cancel keep pagination simple → reload from start
const approve = async (row) => {
  await wmsApi.approvePlacement(storage.value.id, row.id)
  toast.success('Հաստատվեց')
  await reloadFromStart()
}
const cancel  = async (row) => {
  await wmsApi.cancelPlacement(storage.value.id, row.id)
  toast.info('Չեղարկվեց')
  await reloadFromStart()
}

// observer
const startObserver = () => {
  if (!sentinel.value) return
  observer = new IntersectionObserver((entries) => {
    const [entry] = entries
    if (entry.isIntersecting) fetchPage()
  })
  observer.observe(sentinel.value)
}

onMounted(async () => {
  await loadStorage()
  await reloadFromStart()
  startObserver()
})

onBeforeUnmount(() => {
  if (observer && sentinel.value) observer.unobserve(sentinel.value)
  observer = null
})

// reactive reloads
watch(() => route.params.id, async () => {
  await loadStorage()
  await reloadFromStart()
})
watch(status, () => reloadFromStart())
watch(q, () => {
  // debounce is optional; for now reload immediately
  reloadFromStart()
})
</script>
