import { createPinia } from 'pinia'
import BadgeDirective from 'primevue/badgedirective'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import Tooltip from 'primevue/tooltip'

import routes from 'virtual:generated-pages'

import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'

import App from './App.vue'

import '@unocss/reset/tailwind.css'
import './styles/main.css'
import 'uno.css'

import 'primeicons/primeicons.css'
import 'primeflex/primeflex.css'

const app = createApp(App)
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

app.directive('tooltip', Tooltip)
app.directive('badge', BadgeDirective)

app.use(router)
app.use(createPinia())
app.use(PrimeVue, { ripple: true, theme: { preset: Aura, options: { darkModeSelector: '.dark' } } })

app.mount('#app')
