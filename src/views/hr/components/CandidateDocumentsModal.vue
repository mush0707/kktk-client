<!-- src/views/hr/modals/CandidateDocumentsModal.vue -->
<template>
  <div v-if="open" class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/40" @click="$emit('close')"></div>

    <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl bg-white rounded-2xl shadow-xl">
      <!-- Header -->
      <div class="flex items-center justify-between px-5 py-4 border-b">
        <h3 class="text-lg font-semibold">
          {{ hasCandidate ? ($t('candidate_documents') || 'Թեկնածուի փաստաթղթեր') : ($t('create_candidate_documents') || 'Կցել փաստաթղթեր') }}
        </h3>
        <button aria-label="Close" class="p-2 rounded-lg hover:bg-gray-100" @click="$emit('close')">✕</button>
      </div>

      <!-- Modal body (scrollable) -->
      <div ref="modalBody" class="p-5 space-y-6 max-h-[80vh] overflow-y-auto">
        <!-- VIEW -->
        <template v-if="hasCandidate">
          <div v-if="candidateData?.id" class="space-y-4">
            <!-- Candidate info -->
            <div class="border rounded-2xl p-4 bg-slate-50">
              <div class="flex items-start gap-4">
                <div class="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-sm font-semibold">
                  {{ initials }}
                </div>
                <div class="flex-1">
                  <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <div class="text-base font-semibold">
                      {{ candidateData.first_name || '—' }} {{ candidateData.last_name || '' }}
                    </div>
                    <span class="text-xs px-2 py-0.5 rounded bg-gray-100">ID: {{ candidateData.id }}</span>
                  </div>

                  <div class="mt-2 grid sm:grid-cols-2 gap-2 text-sm">
                    <div>Email: <span class="font-medium">{{ candidateData.email || '—' }}</span></div>
                    <div>{{ $t('phone') || 'Հեռախոս' }}: <span class="font-medium">{{ candidateData.phone || '—' }}</span></div>
                  </div>

                  <div class="mt-3 text-xs text-gray-500">
                    {{ $t('documents') || 'Փաստաթղթեր' }}:
                    <span class="font-semibold">{{ docs.length }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Upload section -->
            <div id="upload-section" class="space-y-4">
              <div class="font-medium">{{ $t('attach') || 'Կցել' }}</div>
              <div v-for="t in types" :key="t.id" class="border border-gray-300 rounded-xl p-4">
                <div class="mb-2 flex items-center gap-2">
                  <span class="font-medium">{{ t.name }}</span>
                  <span v-if="t.required" class="text-red-600 text-xs">★ {{ $t('required_type') || 'պարտադիր տեսակ' }}</span>
                </div>
                <div class="grid md:grid-cols-3 gap-3 items-center">
                  <div class="md:col-span-2">
                    <input
                        :key="inputKeys[t.id] || 0"
                        :accept="t.accept || '.pdf,.doc,.docx,.png,.jpg,.jpeg'"
                        class="w-full px-3 py-2 rounded-xl border border-gray-500"
                        multiple
                        type="file"
                        @change="e => onFilesByType(t.id, e)"
                    />
                    <p v-if="uploads[t.id]?.length" class="text-xs text-gray-600 mt-1">
                      {{ uploads[t.id].length }} {{ $t('files_selected') || 'ֆայլ ընտրված' }}
                    </p>
                  </div>
                  <div class="flex justify-end">
                    <button
                        :disabled="saving || !(uploads[t.id]?.length)"
                        class="px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                        @click="uploadDocsByType(t.id)"
                    >
                      {{ $t('upload') || 'Վերբեռնել' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Documents table (scrollable with sticky header) -->
            <div v-if="docs.length" class="space-y-2" id="docs-section">
              <div class="font-medium">{{ $t('attached_documents') || 'Կցված փաստաթղթեր' }}</div>

              <div class="border border-gray-300 rounded-xl">
                <div class="overflow-x-auto">
                  <div ref="docsScroll" class="max-h-96 overflow-y-auto">
                    <table class="min-w-full text-sm">
                      <thead class="bg-gray-50 sticky top-0 z-10">
                      <tr class="text-left">
                        <th class="px-3 py-2">{{ $t('status') || 'Կարգավիճակ' }}</th>
                        <th class="px-3 py-2">{{ $t('type') || 'Տեսակ' }}</th>
                        <th class="px-3 py-2">{{ $t('file') || 'Ֆայլ' }}</th>
                        <th class="px-3 py-2">{{ $t('updated_at') || 'Թարմացվել է' }}</th>
                        <th class="px-3 py-2 w-0 text-right"></th>
                      </tr>
                      </thead>
                      <tbody>
                      <tr
                          v-for="doc in docs"
                          :key="doc.id"
                          :ref="el => { if (el) rowRefs.set(doc.id, el as HTMLTableRowElement) }"
                          class="border-t transition-colors"
                          :class="highlighted.has(doc.id) ? 'bg-emerald-50' : ''"
                      >
                        <td class="px-3 py-2">
                            <span
                                class="px-2 py-0.5 rounded text-xs"
                                :class="doc.archived_at || doc.status==='archived' ? 'bg-rose-50 text-rose-700' : 'bg-gray-100'"
                            >
                              {{ doc.status ? ($t(doc.status) || doc.status) : (doc.archived_at ? $t('archived') : $t('active')) }}
                            </span>
                        </td>
                        <td class="px-3 py-2">
                          {{ doc.type?.name || typeName(doc.type_id) || '—' }}
                        </td>
                        <td class="px-3 py-2 break-all">
                          <a
                              v-if="doc.full_path || doc.url"
                              :href="doc.full_path || doc.url"
                              class="underline underline-offset-2"
                              rel="noopener"
                              target="_blank"
                              download
                          >
                            {{ doc.name || ('#' + doc.id) }}
                          </a>
                          <span v-else>{{ doc.name || ('#' + doc.id) }}</span>
                        </td>
                        <td class="px-3 py-2">
                          <span :title="doc.updated_at">{{ formatDateTime(doc.updated_at) }}</span>
                          <span class="text-xs text-gray-400 ml-2">({{ fromNow(doc.updated_at) }})</span>
                        </td>
                        <td class="px-3 py-2 text-right">
                          <div class="flex flex-wrap gap-2 justify-end">
                            <a
                                v-if="doc.full_path || doc.url"
                                :href="doc.full_path || doc.url"
                                class="px-3 py-1 text-xs text-white bg-blue-600 rounded-md hover:bg-blue-700"
                                target="_blank"
                                download
                            >
                              {{ $t('download') || 'Ներբեռնել' }}
                            </a>
                            <button
                                v-if="!(doc.status==='archived' || doc.archived_at)"
                                :disabled="savingArchiveIds.has(doc.id)"
                                class="px-3 py-1 text-xs text-white bg-amber-600 rounded-md hover:bg-amber-700 disabled:opacity-50"
                                @click="onArchive(doc.id)"
                            >
                              {{ savingArchiveIds.has(doc.id) ? ($t('archiving') || 'Արխիվացում…') : ($t('archive') || 'Արխիվացնել') }}
                            </button>
                          </div>
                        </td>
                      </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="text-sm text-gray-500">
              {{ $t('empty') || 'Դատարկ է' }}
            </div>
          </div>

          <div v-else class="text-sm text-gray-500">
            {{ $t('loading') || 'Բեռնվում է…' }}
          </div>
        </template>

        <!-- CREATE -->
        <template v-else>
          <div class="rounded-xl border border-amber-200 bg-amber-50 text-amber-900 p-3 text-sm">
            {{ $t('candidate_required') || 'Փաստաթղթերը կցելու համար նախ պետք է պահպանված թեկնածու (ID)։' }}
          </div>
        </template>

        <!-- Footer -->
        <div class="flex items-center justify-end gap-2 pt-2 border-t">
          <button class="px-3 py-2 rounded-xl border hover:bg-gray-50" @click="$emit('close')">
            {{ $t('close') || 'Փակել' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch, nextTick, onBeforeUpdate } from 'vue'
import { candidateApi } from '@/api'
import { formatDateTime, fromNow } from '@/utils/dateFormat'

const props = defineProps<{
  open: boolean
  candidateId?: number | null
  candidate?: any | null
  withTrashed?: boolean
}>()

const emit = defineEmits<{ (e: 'close'): void; (e: 'saved'): void }>()

/* ===== State ===== */
const saving = ref(false)
const types = ref<Array<{ id: number; name: string; required: boolean; accept?: string }>>([])

const candidateData = ref<any | null>(null)
const docs = ref<any[]>([])
const uploads = ref<Record<number, File[]>>({})
const savingArchiveIds = ref<Set<number>>(new Set())
const inputKeys = ref<Record<number, number>>({})

/* Scroll refs */
const modalBody = ref<HTMLElement | null>(null)
const docsScroll = ref<HTMLElement | null>(null)
const rowRefs = new Map<number, HTMLTableRowElement>()
const highlighted = ref<Set<number>>(new Set())

onBeforeUpdate(() => {
  rowRefs.clear()
})

/* ===== Derived ===== */
const hasCandidate = computed(() => !!(props.candidate || props.candidateId))
const initials = computed(() => {
  const f = (candidateData.value?.first_name || '').trim()
  const l = (candidateData.value?.last_name || '').trim()
  return (f[0] || '').concat(l[0] || '').toUpperCase() || '👤'
})

/* ===== Helpers ===== */
function typeName(typeId?: number | null) {
  if (!typeId) return null
  const item = types.value.find(t => t.id === Number(typeId))
  return item?.name || null
}

function scrollModalTo(selector: string) {
  const root = modalBody.value
  if (!root) return
  const el = root.querySelector(selector) as HTMLElement | null
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function scrollDocsToTop() {
  if (docsScroll.value) docsScroll.value.scrollTo({ top: 0, behavior: 'smooth' })
}

function scrollToDocRow(id: number) {
  const row = rowRefs.get(id)
  if (row && docsScroll.value) {
    const container = docsScroll.value
    const top = row.offsetTop - 8
    container.scrollTo({ top, behavior: 'smooth' })
  } else if (row) {
    row.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

/* ===== Loaders ===== */
async function loadTypes() {
  try {
    const { data } = await candidateApi.getDocTypes()
    types.value = (data?.data ?? data ?? []).map((d: any) => ({
      id: Number(d.id),
      name: String(d.name),
      required: !!(d.required ?? d.pivot?.required),
      accept: d.accept
    }))
  } catch {
    types.value = []
  }
}

/** Кандидат: предпочитаем props.candidate, иначе — подгружаем по candidateId */
async function loadCandidate() {
  if (props.candidate) {
    candidateData.value = { ...props.candidate }
    docs.value = Array.isArray(props.candidate.documents) ? [...props.candidate.documents] : []
    return
  }
  if (!props.candidateId) {
    candidateData.value = null
    docs.value = []
    return
  }
  const { data } = await candidateApi.getById(props.candidateId)
  const c = data?.data ?? data ?? null
  candidateData.value = c
  docs.value = Array.isArray(c?.documents) ? c.documents : []
}

/* ===== Handlers ===== */
function onFilesByType(typeId: number, e: Event) {
  const files = Array.from((e.target as HTMLInputElement)?.files || []) as File[]
  uploads.value = { ...uploads.value, [typeId]: files }
}

async function uploadDocsByType(typeId: number) {
  if (!candidateData.value?.id) return
  const files = uploads.value[typeId] || []
  if (!files.length) return

  const prevIds = new Set(docs.value.map(d => d.id))

  saving.value = true
  try {
    const fd = new FormData()
    fd.append('type_id', String(typeId))
    for (const f of files) fd.append('documents[]', f)

    const resp = await candidateApi.updateDocuments(candidateData.value.id, fd)

    const payload = resp?.data?.data ?? resp?.data ?? resp
    const returnedDocs =
        (Array.isArray(payload?.documents) && payload.documents) ||
        (Array.isArray(payload) && payload) || null

    if (returnedDocs) {
      docs.value = returnedDocs
      candidateData.value.documents = returnedDocs
    } else {
      const { data } = await candidateApi.getById(candidateData.value.id)
      const fresh = data?.data ?? data ?? null
      docs.value = Array.isArray(fresh?.documents) ? fresh.documents : []
      candidateData.value = fresh || candidateData.value
    }

    await nextTick()
    const newIds = docs.value.map(d => d.id).filter(id => !prevIds.has(id))
    if (newIds.length) {
      newIds.forEach(id => highlighted.value.add(id))
      scrollModalTo('#docs-section')
      scrollToDocRow(newIds[0])
      setTimeout(() => {
        newIds.forEach(id => highlighted.value.delete(id))
      }, 1500)
    } else {
      scrollModalTo('#docs-section')
      scrollDocsToTop()
    }

    uploads.value[typeId] = []
    inputKeys.value[typeId] = (inputKeys.value[typeId] || 0) + 1
    emit('saved')
  } finally {
    saving.value = false
  }
}

async function onArchive(docId: number) {
  if (!candidateData.value?.id || !docId) return
  if (!confirm('Արխիվացնե՞լ փաստաթուղթը')) return
  savingArchiveIds.value.add(docId)
  try {
    await candidateApi.archiveDocument(candidateData.value.id, docId)
    const i = docs.value.findIndex(d => d.id === docId)
    if (i !== -1) {
      if ('status' in docs.value[i]) docs.value[i].status = 'archived'
      else docs.value.splice(i, 1)
    }
    emit('saved')
  } finally {
    savingArchiveIds.value.delete(docId)
  }
}

/* ===== Wiring ===== */
watch(
    [() => props.open, () => props.candidate, () => props.candidateId],
    async ([isOpen]) => {
      if (!isOpen) return
      await loadTypes()
      await loadCandidate()
      await nextTick()
      scrollModalTo('#upload-section')
    },
    { immediate: true }
)

/* ===== Expose date utils ===== */
defineExpose({ formatDateTime, fromNow })
</script>

<style scoped>
/* No custom styles required */
</style>
