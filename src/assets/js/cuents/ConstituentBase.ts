import { JEC_Types } from 'mc-gatherer'

export interface CuentArgs {
  readonly source: string
  readonly entry?: string
  readonly meta?: number
  readonly type?: JEC_Types
  readonly nbt?: string
}

const switchers: { [key: string]: () => JEC_Types } = {
  placeholder: () => 'placeholder',
  fluid: () => 'fluidStack',
  liquid: () => 'fluidStack',
  ore: () => 'oreDict',
  default: () => 'itemStack',
}

export function idToCuentArgs(key: string): CuentArgs {
  const groups =
    key.match(/^(?<source>[^:{]+)(?::(?<entry>[^:{]+))?(?::(?<meta>[^:{]+))?(?<tag>\{.*\})?$/)?.groups ?? {}
  const args: CuentArgs = {
    source: groups.source,
    entry: groups.entry,
    meta: parseInt(groups.meta) || 0,
    type: (switchers[groups.source] ?? switchers['default'])(),
    nbt: groups.tag,
  }

  // if (groups.tag) {
  //   try {
  //     args.nbt = objToString(eval(`(${groups.tag})`))
  //   } catch (error: any) {
  //     console.error('nbtEvaluationError :>> ', groups.tag, 'Error: ', error.message)
  //   }
  // }

  return args
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

export class ConstituentAdditionals {
  static additionals: AdditionalsStore
  readonly viewBox?: string
  readonly display?: string
  readonly isNoIcon?: boolean = false

  constructor(base?: CuentBase) {
    if (!base) return

    const { viewBox, display } = ConstituentAdditionals.additionals[base.id] ?? {}
    this.viewBox ??= viewBox
    this.display ??= display ?? `[${base.id}]`

    if (this.viewBox) this.viewBox += ' 32 32'
    else {
      this.isNoIcon = true
      this.viewBox = '0 0 96 96'
    }
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
