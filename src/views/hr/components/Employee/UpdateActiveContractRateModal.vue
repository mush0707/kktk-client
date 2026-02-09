<!-- src/views/hr/components/Employee/UpdateActiveContractRateModal.vue -->
<template>
  <div v-if="open" class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/40" @click="$emit('close')"></div>

    <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-white rounded-2xl shadow-xl">
      <!-- Header -->
      <div class="flex items-center justify-between px-5 py-4 border-b">
        <h3 class="text-lg font-semibold">Փոփոխել ակտիվ պայմանագրի դրույքը</h3>
        <button class="p-2 rounded-lg hover:bg-gray-100" @click="$emit('close')" aria-label="Close">✕</button>
      </div>

      <!-- Body -->
      <div class="p-5 space-y-5 text-sm max-h-[70vh] overflow-y-auto">
        <div v-if="loading" class="text-slate-500">Բեռնվում է…</div>

        <div v-else class="space-y-6">
          <!-- Rate input -->
          <div>
            <label class="block mb-1 text-sm text-gray-700">Ներկա դրույք</label>
            <div class="flex gap-2">
              <input
                  v-model.number="baseRate"
                  type="number"
                  min="0"
                  step="0.01"
                  class="w-full px-3 py-2 rounded-xl border border-gray-300"
              />
              <span class="inline-flex items-center px-3 py-2 rounded-xl border border-gray-300 bg-gray-50">
                {{ currency || 'AMD' }}
              </span>
            </div>
            <p v-if="rateError" class="text-xs text-red-600 mt-1">{{ rateError }}</p>
          </div>

          <!-- Upload documents (one file per type) -->
          <div>
            <div class="text-sm font-medium mb-2">Կցել փաստաթղթեր</div>

            <div class="rounded-xl border bg-white overflow-hidden">
              <div v-if="!docTypes.length" class="p-3 text-slate-500 text-sm">
                Պահանջվող փաստաթղթեր չկան
              </div>

              <div v-else class="divide-y">
                <div v-for="t in docTypes" :key="t.id" class="p-3 space-y-2">
                  <div class="flex items-center gap-2">
                    <span class="font-medium">{{ t.name }}</span>
                    <span v-if="t.required" class="text-red-600 text-xs">★ պարտադիր</span>
                  </div>

                  <input
                      type="file"
                      :accept="fileAccept"
                      @change="e => onFileChange(t.id, e)"
                      class="w-full px-3 py-2 rounded-xl border border-gray-300"
                  />

                  <p v-if="showRequired && t.required && !uploads[t.id]" class="text-xs text-red-600">
                    Պարտադիր է
                  </p>

                  <div v-if="uploads[t.id]" class="text-xs text-slate-500">
                    Ընտրված՝ {{ uploads[t.id]?.name }}
                  </div>
                </div>
              </div>
            </div>

            <p v-if="showRequired && !docsOk" class="text-xs text-red-600 mt-2">
              Խնդրում ենք վերբեռնել բոլոր պարտադիր փաստաթղթերը
            </p>
          </div>

          <!-- History list: base rate + documents -->
          <div>
            <div class="text-sm font-medium mb-2">Պատմություն</div>
            <div class="rounded-xl border border-gray-300 bg-white overflow-hidden">
              <div v-if="historyLoading" class="p-3 text-slate-500">Բեռնվում է…</div>
              <div v-else-if="!updates.length" class="p-3 text-slate-500 text-sm">
                Տվյալներ չկան
              </div>
              <div v-else class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead class="bg-gray-50 text-left">
                  <tr>
                    <th class="px-3 py-2 whitespace-nowrap">Դրույք</th>
                    <th class="px-3 py-2">Փաստաթղթեր</th>
                  </tr>
                  </thead>
                  <tbody>
                  <tr
                      v-for="(row, idx) in updates"
                      :key="row.id || idx"
                      class="border-t select-none hover:bg-gray-50"
                  >
                    <td class="px-3 py-2 whitespace-nowrap">
                      <div class="flex flex-col gap-y-2">
                        <p>{{ $money(row.base_rate) }}</p>
                        <span v-if="row.updated_at" class="text-xs text-slate-500">{{ formatDate(row.updated_at) }}</span>
                      </div>
                    </td>
                    <td class="px-3 py-2">
                      <div v-if="!row.documents?.length" class="text-slate-500 text-xs">
                        Փաստաթուղթ չկա
                      </div>
                      <div v-else class="flex flex-wrap gap-2">
                        <a
                            v-for="d in row.documents"
                            :key="d.id"
                            :href="d.url || d.full_path"
                            target="_blank"
                            rel="noopener"
                            class="inline-flex items-center gap-2 px-2 py-1 text-xs rounded-md border border-gray-300 hover:bg-gray-50"
                            download
                        >
                            <span class="truncate max-w-[200px]">
                              {{ d.type_name || d.type?.name || d.name || ('Փաստաթուղթ #' + d.id) }}
                            </span>
                          <span class="text-blue-400">Բեռնել</span>
                        </a>
                      </div>
                    </td>
                  </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- Footer -->
      <div class="p-4 border-t flex items-center justify-between gap-2">
        <button
            class="px-3 py-2 rounded-xl border border-gray-300 hover:bg-gray-50"
            @click="$emit('close')"
            :disabled="saving"
        >
          Փակել
        </button>
        <button
            class="px-3 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
            :disabled="saving || !canSave"
            @click="save"
        >
          <span v-if="saving">Պահպանում…</span>
          <span v-else>Պահպանել</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { contractsApi } from '@/api.ts'

