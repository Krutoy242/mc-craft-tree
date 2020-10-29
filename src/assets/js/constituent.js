var deepEqual = require('deep-equal')
var objToString = require('./objToString.js')
import { listUU } from './listUU.js'

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

function trueNbt(raw){
  return (raw.content.nbt && Object.keys(raw.content.nbt).length !== 0 && !raw.content.fNbt)
    ? raw.content.nbt
    : undefined
}

var maxPrints = 100
function printLimited() {
  if(--maxPrints <= 0) return
  console.log(...arguments)
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
      this.nbt   = trueNbt(raw)
      if(this.nbt) this.nbtStr = objToString(this.nbt)

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
        this.id          = rawOrId
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
          this.entrySource = groups.source
          this.entryName = 'ore:'+groups.source
        } else {
          this.type = 'itemStack'
          ;[this.entrySource, this.entryName] = oreAlias.item.split(':')
          this.entryMeta   = oreAlias.meta
        }
      }

      if(groups.tag) {
        try {
          this.nbt   = eval(`(${groups.tag})`)
          this.nbtStr= groups.tag
        } catch (error) {
          console.error('nbtEvaluationError :>> ', groups.tag, 'Error: ', error.message)
        }
      }
    }

    this.entryMeta = this.entryMeta||0
    this.definition    = `${this.entrySource}:${this.entryName}`
    this.name          = this.definition + (this.entryMeta ? ':'+this.entryMeta : '') // "minecraft:stone:2", "ore:stone"
    this.nameMandatory = this.definition + ':' + this.entryMeta
    this.volume        = (this.type == 'fluidStack') ? 1000.0 : 1.0
    this.popularity    = Constituent.popularity
    this.recipes       = []
    this.inputsAmount  = 0
    this.outputsAmount = 0

    const definitionIdNoMeta = this.definition+':0'
    if(isJEC) {
      this.id = this.nameMandatory + (this.nbt ? objToString(this.nbt) : '')
    } else if(!this.id) {
      this.id = this.nameMandatory
    }


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

  // Calculate only fields avaliable for itself
  selfCalculate(linkBack, isCatalyst) {
    
    // This node already have all values
    if (this.calculated) return true

    this.usability = this.usability || Constituent.usability
    this.processing = this.processing || Constituent.processing
    this.steps = 0

    // Special rule for crafting table
    // if (this.name === 'minecraft:crafting_table')
    //   this.processing += CRAFTING_TABLE_COST

    // Mark node a source if it isnt craftable
    if (this.recipes.length === 0) {
      /* 
        UNCRAFTABLE
        ❔❔❔ =❌> 📦
      */

      // lookup for hand-written value
      // Objects with NBT cant have values temporary
      if (!this.nbt) {
        const uuObj = listUU.find(x => x.name === this.name)
        if (uuObj) {
          this.cost = uuObj.uu
        }
      }

      // Uncraftable and no predefined UU cost
      if(!this.cost)
        if (this.popularity > 0)
          this.cost = CRAFTING_TABLE_COST
        else
          this.cost = Constituent.cost

    } else {
      /* 
        CRAFTABLE
        🔳🔳🔳 =✅> 📦
      */

      this.cost = 0.0

      // this.allStepsRecipes = this.allStepsRecipes || {}
      this.catalystsKeys = new UniqueKeys()
      this.recipesKeys = new UniqueKeys()
    }
  }

  // Calculate complexity and other values after all links are created
  calculate(options={}) {

    this.safeDive(['inputs', 'catalysts'], {

      onSelf: function(linkBack) {
        return this.selfCalculate(linkBack, options.isCatalyst)
      },

      onPickRecipe: function() {
        // TODO: Intelectual chosing right recipe index
        const recipe = this.recipes.sort((a,b)=>b.inputs.length - a.inputs.length)[0]
        if(!recipe) return

        const self = this
        this.recipe = recipe
        this.inputsAmount  += recipe.inputs.length
        this.outputsAmount += recipe.outputs.length
        this.recipeLinks = recipe.links.find(l=>l.outputStack.cuent === self)
        this.inputLinks = this.recipeLinks.inputs

        if (this.recipesKeys.mergeKey(recipe.id, recipe)) {
          this.steps++
          this.processing += processingCostFromInputAmount(recipe.inputs.length)
        }

        return recipe
      },

      afterDive: function(link, deph, diveResult, listName) {
        if(listName == 'catalysts') {
          link.from.popularity++
          if (this.catalystsKeys.mergeKey(link.from.id, link.from))
            this.processing += link.from.complexity
        } else {
          link.from.outputsAmount++
          this.cost += diveResult * link.weight // Calculate cost
          this.catalystsKeys.mergeChain(link.from.catalystsKeys, unique => 
            this.processing += unique.complexity
          )
          
          this.recipesKeys.mergeChain(link.from.recipesKeys, (recipe)=> {
            this.steps++
            this.processing += processingCostFromInputAmount(recipe.inputs.length)
          })

          // link.from.usability += (this.usability + 1.0) * link.weight
        }
      },

      onLoop: options.onLoop,

      result: function() {
        if(!this.calculated) {
          this.complexity = this.cost + this.processing
          this.calculated = true
          options.onCalculated?.call(this)
        }
        if(this.name === 'storagedrawers:upgrade_creative:1' ||
           this.name === 'avaritia:resource:6') console.log(':>> ', this)
        return this.cost
      },

    })

    return this
  }

  // Recursively iterate through all items in list
  // usually "inputs" or "outputs"
  safeDive(listNameArg, callbacks, deph = 999999999, antiloop={}, linkBack) {
    if (! callbacks.onSelf?.call(this, linkBack) ) {

      if (deph>0){
        antiloop[this.id] = true

        // Recipe
        const chosenRecipe = callbacks.onPickRecipe?.call(this) ?? this.recipes[0]
        const recipeLinksList = chosenRecipe?.links
          ?.find(l=>l.outputStack.cuent===this)
        
        // Links lists
        const listNamesArr = Array.isArray(listNameArg)
          ? listNameArg
          : [listNameArg]
        for (let l = 0; l < listNamesArr.length; l++) {
          const listName = listNamesArr[l]

          const linksList = recipeLinksList?.[listName]
          
          for (var i = 0; i < (linksList?.length ?? 0); i++) {
            const link = linksList[i]
            
            if (!antiloop[link.from.id]) {
              // Recursion 💫
              const diveResult = link.from.safeDive(
                listNameArg, 
                callbacks, 
                deph - 1, 
                antiloop,
                link
              )
              callbacks.afterDive?.call(this, link, deph, diveResult, listName)
            } else {
              callbacks.onLoop?.call(this, listNameArg, link)
            }
          }
        }

        antiloop[this.id] = undefined
      }
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
      // this.ids[key]++
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