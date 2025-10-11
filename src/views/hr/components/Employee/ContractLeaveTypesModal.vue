<!-- src/views/hr/modals/ContractLeaveTypesModal.vue -->
<template>
  <div v-if="open" class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/40" @click="$emit('close')"></div>

    <div
        class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl bg-white rounded-2xl shadow-xl"
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-5 py-4 border-b">
        <h3 class="text-lg font-semibold">
          {{ $t('leave_types_for_contract') || 'Անհասանելիքի տեսակներ (պայմանագիր)' }}
        </h3>
        <button class="p-2 rounded-lg hover:bg-gray-100" @click="$emit('close')" aria-label="Close">✕</button>
      </div>

      <!-- Body -->
      <div class="p-5 space-y-4 text-sm">
        <div class="flex items-center justify-between">
          <div class="text-slate-700">{{ $t('leave_types') || 'Անհասանելիքի տեսակներ' }}</div>
          <div class="text-xs text-slate-500" v-if="selectedIds.length">
            {{ selectedIds.length }} {{ $t('selected') || 'ընտրված' }}
          </div>
        </div>

        <div class="border rounded-xl p-4 bg-gray-50 space-y-3">
          <!-- Chips -->
          <div v-if="selectedIds.length" class="flex flex-wrap gap-2">
            <!-- Locked (already in DB) -->
            <span
                v-for="lt in selectedIds.map(id => mapById[id]).filter(Boolean).filter(lt => lockedSet.has(lt.id))"
                :key="'locked-' + lt.id"
                class="flex items-center gap-1 px-2 py-1 rounded-full bg-white border text-xs text-slate-600"
                title="Already saved in contract"
            >
              <span>🔒 {{ lt.name }}</span>
            </span>

            <!-- New / removable until saved -->
            <button
                v-for="lt in selectedIds.map(id => mapById[id]).filter(Boolean).filter(lt => !lockedSet.has(lt.id))"
                :key="'new-' + lt.id"
                type="button"
                class="flex items-center gap-1 px-2 py-1 rounded-full bg-white border text-xs hover:bg-gray-50"
                @click="toggle(lt.id)"
                :title="$t('remove') || 'Remove'"
            >
              <span>{{ lt.name }}</span>
              <span class="text-slate-400">✕</span>
            </button>
          </div>

          <!-- Search + actions -->
          <div class="flex flex-col md:flex-row gap-2">
            <input
                v-model.trim="q"
                class="w-full px-3 py-2 rounded-xl border border-gray-300"
                :placeholder="$t('search_placeholder') || 'Որոնել տեսակով…'"
            />
            <div class="flex gap-2">
              <button
                  type="button"
                  class="whitespace-nowrap px-3 py-2 rounded-xl border hover:bg-gray-50"
                  @click="selectAll"
                  :disabled="!filtered.length"
              >
                {{ $t('select_all') || 'Նշել բոլորը' }}
              </button>
              <button
                  type="button"
                  class="whitespace-nowrap px-3 py-2 rounded-xl border hover:bg-gray-50"
                  @click="clearAll"
                  :disabled="selectedIds.length === lockedIds.length"
              >
                {{ $t('clear') || 'Մաքրել' }}
              </button>
            </div>
          </div>

          <!-- List -->
          <div class="max-h-64 overflow-auto rounded-lg border bg-white">
            <div v-if="!filtered.length" class="p-3 text-sm text-slate-500">
              {{ $t('nothing_found') || 'Ցուցակը դատարկ է' }}
            </div>
            <label
                v-for="lt in filtered"
                :key="lt.id"
                class="flex items-center gap-2 px-3 py-2 border-b last:border-b-0 hover:bg-gray-50"
                :title="lockedSet.has(lt.id) ? 'Already saved in contract' : ''"
            >
              <input
                  type="checkbox"
                  class="rounded"
                  :checked="selectedIds.includes(lt.id)"
                  :disabled="lockedSet.has(lt.id)"
                  @change="toggle(lt.id)"
              />
              <span class="text-sm">
                <span v-if="lockedSet.has(lt.id)">🔒 </span>{{ lt.name }}
              </span>
            </label>
          </div>

          <p v-if="showRequired && required && !selectedIds.length" class="text-xs text-red-600">
            {{ $t('field_required') || 'Պարտադիր դաշտ' }}
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-4 border-t flex items-center justify-end gap-2">
        <button class="px-3 py-2 rounded-xl border hover:bg-gray-50" @click="$emit('close')" :disabled="saving">
          {{ $t('cancel') || 'Չեղարկել' }}
        </button>
        <button
            class="px-3 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
            :disabled="saving || (required && !selectedIds.length)"
            @click="save"
        >
          <span v-if="saving">{{ $t('saving') || 'Պահպանում…' }}</span>
          <span v-else>{{ $t('save') || 'Պահպանել' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { contractsApi, leaveTypeApi } from '@/api.ts'

/**
 * Props
 * - open: show/hide modal
 * - contractId: the target employment contract id
 * - selected: initial selected leave type ids (these are considered LOCKED = already saved in DB)
 * - required: make selection mandatory (optional, default false)
 */
const props = defineProps<{
  open: boolean
  contractId: number
  selected?: number[] | null
  required?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved', payload: { contract_id: number; leave_type_ids: number[] }): void
  (e: 'update:selected', value: number[]): void
}>()

const saving = ref(false)
const showRequired = ref(false)

const list = ref<any[]>([])
const q = ref('')

// LOCKED = those already saved in DB (from props.selected)
const lockedIds = ref<number[]>([])
const lockedSet = computed(() => new Set(lockedIds.value))

// UNION (locked + new). Only “new” can be removed before save.
const selectedIds = ref<number[]>([])

const required = computed(() => !!props.required)

const mapById = computed<Record<number, any>>(() => {
  const m: Record<number, any> = {}
  ;(list.value || []).forEach((x: any) => {
    if (x?.id) m[x.id] = x
  })
  return m
})

const filtered = computed(() => {
  const s = (q.value || '').toLowerCase().trim()
  if (!s) return list.value || []
  return (list.value || []).filter((x: any) =>
      String(x?.name || '').toLowerCase().includes(s) ||
      String(x?.code || '').toLowerCase().includes(s)
  )
})

function toggle(id: number) {
  // Don’t allow unchecking locked items
  if (lockedSet.value.has(id)) return

  const idx = selectedIds.value.indexOf(id)
  if (idx === -1) selectedIds.value.push(id)
  else selectedIds.value.splice(idx, 1)

  emit('update:selected', [...selectedIds.value])
}

function selectAll() {
  const ids = filtered.value.map((x: any) => Number(x.id)).filter(Boolean)
  const set = new Set<number>(selectedIds.value)
  ids.forEach(id => {
    if (!lockedSet.value.has(id)) set.add(id)
  })
  selectedIds.value = Array.from(set)
  emit('update:selected', [...selectedIds.value])
}

function clearAll() {
  // Keep locked, drop only newly added
  selectedIds.value = [...lockedIds.value]
  emit('update:selected', [...selectedIds.value])
}

async function loadLeaveTypes() {
  try {
    const data = await leaveTypeApi.list()
    list.value = data?.data ?? data ?? []
  } catch (e) {
    list.value = []
    console.error(e)
  }
}

// Initialize locked & union when prop changes
watch(
    () => props.selected,
    (val) => {
      const base = Array.isArray(val) ? val.map(Number).filter(Boolean) : []
      lockedIds.value = [...new Set(base)]
      // keep any currently added ids that are not locked
      const currentAdded = selectedIds.value.filter(id => !lockedSet.value.has(id))
      selectedIds.value = [...new Set([...lockedIds.value, ...currentAdded])]
    },
    { immediate: true }
)

onMounted(async () => {
  await loadLeaveTypes()
  // Prune any invalid IDs from both locked and selected
  if ((lockedIds.value?.length || selectedIds.value?.length)) {
    const valid = new Set((list.value || []).map((x: any) => x.id))
    lockedIds.value = lockedIds.value.filter(id => valid.has(id))
    selectedIds.value = [...new Set(selectedIds.value.filter(id => valid.has(id)).concat(lockedIds.value))]
  }
})

async function save() {
  showRequired.value = true
  if (required.value && !selectedIds.value.length) return

  saving.value = true
  try {
    // Dedicated endpoint if available
    if (typeof (contractsApi as any).setLeaveTypes === 'function') {
      await (contractsApi as any).setLeaveTypes(props.contractId, { leave_type_ids: selectedIds.value })
    } else if (typeof (contractsApi as any).updateLeaveTypes === 'function') {
      // Your fallback helper
      await (contractsApi as any).updateLeaveTypes(props.contractId, { leave_type_ids: selectedIds.value })
    } else {
      // Generic fallback: update contract with leave_type_ids
      await contractsApi.update({
        id: props.contractId,
        contract: { leave_type_ids: selectedIds.value }
      } as any)
    }

    // After successful save, NEW additions become locked
    lockedIds.value = [...selectedIds.value]

    emit('saved', { contract_id: props.contractId, leave_type_ids: [...selectedIds.value] })
    emit('close')
  } catch (e) {
    console.error(e)
  } finally {
    saving.value = false
  }
}
</script>
