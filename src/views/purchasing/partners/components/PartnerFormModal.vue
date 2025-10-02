<template>
  <div v-if="open" class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/40" @click="$emit('close')"></div>

    <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                w-full max-w-4xl bg-white rounded-2xl shadow-xl">
      <!-- Header -->
      <div class="flex items-center justify-between px-5 py-4 border-b">
        <h3 class="text-lg font-semibold">
          {{ form.id ? 'Խմբագրել գործընկեր' : 'Նոր գործընկեր' }}
        </h3>
        <button class="p-2 rounded-lg hover:bg-gray-100" @click="$emit('close')" aria-label="Close">✕</button>
      </div>

      <!-- Body -->
      <div class="p-5 space-y-6">
        <!-- Loader overlay while fetching by id -->
        <div v-if="initialLoading" class="text-sm text-gray-500">Բեռնվում է…</div>
        <template v-else>
          <!-- Basic -->
          <div class="grid md:grid-cols-3 gap-4">
            <div>
              <label class="text-sm text-gray-600">Անվանում <span class="text-red-600">*</span></label>
              <input v-model="form.name" class="w-full px-3 py-2 rounded-xl border" :class="err('name')" placeholder="ACME LLC" aria-required="true" />
              <p v-if="errors.name" class="text-xs text-red-600 mt-1">{{ errors.name[0] }}</p>
            </div>

            <div>
              <label class="text-sm text-gray-600">Սուբյեկտի տեսակ <span class="text-red-600">*</span></label>
              <select v-model="form.category" class="w-full px-3 py-2 rounded-xl border" :class="err('category')" aria-required="true">
                <option v-for="k in kinds" :key="k.value" :value="k.value">{{ k.label }}</option>
              </select>
              <p v-if="errors.category" class="text-xs text-red-600 mt-1">{{ errors.category[0] }}</p>
            </div>

            <div>
              <label class="text-sm text-gray-600">ՀՎՀՀ / TIN <span class="text-red-600">*</span></label>
              <input v-model="form.tin" class="w-full px-3 py-2 rounded-xl border" :class="err('tin')" placeholder="XXXXXXXX" aria-required="true" />
              <p v-if="errors.tin" class="text-xs text-red-600 mt-1">{{ errors.tin[0] }}</p>
            </div>
          </div>

          <div class="grid md:grid-cols-3 gap-4">
            <div>
              <label class="text-sm text-gray-600">Երկիր (ISO-2) <span class="text-red-600">*</span></label>
              <select v-model="form.country_iso" class="w-full px-3 py-2 rounded-xl border" :class="err('country_iso')" aria-required="true">
                <option :value="null">—</option>
                <option v-for="c in ISO2" :key="c.code" :value="c.code">{{ c.code }} — {{ c.name }}</option>
              </select>
              <p v-if="errors.country_iso" class="text-xs text-red-600 mt-1">{{ errors.country_iso[0] }}</p>
            </div>

            <div>
              <label class="text-sm text-gray-600">Հասցե</label>
              <input v-model="form.address" class="w-full px-3 py-2 rounded-xl border" />
            </div>
          </div>

          <!-- Contacts (email OR phone required) -->
          <div class="grid md:grid-cols-3 gap-4">
            <div>
              <label class="text-sm text-gray-600">
                Էլ. փոստ <span class="text-red-600" v-if="requiresEmail">*</span>
                <span class="text-gray-400"> (կամ լրացրու հեռախոս)</span>
              </label>
              <input v-model="form.email" class="w-full px-3 py-2 rounded-xl border" :class="err('email_or_phone')" placeholder="name@company.com" :aria-required="requiresEmail" />
            </div>

            <div>
              <label class="text-sm text-gray-600">Հեռ. երկրի կոդ (ISO) <span class="text-red-600" v-if="requiresPhone">*</span></label>
              <select v-model="form.phone_iso_code" class="w-full px-3 py-2 rounded-xl border" :class="err('email_or_phone')" :aria-required="requiresPhone">
                <option :value="null">—</option>
                <option v-for="p in PHONE_CODES" :key="p.iso" :value="p.dial">{{ p.dial }} - {{ p.name }} ({{ p.iso.toLowerCase() }})</option>
              </select>
            </div>

            <div>
              <label class="text-sm text-gray-600">Հեռախոս <span class="text-red-600" v-if="requiresPhone">*</span></label>
              <input v-model="form.phone_number" class="w-full px-3 py-2 rounded-xl border" :class="err('email_or_phone')" placeholder="00 00 00 00" :aria-required="requiresPhone" />
            </div>
          </div>
          <p v-if="errors.email_or_phone" class="text-xs text-red-600">{{ errors.email_or_phone }}</p>

          <!-- Manager (required, inline search) -->
