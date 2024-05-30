import { useCookies } from 'vue3-cookies'
import type { Ref } from '@vue/reactivity'

const { cookies } = useCookies()

export function cookieRef<T>(name: string, arg: T): Ref<T> {
  const cookie = cookies.get(name)
  const r = cookie !== undefined ? ref(JSON.parse(cookie)) : ref(arg)
  watch(r, (newValue) => {
    cookies.set(name, JSON.stringify(newValue))
  })
  return r
}

// export const cookieRefs: (map: { [key: string]: any }) => Record<string, ReturnType<typeof ref>> = (map) => {
//   return Object.fromEntries(Object.entries(map).map(([name, args]) => [name, cookieRef(name, args)]))
// }

export function cookieRefs<T extends { [key: string]: any }>(map: T): { [P in keyof T]: Ref<T[P]> } {
  return Object.fromEntries(Object.entries(map).map(([name, args]) => [name, cookieRef(name, args)])) as any
}
