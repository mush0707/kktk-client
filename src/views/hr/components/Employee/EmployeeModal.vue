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
      <div class="flex items-center justify-between p-4 border-b">
        <div class="text-lg font-semibold">{{ modalTitle }}</div>
        <button class="px-3 py-1 rounded-xl border hover:bg-gray-50" @click="handleClose">✕</button>
      </div>

      <!-- Body -->
      <div class="p-4 grid grid-cols-1 gap-6 text-sm max-h-[75vh] overflow-y-auto" @keydown.enter.prevent="trySave">
        <!-- Personal -->
        <section class="space-y-3">
          <div class="text-slate-500">{{ t('personal') || 'Անձնական տվյալներ' }}</div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label class="text-xs text-slate-500">{{ t('first_name') || 'Անուն' }}</label>
              <input
                  v-model.trim="form.first_name"
                  :disabled="isEdit && updateEditableOnly"
                  class="w-full border rounded-xl px-3 py-2"
                  placeholder="Ani"
              />
            </div>
            <div>
              <label class="text-xs text-slate-500">{{ t('last_name') || 'Ազգանուն' }}</label>
              <input
                  v-model.trim="form.last_name"
                  :disabled="isEdit && updateEditableOnly"
                  class="w-full border rounded-xl px-3 py-2"
                  placeholder="Hakobyan"
              />
            </div>
            <div>
              <label class="text-xs text-slate-500">{{ t('middle_name') || 'Հայրանուն' }}</label>
              <input
                  v-model.trim="form.middle_name"
                  :disabled="isEdit && updateEditableOnly"
                  class="w-full border rounded-xl px-3 py-2"
              />
            </div>

            <div>
              <label class="text-xs text-slate-500">{{ t('birth_date') || 'Ծննդյան ամսաթիվ' }}</label>
              <DatePicker
                  v-model="form.birth_date"
                  :clearable="false"
                  :enable-time-picker="false"
                  :placeholder="$t('select_date')"
                  :teleport="true"
                  auto-apply
                  z-index="3000"
              ></DatePicker>
            </div>

            <div>
              <label class="text-xs text-slate-500">{{ t('gender') || 'Սեռ' }}</label>
              <select
                  v-model="form.gender"
                  :disabled="isEdit && updateEditableOnly"
                  class="w-full border rounded-xl px-3 py-2"
              >
                <option :value="null">—</option>
                <option value="male">{{ t('male') || 'Արական' }}</option>
                <option value="female">{{ t('female') || 'Իգական' }}</option>
              </select>
            </div>

            <div>
              <label class="text-xs text-slate-500">{{ t('citizenship') || 'Քաղաքացիություն' }}</label>
              <select v-model="form.citizenship"
                      :class="err('country_iso')"
                      :disabled="isEdit && updateEditableOnly" aria-required="true" class="w-full px-3 py-2 rounded-xl border">
                <option :value="null">—</option>
                <option v-for="c in ISO2" :key="c.code" :value="c.code">{{ c.code }} — {{ c.name }}</option>
              </select>
            </div>

            <div class="md:col-span-3">
              <label class="text-xs text-slate-500">{{ t('national_id') || 'Անձն․/սոց․ քարտ/ID' }}</label>
              <input
                  v-model.trim="form.national_id"
                  :disabled="false"
                  class="w-full border rounded-xl px-3 py-2"
                  placeholder="օր. 00000000"
              />
            </div>
          </div>
        </section>

        <!-- Contacts -->
        <section class="space-y-3">
          <div class="text-slate-500">{{ t('contacts') || 'Կոնտակտային տվյալներ' }}</div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label class="text-xs text-slate-500">{{ t('phone') || 'Հեռախոս' }}</label>
              <input v-model.trim="form.phone" class="w-full border rounded-xl px-3 py-2" placeholder="+374…"/>
            </div>
            <div>
              <label class="text-xs text-slate-500">{{ t('auth.email') || 'Էլ․ փոստ' }}</label>
              <input v-model.trim="form.email" class="w-full border rounded-xl px-3 py-2" placeholder="name@company.am"
                     type="email"/>
            </div>
            <div>
              <label class="text-xs text-slate-500">{{ t('marital_status') || 'Ընտ․ կարգավիճակ' }}</label>
              <select v-model="form.marital_status" class="w-full border rounded-xl px-3 py-2">
                <option :value="null">—</option>
                <option value="single">{{ t('single') || 'Չամուսնացած' }}</option>
                <option value="married">{{ t('married') || 'Ամուսնացած' }}</option>
              </select>
            </div>


            <div>
              <label class="text-xs text-slate-500">{{ t('address_city') || 'Քաղաք' }}</label>
              <input v-model.trim="form.address_city" class="w-full border rounded-xl px-3 py-2"/>
            </div>
            <div class="md:col-span-3">
              <label class="text-xs text-slate-500">{{ t('address_line') || 'Հասցե (փողոց, շենք, բկ)' }}</label>
              <input v-model.trim="form.address_line" class="w-full border rounded-xl px-3 py-2"/>
            </div>

            <div>
              <label class="text-xs text-slate-500">{{
                  t('emergency_contact_name') || 'Արտակարգ կոնտակտ (անուն)'
                }}</label>
              <input v-model.trim="form.emergency_contact_name" class="w-full border rounded-xl px-3 py-2"/>
            </div>
            <div>
              <label class="text-xs text-slate-500">{{
                  t('emergency_contact_phone') || 'Արտակարգ կոնտակտ (հեռ.)'
                }}</label>
              <input v-model.trim="form.emergency_contact_phone" class="w-full border rounded-xl px-3 py-2"/>
            </div>
          </div>
        </section>

        <section v-if="docTypes.length" class="space-y-4">
          <div class="font-medium">{{ $t('documents') || 'Փաստաթղթեր' }}</div>
          <div v-for="doc in docTypes" :key="doc.id" class="border border-gray-300 rounded-xl p-4">



            <div class="mb-2 flex items-center gap-2">
              <span class="font-medium">{{ doc.name }} </span>
              <span v-if="isRequired(doc)" class="text-red-600 text-xs">★ {{ $t('required') || 'պարտադիր' }}</span>
            </div>
            <input :ref="el => fileInputs[doc.id] = el" :accept="fileAccept"
                   class="w-full px-3 py-2 rounded-xl border border-gray-500"
                   type="file"
                   @change="onPickFile(doc.id, $event)"/>
          </div>
        </section>

        <!-- Documents -->

        <p v-if="uiError" class="text-xs text-red-600">{{ uiError }}</p>
      </div>

      <!-- Footer -->
      <div class="p-4 border-t flex items-center justify-end gap-2">
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

