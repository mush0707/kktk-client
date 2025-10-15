<template>
  <div ref="root" class="relative w-[420px]" @keydown.stop>
    <!-- Selected pills + search input -->
    <div
        class="flex items-center flex-wrap gap-1 border rounded-xl px-2 py-2 bg-white focus-within:ring-2 focus-within:ring-blue-500"
        @click="openDropdown"
    >
      <!-- selected chips with remove -->
      <span
          v-for="(item, i) in internal"
          :key="chipKey(item, i)"
          class="inline-flex items-center gap-1 text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200"
      >
        <span class="font-medium">{{ i+1 }}.</span>
        <span>{{ item.name }}</span>
        <button type="button" class="hover:text-blue-900" title="Remove" @click.stop="toggle(item)">×</button>
      </span>

      <!-- search input -->
      <input
          ref="inputRef"
          v-model="query"
          :placeholder="placeholder"
          class="flex-1 min-w-[120px] border-0 border-gray-300 outline-none text-sm py-1"
          @keydown.down.prevent="move(1)"
          @keydown.up.prevent="move(-1)"
          @keydown.enter.prevent="enterSelect"
          @keydown.esc.prevent="closeDropdown"
          @focus="openDropdown"
      />
    </div>

    <!-- actions -->
    <div class="flex items-center gap-2 mt-2">
      <button
          class="px-3 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
          :disabled="saving"
          @click="$emit('save', normalized()); closeDropdown()"
      >
        {{ saveLabel }}
      </button>
      <button
          class="px-3 py-2 rounded-xl border hover:bg-gray-50"
          :disabled="saving"
          @click="clearAll(); closeDropdown()"
      >
        {{ clearLabel }}
      </button>
    </div>

    <!-- Dropdown via teleport to body, fixed positioning -->
    <teleport to="body">
      <div
          v-if="open"
          ref="dropRef"
          class="fixed z-[2000]"
          :style="dropdownStyle"
          @mousedown.stop
          @touchstart.stop
      >
        <div class="bg-white border border-gray-300 rounded-xl shadow-xl max-h-72 overflow-auto w-[420px]">


          <!-- options -->
          <div v-if="displayed.length === 0" class="px-3 py-3 text-sm text-slate-500">
            {{ noResultsText }}
          </div>

          <button
              v-for="(opt, idx) in displayed"
              :key="optKey(opt, idx)"
              type="button"
              class="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-50"
              :class="{ 'bg-gray-100': idx === hi }"
              @mousemove="hi = idx"
              @click="toggle(opt)"
          >
            <input type="checkbox" class="rounded border-gray-300" :checked="isSelected(opt)" @change.prevent />
            <span class="flex-1 truncate">{{ opt.name }}</span>
          </button>

          <!-- footer status -->
          <div class="px-3 py-2 text-[11px] text-slate-500 border-t flex items-center justify-between">
            <span v-if="query && !allLoaded">Searching more pages…</span>
            <span v-else>{{ displayed.length }} / {{ totalShown }} {{$t('shown')}}</span>
            <button
                v-if="query && !allLoaded"
                class="text-xs underline"
                @click="exhaustSearch"
            >Load all for this search</button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },   // [{id, name}]
  options: { type: Array, default: () => [] },      // initial page (<= softLimit)
  // Called during search to fetch further pages beyond the initial 200
  // fetchMore(offset:number) => Promise<Array<{id,name}>> (page size should match pageSize)
  fetchMore: { type: Function, default: null },
  pageSize: { type: Number, default: 200 },
  placeholder: { type: String, default: 'Select stages…' },
  saving: { type: Boolean, default: false },
  saveLabel: { type: String, default: 'Պահպանել փուլերը' },
  clearLabel: { type: String, default: 'Մաքրել' },
  noResultsText: { type: String, default: 'Չկան արդյունքներ' },
})

const emit = defineEmits(['update:modelValue', 'save', 'clear', 'search'])

/* state */
const open = ref(false)
const query = ref('')
const hi = ref(-1)
const inputRef = ref(null)
const root = ref(null)
const dropRef = ref(null)

const softLimit = computed(() => props.pageSize)
const softLimited = computed(() => props.options.length >= props.pageSize)

/* internal selected */
const internal = ref([...props.modelValue])

function arraysEqual(a, b) {
  if (a.length !== b.length) return false
  return a.every((el, i) => el.id === b[i].id && el.name === b[i].name)
}

watch(() => props.modelValue, v => {
  if (!arraysEqual(v || [], internal.value)) {
    internal.value = [...(v || [])]
  }
})

watch(internal, v => {
  if (!arraysEqual(v || [], props.modelValue)) {
    emit('update:modelValue', v)
  }
})
/* dropdown fixed position */
const dropdownStyle = ref({ top: '0px', left: '0px', width: '420px' })
function positionDropdown() {
  const el = root.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const top = rect.bottom + 6
  const left = rect.left
  dropdownStyle.value = { top: `${50}%`, left: `${left}px`, width: `${Math.max(rect.width, 420)}px` }
}
function openDropdown() {
  open.value = true
  nextTick(() => {
    positionDropdown()
    inputRef.value?.focus()
  })
}
function closeDropdown() { open.value = false }