<!--          <div>-->
<!--            <label class="text-sm text-gray-600">Մենեջեր <span class="text-red-600">*</span></label>-->
<!--            <div class="flex gap-2 relative">-->
<!--              <input v-model="managerQuery" @input="debounceMgr" class="flex-1 px-3 py-2 rounded-xl border" :class="err('manager')" placeholder="Փնտրել աշխատակից" aria-required="true" />-->
<!--              <div v-if="managerOpen" class="absolute z-20 mt-11 w-full bg-white border rounded-xl shadow-lg max-h-60 overflow-auto">-->
<!--                <button v-for="u in managerOptions" :key="u.id" class="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2" @click="pickManager(u)">-->
<!--                  <img v-if="u.avatar" :src="u.avatar" class="w-6 h-6 rounded-full" />-->
<!--                  <span class="font-medium">{{ u.name }}</span>-->
<!--                  <span class="text-xs text-gray-500">#{{ u.id }}</span>-->
<!--                </button>-->
<!--                <div v-if="!managerLoading && managerOptions.length===0" class="px-3 py-2 text-sm text-gray-500">— Արդյունք չկա</div>-->
<!--                <div v-if="managerLoading" class="px-3 py-2 text-sm text-gray-500">Բեռնվում է…</div>-->
<!--              </div>-->
<!--            </div>-->
<!--            <p v-if="pickedManager" class="text-sm text-gray-700 mt-2">-->
<!--              Ընտրված մենեջեր՝ <span class="font-medium">{{ pickedManager.name }}</span> (#{{ pickedManager.id }})-->
<!--            </p>-->
<!--            <p v-if="errors.manager" class="text-xs text-red-600 mt-1">{{ errors.manager }}</p>-->
<!--          </div>-->

          <!-- Bank block -->
          <div class="bg-white">
            <div class="grid md:grid-cols-3 gap-4">
              <div>
                <label class="text-sm text-gray-600">Բանկ</label>
                <input v-model="form.bank_name" class="w-full px-3 py-2 rounded-xl border" />
              </div>
              <div>
                <label class="text-sm text-gray-600">Հաշվի համ.</label>
                <input v-model="form.bank_account" class="w-full px-3 py-2 rounded-xl border" />
              </div>
              <div>
                <label class="text-sm text-gray-600">SWIFT</label>
                <input v-model="form.bank_swift" class="w-full px-3 py-2 rounded-xl border" />
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-end gap-2 px-5 py-4 border-t">
        <button class="px-3 py-2 rounded-xl border hover:bg-gray-50" @click="$emit('close')">Չեղարկել</button>
        <button class="px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                :disabled="saving || !canSave || initialLoading"
                @click="save">
          Պահպանել
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted, onBeforeUnmount } from 'vue'
import { purchasingApi, purchasingPartnerApi } from '@/api.js'

const props = defineProps({
  open: Boolean,
  row: { type: Object, default: null },
  id: { type: [Number, String], default: null } // կարելի է բացել ուղիղ id-ով
})
const emit = defineEmits(['close', 'saved'])

/* kinds dropdown */
const kinds = [
  { value: 'legal_entity',        label: 'Իրավաբանական անձ' },
  { value: 'legal_group',         label: 'Իրավաբանական խմբավորում' },
  { value: 'sole_entrepreneur',   label: 'Անհատ ձեռնարկատեր' },
  { value: 'individual',          label: 'Ֆիզ. անձ' },
  { value: 'nonresident_legal',   label: 'Ոչ ռեզ. իրավաբանական' },
  { value: 'nonresident_branch',  label: 'Ոչ ռեզ. մասնաճյուղ' },
]

/* Form model */
const form = ref({
  id: null,
  category_id: null,
  name: '',
  country_iso: null,
  email: null,
  phone_iso_code: null,   // պահում ենք dial, օրինակ '+374'
  phone_number: null,
  type: 'both',
  category: 'legal_entity',
  tin: '',
  vat_number: null,
  city: null,
  address: null,
  bank_name: null,
  bank_account: null,
  bank_swift: null,
})

/* Manager (required) */
const pickedManager = ref(null)
const managerQuery = ref('')
const managerOptions = ref([])
const managerOpen = ref(false)
const managerLoading = ref(false)
const initialLoading = ref(false)

