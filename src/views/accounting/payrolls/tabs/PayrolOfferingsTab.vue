<template>
  <div class="flex justify-end">
    <button
        class="whitespace-nowrap bg-indigo-600 hover:bg-indigo-700 text-white px-3 text-sm py-1 rounded-lg"
        @click="openOfferingModal"
    >
      Ստեղծել կատարողական +
    </button>
  </div>

  <!-- Modal -->
  <div v-if="offeringModalOpen" class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/40" @click="closeOfferingModal"></div>
    <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl bg-white rounded-2xl shadow-xl">
      <div class="flex items-center justify-between px-5 py-4 border-b">
        <h3 class="text-lg font-semibold">Ստեղծել կատարողական</h3>
        <button class="p-2 rounded-lg hover:bg-gray-100" @click="closeOfferingModal" aria-label="Close">✕</button>
      </div>

      <div class="p-5 space-y-4 text-sm max-h-[70vh] overflow-y-auto">
        <div class="grid md:grid-cols-2 gap-4">
          <div class="flex flex-col gap-2 md:col-span-2">
            <label class="text-sm text-gray-700">Աշխատակից (Ք/Ի պայմանագիր) <span class="text-red-600">*</span></label>
            <VueSelect
                v-model="offForm.employee_id"
                :options="civilEmployeeOptions"
                :get-option-value="o => o.id"
                label="label"
                :filterable="true"
                :clearable="true"
                :loading="loadingCivilEmployees"
                @open="loadCivilEmployees('')"
                @search="loadCivilEmployees"
                placeholder="Ընտրել աշխատակցին…"
            />
            <p v-if="offFormError && !offForm.employee_id" class="text-xs text-red-600">Ընտրեք աշխատակցին</p>
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm text-gray-700">Վճարվող ամսաթիվ</label>
            <input type="date" v-model="offForm.payed_date" :min="offForm.finished_date || undefined" class="px-3 py-2 text-sm rounded-xl border border-gray-300">
          </div>

          <div class="grid grid-cols-2 gap-3 md:col-span-2">
            <div class="flex flex-col gap-1">
              <label class="text-sm text-gray-700">Սկիզբ</label>
              <input type="date" v-model="offForm.start_date" class="px-3 py-2 text-sm rounded-xl border border-gray-300">
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm text-gray-700">Ավարտ</label>
              <input type="date" v-model="offForm.finished_date" class="px-3 py-2 text-sm rounded-xl border border-gray-300">
            </div>
          </div>
        </div>

        <!-- Offerings Table -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <div class="font-medium">Աշխատանքներ</div>
            <button type="button" class="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50" @click="addOfferingRow">
              + Ավելացնել տող
            </button>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full text-sm border border-gray-200 rounded-xl">
              <thead class="bg-gray-50">
              <tr class="text-left">
                <th class="px-3 py-2 w-52">Տեսակ</th>
                <th class="px-3 py-2 w-72">Աշխատանք</th>
                <th class="px-3 py-2 text-right">Գումար</th>
                <th class="px-3 py-2 w-12"></th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="(r, idx) in offForm.offerings" :key="r._key" class="border-t">
                <td class="px-3 py-2 align-top">
                  <input v-model.trim="r.offering_type" @input="debouncedFetchType(idx)" placeholder="օր.՝ Մաքրություն" class="w-full px-3 py-2 rounded-lg border border-gray-300"/>
                  <ul v-if="typeSuggest[idx]?.length" class="mt-1 border rounded-lg bg-white shadow-sm max-h-32 overflow-auto">
                    <li v-for="opt in typeSuggest[idx]" :key="opt.value" class="px-3 py-1 hover:bg-gray-50 cursor-pointer" @click="pickType(idx, opt.label)">
                      {{ opt.label }}
                    </li>
                  </ul>
                </td>
                <td class="px-3 py-2 align-top">
                  <input v-model.trim="r.offering" @input="debouncedFetchOffering(idx)" placeholder="օր.՝ Մաքրել «Տարածք»" class="w-full px-3 py-2 rounded-lg border border-gray-300"/>
                  <ul v-if="offeringSuggest[idx]?.length" class="mt-1 border rounded-lg bg-white shadow-sm max-h-32 overflow-auto">
                    <li v-for="opt in offeringSuggest[idx]" :key="opt.id + '-' + (opt.slug || '')" class="px-3 py-1 hover:bg-gray-50 cursor-pointer" @click="pickOffering(idx, opt)">
                      {{ opt.name }} <span class="text-xs text-gray-500" v-if="opt.type_name">• {{ opt.type_name }}</span>
                    </li>
                  </ul>
                </td>
                <td class="px-3 py-2 align-top">
                  <div class="flex flex-col gap-y-2">
                    <input type="number" min="0" step="1" v-model.number="r.amount" class="w-full px-3 py-2 rounded-lg border border-gray-300 text-right" placeholder="0" />
                    <input v-model.trim="r.description" placeholder="Մանրամասներ ըստ անհրաժեշտության" class="w-full px-3 py-2 rounded-lg border border-gray-300"/>
                  </div>
                </td>
                <td class="px-3 py-2 align-top">
                  <button class="px-2 py-1 rounded-lg border border-gray-300 hover:bg-gray-50" @click="removeOfferingRow(idx)">✕</button>
                </td>
              </tr>
              <tr v-if="offFormError && !offForm.offerings.length">
                <td colspan="5" class="px-3 py-2 text-red-600 text-sm">Ավելացրեք առնվազն 1 տող</td>
              </tr>
              </tbody>
            </table>
          </div>

          <div v-if="offFormError" class="rounded-xl border border-red-200 bg-red-50 text-red-700 p-2 text-sm">
            {{ offFormError }}
          </div>
        </div>
      </div>

      <div class="p-4 border-t flex items-center justify-end gap-2">
        <button class="px-3 py-2 rounded-xl border border-gray-300 hover:bg-gray-50" @click="closeOfferingModal" :disabled="offFormSaving">
          Չեղարկել
        </button>
        <button class="px-3 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50" :disabled="offFormSaving" @click="submitOfferingForm">
          <span v-if="offFormSaving">Պահպանում…</span>
          <span v-else>Պահպանել</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import VueSelect from 'vue3-select-component'
