<template>
  <div v-if="open" class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/30" @click="close"></div>
    <aside class="absolute right-0 top-0 h-screen w-full max-w-xl bg-white shadow-2xl flex flex-col">
      <div class="flex items-center justify-between px-5 py-3 border-b">
        <h3 class="text-lg font-semibold">ՀԴՄ սարք — կարգավորում</h3>
        <button class="px-3 py-1 rounded-xl border" @click="close">✕</button>
      </div>

      <div class="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div class="flex flex-col">
          <label class="text-sm mb-1">IP հասցե</label>
          <input v-model="form.ip_address" type="text" class="border rounded-xl px-3 py-2" placeholder="192.168.0.10" />
        </div>
        <div class="flex flex-col">
          <label class="text-sm mb-1">Պորտ</label>
          <input v-model.number="form.port" type="number" min="1000" max="9999" class="border rounded-xl px-3 py-2" placeholder="1025"/>
        </div>
        <div class="flex flex-col">
          <label class="text-sm mb-1">Գանձապահ</label>
          <input v-model="form.cashier" type="text" class="border rounded-xl px-3 py-2" placeholder="3" />
        </div>
        <div class="flex flex-col">
          <label class="text-sm mb-1">PIN (4 թվանշան)</label>
          <input v-model="form.pin" type="number" min="1000" max="9999" class="border rounded-xl px-3 py-2" placeholder="4321"/>
        </div>
        <div class="flex flex-col md:col-span-2">
          <label class="text-sm mb-1">Գաղտնաբառ</label>
          <input v-model="form.password" type="password" class="border rounded-xl px-3 py-2" />
        </div>
      </div>

      <div class="mt-auto p-4 border-t flex flex-wrap gap-2 justify-between">
        <div class="flex items-center gap-2 text-xs">
          <span class="inline-flex items-center px-2 py-0.5 rounded-full" :class="printerTested ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'">
            Թեստ՝ {{ printerTested ? 'կատարված' : 'չկա' }}
          </span>
          <span class="inline-flex items-center px-2 py-0.5 rounded-full" :class="printerActive ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'">
            Կարգավիճակ՝ {{ printerActive ? 'ակտիվ' : 'պասիվ' }}
          </span>
        </div>

        <div class="flex gap-2">
          <button class="px-3 py-2 rounded-xl border" @click="close">Փակել</button>
          <button class="px-3 py-2 rounded-xl bg-blue-600 text-white disabled:opacity-50" :disabled="saving" @click="save">
            Պահպանել
          </button>
          <button class="px-3 py-2 rounded-xl bg-indigo-600 text-white disabled:opacity-50" :disabled="!printerId || testing" @click="test">
            ԹԵՍՏ
          </button>
          <button class="px-3 py-2 rounded-xl bg-emerald-600 text-white disabled:opacity-50" :disabled="!printerId || !printerTested || activating" @click="activate">
            Ակտիվացնել սարքը
          </button>
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { sales } from '@/api'

const props = defineProps<{ open:boolean; cashRegister:any|null }>()
const emit  = defineEmits<{ (e:'update:open', v:boolean):void; (e:'saved'):void }>()
function close(){ emit('update:open', false) }

const form = ref<any>({
  ip_address: '',
  cashier: '',
  pin: '',
  port: '',
  password: '',
  cash_register_id: null,
})

const saving = ref(false)
const testing = ref(false)
const activating = ref(false)
const error = ref('')

const printerId = computed(() => props.cashRegister?.fiscal_printer?.id || props.cashRegister?.fiscal_printer?.fiscal_printer_id || null)
const printerTested = computed(() => !!props.cashRegister?.fiscal_printer?.tested)
const printerActive = computed(() => !!props.cashRegister?.fiscal_printer?.active)

watch(() => props.open, (o) => {
  if (!o) return
  form.value.cash_register_id = props.cashRegister?.id || null
  // prefill if exists
  if (props.cashRegister?.fiscal_printer) {
    const fp = props.cashRegister.fiscal_printer
    form.value.ip_address = fp.ip_address || ''
    form.value.cashier = fp.cashier || ''
    form.value.pin = fp.pin || ''
    form.value.port = fp.port || ''
    form.value.password = '' // never prefill password
  }
})

async function save(){
  if (!form.value.cash_register_id) { error.value = 'Սխալ դրամարկղ'; return }
  saving.value = true
  try{
    await sales.cashRegisters.fiscalPrinters.store({ ...form.value })
    emit('saved')
  } catch(e:any){ error.value = e?.message || 'Սխալ' }
  finally{ saving.value = false }
}

async function test(){
  if (!printerId.value) return
  testing.value = true
  try{
    await sales.cashRegisters.fiscalPrinters.test(Number(printerId.value))
    emit('saved')
  } catch(e:any){ error.value = e?.message || 'Սխալ' }
  finally{ testing.value = false }
}
async function activate(){
  if (!printerId.value) return
  activating.value = true
  try{
    await sales.cashRegisters.fiscalPrinters.activate(Number(printerId.value))
    emit('saved')
  } catch(e:any){ error.value = e?.message || 'Սխալ' }
  finally{ activating.value = false }
}
</script>
