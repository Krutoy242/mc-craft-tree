const _ = require('lodash')
import { listUU } from './listUU.js'
const listUUIndexes = listUU.reduce((a,b,i)=> (a[b.name]=i,a),{})
import { clearEmpties, objToString } from './utils'

const CRAFTING_TABLE_COST = 50.0


function processingCostFromInputAmount(x) {
  x--
  return Math.floor(Math.max(0, Math.pow(1.055, x+100) - Math.pow(1.055, 101) + x*25 + CRAFTING_TABLE_COST/2))
}

function getMeta(raw) {
  return (raw.content.fMeta === 1)
    ? undefined
    : raw.content.meta
}

function trueNbt(nbt, fNbt){
  return (nbt && Object.keys(nbt).length !== 0 && !fNbt)
    ? nbt
    : undefined
}

export class Constituent {


  // Default values for nodes
  static cost           = 1.0;
  static complexity     = 1.0;
  static usability      = 0.0;
  static popularity     = 0.0;
  static processing     = 0.0;

  static additionals;
  static noOreDictsKeys={};

  constructor(rawOrId) {

    // Predefine fields for pretty console log
    this.display = undefined
    this.name = undefined
    this.complexity = undefined
    this.cost = undefined
    this.processing = undefined
    this.usability = undefined
    this.popularity = undefined
    this.type = undefined

    const isJEC = typeof rawOrId == 'object'

    if(isJEC) {
      const raw = rawOrId
      this.fMeta = raw.content.fMeta
      this.fNbt  = raw.content.fNbt
      this.type  = raw.type
      this.nbt   = raw.content.nbt

      switch (this.type) {
      case 'itemStack':
        [this.entrySource, this.entryName] = raw.content.item.split(':')
        this.entryMeta   = getMeta(raw)               // Meta. Only for itemStacks
        break
      case 'fluidStack':
        this.entrySource = 'fluid'
        this.entryName = raw.content.fluid
        break
      case 'oreDict':
        this.entrySource = 'ore'
        this.entryName = raw.content.name
        break
      case 'placeholder':
        this.entrySource = 'placeholder'
        this.entryName = raw.content.name
        break
      default:
        this.entrySource = 'NO_SOURCE'
        this.entryName = 'NO_NAME'
      }
    } else {
      const groups = rawOrId.match(/^(?<source>[^:]+)(?::(?<name>[^:]+))?(?::(?<meta>[^:]+))?(?<tag>\{.*\})?$/).groups


      if(groups.name) {
        this.entrySource = groups.source
        this.entryName   = groups.name
        this.entryMeta   = groups.meta
        if(this.entrySource === 'fluid') {
          this.type = 'fluidStack'
        } else {
          this.type = 'itemStack'
        }
      } else {
        var oreAlias = Constituent.additionals[groups.source]
        if (!oreAlias?.item) {
          Constituent.noOreDictsKeys[groups.source] = true
          this.type = 'oreDict'
          this.entrySource = 'ore'
          this.entryName = groups.source
        } else {
          this.type = 'itemStack'
          ;[this.entrySource, this.entryName] = oreAlias.item.split(':')
          this.entryMeta   = oreAlias.meta
        }
      }

      if(groups.tag) {
        try {
          this.nbt   = eval(`(${groups.tag})`)
        } catch (error) {
          console.error('nbtEvaluationError :>> ', groups.tag, 'Error: ', error.message)
        }
      }
    }

    if(this.nbt) {
      clearEmpties(this.nbt)
      this.nbt = trueNbt(this.nbt, this.fNbt)
      this.nbtStr = objToString(this.nbt)
    }

    this.entryMeta     = this.entryMeta||0
    this.definition    = `${this.entrySource}:${this.entryName}`
    this.name          = this.definition + (this.entryMeta ? ':'+this.entryMeta : '') // "minecraft:stone:2", "ore:stone"
    this.nameMandatory = this.definition + ':' + this.entryMeta
    this.volume        = (this.type                                                                                      == 'fluidStack') ? 1000.0 : 1.0
    this.recipes       = []
    this.inputsAmount  = 0
    this.outputsAmount = 0
    this.steps         = 0
    this.popularity    = Constituent.popularity
    this.usability     = Constituent.usability
    this.processing    = Constituent.processing
    this.cost          = Constituent.cost


    const definitionIdNoMeta = this.definition+':0'
    this.id = this.nameMandatory + (this.nbtStr??'')


    // Find item field entry in parsed data
    const self = this
    function descent(field) {
      var o = Constituent.additionals[self.id]// Regular icon
      if (!o?.[field]) o = Constituent.additionals[self.nameMandatory]// Icon without nbt
      if (!o?.[field]) o = Constituent.additionals[definitionIdNoMeta] // And without meta (meta = 0)
      if (!o?.[field]) o = Constituent.additionals[self.definition] // meta not showing
      return o?.[field]
    }

    this.display = descent('display') || `[${this.name}]` // Display localized name
    var viewBox = descent('viewBox') // View Box on texture sheet

    if (!viewBox) {
      if (this.type === 'placeholder') {
        viewBox = Constituent.additionals['fluid:betterquesting.placeholder:0']?.viewBox || '672 1344'
      } else if (this.name === 'forge:bucketfilled') {
        viewBox = Constituent.additionals['minecraft:bucket:0']?.viewBox || '4000 2816'
      } else {
        viewBox = Constituent.additionals['openblocks:dev_null:0']?.viewBox || '576 3136'
        this.isNoIcon = true
      }
    }

    this.viewBox = viewBox + ' 32 32'
  }

