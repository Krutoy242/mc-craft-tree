import {Recipe} from './recipe.js'
import { ConstituentStack } from './constituent.js'
import { pushConstituent } from './constituents.js'


function amount(raw) {
  const percent = (raw.content.percent || 100.0) / 100.0
  var mult = 1.0
  const name = raw.content.name
  if (raw.type == 'placeholder' && name == 'Ticks') mult = 0.01
  if (raw.type == 'placeholder' && name == 'Mana') mult = 0.01
  if (raw.type == 'placeholder' && name == 'RF') mult = 0.001
  if (
    raw.type == 'fluidStack' ||
    raw.content.item == 'thermalfoundation:fluid_redstone' ||
    raw.content.item == 'plustic:plustic.molten_osmium'
  )
    mult = 0.001

  return (raw.content.amount || 1.0) * mult * percent
}

export const allRecipes = {}

export function mergeJECGroups(jec_groups) {
  // ====================================================
  // Create nodes
  // ====================================================
  jec_groups.Default.forEach(jec_recipe => {
    var recipeArrs = ['output','input','catalyst']
    const recipe = new Recipe(
      ...recipeArrs.map(arrName =>
        jec_recipe[arrName].map(
          raw => new ConstituentStack(pushConstituent(raw), amount(raw))
        )
      )
    )
    allRecipes[recipe.id] = recipe
  })
}

var maxPrints = 100; function printLimited() {if(--maxPrints <= 0) return console.log(...arguments)}

export function mergeDefaultAdditionals(additionals) {

  const craftingTableCatal = [new ConstituentStack(pushConstituent('minecraft:crafting_table'), 1)]

  const keys = Object.keys(additionals)
  function keysToArr(collection) {
    return Object.entries(collection).map(
      kv => new ConstituentStack(pushConstituent(keys[kv[0]]), kv[1])
    )
  }
  for (let i = 0; i < keys.length; i++) {
    const keyOut = keys[i]
    const ads = additionals[keyOut]
    
    if(ads.recipes) {
      const outCuent = pushConstituent(keyOut)

      for (let j = 0; j < ads.recipes.length; j++) {
        const adsRecipe = ads.recipes[j]

        const outStack = new ConstituentStack(outCuent, adsRecipe.out || 1)

        const inputs = keysToArr(adsRecipe.ins)
        const catals = adsRecipe.ctl ? keysToArr(adsRecipe.ctl) : undefined

        const recipe = new Recipe([outStack], inputs, catals || craftingTableCatal)
        allRecipes[recipe.id] = recipe
      }
    }
  }
}
