import { ConstituentStack } from './constituent.js'
import { pushConstituent } from './constituents.js'
import { NumLimits } from './utils.js'


function amount(raw) {
  const percent = (raw.content.percent ?? 100.0) / 100.0
  let mult = 1.0
  const name = raw.content.name
  if (raw.type == 'placeholder' && name == 'Ticks') mult = 0.01
  if (raw.type == 'placeholder' && name == 'Mana') mult = 0.01
  if (raw.type == 'placeholder' && name == 'RF') mult = 0.001
  if (
    raw.type === 'fluidStack' ||
    raw.content.item === 'thermalfoundation:fluid_redstone' ||
    raw.content.item === 'plustic:plustic.molten_osmium'
  )
    mult = 0.001

  return (raw.content.amount ?? 1.0) * mult * percent
}

export const recipesStore = {
  map: {},
  count: 0,
  info: {
    outputsAmount: new NumLimits(),
    inputsAmount: new NumLimits(),
    catalystsAmount: new NumLimits()
  }
}

function appendRecipe(recipe) {
  recipesStore.map[recipe.id] = recipe
  recipesStore.count++
  recipesStore.info.outputsAmount.update(recipe.outputs.length)
  recipesStore.info.inputsAmount.update(recipe.inputs.length)
  recipesStore.info.catalystsAmount.update(recipe.catalysts.length)
}

export function mergeJECGroups(jec_groups) {
  // ====================================================
  // Create nodes
  // ====================================================
  jec_groups.Default.forEach(jec_recipe => {
    let recipeArrs = ['output','input','catalyst']
    const recipe = new Recipe(
      ...recipeArrs.map(arrName =>
        jec_recipe[arrName].map(
          raw => new ConstituentStack(pushConstituent(raw), amount(raw))
        )
      )
    )
    appendRecipe(recipe)
  })
}

export function mergeDefaultAdditionals(additionals) {

  // const craftingTableCatal = [new ConstituentStack(pushConstituent('minecraft:crafting_table'), 1)]

  const ids_arr = Object.keys(additionals)
  function keysToArr(collection) {
    return Object.entries(collection).map(
      kv => new ConstituentStack(pushConstituent(ids_arr[kv[0]]), kv[1])
    )
  }
  for (let i = 0; i < ids_arr.length; i++) {
    const keyOut = ids_arr[i]
    const ads = additionals[keyOut]
    
    if(ads.recipes) {
      const mainCuent = pushConstituent(keyOut)

      for (let j = 0; j < ads.recipes.length; j++) {
        const adsRecipe = ads.recipes[j]

        let outputStacks = (adsRecipe.out && typeof adsRecipe.out === 'object')
          ? keysToArr(adsRecipe.out)
          : [new ConstituentStack(mainCuent, adsRecipe.out || 1)]

        const inputStacks = keysToArr(adsRecipe.ins)
        const catalStacks = adsRecipe.ctl ? keysToArr(adsRecipe.ctl) : []

        const recipe = new Recipe(outputStacks, inputStacks, catalStacks)
        appendRecipe(recipe)
      }
    }
  }
}


let recipesCount = 0

function nextId() {
  recipesCount++
  return String(recipesCount)
}

export class Recipe {
  requirments;

  constructor(outputs, inputs, catalysts) {
    Object.assign(this, {outputs, inputs, catalysts})
    this.requirments = [...inputs, ...catalysts]

    this.id = nextId()

    this.links = outputs.reduce((acc, outputStack) => {
      outputStack.cuent.addRecipe(this)

      const inputLinks = inputs.map(inputStack =>
        new RecipeLink(
          inputStack.cuent, 
          outputStack.cuent, 
          inputStack.amount / outputStack.amount, 
          this.id
        )
      )

      return acc.set(outputStack.cuent, {
        outputStack,
        outputs: inputLinks.map(inp => inp.flip()),
        inputs: inputLinks,
        catalysts: catalysts.map(catalStack =>
          new RecipeLink(
            catalStack.cuent, 
            outputStack.cuent, 
            catalStack.amount, 
            this.id
          )
        )
      })
    }, new Map())
  }

  match(recipe) {
    if(this === recipe) return true

    for (const name of ['outputs', 'inputs', 'catalysts']) {
      const arr1 = this[name]
      const arr2 = recipe[name]
      if(arr1.length != arr2.length) return false
      
      const arr1_s = arr1.slice().sort(ConstituentStack.sort)
      const arr2_s = arr2.slice().sort(ConstituentStack.sort)

      if(!arr1_s.every((a,i) => a.match(arr2_s[i]))) {
        return false
      }
    }
    return true
  }

  hasRequirment(cuent) {
    return this.inputs.some(cs=>cs.cuent === cuent) || this.catalysts.some(cs=>cs.cuent === cuent)
  }

  hasOutput(cuent) {
    return this.outputs.some(cs=>cs.cuent === cuent)
  }

  haveAlternatives() {
    return this.outputs.every(o=>!o.noAlternatives)
  }

  display() {
    return `[${this.inputs[0].cuent.display}]` 
    + (this.catalysts[0] && `->[${this.catalysts[0].cuent.display}]`)
    + `->[${this.outputs[0].cuent.display}]`
  }
}

export class RecipeLink {
  constructor(from, to, weight, id) {
    Object.assign(this, {from, to, weight, id})
  }

  flip(){
    const newLink = new RecipeLink(this.to,this. from, 1/this.weight, this.id)
    newLink.flipped = this
    this.flipped = newLink
    return newLink
  }
}