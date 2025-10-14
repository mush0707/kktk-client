<!-- src/views/hr/VacancyFormModal.vue -->
<template>
  <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      @keydown.esc="$emit('close')"
  >
    <div class="absolute inset-0 bg-black/30" @click="handleClose"></div>

    <div class="relative bg-white rounded-2xl w-full max-w-xl shadow-xl overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b">
        <div class="text-lg font-semibold">{{ title }}</div>
        <button class="px-3 py-1 rounded-xl border hover:bg-gray-50" @click="handleClose">✕</button>
      </div>

      <!-- Body -->
      <div class="p-4 grid grid-cols-1 gap-4 text-sm" @keydown.enter.prevent="trySave">
        <!-- Slots (required) -->
        <div>
          <div class="text-slate-500 mb-1">{{ t('slots') || 'Սլոթերի թիվը' }}</div>
          <input
              type="number"
              min="1"
              step="1"
              v-model.number="form.slots"
              @input="enforceMin"
              class="w-full border rounded-xl px-3 py-2"
          />
          <p v-if="slotsError" class="text-xs text-red-600 mt-1">{{ slotsError }}</p>
        </div>

        <!-- Optional Title -->
        <div>
          <div class="text-slate-500 mb-1">{{ t('title') || 'Վերնագիր' }}</div>
          <input
              type="text"
              v-model.trim="form.title"
              class="w-full border rounded-xl px-3 py-2"
              :placeholder="t('optional') || 'ըստ ցանկության'"
          />
        </div>

        <!-- Optional Description -->
        <div>
          <div class="text-slate-500 mb-1">{{ t('description') || 'Նկարագրություն' }}</div>
          <textarea
              v-model="form.description"
              rows="5"
              class="w-full border rounded-xl px-3 py-2"
              :placeholder="t('optional') || 'ըստ ցանկության'"
          ></textarea>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-4 border-t flex items-center justify-end gap-2">
        <button
            class="px-3 py-2 rounded-xl border hover:bg-gray-50"
            @click="handleClose"
            :disabled="saving"
        >
          {{ t('cancel') || 'Չեղարկել' }}
        </button>
        <button
            class="px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
            @click="trySave"
            :disabled="saving"
        >
          <span v-if="saving">{{ t('saving') || 'Պահպանում…' }}</span>
          <span v-else>{{ t('save') || 'Պահպանել' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, watch, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { vacancyApi } from '@/api.js'

const { t } = useI18n({ useScope: 'global' })

const props = defineProps({
  open: { type: Boolean, default: false },
  row: { type: Object, default: null },             // may contain role_position & vacancy
  rolePositionId: { type: Number, default: null },  // fallback to row?.id or row?.role_position?.id
  initial: { type: Object, default: null }          // { slots, title, description }
})
const emit = defineEmits(['close', 'saved'])

/* ----- state ----- */
const form = reactive({
  slots: 1,
  title: '',
  description: ''
})
const saving = ref(false)
const slotsError = ref('')

/* ----- derived ----- */
const isEdit = computed(() => !!(props.row?.vacancy?.id))
const title = computed(() =>
    isEdit.value ? (t('edit_vacancy') || 'Խմբագրել թափուրը') : (t('new_vacancy') || 'Նոր թափուր')
)


/* track pristine vs dirty to disable Save when unchanged */
const original = ref({ slots: 1, title: '', description: '' })
const isDirty = computed(() =>
    Number(form.slots) !== Number(original.value.slots) ||
    (form.title || '') !== (original.value.title || '') ||
    (form.description || '') !== (original.value.description || '')
)

/* ----- helpers ----- */
function rolePosId() {
  return props.rolePositionId
      ?? props.row?.role_position_id
      ?? props.row?.id
      ?? props.row?.role_position?.id
      ?? null
}

function enforceMin() {
  if (form.slots == null || isNaN(form.slots)) form.slots = 1
  if (form.slots < 1) form.slots = 1
  form.slots = Math.trunc(Number(form.slots))
  slotsError.value = Number(form.slots) < 1 ? (t('min_one_slot') || 'Ամենաքիչը 1 սլոթ') : ''
}

function loadFromSources() {
  // Source priority: row.vacancy -> initial -> defaults
  const src =
      (props.row?.vacancy
          ? { slots: props.row.vacancy.slots, title: props.row.vacancy.title, description: props.row.vacancy.description }
          : null)
      ?? props.initial
      ?? { slots: 1, title: '', description: '' }

  form.slots = Number(src?.slots ?? 1)
  form.title = src?.title ?? ''
  form.description = src?.description ?? ''
  enforceMin()

  // keep a snapshot for dirty check
  original.value = {
    slots: Number(form.slots),
    title: form.title || '',
    description: form.description || ''
  }
}

function resetAll() {
  saving.value = false
  slotsError.value = ''
  form.slots = 1
  form.title = ''
  form.description = ''
  original.value = { slots: 1, title: '', description: '' }
}

/* open/init watchers */
watch(
    () => props.open,
    (o) => {
      if (o) loadFromSources()
      else resetAll()
    },
    { immediate: true }
)

watch(
    () => props.initial,
    () => {
      if (props.open) loadFromSources()
    }
)

/* ----- actions ----- */
function handleClose() {
  // keep state clean for next open
  resetAll()
  emit('close')
}

async function trySave() {
  if (saving.value) return
  await save()
}

async function save() {
  saving.value = true
  try {
     const payload = {
      role_position_id: rolePosId(),
      slots: Number(form.slots),
      title: form.title || null,
      description: form.description || null
    }

    let saved
    if (isEdit.value && props.row?.vacancy?.id) {
      // UPDATE
      saved = await vacancyApi.update(props.row.vacancy.id, payload)
    } else {
      // CREATE (role_position_id is required)
      if (!payload.role_position_id) {
        throw new Error('role_position_id is required for creating vacancy')
      }
      saved = await vacancyApi.create(payload)
    }

    // emit saved so parent can reload/patch table; pass through response if useful
    emit('saved', saved?.data ?? saved)
    handleClose()
  } catch (e) {
    console.error(e)
    // try to surface backend validation nicely if present
    const msg =
        e?.response?.data?.message ||
        e?.message ||
        (t('save_failed') || 'Պահպանումը ձախողվեց')
   } finally {
    saving.value = false
  }
}
</script>

<style scoped>
</style>