/**
 * Props:
 * - open: modal visibility
 * - employeeId: used to fetch doc types for active contract update
 * - contractId: active contract id (for history + update endpoint)
 * - initialBaseRate: current rate value to show in input
 * - currency: active contract currency symbol/code
 */
const props = defineProps<{
  open: boolean
  employeeId: number | null
  contractId: number | null
  initialBaseRate: number | null
  currency?: string
}>()

const emit = defineEmits<{ (e: 'close'): void; (e: 'saved'): void }>()

/** UI state */
const loading = ref(false)
const saving = ref(false)
const showRequired = ref(false)

/** Form state */
const baseRate = ref<number | null>(props.initialBaseRate ?? null)
watch(() => props.initialBaseRate, v => { baseRate.value = v ?? null })

/** Doc types (one file per required type) */
type DocType = { id: number; name: string; required?: boolean }
const docTypes = ref<DocType[]>([])
const fileAccept = '.pdf,image/*'
const uploads = ref<Record<number, File | null>>({})
function onFileChange(typeId: number, e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0] ?? null
  uploads.value = { ...uploads.value, [typeId]: file }
}

/** Validations */
const rateError = computed(() => {
  const v = baseRate.value
  if (v === null || v === undefined || v === ('' as any)) return 'Նշեք դրույքը'
  if (Number(v) < 0) return 'Դրական թիվ նշեք'
  return ''
})
const docsOk = computed(() =>
    docTypes.value.filter(t => !!t.required).every(t => !!uploads.value[t.id])
)
const canSave = computed(() =>
    !loading.value &&
    !saving.value &&
    !rateError.value &&
    (docsOk.value || !docTypes.value.some(t => t.required)) &&
    !!props.contractId
)

/** Load doc types needed for the update flow */
async function loadDocTypes() {
  if (!props.open || !props.employeeId) {
    docTypes.value = []
    return
  }
  loading.value = true
  try {
    const res = await contractsApi.getPriceDocTypes()
    const list = (res?.data ?? res) as any[]
    docTypes.value = Array.isArray(list)
        ? list.map(d => ({ id: d.id, name: d.name, required: !!(d.required ?? d.pivot?.required) }))
        : []
  } finally {
    loading.value = false
  }
}

/** ------- History (Base rate + Documents) ------- */
type HistoryDoc = { id: number; url?: string; full_path?: string; name?: string; type_name?: string; type?: { name?: string } }
type RateUpdateRow = {
  id: number
  base_rate: number
  currency?: string
  updated_at?: string
  documents?: HistoryDoc[]
}

const updates = ref<RateUpdateRow[]>([])
const historyLoading = ref(false)

async function loadUpdates() {
  if (!props.open || !props.contractId) {
    updates.value = []
    return
  }
  historyLoading.value = true
  try {
    // New endpoint returning list of past updates with docs (latest first or as provided)
    // Expected: [{ id, base_rate, currency?, updated_at?, documents: [...] }, ...]
    const res = await contractsApi.getPriceUpdatesList(props.employeeId, props.contractId)
    const list = (res?.data ?? res) as any[]
    updates.value = Array.isArray(list) ? list : []
  } finally {
    historyLoading.value = false
  }
}

function formatDate(s?: string) {
  if (!s) return '—'
  const d = new Date(s)
  return Number.isNaN(+d) ? s : d.toLocaleString()
}

/** Watchers / mount */
watch(() => props.open, (v) => { if (v) { loadDocTypes(); loadUpdates() } })
watch(() => props.employeeId, () => { if (props.open) loadDocTypes() })
watch(() => props.contractId, () => { if (props.open) loadUpdates() })
onMounted(() => { if (props.open) { loadDocTypes(); loadUpdates() } })

/** Save */
async function save() {
  showRequired.value = true
  if (!canSave.value || !props.contractId) return

  saving.value = true
  try {
    const fd = new FormData()
    fd.append('base_rate', String(baseRate.value ?? ''))

    // files
    let i = 0
    for (const t of docTypes.value) {
      const f = uploads.value[t.id]
      if (!f) {
        if (t.required) { saving.value = false; return } // guard (shouldn’t happen due to canSave)
        continue
      }
      fd.append(`documents[${i}][type_id]`, String(t.id))
      fd.append(`documents[${i}][documents][0]`, f)
      i++
    }

    await contractsApi.updateBaseRate(props.contractId, fd)
    emit('saved')
    emit('close')
  } finally {
    saving.value = false
  }
}
</script>
