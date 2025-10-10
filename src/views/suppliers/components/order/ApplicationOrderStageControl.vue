<template>
  <div class="p-4 space-y-4">
    <!-- Filters -->
    <div class="rounded-xl border border-gray-300 bg-white p-4">
      <div class="grid md:grid-cols-3 gap-3">
        <!-- Partner -->
        <div class="flex flex-col gap-1">
          <label class="text-sm text-gray-600">Գործընկեր</label>
          <VueSelect
              v-model="filters.partner"
              @search="partnerList"
              :filterable="false"
              :loading="partnersLoading"
              :is-searchable="true"
              :get-option-label="o => o.name"
              :get-option-value="o => o.id"
              :is-multi="false"
              :options="partners"
              :placeholder="'Ընտրիր գործընկեր'"
              :noResults="'Արդյունք չի գտնվել'"
              @update:modelValue="onFiltersChanged"
          >
            <template #no-options>Արդյունք չի գտնվել</template>
          </VueSelect>
        </div>

        <!-- Status -->
        <div class="flex flex-col gap-1">
          <label class="text-sm text-gray-600">Կարգավիճակ</label>
          <select v-model="filters.status" class="px-3 py-2 rounded-xl border border-gray-300"
                  @change="onFiltersChanged">
            <option value="">Բոլորը</option>
            <option value="active">Ակտիվ</option>
            <option value="done">Ավարտված</option>
            <option value="cancelled">Չեղարկված</option>
          </select>
        </div>

        <!-- Search -->
        <div class="flex flex-col gap-1">
          <label class="text-sm text-gray-600">Փնտրել</label>
          <input
              v-model.trim="filters.search"
              @input="debouncedReload"
              class="px-3 py-2 rounded-xl border border-gray-300 w-full"
              placeholder="Փնտրել ըստ անվանման/թիվ/այլ…"
          />
        </div>
      </div>
    </div>

    <!-- Stages list -->
    <div class="bg-white border border-gray-300 rounded-xl overflow-hidden">
      <div class="px-4 py-3 border-b font-medium">Փուլերի ցանկ</div>

      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-gray-50">
          <tr>
            <th class="px-3 py-2 text-left">Գործընկեր</th>
            <th class="px-3 py-2 text-left">Փուլի անվանումը</th>
            <th class="px-3 py-2 text-left">Փուլի ժամկետները</th>
            <th class="px-3 py-2 text-left">Կարգավիճակ</th>
            <th class="px-3 py-2 text-left">Պարունակություն</th>
            <th class="px-3 py-2 text-right">Գործողություններ</th>
          </tr>
          </thead>
          <tbody>
          <tr
              v-for="s in stages"
              :key="s.id"
              class="border-t"
              :class="s._overdue ? 'bg-rose-50' : ''"
          >
            <td class="px-3 py-2">
              <p class="text-lg">{{ s.application_order.partner_contract.partner.name || '—' }}</p>
              <p>Պայմանագիր № {{ s.application_order.partner_contract.identification_number }}</p>
            </td>

            <td class="px-3 py-2">
              <div class="font-medium">{{ s.name || '—' }}</div>
              <div v-if="s._expired"
                   class="text-xs inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-100 text-rose-700 mt-1">
                Ժամկետանց
              </div>
            </td>

            <td class="px-3 py-2 text-xs">
              <div>Սկիզբ՝ {{ s.active_date_start || '—' }}</div>
              <div>Ավարտ՝ {{ s.active_date_finished || '—' }}</div>
            </td>

            <td class="px-3 py-2">
              <span class="px-2 py-0.5 rounded text-xs" :class="statusChip(s.status)">
                {{ statusLabel(s.status) }}
              </span>
            </td>

            <td class="px-3 py-2">
              <div class="flex items-center gap-2">
                <span class="text-xs px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                  Ապրանք՝ {{ s.products?.length ?? s.productsCount ?? 0 }}
                </span>
                <span class="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">
                  Աշխ./Ծառ.՝ {{ s.offerings?.length ?? s.offeringsCount ?? 0 }}
                </span>
              </div>
            </td>

            <td class="px-3 py-2 text-right">
              <button
                  class="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  @click="openStageModal(s)">
                Դիտել / ավարտել
              </button>
            </td>
          </tr>

          <tr v-if="!loading && stages.length===0">
            <td :colspan="filters.partner ? 5 : 6" class="px-4 py-6 text-center text-gray-500">
              Արդյունք չի գտնվել
            </td>
          </tr>
          </tbody>
        </table>
      </div>

      <div class="p-3 border-t text-center text-sm text-gray-500" v-if="loading">Բեռնվում է…</div>
      <div ref="sentinel" class="h-8"></div>
    </div>

    <!-- Stage Modal -->
    <div v-if="stageModal.open" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/40" @click="closeStageModal"></div>
      <div
          class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-6xl bg-white rounded-2xl shadow-xl">
        <div class="flex items-center justify-between px-5 py-4 border-b">
          <h3 class="text-lg font-semibold">
            {{ stageModal.stage?.name || 'Փուլ' }}
            <span v-if="stageModal.stage?._expired"
                  class="ml-2 text-xs px-2 py-0.5 rounded bg-rose-100 text-rose-700">Ժամկետանց</span>

          </h3>
          <button class="p-2 rounded-lg hover:bg-gray-100" @click="closeStageModal" aria-label="Close">✕</button>
        </div>

        <div class="p-5 space-y-4">
          <div class="grid md:grid-cols-3 gap-3 text-sm">
            <div>
              <div class="text-gray-500">Սկիզբ</div>
              <div class="font-medium">{{ stageModal.stage?.active_date_start || '—' }}</div>
            </div>
            <div>
              <div class="text-gray-500">Ավարտ</div>
              <div class="font-medium">{{ stageModal.stage?.active_date_finished || '—' }}</div>
            </div>
            <div>
              <div class="text-gray-500">Կարգավիճակ</div>
              <div>
                <span class="px-2 py-0.5 rounded text-xs" :class="statusChip(stageModal.stage?.status)">
                  {{ statusLabel(stageModal.stage?.status) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Content tables -->
          <div class="rounded-xl border border-gray-300 overflow-hidden">
            <div class="px-4 py-3 bg-gray-50 border-b font-medium">Ապրանքներ</div>
            <table class="min-w-full text-sm">
              <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left">Անվանում</th>
                <th class="px-4 py-3 text-left w-[120px]">Քանակ</th>
                <th class="px-4 py-3 text-left w-[120px]">Ընդհանուր արժեքի՝ Տոկոս</th>
                <th class="px-4 py-3 text-left w-[160px]">Ակտիվություն</th>
                <th class="px-4 py-3 text-left w-[140px]">Կարգավիճակ</th>
                <th class="px-3 py-2 text-left">Բաշխումներ</th>
                <th class="px-3 py-2 text-right w-0"></th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="p in (stageModal.stage?.products || [])" :key="'ps'+p.id" class="border-t">
                <td class="px-4 py-2 font-medium">
                  <div class="flex items-center justify-between">
                    <div class="font-medium truncate">{{ p.application_order_product.product.name }}</div>
                  </div>
                  <div class="mt-1 flex flex-wrap items-center gap-1">
                  <span v-if="p.application_order_product.product.type?.group?.name || p.group_name"
                        class="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {{ p.application_order_product.product.type?.group?.name || p.group_name }}
                  </span>
                    <span v-if="p.application_order_product.product.type?.name || p.type_name"
                          class="text-[11px] px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                    {{ p.application_order_product.product.type?.name || p.type_name }}
                  </span>
                    <span v-if="p.application_order_product.product.measure_type"
                          class="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
                    {{ $t(p.application_order_product.product.measure_type ?? 'piece') }}
                  </span>
                  </div>
                  <div
                      v-if="Array.isArray(p.application_order_product.product.characteristics) && p.application_order_product.product.characteristics.length"
                      class="mt-1 flex flex-wrap gap-1">
                  <span
                      v-for="c in p.application_order_product.product.characteristics"
                      :key="c.id||c.name"
                      class="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-700"
                  >{{ c.name }}</span>
                  </div>
                </td>
                <td class="px-4 py-2">{{ formatNumber(p.application_order_product.qty) }}
                  {{ $t(p.application_order_product.measure) }}
                </td>
                <td class="px-4 py-2">{{ p.percentage ?? '—' }}<span v-if="p.percentage!=null">%</span></td>
                <td class="px-4 py-2 text-xs">
                  <div>Սկիզբ՝ {{ p.active_date_start || '—' }}</div>
                  <div>Ավարտ՝ {{ p.active_date_finished || '—' }}</div>
                </td>
                <td class="px-4 py-2">
                  <span class="px-2 py-0.5 rounded text-xs" :class="productStageChip(p.status)">
                    {{ productStageLabel(p.status) }}
                  </span>
                </td>
                <td class="px-3 py-2">
                  <div v-if="(p.storages?.length || 0) > 0" class="space-y-1">
                    <div v-for="s in p.storages" :key="s.storage_id" class="text-xs">
                      <span class="font-medium">{{ s.storage?.address ?? s.storage_name }}</span>
                      — {{ formatNumber(s.qty) }}
                      <span class="text-gray-400">{{ s.measure ? $t(s.measure) : '' }}</span>
                    </div>
                  </div>
                  <span v-else class="text-gray-400 text-xs">—</span>
                </td>
                <td class="px-4 py-2 text-right">
                  <button v-if="p.status === 'active'"
                          class="px-3 py-1 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                          @click="openDistribute(p)">
                    Բաշխել
                  </button>
                </td>
              </tr>
              <tr v-if="(stageModal.stage?.products?.length || 0)===0">
                <td colspan="4" class="px-4 py-4 text-center text-slate-500">Ապրանքներ չկան</td>
              </tr>
              </tbody>
            </table>
            <div v-if="canSendToStorage" class="px-4 py-3 border-t flex items-center justify-end">
              <button
                  class="px-3 py-2 rounded-xl text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  :disabled="sending"
                  @click="sendToStorage"
              >
                {{ sending ? 'Ուղարկվում է…' : 'Ուղարկել պահեստ' }}
              </button>
            </div>
          </div>

          <div class="rounded-xl border border-gray-300 overflow-hidden">
            <div class="px-4 py-3 bg-gray-50 border-b font-medium">Աշխատանք / Ծառայություն</div>
            <table class="min-w-full text-sm">
              <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left">Անվանում</th>
                <th class="px-4 py-3 text-left w-[120px]">Քանակ</th>
                <th class="px-4 py-3 text-left w-[120px]">Ընդհանուր արժեքի՝ Տոկոս</th>
                <th class="px-4 py-3 text-left w-[160px]">Ակտիվություն</th>
                <th class="px-4 py-3 text-left w-[140px]">Կարգավիճակ</th>
                <th class="px-4 py-3 text-left"></th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="o in (stageModal.stage?.offerings || [])" :key="'os'+o.id" class="border-t">
                <td class="px-4 py-2 font-medium">{{ o.application_order_offering.offering.name || '—' }}</td>
                <td class="px-4 py-2 font-medium">{{ formatNumber(o.application_order_offering.qty) }}</td>
                <td class="px-4 py-2">{{ o.percentage ?? '—' }}<span v-if="o.percentage!=null">%</span></td>
                <td class="px-4 py-2 text-xs">
                  <div>Սկիզբ՝ {{ o.active_date_start || '—' }}</div>
                  <div>Ավարտ՝ {{ o.active_date_finished || '—' }}</div>
                </td>

                <td class="px-4 py-2">
                   <span class="px-2 py-0.5 rounded text-xs" :class="offeringStageChip(o.status)">
                      {{ offeringStageLabel(o.status) }}
                    </span>
                </td>
                <td class="px-4 py-2">
                  <button
                      v-if="canAttachFromDemand(o)"
                      class="px-3 py-1 text-xs font-medium text-white bg-violet-600 rounded-md hover:bg-violet-700"
                      @click="openAttachModal(o)"
                  >
                    Կցել կատարվածները
                  </button>
                </td>
              </tr>
              <tr v-if="(stageModal.stage?.offerings?.length || 0)===0">
                <td colspan="4" class="px-4 py-4 text-center text-slate-500">Տողեր չկան</td>
              </tr>
              </tbody>
            </table>

          </div>
        </div>

        <div class="flex items-center justify-end gap-2 px-5 py-4 border-t">
          <button class="px-3 py-2 rounded-xl border hover:bg-gray-50" @click="closeStageModal">Փակել</button>
          <button
              v-if="stageModal.stage && stageModal.stage.status!=='finished'"
              class="px-3 py-2 rounded-xl text-white bg-emerald-600 hover:bg-emerald-700"
              :disabled="finishing"
              @click="openFinishStageModal(stageModal.stage)"
          >
            Ավարտել
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Attach Completed Offerings Modal -->
  <div v-if="attachModal.open" class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/40" @click="closeAttachModal"></div>

    <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
              w-full max-w-5xl bg-white rounded-2xl shadow-xl">
      <div class="flex items-center justify-between px-5 py-4 border-b">
        <div>
          <h3 class="text-lg font-semibold">Կցել կատարվածները</h3>
          <div class="text-xs text-gray-500 mt-0.5">
            Պահանջվող քանակ՝ <b>{{ fmt(targetAttachQty) }}</b> ·
            Ընտրված՝ <b :class="totalPicked===targetAttachQty ? 'text-emerald-700' : 'text-amber-700'">{{ fmt(totalPicked) }}</b> ·
            Մնացորդ՝ <b :class="remainingAttach>0 ? 'text-amber-700' : remainingAttach<0 ? 'text-rose-700' : 'text-emerald-700'">{{ fmt(remainingAttach) }}</b>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button
              class="px-3 py-2 rounded-lg text-white"
              :class="canConfirmAttach ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-gray-400 cursor-not-allowed'"
              :disabled="!canConfirmAttach || attaching"
              @click="confirmAttach"
          >
            {{ attaching ? 'Կցվում է…' : 'Կցել' }}
          </button>
          <button class="px-3 py-2 rounded-lg border hover:bg-gray-50" @click="closeAttachModal">Փակել</button>
        </div>
      </div>

      <div class="p-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
        <!-- Left list -->
        <div class="rounded-xl border border-gray-300 overflow-hidden">
          <div class="px-4 py-2 bg-gray-50 border-b text-sm font-medium">Ավարտվածների ցուցակ</div>
          <div class="max-h-[360px] overflow-auto">
            <table class="min-w-full text-sm">
              <thead class="bg-gray-50">
              <tr>
                <th class="px-3 py-2 text-left">Քանակ</th>
                <th class="px-3 py-2 text-left">Թարմացվել է</th>
                <th class="px-3 py-2 text-right">Գործողություն</th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="it in (attachModal.available || [])" :key="'ado-'+it.id" class="border-t">
                <td class="px-3 py-2">{{ fmt(it.qty) }}</td>
                <td class="px-3 py-2">
                  <span :title="it.updated_at">{{ formatDateTime(it.updated_at) }}</span>
                </td>
                <td class="px-3 py-2 text-right">
                  <button
                      class="px-3 py-1 text-xs font-medium text-white rounded-md disabled:opacity-50"
                      :class="canPick(it) ? 'bg-sky-600 hover:bg-sky-700' : 'bg-gray-400 cursor-not-allowed'"
                      :disabled="!canPick(it)"
                      @click="pickItem(it)"
                  >
                    Կցել
                  </button>
                </td>
              </tr>
              <tr v-if="(attachModal.available?.length || 0) === 0">
                <td colspan="3" class="px-4 py-6 text-center text-gray-500">Ցանկը դատարկ է</td>
              </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Right list -->
        <div class="rounded-xl border border-gray-300 overflow-hidden">
          <div class="px-4 py-2 bg-gray-50 border-b text-sm font-medium">
            Ընտրվածները կցման համար
          </div>
          <div class="max-h-[360px] overflow-auto">
            <table class="min-w-full text-sm">
              <thead class="bg-gray-50">
              <tr>
                <th class="px-3 py-2 text-left">Քանակ</th>
                <th class="px-3 py-2 text-left">Թարմացվել է</th>
                <th class="px-3 py-2 text-right">Գործողություն</th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="it in attachModal.picked" :key="'pick-'+it.id" class="border-t">
                <td class="px-3 py-2">{{ fmt(it.qty) }}</td>
                <td class="px-3 py-2">
                  <span :title="it.updated_at">{{ formatDateTime(it.updated_at) }}</span>
                </td>
                <td class="px-3 py-2 text-right">
                  <button class="px-3 py-1 text-xs font-medium border rounded-md hover:bg-gray-50"
                          @click="removePicked(it.id)">✕</button>
                </td>
              </tr>
              <tr v-if="(attachModal.picked?.length || 0) === 0">
                <td colspan="3" class="px-4 py-6 text-center text-gray-500">Չկա ընտրված</td>
              </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="px-5 py-3 border-t text-xs text-gray-500">
        Նշում․ «Կցել» կոճակը հասանելի է միայն, երբ ընտրված քանակի գումարը հավասար է պահանջվող քանակին։
      </div>
    </div>
  </div>

  <!-- Finish Stage Docs Modal (1 file per type, no DnD) -->
  <div v-if="finishStageModal.open" class="fixed inset-0 z-[60]">
    <div class="absolute inset-0 bg-black/45" @click="closeFinishStageModal"></div>

    <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
              w-[92vw] max-w-2xl bg-white rounded-2xl shadow-2xl ring-1 ring-black/5">
      <!-- header -->
      <div class="px-6 py-4 border-b bg-slate-50 rounded-t-2xl flex items-start justify-between">
        <div>
          <h3 class="text-lg font-semibold">Փուլի ավարտ · <span class="text-slate-700">{{ finishStageModal.stageTitle }}</span></h3>
          <p class="text-sm text-slate-500 mt-0.5">
            Լրացրու պահանջվող փաստաթղթերը <span class="text-rose-600">*</span>՝ պարտադիր։
          </p>
        </div>
        <button class="p-2 rounded-lg hover:bg-slate-100" @click="closeFinishStageModal" aria-label="Close">✕</button>
      </div>

      <!-- body -->
      <div class="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
        <div v-if="finishStageModal.loading" class="text-sm text-slate-500">Բեռնվում է…</div>

        <div v-else class="space-y-4">
          <div v-for="d in finishStageModal.docs" :key="d.code" class="rounded-xl border border-slate-200 bg-white">
            <div class="px-4 py-2.5 border-b bg-slate-50 rounded-t-xl flex items-center justify-between">
              <label class="font-medium">
                {{ d.name }} <span v-if="d.required" class="text-rose-600">*</span>
              </label>
              <span class="text-[11px] text-slate-400 uppercase tracking-wide">{{ d.type }}</span>
            </div>

            <div class="p-4 space-y-2">
              <!-- FILE -->
              <template v-if="d.type==='file'">
                <input
                    type="file"
                    :accept="d.accept || undefined"
                    class="block w-full text-sm file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border file:border-slate-300
                       file:bg-white file:hover:bg-slate-50 file:text-slate-700"
                    @change="onFinishDocFileChange(d, $event)"
                />
                <div v-if="finishDocFiles[d.code]" class="text-xs text-slate-600">
                  Ընտրված՝ <span class="font-medium">{{ finishDocFiles[d.code]?.name }}</span>
                  <button class="ml-2 text-slate-500 underline hover:no-underline" @click="removeFinishFile(d.code)">Մաքրել</button>
                </div>
              </template>

              <!-- NUMBER / DATE / TEXT -->
              <input
                  v-else-if="d.type==='number'"
                  type="number" step="0.01"
                  class="w-full px-3 py-2 rounded-xl border border-slate-300"
                  v-model.number="finishDocValues[d.code]"
                  :placeholder="d.placeholder || ''"
              />
              <input
                  v-else-if="d.type==='date'"
                  type="date"
                  class="w-full px-3 py-2 rounded-xl border border-slate-300"
                  v-model="finishDocValues[d.code]"
              />
              <input
                  v-else
                  type="text"
                  class="w-full px-3 py-2 rounded-xl border border-slate-300"
                  v-model.trim="finishDocValues[d.code]"
                  :placeholder="d.placeholder || ''"
              />

              <!-- inline error -->
              <p v-if="finishDocErrors[d.code]" class="text-xs text-rose-600">{{ finishDocErrors[d.code] }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- footer -->
      <div class="px-6 py-4 border-t bg-slate-50 rounded-b-2xl flex items-center justify-end gap-2">
        <button class="px-3 py-2 rounded-xl border hover:bg-white" @click="closeFinishStageModal">Փակել</button>
        <button
            class="px-3 py-2 rounded-xl text-white"
            :class="finishSending ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'"
            :disabled="finishSending"
            @click="submitFinishStage"
        >
          {{ finishSending ? 'Ուղարկվում է…' : 'Ավարտել' }}
        </button>
      </div>
    </div>
  </div>

  <DistributeDrawer
      :open="distribute.open"
      :product="distribute.product"
      @close="distribute.open=false"
      @distributed="onDistributed"
  />
</template>

<script setup lang="ts">
import {ref, computed, onMounted, onBeforeUnmount, watch, reactive} from 'vue'
import VueSelect from 'vue3-select-component'
import { formatDateTime } from '@/utils/dateFormat.ts'
import {useToast} from 'vue-toastification'
import {purchasingPartnerApi, ordersApi} from '@/api.js'
import DistributeDrawer from './DistributeDrawer.vue'

type AnyObj = Record<string, any>
const toast = useToast()
const distribute = ref<{ open: boolean, product: any | null }>({open: false, product: null})
const drawer = ref<{open:boolean, product:any|null}>({ open:false, product:null })
const EPS = 1e-6
const eq6 = (a:number, b:number) => Math.abs(Number(a) - Number(b)) <= EPS
const attachModal = ref<{
  open: boolean
  offeringRow: any|null
  available: Array<{id:number; qty:number; updated_at:string}>
  picked: Array<{id:number; qty:number; updated_at:string}>
}>({
  open:false, offeringRow:null, available:[], picked:[]
})

const attaching = ref(false)
const num = (v:any) => (v==null || v==='') ? 0 : Number(v)
function fmt(v:any){
  if(v==null||v==='') return '—'
  const n = Number(v)
  return isFinite(n)
      ? new Intl.NumberFormat('hy-AM',{ maximumFractionDigits:6, useGrouping:false }).format(n)
      : String(v)
}
function sumStoragesQty(p:any){
  return (p?.storages || []).reduce((s:number, it:any) => s + Number(it?.qty || 0), 0)
}
function isProductFullyDistributed(p:any){
  const need = Number(p?.application_order_product?.qty ?? p?.qty ?? 0)
  if (!(need > 0)) return false
  return eq6(sumStoragesQty(p), need)
}
function canAttachFromDemand(o:any){
  const list = o?.application_order_offering?.active_demand_offerings || []
  return o?.status === 'active' && Array.isArray(list) && list.length > 0
}
function openAttachModal(o:any){
  const list = (o?.application_order_offering?.active_demand_offerings || []).map((x:any)=>({
    id: Number(x.id),
    qty: num(x.qty),
    updated_at: x.updated_at,
  }))
  attachModal.value = {
    open: true,
    offeringRow: o,
    available: list,
    picked: [],
  }
}
function closeAttachModal(){
  attachModal.value = { open:false, offeringRow:null, available:[], picked:[] }
}
const targetAttachQty = computed(() => {
  const o = attachModal.value.offeringRow
  return o ? num(o?.application_order_offering?.qty ?? o?.qty ?? 0) : 0
})
const totalPicked = computed(() =>
    attachModal.value.picked.reduce((s,it)=> s + num(it.qty), 0)
)
const remainingAttach = computed(() => num(targetAttachQty.value) - num(totalPicked.value))
const canConfirmAttach = computed(() => totalPicked.value > 0 && totalPicked.value === targetAttachQty.value && !attaching.value)
function canPick(it:{id:number; qty:number}){
  if(!attachModal.value.offeringRow) return false
  const already = attachModal.value.picked.some(p => p.id === it.id)
  if(already) return false
  return num(it.qty) <= remainingAttach.value
}
function pickItem(it:any){
  if(!canPick(it)) return
  attachModal.value.picked.push({ id: Number(it.id), qty: num(it.qty), updated_at: it.updated_at })
}
function removePicked(id:number){
  attachModal.value.picked = attachModal.value.picked.filter(x => x.id !== id)
}
async function confirmAttach(){
  if(!canConfirmAttach.value) return
  const row = attachModal.value.offeringRow
  const ids = attachModal.value.picked.map(x => x.id)

  attaching.value = true
  try{
    await ordersApi.attachCompletedDemandOfferings(
        row.id,
        row.application_order_offering.id,
        { demand_offering_ids: ids }
    )
    toast.success('Կցվեց հաջողությամբ')
    row.status = 'finished'
    closeAttachModal()
  } finally {
    attaching.value = false
  }
}
function hasActiveProduct(st:any){
  const prods = st?.products || []
  return prods.some((p:any) => String(p?.status) === 'active')
}

const canSendToStorage = computed(() => {
  const st = stageModal.value.stage
  if (!st) return false
  const prods = st.products || []
  if (prods.length === 0) return false
  if (!hasActiveProduct(st)) return false
  return prods.every(isProductFullyDistributed)
})

/* ---- Stage status labels ---- */
const PRODUCT_STAGE_LABELS: Record<string,string> = {
  pending: 'Սպասում է',
  active: 'Ակտիվ',
  send_to_storage: 'Ուղարկված պահեստ',
  in_storage: 'Պահեստում է',
  cancelled: 'Չեղարկված',
}
const OFFERING_STAGE_LABELS: Record<string,string> = {
  pending: 'Սպասում է',
  active: 'Ակտիվ',
  finished: 'Ավարտված',
  cancelled: 'Չեղարկված',
}

function productStageLabel(s?: string){ return PRODUCT_STAGE_LABELS[s||''] || s || '—' }
function offeringStageLabel(s?: string){ return OFFERING_STAGE_LABELS[s||''] || s || '—' }

/* ---- Stage status chips ---- */
function productStageChip(s?: string){
  if (s==='active')          return 'bg-indigo-100 text-indigo-700'
  if (s==='pending')         return 'bg-amber-100 text-amber-700'
  if (s==='send_to_storage') return 'bg-sky-100 text-sky-700'
  if (s==='in_storage')      return 'bg-emerald-100 text-emerald-700'
  if (s==='cancelled')       return 'bg-rose-100 text-rose-700'
  return 'bg-gray-100 text-gray-700'
}
function offeringStageChip(s?: string){
  if (s==='active')    return 'bg-indigo-100 text-indigo-700'
  if (s==='pending')   return 'bg-amber-100 text-amber-700'
  if (s==='finished')  return 'bg-emerald-100 text-emerald-700'
  if (s==='cancelled') return 'bg-rose-100 text-rose-700'
  return 'bg-gray-100 text-gray-700'
}
const sending = ref(false)

async function sendToStorage(){
  if (!canSendToStorage.value || !stageModal.value.stage) return
  sending.value = true
  try {
    await ordersApi.sendStageToStorage(stageModal.value.stage.id)
    for (const p of (stageModal.value.stage.products || [])) p.status = 'send_to_storage'
    const stId = Number(stageModal.value.stage.id)
    const host = stages.value.find(s => Number(s.id) === stId)
    if (host && Array.isArray(host.products)) for (const p of host.products) p.status = 'send_to_storage'
    toast.success('Փուլի ապրանքները հաջողությամբ ուղարկվեցին պահեստ')
  } catch (e:any) {
    toast.error(e?.response?.data?.message || 'Չհաջողվեց ուղարկել պահեստ')
  } finally {
    sending.value = false
  }
}
function openDistribute(p: any) {
  distribute.value = {open: true, product: p}
}

/* -------- Filters -------- */
const filters = ref<{ partner: any | null; status: string; search: string }>({
  partner: null,
  status: '',
  search: ''
})

function onFiltersChanged() {
  resetAndFetch()
}

let debounceTimer: any = null
function debouncedReload() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(resetAndFetch, 300)
}

function applyStoragesToProduct(p: any, items: Array<{storage_id:number; storage_name:string; qty:number}>) {
  if (!p) return
  p.storages = items.map(it => ({ storage_id: it.storage_id, storage_name: it.storage_name, qty: it.qty }))
}

function findAndApplyInStage(stage: any, productId: number) {
  if (!stage || !Array.isArray(stage.products)) return false
  const p = stage.products.find((x:any) =>
      Number(x?.application_order_product?.id ?? x?.id) === Number(productId)
  )
  if (!p) return false
  applyStoragesToProduct(p, lastDistributedItems)
  return true
}

let lastDistributedItems: Array<{storage_id:number; storage_name:string; qty:number}> = []
function onDistributed(payload: { productId:number; items:Array<{storage_id:number; storage_name:string; qty:number}> }) {
  lastDistributedItems = payload.items || []
  if (stageModal.value.open && stageModal.value.stage) findAndApplyInStage(stageModal.value.stage, payload.productId)
  for (const st of stages.value) { if (findAndApplyInStage(st, payload.productId)) break }
  toast.success('Բաշխումները պահպանվեցին')
}

/* -------- Partner select -------- */
const partners = ref<any[]>([])
const partnersLoading = ref(false)
async function partnerList(search = '') {
  partnersLoading.value = true
  try {
    const {data} = await purchasingPartnerApi.list({search, limit: 50})
    const list = data?.data ?? data ?? []
    partners.value = list.map((p: any) => ({id: p.id, name: p.name}))
  } catch {
    partners.value = []
  } finally {
    partnersLoading.value = false
  }
}

/* -------- Stages list with infinite scroll -------- */
const stages = ref<any[]>([])
const loading = ref(false)
const eof = ref(false)
const LIMIT = 30
const offset = ref(0)
const sentinel = ref<HTMLElement | null>(null)
let io: IntersectionObserver | null = null

function parseDateLike(v: any, end = false): Date | null {
  if (!v) return null
  const s = String(v)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = new Date(s + (end ? 'T23:59:59' : 'T00:00:00'))
    return isNaN(d as any) ? null : d
  }
  const d = new Date(s)
  return isNaN(d as any) ? null : d
}
function markOverdue(item: AnyObj) {
  const now = new Date()
  const start = parseDateLike(item.active_date_start, false)
  const finish = parseDateLike(item.active_date_finished, true)
  item._overdue = !!(start && finish && (now < start || now > finish))
  return item
}
function markDueFlags(item: AnyObj) {
  const now = new Date()
  const finish = parseDateLike(item.active_date_finished, true)
  item._expired = !!(finish && now > finish)
  item._upcoming = false
  return item
}

async function fetchNext() {
  if (loading.value || eof.value) return
  loading.value = true
  try {
    const params: AnyObj = {
      limit: LIMIT,
      offset: offset.value,
      search: filters.value.search || undefined,
      status: filters.value.status || undefined,
      partner_id: filters.value.partner?.id || undefined,
    }
    const data = await ordersApi.getStages(params)
    const batch = (data?.data ?? data ?? []) as any[]
    batch.forEach(markDueFlags)
    stages.value.push(...batch)
    if (batch.length < LIMIT) eof.value = true
    else offset.value += LIMIT
  } catch (e: any) {
    toast.error(e?.response?.data?.message || 'Չհաջողվեց բեռնել փուլերը')
  } finally {
    loading.value = false
  }
}
async function resetAndFetch() {
  stages.value = []
  eof.value = false
  offset.value = 0
  await fetchNext()
}

onMounted(() => {
  io = new IntersectionObserver(
      (entries) => { if (entries.some(x => x.isIntersecting)) fetchNext() },
      {rootMargin: '0px 0px 200px'}
  )
  if (sentinel.value) io.observe(sentinel.value)
  partnerList('')
  resetAndFetch()
})
onBeforeUnmount(() => { if (io && sentinel.value) io.unobserve(sentinel.value) })

/* -------- Stage modal -------- */
const stageModal = ref<{ open: boolean; stage: any | null }>({open: false, stage: null})
const finishing = ref(false)
function openStageModal(s: any) { stageModal.value = {open: true, stage: s} }
function closeStageModal() { stageModal.value = {open: false, stage: null} }

async function finishStage(s: any) {
  if (!s) return
  finishing.value = true
  try {
    await ordersApi.finishStage(s.id)
    s.status = 'done'
    toast.success('Փուլը ավարտվեց')
    closeStageModal()
  } finally { finishing.value = false }
}

/* -------- UI helpers -------- */
function formatNumber(value: any, {maximumFractionDigits = 6, minimumFractionDigits = 0, locale = 'hy-AM'} = {}) {
  if (value === null || value === undefined || value === '') return ''
  const num = typeof value === 'string' ? Number(value) : value
  if (!isFinite(num)) return String(value)
  return new Intl.NumberFormat(locale, {maximumFractionDigits, minimumFractionDigits, useGrouping: false}).format(num)
}
const STATUS_LABELS: Record<string, string> = {
  draft: 'Սևագիր',
  pending: 'Սպասում է',
  active: 'Ակտիվ',
  processing: 'Ընթացքի մեջ',
  finished: 'Ավարտված',
  cancelled: 'Չեղարկված'
}
function statusLabel(s?: string) { return STATUS_LABELS[s || ''] || s || '—' }
function statusChip(s?: string) {
  if (s === 'finished') return 'bg-emerald-100 text-emerald-700'
  if (s === 'processing' || s === 'active') return 'bg-indigo-100 text-indigo-700'
  if (s === 'pending') return 'bg-amber-100 text-amber-700'
  if (s === 'cancelled') return 'bg-rose-100 text-rose-700'
  if (s === 'draft') return 'bg-gray-100 text-gray-700'
  return 'bg-gray-100 text-gray-700'
}

/* -------- Finish docs modal state -------- */
const finishStageModal = ref<{
  open: boolean
  stageId: number|null
  stageTitle: string
  loading: boolean
  docs: Array<{ id:number; code:string; name:string; type:string; required:boolean; accept?:string; placeholder?:string }>
}>({
  open: false,
  stageId: null,
  stageTitle: '',
  loading: false,
  docs: []
})

const finishDocValues = reactive<Record<string, any>>({})
const finishDocFiles  = reactive<Record<string, File|null>>({})
const finishDocErrors = reactive<Record<string, string>>({})
const finishSending = ref(false)

function resetFinishDocsBags(){
  for (const k of Object.keys(finishDocValues)) delete finishDocValues[k]
  for (const k of Object.keys(finishDocFiles))  delete finishDocFiles[k]
  for (const k of Object.keys(finishDocErrors)) delete finishDocErrors[k]
}

async function openFinishStageModal(stage: any){
  finishStageModal.value.open = true
  finishStageModal.value.stageId = Number(stage?.id)
  finishStageModal.value.stageTitle = stage?.name || `#${stage?.id || ''}`
  finishStageModal.value.loading = true
  finishStageModal.value.docs = []
  resetFinishDocsBags()

  try{
    const res = await ordersApi.getStageFinishDocTypes(stage.id)
    const list = res?.data ?? res ?? []
    finishStageModal.value.docs = list.map((d:any)=>({
      id: Number(d.id),
      code: String(d.code || d.id),
      name: String(d.name || 'Փաստաթուղթ'),
      type: String(d.type || 'file'),
      required: !!d.required,
      accept: d.accept || undefined,
      placeholder: d.placeholder || ''
    }))

    // init models
    finishStageModal.value.docs.forEach(d => {
      finishDocValues[d.code] = d.type==='number' ? null : ''
      finishDocFiles[d.code]  = null
      finishDocErrors[d.code] = ''
    })
  }catch(e:any){
    toast.error(e?.response?.data?.message || 'Չհաջողվեց ստանալ փաստաթղթերի ցանկը')
    closeFinishStageModal()
  }finally{
    finishStageModal.value.loading = false
  }
}

function closeFinishStageModal(){
  finishStageModal.value = { open:false, stageId:null, stageTitle:'', loading:false, docs:[] }
  finishSending.value = false
  resetFinishDocsBags()
}

function onFinishDocFileChange(doc:any, e: Event){
  const file = (e.target as HTMLInputElement).files?.[0] || null
  finishDocFiles[doc.code] = file
  delete finishDocErrors[doc.code]
}
function removeFinishFile(code:string){
  finishDocFiles[code] = null
  delete finishDocErrors[code]
}

function clearFinishErrors(){
  for (const k of Object.keys(finishDocErrors)) delete finishDocErrors[k]
}
function hasValue(v:any){
  if (v === null || v === undefined) return false
  if (typeof v === 'string') return v.trim() !== ''
  return true
}
function validateFinishDocs(){
  // clear previous inline errors
  for (const k of Object.keys(finishDocErrors)) delete finishDocErrors[k]

  let ok = true
  for (const d of finishStageModal.value.docs){
    if (d.type !== 'file') continue // server payload only expects files
    if (d.required && !finishDocFiles[d.code]){
      ok = false
      finishDocErrors[d.code] = 'Պարտադիր դաշտ'
    }
  }
  return ok
}

async function submitFinishStage(){
  if (!validateFinishDocs()) return
  finishSending.value = true
  try{
    const fd = new FormData()

    // pack each selected file as one entry in documents[]
    let i = 0
    for (const d of finishStageModal.value.docs){
      if (d.type !== 'file') continue
      const file = finishDocFiles[d.code]
      if (!file) continue

      fd.append(`documents[${i}][type_id]`, String(d.id))
      // even though you allow 1 file per type, backend expects an array
      fd.append(`documents[${i}][documents][]`, file)
      i++
    }

    // call your finish endpoint (multipart/form-data)
    await ordersApi.finishStage(finishStageModal.value.stageId, fd)

    toast.success('Փուլը հաջողությամբ ավարտվեց')
    closeFinishStageModal()
    resetAndFetch()
  } catch (e:any){
    toast.error(e?.response?.data?.message || 'Չհաջողվեց ավարտել փուլը')
  } finally {
    finishSending.value = false
  }
}
</script>

<style scoped>
@keyframes fadeIn { from { opacity: 0; transform: translate(-50%,-48%);} to { opacity: 1; transform: translate(-50%,-50%);} }
</style>
