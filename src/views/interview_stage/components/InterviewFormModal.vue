<template>
  <div v-if="open" class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/40" @click="$emit('close')"></div>

    <div
        class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                 max-w-md w-[480px] bg-white rounded-2xl shadow-xl"
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-5 py-4 border-b">
        <h3 class="text-lg font-semibold">
          {{ form.id ? 'Խմբագրել փուլը' : 'Նոր փուլ' }}
        </h3>
        <button class="p-2 rounded-lg hover:bg-gray-100" @click="$emit('close')" aria-label="Close">✕</button>
      </div>

      <!-- Body -->
      <div class="p-5 space-y-3">
        <div v-if="initialLoading" class="text-sm text-gray-500">Բեռնվում է…</div>
        <template v-else>
          <div>
            <label class="text-sm text-gray-600">
              Անվանում <span class="text-red-600">*</span>
            </label>
            <input
                v-model.trim="form.name"
                class="w-full px-3 py-2 rounded-xl border"
                :class="err('name')"
                placeholder="Տեխնիկական"
                aria-required="true"
                @keyup.enter="save"
            />
            <p v-if="errors.name" class="text-xs text-red-600 mt-1">{{ errors.name[0] }}</p>
          </div>

          <p v-if="serverError" class="text-xs text-red-600">{{ serverError }}</p>
        </template>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-end gap-2 px-5 py-4 border-t">
        <button class="px-3 py-2 rounded-xl border hover:bg-gray-50" @click="$emit('close')">Չեղարկել</button>
        <button
            class="px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            :disabled="saving || !canSave || initialLoading"
            @click="save"
        >
          Պահպանել
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted, onBeforeUnmount } from 'vue'
import { interviewStageApi } from '@/api.js' // uses your canonical api.js

const props = defineProps({
  open: Boolean,
  row: { type: Object, default: null },
  id: { type: [Number, String], default: null } // allow opening by id
})
const emit = defineEmits(['close', 'saved'])

/* Form (name only) */
const form = ref({
  id: null,
  name: ''
})

/* State */
const initialLoading = ref(false)
const saving = ref(false)
const serverError = ref('')

/* Validation */
const errors = ref({})
function err(field) {
  return errors.value?.[field] ? 'border-red-500' : ''
}
const canSave = computed(() => {

  const e = {}
  if (!form.value.name?.trim()) e.name = ['Պահանջվում է անվանում']
  errors.value = e
   return Object.keys(e).length === 0
})

/* Helpers */
function fillFromRow(v) {
  form.value = {
    id: v?.id ?? null,
    name: v?.name ?? ''
  }
}
function resetNewForm() {
  form.value = { id: null, name: '' }
  errors.value = {}
  serverError.value = ''
}

/* Fetch by id (minimal GET) */
async function fetchById(id) {
  if (!id) return
  initialLoading.value = true
  serverError.value = ''
  try {
    const { data } = await interviewStageApi.get(id)
    const row = data?.data ?? data ?? null
    if (row) fillFromRow(row)
  } catch (e) {
    serverError.value = 'Տվյալները բեռնել չհաջողվեց'
  } finally {
    initialLoading.value = false
  }
}

/* React to props */
watch(
    () => props.row,
    (v) => {
      errors.value = {}
      serverError.value = ''
      if (v?.id) fillFromRow(v)
      else if (!props.id) resetNewForm()
    },
    { immediate: true }
)

watch(
    () => props.id,
    async (newId) => {
      errors.value = {}
      serverError.value = ''
      if (newId && !props.row) {
        form.value.id = newId
        await fetchById(newId)
      } else if (!props.row) {
        resetNewForm()
      }
    },
    { immediate: true }
)

/* Save (create/update via purchasingPartnerApi) */
async function save() {
  if (!canSave.value || saving.value) return
  saving.value = true
  serverError.value = ''
  try {
    const payload = {
      id: form.value.id ?? props.id ?? null,
      name: form.value.name.trim()
    }

    let id = payload.id
    if (id) {
      await interviewStageApi.update(id, { name: payload.name })
    } else {
      const { data } = await interviewStageApi.create({ name: payload.name })
      id = data?.id ?? data?.data?.id ?? id
    }

    emit('saved', { id, name: payload.name })
  } catch (e) {
    // Best-effort 422 handling
    const r = e?.response
    if (r?.status === 422 && r?.data?.errors) {
      errors.value = r.data.errors
    } else {
      serverError.value = 'Պահպանելը ձախողվեց'
    }
  } finally {
    saving.value = false
  }
}

/* ESC to close */
function onEsc(e) {
  if (e.key === 'Escape') emit('close')
}
onMounted(() => window.addEventListener('keydown', onEsc))
onBeforeUnmount(() => window.removeEventListener('keydown', onEsc))
</script>
