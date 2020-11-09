import { listUU } from './listUU';
import { LinksHolder, Recipe, RecipeHolder } from './recipes';
import { UniqueKeys } from './utils';
import {ConstituentVisible, CuentArgs} from './ConstituentBase';
import { RecipeLink } from './RecipeLink.js';
const listUUIndexes = listUU.reduce(
  (a,b,i)=> (a[b.name]=i, a), {} as {[key: string]: number}
)

const CRAFTING_TABLE_COST = 50.0


function processingCostFromInputAmount(x: number) {
  x--
  return Math.floor(Math.max(0, Math.pow(1.055, x+100) - Math.pow(1.055, 101) + x*25 + CRAFTING_TABLE_COST/2))
}

let logAmount = 0
function log(...args: any[]) { if(logAmount++ < 1000) console.log(...args)}


interface DiveCallbacks {
  onSelf?: Function
  onLoop?: Function
  afterDive?: Function
  result?: Function
}


export class Uncraftable extends ConstituentVisible {
  
  complexity    = 0.0
  cost          = 0.0
  usability     = 0.0
  popularity    = 0.0
  outputsAmount = 0
  calculated    = false

  public get id() : string { return this.name.id }
  public get nbt() : string { return this.name.nbt }

  constructor(cuentArgs: CuentArgs) {
    super(cuentArgs)
  }

  match(o: this): boolean {
    if(this === o) return true
    return this.name.match(o.name)
  }

}

class RecipesInfo extends LinksHolder {
  recipes: Recipe[]

  constructor() {
    super()
  }
}

export class Constituent extends Uncraftable {
  processing    = 0.0
  inputsAmount  = 0
  steps         = 0
  noAlternatives     = false
  recipes = new RecipesInfo()
  recipes: Recipe[] = []
  recipesLength: number = 0
  recipeLinks         : LinksHolder
  inputLinks          : RecipeLink[]
  recipe              : Recipe
  catalystsKeys       : UniqueKeys<string, Constituent>
  recipesKeys         : UniqueKeys<string, Recipe>
  complexity_byRecipe : Record<string, number>
  outsList            : ConstituentStack[]
  popList             : ConstituentStack[]

  constructor(cuentArgs: CuentArgs) {
    super(cuentArgs)
  }

  getUUCost(factor: number) {
    return this.cost + this.processing / (factor + Math.sqrt(this.usability || 1))
  }


  // Calculate complexity and other values after all links are created
  calculate(options:{
    onCalculated?: (c:Constituent)=>void, 
    onLoop?: (c:Constituent)=>void} = {}
  ) {

    function onCalculated(self: Constituent) {
      self.complexity = self.cost + self.processing
      self.calculated = true
      options.onCalculated?.(self)
    }

    this.safeDive(['catalysts', 'inputs'], {

      // Called On each entrance
      // if returns true, dive body skipped to result()
      onSelf: function(c: Constituent) {
        if (c.calculated) return true

        // Check if item spawning naturally
        if (!c.nbt) {
          const predefCost = listUU[listUUIndexes[c.name.shortand]]?.uu
          if(predefCost) {
            c.cost = predefCost
            c.processing = 0.0
            onCalculated(c)
            return true
          }
        }
      },

      // Called for each link list member
      // For each Input and each Catalyst
      afterDive: function(c: Constituent, link: RecipeLink, deph: number, recipe: Recipe, listName: string) {
        let cr = c.complexity_byRecipe as Record<string, number>
        cr[recipe.id] ??= 0.0

        if(listName == 'catalysts') {
          // Temporary cost for items caused in loop
          if(link.from.complexity === undefined) {
            // delete cr[recipe.id]
            cr[recipe.id] = -Infinity
          } else {
            cr[recipe.id] += link.from.complexity / 100
          }
        } else {
          cr[recipe.id] += link.from.cost
        }
      },

      onLoop: options.onLoop,

      result: function(c: Constituent) {
        if(!c.calculated) {
          // Intelectual chosing right recipe
          const recipes = c.recipes!.filter(r => c.complexity_byRecipe![r.id] > 0)
          if(recipes.length) {
            recipes.sort((a,b) => 
              c.complexity_byRecipe![a.id] - c.complexity_byRecipe![b.id]
            )
            c.pickRecipe(recipes[0])
          } else {
            // No correct recipe found
            // c item probably spawn naturally
            c.cost = 50.0
            c.processing = 0.0
          }

          onCalculated(c)
        }
        log('<<<', c.display);
      },

    })

    return this
  }

