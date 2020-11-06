import { listUU } from './listUU.js'
const listUUIndexes = listUU.reduce((a,b,i)=> (a[b.name]=i,a),{})
import { cleanupNbt, objToString, UniqueKeys } from './utils'

const CRAFTING_TABLE_COST = 50.0


function processingCostFromInputAmount(x) {
  x--
  return Math.floor(Math.max(0, Math.pow(1.055, x+100) - Math.pow(1.055, 101) + x*25 + CRAFTING_TABLE_COST/2))
}

let logAmount = 0
function log(...args) { if(logAmount++ < 1000) console.log(...args)}

export class Constituent {
  display       = ''
  name          = ''
  complexity    = 0.0
  cost          = 0.0
  processing    = 0.0
  usability     = 0.0
  popularity    = 0.0
  type          = ''
  inputsAmount  = 0
  outputsAmount = 0
  steps         = 0
  recipes       = []

  fMeta         = 0
  fNbt          = 0
  nbt           = undefined

  static additionals;
  static noOreDictsKeys=new Set();

  static sort = (a, b) => a.id.localeCompare(b.id)

  constructor(rawOrId) {
    const isJEC = typeof rawOrId === 'object'

    if(isJEC) {
      const raw = rawOrId
      this.fMeta = raw.content.fMeta
      this.fNbt  = raw.content.fNbt
      this.type  = raw.type
      this.nbt   = raw.content.nbt

      ;[this.namespace, this.entryName, this.meta] = ({
        'itemStack':  ()=>[...raw.content.item.split(':'), this.fMeta ? 0 : (raw.content.meta??0)],
        'fluidStack': ()=>['fluid',       raw.content.fluid],
        'oreDict':    ()=>['ore',         raw.content.name],
        'placeholder':()=>['placeholder', raw.content.name],
      })[this.type]()
    } else {
      const groups = rawOrId.match(
        /^(?<namespace>[^:{]+)(?::(?<name>[^:{]+))?(?::(?<meta>[^:{]+))?(?<tag>\{.*\})?$/
      ).groups

      if(groups.name) {
        // Itemstacks
        this.namespace = groups.namespace
        this.entryName = groups.name
        this.meta      = groups.meta??0
        const switchers = {
          'placeholder':()=>'placeholder',
          'fluid'      :()=>'fluidStack',
          'default'    :()=>'itemStack',
        }
        this.type = (switchers[this.namespace] ?? switchers['default'])()
      } else {
        // Oredicts
        const oreAlias = Constituent.additionals[groups.namespace]
        if (!oreAlias?.item) {
          this.type = 'oreDict'
          this.namespace = 'ore'
          this.entryName = groups.namespace
          Constituent.noOreDictsKeys.add(this.entryName)
        } else {
          this.type = 'itemStack'
          ;[this.namespace, this.entryName] = oreAlias.item.split(':')
          this.meta = oreAlias.meta??0
        }
      }

      if(groups.tag) {
        try { this.nbt = eval(`(${groups.tag})`) }
        catch (error) { console.error('nbtEvaluationError :>> ', groups.tag, 'Error: ', error.message) }
      }
    }

    if(this.fNbt) delete this.nbt // Remove nbt data if ingredient is match with any nbt
    if(this.nbt) {
      this.nbt = cleanupNbt(this.nbt)
      this.nbtStr = objToString(this.nbt)
    }

    this.definition    = `${this.namespace}:${this.entryName}`
    this.name          = this.definition + (this.meta ? ':'+this.meta : '') // "minecraft:stone:2", "ore:stone"
    this.nameMandatory = this.definition + ':' + this.meta
    this.volume        = (this.type == 'fluidStack') ? 1000.0 : 1.0


    this.id = this.nameMandatory + (this.nbtStr??'')

    //*************************************
    // Viewbox and Display
    //*************************************
    if(this.type === '') {
      const placeholderIcon = 'fluid:betterquesting.placeholder:0'
      this.viewBox = Constituent.additionals[placeholderIcon]?.viewBox || '672 1344 32 32'
      this.display = this.entryName
    } else {
      // Find item field entry in parsed data
      const definitionIdNoMeta = this.definition+':0'
      const self = this
      let descent = function descent(field) {
        let o = Constituent.additionals[self.id] // Regular icon
        if (!o?.[field]) o = Constituent.additionals[self.nameMandatory] // Icon without nbt
        if (!o?.[field]) o = Constituent.additionals[definitionIdNoMeta] // And without meta (meta = 0)
        if (!o?.[field]) o = Constituent.additionals[self.definition]    // meta not showing
        return o?.[field]
      }

      // Display localized name
      if(!this.display) this.display = descent('display') || `[${this.name}]`

      // View Box on texture sheet
      let viewBox = this.viewBox
      if(!this.viewBox) viewBox = descent('viewBox')

      if (!viewBox) {
        if (this.name === 'forge:bucketfilled') {
          viewBox = Constituent.additionals['minecraft:bucket:0']?.viewBox || '4000 2816'
        } else {
          viewBox = Constituent.additionals['openblocks:dev_null:0']?.viewBox || '576 3136'
          this.isNoIcon = true
        }
      }

      this.viewBox = viewBox + ' 32 32'
    }
  }

  match(o) {
    if(this === o) return true

    if(this.definition != o.definition) return false
    if(!(this.fMeta || o.fMeta) && this.meta != o.meta) return false
    if(!(this.fNbt || o.fNbt) && this.nbtStr != o.nbtStr) return false
    return true
  }

  getComplexity(count) {
    return (this.cost * count) + this.processing
  }

  getUUCost(factor) {
    return this.cost + this.processing / (factor + Math.sqrt(this.usability || 1))
  }

  // Calculate complexity and other values after all links are created
  calculate(options={}) {

    function onCalculated(self) {
      self.complexity = self.cost + self.processing
      self.calculated = true
      options.onCalculated?.call(self)
    }

    this.safeDive(['catalysts', 'inputs'], {

      // Called On each entrance
      // if returns true, dive body skipped to result()
      onSelf: function() {
        if (this.calculated) return true

        // Check if item spawning naturally
        if (!this.nbt) {
          const predefCost = listUU[listUUIndexes[this.name]]?.uu
          if(predefCost) {
            this.cost = predefCost
            this.processing = 0.0
            onCalculated(this)
            return true
          }
        }
      },

      // Called for each link list member
      // For each Input and each Catalyst
      afterDive: function(link, deph, recipe, listName) {
        let cr = this.complexity_byRecipe
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

      result: function() {
        if(!this.calculated) {
          // Intelectual chosing right recipe
          const recipes = this.recipes.filter(r => this.complexity_byRecipe[r.id] > 0)
          if(recipes.length > 0) {
            recipes.sort((a,b) => 
              this.complexity_byRecipe[a.id] - this.complexity_byRecipe[b.id]
            )
            this.pickRecipe(recipes[0])
          } else {
            // No correct recipe found
            // This item probably spawn naturally
            this.cost = 50.0
            this.processing = 0.0
          }

          onCalculated(this)
        }
        log('<<<', this.display);
      },

    })

    return this
  }

  // Recursively iterate through all items in list
  // usually "inputs" or "outputs"
  safeDive(listNameArg, callbacks, deph = 999999999, link, refs = {recipes:new Set(), cuents:new Set(), blocked:new Set()}) {
    if (!callbacks.onSelf?.call(this) && deph>0 && this.recipes.length>0) {
      log('>>', this.display);
      // if(this.id==='minecraft:crafting_table:0') log('table');
      if(refs.cuents.has(this)) {
        const setList = [...refs.recipes]
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
          callbacks.onLoop?.call(this)
        } else {
          // refs.recipes.delete(recipe)
          refs.recipes.add(recipe)
          refs.blocked.add(recipe)
          if(i === recipes.length - 1) this.noAlternatives = true

          const recipeLinksLists = recipe.links.get(this)

          for (const listName of listNamesArr) {
            const linksList = recipeLinksLists[listName]

            for (const link of linksList) {
              // Recursion 💫
              link.from.safeDive(listNameArg, callbacks, deph-1, link, refs)
              callbacks.afterDive?.call(this, link, deph, recipe, listName)
            }
          }

          refs.recipes.delete(recipe)
          refs.blocked.delete(recipe)
        }
      }

      refs.cuents.delete(this)
    }

    return callbacks.result?.call(this)
  }

  pickRecipe(recipe) {
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
      link.from.outsList.push(new ConstituentStack(this, recipe.outputs.find(cs=>cs.cuent===this).amount))
      this.cost += link.from.cost * link.weight // Calculate cost
      this.catalystsKeys.mergeChain(link.from.catalystsKeys, catal => {
        this.processing += catal.complexity??0
      })
      this.recipesKeys.mergeChain(link.from.recipesKeys, chainRecipe => {
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

  recalculateField(field) {
    this[field] = undefined
    this.calculated = undefined
    this.calculate()
  }

  addRecipe(recipe) {
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
  static sort = (a, b) => a.cuent.id.localeCompare(b.cuent.id)
  constructor(cuent, amount) {
    this.cuent = cuent
    this.amount = parseFloat(amount)
  }

  match(cs) { return this.amount === cs.amount && this.cuent.match(cs.cuent)}

  // Get cost of this item by recursively 
  // add costs of all its inputs
  calculate(antiloop = new WeakSet()) {

    // Iterate over all alternative recipes
    for (const recipe of this.recipes) {

      // Check if we already calculating this recipe to prevent
      // infinity loop
      if(!antiloop.has(recipe)) {
        antiloop.add(recipe)

        // Iterate over inputs and catalysts of this recipe
        for (const item of recipe.requiredItems) {
          this.costByRecipe[recipe.id] += item.calculate(antiloop)
        }
      }
    }

    // Compare this.costByRecipe to pick most cheaper recipe
    // and return cost
    return this.pickBestRecipeAndReturnCost()
  }
}
