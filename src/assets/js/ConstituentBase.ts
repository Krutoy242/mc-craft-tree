import { JEC_Types } from "./JEC_Types"

export interface CuentArgs {
  readonly source: string
  readonly entry?: string
  readonly meta?: number
  readonly nbt?: string
  readonly type?: JEC_Types
}

export class CuentBase implements CuentArgs {
  static sort = (a: CuentBase, b: CuentBase) => a.id.localeCompare(b.id)
  
  readonly id        : string
  readonly source    : string
  readonly entry     : string
  readonly meta      : number
  readonly nbt       : string

  readonly shortand  : string
  readonly definition: string
  readonly mandatory : string

  // readonly path : [string, string, number]
  readonly type: JEC_Types

  constructor(args: CuentArgs) {
    this.source = args.source
    this.entry  = args.entry ?? ''
    this.meta   = args.meta ?? 0
    this.nbt    = args.nbt ?? ''
    this.type   = args.type ?? 'itemStack'

    this.definition = `${this.source}:${this.entry}`
    this.shortand   = this.definition + (this.meta ? ':'+this.meta : '') // "minecraft:stone:2", "ore:stone"
    this.mandatory  = this.definition + ':' + this.meta
    this.id         = this.mandatory + this.nbt

    // this.path = [this.source, this.entry, this.meta]

    return this
  }

  match(o: CuentBase):boolean {
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
  isNoIcon = false

  constructor(base?: CuentBase) {
    if(!base) return

    if(base.shortand === 'forge:bucketfilled') this.viewBox = ConstituentAdditionals.__bucket_viewBox

    for (const id of [base.id, base.mandatory, base.definition, base.shortand]) {
      if(this.viewBox && this.display) break

      let o = ConstituentAdditionals.additionals[id] // Regular icon
      this.viewBox = this.viewBox ?? o?.viewBox
      this.display = this.display ?? o?.display
    }
    this.display ??= `[${base.shortand}]`
    
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

  base: CuentBase
  volume: number

  constructor(args: CuentArgs | CuentBase) {
    const base = (args as CuentBase).id ? (args as CuentBase) : new CuentBase(args)
    
    super(base)

    this.base = base

    if(base.type === 'placeholder') {
      if      (base.entry == 'Ticks') this.volume = 0.01
      else if (base.entry == 'Mana') this.volume = 0.01
      else if (base.entry == 'RF') this.volume = 0.001
    } else 
    if (base.type === 'fluidStack') {
      this.volume = 0.001
    }
    this.volume ??= 1.0
  }
}