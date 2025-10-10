<template>
  <div class="space-y-6 px-4 py-4 bg-white">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold">Պահանջագրեր</h1>
    </div>

    <!-- Top Tabs -->
    <div class="border-b border-gray-300">
      <nav class="-mb-px flex gap-6">
        <button
            class="pb-2 border-b-2"
            :class="tab==='list' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-700'"
            @click="tab='list'"
        >
          Ցանկ
        </button>
        <button
            class="pb-2 border-b-2"
            :class="tab==='edit' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-700'"
            @click="tab='edit'"
        >
          Նոր պահանջագիր
        </button>
      </nav>
    </div>

    <!-- LIST TAB -->
    <div v-if="tab==='list'" class="space-y-4">
      <!-- Filters -->
      <div class="bg-white">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label class="block text-sm text-gray-600 mb-1">Որոնում</label>
            <input
                v-model.trim="filters.search"
                type="text"
                class="w-full px-3 py-2 rounded-lg border border-gray-300"
                placeholder="Համար, ապրանքի անվանում"
                @input="onSearchInput"
            />
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">Կարգավիճակ</label>
            <select v-model="filters.status" class="w-full px-3 py-2 rounded-lg border border-gray-300">
              <option value="">Բոլորը</option>
              <option v-for="s in allStatuses" :key="s" :value="s">
                {{ $t(s) }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white overflow-hidden">
        <div class="px-4 py-3 border-b font-medium">Պահանջագրերի ցանկ</div>
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-50">
            <tr class="text-left">
              <th class="px-4 py-2">Համարանշան</th>
              <th class="px-4 py-2">Օգտվող</th>
              <th class="px-4 py-2">Կարգավիճակ</th>
              <th class="px-4 py-2 text-right">Թարմացվել է</th>
              <th class="px-4 py-2"></th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="row in rows" :key="row.id" class="border-t">
              <td class="px-4 py-2">{{ row.identification_number || '—' }}</td>
              <td class="px-4 py-2">{{ row.user?.name || row.user_name || '—' }}</td>
              <td class="px-4 py-2">
                  <span class="px-2 py-0.5 rounded text-xs" :class="badgeClass(row.status)">
                    {{ $t(row.status) }}
                  </span>
              </td>
              <td class="px-6 py-4 text-gray-500 text-right">
                  <span :title="row.updated_at">
                    {{ formatDateTime(row.updated_at) }}
                  </span>
                <span class="text-xs text-gray-400 ml-2">({{ fromNow(row.updated_at) }})</span>
              </td>
              <td class="px-4 py-2">
                <div class="flex items-center gap-2">
                  <button
                      v-if="hasActionableOfferings(row)"
                      class="px-2 py-1 text-xs rounded bg-violet-600 text-white hover:bg-violet-700"
                      @click="openOfferingsModal(row)"
                  >
                    Ընթացիկ աշխատանք / ծառայություն
                  </button>
                  <!-- Cancel -->
                  <button
                      v-if="canCancel(row)"
                      class="px-2 py-1 text-xs rounded bg-rose-600 text-white hover:bg-rose-700"
                      @click="onCancel(row)"
                  >
                    Չեղարկել
                  </button>

                  <!-- Show / Edit -->
                  <button
                      v-if="canShowEdit(row)"
                      class="px-2 py-1 text-xs rounded bg-indigo-600 text-white hover:bg-indigo-700"
                      @click="openForEdit(row.id)"
                  >
                    Դիտել / Խմբագրել
                  </button>

                  <button
                      v-if="canApprove(row)"
                      class="px-2 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700"
                      @click="onApprove(row)"
                  >
                    Հաստատել
                  </button>
                  <button
                      v-if="canSend(row)"
                      class="px-2 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700"
                      @click="onSend(row)"
                  >
                    Ուղարկել
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="rows.length===0">
              <td colspan="5" class="px-4 py-6 text-center text-gray-500">
                Գրառում չի գտնվել
              </td>
            </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="px-4 py-3 border-t flex items-center justify-between">
          <div class="text-sm text-gray-600">
            Ցույց է տրվում {{ rows.length }} տող
          </div>
          <div class="flex items-center gap-2">
            <button
                class="px-3 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50"
                :disabled="loadingList || listOffset===0"
                @click="prevPage"
            >
              Նախորդը
            </button>
            <button
                class="px-3 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50"
                :disabled="loadingList || !hasMore"
                @click="nextPage"
            >
              Հաջորդը
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- EDIT TAB -->
    <div v-else class="space-y-4">
      <!-- Builder header -->
      <div class="bg-white rounded-xl">
        <button v-if="editingId"
                class="px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700"
                @click="resetToNew"
        >
          Մաքրել և ստեղծել նորը
        </button>
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <div class="font-medium">{{ editingId ? 'Խմբագրել պահանջագիրը' : 'Ստեղծել նոր պահանջագիր' }}</div>
            <div class="text-xs text-gray-500" v-if="editingMeta.status">
              Կարգավիճակ՝ <b>{{ $t(editingMeta.status) }}</b>
            </div>
          </div>

          <!-- Action buttons only if editable -->
          <div class="flex items-center gap-2" v-if="isEditable">
            <button class="px-3 py-2 rounded-lg border hover:bg-gray-50" @click="resetBuilder">
              Մաքրել
            </button>
            <button
                class="px-3 py-2 rounded-lg text-white"
                :class="canSave ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-400 cursor-not-allowed'"
                :disabled="!canSave || saving"
                @click="onSave"
            >
              Պահպանել
            </button>
          </div>
        </div>

        <!-- Read-only banner when not editable -->
        <div
            v-if="!isEditable"
            class="mt-3 p-3 rounded-lg border bg-amber-50 text-amber-800 text-sm"
        >
          Այս պահանջագիրը <b>{{ $t(editingMeta.status || '') }}</b> է․ ձևը հասանելի է միայն դիտման։
        </div>
      </div>

      <!-- ONE BASKET (common for both tabs) -->
      <div class="bg-white border border-indigo-300 overflow-hidden">
        <div class="px-4 py-3 border-b font-medium">Զամբյուղ</div>
        <table class="min-w-full text-sm">
          <thead class="bg-gray-50">
          <tr class="text-left">
            <th class="px-3 py-2">Անվանում</th>
            <th class="px-3 py-2 w-[140px]">Բլոկ</th>
            <th class="px-3 py-2 text-right w-[120px]">Քանակ</th>
            <th class="px-3 py-2 w-[140px]">Չափ</th>
            <!-- NEW column (only in edit mode for clarity) -->
            <th v-if="editingId" class="px-3 py-2 w-[260px]">Աղբյուր</th>
            <th class="px-3 py-2 w-0"></th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="(row, idx) in basket.items" :key="'bi-'+idx" class="border-t">
            <td class="px-3 py-2">
              <div class="font-medium">
                {{ row.block==='product'
                  ? (row.product?.name || `#${row.product?.id}`)
                  : (row.offering?.name || row.offering?.offering?.name || `#${row.offering?.id}`) }}
              </div>
              <div class="text-xs text-gray-500" v-if="row.block!=='product' && (row.offering?.block || row.offering?.offering?.block)">
                {{ (row.offering?.block || row.offering?.offering?.block) === 'work' ? 'Աշխատանք' : 'Ծառայություն' }}
              </div>
            </td>

            <td class="px-3 py-2">
                <span
                    class="px-2 py-0.5 rounded text-xs"
                    :class="row.block==='product'
                    ? 'bg-slate-100 text-slate-700'
                    : ((row.offering?.block || row.offering?.offering?.block)==='work' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700')">
                  {{ row.block==='product' ? $t('product') : ($t(row.offering?.block || row.offering?.offering?.block) || $t('service')) }}
                </span>
            </td>

            <td class="px-3 py-2 text-right">
              <input
                  type="number"
                  :min="0"
                  :step="row.block==='product' ? 0.01 : 1"
                  class="w-32 px-2 py-1 rounded border border-gray-300"
                  v-model.number="row.qty"
                  :disabled="!isEditable"
              />
            </td>

            <td class="px-3 py-2">
              <template v-if="row.block==='product'">
                <select
                    v-model="row.unit"
                    class="px-2 py-1 rounded border border-gray-300 min-w-[120px]"
                    :disabled="row.unitDisabled || !isEditable"
                >
                  <option v-for="u in row.unitOptions" :key="u" :value="u">
                    {{ unit(u) }}
                  </option>
                </select>
              </template>
              <template v-else>{{ $t('piece') }} / {{ $t('times') }}</template>
            </td>

            <!-- NEW source column -->
            <td v-if="editingId" class="px-3 py-2">
                <span class="text-xs px-2 py-0.5 rounded"
                      :class="(row.application_order_product_id || row.application_order_offering_id)
                              ? 'bg-sky-100 text-sky-700'
                              : 'bg-emerald-100 text-emerald-700'">
                  {{ (row.application_order_product_id || row.application_order_offering_id)
                    ? 'Գնման հայտի շրջանակներում ընտրված'
                    : 'Նոր ապրանք' }}
                </span>
            </td>

            <td class="px-3 py-2">
              <button
                  v-if="isEditable"
                  class="px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700"
                  @click="removeItem(idx)"
              >
                Ջնջել
              </button>
            </td>
          </tr>

          <tr v-if="basket.items.length===0">
            <td :colspan="editingId ? 6 : 5" class="px-4 py-6 text-center text-gray-500">Դատարկ է</td>
          </tr>
          </tbody>
        </table>
      </div>

      <!-- Inner tabs for “add” sources -->
      <div v-if="isEditable" class="border-b border-gray-300">
        <nav class="-mb-px flex gap-6">
          <button
              class="pb-2 border-b-2"
              :class="innerTab==='products' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-700'"
              @click="innerTab='products'"
          >
            Ապրանքներ
          </button>
          <button
              class="pb-2 border-b-2"
              :class="innerTab==='offerings' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-700'"
              @click="innerTab='offerings'"
          >
            Աշխատանք / Ծառայություն
          </button>
        </nav>
      </div>

      <!-- PRODUCTS -->
      <div v-if="innerTab==='products'" class="space-y-4">
        <div v-if="isEditable" class="bg-white rounded-xl space-y-3">
          <!-- Autocomplete -->
          <div>
            <label class="block text-sm text-gray-600 mb-1">Փնտրել և ավելացնել նոր ապրանք</label>
            <div class="relative">
              <input
                  ref="prodSearchInputEl"
                  v-model.trim="prodSearch.query"
                  type="text"
                  class="w-full px-3 py-2 rounded-lg border border-gray-300"
                  placeholder="Սկսիր մուտքագրել…"
                  @input="onProdInput"
                  @focus="isEditable && openProdDd()"
                  @keydown.esc="prodSearch.open=false"
                  :disabled="!isEditable"
              />
            </div>
          </div>

          <!-- Teleported dropdown -->
          <Teleport to="body">
            <div
                v-if="prodSearch.open && !qtyModal.open"
                class="product-dd fixed z-[4000] bg-white/95 backdrop-blur border border-gray-200 rounded-xl shadow-2xl max-h-72 overflow-auto"
                :style="{ top: prodSearch.ddTop+'px', left: prodSearch.ddLeft+'px', width: Math.max(420, prodSearch.ddWidth)+'px' }"
                @mouseenter="hoveringDd = true" @mouseleave="hoveringDd = false"
            >
              <div class="px-3 py-2 text-[11px] text-gray-500 border-b bg-gray-50 sticky top-0">
                Գտնված արդյունքներ
              </div>

              <div
                  v-for="p in prodSearch.options"
                  :key="p.id"
                  class="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                  @mousedown.prevent="isEditable && (addRowFromProduct(p), prodSearch.open=false, prodSearch.query='')"
              >
                <div class="flex items-center justify-between">
                  <div class="font-medium truncate">{{ p.name }}</div>
                  <div class="ml-2 shrink-0 text-xs text-gray-500" v-if="p.sku || p.slug">{{ p.sku ?? p.slug }}</div>
                </div>
                <div class="mt-1 flex flex-wrap items-center gap-1">
                  <span v-if="p.type?.group?.name || p.group_name"
                        class="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {{ p.type?.group?.name || p.group_name }}
                  </span>
                  <span v-if="p.type?.name || p.type_name"
                        class="text-[11px] px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                    {{ p.type?.name || p.type_name }}
                  </span>
                  <span v-if="p.measure_type" class="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
                    {{ $t(p.measure_type ?? 'piece') }}
                  </span>
                </div>
                <div v-if="Array.isArray(p.characteristics) && p.characteristics.length" class="mt-1 flex flex-wrap gap-1">
                  <span
                      v-for="c in p.characteristics"
                      :key="c.id||c.name"
                      class="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-700"
                  >{{ c.name }}</span>
                </div>
              </div>

              <div v-if="!prodSearch.loading && prodSearch.options.length===0" class="px-3 py-3 text-sm text-gray-500">
                Արդյունք չկա
              </div>
              <div v-if="prodSearch.loading" class="px-3 py-3 text-sm text-gray-500">
                Փնտրում է…
              </div>
            </div>
          </Teleport>

          <!-- Available products list with search + pagination -->
          <div class="pt-2 border-t">
            <div class="flex items-end gap-2">
              <div class="grow">
                <label class="block text-bold text-gray-600 mb-1">Գնումների հայտում ակտիվ ապրանքներ</label>
                <input
                    v-model.trim="availProd.search"
                    type="text"
                    class="w-full px-3 py-2 rounded-lg border border-gray-300"
                    placeholder="Որոնել ըստ ապրանքի անվանման"
                    @input="loadAvailableProducts(true)"
                />
              </div>
            </div>

            <div class="mt-3 overflow-hidden">
              <table class="min-w-full text-sm">
                <thead class="bg-gray-50">
                <tr class="text-left">
                  <th class="px-3 py-2">Անվանում</th>
                  <th class="px-3 py-2 text-right">Քանակ</th>
                  <th class="px-3 py-2 text-right">Հասանելի Քանակ</th>
                  <th class="px-3 py-2 w-0"></th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="p in availProd.items" :key="'ap-'+p.application_order_product_id" class="border-t">
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
                      <span v-if="p.product?.type?.group?.name" class="ml-1 text-slate-400">({{ p.product.type.group.name }})</span>
                    </div>
                  </td>
                  <td class="px-3 py-2 text-right">{{ formatNumber(p.qty) }} {{ $t(p.measure) }}</td>
                  <td class="px-3 py-2 text-right">{{ formatNumber(p.qty - p.active_demand_request_products_sum_qty) }}</td>
                  <td class="px-3 py-2">
                    <button
                        v-if="isEditable"
                        class="px-2 py-1 text-xs rounded bg-sky-600 text-white hover:bg-sky-700"
                        @click="openProductModal(p.product, { mode: 'list', row: p })"
                    >
                      Ավելացնել
                    </button>
                  </td>
                </tr>

                <tr v-if="availProd.items.length===0">
                  <td colspan="4" class="px-4 py-6 text-center text-gray-500">Մատչելի ապրանք չկա</td>
                </tr>
                </tbody>
              </table>
              <div class="px-3 py-2 border-t flex justify-end">
                <button
                    class="px-3 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50"
                    :disabled="availProd.loading || !availProd.hasMore"
                    @click="loadAvailableProducts(false)"
                >
                  Բեռնել ավելին
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- OFFERINGS -->
      <div v-else class="space-y-4">
        <div class="bg-white space-y-3">
          <!-- Available offerings (no autocomplete) -->
          <div class="flex items-end gap-2">
            <div class="grow">
              <label class="block text-sm text-gray-600 mb-1">Հասանելի աշխատանքներ/ծառայություններ՝ որոնում</label>
              <input
                  v-model.trim="availOff.search"
                  type="text"
                  class="w-full px-3 py-2 rounded-lg border border-gray-300"
                  placeholder="Որոնել…"
                  @input="loadAvailableOfferings(true)"
              />
            </div>
          </div>

          <div class="mt-3 overflow-hidden">
            <table class="min-w-full text-sm">
              <thead class="bg-gray-50">
              <tr class="text-left">
                <th class="px-3 py-2">Անվանում</th>
                <th class="px-3 py-2">Տեսակ</th>
                <th class="px-3 py-2">Քանակ</th>
                <th class="px-3 py-2">Հասանելի Քանակ</th>
                <th class="px-3 py-2 w-0"></th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="o in availOff.items" :key="'ao-'+o.id" class="border-t">
                <td class="px-3 py-2">
                  <div class="font-medium">{{ o.offering.name }}</div>
                </td>
                <td class="px-3 py-2">
                    <span class="px-2 py-0.5 rounded text-xs" :class="o.offering.block==='work' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'">
                      {{ o.offering.block==='work' ? 'Աշխատանք' : 'Ծառայություն' }}
                    </span>
                </td>
                <td class="px-3 py-2">
                  <div class="font-medium">{{ formatNumber(o.qty) }}</div>
                </td>
                <td class="px-3 py-2">
                  <div class="font-medium">{{ formatNumber(o.qty - (o.offering.available_qty ?? 0)) }}</div>
                </td>
                <td class="px-3 py-2">
                  <button
                      v-if="isEditable"
                      class="px-2 py-1 text-xs rounded bg-sky-600 text-white hover:bg-sky-700"
                      @click="openOfferingModal(o, { mode: 'list', row: o })"
                  >
                    Ավելացնել
                  </button>
                </td>
              </tr>
              <tr v-if="availOff.items.length===0">
                <td colspan="3" class="px-4 py-6 text-center text-gray-500">Մատչելի աշխատանք/ծառայություն չկա</td>
              </tr>
              </tbody>
            </table>
            <div class="px-3 py-2 border-t flex justify-end">
              <button
                  class="px-3 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50"
                  :disabled="availOff.loading || !availOff.hasMore"
                  @click="loadAvailableOfferings(false)"
              >
                Բեռնել ավելին
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Product/Offering Quantity Modal -->
    <div v-if="qtyModal.open" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/40" @click="closeQtyModal"></div>
      <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-xl">
        <div class="flex items-center justify-between px-5 py-4 border-b">
          <h3 class="text-lg font-semibold">
            {{ qtyModal.kind==='product' ? 'Ավելացնել ապրանք' : 'Ավելացնել աշխատանք/ծառայություն' }}
          </h3>
          <button class="p-2 rounded-lg hover:bg-gray-100" @click="closeQtyModal" aria-label="Close">✕</button>
        </div>

        <div class="p-5 space-y-4">
          <div v-if="qtyModal.kind==='product'">
            <div class="font-medium">{{ qtyModal.product?.name || ('#' + qtyModal.product?.id) }}</div>
            <div class="text-xs text-gray-500" v-if="qtyModal.listRow">
              Մաքս. քանակ՝ {{ maxAllowedQtyForModal ?? '—' }}
            </div>
          </div>
          <div v-else>
            <div class="font-medium">{{ qtyModal.offering?.name || ('#' + qtyModal.offering?.id) }}</div>
            <div class="text-xs text-gray-500">
              {{ (qtyModal.offering?.block || qtyModal.listRow?.offering?.block)==='work' ? 'Աշխատանք' : 'Ծառայություն' }}
            </div>
          </div>

          <div class="flex gap-4">
            <div>
              <label class="block text-sm text-gray-600 mb-1">Քանակ</label>
              <input
                  v-model.number="qtyModal.qty"
                  type="number"
                  min="0"
                  :max="maxAllowedQtyForModal ?? undefined"
                  step="0.01"
                  class="w-40 px-3 py-2 border border-gray-300"
                  :disabled="!isEditable"
              />
            </div>
            <div v-if="qtyModal.kind==='product'">
              <label class="block text-sm text-gray-600 mb-1">Չափ</label>
              <select
                  v-model="qtyModal.unit"
                  class="px-3 py-2 border border-gray-300 min-w-[140px]"
                  :disabled="qtyModal.unitDisabled || !isEditable"
              >
                <option v-for="u in qtyModal.unitOptions" :key="u" :value="u">
                  {{ unit(u) }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 px-5 py-4 border-t">
          <button class="px-3 py-2 rounded-lg border hover:bg-gray-50" @click="closeQtyModal">Փակել</button>
          <button
              class="px-3 py-2 rounded-lg text-white"
              :class="qtyModal.qty>0 && isEditable ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-400 cursor-not-allowed'"
              :disabled="!(qtyModal.qty>0) || !isEditable"
              @click="confirmAddToBasket"
          >
            Պահպանել
          </button>
        </div>
      </div>
    </div>
  </div>
  <!-- Offerings Actions Modal -->
  <div v-if="offeringsModal.open" class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/40" @click="closeOfferingsModal"></div>
    <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
              w-full max-w-3xl bg-white rounded-2xl shadow-xl">
      <div class="flex items-center justify-between px-5 py-4 border-b">
        <h3 class="text-lg font-semibold">
          Ընթացիկ աշխատանք / ծառայություն — {{ offeringsModal.demand?.identification_number || ('#' + offeringsModal.demand?.id) }}
        </h3>
        <button class="p-2 rounded-lg hover:bg-gray-100" @click="closeOfferingsModal" aria-label="Close">✕</button>
      </div>

      <div class="p-5">
        <table class="min-w-full text-sm">
          <thead class="bg-gray-50">
          <tr class="text-left">
            <th class="px-3 py-2">Անվանում</th>
            <th class="px-3 py-2">Տեսակ</th>
            <th class="px-3 py-2">Քանակ</th>
            <th class="px-3 py-2">Կարգավիճակ</th>
            <th class="px-3 py-2 text-right">Գործողություն</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="o in (offeringsModal.demand?.offerings || [])" :key="o.id" class="border-t">
            <td class="px-3 py-2">
              <div class="font-medium">
                {{ o.offering?.name || ('#' + o.offering_id) }}
              </div>
            </td>
            <td class="px-3 py-2">
              <span class="px-2 py-0.5 rounded text-xs"
                    :class="(o.offering?.block || 'service')==='work' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'">
                {{ (o.offering?.block || 'service')==='work' ? 'Աշխատանք' : 'Ծառայություն' }}
              </span>
            </td>
            <td class="px-3 py-2">{{ formatNumber(o.qty) }}</td>
            <td class="px-3 py-2">
              <span class="px-2 py-0.5 rounded text-xs" :class="offeringStatusClass(o.status)">
                {{ offeringStatusLabel(o.status) }}
              </span>
            </td>
            <td class="px-3 py-2 text-right">
              <!-- approved_from_supplier -> take in progress -->
              <button
                  v-if="o.status === 'approved_from_supplier'"
                  class="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  :disabled="busyOffering[o.id]"
                  @click="takeOfferingInProgress(offeringsModal.demand, o)"
              >
                {{ busyOffering[o.id] ? 'Կատարվում է…' : 'Վերցնել ընթացքի մեջ' }}
              </button>

              <!-- in_progress -> finish -->
              <button
                  v-else-if="o.status === 'in_progress'"
                  class="px-3 py-1 text-xs font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:opacity-50"
                  :disabled="busyOffering[o.id]"
                  @click="finishOffering(offeringsModal.demand, o)"
              >
                {{ busyOffering[o.id] ? 'Ավարտվում է…' : 'Ավարտել' }}
              </button>

              <!-- otherwise nothing -->
              <span v-else class="text-xs text-gray-400">—</span>
            </td>
          </tr>

          <tr v-if="(offeringsModal.demand?.offerings?.length || 0)===0">
            <td colspan="5" class="px-4 py-6 text-center text-gray-500">Տողեր չկան</td>
          </tr>
          </tbody>
        </table>
      </div>

      <div class="flex items-center justify-end gap-2 px-5 py-4 border-t">
        <button class="px-3 py-2 rounded-lg border hover:bg-gray-50" @click="closeOfferingsModal">Փակել</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { authApi, productsApi, demandsApi } from '@/api.ts'
import { useToast } from 'vue-toastification'
import { formatDateTime, fromNow } from '@/utils/dateFormat.ts'
const toast = useToast()
const offeringsModal = ref<{ open:boolean; demand:any|null }>({ open:false, demand:null })
const busyOffering = ref<Record<number, boolean>>({})
/* =======================
   Actor & role helpers
   ======================= */
const actor = ref<any>(null)
const kind  = ref<string>('') // 'department_staff' | 'department_leader' | ...
function isStaff(){ return kind.value === 'department_staff' }
function isLeader(){ return kind.value === 'department_leader' }

async function loadActor(){
  try{
    const a = await authApi.getActor()
    actor.value = a
    kind.value = a.kind
  }catch(e){ /* noop */ }
}
loadActor()

/* =======================
   Top tabs
   ======================= */
const router = useRouter()
const tab = ref<'list' | 'edit'>('list')
function goToNewDemand(){
  resetBuilder()
  tab.value = 'edit'
}

/* =======================
   LIST
   ======================= */
const allStatuses = ['pending','approved','cancelled','in_progress','rejected','finished'] as const
const filters = reactive<{search:string,status:string}>({ search:'', status:'' })
let searchTimer:number|undefined
function onSearchInput(){
  window.clearTimeout(searchTimer)
  searchTimer = window.setTimeout(()=>loadList(true), 300)
}
function resetFilters(){
  filters.search=''
  filters.status=''
  loadList(true)
}
function hasActionableOfferings(row:any){
  // offerings կա և գոնե մեկը `approved_from_supplier` կամ `in_progress`
  const list = Array.isArray(row.offerings) ? row.offerings : []
  return list.some((o:any) => o?.status === 'approved_from_supplier' || o?.status === 'in_progress')
}
function openOfferingsModal(row:any){
  offeringsModal.value = { open: true, demand: row }
}
function closeOfferingsModal(){
  offeringsModal.value = { open:false, demand:null }
}
const OFFERING_STATUS_LABELS: Record<string,string> = {
  approved_from_supplier: 'Հաստատված մատակարարից',
  in_progress: 'Ընթացքի մեջ',
  finished: 'Ավարտված',
  rejected: 'Մերժված',
}
function offeringStatusLabel(s?:string){ return OFFERING_STATUS_LABELS[s||''] || s || '—' }
function offeringStatusClass(s?:string){
  if (s==='finished') return 'bg-emerald-100 text-emerald-700'
  if (s==='in_progress') return 'bg-indigo-100 text-indigo-700'
  if (s==='approved_from_supplier') return 'bg-sky-100 text-sky-700'
  if (s==='rejected') return 'bg-rose-100 text-rose-700'
  return 'bg-gray-100 text-gray-700'
}

async function takeOfferingInProgress(demand:any, off:any){
  if(!demand?.id || !off?.id) return
  busyOffering.value[off.id] = true
  try{
    // օրինակային էնդփոինթ
    await demandsApi.takeOfferingInProgress(demand.id, off.id) // POST /demands/:id/offerings/:offId/take
    off.status = 'in_progress'
    toast.success('Տեղափոխվեց «Ընթացքի մեջ»')
  } catch(e:any){
  } finally {
    busyOffering.value[off.id] = false
  }
}

async function finishOffering(demand:any, off:any){
  if(!demand?.id || !off?.id) return
  busyOffering.value[off.id] = true
  try{
    // օրինակային էնդփոինթ
    await demandsApi.finishOffering(demand.id, off.id) // POST /demands/:id/offerings/:offId/finish
    off.status = 'finished'
    toast.success('Ավարտվեց')
  } catch(e:any){
  } finally {
    busyOffering.value[off.id] = false
  }
}
/** server does NOT return total */
const rows = ref<any[]>([])
const listLimit = 20
const listOffset = ref(0)
const hasMore = ref(false)
const loadingList = ref(false)

async function loadList(reset=false){
  if(loadingList.value) return
  if(reset){ listOffset.value = 0; rows.value=[] }
  loadingList.value = true
  try{
    const res = await demandsApi.list({
      search: filters.search || undefined,
      status: filters.status || undefined,
      limit: listLimit,
      offset: listOffset.value,
    })
    const next = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])
    rows.value = reset ? next : rows.value.concat(next)
    hasMore.value = (next.length === listLimit) // infer when no total
  } finally {
    loadingList.value = false
  }
}
function nextPage(){
  if(loadingList.value) return
  if(hasMore.value){
    listOffset.value += listLimit
    loadList(false)
  }
}
function prevPage(){
  if(loadingList.value) return
  listOffset.value = Math.max(0, listOffset.value - listLimit)
  loadList(true)
}

watch(() => filters.status, () => loadList(true))
onMounted(() => { loadList(true) })

function tStatus(s:string){
  const map:Record<string,string> = {
    pending:'Սպասում է',
    approved:'Հաստատված',
    cancelled:'Չեղարկված',
    in_progress:'Գործում է',
    rejected:'Մերժված',
    finished:'Ավարտված'
  }
  return map[s] || s
}
function badgeClass(s:string){
  switch(s){
    case 'pending': return 'bg-amber-100 text-amber-700'
    case 'approved': return 'bg-emerald-100 text-emerald-700'
    case 'cancelled': return 'bg-rose-100 text-rose-700'
    case 'in_progress': return 'bg-indigo-100 text-indigo-700'
    case 'rejected': return 'bg-rose-100 text-rose-700'
    case 'finished': return 'bg-gray-100 text-gray-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}

/* Permissions on list actions */
function canCancel(row:any){
  if(row.status !== 'pending') return false
  if(isLeader()) return true
  if(isStaff() && Number(row.user_id) === Number(actor.value?.user?.id)) return true
  return false
}
function canApprove(row:any){
  if(row.status !== 'pending') return false
  if(!isLeader()) return false
  return true
}

function canSend(row:any){
  if(row.status !== 'approved') return false
  if(isLeader()) return true
  if(isStaff() && Number(row.user_id) === Number(actor.value?.user?.id)) return true
  return false
}
function canShowEdit(row:any){
  if(isStaff() && Number(row.user_id) === Number(actor.value?.user?.id)) return true
  if(isLeader()) return true
  return false
}

async function onCancel(row:any){
  if(!confirm('Չեղարկել պահանջագիրը?')) return
  await demandsApi.cancel(row.id)
  loadList(true)
}
async function onApprove(row:any){
  if(!confirm('Հաստատել պահանջագիրը?')) return
  await demandsApi.approve(row.id)
  loadList(true)
}
async function onSend(row:any){
  if(!confirm('Ուղարկել պահանջագիրը?')) return
  await demandsApi.send(row.id)
  loadList(true)
}
/* =======================
   BUILDER / BASKET
   ======================= */
const editingId = ref<number|null>(null)
const editingMeta = reactive<{ status?:string }>({})
const innerTab = ref<'products'|'offerings'>('products')

/** Editable only when creating OR when current status is 'pending' */
const isEditable = computed(() => !editingId.value || editingMeta.status === 'pending')

const basket = reactive<{
  items: Array<{
    block:'product'|'work'|'service',
    qty:number,
    product:any|null,
    offering:any|null,
    application_order_product_id:number|null,
    application_order_offering_id:number|null,
    unit?: string|null,
    unitOptions?: string[],
    unitDisabled?: boolean
  }>
}>({
  items: [],
})

function resetBuilder(){
  editingId.value = null
  editingMeta.status = undefined
  basket.items = []
  innerTab.value = 'products'
  prodSearch.query = ''
  prodSearch.options = []
  prodSearch.open = false
  loadAvailableProducts(true)
  loadAvailableOfferings(true)
}

// when switching to edit for the first time, load lists if empty
watch(tab, (nv) => {
  if(nv === 'edit'){
    if(availProd.items.length === 0) loadAvailableProducts(true)
    if(availOff.items.length === 0) loadAvailableOfferings(true)
  }
})

const canSave = computed(()=> basket.items.some(it => Number(it.qty) > 0))

const saving = ref(false)
async function onSave(){
  if(!canSave.value) return
  saving.value = true
  try{
    const productItems = basket.items
        .filter(it => it.block === 'product' && it.product?.id)
        .map(it => ({
          product_id: it.product.id,
          qty: Number(it.qty || 0),
          measure: it.unit ?? 'piece',
          order_product_id: it.application_order_product_id ?? null,
        }))

    const offeringItems = basket.items
        .filter(it => it.block !== 'product' && (it.offering?.id || it.offering?.offering?.id))
        .map(it => {
          const offObj = it.offering?.id ? it.offering : (it.offering?.offering || {})
          return {
            offering_id: offObj.id,
            qty: Number(it.qty || 0),
            order_offering_id: it.application_order_offering_id ?? null,
            block: (it.block === 'work' || it.block === 'service') ? it.block : (offObj.block || 'service'),
          }
        })

    const payload = {
      id: editingId.value ?? undefined,
      products: productItems,
      offerings: offeringItems,
    }
    if(!editingId.value) {
      await demandsApi.save(payload)
    } else {
      await demandsApi.update(editingId.value, payload)
    }
    tab.value = 'list'
    loadList(true)
    resetBuilder()
  } finally {
    saving.value = false
  }
}

/* =======================
   Open for edit (hydrate from backend response)
   ======================= */
async function openForEdit(id:number){
  const data = await demandsApi.get(id)
  resetBuilder()
  editingId.value = id
  editingMeta.status = data.status

  function guessMeasureTypeFromUnit(u?:string){
    const k = String(u||'').toLowerCase()
    if (['kg','g','t','tonn'].includes(k)) return 'weight'
    if (['l','ml','m3'].includes(k))      return 'capacity'
    if (['m','cm','mm'].includes(k))      return 'length'
    return 'piece'
  }

  for (const p of (data.products || [])) {
    const unitFromApi = p.measure || 'piece'
    const mt = guessMeasureTypeFromUnit(unitFromApi)
    const opts = unitOptionsByMeasure(mt)
    basket.items.push({
      block: 'product',
      product: { id: Number(p.product_id), name: p.product?.name },
      offering: null,
      qty: Number(p.qty || 0),
      application_order_product_id: p.order_product_id ?? null,
      application_order_offering_id: null,
      unit: unitFromApi,
      unitOptions: opts.includes(unitFromApi) ? opts : [unitFromApi, ...opts],
      unitDisabled: false,
    })
  }

  for (const o of (data.offerings || [])) {
    const offObj = { id: Number(o.offering_id), name: o.offering?.name, block: o.offering?.block }
    const blk: 'work'|'service' = (offObj as any).block === 'work' ? 'work' : 'service'
    basket.items.push({
      block: blk,
      product: null,
      offering: offObj,
      qty: Number(o.qty || 0),
      application_order_product_id: null,
      application_order_offering_id: o.order_offering_id ?? null,
      unit: null,
      unitOptions: [],
      unitDisabled: true,
    })
  }

  tab.value = 'edit'
}

/* ----- Product search dropdown (Teleport) ----- */
const prodSearchInputEl = ref<HTMLInputElement|null>(null)
const prodSearch = reactive<{
  query:string
  options:any[]
  loading:boolean
  open:boolean
  ddTop:number
  ddLeft:number
  ddWidth:number
}>({
  query:'', options:[], loading:false, open:false, ddTop:0, ddLeft:0, ddWidth:420
})
let prodTimer:number|undefined
const hoveringDd = ref(false)

function updateDdPosition(){
  const el = prodSearchInputEl.value
  if(!el) return
  const r = el.getBoundingClientRect()
  prodSearch.ddTop = Math.round(r.bottom + window.scrollY + 6)
  prodSearch.ddLeft = Math.round(r.left + window.scrollX)
  prodSearch.ddWidth = Math.round(r.width)
}
function openProdDd(){
  updateDdPosition()
  prodSearch.open = !!prodSearch.query
}

function onProdInput(){
  updateDdPosition()
  window.clearTimeout(prodTimer)
  if(!prodSearch.query){
    prodSearch.options = []
    prodSearch.open = false
    return
  }
  prodTimer = window.setTimeout(async ()=>{
    prodSearch.loading = true
    try{
      const res = await demandsApi.productList({limit: 50, search: prodSearch.query})
      prodSearch.options = Array.isArray(res?.data) ? res.data : (res || [])
      prodSearch.open = true
    } catch (e) {
      console.log(e);
    } finally {
      prodSearch.loading = false
    }
  }, 250)
}

function handleBodyClick(e: MouseEvent){
  const target = e.target as HTMLElement
  const el = prodSearchInputEl.value
  const clickedInput = !!el && (target === el || el.contains(target))
  if(clickedInput || hoveringDd.value) return
  prodSearch.open = false
}
onMounted(()=>{
  window.addEventListener('resize', updateDdPosition)
  window.addEventListener('scroll', updateDdPosition, true)
  document.addEventListener('mousedown', handleBodyClick)
})
onBeforeUnmount(()=>{
  window.removeEventListener('resize', updateDdPosition)
  window.removeEventListener('scroll', updateDdPosition, true)
  document.removeEventListener('mousedown', handleBodyClick)
})

function addRowFromProduct(p:any){
  openProductModal(p, { mode: 'auto' })
}

/* ----- Available products list ----- */
const availProd = reactive<{ search:string; items:any[]; limit:number; offset:number; hasMore:boolean; loading:boolean }>({
  search:'', items:[], limit:10, offset:0, hasMore:true, loading:false
})
async function loadAvailableProducts(reset:boolean){
  if(reset){ availProd.offset=0; availProd.items=[]; availProd.hasMore=true }
  if(!availProd.hasMore || availProd.loading) return
  availProd.loading = true
  try{
    const res = await demandsApi.availableProducts({
      search: availProd.search || undefined,
      limit: availProd.limit,
      offset: availProd.offset,
    })
    const next = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])
    availProd.items = reset ? next : availProd.items.concat(next)
    availProd.hasMore = next.length === availProd.limit
    if(availProd.hasMore) availProd.offset += availProd.limit
  } finally { availProd.loading = false }
}

/* ----- Offerings list ----- */
const availOff = reactive<{ search:string; items:any[]; limit:number; offset:number; hasMore:boolean; loading:boolean }>({
  search:'', items:[], limit:10, offset:0, hasMore:true, loading:false
})
async function loadAvailableOfferings(reset:boolean){
  if(reset){ availOff.offset=0; availOff.items=[]; availOff.hasMore=true }
  if(!availOff.hasMore || availOff.loading) return
  availOff.loading = true
  try{
    const res = await demandsApi.availableOfferings({
      search: availOff.search || undefined,
      limit: availOff.limit,
      offset: availOff.offset,
    })
    const next = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])
    availOff.items = reset ? next : availOff.items.concat(next)
    availOff.hasMore = next.length === availOff.limit
    if(availOff.hasMore) availOff.offset += availOff.limit
  } finally { availOff.loading = false }
}

