<template>
  <div class="p-6">
    <h1 class="text-2xl font-semibold mb-4">{{ t('payroll_list') }}</h1>

    <!-- Tabs -->
    <div class="flex border-gray-300 border-b mb-4">
      <button
          v-for="tab in tabs"
          :key="tab.value"
          @click="activeTab = tab.value"
          class="px-4 py-2 transition-colors"
          :class="activeTab === tab.value ? 'border-b-2 border-blue-600 text-blue-600 border-gray-300'  : 'hover:text-gray-800'"
      >
        {{ t(tab.label) }}
      </button>
    </div>

    <!-- Actions / Filters -->
    <div v-if="activeTab === 'unpaid'" class="flex flex-col items-start mb-4 space-y-2">
      <button
          class="whitespace-nowrap bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          :disabled="!selectedIds.length"
          @click="handleDownload(selectedIds)"
      >
        {{ t('download_declarations') }} ({{ selectedIds.length }})
      </button>

      <button
          class="whitespace-nowrap bg-green-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          :disabled="!downloadedSelectedIds.length"
          @click="handlePay(downloadedSelectedIds)"
      >
        {{ t('pay_downloaded_employees') }} ({{ downloadedSelectedIds.length }})
      </button>
    </div>

    <div v-else-if="activeTab === 'paid'" class="flex items-center mb-4 space-x-2">
      <DatePicker v-model="fromDate"   :placeholder="t('start_date')" month-picker auto-apply />
      <DatePicker v-model="toDate" :disabled="!fromDate"   :placeholder="t('end_date')" month-picker auto-apply />
    </div>

    <!-- Content (page scroll) -->
    <div class="border border-gray-300 rounded-xl shadow-sm">
      <!-- Горизонтальный скролл таблицы, вертикальный — у страницы -->
      <div class="overflow-x-auto rounded-xl">
        <table class="min-w-full divide-y divide-gray-200 text-sm text-gray-700">
          <thead class="bg-gray-50">
          <tr>
            <th class="p-3 text-center" v-if="activeTab === 'unpaid'">
              <input type="checkbox" @change="toggleAll" :checked="allSelected" />
            </th>
            <th class="p-3 text-center" v-if="activeTab === 'unpaid'">{{ t('actions') }}</th>
            <th class="p-3 text-center">{{ t('status') }}</th>

            <th class="p-3 text-left">{{ t('employee') }}</th>
            <th class="p-3 text-left">{{ t('month') }}/{{ t('year') }}</th>
            <th class="p-3 text-right">{{ t('daily_salary') }}</th>
            <th class="p-3 text-right">{{ t('income_tax') }}</th>
            <th class="p-3 text-right">{{ t('military_fee') }}</th>
            <th class="p-3 text-right">{{ t('personal_accumulation_fund') }}</th>
            <th class="p-3 text-right">{{ t('net_salary') }}</th>
            <th class="p-3 text-right">{{ t('base_rate') }}</th>
             <th class="p-3 text-center">{{ t('leave_days_unpaid') }}</th>
          </tr>
          </thead>

          <tbody class="divide-y divide-gray-100">
          <tr v-for="item in payrolls" :key="item.id" class="hover:bg-gray-50 transition-colors">
            <td class="p-3 text-center" v-if="activeTab === 'unpaid'">
              <input type="checkbox" :value="item.id" v-model="selectedIds" />
            </td>

            <td class="p-3 text-center" v-if="activeTab === 'unpaid'">
              <button
                  v-if="!item.declaration_downloaded"
                  class="whitespace-nowrap bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-1 rounded"
                  @click="handleDownload([item.id])"
              >
                {{ t('download') }}
              </button>
              <button
                  v-if="item.declaration_downloaded && item.status !== 'paid'"
                  class="whitespace-nowrap bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded"
                  @click="handlePay([item.id])"
              >
                {{ t('pay') }}
              </button>
            </td>
            <td class="p-3 text-center">
                <span
                    class="px-2 py-1 text-xs rounded-full whitespace-nowrap"
                    :class="{
                    'bg-yellow-100 font-bold text-yellow-700': item.status === 'pending',
                    'bg-green-100 font-bold text-green-700': item.status === 'paid',
                  }"
                >
                  {{ t(item.status) }}
                </span>
            </td>

            <td class="p-3">
              <div class="font-medium">{{ item.employee.first_name }} {{ item.employee.last_name }}</div>
              <div class="text-xs text-gray-500">{{ item.employee.email }}</div>
              <div class="text-xs text-gray-500">{{ item.employee.national_id }}</div>
            </td>


            <td class="p-3">{{ item.month }}/{{ item.year }}</td>
            <td class="p-3 text-right">{{ formatCurrency(item.daily_salary) }}</td>
            <td class="p-3 text-right">{{ formatCurrency(item.income_tax) }}</td>
            <td class="p-3 text-right">{{ formatCurrency(item.military_fee) }}</td>
            <td class="p-3 text-right">{{ formatCurrency(item.personal_accumulation_fund) }}</td>
            <td class="p-3 text-right font-semibold">{{ formatCurrency(netSalary(item)) }}</td>
            <td class="p-3 text-right font-semibold">{{ formatCurrency(item.total_salary) }}</td>
            <td class="p-3 text-center">{{ item.leave_days || 0 }}</td>



          </tr>
          </tbody>
        </table>
      </div>

      <!-- Лоадер/состояния -->
      <div v-if="loading" class="p-4 text-center text-gray-500">{{ t('loading') }}...</div>
      <div v-if="allLoaded && payrolls.length && offset >0 " class="p-4 text-center text-gray-500">{{t('no_more')}} </div>
      <div v-if="!loading && !payrolls.length" class="p-4 text-center text-gray-500">{{ t('no_results') }}</div>
    </div>

    <!-- Сентинел внизу страницы, видимый при скролле страницы -->
    <div ref="sentinel" class="h-6"></div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { payrollApi } from '@/api.ts';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

