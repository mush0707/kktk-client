<template>
  <div class="space-y-6">
    <!-- send_to_purchasing → max prices -->
    <div class="flex items-center justify-between bg-white border border-gray-300 p-4 rounded-xl">
      <div class="flex items-center gap-6">
        <!-- Advance is hidden for now (kept as state in script) -->

        <div v-if="isSend" class="flex flex-col gap-y-1">
          <label class="text-sm text-gray-600">Ընդհանուր ամիսների քանակը</label>
          <input
              v-model.number="totalMonths"
              type="number"
              step="1"
              class="w-40 px-3 py-2 rounded-xl border border-gray-300"
              :title="'Օգտագործվում է ոչ պարբերական աշխատանքների/ծառայությունների փուլերի կանխադրման համար'"
          />
          <div class="text-xs text-slate-500 mt-1">
            Մին․՝ {{ minTotalMonths }}
          </div>
        </div>
        <div v-else>
          <label class="text-sm text-gray-600">Ընդհանուր ամիսների քանակը</label>
          <p>{{ totalMonths }} ամիս</p>
        </div>
      </div>

      <button
          v-if="!isAnnounce"
          class="px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          :disabled="saving || !canSaveMax"
          @click="saveMaxPrices"
      >
        Թարմացնել
      </button>
    </div>

    <!-- announce_tender → final prices + activate hint -->
    <div v-if="isAnnounce" class="flex items-center justify-between bg-indigo-50 border border-gray-300 rounded-xl p-4">
      <div class="text-sm">
        Մուտքագրիր վերջնական (գնման) գները բոլոր տողերի համար։
      </div>
      <button
          class="px-3 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
          :disabled="saving || !canSaveFinal"
          @click="saveFinalPrices"
      >
        Թարմացնել գնման գները
      </button>
    </div>

    <!-- GROUPING -->
    <div class="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
      <div class="font-medium">Փուլերի խմբավորում</div>
      <div class="flex flex-wrap gap-2">
        <div v-for="b in phaseBuckets" :key="b.key + '-details'">
          <div class="rounded-lg border border-amber-200 bg-amber-50/40">
            <!-- bucket header + tools -->
            <p class="px-2 py-2">
              {{ bucketLabel(b) }}
            </p>
            <div class="flex items-center gap-2 px-3 py-2 border-b border-amber-200/70">
              <div class="flex flex-col">
                <label class="inline-flex items-center gap-2 font-medium text-amber-800">
                  <input
                      type="checkbox"
                      :checked="selectedBucketKeys.has(b.key)"
                      :disabled="disabledBuckets.has(b.key)"
                      @change="toggleBucket(b.key)"
                  />
                </label>
              </div>

              <div class="flex items-center gap-2 text-[12px]">
                <button
                    class="px-2 py-1 rounded border border-amber-300 hover:bg-amber-100 disabled:opacity-50"
                    :disabled="disabledBuckets.has(b.key)"
                    @click="selectAllInBucket(b)"
                    :title="`Նշել բոլորը · ${bucketLabel(b)}`"
                >Նշել բոլորը</button>
                <button
                    class="px-2 py-1 rounded border border-amber-300 hover:bg-amber-100 disabled:opacity-50"
                    :disabled="disabledBuckets.has(b.key)"
                    @click="deselectAllInBucket(b)"
                    :title="`Հանել բոլորը · ${bucketLabel(b)}`"
                >Հանել բոլորը</button>
              </div>
            </div>

            <!-- scrollable list -->
            <div class="max-h-60 overflow-y-auto px-3 py-2">
              <label
                  v-for="it in b.items"
                  :key="atomKey(it)"
                  class="flex items-center gap-2 py-1.5 text-sm"
              >
                <input
                    type="checkbox"
                    class="mr-1"
                    :checked="isRowSelected(b.key, it)"
                    :disabled="disabledBuckets.has(b.key) && b.items.length===1"
                    @change="toggleRowInBucket(b.key, it, ($event.target as HTMLInputElement).checked)"
                />
                <span>
                  {{ itemTitle(it) }}
                  <span v-if="phaseTitle(it)" class="text-gray-500">({{ phaseTitle(it) }})</span>
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- preview -->
      <div v-if="chosenGroups.length" class="pt-2 border-t border-amber-200">
        <div class="text-sm text-amber-900 mb-2">Ընտրված խմբավորումներ</div>
        <ul class="list-disc list-inside text-sm space-y-1">
          <li v-for="g in chosenGroups" :key="g.key">
            <b>{{ bucketLabel(g) }}</b> — {{ g.items.length }} փուլ
          </li>
        </ul>
      </div>
    </div>

    <!-- PRODUCTS -->
    <div class="bg-white border border-gray-300 overflow-hidden rounded-xl">
      <div class="px-4 py-3 border-b font-medium">Ապրանքներ</div>
      <table class="min-w-full text-sm">
        <thead class="bg-gray-50">
        <tr class="text-left">
          <th class="px-3 py-2 text-left">Անվանում</th>
          <th class="px-3 py-2 text-right w-[120px]">Քանակ</th>
          <th class="px-3 py-2 text-right w-[120px]">Չափ</th>
          <th class="px-3 py-2 text-right w-[160px]">Պարբերականություն</th>
          <th class="px-4 py-2 text-right">Հիմնական գին (Դ)</th>
          <th class="px-4 py-2 text-right" v-if="isAnnounce">Գնման գին (Դ)</th>
          <th class="px-4 py-2 w-0" v-if="isSend"></th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="p in productsShown" :key="p.id" class="border-t">
          <td class="px-3 py-2">
            <div class="font-medium">{{ p.product?.name }}</div>
            <div v-if="(p.product?.characteristics||[]).length" class="mt-1 flex flex-wrap gap-1">
                <span
                    v-for="c in p.product.characteristics"
                    :key="c.id||c.name"
                    class="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-700"
                >{{ c.name }}</span>
            </div>
            <div class="text-xs text-slate-500">
              <span v-if="p.product?.type?.name">{{ p.product.type.name }}</span>
              <span v-if="p.product?.type?.group?.name" class="ml-1 text-slate-400">
                  ({{ p.product.type.group.name }})
                </span>
            </div>
          </td>

          <td class="px-3 py-2 text-right">{{ formatNumber(p.qty) }}</td>
          <td class="px-3 py-2 text-right">{{ $t(p.measure ?? 'piece') }}</td>
          <td class="px-3 py-2 text-right">{{ periodicityLabel(p) }}</td>

          <!-- View mode (announce): show max + phases button -->
          <td class="px-4 py-2 text-right" v-if="isAnnounce">
            <div class="flex flex-col gap-y-2">
              <p>{{ p.maximum_price ?? 0 }}</p>
              <div class="flex justify-end">
                <button
                    class="px-2 py-2 text-xs text-white bg-sky-600 rounded hover:bg-sky-700"
                    @click="openPhases('product', p)"
                    :title="phaseSummaryTitle('product', p.id)"
                >
                    <span class="flex flex-col gap-y-2">
                      <span>Վճարման Փուլեր</span>
                      <span class="text-white" v-if="isRecurringRow(p) && productPhases[p.id]?.length">
                        {{ phaseSummaryInline(productPhases[p.id]) }}
                      </span>
                      <span class="text-white" v-else-if="productManualPhases[p.id]?.length">
                        {{ manualPhaseSummaryInline(productManualPhases[p.id]) }}
                      </span>
                    </span>
                </button>
              </div>
            </div>
          </td>

          <!-- Send mode: max inputs + phases button -->
          <td class="px-4 py-2 align-top" v-if="isSend">
            <div class="flex justify-end">
              <div class="flex flex-col gap-y-2">
                <input
                    type="number"
                    min="0"
                    step="0.01"
                    class="w-36 px-2 py-2 rounded-md border border-gray-300"
                    v-model.number="productMax[p.id]"
                />
                <button
                    class="px-2 py-2 text-xs text-white bg-sky-600 rounded hover:bg-sky-700"
                    @click="openPhases('product', p)"
                    :title="phaseSummaryTitle('product', p.id)"
                >
                    <span class="flex flex-col gap-y-2">
                      <span>Վճարման Փուլեր</span>
                      <span class="text-white" v-if="isRecurringRow(p) && productPhases[p.id]?.length">
                        {{ phaseSummaryInline(productPhases[p.id]) }}
                      </span>
                      <span class="text-white" v-else-if="productManualPhases[p.id]?.length">
                        {{ manualPhaseSummaryInline(productManualPhases[p.id]) }}
                      </span>
                    </span>
                </button>
              </div>
            </div>
          </td>

          <!-- Announce: final prices input -->
          <td class="px-4 py-2" v-if="isAnnounce">
            <div class="flex justify-end">
              <input
                  type="number"
                  min="0"
                  step="0.01"
                  class="w-36 px-2 py-2 rounded-md border border-gray-300"
                  v-model.number="productFinal[p.id]"
              />
            </div>
          </td>

          <!-- Send: row actions -->
          <td class="px-4 py-2" v-if="isSend">
            <div class="flex flex-col">
              <button
                  class="px-2 py-1 text-xs text-white bg-red-600 rounded hover:bg-red-700"
                  @click="rejectProduct(p.id)"
              >
                Չեղարկել
              </button>
            </div>
          </td>
        </tr>

        <tr v-if="productsShown.length === 0">
          <td :colspan="isSend ? 7 : 6" class="px-4 py-6 text-center text-gray-500">Ապրանք չկա</td>
        </tr>
        </tbody>
      </table>
    </div>

    <!-- OFFERINGS -->
    <div class="bg-white border border-gray-300 overflow-hidden rounded-xl">
      <div class="px-4 py-3 border-b font-medium">Աշխատանքներ / Ծառայություններ</div>
      <table class="min-w-full text-sm">
        <thead class="bg-gray-50">
        <tr class="text-left">
          <th class="px-3 py-2 text-left w-[140px]">Տիպ</th>
          <th class="px-4 py-2">Անվանում</th>
          <th class="px-4 py-2 text-right">Քանակ</th>
          <th class="px-3 py-2 text-right w-[160px]">Պարբերականություն</th>
          <th class="px-4 py-2 text-right">Հիմնական գին (Դ)</th>
          <th class="px-4 py-2 text-right" v-if="isAnnounce">Գնման գին (Դ)</th>
          <th class="px-4 py-2 w-0" v-if="isSend"></th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="o in offeringsShown" :key="o.id" class="border-t">
          <td class="px-3 py-2">
              <span
                  class="px-2 py-0.5 rounded text-xs"
                  :class="o.offering?.block === 'work' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'"
              >
                {{ o.offering?.block === 'work' ? 'Աշխատանք' : 'Ծառայություն' }}
              </span>
          </td>
          <td class="px-3 py-2">
            <div class="font-medium">{{ o.offering?.name }}</div>
            <div class="text-xs text-slate-500" v-if="o.offering?.type?.name">
              Տեսակ՝ {{ o.offering.type.name }}
            </div>
          </td>
          <td class="px-3 py-2 text-right">{{ formatNumber(o.qty) }}</td>
          <td class="px-3 py-2 text-right">{{ periodicityLabel(o) }}</td>

          <!-- View mode (announce): show max + phases button -->
          <td class="px-4 py-2 text-right" v-if="isAnnounce">
            <div class="flex flex-col gap-y-2">
              <p>{{ o.maximum_price ?? 0 }}</p>
              <div class="flex justify-end">
                <button
                    class="px-2 py-2 text-xs text-white bg-sky-600 rounded hover:bg-sky-700"
                    @click="openPhases('offering', o)"
                    :title="offeringPhaseTitle(o)"
                >
                    <span class="flex flex-col gap-y-2">
                      <span>Վճարման Փուլեր</span>
                      <span class="text-white" v-if="isRecurringRow(o) && offeringRecurringPhases[o.id]?.length">
                        {{ phaseSummaryInline(offeringRecurringPhases[o.id]) }}
                      </span>
                      <span class="text-white" v-else-if="offeringManualPhases[o.id]?.length">
                        {{ manualPhaseSummaryInline(offeringManualPhases[o.id]) }}
                      </span>
                    </span>
                </button>
              </div>
            </div>
          </td>

          <!-- Send mode: max inputs + phases button -->
          <td class="px-4 py-2 align-top" v-if="isSend">
            <div class="flex justify-end">
              <div class="flex flex-col gap-y-2">
                <input
                    type="number"
                    min="0"
                    step="0.01"
                    class="w-36 px-2 py-2 rounded-md border border-gray-300"
                    v-model.number="offeringMax[o.id]"
                />
                <button
                    class="px-2 py-2 text-xs text-white bg-sky-600 rounded hover:bg-sky-700"
                    @click="openPhases('offering', o)"
                    :title="offeringPhaseTitle(o)"
                >
                    <span class="flex flex-col gap-y-2">
                      <span>Վճարման Փուլեր</span>
                      <span class="text-white" v-if="isRecurringRow(o) && offeringRecurringPhases[o.id]?.length">
                        {{ phaseSummaryInline(offeringRecurringPhases[o.id]) }}
                      </span>
                      <span class="text-white" v-else-if="offeringManualPhases[o.id]?.length">
                        {{ manualPhaseSummaryInline(offeringManualPhases[o.id]) }}
                      </span>
                    </span>
                </button>
              </div>
            </div>
          </td>

          <!-- Announce: final prices input -->
          <td class="px-4 py-2" v-if="isAnnounce">
            <div class="flex justify-end">
              <input
                  type="number"
                  min="0"
                  step="0.01"
                  class="w-36 px-2 py-2 rounded-md border border-gray-300"
                  v-model.number="offeringFinal[o.id]"
              />
            </div>
          </td>

          <!-- Send: row actions -->
          <td class="px-4 py-2" v-if="isSend">
            <div class="flex flex-col gap-y-2">
              <button
                  class="px-2 py-1 text-xs text-white bg-red-600 rounded hover:bg-red-700"
                  @click="rejectOffering(o.id)"
              >
                Չեղարկել
              </button>
            </div>
          </td>
        </tr>

        <tr v-if="offeringsShown.length === 0">
          <td :colspan="isSend ? 7 : 6" class="px-4 py-6 text-center text-gray-500">Տող չկա</td>
        </tr>
        </tbody>
      </table>
    </div>

    <!-- Phases Modal -->
    <div v-if="phasesModal.open" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/40" @click="closePhases"></div>
      <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl bg-white rounded-2xl shadow-xl">
        <div class="flex items-center justify-between px-5 py-4 border-b">
          <h3 class="text-lg font-semibold">
            Փուլերի կազմավորում
            <span v-if="phasesModal.kind==='product'">· Ապրանք {{ phasesModal.name }}</span>
            <span v-else>· Աշխատանք/Ծառայություն {{ phasesModal.name }}</span>
          </h3>
          <button class="p-2 rounded-lg hover:bg-gray-100" @click="closePhases" aria-label="Close">✕</button>
        </div>

        <!-- Recurring: simple percentages -->
        <div v-if="phasesModal.mode==='recurring'" class="p-5 space-y-4">
          <div v-if="isSend" class="flex items-center p-4 mb-4 text-sm text-blue-800 rounded-lg bg-blue-50" role="alert">
            <svg class="shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z"/>
            </svg>
            <div><span class="font-medium">Ինֆո.</span> Տոկոսների գումարը չի կարող լինել <b>ավելի քան 100%</b>.</div>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div v-for="(v, idx) in phasesModal.values" :key="'rp'+idx" class="space-y-1">
              <label class="text-xs text-slate-500">Փուլ {{ idx + 1 }}</label>
              <input
                  v-if="idx < phasesModal.values.length - 1"
                  type="number"
                  min="0"
                  step="0.01"
                  class="w-full px-3 py-2 rounded-xl border"
                  :value="phasesModal.values[idx]"
                  @input="onRecurringChange(idx, ($event.target as HTMLInputElement).value)"
              />
              <input
                  v-else
                  type="number"
                  step="0.01"
                  class="w-full px-3 py-2 rounded-xl border bg-gray-50 text-gray-600"
                  :value="phasesModal.values[idx]"
                  disabled
              />
            </div>
          </div>

          <div class="text-sm" :class="sumPhases > 100 ? 'text-rose-600' : 'text-slate-600'">
            Ընդամենը՝ <b>{{ formatNumber(sumPhases) }}%</b>
          </div>
        </div>

        <!-- Non-recurring: rich editor -->
        <div v-else class="p-5 space-y-4">
          <div v-if="isSend" class="flex p-4 text-sm text-blue-800 rounded-lg bg-blue-50" role="alert">
            <div>
              <ul class="mt-1.5 list-disc list-inside">
                <li>Փուլի ժամկետը հաշվում է համաձայնագրի ուժի մեջ մտնելու օրվանից</li>
              </ul>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full text-sm border rounded-lg overflow-hidden">
              <thead class="bg-gray-50">
              <tr class="text-left">
                <th class="px-3 py-2">Անվանում</th>
                <th class="px-3 py-2 w-[160px]">Ժամկետ (ամիս)</th>
                <th class="px-3 py-2 w-[140px]">Տոկոս (%)</th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="(row, idx) in phasesModal.manualRows" :key="'mp'+idx" class="border-t">
                <td class="px-3 py-2">
                  <input v-if="isSend" v-model.trim="row.name" class="w-full px-2 py-1 rounded-md border" placeholder="Փուլ {{ idx+1 }}" />
                  <span v-else>{{ row.name }}</span>
                </td>
                <td class="px-3 py-2">
                  <div v-if="isSend">
                    <div class="flex items-center mb-2">
                      <input :id="'stage-'+idx" v-model="row.duration_in_contract_end" type="checkbox" class="w-4 h-4 text-blue-600 border-gray-300 rounded-sm">
                      <label :for="'stage-'+idx" class="ms-2 text-sm text-gray-900">Համաձայնագրի ավարտին</label>
                    </div>
                    <input
                        v-if="!row.duration_in_contract_end"
                        type="number"
                        min="1"
                        step="1"
                        v-model.number="row.duration_value"
                        @input="onManualDurationInput(idx, ($event.target as HTMLInputElement).value)"
                        class="w-full px-2 py-2 rounded-md border border-gray-300"
                    />
                  </div>
                  <div v-else>
                    <p v-if="!row.duration_value">Համաձայնագրի ավարտին</p>
                    <p v-else>{{ row.duration_value }} ամիս</p>
                  </div>
                </td>
                <td class="px-3 py-2">
                  <p>{{ row.percent }} %</p>
                </td>
              </tr>
              </tbody>
            </table>
          </div>

          <div class="text-sm" :class="sumManualPercents > 100 ? 'text-rose-600' : 'text-slate-600'">
            Ընդամենը՝ <b>{{ formatNumber(sumManualPercents) }}%</b>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 px-5 py-4 border-t">
          <button class="px-3 py-2 rounded-xl border hover:bg-gray-50" @click="closePhases">Փակել</button>
          <button
              v-if="isSend"
              class="px-3 py-2 rounded-xl text-white"
              :class="applyDisabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'"
              :disabled="applyDisabled"
              @click="applyPhases"
          >
            Պահպանել
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect, watch } from 'vue'
import { purchasingOrdersApi } from '@/api.ts'
import { useRouter } from 'vue-router'

