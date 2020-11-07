const { listUU } = require('./listUU.js')
const { Recipe } = require('./recipes.js')
const listUUIndexes = listUU.reduce((a: { [x: string]: any },b: { name: string | number },i: any)=> (a[b.name]=i,a),{})
const { cleanupNbt, objToString, UniqueKeys } = require('./utils')
import {ConstituentVisible, CuentArgs} from './ConstituentBase';

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

export class Constituent extends ConstituentVisible {

  static noOreDictsKeys=new Set();

  recipes            : InstanceType<typeof Recipe>[] = []
  
  complexity    = 0.0
  cost          = 0.0
  processing    = 0.0
  usability     = 0.0
  popularity    = 0.0
  inputsAmount  = 0
  outputsAmount = 0
  steps         = 0
  calculated         = false
  recipe             : InstanceType<typeof Recipe>
  recipeLinks        : any
  inputLinks         : any
  catalystsKeys      : InstanceType<typeof UniqueKeys>
  recipesKeys        : InstanceType<typeof UniqueKeys>
  noAlternatives     = false


  fMeta         = 0
  fNbt          = 0
  isNoIcon           = false
  nbtStr             = ''
  volume             : number
  recipesLength      : number = 0
  complexity_byRecipe?: {[key: string]:number}

  
  public get id() : string {
    return this.name.id
  }


  constructor(cuentArgs: CuentArgs) {
    super(cuentArgs)
    this.viewBox += ' 32 32'


    if(this.fNbt) delete this.nbt // Remove nbt data if ingredient is match with any nbt
    if(this.nbt) {
      this.nbt = cleanupNbt(this.nbt)
      this.nbtStr = objToString(this.nbt)
    }
    
    this.volume        = (this.type == 'fluidStack') ? 1000.0 : 1.0


    this.id = this.mandatory + (this.nbtStr??'')
  }

  match(o: this) {
    if(this === o) return true

    if(this.definition != o.definition) return false
    if(!(this.fMeta || o.fMeta) && this.meta != o.meta) return false
    if(!(this.fNbt || o.fNbt) && this.nbtStr != o.nbtStr) return false
    return true
  }

  getComplexity(count: number) {
    return (this.cost * count) + this.processing
  }

  getUUCost(factor: number) {
    return this.cost + this.processing / (factor + Math.sqrt(this.usability || 1))
  }

  // Calculate complexity and other values after all links are created
  calculate(options:{onCalculated?: (c:Constituent)=>void, onLoop?: (c:Constituent)=>void} = {}) {

    function onCalculated(self: Constituent) {
      self.complexity = self.cost + self.processing
      self.calculated = true
      options.onCalculated?.call(self)
    }

    this.safeDive(['catalysts', 'inputs'], {

      // Called On each entrance
      // if returns true, dive body skipped to result()
      onSelf: function(c: Constituent) {
        if (c.calculated) return true

        // Check if item spawning naturally
        if (!c.nbt) {
          const predefCost = listUU[listUUIndexes[c.name]]?.uu
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
      afterDive: function(c: Constituent, link: { from: { complexity: number | undefined; cost: any } }, deph: any, recipe: { id: string | number }, listName: string) {
        let cr = c.complexity_byRecipe
        cr[recipe.id] = cr[recipe.id] ?? 0.0

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
          const recipes = c.recipes.filter((r: { id: string | number }) => c.complexity_byRecipe[r.id] > 0)
          if(recipes.length) {
            recipes.sort((a: { id: string | number },b: { id: string | number }) => 
              c.complexity_byRecipe[a.id] - c.complexity_byRecipe[b.id]
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
  safeDive(listNameArg: string[], callbacks: DiveCallbacks, deph = 999999999, refs = {recipes:new Set(), cuents:new Set(), blocked:new Set()}) {
    if (!callbacks.onSelf?.(this) && deph>0 && this.recipes.length>0) {
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

      // Links lists
      const listNamesArr = Array.isArray(listNameArg) ? listNameArg : [listNameArg]

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

          for (const listName of listNamesArr) {
            const linksList = recipeLinksLists[listName]

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

  pickRecipe(recipe: any) {
    this.recipe        = recipe
    this.inputsAmount  = recipe.inputs.length
    this.recipeLinks   = recipe.links.get(this)
    this.inputLinks    = this.recipeLinks.inputs

    this.processing    = processingCostFromInputAmount(this.inputsAmount)
    this.catalystsKeys = new UniqueKeys()
    this.recipesKeys   = new UniqueKeys()
    this.recipesKeys.mergeKey(recipe.id, recipe)
    this.steps++

    for (const link of this.recipeLinks.inputs) {
      link.from.outputsAmount++
      link.from.outsList = link.from.outsList ?? []
      link.from.outsList.push(new ConstituentStack(this, recipe.outputs.find((cs: ConstituentStack)=>cs.cuent===this).amount))
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
      link.from.popList = link.from.popList ?? []
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

  addRecipe(recipe: any) {
    if(!this.recipes.find(r=>r.match(recipe))) {
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

  constructor(public cuent: Constituent, public amount: number) {
  }

  match(cs: ConstituentStack) { return this.amount === cs.amount && this.cuent.match(cs.cuent)}
}