import { useI18n } from 'vue-i18n'
import { payrollApi, contractsApi, offeringsApi } from '@/api.ts'

const { t } = useI18n()

/* ---------- MODAL ---------- */
const offeringModalOpen = ref(false)
function openOfferingModal() {
  resetOfferingForm()
  offeringModalOpen.value = true
}
function closeOfferingModal() {
  offeringModalOpen.value = false
}

/* ---------- FORM MODEL ---------- */
type OfferingRow = { _key:string; offering_type:string; offering:string; offering_id:number|null; description:string; amount:number|null }
const offForm = ref<{ employee_id:number|null; start_date:string|null; finished_date:string|null; payed_date:string|null; offerings:OfferingRow[] }>({
  employee_id: null, start_date: null, finished_date: null, payed_date: null, offerings: []
})
const offFormSaving = ref(false)
const offFormError = ref('')

function resetOfferingForm() {
  offForm.value = { employee_id:null, start_date:null, finished_date:null, payed_date:null, offerings:[] }
  offFormError.value = ''
  civilEmployeeOptions.value = []
  typeSuggest.value = {}
  offeringSuggest.value = {}
}

/* ---------- CIVIL EMPLOYEES (with watcher on modal open) ---------- */
type CivilOpt = { id:number; label:string }
const civilEmployeeOptions = ref<CivilOpt[]>([])
const loadingCivilEmployees = ref(false)

async function loadCivilEmployees(q: string) {
  loadingCivilEmployees.value = true
  try {
    const { data } = await (contractsApi as any).civilContractEmployees({ search: q, limit: 50 })
    const list = Array.isArray(data) ? data : (data?.data ?? [])
    civilEmployeeOptions.value = list.map((u:any) => ({
      id: u.id,
      label: [u.first_name, u.last_name].filter(Boolean).join(' ') || `#${u.id}`
    }))
  } finally {
    loadingCivilEmployees.value = false
  }
}

// 👇 REQUIRED: run after modal opened
watch(() => offeringModalOpen.value, (isOpen, wasOpen) => {
  if (isOpen && !wasOpen) loadCivilEmployees('')
})

/* ---------- AUTOCOMPLETE ---------- */
const typeSuggest = ref<Record<number, Array<{ value:string; label:string }>>>({})
const offeringSuggest = ref<Record<number, Array<any>>>({})
let typeTimers: Record<number, any> = {}
let offeringTimers: Record<number, any> = {}

