<template>
  <div class="flex flex-col">
    <!-- Header -->
    <div class="dark:border-gray-700 bg-white">
      <div class="flex items-center justify-between p-4 border-b rounded-md border-gray-200">
        <div class="flex items-center gap-2">
          <p class="text-xl font-semibold">Օրացույց</p>
          <p class="text-sm text-slate-500">({{ $t('hr') || 'Կադրեր' }})</p>
        </div>
      </div>
    </div>

    <!-- Breadcrumb -->
    <nav class="flex bg-blue-50 py-2 items-center text-sm" aria-label="Breadcrumb">
      <ol class="inline-flex items-center">
        <li>
          <router-link :to="'/hr'" class="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-slate-100">
            <span class="underline-offset-2 hover:underline">{{ $t('hr') || 'Կադրեր' }}</span>
          </router-link>
        </li>
        <li aria-hidden="true" class="px-1">
          <svg class="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
            <path d="M7.05 3.55a1 1 0 0 1 1.4 0l4.5 4.5a1 1 0 0 1 0 1.4l-4.5 4.5a1 1 0 0 1-1.4-1.4L10.79 10 7.05 6.26a1 1 0 0 1 0-1.41z"/>
          </svg>
        </li>
        <li>
          <router-link :to="'/hr/employees/calendar'" class="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-slate-100">
            <span class="underline-offset-2 hover:underline">Օրացույց</span>
          </router-link>
        </li>
      </ol>
    </nav>

    <!-- Tabs -->
    <div class="px-4 pt-2">
      <div class="inline-flex gap-1 rounded-xl border border-gray-200 bg-white p-1">
        <button
            class="px-4 py-2 rounded-lg text-sm font-medium"
            :class="activeTab==='calendar' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-50'"
            @click="activeTab='calendar'"
        >
          Օրացույց
        </button>
        <button
            class="px-4 py-2 rounded-lg text-sm font-medium"
            :class="activeTab==='overtimes' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-50'"
            @click="activeTab='overtimes'"
        >
          Արտաժամ / Տեղափոխություն
        </button>
        <button
            class="px-4 py-2 rounded-lg text-sm font-medium"
            :class="activeTab==='holidays' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-50'"
            @click="activeTab='holidays'"
        >
          Արձակուրդի հայտեր
        </button>
      </div>
    </div>

    <!-- Tabs content -->
    <div class="p-4">
      <StaffWorkCalendar v-if="activeTab==='calendar'"/>
      <Overtimes v-else-if="activeTab==='overtimes'"/>
      <HolidaysTab v-else />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import StaffWorkCalendar from './StaffWorkCalendar.vue'
import HolidaysTab from './Leave/LeaveRequests.vue'
import Overtimes from './components/Calendar/Overtimes.vue'

const activeTab = ref<'calendar' | 'holidays' | 'overtimes'>('calendar')
</script>
