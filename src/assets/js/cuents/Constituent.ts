import * as _ from 'lodash'
import { RecipeHolder } from '../recipes/recipes'
import { ConstituentVisible, CuentArgs } from './ConstituentBase'
import { ConstituentStack } from './ConstituentStack'
import { listUU } from './listUU'
import { RecipesInfo } from './RecipesInfo'

type Ways = keyof RecipeHolder | 'requirments'

export class Constituent extends ConstituentVisible {
  complexity    = 0.0
  cost          = 0.0
  usability     = 0.0
  popularity    = 0.0
  outputsAmount = 0
  processing     = 0.0
  steps          = 0
  recipes = new RecipesInfo()

  outsList: ConstituentStack[] = []
  popList: ConstituentStack[] = []
  inputsAmount = 0
  isNatural = false

  protected calculated    = false

  public get id() : string { return this.base.id }
  public get nbt() : string { return this.base.nbt }
  public get haveRecipes() : boolean { return !!this.recipes.list.size }
  get type() { return this.base.type }

  constructor(cuentArgs: CuentArgs) {
    super(cuentArgs)
    if (this.nbt) return

    const predefCost = listUU[this.base.shortand]
    if(!predefCost) return

    this.isNatural = true
    this.cost = predefCost
    this.processing = 0.0
    this.finishCalc()
  }

  match(o: this) { return this === o || this.base.match(o.base) }
  getRecipes() { return [...this.recipes.list.keys()] }
  finishCalc() { this.complexity = this.cost + this.processing }
  spawnsNaturally() { this.cost = 50.0 }
  stack(amount = 1) : ConstituentStack { return new ConstituentStack(this, amount) }
  getUUCost(factor: number) { return this.cost + this.processing / (factor + Math.sqrt(this.usability)) }

  calculate() {
    if(this.isNatural) return true
    if(!this.recipes.pickMain(this)) this.spawnsNaturally()
    this.finishCalc()
    return true
  }

  purchase(callback?: (c: Constituent)=>void) {
    const once = new Set<Constituent>()
    this.dive('requirments', c=> {
      c.calculate()
      if(!once.has(c)) {
        once.add(c)
        callback && callback(c)
      }
    })
  }

  dive(
    way: Ways,
    cb: (c: Constituent, deph: number)=>void,
    deph = 999999999,
    block = new Map<Constituent, Set<Constituent>>(),
    alts = new Map<Constituent, number>(),
    route = [] as Constituent[],
  ): void {
    if(deph < 1) return
    if(this.id == 'minecraft:crafting_table:0') return cb(this, deph)
    route.push(this)

    let b = block.get(this) as Set<Constituent>
    if(!b) {
      b = new Set<Constituent>()
      block.set(this, b)
    }

    const ways = [...this.recipes.ways[way]].filter(o=>!b.has(o))
    alts.set(this, ways.length)
    for (const c of ways) {
      const altsLeft = alts.get(this) as number - 1
      altsLeft>0 ? alts.set(this, altsLeft) : alts.delete(this)

      // unblock route up to loop top
      if(b.has(c)) {
        const _route = _(route)
        let from, to
        if(
          (from = _route.findLastIndex(o=>c===o), from>-1) &&
          (to = _route.slice(from).findLastIndex(o=>alts.has(o)), to>-1)
        ) {
          //TODO: This magic number means length of loop to skip
          // resolve long loops
          if(to>100) {/* console.log('skipped long loop'); */continue}
          for (let j = from+1; j < from+to-1; j++) {
            block.get(route[j-1])?.delete(route[j])
          }
        }
        continue
      }
      b.add(c)

      if(route.length > 2000) {
        console.log('stack overflow')
        cb(this, deph)
        return
      }

      c.dive(way, cb, deph-1, block, alts, route)
    }

    cb(this, deph)
    route.pop()
  }
}