type MonthYear = { month: number; year: number } | null;

interface Employee {
  first_name: string;
  last_name: string;
  email?: string;
  national_id?: string;
}

interface PayrollItem {
  id: number;
  employee: Employee;
  month: number;
  year: number;
  daily_salary: number | string;
  income_tax: number | string;
  military_fee: number | string;
  personal_accumulation_fund: number | string;
  total_salary: number | string;
  leave_days?: number;
  leave_days_unpaid?: number;
  status: 'pending' | 'paid' | string;
  declaration_downloaded?: boolean;
}

const tabs = [
  { value: 'unpaid', label: 'unpaid_payrolls' },
  { value: 'paid', label: 'paid_payrolls' },
] as const;

const activeTab = ref<'unpaid' | 'paid'>('unpaid');

const payrolls = ref<PayrollItem[]>([]);
const selectedIds = ref<number[]>([]);
const fromDate = ref<MonthYear>(null);
const toDate = ref<MonthYear>(null);

const LIMIT = 30;
const offset = ref(0);
const loading = ref(false);
const allLoaded = ref(false);

// Сентинел (внизу страницы)
const sentinel = ref<HTMLDivElement | null>(null);
let observer: IntersectionObserver | null = null;

// Вычисляемые
const allSelected = computed(
    () => payrolls.value.length > 0 && selectedIds.value.length === payrolls.value.length
);

const downloadedSelectedIds = computed(() =>
    selectedIds.value.filter((id) => payrolls.value.find((p) => p.id === id)?.declaration_downloaded)
);

// Helpers
function toggleAll(e: Event) {
  const checked = (e.target as HTMLInputElement).checked;
  selectedIds.value = checked ? payrolls.value.map((p) => p.id) : [];
}