type AnyRow = any
type ManualPhase = {
  name: string
  duration_value: number | null
  duration_unit: 'months' | 'days'
  percent: number
  duration_in_contract_end: boolean
}
type PhaseWindow = { start: number | null; end: number } // start=null means “ignore start”
type PhaseAtom = {
  rowId: number
  kind: 'product' | 'offering'
  label: string
  window: PhaseWindow
}

const props = defineProps<{ order: any }>()
const emit = defineEmits<{ (e: 'updated'): void }>()
const router = useRouter()

/* Filtered rows for isSend mode */
const productsShown = computed(() => {
  const items = props.order?.products || []
  return isSend.value ? items.filter((x: AnyRow) => x.status === 'send_to_purchasing') : items
})
const offeringsShown = computed(() => {
  const items = props.order?.offerings || []
  return isSend.value ? items.filter((x: AnyRow) => x.status === 'send_to_purchasing') : items
})

/* Status */
const isSend = computed(() => props.order?.status === 'send_to_purchasing')
const isAnnounce = computed(() => props.order?.status === 'announce_tender')

/* Top-level state (mapped) */
const advance = ref<number>(0)
const totalMonths = ref<number>(1)
const saving = ref(false)

/** Prices */
const productMax = ref<Record<number, number>>({})
const offeringMax = ref<Record<number, number>>({})
const productFinal = ref<Record<number, number>>({})
const offeringFinal = ref<Record<number, number>>({})

