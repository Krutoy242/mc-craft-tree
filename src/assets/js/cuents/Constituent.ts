import _ from 'lodash'

import listUU from '../../listUU'
import { Ways } from '../recipes/recipes'
import { cutNum, MapOfSets } from '../utils'

import { ConstituentVisible, CuentArgs } from './ConstituentBase'
import ConstituentStack from './ConstituentStack'
import RecipesInfo from './RecipesInfo'

export default class Constituent extends ConstituentVisible {
  complexity = 0.0
  cost = 0.0
  usability = 0.0
  processing = 0.0
  purity = 0.0
  recipes = new RecipesInfo()

  public get steps() {
    return this.recipes.mainHolder?.steps ?? 0
  }
  public get inputsAmount() {
    return this.recipes.mainHolder?.inputs.length ?? 0
  }
  public get popularity() {
    return this.popList.size
  }
  public get outputsAmount() {
    return this.outsList.size
  }

  outsList = new Set<Constituent>()
  popList = new Set<Constituent>()
  isNatural = false

  public get id(): string {
    return this.base.id
  }
  public get nbt(): string {
    return this.base.nbt
  }
  public get haveRecipes(): boolean {
    return !!this.recipes.list.size
  }
  get type() {
    return this.base.type
  }

  constructor(cuentArgs: CuentArgs) {
    super(cuentArgs)
    if (this.nbt) return

    const predefCost = listUU[this.base.shortand]
    if (!predefCost) return

    this.isNatural = true
    this.cost = predefCost
    this.processing = 0.0
    this.purity = 1.0
    this.finishCalc()
  }

  match(o: this) {
    return this === o || this.base.match(o.base)
  }
  getRecipes() {
    return [...this.recipes.list.keys()]
  }
  unknownCost() {
    this.cost = 100000.0
    this.finishCalc()
  }
  finishCalc() {
    this.complexity = this.cost + this.processing
  }
  stack(amount = 1): ConstituentStack {
    return new ConstituentStack(this, amount)
  }
  getUUCost(factor: number) {
    return this.cost + this.processing / (factor + Math.sqrt(this.usability))
  }
  asString() {
    return `[${this.display}]:${cutNum(this.complexity)}(${cutNum(
      this.cost
    )}+${cutNum(this.processing)})`
  }
  console() {
    return [
      `[%c${this.display}%c %c${cutNum(this.complexity)}%c %c${cutNum(
        this.cost
      )}+${cutNum(this.processing)}%c]`,
      'background: #333; color: #999',
      '',
      'color: #fff',
      '',
      'color: #555',
      '',
    ]
  }

  calculate() {
    if (this.isNatural) return true
    if (!this.recipes.pickMain(this)) this.unknownCost()
    return true
  }

  purchase(callback?: (c: Constituent) => void) {
    // Compute costs of all items somehow touches purchased one
    const once = new Set<Constituent>()
    this.dive('requirments', (c) => {
      c.calculate()
      if (!once.has(c)) {
        once.add(c)
        callback?.(c)
      }
    })

    // Compute usability
    this.order()
  }

  order(
    count = 1,
    antiloop = new WeakSet<Constituent>(),
    inventory = new Map<Constituent, number>(),
    haveCatalysts = new Map<Constituent, number>()
  ) {
    this.usability += count
    if (antiloop.has(this)) return
    antiloop.add(this)

    const main = this.recipes.main
    if (!main) return
    const outAmount = main.outputs.find((o) => o.cuent === this)
      ?.amount as number

    for (const cs of main.catalysts) {
      cs.cuent.popList.add(this)

      const required = cs.amount
      const have = inventory.get(cs.cuent) ?? 0
      const haveCtls = haveCatalysts.get(cs.cuent) ?? 0
      const needed = required - have - haveCtls
      inventory.set(cs.cuent, Math.max(0, have - required))
      haveCatalysts.set(cs.cuent, Math.max(haveCtls, required))
      if (needed < 0) continue

      cs.cuent.order(needed, antiloop, inventory, haveCatalysts)
    }

    for (const cs of main.inputs) {
      cs.cuent.outsList.add(this)

      const required = (count * cs.amount) / outAmount
      const have = inventory.get(cs.cuent) ?? 0
      const needed = required - have
      const minimum = Math.max(outAmount, needed)
      inventory.set(cs.cuent, Math.max(0, have - required))
      if (needed < 0) continue

      cs.cuent.order(minimum, antiloop, inventory, haveCatalysts)
    }
  }

  dive(
    way: Ways,
    cb: (c: Constituent, deph: number, way: Ways) => void,
    deph = 999999999,
    block = new MapOfSets<Constituent>(),
    alts = new Map<Constituent, number>(),
    route = [] as Constituent[]
  ): void {
    if (deph < 1) return
    if (this.id === 'minecraft:crafting_table:0') return cb(this, deph, way)
    route.push(this)

    const b = block.getForSure(this)
    const cuentsForWay = this.recipes.getCuentsForWay(way, b)

    alts.set(this, cuentsForWay.length)
    for (const c of cuentsForWay) {
      const altsLeft = (alts.get(this) as number) - 1
      altsLeft > 0 ? alts.set(this, altsLeft) : alts.delete(this)

      // unblock route up to loop top
      if (b.has(c)) {
        unblockRouteByBlock(route, block, alts, c)
        continue
      }
      b.add(c)

      if (route.length > 3000) {
        console.log('stack overflow')
        cb(this, deph, way)
        return
      }

      c.dive(way, cb, deph - 1, block, alts, route)
    }

    cb(this, deph, way)
    route.pop()
  }
}

function unblockRouteByBlock(
  route: Constituent[],
  block: MapOfSets<Constituent>,
  alts: Map<Constituent, number>,
  c: Constituent
) {
  const _route = _(route)
  let from: number
  let to: number
  if (
    ((from = _route.findLastIndex((o) => c === o)), from > -1) &&
    ((to = _route.slice(from).findLastIndex((o) => alts.has(o))), to > -1)
  ) {
    // TODO: This magic number means length of loop to skip
    // resolve long loops
    if (to > 100) {
      /* console.log('skipped long loop'); */ return
    }
    for (let j = from + 1; j < from + to - 1; j++) {
      block.get(route[j - 1])?.delete(route[j])
    }
  }
}
