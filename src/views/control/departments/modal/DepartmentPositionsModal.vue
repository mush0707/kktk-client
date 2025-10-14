<!-- src/views/control/departments/modal/DepartmentPositionsModal.vue -->
<template>
  <div v-if="open" class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/40" @click="close"></div>

    <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl bg-white rounded-2xl shadow-xl">
      <!-- Header -->
      <div class="flex items-center justify-between px-5 py-4 border-b">
        <h3 class="text-lg font-semibold">
          {{ $t('manage_positions') || 'Կառավարել հաստիքները' }} —
          <span class="text-slate-500">{{ department?.name }}</span>
        </h3>
        <button aria-label="Close" class="p-2 rounded-lg hover:bg-gray-100" @click="close">✕</button>
      </div>

      <!-- Body -->
      <div class="p-5 space-y-6">
        <!-- Add new mapping -->
        <div class="bg-slate-50 border rounded-xl p-4">
          <div class="text-sm font-medium mb-2">{{ $t('add_position') || 'Ավելացնել հաստիք' }}</div>
          <div class="grid md:grid-cols-[1fr_140px_120px] grid-cols-1 gap-3 items-end">
            <div class="space-y-2">

              <VueSelect
                  v-model="createForm.role_id"
                  :options="availableRoles"
                  :get-option-label="o => o.name"
                  :get-option-value="o => o.id"
                  :placeholder="$t('search_roles') || 'Որոնել դեր/հաստիք…'"
                  :noResults="$t('no_results') || 'Արդյունք չի գտնվել'"
              >
                <template #no-options>{{ $t('no_results') || 'Արդյունք չի գտնվել' }}</template>
                <template #option="{ option }">
                  <div class="flex items-center gap-2">
                    <span class="font-medium">{{ option.name }}</span>
                  </div>
                </template>
              </VueSelect>
            </div>

            <div>
              <label class="block text-xs text-slate-500 mb-1">{{ $t('position_count') || 'Սլոթեր' }}</label>
              <input type="number" min="1" v-model.number="createForm.position_count" class="w-full px-3 py-2 rounded-xl border border-gray-300" />
            </div>

            <button
                class="px-3 py-2 rounded-xl border border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white disabled:opacity-50"
                @click="addPosition"
                :disabled="!createForm.role_id || !createForm.position_count || busy"
            >
              {{ $t('add') || 'Ավելացնել' }}
            </button>
          </div>
        </div>

        <!-- Table -->
        <div class="overflow-auto max-h-[420px]">
          <table class="w-full text-sm text-left text-gray-600">
            <thead class="text-xs uppercase bg-gray-50 text-gray-700">
            <tr>
              <th class="px-4 py-3">#</th>
              <th class="px-4 py-3">{{ $t('role') || 'Դեր/Հաստիք' }}</th>
              <th class="px-4 py-3 w-44">{{ $t('position_count') || 'Սլոթեր' }}</th>
              <th class="px-4 py-3 w-40"></th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="(row, idx) in rows" :key="row.id || row.role_id" class="bg-white border-b">
              <td class="px-4 py-3">{{ idx + 1 }}</td>
              <td class="px-4 py-3">
                <div class="font-medium">{{ row.role_name }}</div>
                <div class="text-xs text-slate-400" v-if="row.role_key">{{ row.role_key }}</div>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <button class="px-2 py-1 rounded-lg border hover:bg-gray-50" @click="decrement(row)" :disabled="busy">−</button>
                  <input type="number" min="0" class="w-24 px-2 py-1 rounded-lg border" v-model.number="row.position_count" @change="updateposition_count(row)" />
                  <button class="px-2 py-1 rounded-lg border hover:bg-gray-50" @click="increment(row)" :disabled="busy">+</button>
                </div>
              </td>
              <td class="px-4 py-3">
                <div class="flex gap-2">
                  <button class="px-3 py-1 text-xs rounded-md border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white" @click="updateposition_count(row)" :disabled="busy">{{ $t('update') || 'Պահպանել' }}</button>
<!--                  <button class="px-3 py-1 text-xs rounded-md border border-rose-600 text-rose-600 hover:bg-rose-600 hover:text-white" @click="removeRow(row)" :disabled="busy">{{ $t('remove') || 'Ջնջել' }}</button>-->
                </div>
              </td>
            </tr>
            <tr v-if="!rows.length">
              <td colspan="4" class="px-4 py-6 text-center text-slate-400">{{ $t('no_positions') || 'Հաստիքներ չկան' }}</td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-5 py-4 border-t flex justify-end">
        <button class="px-3 py-2 rounded-xl border hover:bg-gray-50" @click="close">{{ $t('close') || 'Փակել' }}</button>
      </div>
    </div>
  </div>