/** Recurring phases (percent splits) */
const productPhases = ref<Record<number, number[]>>({})
const offeringRecurringPhases = ref<Record<number, number[]>>({})
/** Non-recurring phases (rich rows) */
const productManualPhases = ref<Record<number, ManualPhase[]>>({})
const offeringManualPhases = ref<Record<number, ManualPhase[]>>({})

/* ---- modal state ---- */
const phasesModal = ref<{
  open: boolean
  kind: 'product' | 'offering' | null
  id: number | null
  name: string | null
  mode: 'recurring' | 'manual' | null
  values: number[]
  manualRows: ManualPhase[]
}>({
  open: false,
  kind: null,
  id: null,
  name: null,
  mode: null,
  values: [],
  manualRows: [],
})

/* ---- Helpers: periodicity & formatting ---- */
function formatNumber(
    value: any,
    { maximumFractionDigits = 6, minimumFractionDigits = 0, locale = 'en-US' } = {}
): string {
  if (value === null || value === undefined || value === '') return ''
  const num = typeof value === 'string' ? Number(value) : value
  if (!isFinite(num)) return String(value)
  return new Intl.NumberFormat(locale, { maximumFractionDigits, minimumFractionDigits, useGrouping: false }).format(num)
}
function periodicityLabel(r: AnyRow): string {
  if (!r?.recurring) return 'Մեկ անգամով'
  const every = Number(r?.recurring_per_month_qty)
  const times = Number(r?.recurring_qty)
  const deadline = Number(r?.recurring_deadline_month_qty)
  const fmt = (n: number) => formatNumber(n, { maximumFractionDigits: 6 })
  return `յուրաքանչյուր ${fmt(every)} ամիսը ${fmt(times)} անգամ · մինչև ${fmt(deadline)} ամիս`
}
function isRecurringVal(v: any): boolean { return v === true || v === 1 || v === '1' }
function isRecurringRow(r: AnyRow): boolean { return isRecurringVal(r?.recurring) }