  match(o) {
    if(this.definition != o.definition) return false
    if(!(this.fMeta || o.fMeta) && this.entryMeta != o.entryMeta) return false
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

    this.safeDive(['inputs', 'catalysts'], {

      // Called On each entrance
      // if returns true, dive body skipped to result()
      onSelf: function() {
        if (this.calculated) return true

        // Check if item spawning naturally
        if (!this.nbt) {
          const naturalCost = listUU[listUUIndexes[this.name]]?.uu
          if(naturalCost) {
            this.cost = naturalCost
            this.processing = 0.0
            onCalculated(this)
            return true
          }
        }

        if(this.recipes.length > 0) {
          // this.processing_byRecipe = {}
          // this.cost_byRecipe = {}
          this.complexity_byRecipe = {}
          for (const recipe of this.recipes) {
            // this.processing_byRecipe[recipe.id] = 0
            // this.cost_byRecipe[recipe.id] = 0
            this.complexity_byRecipe[recipe.id] = 0.0
          }
        }
      },

      afterDive: function(link, deph, recipe, listName) {
        const recipeId = recipe.id
        if(listName == 'catalysts') {
          // this.processing_byRecipe[recipeId] += link.from.complexity
          this.complexity_byRecipe[recipeId] += link.from.complexity / 100
        } else {
          // this.cost_byRecipe[recipeId] += link.from.cost
          this.complexity_byRecipe[recipeId] += link.from.cost
        }
      },

      onLoop: options.onLoop,

      result: function() {
        if(!this.calculated) {
          // Intelectual chosing right recipe
          const recipes = this.recipes
            .filter(r =>
              // this.cost_byRecipe[r.id] > 0
              this.complexity_byRecipe[r.id] > 0
            )
          const recLen = recipes.length
          if(recLen > 0) {

            var recipe = null
            if(recLen === 1) {
              recipe = recipes[0]
            } else {
              recipes
                .sort((a,b) =>
                  // (this.cost_byRecipe[b.id] + this.processing_byRecipe[b.id] / 100) -
                  // (this.cost_byRecipe[a.id] + this.processing_byRecipe[a.id] / 100)
                  this.complexity_byRecipe[b.id] - this.complexity_byRecipe[a.id]
                )
              /* if(recLen==2) */ recipe = recipes[0]
              /* else          recipe = recipes[1] */
            }

            this.recipe = recipe
            this.inputsAmount  += recipe.inputs.length
            // this.outputsAmount += recipe.outputs.length
            this.recipeLinks = recipe.links.find(l=>l.outputStack.cuent===this)
            this.inputLinks = this.recipeLinks.inputs

            this.steps++
            this.processing += processingCostFromInputAmount(recipe.inputs.length)
            this.catalystsKeys = new UniqueKeys()
            this.recipesKeys = new UniqueKeys()
            this.recipesKeys.mergeKey(recipe.id, recipe)

            for (const link of this.recipeLinks.inputs) {
              link.from.outputsAmount++
              link.from.outsList = link.from.outsList ?? []
              link.from.outsList.push(new ConstituentStack(this, 1))
              this.cost += link.from.cost * link.weight // Calculate cost
              this.catalystsKeys.mergeChain(link.from.catalystsKeys, catal => {
                this.processing += catal.complexity??0
              })
              this.recipesKeys.mergeChain(link.from.recipesKeys, chainRecipe => {
                this.steps++
                this.processing += processingCostFromInputAmount(chainRecipe.inputs.length)
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

          onCalculated(this)
        }
      },

    })

    return this
  }

  // Recursively iterate through all items in list
  // usually "inputs" or "outputs"
  safeDive(listNameArg, callbacks, deph = 999999999, antiloop={}) {
    if (!callbacks.onSelf?.call(this) && deph>0 && this.recipes.length>0) {
      antiloop[this.id] = true

      // Links lists
      const listNamesArr = Array.isArray(listNameArg)
        ? listNameArg
        : [listNameArg]

      //TODO: Pick recipes for 'outputs' list name
      const recipesToIterate = this.recipe ? [this.recipe] : this.recipes
      for (const recipe of recipesToIterate) {
        const recipeLinksLists = recipe.links.find(l=>l.outputStack.cuent===this)

        for (const listName of listNamesArr) {
          const linksList = recipeLinksLists[listName]

          for (const link of linksList) {
            if (!antiloop[link.from.id]) {
              // Recursion 💫
              link.from.safeDive(
                listNameArg,
                callbacks,
                deph - 1,
                antiloop
              )
            } else {
              callbacks.onLoop?.call(this, listName, link)
            }
            callbacks.afterDive?.call(this, link, deph, recipe, listName)
          }
        }
      }

      delete antiloop[this.id]
    }

    return callbacks.result?.call(this)
  }

  recalculateField(field) {
    this[field] = undefined
    this.calculated = undefined
    this.calculate()
  }

  prettyString() {
    return `${this.id} [💱:${this.complexity}] [💲:${this.cost}] ` +
    `♻:${this.usability} [🖩:${this.calculated ? '☑' : '☐'}] [⚙:${this.steps}]`
  }
}

export class ConstituentStack {
  constructor(cuent, amount) {
    this.cuent = cuent
    this.amount = parseFloat(amount)
  }
}

class UniqueKeys {
  constructor() {
    this.ids = {}
    this.count = 0
  }

  mergeKey(key, val) {
    if(!key || !val) return
    if(this.ids[key] === undefined) {
      this.ids[key] = val
      this.count++
      return true
    } else {
      return false
    }
  }

  mergeChain(chain, onUnique) {
    if(!chain) return
    for (const [key, value] of Object.entries(chain.ids)) {
      if (this.mergeKey(key, value))
        onUnique?.(value)
    }
  }
}