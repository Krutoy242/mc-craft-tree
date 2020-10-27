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

const craftingTableCatal = [new ConstituentStack(pushConstituent({
  type: 'itemStack', content: {item: 'minecraft:crafting_table'}
}), 1)]

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

export function mergeDefaultAdditionals(additionals) {
  const keys = Object.keys(additionals)
  for (let i = 0; i < keys.length; i++) {
    const idKey = keys[i]
    const ads = additionals[idKey]
    if(ads.recipes) {
      for (let j = 0; j < ads.recipes.length; j++) {
        const adsRecipe = ads.recipes[j]

        const outCuent = pushConstituent(rawOut)
        const outStack = new ConstituentStack(outCuent, rawOut.amount)

        const inputs = []
        for (const [index, count] of Object.entries(adsRecipe.ins)) {
          const inAds = additionals[keys[index]]
          inputs.push(
            new ConstituentStack(pushConstituent({
              type: 'itemStack',
              content: inAds.raw
            }), count)
          )
        }

        const recipe = new Recipe([outStack], inputs, craftingTableCatal)
        allRecipes[recipe.id] = recipe
      }
    }
  }
}
