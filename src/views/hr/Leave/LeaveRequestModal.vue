<template>
  <div v-if="open" class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/40" @click="$emit('close')"></div>

    <div
        class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-xl"
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-5 py-4 border-b">
        <h3 class="text-lg font-semibold">
          {{ $t('new_leave_request') || 'Նոր արձակուրդի հայտ' }}
        </h3>
        <button
            class="p-2 rounded-lg hover:bg-gray-100"
            @click="$emit('close')"
            aria-label="Close"
        >
          ✕
        </button>
      </div>

      <!-- Body -->
      <div class="p-5 space-y-6">
        <!-- Leave Type -->
        <div class="flex flex-col gap-y-2">
          <label class="text-sm text-gray-600">
            {{ $t('leave_type') || 'Արձակուրդի տեսակ' }}
            <span class="text-red-600">*</span>
          </label>
          <select
              v-model="form.leave_type_id"
              class="w-full px-3 py-2 rounded-xl border border-gray-300"
          >
            <option value="">
              {{ $t('select_leave_type') || 'Ընտրել արձակուրդի տեսակ' }}
            </option>
            <option v-for="type in leaveTypes" :key="type.id" :value="type.id">
              {{ type.name }}
              <span v-if="getBalance(type.id) !== null">
                ({{ getBalance(type.id) }} օր մնաց)
              </span>
            </option>
            <option value="custom">
              {{ $t('custom_type') || 'Այլ (սեփական անվանում)' }}
            </option>
          </select>
        </div>

        <!-- Selected Leave Info -->
        <div v-if="selectedLeaveType" class="text-sm text-gray-700">
          <p>Ընդհանուր օրեր: {{ selectedLeaveType.days }}</p>
          <p v-if="selectedLeaveType.affects_balance">
            Մնացած օրեր: {{ getBalance(selectedLeaveType.id) }}
          </p>
          <p v-else>Այս արձակուրդը չի հաշվում մնացած օրերի վրա</p>
        </div>

        <!-- Custom Type -->
        <div v-if="form.leave_type_id === 'custom'" class="flex flex-col gap-y-2">
          <label class="text-sm text-gray-600">
            {{ $t('custom_type_name') || 'Արձակուրդի անվանում' }}
            <span class="text-red-600">*</span>
          </label>
          <input
              v-model="form.name"
              class="w-full px-3 py-2 rounded-xl border border-gray-300"
              :placeholder="$t('custom_type_placeholder') || 'օր. Անձնական պատճառներով'"
          />
        </div>

        <!-- Dates -->
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="flex flex-col gap-y-2">
            <label class="text-sm text-gray-600">
              {{ $t('start_date') || 'Սկիզբ' }}
              <span class="text-red-600">*</span>
            </label>
            <DatePicker
                v-model="form.date_from"
                :clearable="false"
                :enable-time-picker="false"
                :min-date="tomorrow"
                :teleport="true"
                auto-apply
                z-index="3000"
                class="w-full"
            />
          </div>

          <div class="flex flex-col gap-y-2">
            <label class="text-sm text-gray-600">
              {{ $t('end_date') || 'Վերջ' }}
              <span class="text-red-600">*</span>
            </label>
            <DatePicker
                v-model="form.date_to"
                :clearable="false"
                :enable-time-picker="false"
                :min-date="form.date_from || tomorrow"
                :teleport="true"
                auto-apply
                z-index="3000"
                class="w-full"
            />
          </div>
        </div>

        <!-- Requested Days Info -->
        <div v-if="requestedDays > 0" class="text-sm text-gray-700">
          <p>Խնդրված օրեր: {{ requestedDays }}</p>
          <p
              v-if="selectedLeaveType && selectedLeaveType.affects_balance && requestedDays > getBalance(selectedLeaveType.id)"
              class="text-red-600"
          >
            Խնդրած օրերի թիվը գերազանցում է մնացած օրերը
          </p>
        </div>

        <!-- Validation error -->
        <div
            v-if="formError"
            class="rounded-xl border border-red-200 bg-red-50 text-red-800 p-2 text-sm"
        >
          {{ formError }}
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end gap-2 pt-2 border-t">
          <button class="px-3 py-2 rounded-xl border hover:bg-gray-50" @click="$emit('close')">
            {{ $t('cancel') || 'Փակել' }}
          </button>
          <button
              class="px-3 py-2 rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
              :disabled="saving || (selectedLeaveType && selectedLeaveType.affects_balance && requestedDays > getBalance(selectedLeaveType.id))"
              @click="submit"
          >
            {{ saving ? ($t('saving') || 'Պահպանում…') : ($t('save') || 'Պահպանել') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, onMounted, ref} from "vue";
import {employeesApi, leaveRequestApi} from "@/api.ts";
import {useAuth} from "@/stores/auth.ts";
import DatePicker from "@vuepic/vue-datepicker";
import "@vuepic/vue-datepicker/dist/main.css";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ (e: "close"): void; (e: "saved"): void }>();

