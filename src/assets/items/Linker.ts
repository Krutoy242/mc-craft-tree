import type { Item } from './Item'
import type { Recipe } from './Recipe'
import { solve } from 'E:/dev/mc-gatherer/src/api'

export function pickItems(items: Item[], recipes: Recipe[]): Item[] {
  const targetItem = items.find(it => it.id === 'storagedrawers:upgrade_creative:1')

  if (!targetItem)
    throw new Error('Cannot find target item')

  // Purge old values on ALL items
  items.forEach((item) => {
    item.outputsAmount = 0
    item.popularity = 0
    item.usability = 0

    // Convert indexes into recipes
    if (!item.recipeIndexes.length)
      return

    item.recipes = new Set(
      item.recipeIndexes
        .map(index => recipes[index])
        .filter((i): i is Recipe => !!i),
    )

    const mainRecipeIndex = item.recipeIndexes[0]
    if (mainRecipeIndex === undefined)
      return

    item.mainRecipe = recipes[mainRecipeIndex]
  })

  const pickedPile = solve(targetItem).getMerged().toArray()

  // Add usability only for picked
  pickedPile.forEach(([item, amount]) => {
    item.usability = amount
  })

  const pickedRecipes = new Set<Recipe>()
  pickedPile.forEach(([item]) => {
    if (item.mainRecipe === undefined)
      return
    pickedRecipes.add(item.mainRecipe)

    item.inputsAmount = item.mainRecipe.inputs?.length ?? 0
  })

  pickedRecipes.forEach((rec) => {
    rec.inputs?.forEach((stack) => {
      stack.it.items.forEach((item) => {
        item.outputsAmount++
      })
    })

    rec.catalysts?.forEach((stack) => {
      stack.it.items.forEach((item) => {
        item.popularity++
      })
    })
  })

  return pickedPile.map(([i]) => i)
}
