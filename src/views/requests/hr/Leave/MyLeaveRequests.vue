<template>
  <div class="flex flex-col">
    <!-- Header -->
    <div class="dark:border-gray-700 bg-white">
      <div class="flex items-center justify-between p-4 border-b rounded-md border-gray-200">
        <div class="flex items-center gap-2">
          <p class="text-xl font-semibold">{{ $t('leave_requests') || 'Տեղեկատվություն արձակուրդների մասին' }}</p>
        </div>
        <div>
          <button
              @click="showLeaveModal=true"
              type="button"
              class="px-3 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
          >
            {{ $t('new_leave_types') || 'Նոր թեկնածու +' }}
          </button>
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
            <path
                d="M7.05 3.55a1 1 0 0 1 1.4 0l4.5 4.5a1 1 0 0 1 0 1.4l-4.5 4.5a1 1 0 0 1-1.4-1.4L10.79 10 7.05 6.26a1 1 0 0 1 0-1.41z"/>
          </svg>
        </li>
        <li>
          <p class="inline-flex items-center gap-1 rounded-md px-2 py-1">
            <span class="underline-offset-2 hover:underline">{{ $t('leave_requests') || 'Արձակուրդի հայտեր' }}</span>
          </p>
        </li>
      </ol>
    </nav>
  </div>

  <div class="p-4 space-y-4">
    <!-- Toolbar -->


    <!-- Table -->
    <div class="bg-white border border-gray-300 overflow-x-auto">
      <table class="min-w-full text-sm whitespace-nowrap">
        <thead class="bg-gray-50">
        <tr class="text-left">
          <th class="px-4 py-3">#</th>
          <th class="px-4 py-3">{{ $t('employee') || 'Աշխատակից' }}</th>
          <th class="px-4 py-3">{{ $t('leave_type') || 'Արձակուրդի տեսակ' }}</th>
          <th class="px-4 py-3">{{ $t('start') || 'Սկիզբ' }}</th>
          <th class="px-4 py-3">{{ $t('end') || 'Վերջ' }}</th>
          <th class="px-4 py-3">{{ $t('days_count') || 'Օրեր' }}</th>
          <th class="px-4 py-3">{{ $t('status') || 'Կարգավիճակ' }}</th>
          <th class="px-4 py-3">{{ $t('comment') }}</th>
          <th class="px-4 py-3"></th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="row in rows" :key="row.id" class="border-t">
          <td class="px-4 py-3 font-medium">#{{ row.id }}</td>
          <td class="px-4 py-3">{{ auth?.user?.employee?.first_name }} {{ auth?.user?.employee?.last_name }}</td>
          <td class="px-4 py-3">{{ row.type?.name || '—' }}</td>
          <td class="px-4 py-3">{{ row.date_from }}</td>
          <td class="px-4 py-3">{{ row.date_to }}</td>
          <td class="px-4 py-3">{{ row.days }}</td>
          <td class="px-4 py-3">{{ $t(row.status) }}</td>
          <td class="px-4 py-3">{{ row.comment }}</td>
          <td class="px-4 py-3 flex gap-2">
            <button
                v-if="row.status==='pending'"
                class="px-3 py-1 text-xs text-white bg-red-600 rounded-md hover:bg-red-700"
                @click="cancelStatus(row.id, 'rejected')"
            >{{ $t('cancel') || 'Մերժել' }}
            </button>
          </td>
        </tr>
        <tr v-if="!loading && rows.length===0">
          <td colspan="8" class="p-6 text-center text-gray-500">{{ $t('empty') || 'Դատարկ է' }}</td>
        </tr>
        </tbody>
      </table>
    </div>
    <LeaveRequestModal
        v-model:open="showLeaveModal"
        @saved="handleSaved"
        @close="showLeaveModal = false"
    />
  </div>
</template>

<script setup lang="ts">

import {onBeforeUnmount, onMounted, ref} from 'vue'
import {leaveRequestApi} from "@/api.ts";
import {useAuth} from "@/stores/auth.ts";
import LeaveRequestModal from "@/views/hr/Leave/LeaveRequestModal.vue";

const auth = useAuth();
const q = ref('')
const rows = ref<any[]>([])
const loading = ref(false)
const eof = ref(false)
 const LIMIT = 20
const offset = ref(0)
const sentinel = ref<HTMLElement | null>(null)
let io: IntersectionObserver | null = null
let tId: number | ReturnType<typeof setTimeout> | null = null

 async function fetchNext() {
  if (loading.value || eof.value) return
  loading.value = true
  try {
    const {data} = await leaveRequestApi.userList(auth.user?.employee.id, {limit: LIMIT, offset: offset.value, search: q.value})
    const batch = data?.data ?? data ?? []
    rows.value.push(...batch)
    if (batch.length < LIMIT) eof.value = true
    else offset.value += LIMIT
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function resetAndReload() {
  rows.value = []
  offset.value = 0
  eof.value = false
  await fetchNext()
}

const debouncedSearch = () => {
  if (tId) clearTimeout(tId as number)
  tId = setTimeout(resetAndReload, 300)
}


onMounted(() => {
  io = new IntersectionObserver(entries => {
    if (entries.some(e => e.isIntersecting)) fetchNext()
  }, {rootMargin: '0px 0px 200px'})

  if (sentinel.value) io.observe(sentinel.value)
  resetAndReload()
})

onBeforeUnmount(() => {
  if (io && sentinel.value) io.unobserve(sentinel.value)
  io = null
})

const cancelStatus = async (id: number, status: string) => {
  const actionText = status === 'approved' ? 'ընդունել' : 'մերժել';
  const confirmed = window.confirm(
      `Դուք համոզվա՞ծ եք, որ ցանկանում եք ${actionText} այս հայտը?`
  );
  if (!confirmed) return

  try {
    await leaveRequestApi.cancelStatus(id)
    const request = rows.value.find(r => r.id === id)
    if (request) request.status = status
  } catch (e) {
    console.error(e)
  }
}

const showLeaveModal = ref(false)


const handleSaved = () => {
  showLeaveModal.value = false
  resetAndReload()
}


</script>
