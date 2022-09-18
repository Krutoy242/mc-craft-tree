import { cookieRefs } from './cookies'

export function useOptions() {
  return {
    recipe: reactive(cookieRefs({
      treeMapView   : false,
      considerAmount: false,
      complexity    : false,
      cost          : false,
    })),
  }
}
