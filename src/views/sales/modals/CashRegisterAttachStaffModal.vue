<template>
  <div v-if="open" class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/30" @click="close"></div>
    <aside class="absolute right-0 top-0 h-screen w-full max-w-lg bg-white shadow-2xl flex flex-col">
      <div class="flex items-center justify-between px-5 py-3 border-b">
        <h3 class="text-lg font-semibold">Կցել աշխատակիցներ</h3>
        <button class="px-3 py-1 rounded-xl border" @click="close">✕</button>
      </div>

      <div class="p-5 space-y-3">
        <VueSelect
            v-model="staffIds"
            :options="staffOpts"
            :is-multi="true"
            :is-searchable="true"
            :filterable="false"
            :loading="loading"
            placeholder="Որոնել աշխատակցի…"
            :get-option-label="o => o.name"
            :get-option-value="o => o.id"
            @open="searchStaff('')"
            @search="q => searchStaff(q)"
        />
        <p v-if="error" class="text-xs text-rose-600">{{ error }}</p>
      </div>

      <div class="mt-auto p-4 border-t flex gap-2 justify-end">
        <button class="px-4 py-2 rounded-xl border" @click="close">Փակել</button>
        <button class="px-4 py-2 rounded-xl bg-blue-600 text-white disabled:opacity-50"
                :disabled="saving || !staffIds.length" @click="submit">
          Պահպանել
        </button>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import VueSelect from 'vue3-select-component'
import { sales, org } from '@/api'

const props = defineProps<{ open:boolean; cashRegisterId:number|null }>()
const emit  = defineEmits<{ (e:'update:open', v:boolean):void; (e:'saved'):void }>()
function close(){ emit('update:open', false) }

const staffIds = ref<string[]>([])
const staffOpts = ref<any[]>([])
const loading = ref(false)
const saving  = ref(false)
const error   = ref('')

watch(() => props.open, (o) => {
  if (!o) return
  staffIds.value = []
})

async function searchStaff(q:string|null){
  loading.value = true
  try{
    const { data } = await org.users.search({ limit: 20, offset: 0, search: q && q.trim()!=='' ? q : null })
    const arr = Array.isArray(data?.data?.data) ? data.data.data : (Array.isArray(data) ? data : [])
    staffOpts.value = arr.map((u:any)=>({ id:String(u.id), name: u.name || u.email || ('user#'+u.id) }))
  } finally { loading.value = false }
}

async function submit(){
  if (!props.cashRegisterId) return
  saving.value = true
  try{
    await sales.cashRegisters.attachStaff(props.cashRegisterId, { staff_ids: staffIds.value.map(Number) })
    emit('saved'); close()
  } catch(e:any){ error.value = e?.message || 'Սխալ' }
  finally{ saving.value = false }
}

watch(() => props.open, async (v) => {
  if(props.open) {
    await searchStaff()
  }
});
</script>
