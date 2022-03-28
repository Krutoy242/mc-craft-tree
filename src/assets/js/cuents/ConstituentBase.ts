import { JEC_Types } from 'mc-gatherer'

export interface CuentArgs {
  readonly source: string
  readonly entry?: string
  readonly meta?: number
  readonly type?: JEC_Types
  nbt?: string
}

export class CuentBase implements CuentArgs {
  static sort = (a: CuentBase, b: CuentBase) => a.id.localeCompare(b.id)

  readonly id: string
  readonly source: string
  readonly entry: string
  readonly meta: number
  readonly nbt: string

  readonly shortand: string
  readonly definition: string
  readonly mandatory: string

  // readonly path : [string, string, number]
  readonly type: JEC_Types

  constructor(args: CuentArgs) {
    this.source = args.source
    this.entry = args.entry ?? ''
    this.meta = args.meta ?? 0
    this.nbt = args.nbt ?? ''
    this.type = args.type ?? 'itemStack'

    this.definition = `${this.source}:${this.entry}`
    this.shortand = this.definition + (this.meta ? ':' + this.meta : '') // "minecraft:stone:2", "ore:stone"
    this.mandatory = this.definition + ':' + this.meta
    this.id = this.mandatory + this.nbt

    // this.path = [this.source, this.entry, this.meta]

    return this
  }

  match(o: CuentBase): boolean {
    if (this.definition != o.definition) return false
    if (this.meta != o.meta) return false
    if (this.nbt != o.nbt) return false
    return true
  }
}

function customRender(ads: ConstituentAdditionals, base: CuentBase): [viewBox?: string, display?: string] {
  const additionals = ConstituentAdditionals.additionals

  if (base.source === 'aspect') {
    const a = additionals[`thaumcraft:crystal_essence:0{Aspects:[{amount:1,key:"${base.entry.toLowerCase()}"}]}`]
    return [a.viewBox, 'Aspect: ' + base.entry]
  }

  if (base.source === 'placeholder') {
    if (base.entry === 'RF') {
      return [additionals['thermalfoundation:meter:0'].viewBox, '{' + base.entry + '}']
    }
    if (base.entry === 'Exploration') {
      return [additionals['botania:tinyplanet:0'].viewBox, '{' + base.entry + '}']
    }
    const a = additionals['openblocks:tank:0{tank:{FluidName:"betterquesting.placeholder",Amount:16000}}']
    return [a.viewBox, '{' + base.entry + '}']
  }

  if (base.shortand === 'thaumcraft:infernal_furnace') {
    const a = additionals['minecraft:nether_brick:0']
    return [a.viewBox]
  }

  return []
}

export class ConstituentAdditionals {
  static additionals: AdditionalsStore

  static setAdditionals(additionals: AdditionalsStore) {
    this.additionals = additionals
  }

  item?: string // Oredict alias
  meta?: number // Oredict alias

  readonly viewBox?: string
  readonly display?: string
  readonly isNoIcon?: boolean = false

  constructor(base?: CuentBase) {
    if (!base) return

    for (const id of [base.id, base.mandatory, base.definition + ':0', base.shortand]) {
      if (this.viewBox && this.display) break

      const o = ConstituentAdditionals.additionals[id] // Regular icon
      this.viewBox ??= o?.viewBox
      this.display ??= o?.display
    }

    if (!this.viewBox || !this.display) {
      const o = customRender(this, base)
      this.viewBox ??= o[0]
      this.display ??= o[1]
    }

    if (!this.display) {
      this.display ??= `[${base.shortand}]`
    }

    if (!this.viewBox) {
      this.isNoIcon = true
      this.viewBox ??= ConstituentAdditionals.additionals['openblocks:dev_null:0']?.viewBox
    }

    this.viewBox += ' 32 32'
  }
}

export type AdditionalsStore = {
  [key: string]: ConstituentAdditionals
}

export class ConstituentVisible extends ConstituentAdditionals {
  base: CuentBase
  volume: number

  constructor(args: CuentArgs | CuentBase) {
    const base = (args as CuentBase).id ? (args as CuentBase) : new CuentBase(args)

    super(base)

    this.base = base

    if (base.type === 'placeholder') {
      if (base.entry == 'Ticks') this.volume = 0.01
      else if (base.entry == 'Mana') this.volume = 0.01
      else if (base.entry == 'Exploration') this.volume = 0.01
      else if (base.entry == 'Grid Power') this.volume = 0.01
      else if (base.entry == 'RF') this.volume = 0.000001
    } else if (base.type === 'fluidStack') {
      this.volume = 0.001
    }
    this.volume ??= 1.0
  }
}
