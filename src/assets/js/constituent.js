import { listUU } from './listUU.js'

const CRAFTING_TABLE_COST = 50.0


Array.prototype.remove = function() {
  var what, a = arguments, L = a.length, ax
  while (L && this.length) {
    what = a[--L]
    while ((ax = this.indexOf(what)) !== -1) {
      this.splice(ax, 1)
    }
  }
  return this
}

function itemStackToString(item, meta = 0) {
  return item ? `${item.replace(':', '__')}__${meta}` : undefined
}

function getMeta(raw) {
  if (raw.content.fMeta === 1)
    return undefined
  else
    return raw.content.meta
}

function definition(raw) {
  if (raw.content.item)
    return itemStackToString(raw.content.item, getMeta(raw))
  else
    return undefined
}

function trueNbt(raw){
  if (raw.content.nbt && Object.keys(raw.content.nbt).length !== 0 && !raw.content.fNbt)
    return raw.content.nbt
  else
    return undefined
}

export class Constituent {

  static serializeIEntry(raw) {
    switch (raw.type) {
    case 'itemStack':
      var nbtStr = ''
      var tNbt = trueNbt(raw)
      if (tNbt)
        nbtStr = '__' + JSON.stringify(tNbt).replace(/"([^:]+)":([^{},]+)/g, '$1__$2.?')
      return definition(raw) + nbtStr
    case 'fluidStack':
      return `fluid__${raw.content.fluid}`
    case 'placeholder':
      return `placeholder__${raw.content.name}`
    case 'oreDict':
      return `ore__${raw.content.name}`
    case 'empty':
      return
    default:
      console.log('Unable to find item type', raw.type)
    }
  }


  // Find item field entry in parsed data
  descent(field) {
    // Regular icon
    var o = Constituent.additionals[this.idPure]

    // Icon without nbt
    if (!o || !o[field]) o = Constituent.additionals[this.definitionId]

    // And without meta
    if (!o || !o[field]) o = Constituent.additionals[this.definitionIdNoMeta]

    return o ? o[field] : undefined
  }

  // Default values for nodes
  static cost           = 1.0;
  static complexity     = 1.0;
  static usability      = 0.0;
  static popularity     = 0.0;
  static processing     = 0.0;

  static additionals;

