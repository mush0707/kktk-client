<!-- src/views/hr/modals/EmployeeFormModal.vue -->
<template>
  <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      @keydown.esc="emit('close')"
  >
    <div class="absolute inset-0 bg-black/30" @click="handleClose"></div>

    <div class="relative bg-white rounded-2xl w-full max-w-3xl shadow-xl overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-gray-300">
        <div class="text-lg font-semibold">{{ modalTitle }}</div>
        <button class="px-3 py-1 rounded-xl border border-gray-300 hover:bg-gray-50" @click="handleClose">✕</button>
      </div>

      <!-- Body -->
      <div class="p-4 grid grid-cols-1 gap-6 text-sm max-h-[75vh] overflow-y-auto" @keydown.enter.prevent="trySave">
        <!-- Personal -->
        <section class="space-y-3 border rounded-xl p-4 border-gray-300">
          <div>{{ t('personal_information') || 'Անձնական տվյալներ' }}</div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div class="flex flex-col gap-y-2">
              <label class="text-xs text-slate-500">{{ t('first_name') || 'Անուն' }}  <span class="text-red-600">*</span></label>
              <input
                  v-model.trim="form.first_name"
                  :disabled="isEdit && updateEditableOnly"
                  :class="['w-full border border-gray-300 rounded-xl px-3 py-2', err('first_name')]"
                  placeholder="Ani"
              />
            </div>
            <div class="flex flex-col gap-y-2">
              <label class="text-xs text-slate-500">{{ t('last_name') || 'Ազգանուն' }}  <span class="text-red-600">*</span></label>
              <input
                  v-model.trim="form.last_name"
                  :disabled="isEdit && updateEditableOnly"
                  :class="['w-full border border-gray-300 rounded-xl px-3 py-2', err('last_name')]"
                  placeholder="Hakobyan"
              />
            </div>
            <div class="flex flex-col gap-y-2">
              <label class="text-xs text-slate-500">{{ t('middle_name') || 'Հայրանուն' }}</label>
              <input
                  v-model.trim="form.middle_name"
                  :disabled="isEdit && updateEditableOnly"
                  class="w-full border border-gray-300 rounded-xl px-3 py-2"
              />
            </div>

            <div class="flex flex-col gap-y-2">
              <label class="text-xs text-slate-500">{{ t('birth_date') || 'Ծննդյան ամսաթիվ' }}  <span class="text-red-600">*</span></label>
              <DatePicker
                  v-model="form.birth_date"
                  :clearable="false"
                  :enable-time-picker="false"
                  :placeholder="$t('select_date')"
                  :class="[err('birth_date')]"
                  :teleport="true"
                  auto-apply
                  z-index="3000"
                  :max-date="maxDate"
                  :flow="flow"
              ></DatePicker>
            </div>

            <div class="flex flex-col gap-y-2">
              <label class="text-xs text-slate-500">{{ t('gender') || 'Սեռ' }}  <span class="text-red-600">*</span></label>
              <select
                  v-model="form.gender"
                  :disabled="isEdit && updateEditableOnly"
                  :class="['w-full border border-gray-300 rounded-xl px-3 py-2', err('gender')]"
              >
                <option :value="null">—</option>
                <option value="male">{{ t('male') || 'Արական' }}</option>
                <option value="female">{{ t('female') || 'Իգական' }}</option>
              </select>
            </div>

            <div class="md:col-span-3 flex flex-col gap-y-2">
              <div class="flex">
                <div class="flex flex-col gap-y-2">
                  <label class="text-xs text-slate-500">{{ t('citizenship') || 'Քաղաքացիություն' }}  <span class="text-red-600">*</span></label>
                  <select v-model="form.citizenship"
                          :class="['w-full px-3 py-2 rounded-xl border border-gray-300', err('citizenship')]"
                          :disabled="isEdit && updateEditableOnly" aria-required="true" class="w-full px-3 py-2 rounded-xl border border-gray-300">
                    <option :value="null">—</option>
                    <option v-for="c in ISO2" :key="c.code" :value="c.code">{{ c.code }} — {{ c.name }}</option>
                  </select>
                </div>
              </div>

              <!-- IDs row -->
              <div class="flex gap-x-2">
                <!-- Passport -->
                <div class="flex flex-col gap-y-2">
                  <label class="text-xs text-slate-500">Անձնագրի համար</label>
                  <input
                      v-model.trim="form.passport_number"
                      :class="['w-full border border-gray-300 rounded-xl px-3 py-2', errors.passport_number ? 'border-red-500' : 'border-gray-300']"
                      placeholder="օր. AA0000000"
                  />
                  <p v-if="errors.passport_number" class="text-xs text-red-600">{{ errors.passport_number }}</p>
                </div>

                <!-- Armenian National ID -->
                <div class="flex flex-col gap-y-2">
                  <label class="text-xs text-slate-500">Հ․Հ․ ID փաստաթղթի համար</label>
                  <input
                      v-model.trim="form.national_id"
                      :class="['w-full border border-gray-300 rounded-xl px-3 py-2', errors.national_id ? 'border-red-500' : 'border-gray-300']"
                      placeholder="օր. 19485364"
                  />
                  <p v-if="errors.national_id" class="text-xs text-red-600">{{ errors.national_id }}</p>
                </div>

                <!-- Social card -->
                <div class="flex flex-col gap-y-2">
                  <label class="text-xs text-slate-500">Սոցիալական քարտի համար</label>
                  <input
                      v-model.trim="form.social_card"
                      :class="['w-full border border-gray-300 rounded-xl px-3 py-2', errors.social_card ? 'border-red-500' : 'border-gray-300']"
                      placeholder="օր. 25485364"
                  />
                  <p v-if="errors.social_card" class="text-xs text-red-600">{{ errors.social_card }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="md:col-span-3">
            <label class="inline-flex items-center gap-2 text-sm">
              <input
                  type="checkbox"
                  v-model="form.pension_voluntary"
                  class="w-4 h-4 rounded border-gray-300"
                  :true-value="true"
                  :false-value="false"
              />
              <span>{{ t('pension_voluntary') || 'Կամավոր կենսաթոշակ' }}</span>
            </label>
            <p class="text-xs text-slate-500 mt-1">
              {{ t('pension_voluntary_hint') || 'Նշեք, եթե աշխատակիցը մասնակցում է կամավոր կուտակային կենսաթոշակին' }}
            </p>
          </div>
        </section>

        <!-- Contacts -->
        <section class="space-y-3 border rounded-xl p-4 border-gray-300">
          <div class="text-slate-500">{{ t('contacts') || 'Կոնտակտային տվյալներ' }}</div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div class="flex flex-col gap-y-2">
              <label class="text-xs text-slate-500">{{ t('address_city') || 'Քաղաք' }}  <span class="text-red-600">*</span></label>
              <select
                  v-model="form.address_city"
                  :class="['w-full border border-gray-300 rounded-xl px-3 py-2', err('address_city')]"
              >
                <option :value="null">—</option>
                <option v-for="city in armeniaCities" :key="city.code" :value="city.code">
                  {{ city.name }}
                </option>
              </select>
            </div>
            <div class="flex flex-col gap-y-2">
              <label class="text-xs text-slate-500">{{ t('address_line') || 'Հասցե (փողոց, շենք, բկ)' }}  <span class="text-red-600">*</span></label>
              <div class="relative">
                <input
                    v-model="form.address_line"
                    type="text"
                    :class="['w-full border border-gray-300 text-sm rounded-xl px-3 py-2', err('address_line')]"
                />

                <ul v-if="addressSuggestions.length"
                    class="absolute z-50 bg-white border border-gray-300 rounded-xl mt-1 w-full max-h-40 overflow-auto shadow-md">
                  <li v-for="(suggestion, i) in addressSuggestions" :key="i"
                      class="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                      @click="form.address_line = suggestion; addressSuggestions = []">
                    {{ suggestion }}
                  </li>
                </ul>
              </div>
            </div>
            <div class="flex flex-col gap-y-2">
              <label class="text-xs text-slate-500">Ընտ․ կարգավիճակ</label>
              <select v-model="form.marital_status"
                      :class="['w-full border border-gray-300 rounded-xl px-3 py-2', err('marital_status')]"
              >
                <option :value="null">—</option>
                <option value="single">Չամուսնացած</option>
                <option value="married">Ամուսնացած</option>
              </select>
            </div>
            <div class="flex flex-col gap-y-2">
              <label class="text-xs text-slate-500">{{ t('phone') || 'Հեռախոս' }} <span class="text-red-600">*</span></label>
              <input v-model.trim="form.phone" :class="['w-full border border-gray-300 rounded-xl px-3 py-2', err('phone')]"
                     placeholder="+374…"/>
            </div>
            <div class="flex flex-col gap-y-2">
              <label class="text-xs text-slate-500">{{ t('auth.email') || 'Էլ․ փոստ' }} <span class="text-red-600">*</span></label>
              <input v-model.trim="form.email" :class="['w-full text-sm border border-gray-300 rounded-xl px-3 py-2', err('email')]"
                     placeholder="name@company.am"
                     type="email"/>
            </div>

            <div class="col-span-2 grid grid-cols-2 gap-4">
              <div class="flex flex-col gap-y-2">
                <label class="text-xs text-slate-500">{{
                    t('emergency_contact_name') || 'Արտակարգ կոնտակտ (անուն)'
                  }}</label>
                <input v-model.trim="form.emergency_contact_name"
                       class="w-full border border-gray-300 rounded-xl px-3 py-2"/>
              </div>
              <div class="flex flex-col gap-y-2">
                <label class="text-xs text-slate-500">{{
                    t('emergency_contact_phone') || 'Արտակարգ կոնտակտ (հեռ.)'
                  }}</label>
                <input v-model.trim="form.emergency_contact_phone"
                       placeholder="374..."
                       class="w-full border border-gray-300 rounded-xl px-3 py-2"/>
              </div>
            </div>
          </div>
        </section>

        <section v-if="docTypes.length" class="space-y-4">
          <div class="font-medium">{{ $t('documents') || 'Փաստաթղթեր' }}</div>
          <div v-for="doc in docTypes" :key="doc.id" class="border border-gray-300 rounded-xl p-4">
            <div class="mb-2 flex items-center gap-2">
              <span class="font-medium">{{ doc.name }}</span>
              <span v-if="isRequired(doc)" class="text-red-600 text-xs"><span class="text-red-600">*</span></span>
            </div>
            <input :ref="el => fileInputs[doc.id] = el" :accept="fileAccept"
                   class="w-full px-3 py-2 rounded-xl border border-gray-500"
                   type="file"
                   @change="onPickFile(doc.id, $event)"/>
          </div>
        </section>
      </div>

      <!-- Footer -->
      <div class="p-4 border-t flex items-center justify-end gap-2">
        <span v-if="uiError" class="text-sm text-red-600 mr-auto">{{ uiError }}</span>
        <button :disabled="saving" class="px-3 py-2 rounded-xl border hover:bg-gray-50" @click="handleClose">
          {{ t('cancel') || 'Չեղարկել' }}
        </button>
        <button :disabled="saving || (isEdit ? !isDirty : !minimalValid)"
                class="px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                @click="trySave">
          <span v-if="saving">{{ t('saving') || 'Պահպանում…' }}</span>
          <span v-else>{{ t('save') || 'Պահպանել' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {computed, reactive, ref, watch} from 'vue'
import {employeesApi} from '@/api.ts'
import {useI18n} from 'vue-i18n'

const {t} = useI18n({useScope: 'global'})

const props = defineProps({
  open: Boolean,
  employee: Object,
  initial: Object,
  updateEditableOnly: Boolean,
  staffUser: Object
})

const emit = defineEmits(['close', 'saved'])

const isEdit = computed(() => !!props.employee?.id)
const updateEditableOnly = computed(() => props.updateEditableOnly ?? true)

const modalTitle = computed(() =>
    isEdit.value ? (t('edit_employee') || 'Աշխատակցի խմբագրում') : (t('new_employee') || 'Նոր աշխատակից')
)

const errors = ref<Record<string, string>>({})   // VALIDATION: collect field errors
const flow = ref(['year','month', 'calendar']);

function err(field: string) {
  return errors.value?.[field] ? 'border-red-500' : ''
}

const  maxDate = computed(() => {
  const d = new Date()
  d.setFullYear(d.getFullYear() - 18)
  return d.toISOString().slice(0, 10)
})

export type Form = {
  first_name: string
  last_name: string
  middle_name: string | null
  birth_date: string | null
  gender: 'male' | 'female' | null
  citizenship: string | null
  national_id: string | null
  passport_number: string | null
  social_card: string | null
  phone: string | null
  email: string | null
  address_city: string | null
  address_line: string | null
  marital_status: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  user_id?: number | null
  pension_voluntary: boolean | null
}

export type DocType = {
  id: number
  name: string
  slug: string
  pivot?: { process_id: number; document_type_id: number; required: number | boolean }
}

export type EmployeeDocument = {
  id: number
  type_id: number
  type?: DocType
  file_name: string
  url?: string
  created_at: string
}

const ISO2 = [
  {code: 'AM', name: 'Armenia'}, {code: 'GE', name: 'Georgia'}, {code: 'RU', name: 'Russia'},
  {code: 'US', name: 'United States'}, {code: 'GB', name: 'United Kingdom'}, {code: 'DE', name: 'Germany'},
  {code: 'FR', name: 'France'}, {code: 'IT', name: 'Italy'}, {code: 'ES', name: 'Spain'},
  {code: 'TR', name: 'Türkiye'}, {code: 'CN', name: 'China'}, {code: 'JP', name: 'Japan'},
  {code: 'AE', name: 'United Arab Emirates'}, {code: 'IR', name: 'Iran'}, {code: 'IN', name: 'India'},
  {code: 'UA', name: 'Ukraine'}, {code: 'PL', name: 'Poland'}, {code: 'NL', name: 'Netherlands'},
  {code: 'CA', name: 'Canada'}, {code: 'BR', name: 'Brazil'}, {code: 'KZ', name: 'Kazakhstan'}
]

const armeniaCities = [
  {code: 'Yerevan', name: 'Երևան'},
  {code: 'Gyumri', name: 'Գյումրի'},
  {code: 'Vanadzor', name: 'Վանաձոր'},
  {code: 'Vagharshapat', name: 'Էջմիածին'},
  {code: 'Hrazdan', name: 'Հրազդան'},
  {code: 'Abovyan', name: 'Աբովյան'},
  {code: 'Kapan', name: 'Կապան'},
  {code: 'Armavir', name: 'Արմավիր'},
  {code: 'Stepanavan', name: 'Ստեփանավան'},
  {code: 'Gavar', name: 'Գավառ'},
  {code: 'Sevan', name: 'Սևան'},
  {code: 'Charentsavan', name: 'Չարենցավան'},
  {code: 'Ijevan', name: 'Իջևան'},
  {code: 'Ararat', name: 'Արարատ'},
  {code: 'Artashat', name: 'Արտաշատ'},
  {code: 'Masis', name: 'Մասիս'},
  {code: 'Dilijan', name: 'Դիլիջան'},
  {code: 'Sisian', name: 'Սիսիան'},
  {code: 'Martuni', name: 'Մարտունի'},
  {code: 'Ashtarak', name: 'Աշտարակ'},
  {code: 'Spitak', name: 'Սպիտակ'},
  {code: 'Tashir', name: 'Տաշիր'},
  {code: 'Meghri', name: 'Մեղրի'},
  {code: 'Noyemberyan', name: 'Նոյեմբերյան'},
  {code: 'Vardenis', name: 'Վարդենիս'},
  {code: 'Aparan', name: 'Ապարան'},
  {code: 'Byureghavan', name: 'Բյուրեղավան'},
  {code: 'Maralik', name: 'Մարալիկ'},
  {code: 'Yeghvard', name: 'Եղվարդ'},
  {code: 'Alaverdi', name: 'Ալավերդի'},
  {code: 'Agarak', name: 'Ագարակ'},
  {code: 'Talin', name: 'Թալին'},
  {code: 'Vedi', name: 'Վեդի'},
  {code: 'Shamlugh', name: 'Շամլուղ'},
  {code: 'Jermuk', name: 'Ջերմուկ'}
]


const form = reactive<Form>({
  first_name: '',
  last_name: '',
  middle_name: null,
  birth_date: null,
  gender: null,
  citizenship: 'AM',
  national_id: null,
  passport_number: null,
  social_card: null,
  marital_status: null,
  phone: null,
  email: null,
  address_city: null,
  address_line: null,
  emergency_contact_name: null,
  emergency_contact_phone: null,
  user_id: null,
  pension_voluntary:  false
})

const original = ref({})
const uiError = ref('')
const saving = ref(false)
const minimalValid = computed(() => !!form.first_name?.trim() && !!form.last_name?.trim())
const isDirty = computed(() => JSON.stringify(original.value) !== JSON.stringify(form))

const docTypes = ref<DocType[]>([])
const docUploads = reactive<Record<number, File | null>>({})
const savedDocs = ref<EmployeeDocument[]>([])
const loadingDocs = ref(false)
const fileAccept = '.pdf,image/*'
const maxFileBytes = 10 * 1024 * 1024
const fileInputs = reactive<Record<number, HTMLInputElement | null>>({})
const addressSuggestions = ref<string[]>([])

function isRequired(dt: DocType) {
  return !!(dt.pivot && Number(dt.pivot.required) === 1)
}

function hasSaved(typeId: number) {
  return savedDocs.value.some(d => d.type_id === typeId)
}

function clearPicked(typeId: number) {
  docUploads[typeId] = null
  if (fileInputs[typeId]) fileInputs[typeId]!.value = ''
}

function onPickFile(typeId: number, e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) { docUploads[typeId] = null; return }
  if (file.size > maxFileBytes) {
    uiError.value = (t('file_too_large') || 'Ֆայլը չափազանց մեծ է')
    input.value = ''
    return
  }
  docUploads[typeId] = file
}

async function uploadDocsIfAny(employeeId: number) {
  const entries = Object.entries(docUploads).filter(([, f]) => !!f)
  if (!entries.length) return
  for (const [typeIdStr, file] of entries) {
    const fd = new FormData()
    fd.append('type_id', String(typeIdStr))
    fd.append('documents[]', file as File)
    await employeesApi.uploadDocument?.(employeeId, fd)
    docUploads[Number(typeIdStr)] = null
  }
  await loadSavedDocs()
}

const missingRequired = computed(() =>
    docTypes.value.filter(isRequired)
        .filter(dt => !docUploads[dt.id] && !hasSaved(dt.id))
        .map(dt => dt.name)
)

function prefill(src?: Partial<Employee> | null) {
  if (!src) return
  const norm = { ...src }
  if (norm.hasOwnProperty('pension_voluntary')) {
    // @ts-ignore
    norm.pension_voluntary = norm.pension_voluntary === 1 || norm.pension_voluntary === '1' || norm.pension_voluntary === true
  }
  Object.assign(form, norm)
}

function resetForm() {
  Object.assign(form, {
    first_name: '', last_name: '', middle_name: null,
    birth_date: null, gender: null, citizenship: 'AM', national_id: null, passport_number: null, social_card: null,
    marital_status: null, phone: null, email: null,
    address_city: null, address_line: null,
    emergency_contact_name: null, emergency_contact_phone: null,
    user_id: null,
    pension_voluntary: false,
  })
}

async function loadDocTypes() {
  try {
    const res = await (employeesApi.getDocType?.() ?? employeesApi.getDocTypes?.())
    const list = res?.data ?? res ?? []
    docTypes.value = Array.isArray(list) ? list : []
    docTypes.value.forEach(dt => {
      if (!(dt.id in docUploads)) docUploads[dt.id] = null
    })
  } catch (e) {}
}

async function loadSavedDocs() {
  if (!props.employee?.id) { savedDocs.value = []; return }
  loadingDocs.value = true
  try {
    const res = await employeesApi.listDocuments?.(props.employee.id)
    const list = res?.data ?? res ?? []
    savedDocs.value = Array.isArray(list) ? list : []
  } catch (e) {
  } finally {
    loadingDocs.value = false
  }
}

function load() {
  uiError.value = ''
  errors.value = {}
  resetForm()
  if (isEdit.value && props.employee) prefill(props.employee)
  else if (props.staffUser) {
    prefill({
      first_name: props.staffUser?.first_name,
      last_name: props.staffUser?.last_name,
      email: props.staffUser?.email,
      user_id: props.staffUser?.user_id,
      phone: props.staffUser?.phone,
      gender: props.staffUser?.gender,
      birth_date: props.staffUser?.birth_date
    })
  }
  original.value = JSON.parse(JSON.stringify(form))
  loadDocTypes()
  if (isEdit.value) loadSavedDocs()
}

watch(() => props.open, (v) => { if (v) load() })

function handleClose() { emit('close') }

/** ───────── VALIDATION ───────── */
const PASSPORT_RE = /^[A-Z0-9]{6,9}$/i         // generic ICAO-like: 6–9 alphanum
const ARM_ID_RE   = /^\d{8}$/                  // Armenian ID / social: 8 digits
const EMAIL_RE    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i
const PHONE_RE    = /^\+?[0-9()\-\s]{7,}$/     // simple intl-friendly

function validate(): boolean {
  errors.value = {}
  uiError.value = ''

  // 1) Required “*” fields
  const req = {
    first_name:  form.first_name?.trim(),
    last_name:   form.last_name?.trim(),
    birth_date:  form.birth_date?.toString().trim(),
    gender:      form.gender,
    citizenship: form.citizenship,
    address_city: form.address_city,
    address_line: form.address_line?.trim(),
    phone:       form.phone?.trim(),
    email:       form.email?.trim(),
  }

  if (!req.first_name)  errors.value.first_name  = 'Պարտադիր դաշտ'
  if (!req.last_name)   errors.value.last_name   = 'Պարտադիր դաշտ'
  if (!req.birth_date)  errors.value.birth_date  = 'Պարտադիր դաշտ'
  if (!req.gender)      errors.value.gender      = 'Պարտադիր դաշտ'
  if (!req.citizenship) errors.value.citizenship = 'Պարտադիր դաշտ'
  if (!req.address_city) errors.value.address_city = 'Պարտադիր դաշտ'
  if (!req.address_line) errors.value.address_line = 'Պարտադիր դաշտ'
  if (!req.phone)       errors.value.phone       = 'Պարտադիր դաշտ'
  if (!req.email)       errors.value.email       = 'Պարտադիր դաշտ'

  // 2) Formats for requireds
  if (req.email && !EMAIL_RE.test(req.email)) {
    errors.value.email = 'Սխալ էլ․ փոստ'
  }
  if (req.phone && !PHONE_RE.test(req.phone)) {
    errors.value.phone = 'Սխալ հեռախոսահամար'
  }

  // 3) “passport_number OR national_id” required
  const passport = (form.passport_number || '').toString().trim()
  const national = (form.national_id || '').toString().trim()
  const social   = (form.social_number ?? form.social_card ?? '').toString().trim()

  if (!passport && !national) {
    errors.value.passport_number = 'Լրացրեք անձնագիր կամ ID'
    errors.value.national_id     = 'Լրացրեք անձնագիր կամ ID'
  }

  // 4) ID formats (if provided)
  if (passport && !PASSPORT_RE.test(passport)) {
    errors.value.passport_number = 'Անձնագրի համարը պետք է լինի 6–9 լատինատառ/թիվ (օր. AA1234567)'
  }
  if (national && !ARM_ID_RE.test(national)) {
    errors.value.national_id = 'ID համար (ՀՀ) պետք է լինի 8 նիշ'
  }
  if (social && !ARM_ID_RE.test(social)) {
    errors.value.social_card = 'Սոցիալական քարտը պետք է լինի 8 նիշ'
  }

  // 5) Required documents check (if process defines them)
  if (missingRequired.value.length) {
    uiError.value = `Պարտադիր փաստաթղթեր բացակայում են՝ ${missingRequired.value.join(', ')}`
  }

  return !uiError.value && Object.keys(errors.value).length === 0
}
/** ────────────────────────────── */

async function trySave() {
  uiError.value = ''
  if (!validate()) return

  saving.value = true
  try {
    // Normalize birth_date
    if (form.birth_date) {
      const d = new Date(form.birth_date)
      form.birth_date = d.toISOString().slice(0, 10)
    }

    // Map social_number -> social_card if present in template
    // @ts-ignore
    if (!form.social_card && form.social_number) {
      // @ts-ignore
      form.social_card = form.social_number
    }

    const fd = new FormData()

    // Append employee fields
    Object.entries(form).forEach(([key, value]) => {
      if (key === 'pension_voluntary') {
        fd.append(key, value == null ? '' : (value ? '1' : '0'))
      } else {
        fd.append(key, value ?? '')
      }
    })

    // Build documents[] array structure:
    // [
    //   { type_id: <id>, documents: [<binaryFile>] },
    //   ...
    // ]
    let di = 0
    for (const [typeIdStr, file] of Object.entries(docUploads)) {
      if (!file) continue
      const typeId = Number(typeIdStr)

      // one object per type, with one file in documents[]
      fd.append(`documents[${di}][type_id]`, String(typeId))
      fd.append(`documents[${di}][documents][]`, file as File)
      di += 1
    }

    const res = await employeesApi.update(props.staffUser.id, fd)

    // Clear local files only after successful upload
    Object.keys(docUploads).forEach(k => (docUploads[Number(k)] = null))

    emit('saved', res)
    emit('close')
  } finally {
    saving.value = false
  }
}
</script>
