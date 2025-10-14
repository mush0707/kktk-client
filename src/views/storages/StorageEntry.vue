<template>
  <div class="flex flex-col">
    <div class="dark:border-gray-700 bg-white">
      <div class="flex gap-x-2 items-center p-4 border-b rounded-md border-gray-200 text-xl">
        <p>{{ storage?.address }}</p>
        <p class="text-sm">({{ !storage?.cell ? (storage?.industrial ? $t('industrial') : $t('normal')) : $t('cell') }})</p>
      </div>
    </div>
    <nav class="flex bg-blue-50 py-2 items-center text-sm" aria-label="Breadcrumb">
      <ol class="inline-flex items-center">
        <li>
          <router-link :to="'/storages'" class="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-slate-100">
            <span class="underline-offset-2 hover:underline">{{ $t('storages') }}</span>
          </router-link>
        </li>
        <li aria-hidden="true" class="px-1">
          <svg class="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path d="M7.05 3.55a1 1 0 0 1 1.4 0l4.5 4.5a1 1 0 0 1 0 1.4l-4.5 4.5a1 1 0 0 1-1.4-1.4L10.79 10 7.05 6.26a1 1 0 0 1 0-1.41z"/></svg>
        </li>
        <li>
          <router-link :to="'/storages/'+storage?.id" class="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-slate-100">
            <span class="underline-offset-2 hover:underline">{{ storage?.address }}</span>
          </router-link>
        </li>
        <li aria-hidden="true" class="px-1">
          <svg class="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path d="M7.05 3.55a1 1 0 0 1 1.4 0l4.5 4.5a1 1 0 0 1 0 1.4l-4.5 4.5a1 1 0 0 1-1.4-1.4L10.79 10 7.05 6.26a1 1 0 0 1 0-1.41z"/></svg>
        </li>
        <li>
          <p class="inline-flex items-center gap-1 rounded-md px-2 py-1">
            <span class="underline-offset-2 hover:underline">{{ $t('entries') }}</span>
          </p>
        </li>
      </ol>
    </nav>
  </div>

  <!-- Sticky basket summary -->
  <div v-if="workshopBasket.items.length" class="sticky bottom-4 z-30 px-4 pt-2">
    <div class="rounded-2xl border border-violet-200/70 bg-gradient-to-r from-violet-50 to-fuchsia-50 shadow-sm">
      <div class="flex flex-col md:flex-row items-start md:items-center gap-3 p-4">
        <!-- Left: summary -->
        <div class="flex flex-wrap items-center gap-3 text-sm">
          <span class="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 border border-violet-200 shadow-xs">
            <svg class="h-4 w-4 text-violet-600" viewBox="0 0 24 24" fill="none">
              <path d="M3 3h2l2.4 12.1a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L21 7H6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="9" cy="20" r="1.5" fill="currentColor"/><circle cx="18" cy="20" r="1.5" fill="currentColor"/>
            </svg>
            <span class="font-medium">Ընտրված է</span>
            <span class="font-semibold">{{ workshopBasket.items.length }}</span>
            <span class="text-slate-500">ապրանք</span>
          </span>
          <span class="hidden md:block h-5 w-px bg-violet-200"></span>
        </div>

        <!-- Right: actions -->
        <div class="md:ml-auto flex items-stretch gap-2 w-full md:w-auto">
          <button
              type="button"
              class="inline-flex justify-center items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50 w-full md:w-auto"
              @click="openBasketPreview"
          >
            <svg class="h-4 w-4 text-slate-600" viewBox="0 0 24 24" fill="none">
              <path d="M15 12H7m8 4H7m8-8H7m12 12H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9l5 5v10a2 2 0 0 1-2 2Z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Դիտել զամբյուղը
          </button>

          <button
              type="button"
              class="inline-flex justify-center items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow hover:from-violet-700 hover:to-fuchsia-700 disabled:opacity-50 w-full md:w-auto"
              :disabled="!workshopBasket.items.length || workshopBasket.sending"
              @click="openBasketPreview"
          >
            <svg v-if="workshopBasket.sending" class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" d="M4 12a8 8 0 018-8" stroke="currentColor" stroke-width="4"/>
            </svg>
            <svg v-else class="h-4 w-4" viewBox="0 0 24 24" fill="none">
              <path d="M4 7h16M7 12h10M9 17h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Ուղարկել արտադրամաս
          </button>
        </div>
      </div>
    </div>
  </div>

  <div class="p-4 space-y-4">
    <!-- Filters -->
    <div class="rounded-xl border border-gray-300 bg-white p-4">
      <div class="grid md:grid-cols-4 gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-sm text-gray-600">Աղբյուր</label>
          <select v-model="filters.from" class="px-3 py-2 rounded-xl border border-gray-300" @change="onFiltersChanged">
            <option value="">Բոլորը</option>
            <option value="purchasing">Գնումներ</option>
            <option value="production">Արտադրություն</option>
            <option value="scale_log">Կշեռք</option>
            <option value="parent_entry">Այլ պահեստի մուտքից</option>
          </select>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm text-gray-600">Կարգավիճակ</label>
          <select v-model="filters.status" class="px-3 py-2 rounded-xl border border-gray-300" @change="onFiltersChanged">
            <option value="">Բոլորը</option>
            <option value="pending">Սպասում է</option>
            <option value="accepted">Հաստատված</option>
            <option value="finished">Ավարտված</option>
          </select>
        </div>
        <div class="md:col-span-2 flex flex-col gap-1">
          <label class="text-sm text-gray-600">Փնտրել</label>
          <input
              v-model.trim="filters.search"
              @input="debouncedReload"
              class="px-3 py-2 rounded-xl border border-gray-300 w-full"
              placeholder="Փնտրել ըստ մուտք №  / ապրանք…"
          />
        </div>
      </div>
    </div>

    <!-- List -->
    <div class="bg-white border border-gray-300 rounded-xl overflow-hidden">
      <div class="px-4 py-3 border-b font-medium">Պահեստի մուտքերի ցանկ</div>
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-gray-50">
          <tr>
            <th class="px-3 py-2 text-left">Մուտք №</th>
            <th class="px-3 py-2 text-left">Աղբյուր</th>
            <th class="px-3 py-2 text-left">Կարգավիճակ</th>
            <th class="px-3 py-2 text-left">Ստեղծվել է</th>
            <th class="px-3 py-2 text-right">Գործողություններ</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="e in entries" :key="e.id" class="border-t">
            <td class="px-3 py-2 font-medium">{{ e.identification_number }}</td>
            <td class="px-3 py-2">
              <span class="px-2 py-0.5 rounded text-xs" :class="fromChip(e.from)">{{ fromLabel(e.from) }}</span>
              <p v-if="e.from === 'parent_entry'">Որտեղից՝ {{ e.parent_entry.storage.address }}</p>
            </td>
            <td class="px-3 py-2">
              <span class="px-2 py-0.5 rounded text-xs" :class="statusChip(e.status)">{{ statusLabel(e.status) }}</span>
            </td>
            <td class="px-3 py-2 text-xs">
              <span :title="e.created_at">{{ formatDateTime(e.created_at) }}</span>
              <span class="text-xs text-gray-400 ml-2">({{ fromNow(e.created_at) }})</span>
            </td>
            <td class="px-3 py-2 text-right">
              <div class="flex gap-2">
                <button
                    v-if="e.status === 'pending'"
                    class="px-3 py-1 text-xs font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:opacity-50"
                    :disabled="rowBusy[e.id]"
                    @click="acceptEntry(e)"
                >
                  {{ rowBusy[e.id] ? 'Հաստատվում է…' : 'Հաստատել' }}
                </button>

                <button
                    v-else-if="e.status === 'accepted' && e.parent_entry?.status !== 'send_to_production'"
                    class="px-3 py-1 text-xs font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:opacity-50"
                    :disabled="rowBusy[e.id]"
                    @click="confirmEntry(e)"
                >
                  {{ rowBusy[e.id] ? 'Պահեստավորվում է…' : 'Պահեստավորել' }}
                </button>

                <button
                    class="px-3 py-1 text-xs font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 disabled:opacity-50"
                    @click="openEntry(e)"
                >
                  Դիտել
                </button>
              </div>
            </td>
          </tr>

          <tr v-if="!loading && entries.length===0">
            <td colspan="6" class="px-4 py-6 text-center text-gray-500">Արդյունք չի գտնվել</td>
          </tr>
          </tbody>
        </table>
      </div>
      <div class="p-3 border-t text-center text-sm text-gray-500" v-if="loading">Բեռնվում է…</div>
      <div ref="sentinel" class="h-8"></div>
    </div>

    <!-- Entry modal -->
    <div v-if="entryModal.open" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/40" @click="closeEntry"></div>
      <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl bg-white rounded-2xl shadow-xl">
        <div class="flex items-center justify-between px-5 py-4 border-b">
          <h3 class="text-lg font-semibold">Մուտք № {{ entryModal.entry?.identification_number }}</h3>
          <button class="p-2 rounded-lg hover:bg-gray-100" @click="closeEntry" aria-label="Close">✕</button>
        </div>

        <div class="p-5 space-y-4">
          <div class="grid md:grid-cols-4 gap-3 text-sm">
            <div>
              <div class="text-gray-500">Աղբյուր</div>
              <div><span class="px-2 py-0.5 rounded text-xs" :class="fromChip(entryModal.entry?.from)">{{ fromLabel(entryModal.entry?.from) }}</span></div>
            </div>
            <div>
              <div class="text-gray-500">Կարգավիճակ</div>
              <div><span class="px-2 py-0.5 rounded text-xs" :class="statusChip(entryModal.entry?.status)">{{ statusLabel(entryModal.entry?.status) }}</span></div>
            </div>
            <div>
              <div class="text-gray-500">Ստեղծվել է</div>
              <div class="font-medium">
                <span :title="entryModal.entry?.created_at">{{ formatDateTime(entryModal.entry?.created_at) }}</span>
                <span class="text-xs text-gray-400 ml-2">({{ fromNow(entryModal.entry?.created_at) }})</span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button
                v-if="entryModal.entry?.status === 'pending'"
                class="px-3 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                :disabled="modalBusy"
                @click="acceptEntry(entryModal.entry)"
            >{{ modalBusy ? 'Հաստատվում է…' : 'Հաստատել' }}</button>

            <button
                v-if="entryModal.entry?.status === 'accepted'"
                class="px-3 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                :disabled="modalBusy || !hasInProgress"
                @click="confirmEntry"
            >{{ modalBusy ? 'Պահեստավորվում է…' : 'Պահեստավորել' }}</button>
          </div>

          <div class="rounded-xl border border-gray-300 overflow-hidden">
            <div class="px-4 py-3 bg-gray-50 border-b font-medium">Ապրանքներ</div>
            <table class="min-w-full text-sm">
              <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left">Ապրանք</th>
                <th class="px-4 py-3 text-left w-[120px]">Քանակ</th>
                <th class="px-4 py-3 text-left w-[180px]">Քանակ (ուղարկված արտադրամաս)</th>
                <th class="px-4 py-3 text-left w-[160px]">Կարգավիճակ</th>
                <th class="px-4 py-3 text-right"></th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="p in (entryModal.entry?.products || [])" :key="p.id" class="border-t">
                <td class="px-4 py-2 font-medium">
                  <div class="font-medium truncate">{{ p.product?.name ?? ('#' + p.product_id) }}</div>
                  <div v-if="Array.isArray(p.product?.characteristics) && p.product.characteristics.length" class="mt-1 flex flex-wrap gap-1">
                    <span v-for="c in p.product.characteristics" :key="c.id||c.name" class="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-700">{{ c.name }}</span>
                  </div>
                  <div v-if="p.product?.type?.name" class="text-xs text-slate-500">Տեսակ՝ {{ p.product.type.name }}</div>
                </td>
                <td class="px-4 py-2">{{ formatNumber(p.qty) }} {{ $t(p.measure || 'piece') }}</td>
                <td class="px-4 py-2">{{ formatNumber(p.qty_send_production || p.sent_to_workshop_qty || 0) }} {{ $t(p.measure || 'piece') }}</td>
                <td class="px-4 py-2">
                  <span class="px-2 py-0.5 rounded text-xs" :class="sepStatusChip(p.status)">{{ sepStatusLabel(p.status) }}</span>
                </td>
                <td class="px-4 py-2">
                  <div class="flex justify-end gap-2">
                    <button
                        v-if="entryModal.entry?.status === 'accepted'"
                        class="px-3 py-1 text-xs font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50"
                        @click="openProductSend(entryModal.entry, p)"
                    >Ուղարկել արտադրամաս</button>
                  </div>
                </td>
              </tr>
              <tr v-if="(entryModal.entry?.products?.length || 0)===0">
                <td colspan="6" class="px-4 py-4 text-center text-slate-500">Ապրանքներ չկան</td>
              </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 px-5 py-4 border-t">
          <button class="px-3 py-2 rounded-xl border hover:bg-gray-50" @click="closeEntry">Փակել</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Choose workshop (legacy, unused in new basket flow but kept if needed) -->
  <div v-if="chooseModal.open" class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/40" @click="closeChooseModal"></div>
    <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-xl">
      <div class="flex items-center justify-between px-5 py-4 border-b">
        <h3 class="text-lg font-semibold">Ուղարկել արտադրամաս</h3>
        <button class="p-2 rounded-lg hover:bg-gray-100" @click="closeChooseModal" aria-label="Close">✕</button>
      </div>
      <div class="p-5 space-y-4">
        <div>
          <label class="text-sm text-gray-600">Արտադրամաս</label>
          <select v-model.number="chooseModal.storage_id" class="mt-1 w-full border border-gray-300 rounded-xl px-3 py-2">
            <option v-for="s in industrial_storages" :key="s.id" :value="s.id">{{ s.address || s.name || ('#'+s.id) }}</option>
          </select>
        </div>
        <p v-if="chooseModal.error" class="text-sm text-rose-600">{{ chooseModal.error }}</p>
      </div>
      <div class="px-5 py-4 border-t flex justify-end gap-2">
        <button class="px-3 py-2 rounded-xl border" @click="closeChooseModal">Չեղարկել</button>
        <button class="px-3 py-2 rounded-xl bg-purple-600 text-white disabled:opacity-60" :disabled="!chooseModal.storage_id || chooseModal.saving" @click="confirmSendToWorkshop">
          <svg v-if="chooseModal.saving" class="h-4 w-4 animate-spin inline-block mr-2" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" d="M4 12a8 8 0 018-8" stroke="currentColor" stroke-width="4"/></svg>
          <span>Ուղարկել</span>
        </button>
      </div>
    </div>
  </div>

  <!-- Product -> basket modal -->
  <div v-if="productSendModal.open" class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/40" @click="closeProductSend"></div>
    <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow">
      <div class="flex items-center justify-between px-5 py-4 border-b">
        <div class="font-semibold">Ուղարկել արտադրամաս</div>
        <button class="p-2 hover:bg-gray-100 rounded-lg" @click="closeProductSend">✕</button>
      </div>
      <div class="p-5 space-y-3 text-sm">
        <div class="font-medium">{{ productSendModal.product?.product?.name ?? ('#'+productSendModal.product?.product_id) }}</div>
        <div class="text-xs text-gray-500">Առկա՝ {{ formatNumber(productSendModal.product?.qty || 0) }} {{ $t(productSendModal.product?.measure || 'kg') }}</div>
        <div class="text-xs text-gray-500">Արդեն ուղարկված՝ {{ formatNumber(productSendModal.product?.sent_to_workshop_qty || productSendModal.product?.sent_qty || 0) }}</div>
        <div class="text-xs text-gray-500">Զամբյուղում՝ {{ formatNumber(alreadyInBasketQty(productSendModal.entry?.id, productSendModal.product?.id)) }}</div>
        <div class="text-xs text-gray-500">Մնացորդ (սահման)՝ {{ formatNumber(productSendAvailable) }}</div>

        <div>
          <label class="text-xs text-gray-500">Քանակ</label>
          <input v-model.number="productSendModal.qty" type="number" min="0" step="0.001" class="border rounded-xl px-3 py-2 w-full"/>
          <p class="text-xs text-gray-400 mt-1">Առավելագույն՝ {{ formatNumber(productSendAvailable) }}</p>
        </div>

        <div v-if="industrial_storages.length > 1">
          <label class="text-xs text-gray-500">Արտադրամաս</label>
          <select v-model.number="productSendModal.to_storage_id" class="border rounded-xl px-3 py-2 w-full">
            <option :value="undefined">—</option>
            <option v-for="s in industrial_storages" :key="s.id" :value="s.id">{{ s.address || s.name || ('#'+s.id) }}</option>
          </select>
        </div>
      </div>
      <div class="px-5 py-4 border-t flex justify-end gap-2">
        <button class="px-3 py-2 rounded-xl border" @click="closeProductSend">Չեղարկել</button>
        <button class="px-3 py-2 rounded-xl bg-purple-600 text-white disabled:opacity-60" :disabled="!canAddProductToBasket" @click="addProductToBasket">Ավելացնել զամբյուղ</button>
      </div>
    </div>
  </div>

  <!-- Basket review / send -->
  <div v-if="basketReview.open" class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/40" @click="closeBasketReview"></div>
    <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-2xl shadow">
      <div class="flex items-center justify-between px-5 py-4 border-b">
        <div class="font-semibold">Զամբյուղ — ուղարկել արտադրամաս</div>
        <button class="p-2 hover:bg-gray-100 rounded-lg" @click="closeBasketReview">✕</button>
      </div>
      <div class="p-5 space-y-3">
        <div class="rounded-xl border border-gray-200 overflow-hidden">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left">Մուտք №</th>
              <th class="px-4 py-3 text-left">Ապրանք</th>
              <th class="px-4 py-3 text-left">Քանակ</th>
