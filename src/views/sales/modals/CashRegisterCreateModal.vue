<template>
  <div v-if="open" class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/30" @click="close"></div>
    <aside class="absolute right-0 top-0 h-screen w-full max-w-lg bg-white shadow-2xl flex flex-col">
      <div class="flex items-center justify-between px-5 py-3 border-b">
        <h3 class="text-lg font-semibold">Ավելացնել դրամարկղ</h3>
        <button class="px-3 py-1 rounded-xl border" @click="close">✕</button>
      </div>
      <div class="px-4 py-4 flex flex-col gap-y-2">
        <div class="flex flex-col gap-y-2">
          <label class="text-sm font-medium text-slate-700">Ընտրել պահեստ</label>
          <VueSelect
              v-model="storageId"
              :options="storageOpts"
              :loading="loading.storages"
              :is-searchable="true"
              :filterable="false"
              placeholder="Ընտրել"
              :get-option-label="o => o.name"
              :get-option-value="o => o.id"
              @open="fetchStorages('')"
              @search="q => fetchStorages(q)"
          />
          <p v-if="error" class="text-xs text-rose-600">{{ error }}</p>
        </div>

        <div class="mt-auto flex gap-2 justify-end">
          <button class="px-4 py-2 rounded-xl border" @click="close">Փակել</button>
          <button class="px-4 py-2 rounded-xl bg-blue-600 text-white disabled:opacity-50"
                  :disabled="saving || !storageId" @click="submit">
            Պահպանել
          </button>
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import {ref, watch} from 'vue'
import VueSelect from 'vue3-select-component'
import { sales, org } from '@/api'

const props = defineProps<{ open: boolean }>()
const emit  = defineEmits<{ (e:'update:open', v:boolean):void; (e:'saved'):void }>()
function close(){ emit('update:open', false) }

const storageId = ref<string>('')
const storageOpts = ref<any[]>([])
const loading = ref({ storages:false })
const saving = ref(false)
const error  = ref('')

async function fetchStorages(q:string|null){
  loading.value.storages = true
  try{
    const { data } = await org.storages.search({ limit:20, offset:0, search:q && q.trim()!=='' ? q : null })
    const arr = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : [])
    storageOpts.value = arr.map((s:any)=>({ id:String(s.id), name:String(s.address || ('storage#'+s.id)) }))
  } finally { loading.value.storages = false }
}

async function submit(){
  if (!storageId.value) { error.value = 'Ընտրեք պահեստը'; return }
  saving.value = true
  try{
    await sales.cashRegisters.store({ storage_id: Number(storageId.value) })
    emit('saved'); close()
  } catch (e:any){ error.value = e?.message || 'Սխալ' }
  finally{ saving.value = false }
}

watch(() => props.open, async (v) => {
  if(props.open) {
    await fetchStorages()
  }
});
</script>
