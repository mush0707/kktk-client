<template>
  <div class="flex flex-col">
    <!-- Header -->
    <div class="dark:border-gray-700 bg-white">
      <div class="flex items-center justify-between p-4 border-b rounded-md border-gray-200">
        <div class="flex items-center gap-2">
          <p class="text-xl font-semibold">Աշխատավարձի կառավարում</p>
          <p class="text-sm text-slate-500">(Հաշվապայություն)</p>
        </div>
      </div>
    </div>

    <!-- Breadcrumb -->
    <nav class="flex bg-blue-50 py-2 items-center text-sm" aria-label="Breadcrumb">
      <ol class="inline-flex items-center">
        <li>
          <router-link :to="'/accounting'" class="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-slate-100">
            <span class="underline-offset-2 hover:underline">Հաշվապայություն</span>
          </router-link>
        </li>
        <li aria-hidden="true" class="px-1">
          <svg class="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
            <path d="M7.05 3.55a1 1 0 0 1 1.4 0l4.5 4.5a1 1 0 0 1 0 1.4l-4.5 4.5a1 1 0 0 1-1.4-1.4L10.79 10 7.05 6.26a1 1 0 0 1 0-1.41z"/>
          </svg>
        </li>
        <li>
          <router-link :to="'/hr/employees/calendar'" class="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-slate-100">
            <span class="underline-offset-2 hover:underline">Աշխատավարձի կառավարում</span>
          </router-link>
        </li>
      </ol>
    </nav>
  </div>

  <div class="px-4 py-4 flex flex-col gap-y-4">
    <!-- Tabs -->
    <div class="inline-flex gap-1 rounded-xl border border-gray-200 bg-white p-1">
      <button
          v-for="tab in tabs"
          :key="tab.value"
          class="px-4 py-2 rounded-lg text-sm font-medium"
          :class="activeTab === tab.value ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-50'"
          @click="activeTab = tab.value"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Per-tab action strip (as requested labels) -->
    <div class="flex gap-2 justify-end items-center" v-if="['pay'].includes(activeTab)">
      <!-- Only for first two tabs -->
      <button
          class="whitespace-nowrap bg-blue-600 text-white px-3 text-sm py-1 rounded-lg disabled:opacity-50"
          :disabled="!downloadSelectionCount"
          @click="broadcast('downloadSelected')"
      >
        {{ t('download_declarations') }} ({{ downloadSelectionCount }})
      </button>
      <button
          class="whitespace-nowrap bg-green-600 text-white px-3 text-sm py-1 rounded-lg disabled:opacity-50"
          :disabled="!paySelectionCount"
          @click="broadcast('paySelected')"
      >
        {{ t('pay_downloaded_employees') }} ({{ paySelectionCount }})
      </button>
    </div>

    <!-- Tab bodies -->
    <component
        :is="currentComponent"
        @update-selection="handleSelectionUpdate"
        @require-refresh="noop"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

// child tabs
import TabUnpaid from './payrolls/tabs/PayrolUnpaidTab.vue'
import TabHistory from './payrolls/tabs/PayrolHistoryTab.vue'
import TabOfferings from './payrolls/tabs/PayrolOfferingsTab.vue'
import TabLeaves from './payrolls/tabs/PayrolLeavesTab.vue'
import TabLoans from './payrolls/tabs/PayrolLoansTab.vue'
import TabAdvances from './payrolls/tabs/PayrolAdvancesTab.vue'

const { t } = useI18n()

const tabs = [
  { value: 'pay',        label: 'Վճարել' },
  { value: 'history',    label: 'Պատմություն' },
  { value: 'offerings',  label: 'Կատարողականներ' },
  { value: 'leaves',     label: 'Արձակուրդայիններ' },
  { value: 'loans',      label: 'Փոխառություններ' },
  { value: 'advances',   label: 'Ավանսներ' },
] as const

type TabKey = typeof tabs[number]['value']
const activeTab = ref<TabKey>('pay')

// child component mapping
const currentComponent = computed(() => {
  switch (activeTab.value) {
    case 'pay':       return TabUnpaid
    case 'history':   return TabHistory
    case 'offerings': return TabOfferings
    case 'leaves':    return TabLeaves
    case 'loans':     return TabLoans
    case 'advances':  return TabAdvances
  }
})

/**
 * Selections are maintained per-tab inside children; parent only mirrors counters to show on buttons.
 * Children emit @update-selection with {downloadCount, payCount}
 */
const downloadSelectionCount = ref(0)
const paySelectionCount = ref(0)

function handleSelectionUpdate(payload: { downloadCount: number; payCount: number }) {
  downloadSelectionCount.value = payload.downloadCount
  paySelectionCount.value = payload.payCount
}

/**
 * A very small event-bus style through 'window' to keep the wiring simple here.
 * Children listen to 'payroll:action' events.
 */
function broadcast(action: 'downloadSelected'|'paySelected') {
  window.dispatchEvent(new CustomEvent('payroll:action', { detail: { action } }))
}

function noop() {}
</script>
