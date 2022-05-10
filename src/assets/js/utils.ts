import numeral from 'numeral'

const limits = new Map<string, number>()
export function limitedLog(name: string, ...args: any[]) {
  const lim = (limits.get(name) ?? 0) + 1
  if (lim > 1000) return
  limits.set(name, lim)
  return console.log(...args)
}

export function objToString(obj: any, ndeep = 1): string {
  const t: string = typeof obj
  if (t === 'string') return '"' + obj + '"'
  if (t === 'function') return obj.name || obj.toString()
  if (t === 'object') {
    const indent = Array(ndeep).join('\t')
    const isArray = Array.isArray(obj)
    return (
      '{['[Number(isArray)] +
      Object.keys(obj)
        .map((key) => {
          const quoted = /^[a-zA-Z_$][a-zA-Z_$0-9]*$/.test(key)
            ? key
            : `"${key}"`
          return (
            '\n\t' +
            indent +
            (isArray ? '' : quoted + ': ') +
            objToString(obj[key], ndeep + 1)
          )
        })
        .join(',') +
      '\n' +
      indent +
      '}]'[Number(isArray)]
    ).replace(/[\s\t\n]+(?=(?:[^'"]*['"][^'"]*['"])*[^'"]*$)/g, '')
  }

  return obj !== undefined && obj !== null ? obj.toString() : ''
}

export class NumLimits {
  min = 999999999999
  max = 0

  update(num: number) {
    this.min = Math.min(this.min, num)
    this.max = Math.max(this.max, num)
  }

  importancy(v: number) {
    return (v - this.min) / Math.max(1, this.max)
  }
}

export class UniqueKeys<T, U> {
  ids = new Map<T, U>()
  count = 0

  reset() {
    this.ids = new Map<T, U>()
    this.count = 0
  }

  mergeKey(key: T, val: U): boolean {
    if (!key || !val || this.ids.has(key)) return false

    this.ids.set(key, val)
    this.count++
    return true
  }

  mergeChain(chain?: UniqueKeys<T, U>, onUnique?: (value: U) => void) {
    if (!chain) return this
    for (const [key, value] of chain.ids.entries()) {
      if (this.mergeKey(key, value)) onUnique?.(value)
    }
    return this
  }

  values() {
    return this.ids.values()
  }
}

export class SetEx<T> extends Set<T> {
  merge(set: Set<T>, cb?: (t: T) => void) {
    let somethingAdded = false
    for (const t of set) {
      if (!this.has(t)) {
        this.add(t)
        cb?.(t)
        somethingAdded = true
      }
    }
    return somethingAdded
  }
}
export class MapOfSets<T> extends Map<T, Set<T>> {
  getForSure(key: T): Set<T> {
    let b = this.get(key)
    if (!b) {
      b = new Set<T>()
      this.set(key, b)
    }
    return b
  }
}

export const cutNum = (num: number) => numeral(num).format('0a')
