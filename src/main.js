import Vue from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import router from './router'
import numeral from 'numeral'
import numFormat from 'vue-filter-number-format'
import { paramCase } from 'change-case'
import VueCookies from 'vue-cookies'

import WrappedComponent from 'vue-wrapped-component'
Vue.use(WrappedComponent)

import VueNonreactive from 'vue-nonreactive'
Vue.use(VueNonreactive)

import vueCurveText from '@inotom/vue-curve-text'
Vue.component('CurveText', vueCurveText)

const requireComponent = require.context(
  // Look for files in the directory
  './components',
  // Do not look in subdirectories
  false,
  // File name pattern
  /^.*\.vue$/
)

// For each matching file name...
requireComponent.keys().forEach((fileName) => {
  // Get the component config
  const componentConfig = requireComponent(fileName)
  // Get the PascalCase version of the component name
  const componentName = paramCase(
    fileName
      // Remove the file extension from the end
      .replace(/\.\w+$/, '')
  )

  // Globally register the component
  Vue.component(componentName, componentConfig.default || componentConfig)
})

// Numbers
Vue.filter('numFormat', numFormat(numeral))

// Cookies
Vue.use(VueCookies)
Vue.$cookies.config('7d') // set default config

Vue.config.productionTip = false

new Vue({
  vuetify,
  router,
  created() {
    if (sessionStorage.redirect) {
      const redirect = sessionStorage.redirect
      delete sessionStorage.redirect
      this.$router.push(redirect)
    }
  },
  render: (h) => h(App),
}).$mount('#app')