  constructor(raw) {

    this.display = undefined
    this.name = undefined
    this.complexity = undefined
    this.cost = undefined
    this.processing = undefined
    this.usability = undefined
    this.popularity = undefined
    this.type = undefined


    // Identificator without NBT (serialized)
    // "actuallyadditions__battery_bauble__1"
    this.definitionId   = definition(raw)

    // Identificator without NBT and meta = 0 (serialized)
    // "actuallyadditions__battery_bauble__0"
    this.definitionIdNoMeta = itemStackToString(raw.content.item, 0)

    // Reference of JEC groups.js
    this.raw            = raw
    this.type           = raw.type

    switch (this.type) {
    case 'itemStack':
      var parts = raw.content.item.split(':')

      // Mod or type
      // "minecraft", "fluid"
      this.entrySource = parts[0]

      // Name of entry
      // "cobblestone", "water"
      this.entryName = parts[1]

      // Meta. Only for itemStacks
      this.entryMeta = getMeta(raw)
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


    this.definition = `${this.entrySource}:${this.entryName}`

    // Item full name
    // "minecraft:stone:2", "ore:stone"
    this.name           = this.definition +
      (this.entryMeta ?  ':' + this.entryMeta : '')

    this.nbt = trueNbt(raw)
    this.nbtStr = this.nbt ? (JSON.stringify(raw.content.nbt)) : undefined

    // Identificator (serialized)
    // "actuallyadditions__battery_bauble__1__{Energy__0.?}"
    this.id             = Constituent.serializeIEntry(raw)

    // Identificator (serialized, pretty)
    // "actuallyadditions__battery_bauble__1__{Energy__0}"
    this.idPure         = this.id.replace('.?', '')


    this.volume         = (this.type == 'fluidStack') ? 1000.0 : 1.0
    this.popularity     = Constituent.popularity

    // this.outputs        = []
    // this.inputs         = []
    // this.catalysts      = []
    this.recipes        = []
    this.uses = 0.0


    // Display localized name
    // "Andesite"
    this.display = this.descent('display') || `[${this.name}]`


    // View Box on texture sheet
    // "672 1344 32 32"
    var viewBox = this.descent('viewBox')

    if (!viewBox) {
      if (this.type === 'placeholder') {
        viewBox = Constituent.additionals['fluid__betterquesting.placeholder']?.viewBox || '672 1344'
      } else if (this.name === 'forge:bucketfilled') {
        viewBox = Constituent.additionals['minecraft__bucket__0']?.viewBox || '4000 2816'
      } else {
        viewBox = Constituent.additionals['openblocks__dev_null__0']?.viewBox || '576 3136'
        this.isNoIcon = true
      }
    }

    this.viewBox = viewBox + ' 32 32'
  }

  match(o) {

    if(this.definition != o.definition) return false

    if(!(this.raw.content.fMeta || o.raw.content.fMeta) && this.entryMeta != o.entryMeta) return false

    if(!(this.raw.content.fNbt || o.raw.content.fNbt) && this.nbtStr != o.nbtStr) return false

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
    
    this.usability = this.usability || Constituent.usability
    if(linkBack && !isCatalyst) {
      this.usability += (linkBack.to.usability + 1.0) * linkBack.weight
      this.uses++
    }

    // This node already have all values
    if (this.calculated) return true

    this.processing = this.processing || Constituent.processing
    this.steps = 0

    // Special rule for crafting table
    if (this.name === 'minecraft:crafting_table')
      this.processing += CRAFTING_TABLE_COST

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
      this.craftingChain = new CraftingChain()
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
        // if(this.recipes.length > 1) console.log(`recipes for: ${this.display}`, this.recipes)
        const recipe = this.recipes[0]
        if(!recipe) return

        const self = this
        this.recipe = recipe
        this.inputsAmount  = recipe.inputs.length
        this.outputsAmount = recipe.outputs.length
        const links = recipe.links.find(l=>l.outputStack.cuent === self)
        this.inputLinks = links.inputs

        // if(this.allStepsRecipes[recipe.id] === undefined)
        //   this.allStepsRecipes[recipe.id] = 0
        // this.allStepsRecipes[recipe.id]++

        // for (let i = 0; i < recipe.catalysts.length; i++) {
        // const catal = recipe.catalysts[i]
        // catal.cuent.calculate({...options, isCatalyst: true})
        // }
        return recipe
      },

      afterDive: function(link, deph, diveResult, listName) {
        if(listName == 'catalysts') {
          link.from.popularity++
        } else {
          this.cost += diveResult * link.weight // Calculate cost
          // Object.assign(this.allStepsRecipes, link.from.allStepsRecipes)
        }

        // Add recipe in chain to compute processing cost
        if(link.from.recipe)
          this.processing += this.craftingChain.mergeRecipe(link.from.recipe)

      },

      onLoop: options.onLoop,

      result: function() {
        if(!this.calculated) {
          // this.steps = this.allStepsRecipes ? Object.keys(this.allStepsRecipes).length : 0
          this.craftingChain?.mergeRecipe(this.recipe)
          this.steps = this.craftingChain?.recipeIds.count ?? this.steps
          this.complexity = this.cost + this.processing
          this.calculated = true
          options.onCalculated?.call(this)
        }
        // console.log(this.prettyString())
        // console.log(this)
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

        const chosenRecipe = callbacks.onPickRecipe?.call(this) ?? this.recipes[0]
        
        const recipeLinksList = chosenRecipe?.links
          ?.find(l=>l.outputStack.cuent===this)
        
        const listNamesArr = Array.isArray(listNameArg)
          ? listNameArg
          : [listNameArg]
        
        for (let l = 0; l < listNamesArr.length; l++) {
          const listName = listNamesArr[l]
          const linksList = recipeLinksList?.[listName]

          
          for (var i = 0; i < (linksList?.length ?? 0); i++) {
            const link = linksList[i]
            
            if (!antiloop[link.from.id]) {
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


  /* forEachCatalyst(fnc, antiloop={}){
    for (var i = 0; i < this.catalysts.length; i++) {
      fnc(this.catalysts[i])
    }
    antiloop[this.id] = true
    for (i = 0; i < this.inputs.length; i++) {
      if (!antiloop[this.inputs[i].it.id]) {
        this.inputs[i].it.forEachCatalyst(fnc, antiloop)
      }
    }
    antiloop[this.id] = undefined
  } */

  recalculateField(field) {
    this[field] = undefined
    this.calculated = undefined
    this.calculate()
  }

  prettyString() {
    return `${this.id} [💱:${this.complexity}] [💲:${this.cost}] ` +
    `[♻:${this.usability}/${this.uses}] [🖩:${this.calculated ? '☑' : '☐'}] [⚙:${this.steps}]`
  }
}

export class ConstituentStack {
  constructor(cuent, amount) {
    this.cuent = cuent
    this.amount = amount
  }
}

class UniqueKeys {
  constructor() {
    this.ids = {}
    this.count = 0
  }

  mergeWith(id){      
    if(this.ids[id] === undefined) {
      this.ids[id] = 1
      this.count++
      return true
    } else {
      this.ids[id]++
      return false
    }
  }
}

export class CraftingChain {
  constructor() {
    this.catalIds = new UniqueKeys()
    this.recipeIds = new UniqueKeys()
  }

  mergeRecipe(recipe) {
    this.recipeIds.mergeWith(recipe.id)

    var addComplexity = 0
    for (let i = 0; i < recipe.catalysts.length; i++) {
      const catalStack = recipe.catalysts[i]

      if(this.catalIds.mergeWith(catalStack.cuent.id)) {
        addComplexity += catalStack.cuent.getComplexity(catalStack.amount)
      }

    }
    return addComplexity
  }
}