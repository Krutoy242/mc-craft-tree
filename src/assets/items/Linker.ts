import { solve } from 'mc-gatherer/build/main/api'
import type { Item } from './Item'
import type { Recipe } from './Recipe'

export function pickItems(targetItem: Item, items: Item[], recipes: Recipe[]): Item[] {
  // Purge old values on ALL items
  items.forEach((item) => {
    item.clear()

    // Convert indexes into recipes
    if (!item.recipeIndexes.length) return

    item.recipes = new Set(
      item.recipeIndexes
        .map(index => recipes[index])
        .filter((i): i is Recipe => !!i),
    )

    const mainRecipeIndex = item.recipeIndexes[0]
    if (mainRecipeIndex === undefined) return

    const mainRecipe = recipes[mainRecipeIndex]
    if (!mainRecipe) throw new Error(`Recipe index ${mainRecipeIndex} cant be found. Seems like recipe list not malfunctioned.`)

    const stack = mainRecipe.outputs.find(s => s.it.matchedBy().includes(item))
    if (!stack) throw new Error(`Recipe for item ${item.id} exists, but without item itself in outputs. Source: ${mainRecipe.source}`)

    item.setMainRecipe(mainRecipe, stack.amount)
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
        item.usedInRecipes.add(rec)
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
