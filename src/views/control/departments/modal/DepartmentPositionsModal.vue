<!-- src/views/control/departments/modal/DepartmentPositionsModal.vue -->
<template>
  <div v-if="open" class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/40" @click="close"></div>

    <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl bg-white rounded-2xl shadow-xl">
      <!-- Header -->
      <div class="flex items-center justify-between px-5 py-4 border-b">
        <h3 class="text-lg font-semibold">
          Կառավարել հաստիքները —
          <span class="text-slate-500">{{ department?.name }}</span>
        </h3>
        <button aria-label="Close" class="p-2 rounded-lg hover:bg-gray-100" @click="close">✕</button>
      </div>

      <!-- Body -->
      <div class="p-5 space-y-6">
        <!-- Add new mapping -->
        <div class="bg-slate-50 border border-gray-300 rounded-xl p-4">
          <div class="text-sm font-medium mb-2">Ավելացնել հաստիք</div>

          <!-- row 1: role + position_count + add -->
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
              <input
                  type="number" min="1"
                  v-model.number="createForm.position_count"
                  class="w-full px-3 py-2 rounded-xl border border-gray-300"
              />
            </div>

            <button
                class="px-3 py-2 rounded-xl border border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white disabled:opacity-50"
                @click="addPosition"
                :disabled="!createForm.role_id || !createForm.position_count || busy"
            >
              {{ $t('add') || 'Ավելացնել' }}
            </button>
          </div>

          <!-- row 2: shift / shift_hours / shift_periodicity -->
          <div class="grid grid-cols-1 gap-3 mt-3">
            <div class="flex items-center gap-2">
              <input
                  id="create-form-shift"
                  type="checkbox"
                  v-model="createForm.shift"
                  class="h-4 w-4 rounded border-gray-300"
              />
              <label for="create-form-shift" class="text-sm text-slate-700">Հերթափոխ</label>
            </div>

            <div v-if="createForm.shift" class="grid md:grid-cols-2 grid-cols-1 gap-3">
              <div>
                <label class="block text-xs text-slate-500 mb-1">Shift hours</label>
                <input
                    type="number" min="2" max="24" step="2"
                    :value="createForm.shift_hours"
                    @input="onShiftHoursInput($event)"
                    class="w-full px-3 py-2 rounded-xl border border-gray-300"
                    placeholder="2, 4, 6, 8, 12, 24"
                />
                <p class="text-xs text-slate-500 mt-1">
                  Զույգ, մաքս. 24, և պետք է <strong>բաժանի 24-ը</strong>
                </p>
              </div>

              <div>
                <label class="block text-xs text-slate-500 mb-1">Shift periodicity</label>
                <input
                    type="number" min="6" max="144" step="2"
                    :value="createForm.shift_periodicity"
                    @input="onShiftPeriodicityInput($event)"
                    class="w-full px-3 py-2 rounded-xl border border-gray-300"
                    :placeholder="`>= ${createForm.shift_hours || 2}, 6…144`"
                />
                <p class="text-xs text-slate-500 mt-1">
                  Զույգ, ≥ hours, և բազմապատիկ hours-ի (6…144)
                </p>
              </div>
            </div>

            <div v-if="shiftError" class="rounded-lg border border-amber-200 bg-amber-50 text-amber-800 px-3 py-2 text-sm">
              {{ shiftError }}
            </div>
          </div>
        </div>

        <!-- Table -->
        <div class="overflow-auto max-h-[420px]">
          <table class="w-full text-sm text-left text-gray-600">
            <thead class="text-xs uppercase bg-gray-50 text-gray-700">
            <tr>
              <th class="px-4 py-3">#</th>
              <th class="px-4 py-3">{{ $t('role') || 'Դեր/Հաստիք' }}</th>
              <th class="px-4 py-3">Հերթափոխ</th>
              <th class="px-4 py-3">Ժամեր</th>
              <th class="px-4 py-3">Պիրիոդիկություն</th>
              <th class="px-4 py-3 w-36">{{ $t('position_count') || 'Սլոթեր' }}</th>
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

              <!-- shift toggle -->
              <td class="px-4 py-3">
                <label class="inline-flex items-center gap-2">
                  <input
                      type="checkbox"
                      v-model="row.shift"
                      @change="onRowShiftToggle(row)"
                      class="h-4 w-4 rounded border-gray-300"
                  />
                  <span class="text-sm">{{ row.shift ? 'Այո' : 'Ոչ' }}</span>
                </label>
              </td>

              <!-- shift hours -->
              <td class="px-4 py-3">
                <input
                    v-if="row.shift"
                    type="number" min="2" max="24" step="2"
                    :value="row.shift_hours"
                    @input="onRowShiftHoursInput($event, row)"
                    class="w-28 px-2 py-1 rounded-lg border"
                    placeholder="2…24"
                />
                <span v-else class="text-slate-400">—</span>
              </td>

              <!-- shift periodicity -->
              <td class="px-4 py-3">
                <input
                    v-if="row.shift"
                    type="number" min="6" max="144" step="2"
                    :value="row.shift_periodicity"
                    @input="onRowShiftPeriodicityInput($event, row)"
                    class="w-28 px-2 py-1 rounded-lg border"
                    :placeholder="`>= ${row.shift_hours || 2}`"
                />
                <span v-else class="text-slate-400">—</span>
              </td>

              <!-- position_count -->
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <button class="px-2 py-1 rounded-lg border hover:bg-gray-50" @click="decrement(row)" :disabled="busy">−</button>
                  <input
                      type="number" min="0"
                      class="w-20 px-2 py-1 rounded-lg border"
                      v-model.number="row.position_count"
                  />
                  <button class="px-2 py-1 rounded-lg border hover:bg-gray-50" @click="increment(row)" :disabled="busy">+</button>
                </div>
              </td>

              <!-- actions -->
              <td class="px-4 py-3">
                <div class="flex flex-col gap-2">
                  <button
                      class="px-3 py-1 text-xs rounded-md border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white disabled:opacity-50"
                      @click="updateRow(row)"
                      :disabled="busy"
                  >
                    {{ $t('update') || 'Պահպանել' }}
                  </button>
                  <!-- Optional: remove button
                  <button
                    class="px-3 py-1 text-xs rounded-md border border-rose-600 text-rose-600 hover:bg-rose-600 hover:text-white disabled:opacity-50"
                    @click="removeRow(row)"
                    :disabled="busy"
                  >
                    {{ $t('remove') || 'Ջնջել' }}
                  </button>
                  -->
                </div>
              </td>
            </tr>

            <tr v-if="!rows.length">
              <td colspan="7" class="px-4 py-6 text-center text-slate-400">{{ $t('no_positions') || 'Հաստիքներ չկան' }}</td>
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
import { listRoles } from '@/utils/rolesApi.js'

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
      createForm: {
        role_id: null,
        position_count: 1,
        shift: false,
        shift_hours: null,
        shift_periodicity: null
      },
      shiftError: ''
    }
  },
  computed: {
    availableRoles() {
      const assignedRoleIds = this.rows.map(r => r.role_id)
      return this.roleOptions.filter(r => !assignedRoleIds.includes(r.id))
    }
  },
  watch: {
    'createForm.shift'(v) {
      this.shiftError = ''
      if (v) {
        if (this.createForm.shift_hours == null) this.createForm.shift_hours = 8
        if (this.createForm.shift_periodicity == null) this.createForm.shift_periodicity = 24
        this.normalizeShiftHours()
        this.normalizeShiftPeriodicity()
      } else {
        this.createForm.shift_hours = null
        this.createForm.shift_periodicity = null
      }
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
          role_name: r.role?.name ?? r.role_name,
          role_key: r.role?.key ?? r.role_key ?? null,
          shift: !!r.shift,
          shift_hours: r.shift_hours ?? null,
          shift_periodicity: r.shift_periodicity ?? null,
          position_count: Number(r.position_count || 0)
        }))
        await this.loadInitialRoles()
      } catch (e) {
        toast.error(this.$t('error_generic') || 'Չհաջողվեց բեռնել տվյալները')
      }
    },
    async loadInitialRoles() {
      try {
        const list = await listRoles()
        this.roleOptions = (list || []).map(r => ({ id: r.id, name: r.name || r.title || r.key }))
      } catch (e) {}
    },

    // helpers
    toEven(n) {
      if (n == null || n === '') return null
      n = Math.floor(Number(n))
      if (isNaN(n)) return null
      return n % 2 === 0 ? n : n - 1
    },
    clamp(n, min, max) {
      if (n == null) return null
      return Math.max(min, Math.min(max, n))
    },

    // CREATE form normalizers
    normalizeShiftHours() {
      let v = this.toEven(this.createForm.shift_hours)
      v = this.clamp(v, 2, 24)
      this.createForm.shift_hours = v
      return v
    },
    normalizeShiftPeriodicity() {
      const h = this.normalizeShiftHours() || 2
      let p = this.toEven(this.createForm.shift_periodicity)
      p = this.clamp(p, 6, 144)
      if (p < h) p = h
      if (p % h !== 0) {
        p = p - (p % h)
        if (p < h) p = h
      }
      if (p % 2 !== 0) p++
      p = this.clamp(p, 6, 144)
      this.createForm.shift_periodicity = p
      return p
    },

    onShiftHoursInput(e) {
      const val = e?.target?.value
      this.createForm.shift_hours = val === '' ? null : Number(val)
      this.normalizeShiftHours()
      if (this.createForm.shift_periodicity != null) this.normalizeShiftPeriodicity()
      this.validateShift()
    },
    onShiftPeriodicityInput(e) {
      const val = e?.target?.value
      this.createForm.shift_periodicity = val === '' ? null : Number(val)
      this.normalizeShiftPeriodicity()
      this.validateShift()
    },

    validateShift() {
      this.shiftError = ''
      if (!this.createForm.shift) return
      const h = this.createForm.shift_hours
      const p = this.createForm.shift_periodicity
      if (!h || h % 2 !== 0 || h < 2 || h > 24) {
        this.shiftError = 'Shift hours-ը պետք է լինի զույգ (2…24)'
        return
      }
      if (24 % h !== 0) {
        this.shiftError = 'Shift hours-ը պետք է բաժանի 24-ին (ընդունելի՝ 2, 4, 6, 8, 12, 24)'
        return
      }
      if (!p || p % 2 !== 0 || p < 6 || p > 144) {
        this.shiftError = 'Periodicity-ը պետք է լինի զույգ (6…144)'
        return
      }
      if (p < h) {
        this.shiftError = 'Periodicity-ը չի կարող լինել պակաս, քան shift hours-ը'
        return
      }
      if (p % h !== 0) {
        this.shiftError = 'Periodicity / Shift hours պետք է լինի ամբողջ թիվ'
        return
      }
    },

    // ROW (table) normalizers & handlers
    normalizeRowHours(row) {
      let v = this.toEven(row.shift_hours)
      v = this.clamp(v, 2, 24)
      row.shift_hours = v
      return v
    },
    normalizeRowPeriodicity(row) {
      const h = this.normalizeRowHours(row) || 2
      let p = this.toEven(row.shift_periodicity)
      p = this.clamp(p, 6, 144)
      if (p < h) p = h
      if (p % h !== 0) {
        p = p - (p % h)
        if (p < h) p = h
      }
      if (p % 2 !== 0) p++
      p = this.clamp(p, 6, 144)
      row.shift_periodicity = p
      return p
    },
    validateRowShift(row) {
      if (!row.shift) return ''
      const h = row.shift_hours
      const p = row.shift_periodicity
      if (!h || h % 2 !== 0 || h < 2 || h > 24) return 'Shift hours-ը պետք է լինի զույգ (2…24)'
      if (24 % h !== 0) return 'Shift hours-ը պետք է բաժանի 24-ին (ընդունելի՝ 2, 4, 6, 8, 12, 24)'
      if (!p || p % 2 !== 0 || p < 6 || p > 144) return 'Periodicity-ը պետք է լինի զույգ (6…144)'
      if (p < h) return 'Periodicity-ը չի կարող լինել պակաս, քան shift hours-ը'
      if (p % h !== 0) return 'Periodicity / Shift hours պետք է լինի ամբողջ թիվ'
      return ''
    },
    onRowShiftToggle(row) {
      if (row.shift) {
        if (row.shift_hours == null) row.shift_hours = 8
        if (row.shift_periodicity == null) row.shift_periodicity = 24
        this.normalizeRowHours(row)
        this.normalizeRowPeriodicity(row)
      } else {
        row.shift_hours = null
        row.shift_periodicity = null
      }
    },
    onRowShiftHoursInput(e, row) {
      const val = e?.target?.value
      row.shift_hours = val === '' ? null : Number(val)
      this.normalizeRowHours(row)
      if (row.shift_periodicity != null) this.normalizeRowPeriodicity(row)
    },
    onRowShiftPeriodicityInput(e, row) {
      const val = e?.target?.value
      row.shift_periodicity = val === '' ? null : Number(val)
      this.normalizeRowPeriodicity(row)
    },

    async addPosition() {
      if (!this.createForm.role_id || !this.createForm.position_count) return
      if (this.createForm.shift) {
        this.normalizeShiftHours()
        this.normalizeShiftPeriodicity()
        this.validateShift()
        if (this.shiftError) {
          toast.error(this.shiftError)
          return
        }
      }

      this.busy = true
      try {
        const payload = {
          role_id: this.createForm.role_id,
          position_count: this.createForm.position_count,
          shift: !!this.createForm.shift,
          shift_hours: this.createForm.shift ? this.createForm.shift_hours : null,
          shift_periodicity: this.createForm.shift ? this.createForm.shift_periodicity : null
        }
        const res = await api.post(`departments/${this.department.id}/role-positions`, payload)
        const row = res?.data?.data

        this.rows.push({
          id: row?.id,
          role_id: row?.role_id || this.createForm.role_id,
          role_name: row?.role?.name || row?.role_name || (this.roleOptions.find(x => x.id === this.createForm.role_id)?.name || ''),
          role_key: row?.role?.key || row?.role_key || null,
          shift: !!row?.shift,
          shift_hours: row?.shift_hours ?? null,
          shift_periodicity: row?.shift_periodicity ?? null,
          position_count: Number(row?.position_count ?? this.createForm.position_count ?? 0)
        })

        // reset
        this.createForm.role_id = null
        this.createForm.position_count = 1
        this.createForm.shift = false
        this.createForm.shift_hours = null
        this.createForm.shift_periodicity = null

        toast.success(this.$t('position_added') || 'Հաստիքը կցվեց')
      } catch (e) {
        toast.error(this.$t('error_generic') || 'Չհաջողվեց բեռնել տվյալները')
      } finally {
        this.busy = false
      }
    },

    async updateRow(row) {
      // validate row shift values
      if (row.shift) {
        this.normalizeRowHours(row)
        this.normalizeRowPeriodicity(row)
        const msg = this.validateRowShift(row)
        if (msg) {
          toast.error(msg)
          return
        }
      }

      this.busy = true
      try {
        await api.patch(`departments/${this.department.id}/role-positions/`, {
          role_id: row.role_id,
          position_count: row.position_count,
          shift: !!row.shift,
          shift_hours: row.shift ? row.shift_hours : null,
          shift_periodicity: row.shift ? row.shift_periodicity : null
        })
        toast.success(this.$t('saved') || 'Պահպանված է')
      } catch (e) {
        toast.error(this.$t('error_generic') || 'Չհաջողվեց բեռնել տվյալները')
      } finally {
        this.busy = false
      }
    },

    increment(row) { row.position_count = Number(row.position_count || 0) + 1 },
    decrement(row) { row.position_count = Math.max(0, Number(row.position_count || 0) - 1) },

    async removeRow(row) {
      if (!row?.id) return
      this.busy = true
      try {
        await api.delete(`departments/${this.department.id}/role-positions/${row.id}`)
        this.rows = this.rows.filter(r => (r.id || r.role_id) !== (row.id))
        toast.success(this.$t('removed') || 'Ջնջված է')
      } catch (e) {
        toast.error(this.$t('error_generic') || 'Չհաջողվեց բեռնել տվյալները')
      } finally {
        this.busy = false
      }
    },
  },
  mounted() {
    this.load()
  }
}
</script>

<style scoped>
:deep(.vue3-select__menu) { z-index: 60; }
</style>