function debouncedFetchType(idx:number) {
  clearTimeout(typeTimers[idx]); typeTimers[idx] = setTimeout(() => fetchType(idx), 250)
}
async function fetchType(idx:number) {
  const q = offForm.value.offerings[idx]?.offering_type?.trim()
  if (!q) { typeSuggest.value[idx] = []; return }
  try {
    const resp = await (offeringsApi as any).searchTypes({ q })
    const list = Array.isArray(resp) ? resp : (resp?.data ?? [])
    typeSuggest.value[idx] = list.map((x:any) => ({ value: x.slug || x.name, label: x.name || x.title || String(x) }))
  } catch { typeSuggest.value[idx] = [] }
}
function pickType(idx:number, label:string) {
  const row = offForm.value.offerings[idx]; if (!row) return
  row.offering_type = label; typeSuggest.value[idx] = []
}

function debouncedFetchOffering(idx:number) {
  clearTimeout(offeringTimers[idx]); offeringTimers[idx] = setTimeout(() => fetchOffering(idx), 250)
}
async function fetchOffering(idx:number) {
  const row = offForm.value.offerings[idx]; const q = row?.offering?.trim()
  if (!q) { offeringSuggest.value[idx] = []; return }
  try {
    const params:any = { q }; if (row?.offering_type) params.type = row.offering_type
    const resp = await (offeringsApi as any).search(params)
    const list = Array.isArray(resp) ? resp : (resp?.data ?? [])
    offeringSuggest.value[idx] = list
  } catch { offeringSuggest.value[idx] = [] }
}
function pickOffering(idx:number, opt:any) {
  const row = offForm.value.offerings[idx]; if (!row) return
  row.offering = opt?.name || opt?.title || ''; row.offering_id = opt?.id ?? null
  if (opt?.type_name && !row.offering_type) row.offering_type = opt.type_name
  offeringSuggest.value[idx] = []
}

/* ---------- ROW OPS ---------- */
function addOfferingRow() {
  offForm.value.offerings.push({ _key: Math.random().toString(36).slice(2), offering_type:'', offering:'', offering_id:null, description:'', amount:null })
}
function removeOfferingRow(i:number) {
  offForm.value.offerings.splice(i, 1)
  delete typeSuggest.value[i]; delete offeringSuggest.value[i]
}

/* ---------- VALIDATE & SUBMIT ---------- */
function isBefore(a?: string|null, b?: string|null) {
  if (!a || !b) return false
  return new Date(a+'T00:00:00').getTime() < new Date(b+'T00:00:00').getTime()
}
function isBeforeOrEqual(a?: string|null, b?: string|null) {
  if (!a || !b) return false
  return new Date(a+'T00:00:00').getTime() <= new Date(b+'T00:00:00').getTime()
}
function validate(): string {
  const f = offForm.value
  if (!f.employee_id) return 'Ընտրեք աշխատակցին'
  if (!f.start_date || !f.finished_date) return 'Ընտրել սկիզբ և ավարտ'
  if (isBefore(f.finished_date, f.start_date)) return 'Ավարտը չի կարող լինել սկիզբից առաջ'
  if (f.payed_date && !isBeforeOrEqual(f.finished_date, f.payed_date)) return 'Վճարվող օրը չի կարող լինել ավարտից առաջ'
  if (!f.offerings.length) return 'Ավելացրեք առնվազն 1 տող'
  return ''
}
async function submitOfferingForm() {
  offFormError.value = validate()
  if (offFormError.value) return
  const f = offForm.value
  const payload = {
    employee_id: f.employee_id!,
    payed_date: !!f.payed_date,
    start_date: f.start_date || null,
    finished_date: f.finished_date || null,
    offerings: f.offerings.map(r => ({
      offering_type: r.offering_type,
      id: r.offering_id,
      offering: r.offering,
      description: r.description || null,
      amount: Number(r.amount || 0)
    }))
  }
  try {
    offFormSaving.value = true
    await payrollApi.storeWithOfferings(payload)
    closeOfferingModal()
  } catch (e:any) {
    offFormError.value = e?.message || 'Չհաջողվեց պահպանել'
  } finally {
    offFormSaving.value = false
  }
}
</script>