/* =======================
   Quantity Modal (shared)
   ======================= */
const qtyModal = reactive<{
  open:boolean
  kind:'product'|'offering'|null
  product:any|null
  offering:any|null
  qty:number
  listRow:any|null
  from:'auto'|'list'|'offerings'
  unit:string|null
  unitOptions:string[]
  unitDisabled:boolean
}>({
  open:false, kind:null, product:null, offering:null, qty:1,
  listRow:null, from:'auto',
  unit:null,
  unitOptions:[],
  unitDisabled:false,
})

function unit(m:any){
  const k = String(m||'').toLowerCase()
  return ({kg:'կգ', g:'գ', t:'տ', tonn:'տ', l:'լ', ml:'մլ', m3:'մ³', m:'մ', cm:'սմ', mm:'մմ', piece:'հատ', pcs:'հատ'} as any)[k] || (m || '')
}
const unitOptionsByMeasure = (mt?: string) => {
  switch (mt) {
    case 'weight':   return ['kg','g','tonn']
    case 'capacity': return ['l','ml','m3']
    case 'length':   return ['m','cm','mm']
    default:         return ['piece']
  }
}

function openProductModal(product:any, ctx:{ mode:'auto'|'list'; row?:any }){
  if(!isEditable.value) return
  qtyModal.open = true
  qtyModal.kind = 'product'
  qtyModal.product = product
  qtyModal.offering = null
  qtyModal.qty = 1
  qtyModal.listRow = ctx.mode==='list' ? (ctx.row || null) : null
  qtyModal.from = ctx.mode

  const opts = unitOptionsByMeasure(product?.measure_type)
  if (ctx.mode === 'list') {
    const locked = ctx.row?.measure ?? ctx.row?.unit ?? opts[0] ?? 'piece'
    qtyModal.unit = locked
    qtyModal.unitOptions = opts.includes(locked) ? opts : [locked, ...opts]
    qtyModal.unitDisabled = true
  } else {
    qtyModal.unitOptions = opts
    qtyModal.unit = opts[0] ?? 'piece'
    qtyModal.unitDisabled = false
  }
}
function openOfferingModal(off:any, ctx:{ mode:'auto'|'list'; row?:any }){
  if(!isEditable.value) return
  const offObj = off?.offering ?? off
  qtyModal.open = true
  qtyModal.kind = 'offering'
  qtyModal.product = null
  qtyModal.offering = offObj
  qtyModal.qty = 1
  qtyModal.listRow = ctx.mode==='list' ? (ctx.row || null) : null
  qtyModal.from = ctx.mode
  qtyModal.unit = null
  qtyModal.unitOptions = []
  qtyModal.unitDisabled = true
}