/** Build phase windows for a single row according to the rules. */
function buildWindowsForRow(kind: 'product'|'offering', row: AnyRow): PhaseAtom[] {
  const id = Number(row.id)
  const atoms: PhaseAtom[] = []

  if (isRecurringRow(row)) {
    const step = Math.max(1, Number(row?.recurring_per_month_qty || 0))
    const deadline = Math.max(step, Number(row?.recurring_deadline_month_qty || step))
    const count = Math.max(1, Math.floor(deadline / step))
    for (let i = 0; i < count; i++) {
      const start = i * step
      const end   = (i + 1) * step
      atoms.push({
        rowId: id,
        kind,
        label: (kind === 'product' ? (row.product?.name || 'Ապրանք') : (row.offering?.name || 'Աշխ/Ծառ')),
        window: { start, end }
      })
    }
    return atoms
  }

  // Non-recurring: take one stage from the *manual* bags (already applied/edited)
  const bag = (kind === 'product' ? productManualPhases.value[id] : offeringManualPhases.value[id]) || []
  const phase = bag.length ? bag[0] : { duration_in_contract_end: true, duration_value: null }

  if (phase.duration_in_contract_end) {
    atoms.push({
      rowId: id,
      kind,
      label: (kind === 'product' ? (row.product?.name || 'Ապրանք') : (row.offering?.name || 'Աշխ/Ծառ')),
      window: { start: null, end: Number(totalMonths.value || 1) }
    })
  } else {
    const dur = Math.max(1, Number(phase.duration_value || 1))
    atoms.push({
      rowId: id,
      kind,
      label: (kind === 'product' ? (row.product?.name || 'Ապրանք') : (row.offering?.name || 'Աշխ/Ծառ')),
      window: { start: 0, end: dur }
    })
  }
  return atoms
}

/** Collect all atoms from visible rows. */
const allPhaseAtoms = computed<PhaseAtom[]>(() => {
  const list: PhaseAtom[] = []
  for (const p of productsShown.value || []) list.push(...buildWindowsForRow('product', p))
  for (const o of offeringsShown.value || []) list.push(...buildWindowsForRow('offering', o))
  return list
})

/** Grouping key: if end === totalMonths OR start is null → ignore start using `*` */
function bucketKey(w: PhaseWindow, total: number): string {
  if (w.start == null || Number(w.end) === Number(total)) return `*-${Number(w.end)}`
  return `${Number(w.start)}-${Number(w.end)}`
}

/** Buckets built STRICTLY by the rules (can only group within these). */
const phaseBuckets = computed(() => {
  const t = Number(totalMonths.value || 1)
  const map = new Map<string, { key: string; start: number|null; end: number; items: PhaseAtom[] }>()
  for (const atom of allPhaseAtoms.value) {
    const key = bucketKey(atom.window, t)
    if (!map.has(key)) {
      const [sRaw, eRaw] = key.split('-')
      const s = sRaw === '*' ? null : Number(sRaw)
      const e = Number(eRaw)
      map.set(key, { key, start: s, end: e, items: [] })
    }
    map.get(key)!.items.push(atom)
  }
  return Array.from(map.values()).sort((a, b) => {
    const an = a.start == null ? 1 : 0
    const bn = b.start == null ? 1 : 0
    if (an !== bn) return an - bn
    if ((a.start ?? 0) !== (b.start ?? 0)) return (a.start ?? 0) - (b.start ?? 0)
    return a.end - b.end
  })
})

/** User selections **/
const disabledBuckets = ref<Set<string>>(new Set())
const selectedBucketKeys = ref<Set<string>>(new Set())

/** For each bucket key we store a Set of selected atom keys */
const selectedRowsByBucket = ref<Record<string, Set<string>>>({})

function atomKey(a: PhaseAtom) {
  const s = a.window.start == null ? '*' : a.window.start
  return `${a.kind}:${a.rowId}:${s}-${a.window.end}`
}