const errors = ref({})

function err(field) {
  return errors.value?.[field] ? 'border-red-500' : ''
}

export type Form = {
  first_name: string
  last_name: string
  middle_name: string | null
  birth_date: string | null
  gender: 'male' | 'female' | null
  citizenship: string | null
  national_id: string | null
  marital_status: string | null
  phone: string | null
  email: string | null
  address_city: string | null
  address_line: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  user_id?: number | null
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


const form = reactive<Form>({
  first_name: '',
  last_name: '',
  middle_name: null,
  birth_date: null,
  gender: null,
  citizenship: null,
  national_id: null,
  marital_status: null,
  phone: null,
  email: null,
  address_city: null,
  address_line: null,
  emergency_contact_name: null,
  emergency_contact_phone: null,
  user_id: null,
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
  if (!file) {
    docUploads[typeId] = null;
    return
  }
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
  Object.assign(form, src)
}

function resetForm() {
  Object.assign(form, {
    first_name: '', last_name: '', middle_name: null,
    birth_date: null, gender: null, citizenship: null, national_id: null,
    marital_status: null, phone: null, email: null,
    address_country: null, address_city: null, address_line: null,
    emergency_contact_name: null, emergency_contact_phone: null,
    user_id: null
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
  } catch (e) {
  }
}

async function loadSavedDocs() {
  if (!props.employee?.id) {
    savedDocs.value = [];
    return
  }
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

watch(() => props.open, (v) => {
  if (v) load()
})

function handleClose() {
  emit('close')
}

async function trySave() {
  uiError.value = ''
  errors.value = {}

  if (!minimalValid.value) {
    uiError.value = t('fill_required_fields') || 'Լրացրեք պարտադիր դաշտերը'
    return
  }

  if (missingRequired.value.length) {
    uiError.value = `${t('missing') || 'Բացակայում են պարտադիր փաստաթղթեր'}: ${missingRequired.value.join(', ')}`
    return
  }

  saving.value = true
  try {
    if (form.birth_date) {
      const d = new Date(form.birth_date)
      form.birth_date = d.toISOString().slice(0, 10) // e.g., "2025-10-06"
    }

    const payload = {...form}

    const fd = new FormData()
    Object.entries(payload).forEach(([k, v]) => fd.append(k, v ?? ''))
    Object.entries(docUploads).forEach(([typeId, f]) => {
      if (f) fd.append(`docs[${typeId}]`, f)
    })

    await employeesApi.update(props.staffUser.id, payload as any)
    await uploadDocsIfAny(props.staffUser.id)


    emit('saved')
  } catch (e) {
    console.log(e)
   } finally {
    saving.value = false
  }
}
</script>
