<template>
  <div class="max-w-5xl p-4 space-y-6">
    <!-- Parties -->
    <div class="grid md:grid-cols-2 gap-4">
      <div class="border border-gray-300 rounded-xl p-4 bg-white">
        <p class="font-medium mb-3">Վաճառող</p>
        <div class="flex flex-col gap-y-2 pb-2">
          <VueSelect
              v-model="form.seller_id"
              @search="sellerList"
              :filterable="false"
              :loading="loading"
              :is-searchable="true"
              :get-option-label="o => o.name"
              :get-option-value="o => o.id"
              :is-multi="false"
              :options="sellers"
              :placeholder="$t('select_from_list')"
              :noResults="'Արդյունք չի գտնվել'"
          >
            <template #no-options>
              Արդյունք չի գտնվել
            </template>
            <!-- Յուրաքանչյուր տարբերակի (option) ցուցադրում -->
            <template #option="{ option }">
              <div class="flex items-center gap-2">
                <span class="font-medium">{{ option.name }}</span>
              </div>
            </template>
          </VueSelect>
        </div>

        <div class="grid gap-3">
          <label class="label">Անվանում <span class="text-rose-500">*</span></label>
          <input v-model="form.seller.name" class="input" placeholder="Անվանում" required aria-required="true"/>

          <label class="label">ՀՎՀՀ / TIN <span class="text-rose-500">*</span></label>
          <input v-model="form.seller.tin" class="input" placeholder="ՀՎՀՀ / TIN" required aria-required="true"/>

          <label class="label">Հասցե</label>
          <input v-model="form.seller.address" class="input" placeholder="Հասցե"/>
        </div>
      </div>

      <div class="border border-gray-300 rounded-xl p-4 bg-white">
        <p class="font-medium mb-3">Գնորդ</p>
        <div class="flex flex-col gap-y-2 pb-2">
          <VueSelect
              v-model="form.buyer_id"
              @search="buyerList"
              :filterable="false"
              :loading="loading"
              :is-searchable="true"
              :get-option-label="o => o.name"
              :get-option-value="o => o.id"
              :is-multi="false"
              :options="buyers"
              :placeholder="$t('select_from_list')"
              :noResults="'Արդյունք չի գտնվել'"
          >
            <template #no-options>
              Արդյունք չի գտնվել
            </template>
            <!-- Յուրաքանչյուր տարբերակի (option) ցուցադրում -->
            <template #option="{ option }">
              <div class="flex items-center gap-2">
                <span class="font-medium">{{ option.name }}</span>
              </div>
            </template>
          </VueSelect>
        </div>

        <div class="grid gap-3">
          <label class="label">Անվանում <span class="text-rose-500">*</span></label>
          <input v-model="form.buyer.name" class="input" placeholder="Անվանում" required aria-required="true"/>

          <label class="label">ՀՎՀՀ / TIN <span class="text-rose-500">*</span></label>
          <input v-model="form.buyer.tin" class="input" placeholder="ՀՎՀՀ / TIN" required aria-required="true"/>

          <label class="label">Հասցե</label>
          <input v-model="form.buyer.address" class="input" placeholder="Հասցե"/>

          <label class="label">Էլ. փոստ</label>
          <input v-model="form.buyer.email" class="input" placeholder="Էլ. փոստ"/>
        </div>
      </div>
    </div>

    <!-- Meta -->
    <div class="grid md:grid-cols-4 gap-4">
      <div class="border border-gray-300  rounded-xl p-4 bg-white">
        <label class="label">Սերիա</label>
        <input v-model="form.series" class="input"/>
      </div>

      <div class="border border-gray-300  rounded-xl p-4 bg-white">
        <label class="label">Համար</label>
        <input v-model="form.number" class="input"/>
      </div>

      <div class="border border-gray-300  rounded-xl p-4 bg-white">
        <label class="label">Ամսաթիվ <span class="text-rose-500">*</span></label>
        <input type="date" v-model="form.issue_date" class="input" required aria-required="true"/>
      </div>

      <div class="border border-gray-300  rounded-xl p-4 bg-white">
        <label class="label">Վճրման ամսաթիվ</label>
        <input type="date" v-model="form.due_date" class="input"/>
      </div>

      <div class="border border-gray-300  rounded-xl p-4 bg-white">
        <label class="label">Արժույթ <span class="text-rose-500">*</span></label>
        <select v-model="form.currency" class="input" required aria-required="true">
          <option>AMD</option><option>USD</option><option>EUR</option>
        </select>
      </div>

      <div class="border border-gray-300  rounded-xl p-4 bg-white">
        <label class="label">Գներ պարունակում են ԱԱՀ <span class="text-rose-500">*</span></label>
        <!-- required checkbox would force true; only mark visually -->
        <input type="checkbox" v-model="form.prices_include_vat" class="mr-2" aria-required="true">
      </div>

      <div class="border border-gray-300  rounded-xl p-4 bg-white">
        <label class="label">ԱԱՀ % լռելյայն <span class="text-rose-500">*</span></label>
        <input type="number" step="0.01" v-model.number="form.vat_rate_default" class="input" required aria-required="true"/>
      </div>

      <div class="border border-gray-300  rounded-xl p-4 bg-white">
        <label class="label">Տեսակ <span class="text-rose-500">*</span></label>
        <select v-model="form.type" class="input" required aria-required="true">
          <option value="standard">Ստանդարտ</option>
          <option value="credit_note">Քրեդիտ-նոտա</option>
          <option value="debit_note">Դեբիտ-նոտա</option>
        </select>
      </div>
    </div>

    <!-- Items -->
    <div class="border border-gray-300  rounded-xl p-4 bg-white">
      <div class="flex items-center justify-between mb-3">
        <p class="font-medium">Պոզիցիաներ <span class="text-rose-500">*</span></p>
        <button class="rounded-xl border px-3 py-2 hover:bg-slate-50" @click="addItem">+ Ավելացնել</button>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="text-left border-b">
          <tr class="h-10">
            <th class="pr-2">Կոդ</th>
            <th class="pr-2">Նկարագրություն <span class="text-rose-500">*</span></th>
            <th class="pr-2">Միավոր <span class="text-rose-500">*</span></th>
            <th class="pr-2">Քանակ <span class="text-rose-500">*</span></th>
            <th class="pr-2">Գին <span class="text-rose-500">*</span></th>
            <th class="pr-2">Զեղչ</th>
            <th class="pr-2">ԱԱՀ %</th>
            <th class="pr-2 text-right">Մաքուր</th>
            <th class="pr-2 text-right">Ընդհանուր</th>
            <th></th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="(it, idx) in form.items" :key="it._k" class="border-b last:border-0">
            <td><input v-model="it.sku" class="input input-cell" placeholder="SKU"></td>

            <td>
              <input v-model="it.description" class="input input-cell" placeholder="Նկարագրություն"
                     required aria-required="true">
            </td>

            <td>
              <input v-model="it.unit" class="input input-cell" placeholder="pcs"
                     required aria-required="true">
            </td>

            <td>
              <input type="number" step="0.0001" v-model.number="it.qty" class="input input-cell"
                     required aria-required="true">
            </td>

            <td>
              <input type="number" step="0.0001" v-model.number="it.price" class="input input-cell"
                     required aria-required="true">
            </td>

            <td><input type="number" step="0.01" v-model.number="it.discount" class="input input-cell"></td>

            <td>
              <input type="number" step="0.01" v-model.number="it.vat_rate" class="input input-cell"
                     :placeholder="form.vat_rate_default.toString()">
            </td>

            <td class="text-right whitespace-nowrap">{{ lineNet(it).toFixed(2) }}</td>
            <td class="text-right whitespace-nowrap">{{ lineGross(it).toFixed(2) }}</td>
            <td class="text-right">
              <button class="rounded-lg px-2 py-1 hover:bg-red-50" @click="removeItem(idx)">✕</button>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Totals -->
    <div class="grid md:grid-cols-3 gap-4">
      <div v-if="subtotal" class="md:col-start-3 border border-gray-300  rounded-xl p-4 bg-white space-y-2">
        <div class="flex justify-between"><span>Միջագումար</span><span>{{ subtotal.toFixed(2) }} {{ form.currency }}</span></div>
        <div class="flex justify-between"><span>Զեղչ</span><span>{{ discountTotal.toFixed(2) }} {{ form.currency }}</span></div>
        <div class="flex justify-between"><span>ԱԱՀ</span><span>{{ taxTotal.toFixed(2) }} {{ form.currency }}</span></div>
        <div class="flex justify-between font-semibold text-lg"><span>Ընդամենը</span><span>{{ grandTotal.toFixed(2) }} {{ form.currency }}</span></div>
      </div>
    </div>

    <!-- Submit -->
    <div class="flex items-center justify-end gap-2">
      <div v-if="!loading" class="flex gap-x-2">
        <button class="rounded-xl px-4 py-2 bg-violet-600 text-white hover:bg-violet-700" @click="emitDraft">
          Պահպանել Սևագիր
        </button>
        <button class="rounded-xl px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700" @click="submit()">
          Ուղարկել e-invoice
        </button>
      </div>

      <button v-else type="button"
              class="text-white flex justify-center bg-indigo-700 hover:bg-indigo-800 focus:ring-4 focus:ring-indigo-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-indigo-600 dark:hover:bg-indigo-700 focus:outline-none dark:focus:ring-indigo-800">
        <svg aria-hidden="true" class="w-6 h-6 text-gray-200 animate-spin dark:text-gray-600 fill-indigo-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
          <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script>