</template>

<script>
import api from '@/utils/api.js'
import { useToast } from 'vue-toastification'
import VueSelect from 'vue3-select-component'
import { listRoles } from '@/utils/rolesApi.js' // adjust path if different
import {rolePositionApi} from '@/api.js'

const toast = useToast()

export default {
  name: 'DepartmentPositionsModal',
  components: { VueSelect },
  props: {
    department: { type: Object, required: true }
  },
  data() {
    return {
      open: true,
      busy: false,
      rows: [],
      roleOptions: [],
      roleSearch: '',
      roleSearchTimer: null,
      createForm: { role_id: null, position_count: 1 }
    }
  },
  computed: {
    availableRoles() {
      // exclude roles that are already in rows
      const assignedRoleIds = this.rows.map(r => r.role_id)
      return this.roleOptions.filter(r => !assignedRoleIds.includes(r.id))
    }
  },
  methods: {
    close() {
      this.$emit('close')
      this.open = false
    },
    async load() {
      try {


        const positionsRes = await api.get(`departments/${this.department.id}/role-positions`)

        this.rows = (positionsRes.data.data || []).map(r => ({
          id: r.id,
          role_id: r.role_id,
          role_name: r.role.name,
          position_count: Number(r.position_count || 0)
        }))
        await this.loadInitialRoles()
      } catch (e) {
        // eslint-disable-next-line no-console
        // console.error(e)
        toast.error(this.$t('error_generic') || 'Չհաջողվեց բեռնել տվյալները')
      }
    },
    async loadInitialRoles() {
      try {
        const list = await listRoles()
        this.roleOptions = (list || []).map(r => ({ id: r.id, name: r.name || r.title || r.key }))
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e)
      }
    },
    onRoleSearchInput() {
      clearTimeout(this.roleSearchTimer)
      this.roleSearchTimer = setTimeout(async () => {
        try {
          const list = await listRoles({ search: this.roleSearch })
          this.roleOptions = (list || []).map(r => ({ id: r.id, name: r.name || r.title || r.key }))
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error(e)
        }
      }, 300)
    },
    async addPosition() {
       if (!this.createForm.role_id || !this.createForm.position_count) return
      this.busy = true
      try {
        const res = await api.post(`departments/${this.department.id}/role-positions`, {
          role_id: this.createForm.role_id,
          position_count: this.createForm.position_count
        })
        const row = res?.data?.data
        this.rows.push({
          id: row?.id,
          role_id: row?.role_id || this.createForm.role_id,
          role_name: row?.role_name || (this.roleOptions.find(x => x.id === this.createForm.role_id)?.name || ''),
          role_key: row?.role_key || null,
          position_count: Number(row?.position_count || this.createForm.position_count)
        })
        this.createForm.role_id = null
        this.createForm.position_count = 1
        toast.success(this.$t('position_added') || 'Հաստիքը կցվեց')
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e)
        toast.error(this.$t('error_generic') || 'Չհաջողվեց բեռնել տվյալները')
      } finally {
        this.busy = false
      }
    },
    async updateposition_count(row) {
       if (!row || row.position_count == null || row.position_count < 0) return
      this.busy = true
      try {
        await api.patch(`departments/${this.department.id}/role-positions/`, {
          role_id:  row.role_id,
          position_count: row.position_count
        })
        toast.success(this.$t('saved') || 'Պահպանված է')
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e)
        toast.error(this.$t('error_generic') || 'Չհաջողվեց բեռնել տվյալները')
      } finally {
        this.busy = false
      }
    },
    async removeRow(row) {
      if (!row) return
      this.busy = true
      try {
        await api.delete(`departments/${this.department.id}/role-positions/${row.id}`)
        this.rows = this.rows.filter(r => (r.id || r.role_id) !== (row.id))
        toast.success(this.$t('removed') || 'Ջնջված է')
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e)
        toast.error(this.$t('error_generic') || 'Չհաջողվեց բեռնել տվյալները')
      } finally {
        this.busy = false
      }
    },
    increment(row) { row.position_count = Number(row.position_count || 0) + 1 },
    decrement(row) { row.position_count = Math.max(0, Number(row.position_count || 0) - 1) }
  },
  mounted() {
    this.load()
  }
}
</script>

<style scoped>
/***** make the select popover above dialogs when opened *****/
:deep(.vue3-select__menu) { z-index: 60; }
</style>

