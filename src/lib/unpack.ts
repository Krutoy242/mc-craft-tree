import brotliPromise from 'brotli-dec-wasm'
import { Unpackr } from 'msgpackr'

export type Base = [source: string, entry: string, meta?: string, sNbt?: string]

export function baseFromId(id: string): Base {
  const s = id.split(':')
  if (s.length <= 1)
    throw new Error(`Cannot get id: ${id}`)
  if (s[0] === 'ore')
    return ['ore', s.slice(1).join(':')]
  return [s[0], s[1], s[2], s.slice(3).join(':')]
}

export interface BaseItem {
  id: string
  display: string
  imgsrc: string
  labels: string
  purity: number
  cost: number
  processing: number
  complexity: number
  steps: number
  tooltips: string[]
  recipeIndexes: number[]
  depIndexes: number[]
  source: string
  entry: string
  meta?: string
  sNbt?: string
}

export interface CsvRecipe {
  index: number
  source: string
  purity: number | null
  cost: number | null
  processing: number | null
  complexity: number | null
  labels?: string
  outputs: string[]
  inputs?: string[]
  catalysts?: string[]
}

const unpackr = new Unpackr()

function deltaDecode(arr: number[]): number[] {
  if (arr.length === 0)
    return arr
  const out = Array.from({ length: arr.length })
  out[0] = arr[0]
  for (let i = 1; i < arr.length; i++) out[i] = out[i - 1] + arr[i]
  return out
}

export function decodeItems(buf: Uint8Array): BaseItem[] {
  const o: any = unpackr.unpack(buf)
  const n = o.n
  const items = Array.from<BaseItem>({ length: n })
  for (let i = 0; i < n; i++) {
    const [source, entry, meta, sNbt] = baseFromId(o.id[i])
    const item: any = {
      id: o.id[i],
      display: o.display[i],
      imgsrc: o.imgsrc[i],
      labels: o.labels[i],
      purity: o.purity[i],
      cost: o.cost[i],
      processing: o.processing[i],
      complexity: o.complexity[i],
      steps: o.steps[i],
      tooltips: o.tooltips[i],
      recipeIndexes: deltaDecode(o.recipeIndexes[i]),
      depIndexes: deltaDecode(o.depIndexes[i]),
      source,
      entry,
    }
    if (meta !== undefined)
      item.meta = meta
    if (sNbt)
      item.sNbt = sNbt
    items[i] = item as BaseItem
  }
  return items
}

export function decodeRecipes(buf: Uint8Array): CsvRecipe[] {
  const o: any = unpackr.unpack(buf)
  const n = o.n
  const recipes = Array.from<CsvRecipe>({ length: n })

  let oRefIdx = 0
  let iRefIdx = 0
  let cRefIdx = 0

  for (let i = 0; i < n; i++) {
    const r: any = {
      index: o.seqIndex ? i : o.index[i],
      source: o.sources[o.source[i]],
      purity: o.purity[i],
      cost: o.cost[i],
      processing: o.processing[i],
      complexity: o.complexity[i],
    }

    if (o.hasLabels && o.labels[i] !== null)
      r.labels = o.labels[i]

    const oLen = o.outputsLen[i]
    const outArr = Array.from<string>({ length: oLen })
    for (let j = 0; j < oLen; j++) {
      const cnt = o.outputsCnt[oRefIdx]
      const body = o.stacks[o.outputsRef[oRefIdx]]
      outArr[j] = cnt > 0 ? `${cnt}x ${body}` : body
      oRefIdx++
    }
    r.outputs = outArr

    const iLen = o.inputsLen[i]
    if (iLen >= 0) {
      const inArr = Array.from<string>({ length: iLen })
      for (let j = 0; j < iLen; j++) {
        const cnt = o.inputsCnt[iRefIdx]
        const body = o.stacks[o.inputsRef[iRefIdx]]
        inArr[j] = cnt > 0 ? `${cnt}x ${body}` : body
        iRefIdx++
      }
      r.inputs = inArr
    }

    const cLen = o.catalystsLen[i]
    if (cLen >= 0) {
      const catArr = Array.from<string>({ length: cLen })
      for (let j = 0; j < cLen; j++) {
        const cnt = o.catalystsCnt[cRefIdx]
        const body = o.stacks[o.catalystsRef[cRefIdx]]
        catArr[j] = cnt > 0 ? `${cnt}x ${body}` : body
        cRefIdx++
      }
      r.catalysts = catArr
    }

    recipes[i] = r as CsvRecipe
  }

  return recipes
}

let brotliInstance: any = null

export async function decompressBrotli(buf: ArrayBuffer): Promise<Uint8Array> {
  if (!brotliInstance)
    brotliInstance = await brotliPromise
  return brotliInstance.decompress(new Uint8Array(buf))
}

export async function fetchDecode<T>(
  url: string,
  decodeFn: (buf: Uint8Array) => T,
): Promise<T> {
  const res = await fetch(url)
  const compressed = await res.arrayBuffer()
  const decompressed = await decompressBrotli(compressed)
  return decodeFn(decompressed)
}
