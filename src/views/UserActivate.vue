<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div class="w-full max-w-md bg-white rounded-2xl shadow p-6 space-y-5">
      <h1 class="text-xl font-semibold text-center">Ակտիվացրեք ձեր հաշիվը</h1>

      <div v-if="error" class="text-red-600 text-sm border border-red-200 bg-red-50 p-2 rounded">{{ error }}</div>
      <div v-if="message" class="text-green-700 text-sm border border-green-200 bg-green-50 p-2 rounded">{{
          message
        }}
      </div>

      <form @submit.prevent="submit" class="space-y-4">
        <div>
          <label class="block text-sm text-gray-600 mb-1">Էլ. փոստ</label>
          <input v-model.trim="form.email" type="email" class="w-full border rounded-xl px-3 py-2" readonly/>
        </div>

        <div>
          <label class="block text-sm text-gray-600 mb-1">Նոր գաղտնաբառ</label>
          <input v-model="form.password" type="password" class="w-full border rounded-xl px-3 py-2" minlength="8"
                 required/>
        </div>

        <div>
          <label class="block text-sm text-gray-600 mb-1">Կրկնել գաղտնաբառը</label>
          <input v-model="form.password_confirmation" type="password" class="w-full border rounded-xl px-3 py-2"
                 minlength="8" required/>
        </div>

        <button :disabled="loading" class="w-full rounded-xl px-4 py-2 border bg-black text-white disabled:opacity-50">
          {{ loading ? 'Ակտիվացվում է…' : 'Սահմանել գաղտնաբառը և շարունակել' }}
        </button>
      </form>

      <p class="text-xs text-center text-gray-500">Հղման ժամկետը շուտով կսպառվի․ օգտագործեք նամակում եղած կոճակը։</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import {onMounted, reactive, ref} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {activateAccount,} from '@/api'
import { useAuth } from '@/stores/auth'
// import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuth()

// const auth = useAuthStore()

const form = reactive({
  email: '',
  token: '',
  password: '',
  password_confirmation: ''
})
const loading = ref(false)
const error = ref<string | null>(null)
const message = ref<string | null>(null)

onMounted(() => {
  const q = {...route.query};

  form.email = String(q.email ?? '');
  form.token = String(q.token ?? '');

  if (!form.email || !form.token) {
    error.value = 'Սխալ ակտիվացման հղում։';
    return;
  }

  // Remove only token/email from the URL but keep any other params intact
  const {token, email, ...rest} = q as Record<string, any>;
 });

async function submit() {
  error.value = null
  message.value = null
  loading.value = true
  try {
    const {data} = await activateAccount(form)
     const token = data?.data?.token
    if (token) {
      await auth.login(form.email.trim(), form.password)
      await auth.loadMe()
    }
    const next = (route.query.next as string) || '/'
    router.replace(next)
  } catch (e: any) {
    console.log(e)
    error.value =
        e?.response?.data?.message ||
        (e?.response?.data?.errors?.token?.[0]) ||
        'Ակտիվացումը ձախողվեց։'
  } finally {
    loading.value = false
  }
}
</script>