  // Recursively iterate through all items in list
  // usually "inputs" or "outputs"
  safeDive(listNameArg: (keyof RecipeHolder)[], callbacks: DiveCallbacks, deph = 999999999, refs = {recipes:new Set(), cuents:new Set(), blocked:new Set()}) {
    if (!callbacks.onSelf?.(this) && deph>0 && this.recipes?.length) {
      log('>>', this.display);
      // if(this.id==='minecraft:crafting_table:0') log('table');
      if(refs.cuents.has(this)) {
        const setList: any[] = [...refs.recipes]
        let i = setList.length
        let haveAlts = false
        while (i--) {
          let rec = setList[i]
          haveAlts = haveAlts || rec.haveAlternatives()
          if(rec.hasOutput(this)) break
          if(haveAlts) {
            // log('%c 🍮 Unblock this recipe: ', 'font-size:20px;background-color: #FCA650;color:#fff;', rec.display());
            refs.blocked.delete(rec)
          }
        }
      }
      refs.cuents.add(this)

      //TODO: Pick recipes for 'outputs' list name
      const recipes = this.recipe ? [this.recipe] : this.recipes
      // for (const recipe of recipes) {
      for (const i in recipes) {
        const recipe = recipes[i]

        if(refs.blocked.has(recipe)) {
          callbacks.onLoop?.(this)
        } else {
          // refs.recipes.delete(recipe)
          refs.recipes.add(recipe)
          refs.blocked.add(recipe)
          if(+i === recipes.length - 1) this.noAlternatives = true

          const recipeLinksLists = recipe.links.get(this)

          for (const listName of listNameArg) {
            const linksList = recipeLinksLists![listName]

            for (const link of linksList) {
              // Recursion 💫
              link.from.safeDive(listNameArg, callbacks, deph-1, refs)
              callbacks.afterDive?.(this, link, deph, recipe, listName)
            }
          }

          refs.recipes.delete(recipe)
          refs.blocked.delete(recipe)
        }
      }

      refs.cuents.delete(this)
    }

    return callbacks.result?.(this)
  }

  pickRecipe(recipe: Recipe) {
    this.recipe        = recipe
    this.inputsAmount  = recipe.inputs.length
    this.recipeLinks   = recipe.links.get(this) as LinksHolder
    this.inputLinks    = this.recipeLinks.inputs

    this.processing    = processingCostFromInputAmount(this.inputsAmount)
    this.catalystsKeys = new UniqueKeys()
    this.recipesKeys   = new UniqueKeys()
    this.recipesKeys.mergeKey(recipe.id, recipe)
    this.steps++

    for (const link of this.recipeLinks.inputs) {
      link.from.outputsAmount++
      link.from.outsList ??= []
      link.from.outsList.push(new ConstituentStack(this, recipe.outputs.find(cs=>cs.cuent===this)!.amount))
      this.cost += link.from.cost * link.weight // Calculate cost
      this.catalystsKeys.mergeChain(link.from.catalystsKeys, (catal: { complexity: any }) => {
        this.processing += catal.complexity??0
      })
      this.recipesKeys.mergeChain(link.from.recipesKeys, (chainRecipe: { inputs: string | any[] }) => {
        this.processing += processingCostFromInputAmount(chainRecipe.inputs.length)
        this.steps++
      })

      // link.from.usability += (this.usability + 1.0) * link.weight
    }

    for (const link of this.recipeLinks.catalysts) {
      link.from.popularity++
      link.from.popList ??= []
      link.from.popList.push(new ConstituentStack(this, 1))
      if (this.catalystsKeys.mergeKey(link.from.id, link.from))
        this.processing += link.from.complexity??0
    }
  }

  recalculateField(field: 'cost'|'usability') {
    this[field] = 0
    this.calculated = false
    this.calculate()
  }

  addRecipe(recipe: Recipe) {
    if(!this.recipes.find(recipe.match)) {
      this.recipes.push(recipe)
      this.recipesLength = (this.recipesLength || 0) + 1
      this.complexity_byRecipe = this.complexity_byRecipe ?? {}
    }
  }

  prettyString() {
    return `${this.id} [💱:${this.complexity}] [💲:${this.cost}] ` +
    `♻:${this.usability} [🖩:${this.calculated ? '☑' : '☐'}] [⚙:${this.steps}]`
  }
}


export class ConstituentStack {
  static sort = (a:ConstituentStack, b:ConstituentStack) => a.cuent.id.localeCompare(b.cuent.id)

  constructor(
    public cuent: Constituent, 
    public amount: number
  ) {

  }

  match(cs: ConstituentStack) { return this.amount === cs.amount && this.cuent.match(cs.cuent)}
}