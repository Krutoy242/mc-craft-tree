import { ConstituentVisible, CuentArgs } from './ConstituentBase';
import { LinksHolder, Recipe, RecipeHolder } from './recipes';
import { RecipeLink } from './RecipeLink';
import { SetEx, UniqueKeys } from './utils';
import { listUU } from './listUU';
import * as _ from 'lodash';
import { random } from 'lodash';

const CRAFTING_TABLE_COST = 50.0

let maxDives = 5000000


function processingCostFromInputAmount(x: number) {
  x--
  return Math.floor(Math.max(0, Math.pow(1.055, x+100) - Math.pow(1.055, 101) + x*25 + CRAFTING_TABLE_COST/2))
}

let logAmount = 0
function log(...args: any[]) { if(logAmount++ < 1000) console.log(...args)}


interface DiveCallbacks {
  onSelf?: (c:Constituent)=>boolean
  afterDive?: (c: Constituent, link: RecipeLink, deph: number, lh: LinksHolder, listName: (keyof RecipeHolder))=>void
  result?: (c: Constituent)=>void
  once?: (c: Constituent)=>void
}

class RecipesInfo {
  main       ?: Recipe
  mainHolder ?: LinksHolder
  private catalystsKeys = new UniqueKeys<string, Constituent>()
  private recipesKeys   = new UniqueKeys<string, Recipe>()
  list                  = new Map<Recipe, LinksHolder>()
  ways = {
    requirments: new Set<Constituent>(),
    inputs     : new Set<Constituent>(),
    outputs    : new Set<Constituent>(),
    catalysts  : new Set<Constituent>(),
  }
  
  // iterable: Recipe[] = []
  // iterableLinks: LinksHolder[] = []
  isLooped = false

  mainInputLinks(): RecipeLink[] {
    return this.mainHolder?.inputs ?? []
  }

  mainCatalistLinks(): RecipeLink[] {
    return this.mainHolder?.catalysts ?? []
  }

  catalystsChain() {return this.catalystsKeys.values()}
  recipesChain() {return this.recipesKeys.values()}

  pickMain(): boolean {
    const typles = [...this.list].filter(([,lh]) => lh.complexity > 0)
    if(typles.length) {
      [[this.main, this.mainHolder]] = typles.sort(([,a],[,b]) => 
        a.complexity - b.complexity
      )
      //************************
      this.recipesKeys.mergeKey(this.main.id, this.main)

      for (const link of this.mainHolder.catalysts) {
        this.catalystsKeys.mergeKey(link.from.id, link.from)
      }

      for (const link of this.mainHolder.inputs) {       
        this.catalystsKeys.mergeChain(link.from.recipes.catalystsKeys)
        this.recipesKeys.mergeChain(link.from.recipes.recipesKeys)
      }
      //************************
      return true
    }
    if(this.list.size > 0) this.isLooped = true
    return false
  }

  pushIfUnique(recipe: Recipe, linksHolder: LinksHolder): boolean {
    if([...this.list.keys()].some(r=>Recipe.match(recipe, r))) return false

    // this.iterable.push(recipe)
    // this.iterableLinks.push(linksHolder)
    this.list.set(recipe, linksHolder)
    for(const way of ['inputs', 'outputs', 'catalysts']) {
      //@ts-ignore
      for(const cs of recipe[way]) {
        //@ts-ignore
        this.ways[way].add(cs.cuent)
        if(way === 'inputs' || way === 'catalysts')
          this.ways.requirments.add(cs.cuent)
      }
    }
    return true
  }
  
  iterable() : [Recipe, LinksHolder, boolean][] {
    if(this.isLooped) return []
    if(this.main && this.mainHolder) return [[this.main, this.mainHolder, true]]
    return [...this.list.entries()].map(([r, lh],i)=>[r, lh, i===this.list.size-1])
  }
}

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
  
  getRecipes() {
    return [...this.recipes.list.keys()]
  }

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
    this.calculate()
  }

  stack(amount = 1) : ConstituentStack {
    return new ConstituentStack(this, amount)
  }

  calculate() {
    this.dive('requirments', c => {
      if(c.calculated) return
      for(const lh of c.recipes.list.values()) {
        for(const l of lh.catalysts) lh.addProcessing(l.from.complexity)
        for(const l of lh.inputs)    lh.addCost(l.from.cost)
      }
      if(!c.recipes.pickMain()) c.spawnsNaturally()
      c.finishCalc()
    })
  }

  dive(
    way: Ways, 
    callback: (c: Constituent, deph: number)=>void,
    deph = 999999999,
    refs = new Map<Constituent, number>(),
    stack= [] as Constituent[],
    once = new Set<Constituent>(),
  ): void {
    if(deph <= 0) return
    let base = stack.length
    let p = base
    refs.set(this, base)

    stack.push(...this.recipes.ways[way])
    while (stack.length > p) {
      let pop = stack[p]
      const popP = refs.get(pop)
      if(popP==null) {
        pop.dive(way, callback, deph - 1, refs, stack, once)
      }else{
        if(p<popP) {
          if(!once.has(pop)) {
            callback(pop, deph)
            once.add(pop)
          }
        } else {
          base = Math.min(base, popP)
        }
      }
    }
    callback(this, deph)
    once.add(this)
  }

  dive_(
    way: Ways, 
    callback: (c: Constituent, deph: number)=>void,
    terminator?: (c: Constituent)=>boolean,
    deph = 999999999,
  ): void {
    const refs = new SetEx<Constituent>()
    const stack = [] as Constituent[]
    let p = 0
    let curr:Constituent = this

    while(curr) {
      if(!terminator?.(curr)) {
        if(refs.merge(curr.recipes.ways[way], c=>stack.push(c))) {
          p = stack.length
        } else {
          callback(curr, deph)
        }
      }
      curr = stack[--p]
    }
  }
}

type Ways = keyof RecipeHolder | 'requirments'

export class ConstituentStack {
  static sort = (a:ConstituentStack, b:ConstituentStack) => a.cuent.id.localeCompare(b.cuent.id)

  constructor(
    public cuent: Constituent, 
    public amount: number
  ) {

  }

  match(cs: ConstituentStack) { return this.amount === cs.amount && this.cuent.match(cs.cuent)}
}
