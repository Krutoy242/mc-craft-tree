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

    const mainRecipe = recipes[mainRecipeIndex] as Recipe
    const mainAmount = mainRecipe?.outputs.find(s => s.it.matchedBy().includes(item))?.amount
    item.setMainRecipe(mainRecipe, mainAmount)
  })

  const pickedPile = solve(targetItem).getMerged().toArray()
    .map(([item, amount]) => {
      item.usability = amount
      item.inputsAmount = item.mainRecipe?.inputs?.length ?? 0

      // Add input links
      item.mainRecipe?.inputsDef?.forEach(stack => item.mainInputs.add({
        weight: stack.amount ?? 1,
        source: stack.it,
        target: item,
      }))

      return item
    })

  // Find all main recipes
  const pickedRecipes = new Set<Recipe>(
    pickedPile.map(i => i.mainRecipe)
      .filter((i): i is Recipe => !!i),
  )

  pickedRecipes.forEach((rec) => {
    // Add output links
    rec.outputs.forEach((out) => {
      rec.inputsDef?.forEach(({ it: itemIn }) => {
        out.it.matchedBy().forEach((itemOut) => {
          itemIn.mainOutputs.add({
            weight: out.amount ?? 1,
            source: itemIn,
            target: itemOut,
          })
        })
      })
    })

    rec.inputs?.forEach((stack) => {
      stack.it.matchedBy().forEach((item) => {
        item.outputsAmount++
      })
    })

    rec.catalysts?.forEach((stack) => {
      stack.it.matchedBy().forEach((item) => {
        item.popularity++
      })
    })
  })

  return pickedPile
}
