import { LinksHolder, Recipe, RecipeHolder } from '../recipes/recipes'
import { ConstituentVisible, CuentArgs } from './ConstituentBase'
import { ConstituentStack } from './ConstituentStack'
import { listUU } from './listUU'
import { RecipesInfo } from './RecipesInfo'

const CRAFTING_TABLE_COST = 50.0

let maxDives = 5000000


function processingCostFromInputAmount(x: number) {
  x--
  return Math.floor(Math.max(0, Math.pow(1.055, x+100) - Math.pow(1.055, 101) + x*25 + CRAFTING_TABLE_COST/2))
}

let logAmount = 0
function log(...args: any[]) { if(logAmount++ < 1000) console.log(...args)}


export class Constituent extends ConstituentVisible {
  complexity    = 0.0
  cost          = 0.0
  usability     = 0.0
  popularity    = 0.0
  outputsAmount = 0
  processing     = 0.0
  steps          = 0
  noAlternatives = false
  recipes = new RecipesInfo()
  private divehash = 0
  
  outsList: ConstituentStack[] = []
  popList: ConstituentStack[] = []
  inputsAmount = 0
  isNatural = false

  protected calculated    = false

  public get id() : string { return this.base.id }
  public get nbt() : string { return this.base.nbt }

  constructor(cuentArgs: CuentArgs) {
    super(cuentArgs)

    this.init()
  }

  match(o: this): boolean {
    if(this === o) return true
    return this.base.match(o.base)
  }
  
  public get haveRecipes() : boolean {
    return !!this.recipes.list.size
  }

  get type() {return this.base.type}

  // Should be called after all recipes added
  init(): boolean {
    // Check if item spawning naturally
    if (!this.nbt) {
      const predefCost = listUU[this.base.shortand]
      if(predefCost) {
        this.isNatural = true
        this.cost = predefCost
        this.processing = 0.0
        this.finishCalc()
        return true
      }
    }
    return false
  }
  
  getRecipes() {
    return [...this.recipes.list.keys()]
  }


  iterableRecipes(toOutput: boolean) {
    if(toOutput) {
      return this.outsList.map(c=>
        [c.cuent.recipes!.main, c.cuent.recipes!.mainHolder, false] as [Recipe, LinksHolder, boolean]
      )
    } else {
      return this.recipes.iterable()
    }
  }

  finishCalc() {
    //************************
    //* This block would be skipped if cuent have no recipes
    for (const link of this.recipes.mainInputLinks()) {
      this.inputsAmount++
      link.from.outputsAmount++
      link.from.outsList.push(this.stack(this.recipes.main!.outputs.find(cs=>cs.cuent===this)!.amount))
      this.cost += link.from.cost * link.weight
    }

    for (const link of this.recipes.mainCatalistLinks()) {
      link.from.popularity++
      link.from.popList.push(this.stack())
    }

    for (const recipeInChain of this.recipes.recipesChain()) {
      this.processing = processingCostFromInputAmount(recipeInChain.inputs.length)
      this.steps++
    }

    for (const catalInChain of this.recipes.catalystsChain()) {
      this.processing += catalInChain.complexity ?? 0
    }
    //************************

    this.complexity = this.cost + this.processing
    this.calculated = true
  }

  spawnsNaturally() {
    this.cost = 50.0
  }

  getUUCost(factor: number) {
    return this.cost + this.processing / (factor + Math.sqrt(this.usability || 1))
  }

  recalculateField(field: 'cost'|'usability') {
    this[field] = 0
    this.calculated = false
    this.purchase()
  }

  stack(amount = 1) : ConstituentStack {
    return new ConstituentStack(this, amount)
  }

  calculate() {
    if(this.calculated) return false
    for(const lh of this.recipes.list.values()) {
      for(const l of lh.catalysts) lh.addProcessing(l.from.complexity)
      for(const l of lh.inputs)    lh.addCost(l.from.cost)
    }
    if(!this.recipes.pickMain()) this.spawnsNaturally()
    this.finishCalc()
    return true
  }

  purchase(callback?: (c: Constituent)=>void) {
    const stack  = [...this.recipes.ways['requirments']]
    const hashed = new Set<Constituent>()

    const calcTop = ()=>{
      const c = stack.pop() as Constituent
      if(c.calculate() && callback) callback(c)
    }
    
    while (stack.length > 0) {
      const p = stack[stack.length-1]
      if(hashed.has(p)) {calcTop(); continue}
      hashed.add(p)

      const reqs = p.recipes.ways['requirments']
      if(reqs.size == 0) {calcTop(); continue}
      stack.push(...reqs)
    }
  }


  dive(
    way: Ways, 
    callback: (c: Constituent, deph: number)=>void,
    deph = 999999999,
    refs = new Map<Constituent, number>(),
    stack= [] as Constituent[],
    once = new Set<Constituent>(),
  ): void {
    return
  }
}

type Ways = keyof RecipeHolder | 'requirments'