function netSalary(item: any): number {
  const totalSalary = Number(item.total_salary);
  const incomeTax = Number(item.income_tax);
  const militaryFee = Number(item.military_fee);
  const personalFund = Number(item.personal_accumulation_fund);
  const leaveDeduction = Number(item.daily_salary * item.leave_days);

  const payrollDate = new Date(item.year, item.month, 15); // Оплата до 15 числа следующего месяца
  const today = new Date();
  let penalty = 0;

  if (today > payrollDate) {
    const diffTime = today.getTime() - payrollDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const dailyPenaltyPercentage = Number(item.daily_penalty_percentage) || 0;
    penalty = (totalSalary * dailyPenaltyPercentage / 100) * diffDays;
  }

  const net = totalSalary - incomeTax - militaryFee - personalFund - leaveDeduction + penalty;
  return net > 0 ? net : 0;
}

function formatCurrency(value: string | number) {
  const formatted = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
  return `${formatted} ֏`;
}
function incrementMonth(date: { month: number; year: number } | null) {
  if (!date) return null;
  let { month, year } = date;
  month += 1;
  if (month > 12) {
    month = 1;
    year += 1;
  }
  return { month, year };
}

// Загрузчик с корректной логикой offset/allLoaded
async function loadPayrolls(tab: 'unpaid' | 'paid', append = false) {
  if (loading.value || (append && allLoaded.value)) return;
  loading.value = true;

  try {
    let data: any;

    if (tab === 'unpaid') {
      data = await payrollApi.getUnpaid({ limit: LIMIT, offset: offset.value });
    } else {
      const to = toDate.value ? incrementMonth(toDate.value) : null;
      const from = fromDate.value ? incrementMonth(fromDate.value) : null;

      data = await payrollApi.getPaid({
        limit: LIMIT,
        offset: offset.value,
        to,
        from,
      });
    }

    const newItems: PayrollItem[] = data?.data || [];

    if (append) {
      if (!newItems.length) {
        allLoaded.value = true;
        return;
      }
      payrolls.value = payrolls.value.concat(newItems);
      offset.value += newItems.length;
      if (newItems.length < LIMIT) allLoaded.value = true;
    } else {
      payrolls.value = newItems;
      selectedIds.value = [];
      offset.value = newItems.length;
      allLoaded.value = newItems.length < LIMIT;
    }
  } finally {
    loading.value = false;
  }
}

// Действия
async function handleDownload(ids: number[]) {
  if (!ids.length) return;
  await payrollApi.downloadDeclarations(ids);
  payrolls.value.forEach((p) => {
    if (ids.includes(p.id)) p.declaration_downloaded = true;
  });
}

async function handlePay(ids: number[]) {
  if (!ids.length) return;
  await payrollApi.payPayroll(ids);
  offset.value = 0;
  allLoaded.value = false;
  await loadPayrolls(activeTab.value, false);
}

// Фильтры
function applyFilters() {
  offset.value = 0;
  allLoaded.value = false;
  loadPayrolls(activeTab.value);
}

// IntersectionObserver — корень вьюпорт (скролл всей страницы)
function setupObserver() {
  if (!sentinel.value) return;

  observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !loading.value && !allLoaded.value) {
          loadPayrolls(activeTab.value, true);
        }
      },
      {
        root: null,                 // <— главное: слушаем ВЬЮПОРТ, а не контейнер
        rootMargin: '0px 0px 300px 0px',
        threshold: 0,
      }
  );

  observer.observe(sentinel.value);
}

function cleanupObserver() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
}

// Lifecycle
onMounted(async () => {
  await loadPayrolls(activeTab.value);
  setupObserver();
});

onBeforeUnmount(() => {
  cleanupObserver();
});

// Реакция на смену таба/фильтров
watch(activeTab, async () => {
  selectedIds.value = [];
  offset.value = 0;
  allLoaded.value = false;
  await loadPayrolls(activeTab.value);
  cleanupObserver();
  setupObserver();
});

watch([fromDate, toDate], async () => {
  if (activeTab.value !== 'paid') return;
  offset.value = 0;
  allLoaded.value = false;
  await loadPayrolls(activeTab.value);
});
</script>

<style scoped>
/* Только горизонтальный скролл у таблицы — кастом вертикали не нужен, т.к. скроллит страница */
</style>
