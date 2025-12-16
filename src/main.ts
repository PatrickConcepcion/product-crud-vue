import { createApp } from 'vue'

import App from './App.vue'
import router from './router'
import './assets/main.css'
import { pinia } from './pinia'
import { useAuthStore } from './stores/auth'
import Vue3Toastify, { type ToastContainerOptions } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'

const app = createApp(App)

app.use(pinia)
app.use(Vue3Toastify, {
  autoClose: 3000,
} as ToastContainerOptions)

void useAuthStore(pinia).initialize()
app.use(router)

app.mount('#app')
