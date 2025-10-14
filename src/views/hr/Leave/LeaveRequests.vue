<template>
  <div class="flex flex-col">
    <!-- Header -->
    <div class="dark:border-gray-700 bg-white">
      <div class="flex items-center justify-between p-4 border-b rounded-md border-gray-200">
        <div class="flex items-center gap-2">
          <p class="text-xl font-semibold">{{ $t('leave_requests') || 'Տեղեկատվություն արձակուրդների մասին' }}</p>
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
    <div class="flex flex-col gap-y-2">
      <div class="flex items-center gap-2">
        <input
            v-model="q"
            @input="debouncedSearch"
            class="px-3 py-2 rounded-xl border border-gray-300 w-72"
            :placeholder="$t('search_placeholder') || 'Փնտրել (աշխատակից)…'"
        />
        <button class="px-3 py-2 rounded-xl border hover:bg-gray-50" @click="resetAndReload">
          {{ $t('refresh') || 'Թարմացնել' }}
        </button>
      </div>
    </div>

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
          <th class="px-4 py-3"></th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="row in rows" :key="row.id" class="border-t">
          <td class="px-4 py-3 font-medium">#{{ row.id }}</td>
          <td class="px-4 py-3">{{ row.employee.first_name }} {{row.employee.last_name}}</td>
          <td class="px-4 py-3">{{ row.type?.name || '—' }}</td>
          <td class="px-4 py-3">{{ row.date_from }}</td>
          <td class="px-4 py-3">{{ row.date_to }}</td>
          <td class="px-4 py-3">{{ row.days }}</td>
          <td class="px-4 py-3">{{ $t(row.status) }}</td>
          <td class="px-4 py-3 flex gap-2">
            <button
                v-if="row.status==='pending'"
                class="px-3 py-1 text-xs text-white bg-green-600 rounded-md hover:bg-green-700"
                @click="approveStatus(row.id, 'approved')"
            >{{ $t('approve') || 'Ընդունել' }}
            </button>

            <button
                v-if="row.status==='pending'"
                class="px-3 py-1 text-xs text-white bg-red-600 rounded-md hover:bg-red-700"
                @click="openRejectModal(row.id)"
            >{{ $t('reject') || 'Մերժել' }}
            </button>
          </td>
        </tr>
        <tr v-if="!loading && rows.length===0">
          <td colspan="8" class="p-6 text-center text-gray-500">{{ $t('empty') || 'Դատարկ է' }}</td>
        </tr>
        </tbody>
      </table>
    </div>
  </div>
  <div v-if="cancelModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/30" @click="closeRejectModal"></div>

    <div class="relative bg-white rounded-2xl w-full max-w-md shadow-xl p-6">
      <h3 class="text-lg font-semibold mb-4">
        {{ $t('reject_request') || 'Մերժել արձակուրդի հայտը' }}
      </h3>

      <div class="flex flex-col gap-y-2">
        <label class="block text-sm text-gray-600">
          {{ $t('comment') || 'Մեկնաբանություն' }}
          <span class="text-red-600">*</span>
        </label>
        <textarea
            v-model.trim="cancelComment"
            class="w-full border rounded-lg p-2 resize-none h-24"
            placeholder="Նշեք մերժման պատճառը…"
        ></textarea>
      </div>

      <!-- Validation Error -->
      <div
          v-if="formError"
          class="rounded-xl border border-red-200 bg-red-50 text-red-800 p-2 text-sm mt-3"
      >
        {{ formError }}
      </div>

      <div class="flex justify-end gap-2 mt-6 border-t pt-3">
        <button
            class="px-4 py-2 rounded-lg border hover:bg-gray-100"
            @click="closeRejectModal"
        >
          {{ $t('close') || 'Փակել' }}
        </button>
        <button
            class="px-4 py-2 rounded-lg text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
            @click="submitReject"
            :disabled="cancelLoading"
        >
          {{ cancelLoading ? ($t('loading') || 'Բեռնում...') : ($t('confirm_reject') || 'Հաստատել մերժումը') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {onBeforeUnmount, onMounted, ref} from 'vue'
import {leaveRequestApi} from "@/api.ts";
import {useI18n} from "vue-i18n";

const {t} = useI18n();
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
    const {data} = await leaveRequestApi.list({limit: LIMIT, offset: offset.value, search: q.value})
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

function debouncedSearch() {
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

async function approveStatus(id: number, status: string) {
  const actionText = status === 'approved' ? 'ընդունել' : 'մերժել';
  const confirmed = window.confirm(
      `Դուք համոզվա՞ծ եք, որ ցանկանում եք ${actionText} այս հայտը?`
  );
  if (!confirmed) return

  try {
    await leaveRequestApi.approveStatus(id)
    const request = rows.value.find(r => r.id === id)
    if (request) request.status = status
  } catch (e) {
    console.error(e)
  }
}
const cancelModalOpen = ref(false)
const cancelId = ref<number | null>(null)
const cancelComment = ref('')
const cancelLoading = ref(false)
const formError = ref('')

function openRejectModal(id: number) {
  cancelId.value = id
  cancelModalOpen.value = true
  cancelComment.value = ''
  formError.value = ''
}

function closeRejectModal() {
  cancelModalOpen.value = false
  cancelId.value = null
  cancelComment.value = ''
  formError.value = ''
}

function validate(): string {
  if (!cancelComment.value.trim()) {
    return  'Մեկնաբանությունը պարտադիր է։'
  }
  return ''
}

async function submitReject() {
  formError.value = validate()
  if (formError.value) return

  if (!cancelId.value) return
  cancelLoading.value = true

  try {
    await leaveRequestApi.rejectStatus(cancelId.value, { comment: cancelComment.value })
    const request = rows.value.find(r => r.id === cancelId.value)
    if (request) {
      request.status = 'canceled'
      request.comment = cancelComment.value
    }
    closeRejectModal()
  } catch (e) {
    console.error(e)
    formError.value = t('failed_to_reject') || 'Չհաջողվեց մերժել հայտը։'
  } finally {
    cancelLoading.value = false
  }
}

</script>