function closeQtyModal(){
  qtyModal.open = false
  qtyModal.kind = null
  qtyModal.product = null
  qtyModal.offering = null
  qtyModal.qty = 1
  qtyModal.listRow = null
  qtyModal.unit = null
  qtyModal.unitOptions = []
  qtyModal.unitDisabled = false
}

const maxAllowedQtyForModal = computed<number|undefined>(() => {
  if(!qtyModal.listRow) return undefined
  const row = qtyModal.listRow
  const max = Number(row.qty ?? row.qty ?? 0) - Number(row.active_demand_request_products_sum_qty ?? 0)
  return Math.max(0, max)
})

function confirmAddToBasket(){
  if(!isEditable.value) return
  if(qtyModal.kind==='product'){
    const pid = Number(qtyModal.product?.id)
    if (!pid) return

    if (existsInBasket('product', pid)) {
      toast('Այս ապրանքն արդեն ավելացված է զամբյուղում')
      closeQtyModal()
      return
    }

    let q = Number(qtyModal.qty || 0)
    if(qtyModal.listRow){
      const max = maxAllowedQtyForModal.value ?? Infinity
      if(q > max) q = max
    }
    basket.items.push({
      block: 'product',
      product: qtyModal.product,
      offering: null,
      qty: q,
      application_order_product_id: qtyModal.listRow?.id ?? qtyModal.listRow?.application_order_product_id ?? null,
      application_order_offering_id: null,
      unit: qtyModal.unit ?? 'piece',
      unitOptions: Array.isArray(qtyModal.unitOptions) ? qtyModal.unitOptions.slice() : ['piece'],
      unitDisabled: !!qtyModal.unitDisabled,
    })
  } else if(qtyModal.kind==='offering'){
    const oid = Number((qtyModal.offering as any)?.id)
    if (!oid) return

    if (existsInBasket('offering', oid)) {
      toast('Այս աշխատանքը/ծառայությունը արդեն ավելացված է զամբյուղում')
      closeQtyModal()
      return
    }

    let q = Number(qtyModal.qty || 0)
    if(qtyModal.listRow){
      const max = maxAllowedQtyForModal.value ?? Infinity
      if(q > max) q = max
    }
    const blk: 'work'|'service' = (qtyModal.offering as any)?.block === 'work' ? 'work' : 'service'
    basket.items.push({
      block: blk,
      product: null,
      offering: qtyModal.offering,
      qty: Number(q || 0),
      application_order_product_id: null,
      application_order_offering_id: qtyModal.listRow?.id ?? qtyModal.listRow?.application_order_offering_id ?? null,
      unit: null,
      unitOptions: [],
      unitDisabled: true,
    })
  }
  closeQtyModal()
}

/* Basket item remove */
function removeItem(idx:number){ if(!isEditable.value) return; basket.items.splice(idx,1) }

/* Util */
function formatNumber(
    value: any,
    { maximumFractionDigits = 6, minimumFractionDigits = 0, locale = 'en-US' } = {}
): string {
  if (value === null || value === undefined || value === '') return ''
  const num = typeof value === 'string' ? Number(value) : value
  if (!isFinite(num)) return String(value)
  return new Intl.NumberFormat(locale, { maximumFractionDigits, minimumFractionDigits, useGrouping: false }).format(num)
}

function existsInBasket(kind: 'product' | 'offering', id: number) {
  return basket.items.some(it =>
      kind === 'product'
          ? (it.block === 'product' && Number(it.product?.id) === Number(id))
          : (it.block !== 'product' && Number((it.offering as any)?.id || (it.offering as any)?.offering?.id) === Number(id))
  )
}
function resetToNew() {
  isEditable.value = true;
  editingId.value = null;
  basket.items = [];
}
</script>

<style scoped>
/* minimal */
</style>
