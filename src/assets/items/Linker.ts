import type { Item } from './Item'
import type { Recipe } from './Recipe'
import { solve } from 'E:/dev/mc-gatherer/src/api'

export function linkItemsAndRecipes(items: Item[], recipes: Recipe[]): void {
  // Purge old values
  items.forEach((item) => {
    item.outputsAmount = 0
    item.popularity = 0
    item.usability = 0
  })

  items.forEach((item) => {
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
    if (item.mainRecipe === undefined)
      return

    item.inputsAmount = item.mainRecipe.inputs?.length ?? 0
  })

  recipes.forEach((rec) => {
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

  const creativeVending = items.find(it => it.id === 'storagedrawers:upgrade_creative:1')

  if (creativeVending) {
    const playthrough = solve<Item>(creativeVending)

    playthrough.getMerged().toArray().forEach(([item, amount]) => {
      item.usability += amount
    })
  }
}
