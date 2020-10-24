import {Recipe} from './recipe.js'
import { ConstituentStack } from './constituent.js'
import constituents from './constituents.js'


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
          raw => new ConstituentStack(constituents.pushJECRaw(raw), amount(raw))
        )
      )
    )
    allRecipes[recipe.recipeId] = recipe
  })
}
