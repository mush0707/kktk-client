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
              <path d="M7.05 3.55a1 1 0 0 1 1.4 0l4.5 4.5a1 1 0 0 1 0 1.4l-4.5 4.5a1 1 0 0 1-1.4-1.4L10.79 10 7.05 6.26a1 1 0 0 1 0-1.41z"/>
            </svg>
          </li>
          <li>
            <p class="inline-flex items-center gap-1 rounded-md px-2 py-1">
              <span class="underline-offset-2 hover:underline">Շարժերի ցանկ</span>
            </p>
          </li>
        </ol>
      </nav>
    </div>

    <!-- Ֆիլտրեր -->
    <div class="p-4 flex flex-wrap items-end gap-2">
      <div class="flex flex-col gap-y-2">
        <label class="text-xs text-gray-500">Տեսակ</label>
        <select v-model="filters.section" class="border border-gray-300 rounded-xl px-3 py-2 w-44" @change="reloadFromStart">
          <option value="inbound">Մուտքեր (ժամանակավոր)</option>
          <option value="transfers">Տեղափոխություններ (բջիջ→բջիջ)</option>
        </select>
      </div>

      <div class="flex flex-col gap-y-2">
        <label class="text-xs text-gray-500">Փնտրել</label>
        <input v-model="q" class="border border-gray-300 rounded-xl px-3 py-2" placeholder="Ապրանք"/>
      </div>

      <div class="flex flex-col gap-y-2">
        <label class="text-xs text-gray-500">Սկիզբ</label>
        <input v-model="filters.date_from" type="datetime-local" class="border border-gray-300 rounded-xl px-3 py-2"/>
      </div>

      <div class="flex flex-col gap-y-2">
        <label class="text-xs text-gray-500">Ավարտ</label>
        <input v-model="filters.date_to" type="datetime-local" class="border border-gray-300 rounded-xl px-3 py-2"/>
      </div>

      <button class="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50" @click="reloadFromStart">Կիրառել</button>
    </div>

    <!-- Ցանկ -->
    <div class="px-4">
      <div class="bg-white border border-gray-300 overflow-hidden rounded-2xl">
        <table class="min-w-full text-sm">
          <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-4 text-left">Ապրանք</th>
            <th v-if="filters.section==='transfers'" class="px-6 py-4">From → To (ID)</th>
            <th class="px-6 py-4 text-right">Քանակ</th>
            <th class="px-6 py-4">Պատճառ</th>
            <th class="px-6 py-4">Ժամանակ</th>
          </tr>
          </thead>

          <tbody>
          <tr v-for="m in filtered" :key="m.id" class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200">
            <td class="px-6 py-4">
              <div class="font-medium">{{ m.product?.name || m.product_id }}</div>
              <div class="mt-1 text-[11px] text-gray-500" v-if="charLine(m)">{{ charLine(m) }}</div>
            </td>

            <td v-if="filters.section==='transfers'" class="px-6 py-4 text-center">
              <div class="font-medium">
                {{ pathLabel(row.from_path) }} <span class="text-gray-400">→</span> {{ pathLabel(row.to_path) }}
              </div>
            </td>

            <td class="px-6 py-4 text-right">
              {{ fmt(m.qty) }} <span class="text-gray-500">{{ unit(m.measure) }}</span>
            </td>

            <td class="px-6 py-4 text-center">{{ $t('movement.reasons.'+m.reason) || m.reason }}</td>
            <td class="px-6 py-4 text-gray-500 text-center">
              <span :title="m.moved_at">
                {{ formatDateTime(m.moved_at) }}
              </span>
              <span class="text-xs text-gray-400 ml-2">({{ fromNow(m.moved_at) }})</span>
            </td>
          </tr>

          <tr v-if="!loading && items.length===0">
            <td colspan="6" class="px-4 py-8 text-center text-gray-500">Տվյալներ չկան</td>
          </tr>
          </tbody>
        </table>
      </div>

      <!-- սքրոլ սենթինել -->
      <div ref="sentinel" class="h-12 flex items-center justify-center">
        <span v-if="loading && items.length>0" class="text-sm text-gray-500">Լցվում է…</span>
        <span v-else-if="endReached && items.length>0" class="text-xs text-gray-400">Վերջ</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute } from 'vue-router'
import { mainApi, wmsApi } from '@/api.js'
import { formatDateTime, fromNow } from '@/utils/dateFormat'
const route = useRoute()
const storage = ref(null)

// state
const items = ref([])
const loading = ref(false)
const endReached = ref(false)
const sentinel = ref(null)
let observer = null

// filters + pagination
const filters = ref({
  section: 'inbound', // 'inbound' | 'transfers'
  product_id: undefined,
  reason: '',
  date_from: '',
  date_to: '',
  limit: 50,
  offset: 0
})

// search (client-side)
const q = ref('')
const filtered = computed(() => {
  if (!q.value) return items.value
  const t = q.value.toLowerCase()
  return items.value.filter(m =>
      (m.product?.name || '').toLowerCase().includes(t) ||
      (m.reason || '').toLowerCase().includes(t)
  )
})

// formatters
const fmt = (n)=> {
  const num = Number(n || 0)
  return num.toLocaleString(undefined, { maximumFractionDigits: 6 })
}
const unit = (m)=> ({kg:'կգ', g:'գ', t:'տ', l:'լ', ml:'մլ', m3:'մ³', m:'մ', cm:'սմ', mm:'մմ', piece:'հատ'}[String(m||'').toLowerCase()] || '')
const dt  = (s)=> s ? new Date(s).toLocaleString() : ''
const pathLabel = (p) => p ? [p.department, p.section, p.shelf, p.cell].filter(Boolean).join(' → ') : ''

// chip line of characteristics (expects array of {id,name})
const charLine = (row) => {
  const list = row?.product?.characteristics
  return Array.isArray(list) && list.length ? list.map(x=>x.name).join(', ') : ''
}

// load one page
const fetchPage = async () => {
  if (loading.value || endReached.value) return
  loading.value = true
  try {
    const storageId = Number(route.params.id)
    const page = await wmsApi.getMovements(storageId, {
      section: filters.value.section,
      product_id: filters.value.product_id || undefined,
      reason: filters.value.reason || undefined,
      date_from: filters.value.date_from || undefined,
      date_to: filters.value.date_to || undefined,
      limit: filters.value.limit,
      offset: filters.value.offset
    })

    const list = Array.isArray(page) ? page : (page?.data ?? [])
    items.value.push(...list)
    filters.value.offset += list.length
    if (list.length < filters.value.limit) endReached.value = true
  } finally {
    loading.value = false
  }
}

// reload from start
const reloadFromStart = async () => {
  endReached.value = false
  items.value = []
  filters.value.offset = 0
  await fetchPage()
}

// setup header storage + first load
const init = async () => {
  const storageId = Number(route.params.id)
  storage.value = await mainApi.getStorageById(storageId)
  await reloadFromStart()
}

// infinite scroll
const startObserver = () => {
  if (!sentinel.value) return
  observer = new IntersectionObserver((entries) => {
    const [entry] = entries
    if (entry.isIntersecting) fetchPage()
  })
  observer.observe(sentinel.value)
}

onMounted(async () => {
  await init()
  startObserver()
})

onBeforeUnmount(() => {
  if (observer && sentinel.value) observer.unobserve(sentinel.value)
  observer = null
})

// when route changes or section changes → reload
watch(() => route.params.id, init)
watch(() => filters.value.section, reloadFromStart)
</script>
