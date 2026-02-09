<!-- src/components/ui/Autocomplete.vue -->
<template>
  <div class="space-y-2">
    <label
        v-if="label"
        :for="inputId"
        class="block text-sm font-medium text-slate-700"
    >
      {{ label }}
      <span v-if="required" class="text-red-600">*</span>
    </label>

    <div
        ref="root"
        class="relative"
        v-click-outside="() => (open = false)"
        @keydown.down.prevent="move(1)"
        @keydown.up.prevent="move(-1)"
        @keydown.enter.prevent="trySelect"
        @keydown.esc.prevent="open = false"
    >
      <div
          class="flex items-center gap-2 rounded-xl px-3 py-2 bg-white focus-within:ring-2"
          :class="error ? 'border border-red-300 focus-within:ring-red-500' : 'border border-slate-300 focus-within:ring-blue-500'"
      >
        <input
            :id="inputId"
            ref="inputRef"
            v-model="query"
            :placeholder="placeholder"
            class="w-full outline-none"
            @focus="open = true"
            @input="onInput"
            :aria-invalid="!!error"
            :aria-describedby="describedBy"
            :aria-required="required || undefined"
        />
        <button type="button" class="text-slate-400" @click="toggle()" aria-label="Toggle">▾</button>
      </div>

      <div
          v-if="open && filtered.length"
          class="absolute z-50 left-0 right-0 mt-1 bg-white rounded-xl shadow-2xl ring-1 ring-black/5 border border-slate-100 overflow-hidden"
      >
        <ul class="max-h-64 overflow-auto py-1">
          <li
              v-for="(opt, i) in filtered"
              :key="keyOf(opt, i)"
              @mousedown.prevent="select(opt)"
              @mouseenter="activeIndex = i"
              class="cursor-pointer"
          >
            <div
                :class="[
                'px-3 py-2 flex items-center justify-between',
                i === activeIndex ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50'
              ]"
            >
              <span class="truncate">{{ labelOf(opt) }}</span>
              <span v-if="suffixOf" class="text-xs text-slate-400 ml-3">{{ suffixOf(opt) }}</span>
            </div>
            <div class="h-px bg-slate-100 last:hidden"></div>
          </li>
        </ul>
        <div class="px-3 py-2 text-xs text-slate-400 bg-slate-50 border-t border-slate-100">
          ↑/↓ navigate · Enter select · Esc close
        </div>
      </div>
    </div>

    <p v-if="hint && !error" :id="hintId" class="text-xs text-slate-500">{{ hint }}</p>
    <p v-if="error" :id="errorId" class="text-xs text-red-600">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
type AnyObj = Record<string, any>

const props = defineProps<{
  modelValue: AnyObj | string | number | null
  options: AnyObj[]
  placeholder?: string
  optionLabel?: string
  optionKey?: string
  filterKeys?: string[]
  suffixOf?: ((o: AnyObj) => string) | null
  label?: string
  required?: boolean
  hint?: string
  error?: string
  id?: string
  /** NEW: emit label string instead of whole object (default: true) */
  emitLabel?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: AnyObj | string | number | null): void
  (e: 'select', v: AnyObj): void
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const root = ref<HTMLElement | null>(null)
const open = ref(false)
const query = ref('')
const activeIndex = ref(0)

const baseId = props.id || `ac-${Math.random().toString(36).slice(2, 9)}`
const inputId = `${baseId}-input`
const hintId = `${baseId}-hint`
const errorId = `${baseId}-error`
const describedBy = computed(() => (props.error ? errorId : props.hint ? hintId : undefined))

const labelKey = computed(() => props.optionLabel ?? 'name')
const keyKey   = computed(() => props.optionKey ?? 'id')
const searchFields = computed(() => props.filterKeys?.length ? props.filterKeys : [labelKey.value])

const labelOf = (o: AnyObj) => (o?.[labelKey.value] ?? `${o}`)
const keyOf   = (o: AnyObj, i: number) => o?.[keyKey.value] ?? `${i}`

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return props.options
  return props.options.filter(o =>
      searchFields.value.some(f => String(o?.[f] ?? '').toLowerCase().includes(q))
  )
})

function onInput() { open.value = true; activeIndex.value = 0 }
function move(dir: 1 | -1) {
  if (!open.value) { open.value = true; return }
  const len = filtered.value.length
  if (!len) return
  activeIndex.value = (activeIndex.value + dir + len) % len
}
function trySelect() { const opt = filtered.value[activeIndex.value]; if (opt) select(opt) }
function select(opt: AnyObj) {
  const value = props.emitLabel !== false ? labelOf(opt) : opt
  emit('update:modelValue', value)     // emits string by default
  emit('select', opt)                  // still provide full object to listeners
  open.value = false
  query.value = labelOf(opt)
  inputRef.value?.focus()
}
function toggle() { open.value = !open.value; if (open.value) inputRef.value?.focus() }

/** Keep input display in sync with external model (string or object) */
watch(() => props.modelValue, (v) => {
  if (v && typeof v === 'object') {
    query.value = labelOf(v as AnyObj)
  } else if (v !== null && v !== undefined) {
    query.value = String(v)
  } else {
    query.value = ''
  }
}, { immediate: true })
</script>
