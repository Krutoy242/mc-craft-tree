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

  match(o: ComplexName):boolean {
    if(this.definition != o.definition) return false
    if(this.meta != o.meta) return false
    if(this.nbt != o.nbt) return false
    return true
  }
}

export type RawCollection = {[key: string]: number}

interface RawRecipe {
  out?: RawCollection | number
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
  // recipes?: RawRecipe[]
  isNoIcon = false

  constructor(name?: ComplexName) {
    if(!name) return

    if(name.shortand === 'forge:bucketfilled') this.viewBox = ConstituentAdditionals.__bucket_viewBox

    for (const id of [name.id, name.mandatory, name.definition, name.shortand]) {
      if(this.viewBox && this.display) break

      let o = ConstituentAdditionals.additionals[id] // Regular icon
      this.viewBox = this.viewBox ?? o?.viewBox
      this.display = this.display ?? o?.display
    }
    this.display ??= `[${name.shortand}]`
    
    if(!this.viewBox) this.isNoIcon = true
    this.viewBox ??= ConstituentAdditionals.__null_viewBox
    this.viewBox += ' 32 32'
  }

}

export type AdditionalsStore = {
  [key: string]: ConstituentAdditionals
}

interface RawAdditionals extends ConstituentAdditionals {
  recipes: RawRecipe[]
}

export type RawAdditionalsStore = {
  [key: string]: RawAdditionals
}

export class ConstituentVisible extends ConstituentAdditionals {

  type: JEC_Types
  name: ComplexName
  volume: number

  constructor(args: CuentArgs) {
    let name = new ComplexName(args)
    
    super(name)

    this.name = name

    this.type = args.type

    if(this.type === 'placeholder') {
      if      (name.entry == 'Ticks') this.volume = 0.01
      else if (name.entry == 'Mana') this.volume = 0.01
      else if (name.entry == 'RF') this.volume = 0.001
    } else 
    if (this.type === 'fluidStack') {
      this.volume = 0.001
    }
    this.volume ??= 1.0
  }
}