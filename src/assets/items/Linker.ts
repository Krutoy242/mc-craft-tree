import type { Item } from './Item'
import type { Recipe } from './Recipe'

export function linkItemsAndRecipes(items: Item[], recipes: Recipe[]): void {
  // Purge old values
  items.forEach((item) => {
    item.outputsAmount = 0
  })

  items.forEach((item) => {
    if (!item.recipeIndexes.length)
      return

    const mainRecipeIndex = item.recipeIndexes[0]
    if (mainRecipeIndex === undefined)
      return

    const mainRecipe = recipes[mainRecipeIndex]
    if (mainRecipe === undefined)
      return

    item.inputsAmount = mainRecipe.inputs?.length ?? 0
  })
}