/** Toggle a bucket on/off. */
function toggleBucket(key: string) {
  const selected = new Set(selectedBucketKeys.value)
  if (selected.has(key)) {
    selected.delete(key)
    const m = { ...selectedRowsByBucket.value }
    delete m[key]
    selectedRowsByBucket.value = m
  } else {
    selected.add(key)
    const b = phaseBuckets.value.find(x => x.key === key)
    const m = { ...selectedRowsByBucket.value }
    m[key] = new Set((b?.items || []).map(atomKey))
    selectedRowsByBucket.value = m
  }
  selectedBucketKeys.value = selected
}

/** Toggle a single row within a bucket (keeps bucket selection in sync) */
function toggleRowInBucket(bucketKey: string, atom: PhaseAtom, checked: boolean) {
  const m = { ...selectedRowsByBucket.value }
  const set = new Set(m[bucketKey] ?? [])
  const k = atomKey(atom)
  if (checked) set.add(k)
  else set.delete(k)
  m[bucketKey] = set
  selectedRowsByBucket.value = m

  // Keep bucket key set in sync with at-least-one-selected rule
  if (set.size > 0) {
    selectedBucketKeys.value.add(bucketKey)
  } else {
    selectedBucketKeys.value.delete(bucketKey)
  }
}

/** Is a row selected in this bucket? */
function isRowSelected(bucketKey: string, atom: PhaseAtom) {
  const set = selectedRowsByBucket.value[bucketKey]
  return !!set && set.has(atomKey(atom))
}

/** Initialize defaults whenever buckets change */
watch(
    phaseBuckets,
    (buckets) => {
      const nextDisabled = new Set<string>()
      const nextSelected = new Set<string>()
      const rowsMap: Record<string, Set<string>> = {}

      for (const b of buckets) {
        if (b.items.length === 1) {
          // singleton → auto select & lock
          nextDisabled.add(b.key)
          nextSelected.add(b.key)
          rowsMap[b.key] = new Set(b.items.map(atomKey))
        } else {
          // multi → start unselected with empty set
          rowsMap[b.key] = new Set()
        }
      }

      disabledBuckets.value = nextDisabled
      selectedBucketKeys.value = nextSelected
      selectedRowsByBucket.value = rowsMap
    },
    { deep: true, immediate: true }
)

/** Chosen groups reflect per-row selections (any item -> include bucket) */
const chosenGroups = computed(() =>
    phaseBuckets.value
        .map(b => {
          const set = selectedRowsByBucket.value[b.key]
          const items = set ? b.items.filter(a => set.has(atomKey(a))) : []
          return { key: b.key, start: b.start, end: b.end, items }
        })
        .filter(g => g.items.length > 0)
)

/** Helper: human label for a bucket. */
function bucketLabel(b: { start: number|null; end: number }) {
  if (b.start == null) return `… → ${b.end} ամիս (մինչև համաձայնագրի ավարտ)`
  return `${b.start} → ${b.end} ամիս`
}

/* ---- mapping helpers from backend STAGES -> front phases ---- */
function mapStagesToManual(stages: any[]): ManualPhase[] {
  return (stages || []).map((s: any) => ({
    name: String(s?.name ?? 'Փուլ').trim() || 'Փուլ',
    duration_value: s?.months_qty == null ? null : Number(s.months_qty),
    duration_unit: 'months',
    percent: Number(s?.percentage ?? 0),
    duration_in_contract_end: s?.months_qty == null,
  }))
}
function mapStagesToPercents(stages: any[]): number[] {
  return (stages || []).map((s: any) => Number(s?.percentage ?? 0))
}

/* ---- recurring phases math ---- */
function computePhasesCount(r: AnyRow): number {
  const every = Number(r?.recurring_per_month_qty || 0)
  const deadline = Number(r?.recurring_deadline_month_qty || 0)
  if (!isRecurringRow(r) || !every || !deadline) return 1
  const blocks = Math.floor(deadline / every)
  return Math.max(1, blocks)
}
function defaultEvenSplit(n: number): number[] {
  if (n <= 1) return [100]
  const per = Math.floor(10000 / n) / 100
  const arr = Array(n - 1).fill(Number(per.toFixed(2)))
  const sum = arr.reduce((a, b) => a + b, 0)
  arr.push(Number((100 - sum).toFixed(2)))
  return arr
}

/* ---- summaries / tooltips ---- */
function phaseSummaryInline(arr?: number[]): string {
  if (!arr || !arr.length) return ''
  const shown = arr.slice(0, 4).map((n) => `${formatNumber(n)}%`).join(' -> ')
  return arr.length > 4 ? `${shown} +${arr.length - 4}` : shown
}
function manualPhaseSummaryInline(rows?: ManualPhase[]): string {
  if (!rows || !rows.length) return ''
  const shown = rows.slice(0, 3).map((r) => `${r.name || 'Փուլ'}: ${formatNumber(r.percent)}%`).join(' -> ')
  return rows.length > 3 ? `${shown} +${rows.length - 3}` : shown
}
function offeringPhaseTitle(row: AnyRow): string {
  if (isRecurringRow(row)) {
    const arr = offeringRecurringPhases.value[row.id]
    return (arr || []).map((n, i) => `#${i + 1}: ${formatNumber(n)}%`).join(', ') || 'Սահմանել փուլերի տոկոսները'
  }
  const rows = offeringManualPhases.value[row.id]
  return (rows || [])
      .map((r, i) => `#${i + 1}: ${r.name || 'Փուլ'} • ${formatNumber(r.percent)}% • ${formatNumber(r.duration_value)} ${r.duration_unit === 'months' ? 'ամիս' : 'օր'}`)
      .join('\n') || 'Սահմանել փուլերը'
}
function phaseSummaryTitle(kind: 'product' | 'offering', id: number): string {
  if (kind === 'product') {
    const rec = productPhases.value[id]
    if (rec && rec.length) return rec.map((n, i) => `#${i + 1}: ${formatNumber(n)}%`).join(', ')
    const rows = productManualPhases.value[id]
    if (rows && rows.length) {
      return rows.map((r, i) => `#${i + 1}: ${r.name || 'Փուլ'} • ${formatNumber(r.percent)}%`).join('\n')
    }
    return 'Սահմանել փուլերը'
  }
  return offeringPhaseTitle({ id, recurring: !!offeringRecurringPhases.value[id], offering: {} })
}

