import { Memoize as _Memoize } from 'typescript-memoize'

export function capitalizeFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export const Memoize = _Memoize()
