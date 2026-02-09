<template>
  <div class="flex flex-col gap-y-2">
    <div class="flex flex-col">
      <div class="dark:border-gray-700 bg-white">
        <div class="flex flex-col gap-y-2 p-4 border-b rounded-md border-gray-200 text-xl">
          <p>Զեղչերի կառավարում</p>
          <div class="border border-gray-300"></div>
          <p class="text-sm">Վաճառքների ստորաբաժանում</p>
        </div>
      </div>
      <nav class="flex bg-blue-50 py-2 items-center text-sm" aria-label="Breadcrumb">
        <ol class="inline-flex items-center">

          <li>
            <router-link :to="'/sales'"
                         class="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-slate-100">
              <span class="underline-offset-2 hover:underline">Վաճառքների ստորաբաժանում</span>
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
              <span class="underline-offset-2 hover:underline">Զեղչերի կառավարում</span>
            </p>
          </li>
        </ol>
      </nav>
    </div>
    <div class="space-y-4">
      <div class="flex items-center justify-between px-4">
        <button v-if="canManage" @click="openCreate" class="bg-blue-600 text-white px-4 py-2 rounded-xl">
          + Ստեղծել զեղչ
        </button>
      </div>
      <!-- Filters -->
      <div class="flex flex-col gap-y-2 px-4 py-4 bg-white rounded-2xl shadow">
        <p>Ֆիլտր</p>
        <div class="grid md:grid-cols-5 gap-3 text-sm">
          <input v-model="filters.search" :placeholder="t('search')" class="border border-gray-300 rounded-xl px-3 py-2 md:col-span-2" />
<!--          <input v-model="filters.from_date" type="date" class="border border-gray-300 rounded-xl px-3 py-2" />-->
<!--          <input v-model="filters.to_date" type="date" class="border border-gray-300 rounded-xl px-3 py-2" />-->
          <select v-model="statusPick" class="border border-gray-300 rounded-xl px-3 py-2">
            <option :value="''">Բոլոր կարգավիճակները</option>
            <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
          </select>
          <div class="md:col-span-2">
            <div class="inline-flex rounded-xl border border-slate-300 overflow-hidden select-none">
              <label
                  class="px-3 py-2 cursor-pointer"
                  :class="filters.for_customer === '' ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50'"
              >
                <input class="sr-only" type="radio" value="" v-model="filters.for_customer" />
                Բոլորը
              </label>
              <label
                  class="px-3 py-2 cursor-pointer border-l border-slate-300"
                  :class="filters.for_customer === '1' ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50'"
              >
                <input class="sr-only" type="radio" value="1" v-model="filters.for_customer" />
                Հաճախորդի
              </label>
              <label
                  class="px-3 py-2 cursor-pointer border-l border-slate-300"
                  :class="filters.for_customer === '0' ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50'"
              >
                <input class="sr-only" type="radio" value="0" v-model="filters.for_customer" />
                Սովորական
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- List -->
      <div class="bg-white rounded-2xl shadow divide-y divide-gray-300">
        <div class="p-4">
          <p>Ցանկ</p>
        </div>
        <div v-for="it in items" :key="it.id" class="p-4 flex items-center justify-between gap-4">
          <div class="space-y-1">
            <div class="font-medium">{{ it.name }} <span class="text-slate-500">({{ it.discount_type?.name || '—' }})</span></div>
            <div class="text-xs text-slate-500 flex items-center flex-wrap gap-2">
              <!-- status badge -->
              <span
                  class="inline-flex items-center px-2 py-0.5 rounded-full font-medium"
                  :class="statusMeta(it.status).classes"
              >
                {{ statusMeta(it.status).label }}
              </span>
              <!-- percentage -->
              <span class="text-lg">{{ it.percentage }}%</span>
              <span v-if="it.for_customer">(Հաճախորդի զեղչ)</span>
            </div>
          </div>
          <div class="flex gap-2">
            <button v-if="isLeader && (it.status==='pending' || it.status==='on_hold')" @click="activate(it)"
                    class="px-3 py-1 text-xs font-medium text-white bg-emerald-600 rounded-md shadow hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500">
            {{ t('activate') }}</button>
            <button v-if="isLeader && it.status==='active'" @click="hold(it)"
                    class="px-3 py-1 text-xs font-medium text-white bg-amber-600 rounded-md shadow hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500">
            Կանգնեցնել</button>
            <button v-if="isLeader && it.status==='active'" @click="archive(it)"
                    class="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded-md shadow hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500">
            {{ t('archive') }}</button>
            <button v-if="isLeader && it.status==='pending'" @click="cancel(it)"
                    class="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded-md shadow hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500">
            {{ t('cancel') }}</button>
            <button @click="edit(it)"
                    class="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-md shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
            Դիտել / Փոփոխել</button>
          </div>
        </div>
        <div ref="sentinel" class="h-8"></div>
        <div v-if="loading" class="p-4 text-center text-slate-500">{{ t('loading') }}</div>
        <div v-if="!loading && !items.length" class="p-6 text-center text-slate-400">{{ t('no_data') }}</div>
      </div>

      <DiscountFormModal
          v-model:open="modalOpen"
          :item="editingItem"
          @saved="reload"
      />
    </div>

  </div>
