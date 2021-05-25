

import { RawAdditionals, RawCollection } from '../cuents/ConstituentBase'
import { serializeNameMeta, serializeNbt } from './utils_parse'
import { cleanupNbt } from '../utils'
import _ from 'lodash'

/*=============================================
=           Parsing
=============================================*/

export interface IndexedRawAdditionals extends RawAdditionals {
  index: number
}
export type IndexedRawAdditionalsStore = {[key: string]: IndexedRawAdditionals}

type AdditID = string|number
type ValueOf<T> = T[keyof T];

export const additionals:IndexedRawAdditionalsStore = {}

let additionalsLength = 0

export type SetFieldFn = typeof setField

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

export function cleanupAdditionals() {
  for (const key in additionals) {
    delete (additionals[key] as any).index
  }
  return additionals
}


const clearableTags = [
  /\{"RSControl":\d+,"Facing":\d+,"Energy":\d+,"SideCache":\[\d+,\d+,\d+,\d+,\d+,\d+\],"Level":0\}/
]
function clearableTag(tag: object) {
  return clearableTags.some(rgx=>rgx.test(JSON.stringify(tag)))
}


export class IIngredient {
  public name: any;
  public count: any;
  public _weight: any;
  public tag: any;
  public futile: any;
  public strId: any;
  public additionals!: IndexedRawAdditionals;

  constructor(str: any) {
    this.name = str
    this.count = 1
    this._weight = 1.0
    this.update()
  }

  withTag(tag: object) {
    if (!tag || Object.keys(tag).length === 0 || clearableTag(tag)) return this

    const n = new IIngredient(this.name)
    n.count = this.count
    n.tag = tag
    n.update()
    return n
  }

  quantity() {
    return this.count * this._weight
  }

  weight(n: number) {
    if (isNaN(n)) return this
    this._weight = n || 1
    return this
  }

  amount(n: number) {
    if (isNaN(n)) return this
    this.count = n
    return this
  }

  asString() { return serializeNameMeta(this.name) + serializeNbt(cleanupNbt(this.tag)) }
  update() {
    // Blacklist recipes that content this items
    // as inputs or outputs
    if(
      (this.tag && this.tag.ncRadiationResistance)/*  ||
      /^conarm:(helmet|chestplate|leggins|boots)$/.test(this.name) */
    ) {
      this.futile = true
      return
    }

    this.strId = this.asString()
    this.additionals = setField(this.strId)
  }

  or() {return this}
}

type AnyIngredients = IIngredient | string | undefined | AnyIngredients[]

class IngredientList {
  main:   IIngredient;
  list:   Array<IIngredient>;
  keys:   RawCollection;
  futile: Boolean;
  count:  Number;

  constructor(arg: AnyIngredients) {   
    this.list = _.flattenDeep([arg])
      .map(g => (_.isString(g) ? BH(g) : g))
      .filter((i): i is IIngredient => i!=null && !i.futile)

    this.futile = !this.list.length

    this.keys = this.list.reduce((acc, i) => {
      const index = i.additionals.index
      acc[index] = (acc[index] || 0) + i.quantity()
      if(!acc[index]) throw new Error()
      return acc
    }, {} as RawCollection)

    this.main = this.list[0]
    this.count = Object.keys(this.keys).length
  }

  toObj() {
    return this.count>0 ? this.keys : undefined
  }
}

export function BH(str: string) { return new IIngredient(str) }

type RecipeParams = [outputs:AnyIngredients, inputs:AnyIngredients, catalysts?:AnyIngredients]

export function addRecipe(_recipName: null, ...params: RecipeParams) {
  const [outputs, inputs, catalysts] = params.map(o=>new IngredientList(o))
  
  if([outputs, inputs].some(il=>il.futile)) return

  const ads = outputs.main.additionals
  ads.recipes = ads.recipes || []
  ads.recipes.push({
    out: outputs.count>1
      ? outputs.keys
      : outputs.main.quantity()!==1 
        ? outputs.main.quantity() 
        : undefined,
    ins: inputs.toObj(),
    ctl: catalysts?.toObj()
  })
}
export const $ = (...params: RecipeParams) => addRecipe(null, ...params)