/* ---- min total months logic ---- */
const minTotalMonths = computed(() => {
  const recurringMax = Math.max(
      1,
      ...([...(props.order?.products || []), ...(props.order?.offerings || [])]
          .filter(r => isRecurringRow(r))
          .map(r => Number(r?.recurring_deadline_month_qty || 0)))
  )

  const manualDurations: number[] = []
  Object.values(productManualPhases.value || {}).forEach(rows => {
    (rows || []).forEach(r => {
      if (!r.duration_in_contract_end && r.duration_value) {
        manualDurations.push(Number(r.duration_value) || 0)
      }
    })
  })
  Object.values(offeringManualPhases.value || {}).forEach(rows => {
    (rows || []).forEach(r => {
      if (!r.duration_in_contract_end && r.duration_value) {
        manualDurations.push(Number(r.duration_value) || 0)
      }
    })
  })

  if (phasesModal.value.open && phasesModal.value.mode === 'manual') {
    (phasesModal.value.manualRows || []).forEach(r => {
      if (!r.duration_in_contract_end && r.duration_value) {
        manualDurations.push(Number(r.duration_value) || 0)
      }
    })
  }

  const manualMax = manualDurations.length ? Math.max(...manualDurations) : 1
  return Math.max(1, recurringMax, manualMax)
})

watch(minTotalMonths, (m) => {
  if (!phasesModal.value.open || phasesModal.value.mode !== 'manual') return
  const minM = Number(m || 1)
  phasesModal.value.manualRows = phasesModal.value.manualRows.map(r => ({
    ...r,
    duration_value: r.duration_in_contract_end ? null : Math.max(minM, Number(r.duration_value || minM)),
  }))
})

/* ---- init / defaults with MAPPING from backend -> front ---- */
watchEffect(() => {
  if (!props.order) return

  // top-level mapping
  advance.value = Number(props.order.advance_payment_percentage ?? 0)
  totalMonths.value = Number(props.order.contract_months_qty ?? minTotalMonths.value) || minTotalMonths.value
  if (totalMonths.value < minTotalMonths.value) totalMonths.value = minTotalMonths.value

  productMax.value = {}
  offeringMax.value = {}
  productFinal.value = {}
  offeringFinal.value = {}

  // clear phases bags (we'll (re)fill)
  productPhases.value = {}
  productManualPhases.value = {}
  offeringRecurringPhases.value = {}
  offeringManualPhases.value = {}

  // products (backend → front mapping)
  for (const p of props.order.products || []) {
    const id = Number(p.id)
    productMax.value[id] = Number(p.maximum_price ?? 0)
    productFinal.value[id] = Number(p.price ?? 0)

    const stages = Array.isArray(p.stages) ? p.stages : []

    if (isRecurringRow(p)) {
      productPhases.value[id] = stages.length
          ? mapStagesToPercents(stages)
          : defaultEvenSplit(computePhasesCount(p))
    } else {
      productManualPhases.value[id] = stages.length
          ? mapStagesToManual(stages)
          : [{
            name: 'Հանձնում ֊ ընդունում',
            duration_value: Number(props.order.contract_months_qty ?? minTotalMonths.value) || minTotalMonths.value,
            duration_unit: 'months',
            percent: 100,
            duration_in_contract_end: true,
          }]
    }
  }

  // offerings (backend → front mapping)
  for (const o of props.order.offerings || []) {
    const id = Number(o.id)
    offeringMax.value[id] = Number(o.maximum_price ?? 0)
    offeringFinal.value[id] = Number(o.price ?? 0)

    const stages = Array.isArray(o.stages) ? o.stages : []

    if (isRecurringRow(o)) {
      offeringRecurringPhases.value[id] = stages.length
          ? mapStagesToPercents(stages)
          : defaultEvenSplit(computePhasesCount(o))
    } else {
      offeringManualPhases.value[id] = stages.length
          ? mapStagesToManual(stages)
          : [{
            name: 'Հանձնում ֊ ընդունում',
            duration_value: Number(props.order.contract_months_qty ?? minTotalMonths.value) || minTotalMonths.value,
            duration_unit: 'months',
            percent: 100,
            duration_in_contract_end: true,
          }]
    }
  }
})

/* ---- validations for enabling Save ---- */
function percentagesSumTo100(): boolean {
  for (const p of productsShown.value) {
    if (isRecurringRow(p)) {
      const sum = (productPhases.value[p.id] || defaultEvenSplit(computePhasesCount(p)))
          .reduce((a, b) => a + (Number(b) || 0), 0)
      if (Number(sum.toFixed(2)) !== 100) return false
    } else {
      const rows = productManualPhases.value[p.id] || []
      const sum = rows.reduce((a, r) => a + (Number(r.percent) || 0), 0)
      if (Number(sum.toFixed(2)) !== 100) return false
      for (const r of rows) {
        if (!r.duration_in_contract_end && (!r.duration_value || Number(r.duration_value) <= 0)) return false
      }
    }
  }
  for (const o of offeringsShown.value) {
    if (isRecurringRow(o)) {
      const sum = (offeringRecurringPhases.value[o.id] || defaultEvenSplit(computePhasesCount(o)))
          .reduce((a, b) => a + (Number(b) || 0), 0)
      if (Number(sum.toFixed(2)) !== 100) return false
    } else {
      const rows = offeringManualPhases.value[o.id] || []
      const sum = rows.reduce((a, r) => a + (Number(r.percent) || 0), 0)
      if (Number(sum.toFixed(2)) !== 100) return false
      for (const r of rows) {
        if (!r.duration_in_contract_end && (!r.duration_value || Number(r.duration_value) <= 0)) return false
      }
    }
  }
  return true
}

const canSaveMax = computed(() => {
  if (!isSend.value) return false
  const pOk = productsShown.value.every((p: AnyRow) => productMax.value[p.id] !== undefined)
  const oOk = offeringsShown.value.every((o: AnyRow) => offeringMax.value[o.id] !== undefined)
  return pOk && oOk && totalMonths.value >= minTotalMonths.value && percentagesSumTo100()
})

const canSaveFinal = computed(() => {
  if (!isAnnounce.value) return false
  const pOk = (props.order.products || []).every((p: AnyRow) => productFinal.value[p.id] !== undefined)
  const oOk = (props.order.offerings || []).every((o: AnyRow) => offeringFinal.value[o.id] !== undefined)
  return pOk && oOk
})

function onManualDurationInput(idx: number, raw: any) {
  if (phasesModal.value.mode !== 'manual') return
  const m = Number(minTotalMonths.value || 1)
  let v = Number(raw)
  if (!isFinite(v) || v < m) v = m
  phasesModal.value.manualRows[idx].duration_value = v
}

const sumPhases = computed(() =>
    Number(phasesModal.value.values.reduce((a, b) => a + (Number(b) || 0), 0).toFixed(2))
)
const sumManualPercents = computed(() =>
    Number(phasesModal.value.manualRows.reduce((a, b) => a + (Number(b?.percent) || 0), 0).toFixed(2))
)
const applyDisabled = computed(() => {
  if (phasesModal.value.mode === 'recurring') return sumPhases.value > 100
  const anyInvalid = phasesModal.value.manualRows.some(
      r => !r.duration_in_contract_end && (!r.duration_value || r.duration_value <= 0)
  )
  return sumManualPercents.value > 100 || anyInvalid
})

