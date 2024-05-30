import { solve, toDefStacks } from 'mc-gatherer/api'
import type { Item } from './Item'
import type { Recipe } from './Recipe'

function indexesToSet<T>(indexes: number[], map: T[]): Set<T> {
  return new Set(
    indexes
      .map(index => map[index])
      .filter((i): i is T => !!i),
  )
}

export function pickItems(target: { item?: Item, isTo?: boolean }, items: Item[], recipes: Recipe[]): Item[] {
  // Purge old values on ALL items
  items.forEach((item) => {
    item.clear()

    if (item.depIndexes.length)
      item.dependencies = indexesToSet(item.depIndexes, recipes)

    // Convert indexes into recipes
    if (!item.recipeIndexes.length)
      return

    item.recipes = new Map([...indexesToSet(item.recipeIndexes, recipes)].map(r => [r, 1]))

    const mainRecipeIndex = item.recipeIndexes[0]
    if (mainRecipeIndex === undefined)
      return

    const mainRecipe = recipes[mainRecipeIndex]
    if (!mainRecipe)
      throw new Error(`Recipe index ${mainRecipeIndex} cant be found. Seems like recipe list not malfunctioned.`)

    const stack = mainRecipe.outputs.find(s => (s.it.matchedBy() as Item[]).includes(item))
    if (!stack)
      throw new Error(`Recipe for item ${item.id} exists, but without item itself in outputs. Source: ${mainRecipe.source}`)

    item.setMainRecipe(mainRecipe, stack.amount)
  })

  const solvedArray = target.item
    ? solve(target.item, !target.isTo).getMerged().toArray()
    : items.map(i => [i, 0] as const)

  const pickedPile = solvedArray
    .map(([item, amount]) => {
      item.usability = amount
      item.inputsAmount = item.mainRecipe?.inputs?.length ?? 0

      // Add links
      // const list = target.isTo ? item.mainRecipe?.inputsDef : item.mainRecipe?.outputsDef
      const list = item.mainRecipe?.inputsDef ?? toDefStacks(item.mainRecipe?.inputs)
      list?.forEach((stack) => {
        const link = {
          weight: stack.amount ?? 1,
          source: target.isTo ? stack.it : item,
          target: target.isTo ? item : stack.it,
        }
        link.target.mainInputs.add(link)
        link.source.mainOutputs.add(link)
      })

      return item
    })

  // Find all main recipes
  const pickedRecipes = new Set<Recipe>(
    pickedPile.map(i => i.mainRecipe)
      .filter((i): i is Recipe => !!i),
  )

  pickedRecipes.forEach((rec) => {
    rec.inputs?.forEach((stack) => {
      stack.it.matchedBy().forEach((item) => {
        item.usedInRecipes.add(rec)
        item.outputsAmount++
      })
    })

    rec.catalysts?.forEach((stack) => {
      stack.it.matchedBy().forEach((item) => {
        item.popList.add(rec)
      })
    })
  })

  return pickedPile
}