</template>


<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import DiscountFormModal from '@/views/sales/modals/DiscountFormModal.vue'
import {authApi, sales} from '@/api'
import type { Discount, DiscountStatus, DiscountListQuery } from '@/types/sales/discounts'

const modalOpen = ref(false)
const editingItem = ref<Discount | null>(null)

type ActorKind = 'department_leader' | 'department_staff'
const actorKind = ref<ActorKind | null>(null)
const isLeader = computed(() => actorKind.value === 'department_leader')
const isStaff  = computed(() => actorKind.value === 'department_staff')
type StatusMeta = { label: string; classes: string }

function statusMeta(s: DiscountStatus): StatusMeta {
  switch (s) {
    case 'active':
      return { label: 'Ակտիվ',        classes: 'bg-green-100 text-green-700 ring-1 ring-green-200' }
    case 'pending':
      return { label: 'Սպասման մեջ',  classes: 'bg-amber-100 text-amber-800 ring-1 ring-amber-200' }
    case 'on_hold':
      return { label: 'Կասեցված',     classes: 'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-200' }
    case 'archived':
      return { label: 'Արխիվացված',   classes: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200' }
    case 'cancelled':
      return { label: 'Չեղարկված',    classes: 'bg-rose-100 text-rose-700 ring-1 ring-rose-200' }
    default:
      return { label: s,               classes: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200' }
  }
}
async function loadActor() {
  try {
    // Prefer your canonical endpoint if wrapped already
    const data = await authApi.getActor()
    actorKind.value = data?.kind || null
  } catch {
    actorKind.value = null
  }
}
function openCreate() {
  editingItem.value = null
  modalOpen.value = true
}
function edit(it: Discount) {
  editingItem.value = it
  modalOpen.value = true
}
const { t } = useI18n()
const statuses: DiscountStatus[] = ['pending','active','cancelled','archived','on_hold']
const statusPick = ref<string>('')


const filters = reactive({ search: '', from_date: '', to_date: '', for_customer: '' as '' | '0' | '1' })
const limit = 20
let offset = 0
const items = ref<Discount[]>([])
const loading = ref(false)
const canManage = true // replace with your permission check helper if available


const form = reactive<{ id?: number; type: string; name: string; percentage: number | null; from_date: string | null; to_date: string | null }>({ type: '', name: '', percentage: null, from_date: null, to_date: null })
const saving = ref(false)


const formValid = computed(() => !!form.discount_type && !!form.name && (form.id ? true : (form.percentage && form.percentage > 0)))


function makeQuery(reset = false): DiscountListQuery {
  const status = statusPick.value ? [statusPick.value as DiscountStatus] : null
  const for_customer = filters.for_customer === '' ? null : Number(filters.for_customer)
  return { limit, offset: reset ? 0 : offset, search: filters.search || null, from_date: filters.from_date || null, to_date: filters.to_date || null, status, for_customer }
}


async function loadMore() {
  if (loading.value) return
  loading.value = true
  const { data } = await sales.discounts.list(makeQuery())
  const arr = data.data || []
  if (offset === 0) items.value = arr
  else items.value.push(...arr)
  if (arr.length === limit) offset += limit
  loading.value = false
}


function reload() { offset = 0; loadMore() }





function resetForm() { Object.assign(form, { id: undefined, type: '', name: '', percentage: null, from_date: null, to_date: null }) }


async function save() {
  saving.value = true
  try {
    if (form.id) await sales.discounts.update(form.id, { type: form.discount_type, name: form.name })
    else await sales.discounts.create({ type: form.discount_type, name: form.name, percentage: Number(form.percentage), from_date: form.from_date || null, to_date: form.to_date || null })
    resetForm(); reload()
  } finally { saving.value = false }
}


async function activate(it: Discount) { await sales.discounts.activate(it.id); reload() }
async function hold(it: Discount) { await sales.discounts.onHold(it.id); reload() }
async function archive(it: Discount) { await sales.discounts.archive(it.id); reload() }
async function cancel(it: Discount) { await sales.discounts.cancel(it.id); reload() }


// infinite scroll via IntersectionObserver
const sentinel = ref<HTMLElement | null>(null)
let io: IntersectionObserver | null = null


onMounted(() => {
  reload()
  loadActor()
  io = new IntersectionObserver((entries) => {
    if (entries.some(e => e.isIntersecting)) loadMore()
  })
  if (sentinel.value) io.observe(sentinel.value)
})
let filterTimer: number | undefined

watch(() => [filters.search, filters.from_date, filters.to_date, statusPick.value, filters.for_customer], () => {
  if (filterTimer) window.clearTimeout(filterTimer)
  filterTimer = window.setTimeout(() => reload(), 300)
})
</script>