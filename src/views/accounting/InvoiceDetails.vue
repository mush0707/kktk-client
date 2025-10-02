<template>
  <div class="flex flex-col gap-y-2">
    <div class="flex flex-col">
      <div class="dark:border-gray-700 bg-white">
        <div class="flex flex-col p-4 border-b rounded-md border-gray-200">
          <div class=" text-xl">
            <p>{{ $t('invoice') }}: {{ invoice.number }}</p>
          </div>
        </div>
      </div>
      <nav class="flex bg-blue-50 py-2 items-center text-sm" aria-label="Breadcrumb">
        <ol class="inline-flex items-center">

          <li>
            <router-link :to="'/accounting/invoices'"
                         class="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-slate-100">
              <span class="underline-offset-2 hover:underline">{{ $t('invoices') }}</span>
            </router-link>
          </li>
          <li aria-hidden="true" class="px-1">
            <svg class="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                  d="M7.05 3.55a1 1 0 0 1 1.4 0l4.5 4.5a1 1 0 0 1 0 1.4l-4.5 4.5a1 1 0 0 1-1.4-1.4L10.79 10 7.05 6.26a1 1 0 0 1 0-1.41z"/>
            </svg>
          </li>
          <li>
            <p class="inline-flex items-center gap-1 rounded-md px-2 py-1">
              <span class="underline-offset-2 hover:underline">{{ invoice?.number ?? '—' }}</span>
            </p>
          </li>
        </ol>
      </nav>
      <div v-if="invoice !== null">
        <NewInvoice @updateList="updateList" v-bind:invoice="invoice"/>
      </div>
    </div>
  </div>
</template>
<script>
import api from "@/utils/api.js";
import NewInvoice from "@/views/accounting/components/NewInvoice.vue";

export default {
  components: {NewInvoice},
  data() {
    return {
      invoice: {
        number: null
      }
    }
  },
  methods: {
    async getInvoiceById() {
      await api.get("accounting/invoices/"+this.$route.params.id).then((response) => {
        this.invoice = response.data.data
      }).catch((response) => {
      })
    },
  },
  mounted() {
    this.getInvoiceById();
  }
}
</script>