const auth = useAuth();
const employeeId = auth.user?.employee?.id;

const saving = ref(false);
const formError = ref("");
const leaveTypes = ref<any[]>([]);
const leaveBalances = ref<any[]>([]);

const form = ref({
  leave_type_id: "",
  name: "",
  date_from: null as Date | null,
  date_to: null as Date | null,
});

// Tomorrow minimum
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);

// Fetch leave types & balances
const fetchData = async () => {
  try {
    const {data: types} = await employeesApi.getLiveTypes(employeeId);
    leaveTypes.value = types?.data ?? types ?? [];

    const {data: balances} = await employeesApi.getLeaveBalances(employeeId);
    leaveBalances.value = balances?.data ?? balances ?? [];
  } catch (e) {
    console.error(e);
  }
};

// Computed: selected leave type
const selectedLeaveType = computed(() => {
  return leaveTypes.value.find(t => t.id === form.value.leave_type_id) || null;
});

// Get remaining balance for a leave type
const getBalance = (typeId: number) => {
  const balance = leaveBalances.value.find(b => b.leave_type_id === typeId);
  return balance ? balance.days_balance : 0;
};

// Requested days calculation
const requestedDays = computed(() => {

  if (!form.value.date_from || !form.value.date_to) return 0;
  const diff =
      Math.ceil((form.value.date_to.getTime() - form.value.date_from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return diff > 0 ? diff : 0;
});

// Validation
const validate = (): string => {
  if (!form.value.leave_type_id) return "Ընտրեք արձակուրդի տեսակ։";
  if (form.value.leave_type_id === "custom" && !form.value.name.trim())
    return "Մուտքագրեք արձակուրդի անվանում։";
  if (!form.value.date_from) return "Սկիզբը պարտադիր է։";
  if (!form.value.date_to) return "Վերջը պարտադիր է։";
  if (requestedDays.value > getBalance(selectedLeaveType.value.id)) {
    return "Խնդրած օրերի թիվը գերազանցում է հասանելի օրերը։";
  }
  return "";
};

// Submit leave request
const submit = async () => {
  formError.value = validate();
  if (formError.value) return;

  saving.value = true;

  try {
    await leaveRequestApi.create({
      employee_id: auth.user?.employee?.id,
      leave_type_id: form.value.leave_type_id === "custom" ? null : form.value.leave_type_id,
      name: form.value.leave_type_id === "custom" ? form.value.name : null,
      date_from: form.value.date_from.toISOString().slice(0, 10),
      date_to: form.value.date_to.toISOString().slice(0, 10),
      days: requestedDays.value
    });
    emit("saved");
    emit("close");
  } catch (e) {
    console.error(e);
  } finally {
    saving.value = false;
  }
};

onMounted(fetchData);
</script>