let mgrT
function debounceMgr(){ clearTimeout(mgrT); mgrT = setTimeout(loadManagers, 300) }
async function loadManagers(){
  managerLoading.value = true
  try{
    const { data } = await purchasingApi.staffList({ search: managerQuery.value, limit: 20 })
    managerOptions.value = data?.data ?? data ?? []
    managerOpen.value = true
  } finally { managerLoading.value = false }
}
function pickManager(u){ pickedManager.value = u; managerOpen.value = false }

/* ISO-2 countries (subset) */
const ISO2 = [
  { code: 'AM', name: 'Armenia' }, { code: 'GE', name: 'Georgia' }, { code: 'RU', name: 'Russia' },
  { code: 'US', name: 'United States' }, { code: 'GB', name: 'United Kingdom' }, { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' }, { code: 'IT', name: 'Italy' }, { code: 'ES', name: 'Spain' },
  { code: 'TR', name: 'Türkiye' }, { code: 'CN', name: 'China' }, { code: 'JP', name: 'Japan' },
  { code: 'AE', name: 'United Arab Emirates' }, { code: 'IR', name: 'Iran' }, { code: 'IN', name: 'India' },
  { code: 'UA', name: 'Ukraine' }, { code: 'PL', name: 'Poland' }, { code: 'NL', name: 'Netherlands' },
  { code: 'CA', name: 'Canada' }, { code: 'BR', name: 'Brazil' }, { code: 'KZ', name: 'Kazakhstan' }
]

/* Phone ISO dial dropdown */
const PHONE_CODES = [
  { iso: 'AM', dial: '+374', name: 'Armenia' },
  { iso: 'GE', dial: '+995', name: 'Georgia' },
  { iso: 'RU', dial: '+7',   name: 'Russia' },
  { iso: 'US', dial: '+1',   name: 'United States' },
  { iso: 'CA', dial: '+1',   name: 'Canada' },
  { iso: 'GB', dial: '+44',  name: 'United Kingdom' },
  { iso: 'DE', dial: '+49',  name: 'Germany' },
  { iso: 'FR', dial: '+33',  name: 'France' },
  { iso: 'IT', dial: '+39',  name: 'Italy' },
  { iso: 'ES', dial: '+34',  name: 'Spain' },
  { iso: 'NL', dial: '+31',  name: 'Netherlands' },
  { iso: 'PL', dial: '+48',  name: 'Poland' },
  { iso: 'TR', dial: '+90',  name: 'Türkiye' },
  { iso: 'AE', dial: '+971', name: 'United Arab Emirates' },
  { iso: 'IR', dial: '+98',  name: 'Iran' },
  { iso: 'IN', dial: '+91',  name: 'India' },
  { iso: 'CN', dial: '+86',  name: 'China' },
  { iso: 'JP', dial: '+81',  name: 'Japan' },
  { iso: 'UA', dial: '+380', name: 'Ukraine' },
  { iso: 'BR', dial: '+55',  name: 'Brazil' },
]

/* Validation helpers */
const errors = ref({})
function err(field){ return errors.value?.[field] ? 'border-red-500' : '' }

const emailRe = /.+@.+\..+/
const hasEmail = computed(() => !!(form.value.email && emailRe.test(form.value.email)))
const hasPhone = computed(() => !!(form.value.phone_iso_code && form.value.phone_number?.trim()))
const requiresEmail = computed(() => !hasPhone.value)
const requiresPhone = computed(() => !hasEmail.value)
const DIAL_BY_ISO = Object.fromEntries(PHONE_CODES.map(p => [p.iso, p.dial]))
const ISO_BY_DIAL = Object.fromEntries(PHONE_CODES.map(p => [p.dial, p.iso]))
/* Dynamic canSave */
const canSave = computed(() => {
  const e = {}
  if (!form.value.name?.trim()) e.name = ['Պահանջվում է անվանում']
  if (!form.value.category) e.category = ['Ընտրեք սուբյեկտի տեսակ']
  if (!form.value.tin?.trim()) e.tin = ['Պահանջվում է ՀՎՀՀ / TIN']
  if (!form.value.country_iso) e.country_iso = ['Ընտրեք երկիր']
  if (!hasEmail.value && !hasPhone.value) e.email_or_phone = 'Լրացրու էլ. փոստ կամ հեռախոս (+կոդ)'
  errors.value = e
  return Object.keys(e).length === 0
})
async function preloadManagerById(managerId){
  // already loaded in dropdown search? փորձենք staffList-ից գտնել
  try{
    const { data } = await purchasingApi.staffList({ q: managerId, limit: 1 })
    const arr = data?.data ?? data ?? []
    const u = arr.find(x => String(x.id) === String(managerId))
    if (u) pickedManager.value = { id: u.id, name: u.name, avatar: u.avatar }
    else pickedManager.value = { id: managerId, name: `#${managerId}` } // fallback label
  } catch {
    pickedManager.value = { id: managerId, name: `#${managerId}` }
  }
}

/* Helpers to populate/reset */
function fillFromRow(v){
  form.value = {
    id: v.id ?? null,
    category_id: v.category_id ?? null,
    name: v.name ?? '',
    country_iso: v.country_iso ?? null,

    // v.phone_iso_code գալիս է ISO-ով ("AM"), իսկ dropdown-ում պահում ենք dial ("+374")
    phone_iso_code: v.phone_iso_code
        ? (DIAL_BY_ISO[v.phone_iso_code] || v.phone_iso_code)
        : null,

    email: v.email ?? null,
    phone_number: v.phone_number ?? null,
    type: v.type ?? 'both',

    // եթե get() չի վերադարձնում category string, պահում ենք ինչ ունենք (կամ թող default)
    category: form.value.category ?? 'legal_entity',

    tin: v.tin ?? '',
    vat_number: v.vat_number ?? null,
    city: v.city ?? null,
    address: v.address ?? null,
    bank_name: v.bank_name ?? null,
    bank_account: v.bank_account ?? null,
    bank_swift: v.bank_swift ?? null,
  }

  // preload pickedManager from manager_id (եթե անունը չես ունեցել)
  if (v.manager?.id && v.manager?.name){
    pickedManager.value = { id: v.manager.id, name: v.manager.name }
  } else if (v.manager_id){
    // բեռնում ենք staff list-ից
    preloadManagerById(v.manager_id)
  } else {
    pickedManager.value = null
  }
}
function resetNewForm(){
  form.value = {
    id: null, category_id: null, name: '', country_iso: null, email: null,
    phone_iso_code: null, phone_number: null, type: 'both', category: 'legal_entity',
    tin: '', vat_number: null, city: null, address: null,
    bank_name: null, bank_account: null, bank_swift: null
  }
  pickedManager.value = null
}

/* Fetch by id (used when opening by id) */
async function fetchById(id){
  initialLoading.value = true
  try{
    const { data } = await purchasingPartnerApi.get(id)
    const row = data?.data ?? data ?? null
    if (row) fillFromRow(row)
  } finally { initialLoading.value = false }
}

/* React to incoming props */
watch(() => props.row, (v) => {
  errors.value = {}
  if (v?.id) fillFromRow(v)
  else if (!props.id) resetNewForm()
}, { immediate: true })

watch(() => props.id, async (newId) => {
  errors.value = {}
  if (newId) await fetchById(newId)
  else if (!props.row) resetNewForm()
}, { immediate: true })

/* Auto-fill phone code when country changes (if empty) */
watch(() => form.value.country_iso, (iso) => {
  if (!iso || form.value.phone_iso_code) return
  const m = PHONE_CODES.find(c => c.iso === iso)
  if (m) form.value.phone_iso_code = m.dial
})

/* Save */
const saving = ref(false)
async function save(){
  if(!canSave.value) return
  saving.value = true
  try{
    // Dial("+374") -> ISO("AM")
    const payload = {
      ...form.value,
      phone_iso_code: form.value.phone_iso_code
          ? (ISO_BY_DIAL[form.value.phone_iso_code] || form.value.phone_iso_code)
          : null
    }

    let partnerId = payload.id || props.id

    if (partnerId) {
      payload.id = partnerId
      await purchasingPartnerApi.update(props.id, payload)
    } else {
      const { data } = await purchasingPartnerApi.create(payload)
      partnerId = data?.id ?? data?.data?.id ?? partnerId
    }

    emit('saved', { ...payload, id: partnerId })
  } finally { saving.value = false }
}

/* ESC to close */
function onEsc(e){ if(e.key === 'Escape') emit('close') }
onMounted(() => {
  window.addEventListener('keydown', onEsc)
  if (!props.row && props.id) fetchById(props.id)
})
onBeforeUnmount(() => window.removeEventListener('keydown', onEsc))
</script>