<!--              <th class="px-4 py-3 text-left">Արտադրամաս</th>-->
              <th class="px-4 py-3 text-right"></th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="it in workshopBasket.items" :key="it.key" class="border-t">
              <td class="px-4 py-2">{{ it.entry_ident }}</td>
              <td class="px-4 py-2">{{ it.product_name || ('#'+it.product_id) }}</td>
              <td class="px-4 py-2">{{ formatNumber(it.qty) }} {{ $t(it.measure || 'kg') }}</td>
<!--              <td class="px-4 py-2">{{ it.storage_label }}</td>-->
              <td class="px-4 py-2 text-right">
                <button class="px-2 py-1 text-xs border rounded-lg" @click="removeBasketItem(it.key)">Հեռացնել</button>
              </td>
            </tr>
            <tr v-if="workshopBasket.items.length===0">
              <td colspan="5" class="px-4 py-6 text-center text-gray-500">Դատարկ</td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="px-5 py-4 border-t flex justify-end gap-2">
        <button class="px-4 py-2 rounded-xl border" @click="closeBasketReview">Փակել</button>
        <button class="px-4 py-2 rounded-xl bg-purple-600 text-white" :disabled="workshopBasket.sending || !workshopBasket.items.length" @click="sendBasket">
          {{ workshopBasket.sending ? 'Ուղարկվում է…' : 'Ուղարկել' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onBeforeUnmount, computed } from 'vue'
import { useRoute } from 'vue-router'
import { mainApi, wmsApi, storageEntriesApi } from '@/api.js'
import { useToast } from 'vue-toastification'
import { formatDateTime, fromNow } from '@/utils/dateFormat.js'

const route = useRoute()
const storage = ref<any|null>(null)
type AnyObj = Record<string, any>
const toast = useToast()
const modalBusy = ref(false)
const industrial_storages = ref<any[]>([])
const rowBusy = ref<Record<number, boolean>>({})

const load = async () => {
  const id = Number(route.params.id)
  storage.value = await mainApi.getStorageById(id)
}

/* «Ցանկում կա՞ գոնե մեկ in_progress ապրանք» */
const entryModal = ref<{ open: boolean; entry: any | null }>({ open: false, entry: null })
const hasInProgress = computed(() =>
    Array.isArray(entryModal.value.entry?.products)
        ? entryModal.value.entry.products.some((it:any) => it.status === 'in_progress')
        : false
)

/* Basket */
const workshopBasket = ref<{
  items: Array<{
    key: string
    entry_id: number
    entry_ident: string
    entry_product_id: number   // entries.*.products.*.id
    product_id: number
    product_name?: string
    measure?: string
    qty: number
    to_storage_id: number
    storage_label: string
  }>
  sending: boolean
}>({ items: [], sending: false })

const basketReview = ref({ open:false })
function openBasketPreview(){ basketReview.value.open = true }
function closeBasketReview(){ basketReview.value.open = false }

const productSendModal = ref<{ open:boolean; entry:any|null; product:any|null; qty:number; to_storage_id:number|undefined }>({
  open:false, entry:null, product:null, qty:0, to_storage_id: undefined
})

const workshopBasketTotalQty = computed(() =>
    workshopBasket.value.items.reduce((s, it) => s + Number(it.qty || 0), 0)
)

function alreadyInBasketQty(entryId?:number, entryProductId?:number){
  if (!entryId || !entryProductId) return 0
  return workshopBasket.value.items
      .filter(x => x.entry_id === entryId && x.entry_product_id === entryProductId)
      .reduce((s, x) => s + Number(x.qty || 0), 0)
}

const productSendAvailable = computed(() => {
  const p:any = productSendModal.value.product || {}
  const total = Number(p.qty || 0)
  const alreadySent = Number(p.sent_to_workshop_qty || p.sent_qty || 0)
  const inBasket = alreadyInBasketQty(productSendModal.value.entry?.id, p.id)
  return Math.max(0, total - alreadySent - inBasket)
})

const canAddProductToBasket = computed(() => {
  const qty = Number(productSendModal.value.qty || 0)
  if (qty <= 0 || qty > productSendAvailable.value) return false
  if (industrial_storages.value.length > 1 && !productSendModal.value.to_storage_id) return false
  return true
})

function openProductSend(entry:any, product:any){
  productSendModal.value.open = true
  productSendModal.value.entry = entry
  productSendModal.value.product = product
  productSendModal.value.qty = 0
  productSendModal.value.to_storage_id = industrial_storages.value.length === 1 ? Number(industrial_storages.value[0].id) : undefined
}
function closeProductSend(){
  productSendModal.value = { open:false, entry:null, product:null, qty:0, to_storage_id: undefined }
}

/* ✅ Merge into basket by (entry_id + entry_product_id + to_storage_id) */
function addProductToBasket(){
  if (!canAddProductToBasket.value) return
  const e = productSendModal.value.entry!
  const p:any = productSendModal.value.product!
  const toId = Number(productSendModal.value.to_storage_id ?? (industrial_storages.value[0]?.id || 0))
  const storageLabel = (() => {
    const s = industrial_storages.value.find((x:any)=> Number(x.id)===toId)
    return s?.address || s?.name || ('#'+toId)
  })()

  // cap based on remaining allowed (recomputed at open time + basket content)
  const allow = productSendAvailable.value
  let addQty = Math.max(0, Math.min(Number(productSendModal.value.qty || 0), allow))
  if (!addQty) return

  // try merge
  const idx = workshopBasket.value.items.findIndex(it =>
      it.entry_id === Number(e.id) &&
      it.entry_product_id === Number(p.id) &&
      it.to_storage_id === toId
  )
  if (idx >= 0) {
    const current = workshopBasket.value.items[idx]
    const merged = current.qty + addQty
    // After merge, ensure we haven't exceeded total allowed (re-check limit)
    const inBasketBefore = alreadyInBasketQty(e.id, p.id) - current.qty
    const maxForThisKey = Math.max(0, Number(p.qty || 0) - Number(p.sent_to_workshop_qty || p.sent_qty || 0) - inBasketBefore)
    workshopBasket.value.items[idx] = { ...current, qty: Math.min(merged, maxForThisKey) }
  } else {
    workshopBasket.value.items.unshift({
      key: `${e.id}-${p.id}-${toId}`,
      entry_id: Number(e.id),
      entry_ident: e.identification_number,
      entry_product_id: Number(p.id), // ← entries.*.products.*.id
      product_id: Number(p.product_id),
      product_name: p.product?.name,
      measure: p.measure,
      qty: addQty,
      to_storage_id: toId,
      storage_label: storageLabel,
    })
  }
  closeProductSend()
}

function removeBasketItem(key:string){
  workshopBasket.value.items = workshopBasket.value.items.filter(x => x.key !== key)
}

async function sendBasket(){
  if (!workshopBasket.value.items.length) return
  workshopBasket.value.sending = true
  try {
    // flatten all basket lines into one payload
    const items = workshopBasket.value.items.map(it => ({
      entry_id: it.entry_id,                 // keep per-item entry reference
      entry_product_id: it.entry_product_id, // entries.*.products.*.id
      qty: it.qty,
      to_storage_id: it.to_storage_id
    }))

    // NEW single-call signature: (storageId, payload)
    await storageEntriesApi.sendToWorkshop(storage.value!.id, { items })

    // success -> clear & refresh
    workshopBasket.value.items = []
    basketReview.value.open = false
    await resetAndFetch()
    if (entryModal.value.open && entryModal.value.entry){
      const refreshed = entries.value.find((x:any)=> x.id === entryModal.value.entry.id)
      if (refreshed) entryModal.value.entry = refreshed
    }
    toast.success('Ուղարկվեց արտադրամաս')
  } finally {
    workshopBasket.value.sending = false
  }
}

/* Accept / Confirm */
async function acceptEntry(e:any) {
  rowBusy.value[e.id] = true
  try {
    await storageEntriesApi.accept(storage.value!.id, e.id)
    e.status = 'accepted'
    e.products = (e.products || []).map((product:any) => {
      if(product.status === 'pending') product.status = 'accepted'
      return product
    })
  } finally { rowBusy.value[e.id] = false }
}
async function confirmEntry(e:any) {
  rowBusy.value[e.id] = true
  try {
    await storageEntriesApi.confirm(storage.value!.id, e.id)
    e.status = 'finished'
    e.products = (e.products || []).map((product:any) => {
      if(product.status === 'in_progress') product.status = 'finished'
      return product
    })
  } finally { rowBusy.value[e.id] = false }
}

/* Filters + list */
const filters = ref<{ from: string; status: string; search: string }>({ from: '', status: '', search: '' })
const chooseModal = ref<{ open:boolean; entry:any|null; storage_id:number|null; saving:boolean; error:string }>({
  open:false, entry:null, storage_id:null, saving:false, error:''
})

async function getIndustrialStorages() {
  const res = await wmsApi.getStorages({ industrial: 1, is_active: 1 })
  industrial_storages.value = Array.isArray(res?.data) ? res.data : (res ?? [])
}

function onFiltersChanged() { resetAndFetch() }
let debounceTimer: any = null
function debouncedReload() { clearTimeout(debounceTimer); debounceTimer = setTimeout(resetAndFetch, 300) }

const entries = ref<any[]>([])
const loading = ref(false)
const eof = ref(false)
const LIMIT = 30
const offset = ref(0)
const sentinel = ref<HTMLElement | null>(null)
let io: IntersectionObserver | null = null

async function fetchNext() {
  if (!storage.value?.id) return
  if (loading.value || eof.value) return
  loading.value = true
  try {
    const params: AnyObj = {
      limit: LIMIT,
      offset: offset.value,
      search: filters.value.search || undefined,
      status: filters.value.status || undefined,
      from: filters.value.from || undefined,
      include: 'storage,products.product,products.product.type',
    }
    const data = await storageEntriesApi.list(storage.value.id, params)
    const batch = (data?.data ?? data ?? []) as any[]
    entries.value.push(...batch)
    if (batch.length < LIMIT) eof.value = true
    else offset.value += LIMIT
  } catch (e:any) {
    toast.error(e?.response?.data?.message || 'Չհաջողվեց բեռնել մուտքերը')
  } finally { loading.value = false }
}
async function resetAndFetch() { entries.value = []; eof.value = false; offset.value = 0; await fetchNext() }

onMounted(async () => {
  await load()
  await getIndustrialStorages()

  io = new IntersectionObserver(
      (ents) => {
        if (!storage.value?.id) return
        if (ents.some(x => x.isIntersecting)) fetchNext()
      },
      { rootMargin: '0px 0px 200px' }
  )
  if (sentinel.value) io.observe(sentinel.value)
  await resetAndFetch()
})
onBeforeUnmount(() => { if (io && sentinel.value) io.unobserve(sentinel.value) })

/* Entry modal open/close */
function openEntry(e:any) { entryModal.value = { open: true, entry: e } }
function closeEntry() { entryModal.value = { open: false, entry: null } }

/* UI helpers */
function formatNumber(value:any, { maximumFractionDigits = 6, minimumFractionDigits = 0, locale = 'hy-AM' } = {}) {
  if (value === null || value === undefined || value === '') return ''
  const num = typeof value === 'string' ? Number(value) : value
  if (!isFinite(num)) return String(value)
  return new Intl.NumberFormat(locale as string, { maximumFractionDigits, minimumFractionDigits, useGrouping: false }).format(num as number)
}
function fromLabel(v?: string) {
  if (v === 'purchasing') return 'Գնումներ'
  if (v === 'production') return 'Արտադրություն'
  if (v === 'scale_log') return 'Կշեռք'
  if (v === 'parent_entry') return 'Այլ պահեստի մուտքից'
  return v || '—'
}
function fromChip(v?: string) {
  if (v === 'purchasing') return 'bg-sky-100 text-sky-700'
  if (v === 'production') return 'bg-violet-100 text-violet-700'
  if (v === 'parent_entry') return 'bg-violet-100 text-violet-700'
  if (v === 'scale_log') return 'bg-amber-100 text-amber-700'
  return 'bg-gray-100 text-gray-700'
}
const ENTRY_STATUS_LABELS: Record<string, string> = {
  pending: 'Սպասում է', in_progress: 'Ընթացքի մեջ', accepted: 'Հաստատված',
  send_to_production: 'Ուղարկված արտադրամաս', finished: 'Ավարտված',
}
function statusLabel(s?: string) { return ENTRY_STATUS_LABELS[s || ''] || s || '—' }
function statusChip(s?: string) {
  if (s === 'finished') return 'bg-emerald-100 text-emerald-700'
  if (s === 'send_to_production') return 'bg-emerald-100 text-emerald-700'
  if (s === 'in_progress') return 'bg-indigo-100 text-indigo-700'
  if (s === 'accepted') return 'bg-indigo-100 text-indigo-700'
  if (s === 'pending') return 'bg-amber-100 text-amber-700'
  return 'bg-gray-100 text-gray-700'
}
const SEP_STATUS_LABELS: Record<string, string> = {
  pending: 'Սպասում է', in_progress: 'Ընթացքի մեջ', accepted: 'Հաստատված', finished: 'Ավարտված',
}
function sepStatusLabel(s?: string) { return SEP_STATUS_LABELS[s || ''] || s || '—' }
function sepStatusChip(s?: string) {
  if (s === 'finished') return 'bg-emerald-100 text-emerald-700'
  if (s === 'accepted') return 'bg-emerald-100 text-emerald-700'
  if (s === 'send_to_production') return 'bg-emerald-100 text-emerald-700'
  if (s === 'in_progress') return 'bg-indigo-100 text-indigo-700'
  if (s === 'pending') return 'bg-amber-100 text-amber-700'
  return 'bg-gray-100 text-gray-700'
}

/* (legacy choose modal helpers kept for compatibility) */
async function handleSendToWorkshop(e:any){ /* kept for backward compatibility if needed */ }
function closeChooseModal(){ chooseModal.value = { open:false, entry:null, storage_id:null, saving:false, error:'' } }
async function confirmSendToWorkshop(){ /* optional legacy flow */ }

watch(() => route.params.id, async () => {
  await load()
  await getIndustrialStorages()
  await resetAndFetch()
})
</script>
