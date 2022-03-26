

import { RawAdditionals } from '../cuents/ConstituentBase'

/*=============================================
=           Additionals Store
=============================================*/

export interface IndexedRawAdditionals extends RawAdditionals {
  index: number
}
export type IndexedRawAdditionalsStore = {[key: string]: IndexedRawAdditionals}

type AdditID = string|number
type ValueOf<T> = T[keyof T];

export const additionals:IndexedRawAdditionalsStore = {}

let additionalsLength = 0

export function setField(
  id:AdditID,
  field?: keyof IndexedRawAdditionals,
  value?: ValueOf<IndexedRawAdditionals>
) { 
  const found = isNaN(Number(id))
    ? additionals[id]
    : Object.values(additionals)[id as number]

  let picked = found
  if(!picked) {
    picked = {
      index: additionalsLength++
    }
    additionals[id] = picked
  }

  if(field) (picked[field] as any) ||= value

  return picked
}

export function exportAdditionals() {
  for (const key in additionals) {
    delete (additionals[key] as any).index
  }
  return additionals
}


