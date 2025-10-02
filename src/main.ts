import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPersist from 'pinia-plugin-persistedstate'
import router from './router'
import App from './App.vue'
import './assets/main.css'
import { i18n } from '@/i18n'
import Toast from "vue-toastification";
import "vue-toastification/dist/index.css";
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css'
import scrollPagination from '@/plugins/scrollPagination.ts'
import timezone from '@/plugins/timezone';
import dateFormat from '@/plugins/dateFormat'
const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPersist)
app.use(Toast, {
    position: "bottom-right",
    timeout: 3500,
    closeOnClick: true,
    draggable: true,
    pauseOnHover: true,
});
app.component('DatePicker', VueDatePicker);
app.use(pinia)
app.use(scrollPagination)
app.use(router)
app.use(dateFormat)
app.use(i18n)
app.use(timezone)
app.mount('#app')