/* ===== openPhases (SINGLE definition) ===== */
function openPhases(kind: 'product' | 'offering', row: AnyRow) {
  const id = Number(row.id)

  phasesModal.value.open = true
  phasesModal.value.kind = kind
  phasesModal.value.id = id
  phasesModal.value.name = kind === 'product' ? row.product?.name : row.offering?.name

  const recurring = isRecurringRow(row)

  if (recurring) {
    phasesModal.value.mode = 'recurring'
    const count = computePhasesCount(row)
    const bag = kind === 'product' ? productPhases.value : offeringRecurringPhases.value
    if (!bag[id] || bag[id].length !== count) {
      bag[id] = defaultEvenSplit(count)
    }
    phasesModal.value.values = [...bag[id]]
    phasesModal.value.manualRows = []
  } else {
    phasesModal.value.mode = 'manual'
    const bag = kind === 'product' ? productManualPhases.value : offeringManualPhases.value
    if (!bag[id] || bag[id].length === 0) {
      bag[id] = [{
        name: 'Հանձնում ֊ ընդունում',
        duration_value: totalMonths.value ?? 1,
        duration_unit: 'months',
        percent: 100,
        duration_in_contract_end: true
      }]
    }
    phasesModal.value.manualRows = bag[id].map(r => ({ ...r }))
    phasesModal.value.values = []
  }
}

function closePhases() {
  phasesModal.value.open = false
  phasesModal.value.kind = null
  phasesModal.value.id = null
  phasesModal.value.values = []
  phasesModal.value.manualRows = []
  phasesModal.value.mode = null
}

/* Manual editor helpers */
function addManualPhase() {
  phasesModal.value.manualRows.unshift({
    name: `Փուլ ${phasesModal.value.manualRows.length + 1}`,
    duration_value: Number(minTotalMonths.value || 1),
    duration_unit: 'months',
    percent: 0,
    duration_in_contract_end: false
  })
}
function removeManualPhase(index: number) {
  if (phasesModal.value.manualRows.length <= 1) return
  phasesModal.value.manualRows.splice(index, 1)
  if (phasesModal.value.manualRows.length === 1) {
    phasesModal.value.manualRows[0].percent = 100
  }
}

/* ---- Recurring inputs behaviour ---- */
function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)) }
function fix2(n: number) { return Number((Number(n) || 0).toFixed(2)) }
function onRecurringChange(idx: number, raw: any) {
  const vals = [...phasesModal.value.values]
  const lastIdx = vals.length - 1
  if (idx >= lastIdx) return

  const others = vals.reduce((a, b, i) => {
    if (i === idx || i === idx + 1) return a
    return a + (Number(b) || 0)
  }, 0)

  let v = Number(raw)
  if (!isFinite(v)) v = 0
  v = clamp(v, 0, 100 - others)
  let next = 100 - others - v

  v = fix2(v)
  next = fix2(next)

  vals[idx] = v
  vals[idx + 1] = next
  const sumFirst = vals.slice(0, lastIdx).reduce((a, b) => a + (Number(b) || 0), 0)
  vals[lastIdx] = Number((100 - sumFirst).toFixed(2))

  phasesModal.value.values = vals
}

/* ---- helpers to NORMALIZE outgoing payload stages ---- */
function normalizeStages(
    stages: any[]
): Array<{ name: string; months_qty: number|null; percentage: number; group: number|null }> {
  return (stages || []).map((s: any) => {
    if ('percentage' in s || 'months_qty' in s) {
      return {
        name: s.name ?? 'Փուլ',
        months_qty: s.months_qty === undefined ? null : Number(s.months_qty),
        percentage: Number(s.percentage ?? 0),
        group: s.group ?? null,
      }
    }
    const inContractEnd = !!s.duration_in_contract_end
    return {
      name: s.name ?? 'Փուլ',
      months_qty: inContractEnd ? null : Number(s.duration_value ?? 0),
      percentage: Number(s.percent ?? 0),
      group: s.group ?? null,
    }
  })
}

/* ---- Save actions (keep old code, just post-map the payload) ---- */
function makeRecurringPhasesFromPercents(row: AnyRow, percents: number[]): ManualPhase[] {
  const stepMonths = Number(row?.recurring_per_month_qty || 0) || 1
  return percents.map((p, i) => ({
    name: `Փուլ ${i + 1}`,
    duration_value: stepMonths,
    duration_unit: 'months',
    percent: Number((p || 0).toFixed(2)),
    duration_in_contract_end: false
  }))
}

// Build atomKey -> groupNumber map (1-based)
function buildGroupIndexMap(): Map<string, number> {
  const map = new Map<string, number>()
  let idx = 1
  for (const g of chosenGroups.value) {
    for (const a of g.items) map.set(atomKey(a), idx)
    idx++
  }
  return map
}
function stageAtomKeyForProduct(p: AnyRow, stage: any, index: number): string {
  if (isRecurringRow(p)) {
    const step = Number(p.recurring_per_month_qty || 1) || 1
    const start = index * step
    const end = start + step
    return atomKey({ kind: 'product', rowId: Number(p.id), window: { start, end } } as any)
  } else {
    const end = stage.duration_in_contract_end ? Number(totalMonths.value) : Number(stage.duration_value || 0)
    const start = stage.duration_in_contract_end ? null : 0
    return atomKey({ kind: 'product', rowId: Number(p.id), window: { start, end } } as any)
  }
}
function stageAtomKeyForOffering(o: AnyRow, stage: any, index: number): string {
  if (isRecurringRow(o)) {
    const step = Number(o.recurring_per_month_qty || 1) || 1
    const start = index * step
    const end = start + step
    return atomKey({ kind: 'offering', rowId: Number(o.id), window: { start, end } } as any)
  } else {
    const end = stage.duration_in_contract_end ? Number(totalMonths.value) : Number(stage.duration_value || 0)
    const start = stage.duration_in_contract_end ? null : 0
    return atomKey({ kind: 'offering', rowId: Number(o.id), window: { start, end } } as any)
  }
}
function itemTitle(it: any) { return it.label }
function windowLabel(win: { start: number | null; end: number | null }) {
  const total = Number(totalMonths.value || 1)
  const start = win?.start == null ? 0 : Number(win.start)
  const end = win?.end == null ? null : Number(win.end)
  if (end !== null && end === total) return 'մինչև համաձայնագրի ավարտը'
  if (start === 0) return 'մինչև '+end+' ամիս'
  if (end !== null) return `համաձայնագիրը ստորագրելուց մինչև ${end} ամիս`
  return 'Մինչեվ'
}
function bucketDisplayName(b: any) { return `${windowLabel(b.window)} — ${b.items?.length || 0} փուլ` }
function phaseTitle(it: any) { return it?.label ? String(it.label) : '' }

