<script setup lang="ts">
import {reactive, ref} from "vue";
import {useI18n} from "vue-i18n";
import {employeesApi} from '@/api.ts'

const emit = defineEmits(['close', 'saved'])
const saving = ref(false)
const uiError = ref('')
const errors = ref({})

const {t} = useI18n({useScope: 'global'})
const props = defineProps<{
  user?: object | null
}>()

export type Form = {
  email: string | null
  user_id?: number | null,
}

const form = reactive<Form>({
  email: props.user?.email ?? null,
})


async function trySave() {
  uiError.value = ''
  errors.value = {}

  if (!form.email?.trim()) {
    uiError.value = t('fill_required_fields') || 'Լրացրեք պարտադիր դաշտերը'
    return
  }

  saving.value = true
  try {
    const payload = {...form}

    await employeesApi.userSendActivate(props?.user?.employee_id, payload)

    emit('saved')
  } catch (e) {
    uiError.value = t('save_failed') || 'Չհաջողվեց պահպանել'
  } finally {
    saving.value = false
  }
}

</script>

<template>
  <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      @keydown.esc="emit('close')"
  >
    <div class="absolute inset-0 bg-black/30" @click="emit('close')"></div>

    <div class="relative bg-white rounded-2xl w-full max-w-3xl shadow-xl overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b">
        <div class="text-lg font-semibold">{{ $t('activate') }}</div>
        <button class="px-3 py-1 rounded-xl border hover:bg-gray-50" @click="emit('close')">✕</button>
      </div>

      <!-- Body -->
      <div class="p-4 grid grid-cols-1 gap-6 text-sm max-h-[75vh] overflow-y-auto" @keydown.enter.prevent="trySave">
        <!-- Personal -->

        <!-- Contacts -->
        <section class="space-y-3">

          <div>
            <label class="text-xs text-slate-500">{{ $t('auth.email') || 'Էլ․ փոստ' }}</label>
            <input v-model.trim="form.email" type="email" class="w-full border rounded-xl px-3 py-2"
                   placeholder="name@company.am"/>
          </div>


        </section>


        <!-- Documents -->

      </div>

      <!-- Footer -->
      <div class="p-4 border-t flex items-center justify-end gap-2">
        <button class="px-3 py-2 rounded-xl border hover:bg-gray-50" @click="emit('close')" :disabled="saving">
          {{ $t('cancel') || 'Չեղարկել' }}
        </button>
        <button class="px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                @click="trySave"
                :disabled="saving ||!form.email">
          <span v-if="saving">{{ $t('saving') }}</span>
          <span v-else>{{ $t('activate') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>