<template>
  <div class="flex flex-col gap-y-2">
    <div class="flex flex-col">
      <div class="dark:border-gray-700 bg-white">
        <div class="flex gap-x-2 items-center p-4 border-b rounded-md border-gray-200 text-xl">
          <p>{{ $t('hr') }}</p>
        </div>
      </div>
    </div>

    <div class="px-4">
      <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        <RouterLink v-if="canHrManage" :to="'/hr/role-positions'" class="block p-5 rounded-2xl border border-gray-300 bg-white hover:shadow">
          <p class="font-semibold">հաստիքագրում</p>
        </RouterLink>

        <RouterLink   v-if="canHrManage"  :to="'/hr/vacancy'" class="block p-5 rounded-2xl border border-gray-300 bg-white hover:shadow">
          <p class="font-semibold">Թափուր աշխատատեղեր</p>
        </RouterLink>

        <RouterLink  v-if="canHrManage" :to="'/hr/candidates'" class="block p-5 rounded-2xl border border-gray-300 bg-white hover:shadow">
          <p class="font-semibold">Կանդիդատ</p>
        </RouterLink>

        <RouterLink  v-if="canHrManage" :to="'/hr/employees'" class="block p-5 rounded-2xl border border-gray-300 bg-white hover:shadow">
          <p class="font-semibold">Աշխատակիցներ</p>
        </RouterLink>

        <RouterLink  v-if="canHrManage" :to="'/hr/settings'" class="block p-5 rounded-2xl border border-gray-300 bg-white hover:shadow">
          <p class="font-semibold">Կարգավորումներ</p>
        </RouterLink>

        <!-- Admin leave requests: show only if CAN hr.manage AND does NOT have employee.view -->
        <RouterLink
            :to="'/hr/leave-requests'"
            class="block p-5 rounded-2xl border border-gray-300 bg-white hover:shadow"
        >
          <p class="font-semibold">Արձակուրդների հայտեր (բոլորը)</p>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuth } from '@/stores/auth'

const auth = useAuth()

// helper: treat super-admin as all-permissions
 const can = (perm: string) =>
    (typeof auth.can === 'function' && auth.can(perm)) ||
    auth.abilities?.includes?.(perm) ||
    auth.roles?.includes?.('super-admin')

const canEmployeeView = computed(() => can('employee.view'))

const canHrManage = computed(() => can('hr.vacancies.view'))

const showMyLeave = computed(() => canEmployeeView.value)
const showAdminLeave = computed(() => canHrManage.value && !canEmployeeView.value)
</script>