import api from "@/utils/api.js";
import VueSelect from "vue3-select-component";
import {useToast} from "vue-toastification";
const toast = useToast();

export default {
  name: "InvoiceForm",
  components: {VueSelect},
  props: {
    sellerDefault: {type: Object, default: () => ({name: "", tin: "", address: ""})},
    debug: {type: Boolean, default: false},
    invoice: { type: Object, default: null }
  },
  watch: {
    invoice: {
      immediate: true,
      handler(val) {
        if (val) this.applyInvoice(val);
      }
    },
    'form.buyer_id'(id) {
      if (!id) {
        this.form.buyer = { name: "", tin: "", address: "", email: "" };
        return;
      }
      const b = this.buyers.find(x => x.id === id);
      if (b) this.form.buyer = { name: b.name, tin: b.tin, address: b.address, email: b.email ?? "" };
    },
    'form.seller_id'(id) {
      if (!id) {
        this.form.seller = { ...this.sellerDefault };
        return;
      }
      const s = this.sellers.find(x => x.id === id);
      if (s) this.form.seller = { name: s.name, tin: s.tin, address: s.address ?? "" };
    }
  },
  data() {
    return {
      form: {
        seller: {...this.sellerDefault},
        buyer: {name: "", tin: "", address: "", email: ""},
        series: "",
        number: "",
        issue_date: new Date().toISOString().slice(0, 10),
        due_date: null,
        currency: "AMD",
        type: "standard",
        prices_include_vat: false,
        vat_rate_default: 20.00,
        items: [],
        buyer_id: null,
        seller_id: null,
      },
      payload: "",
      loading: false,
      buyers: [],
      sellers: []
    };
  },
  computed: {
    subtotal() { return this.form.items?.reduce((acc, it) => acc + this._calcLineNet(it), 0); },
    discountTotal() { return this.form.items?.reduce((acc, it) => acc + (Number(it.discount || 0)), 0); },
    taxTotal() { return this.form.items?.reduce((acc, it) => acc + this._calcVat(it), 0); },
    grandTotal() { return this.subtotal + this.taxTotal; }
  },
  emits: ['updateList'],
  methods: {
    applyInvoice(src) {
      // keep existing reactive object; shallow-merge top-levels
      Object.assign(this.form, {
        series: src.series ?? "",
        number: src.number ?? "",
        issue_date: (src.issue_date || new Date().toISOString().slice(0,10)),
        due_date: src.due_date ?? null,
        currency: src.currency ?? "AMD",
        type: src.type ?? "standard",
        prices_include_vat: !!src.prices_include_vat,
        vat_rate_default: Number(src.vat_rate_default ?? 20),
        // if your payload contains seller/buyer objects:
        seller: src.seller ? {
          name: src.seller.name ?? "",
          tin: src.seller.tin ?? "",
          address: src.seller.address ?? ""
        } : { ...this.sellerDefault },
        buyer: src.buyer ? {
          name: src.buyer.name ?? "",
          tin: src.buyer.tin ?? "",
          address: src.buyer.address ?? "",
          email: src.buyer.email ?? ""
        } : { name: "", tin: "", address: "", email: "" },
        // optional: if server returns IDs for selects
        seller_id: src.seller_id ?? null,
        buyer_id: src.buyer_id ?? null,
      });

      // normalize items and add stable _k
      const items = Array.isArray(src.items) ? src.items : [];
      this.form.items = items.map(it => ({
        _k: it._k || it.id || (crypto.randomUUID?.() || Math.random().toString(36).slice(2)),
        sku: it.sku ?? null,
        description: it.description ?? "",
        unit: it.unit ?? "pcs",
        qty: Number(it.qty ?? 0),
        price: Number(it.price ?? 0),
        discount: Number(it.discount ?? 0),
        vat_rate: it.vat_rate != null ? Number(it.vat_rate) : null
      }));
    },
    addItem() {
      this.form.items.push({
        _k: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
        sku: "", description: "", unit: "pcs",
        qty: 1, price: 0, discount: 0, vat_rate: null
      });
    },
    removeItem(idx) { this.form.items.splice(idx, 1); },
    resetForm() { this.form.items = []; this.form.series = ""; this.form.number = ""; },
    lineNet(it) { return this._calcLineNet(it); },
    lineGross(it) { return this._calcLineNet(it) + this._calcVat(it); },

    _vatRate(it) { const r = (it.vat_rate ?? this.form.vat_rate_default); return Number.isFinite(r) ? Number(r) : 0; },
    _calcLineNet(it) {
      const qty = Number(it.qty || 0), price = Number(it.price || 0), discount = Number(it.discount || 0), rate = this._vatRate(it);
      if (this.form.prices_include_vat) {
        const netUnit = rate > 0 ? price / (1 + rate/100) : price; return Math.max(0, netUnit * qty - discount);
      } else { return Math.max(0, price * qty - discount); }
    },
    _calcVat(it) { const rate = this._vatRate(it); if (rate <= 0) return 0; const net = this._calcLineNet(it); return net * (rate/100); },
    async buyerList(search) {
      await api.get("partners", {
        params: {
          limit: 40,
          search: search,
          type: 'buyer'
        }
      }).then((response) => {
        this.buyers = response.data.data
      }).catch((response) => {
      })
    },
    async sellerList(search) {
      await api.get("partners", {
        params: {
          limit: 40,
          search: search,
          type: 'seller'
        }
      }).then((response) => {
        this.sellers = response.data.data
      }).catch((response) => {
      })
    },
    makePayload() {
      const items = this.form.items.map(it => ({
        sku: it.sku || null,
        description: it.description,
        unit: it.unit || "pcs",
        qty: Number(it.qty || 0),
        price: Number(it.price || 0),
        discount: Number(it.discount || 0),
        vat_rate: Number((it.vat_rate ?? this.form.vat_rate_default) || 0),
        net: Number(this._calcLineNet(it).toFixed(2)),
        vat: Number(this._calcVat(it).toFixed(2)),
        gross: Number((this._calcLineNet(it) + this._calcVat(it)).toFixed(2)),
      }));

      return {
        seller: {...this.form.seller},
        buyer: {...this.form.buyer},
        meta: {
          series: this.form.series || null,
          number: this.form.number || null,
          issue_date: this.form.issue_date,
          due_date: this.form.due_date,
          currency: this.form.currency,
          type: this.form.type,
          prices_include_vat: !!this.form.prices_include_vat,
          vat_rate_default: Number(this.form.vat_rate_default),
        },
        totals: {
          subtotal: Number(this.subtotal.toFixed(2)),
          discount_total: Number(this.discountTotal.toFixed(2)),
          tax_total: Number(this.taxTotal.toFixed(2)),
          grand_total: Number(this.grandTotal.toFixed(2)),
        },
        items
      };
    },

    emitDraft() { this.store('draft'); },
    submit() { this.store('sent'); },

    store(status) {
      this.loading = true;
      let url = 'accounting/invoices/'+status;
      const payload = this.makePayload();
      if(this.$route.params.id) {
        url = 'accounting/invoices/' + this.$route.params.id;
      }
      api.post(url, payload).then(() => {
        this.loading = false;
        // toast.success(this.$t('invoice_successfully_created')); // keep if you have toast
        if(this.$route.params.id) {
          toast.success(this.$t('invoice_updated_successfully'));
        } else {
          this.$emit('updateList');
          this.resetForm();
          toast.success(this.$t('invoice_created_successfully'));
        }
      }).catch(() => {
        this.loading = false;
      });
    }
  },
  mounted() {
    this.buyerList();
    this.sellerList();
  }
};
</script>

<style scoped>
.input { @apply w-full rounded-lg border px-3 py-2; }
.label { @apply block text-sm mb-1 text-slate-600; }
.input-cell { @apply w-full border-0 outline-none focus:ring-0; }
.req { @apply text-red-500; }
</style>
