<template>
  <div class="flex flex-col gap-y-2">
    <label class="text-sm font-medium text-slate-700">
      {{ label || 'Ապրանք' }} <span v-if="required" class="text-red-600">*</span>
    </label>

    <VueSelect
        v-model="selectedId"
        :options="options"
        :get-option-label="o => o.name"
        :get-option-value="o => o.id"
    :is-multi="false"
    :filterable="false"
    :is-searchable="true"
    :loading="loading"
    placeholder="Ընտրել ապրանք"
    :noResults="'Արդյունք չի գտնվել'"
    @open="onOpen"
    @search="onSearch"
    @clear="onClear"
    >
    <template #no-options>Արդյունք չի գտնվել</template>

    <!-- Dropdown option row with characteristics -->
    <template #option="{ option }">
      <div class="flex flex-col">
        <div class="font-medium">{{ option.name }}</div>
        <div
            v-if="Array.isArray(option.characteristics) && option.characteristics.length"
            class="mt-1 flex flex-wrap gap-1"
        >
            <span
                v-for="(c, i) in option.characteristics.slice(0, 4)"
                :key="i"
                class="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600"
            >
              {{ c.name }}
            </span>
          <span
              v-if="option.characteristics.length > 4"
              class="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600"
          >
              +{{ option.characteristics.length - 4 }}
            </span>
        </div>
      </div>
    </template>

    <!-- Selected value with characteristics (compact) -->
    <template #selected-option="{ option }">
      <div class="flex items-center gap-2">
        <span class="font-medium">{{ option.name }}</span>
        <div
            v-if="Array.isArray(option.characteristics) && option.characteristics.length"
            class="hidden sm:flex flex-wrap gap-1"
        >
            <span
                v-for="(c, i) in option.characteristics.slice(0, 3)"
                :key="i"
                class="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600"
            >
              {{ c.name }}
            </span>
          <span
              v-if="option.characteristics.length > 3"
              class="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600"
          >
              +{{ option.characteristics.length - 3 }}
            </span>
        </div>
      </div>
    </template>

    <!-- Some libs use #selected instead -->
    <template #selected="{ option }">
      <div class="flex items-center gap-2">
        <span class="font-medium">{{ option.name }}</span>
        <div
            v-if="Array.isArray(option.characteristics) && option.characteristics.length"
            class="hidden sm:flex flex-wrap gap-1"
        >
            <span
                v-for="(c, i) in option.characteristics.slice(0, 3)"
                :key="i"
                class="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600"
            >
              {{ c.name }}
            </span>
          <span
              v-if="option.characteristics.length > 3"
              class="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600"
          >
              +{{ option.characteristics.length - 3 }}
            </span>
        </div>
      </div>
    </template>
    </VueSelect>

    <p v-if="error" class="text-xs text-red-600">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import VueSelect from 'vue3-select-component'
import { productsApi } from '@/api'

type MeasureType = null | 'weight' | 'length' | 'capacity'
type DropdownProduct = {
  id: number
  name: string
  measure_type?: MeasureType | null
  characteristics?: { name: string }[]
}

const props = defineProps<{
  modelValue: DropdownProduct | null
  label?: string
  required?: boolean
  error?: string
}>()
const emit = defineEmits<{ (e: 'update:modelValue', v: DropdownProduct | null): void }>()

const options = ref<DropdownProduct[]>([])   // ALWAYS an array
const selectedId = ref<number | null>(null)  // <-- number to match get-option-value
const loading = ref(false)

// Normalize server response to option shape
function mapProducts(arr: any[]): DropdownProduct[] {
  return (arr || []).map((p: any) => {
    const raw = Array.isArray(p.characteristics) ? p.characteristics : []
    // tolerate {name} or {type,value}
    const characteristics = raw.map((c: any) =>
        c?.name
            ? { name: String(c.name) }
            : { name: [c?.type, c?.value].filter(Boolean).join(': ') }
    )
    return {
      id: Number(p.id),
      name: String(p.name ?? ''),
      measure_type: p.measure_type ?? null,
      characteristics,
    }
  })
}

async function fetchProducts(search: string | null) {
  loading.value = true
  try {
    const data = await productsApi.search({
      limit: 50,
      offset: 0,
      // when search is '', send null so backend treats it as no filter
      search: search && search.trim() !== '' ? search : null,
    })
    const arr = data
    options.value = mapProducts(arr)
    // keep preselected id if provided
    if (props.modelValue?.id) selectedId.value = Number(props.modelValue.id)
  } finally {
    loading.value = false
  }
}

/* vue-select events */
function onOpen() { fetchProducts(null) }
function onSearch(q: string) { fetchProducts(q ?? null) }
function onClear() { fetchProducts(null) }

/* emit chosen product object to parent */
watch(selectedId, (id) => {
  const found = options.value.find(o => o.id === id) || null
  emit('update:modelValue', found)
})

/* keep internal id in sync with external v-model */
watch(
    () => props.modelValue,
    (v) => {
      selectedId.value = v?.id != null ? Number(v.id) : null
    },
    { immediate: true }
)

onMounted(() => fetchProducts(null))
</script>
