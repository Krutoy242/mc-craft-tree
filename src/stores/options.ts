import { cookieRefs } from '../composables/cookies'

export const options = reactive({
  recipe: cookieRefs({
    treeMapView   : false,
    considerAmount: false,
    complexity    : false,
    cost          : false,
  }),
  app: cookieRefs({
    modpack: 'e2ee',
  }),
})