/* robust outside-click close (works with teleport) */
function handleGlobalPointer(e) {
  const r = root.value
  const d = dropRef.value
  const target = e.target
  if (r && r.contains(target)) return
  if (d && d.contains(target)) return
  closeDropdown()
}
function handleWindowBlur() { closeDropdown() }

onMounted(() => {
  window.addEventListener('scroll', positionDropdown, true)
  window.addEventListener('resize', positionDropdown, true)
  document.addEventListener('mousedown', handleGlobalPointer, true)
  document.addEventListener('touchstart', handleGlobalPointer, true)
  window.addEventListener('blur', handleWindowBlur)
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', positionDropdown, true)
  window.removeEventListener('resize', positionDropdown, true)
  document.removeEventListener('mousedown', handleGlobalPointer, true)
  document.removeEventListener('touchstart', handleGlobalPointer, true)
  window.removeEventListener('blur', handleWindowBlur)
})

/* filtering & progressive search */
const baseOptions = ref([...props.options]) // first <= 200 options
watch(() => props.options, v => { baseOptions.value = [...(v || [])] })

// Storage for extra pages loaded during search
const extraOptions = ref([])  // only appended when query is non-empty
const allLoaded = ref(false)  // true after fetchMore returns < pageSize for search session
const totalShown = computed(() => baseOptions.value.length + extraOptions.value.length)

watch(query, async (q) => {
  emit('search', q)
  hi.value = -1
  if (!q) {
    extraOptions.value = []
    allLoaded.value = false
    return
  }
  if (!props.fetchMore) return
  await ensureSearchCoverage(q)
})

const displayed = computed(() => {
  const q = (query.value || '').trim().toLowerCase()
  const source = q ? baseOptions.value.concat(extraOptions.value) : baseOptions.value
  if (!q) return source
  return source.filter(o => (o.name || '').toLowerCase().includes(q))
})

async function ensureSearchCoverage(q) {
  if (allLoaded.value) return
  let offset = baseOptions.value.length + extraOptions.value.length
  let safety = 20
  let found = displayed.value.length
  while (found === 0 && safety-- > 0) {
    const page = await props.fetchMore?.(offset)
    if (!Array.isArray(page) || page.length === 0) { allLoaded.value = true; break }
    for (const it of page) {
      const nm = (it.name || '').trim()
      if (!nm) continue
      if (!existsByName(nm)) extraOptions.value.push({ id: it.id ?? null, name: nm })
    }
    offset += page.length
    if (page.length < props.pageSize) allLoaded.value = true
    found = baseOptions.value.concat(extraOptions.value)
        .filter(o => (o.name||'').toLowerCase().includes(q.toLowerCase())).length
  }
}

function exhaustSearch() {
  if (!props.fetchMore || allLoaded.value) return
  let offset = baseOptions.value.length + extraOptions.value.length
  const loop = async () => {
    const page = await props.fetchMore?.(offset)
    if (!Array.isArray(page) || page.length === 0) { allLoaded.value = true; return }
    for (const it of page) {
      const nm = (it.name || '').trim()
      if (!nm) continue
      if (!existsByName(nm)) extraOptions.value.push({ id: it.id ?? null, name: nm })
    }
    offset += page.length
    if (page.length < props.pageSize) { allLoaded.value = true; return }
    await loop()
  }
  loop()
}

/* selection utils */
function isSelected(opt) { return internal.value.some(it => equals(it, opt)) }
function toggle(opt) {
  if (isSelected(opt)) internal.value = internal.value.filter(it => !equals(it, opt))
  else internal.value = [...internal.value, { id: opt.id ?? null, name: opt.name }]
}
function clearAll() { internal.value = []; emit('clear') }
function normalized() { return internal.value.map((it, idx) => ({ id: it?.id ?? null, name: it?.name ?? '', order: idx + 1 })) }
function equals(a, b) {
  const aid = a?.id ?? null, bid = b?.id ?? null
  if (aid != null || bid != null) return String(aid) === String(bid)
  return (a?.name ?? '').toLowerCase() === (b?.name ?? '').toLowerCase()
}
function existsByName(nm) {
  const lc = nm.toLowerCase()
  return baseOptions.value.concat(extraOptions.value).some(x => (x.name||'').toLowerCase() === lc)
}
function chipKey(it, i) { return `${it.id ?? 'n'}-${i}-${it.name}` }
function optKey(it, i) { return `${it.id ?? 'n'}-o-${i}-${it.name}` }

/* keyboard */
function move(delta) {
  if (!open.value || displayed.value.length === 0) return
  hi.value = ((hi.value + delta + displayed.value.length) % displayed.value.length)
}
function enterSelect() {
  if (!open.value) return
  const opt = displayed.value[hi.value]
  if (opt) toggle(opt)
}
</script>

<style scoped>
/* dropdown is teleported and uses inline z-index; nothing extra needed here */
</style>
