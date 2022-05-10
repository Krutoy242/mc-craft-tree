import './router/componentHooks.ts'

Object.defineProperty(String.prototype, 'hashCode', {
  value: function () {
    let hash = 0
    let i
    let chr
    for (i = 0; i < this.length; i++) {
      chr = this.charCodeAt(i)
      hash = (hash << 5) - hash + chr
      hash |= 0 // Convert to 32bit integer
    }
    return hash
  },
})

import vueCurveText from '@inotom/vue-curve-text'
import { paramCase } from 'change-case'
import numeral from 'numeral'
import Vue from 'vue'
import VueCookies from 'vue-cookies'
import numFormat from 'vue-filter-number-format'
import VueNonreactive from 'vue-nonreactive'
import WrappedComponent from 'vue-wrapped-component'
import { ThisTypedComponentOptionsWithArrayProps } from 'vue/types/options'

import App from './App.vue'
import vuetify from './plugins/vuetify'
import router from './router'
Vue.use(WrappedComponent)

Vue.use(VueNonreactive)

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
Vue.prototype.$tree = null

Vue.config.productionTip = false

new Vue({
  vuetify,
  router,
  created() {
    if (sessionStorage.redirect) {
      const redirect = sessionStorage.redirect
      delete sessionStorage.redirect
      void this.$router.push(redirect)
    }
  },
  render: (h) => h(App),
} as ThisTypedComponentOptionsWithArrayProps<Vue, object, object, object, never>).$mount(
  '#app'
)