/* ===== Bulk select helpers per bucket ===== */
function selectAllInBucket(b: any) {
  const s = new Set(selectedRowsByBucket.value[b.key] ?? [])
  for (const it of b.items) s.add(atomKey(it))
  selectedRowsByBucket.value = { ...selectedRowsByBucket.value, [b.key]: s }
  if (s.size > 0) selectedBucketKeys.value.add(b.key)
}

function deselectAllInBucket(b: any) {
  if (disabledBuckets.value.has(b.key) && b.items.length === 1) return
  selectedRowsByBucket.value = { ...selectedRowsByBucket.value, [b.key]: new Set() }
  selectedBucketKeys.value.delete(b.key)
}

async function saveMaxPrices() {
  // duration validation for manual rows
  for (const bag of [productManualPhases.value, offeringManualPhases.value]) {
    for (const idStr of Object.keys(bag)) {
      const rows = bag[Number(idStr)] || []
      for (const r of rows) {
        if (!r.duration_in_contract_end && (!r.duration_value || Number(r.duration_value) <= 0)) {
          alert('Փուլի ժամկետի արժեքը չի կարող լինել 0 (երբ «Համաձայնագրի ավարտին» նշված չէ)')
          return
        }
      }
    }
  }

  const groupIndex = buildGroupIndexMap()

  saving.value = true
  try {
    const ppRaw = productsShown.value.map((p: AnyRow) => {
      const payload: any = {
        order_product_id: p.id,
        price: Number(productMax.value[p.id] ?? 0),
      }
      if (isRecurringRow(p)) {
        const percents = productPhases.value[p.id] ?? defaultEvenSplit(computePhasesCount(p))
        payload.stages = makeRecurringPhasesFromPercents(p, percents)
      } else {
        const rows = productManualPhases.value[p.id]
        payload.stages = (rows && rows.length ? rows : [{
          name: 'Հանձնում ֊ ընդունում',
          duration_value: null,
          duration_unit: 'months',
          percent: 100,
          duration_in_contract_end: true
        }]).map((r: any) => ({
          ...r,
          duration_value: r.duration_in_contract_end ? null : Number(r.duration_value || 1)
        }))
      }
      payload.stages = payload.stages.map((st: any, i: number) => {
        const k = stageAtomKeyForProduct(p, st, i)
        return { ...st, group: groupIndex.get(k) ?? null }
      })
      return payload
    })

    const ooRaw = offeringsShown.value.map((o: AnyRow) => {
      const payload: any = {
        order_offering_id: o.id,
        price: Number(offeringMax.value[o.id] ?? 0),
      }
      if (isRecurringRow(o)) {
        const percents = offeringRecurringPhases.value[o.id] ?? defaultEvenSplit(computePhasesCount(o))
        payload.stages = makeRecurringPhasesFromPercents(o, percents)
      } else {
        const rows = offeringManualPhases.value[o.id]
        payload.stages = (rows && rows.length ? rows : [{
          name: 'Հանձնում ֊ ընդունում',
          duration_value: null,
          duration_unit: 'months',
          percent: 100,
          duration_in_contract_end: true
        }]).map((r: any) => ({
          ...r,
          duration_value: r.duration_in_contract_end ? null : Number(r.duration_value || 1)
        }))
      }
      payload.stages = payload.stages.map((st: any, i: number) => {
        const k = stageAtomKeyForOffering(o, st, i)
        return { ...st, group: groupIndex.get(k) ?? null }
      })
      return payload
    })

    const pp = ppRaw.map(item => ({ ...item, stages: normalizeStages(item.stages) }))
    const oo = ooRaw.map(item => ({ ...item, stages: normalizeStages(item.stages) }))

    await purchasingOrdersApi.storeMaxPrices(props.order.id, {
      advance_payment_percentage: Number(advance.value ?? 0),
      contract_months_qty: Number(totalMonths.value ?? 1),
      product_prices: pp,
      offering_prices: oo,
    })

    router.push('/purchasing/orders')
  } finally {
    saving.value = false
  }
}

async function saveFinalPrices() {
  saving.value = true
  try {
    const pp = (props.order.products || []).map((p: AnyRow) => ({
      order_product_id: p.id,
      price: Number(productFinal.value[p.id] ?? 0),
    }))
    const oo = (props.order.offerings || []).map((o: AnyRow) => ({
      order_offering_id: o.id,
      price: Number(offeringFinal.value[o.id] ?? 0),
    }))
    await purchasingOrdersApi.storeFinalPrices(props.order.id, {
      product_prices: pp,
      offering_prices: oo,
    })
    router.push('/purchasing/orders')
  } finally {
    saving.value = false
  }
}

/* rejections */
async function rejectProduct(productId: number) {
  if (!confirm('Չեղարկել ապրանքը?')) return
  await purchasingOrdersApi.rejectProduct(props.order.id, productId)
  emit('updated')
}
async function rejectOffering(offeringId: number) {
  if (!confirm('Չեղարկել ծառայությունը?')) return
  await purchasingOrdersApi.rejectOffering(props.order.id, offeringId)
  emit('updated')
}

/* Apply phases from modal back to bags */
function applyPhases() {
  if (!phasesModal.value.kind || phasesModal.value.id == null) return
  if (applyDisabled.value) return

  const id = phasesModal.value.id

  if (phasesModal.value.mode === 'recurring') {
    const cleaned = phasesModal.value.values.map(v => fix2(v))
    if (phasesModal.value.kind === 'product') {
      productPhases.value[id] = cleaned
    } else {
      offeringRecurringPhases.value[id] = cleaned
    }
  } else {
    let rows = phasesModal.value.manualRows.map(r => ({
      name: String(r.name || '').trim() || 'Փուլ',
      duration_in_contract_end: !!r.duration_in_contract_end,
      duration_unit: r.duration_unit === 'days' ? 'days' : 'months' as 'days' | 'months',
      duration_value: r.duration_in_contract_end ? null : Number(r.duration_value || 1),
      percent: fix2(r.percent || 0),
    }))

    if (!rows.length) {
      rows = [{
        name: 'Հանձնում ֊ ընդունում',
        duration_value: null,
        duration_unit: 'months',
        percent: 100,
        duration_in_contract_end: true
      }]
    } else if (rows.length === 1) {
      rows[0].percent = 100
    }

    if (phasesModal.value.kind === 'product') {
      productManualPhases.value[id] = rows
    } else {
      offeringManualPhases.value[id] = rows
    }
  }

  closePhases()
}
</script>

<style scoped>
/* minimal */
</style>
