/* 
"actuallyadditions:battery_double_bauble:0": {
  "viewBox": "64 0",
  "display": "Double Battery",
  "recipes": [
    {
      "ins": {
        "159": 1
      }
    }
  ]
},
 */

import { JEC_Types } from "./JEC_Types"

export type CuentArgs = {
  type: JEC_Types
  source: string
  entry?: string
  meta?: number
  nbt?: string
}

class ComplexName {
  static sort = (a: ComplexName, b: ComplexName) => a.id.localeCompare(b.id)
  
  id        : string
  source    : string
  entry     : string
  meta      : number
  nbt       : string

  shortand  : string
  definition: string
  mandatory : string

  constructor(args: CuentArgs) {
    this.source = args.source
    this.entry  = args.entry ?? ''
    this.meta   = args.meta ?? 0
    this.nbt    = args.nbt ?? ''

    this.definition = `${this.source}:${this.entry}`
    this.shortand   = this.definition + (this.meta ? ':'+this.meta : '') // "minecraft:stone:2", "ore:stone"
    this.mandatory  = this.definition + ':' + this.meta
    this.id         = this.mandatory + this.nbt

    return this
  }

  path(): [string, string, number] {
    return [this.source, this.entry, this.meta]
  }
}

export type AdditionalsStore = {
  [key: string]: ConstituentAdditionals
}

export type RawCollection = Map<number, number>

interface RawRecipe {
  out: RawCollection | number
  ins: RawCollection
  ctl?: RawCollection
}

export class ConstituentAdditionals {
  static additionals: AdditionalsStore;
  static __bucket_viewBox: string
  static __null_viewBox: string

  static setAdditionals(additionals: AdditionalsStore) {
    ConstituentAdditionals.additionals = additionals

    ConstituentAdditionals.__bucket_viewBox = additionals['minecraft:bucket:0']?.viewBox || '4000 2816'
    ConstituentAdditionals.__null_viewBox = additionals['openblocks:dev_null:0']?.viewBox || '576 3136'
  }

  item?: string // Oredict alias
  meta?: number // Oredict alias

  viewBox?: string
  display?: string
  recipes?: RawRecipe[]

  constructor(name?: ComplexName) {
    if(!name) return

    if(name.shortand === 'forge:bucketfilled') this.viewBox = ConstituentAdditionals.__bucket_viewBox

    for (const id of [name.id, name.mandatory, name.definition, name.shortand]) {
      if(this.viewBox && this.display) break

      let o = ConstituentAdditionals.additionals[id] // Regular icon
      this.viewBox = this.viewBox ?? o?.viewBox
      this.display = this.display ?? o?.display
    }

    this.viewBox = this.viewBox ?? ConstituentAdditionals.__null_viewBox
    this.display = this.display ?? `[${name.shortand}]`
  }

}


export class ConstituentVisible extends ConstituentAdditionals {

  type: JEC_Types
  name: ComplexName

  constructor(args: CuentArgs) {
    let name = new ComplexName(args)
    
    super(name)

    this.name = name

    this.type = args.type
  }
}

exports.ConstituentBase = ConstituentAdditionals