import type { Item } from './Item'
import type { Recipe } from './Recipe'
import { solve, toDefStacks } from 'mc-gatherer/api/Solver'

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

    item.recipes = [...indexesToSet(item.recipeIndexes, recipes)].map((r) => {
      const stack = r.outputs.find(s => (s.it.matchedBy() as Item[]).includes(item))
      return [r, stack?.amount]
    })
  })

  const solvedArray = target.item
    ? solve(target.item, !target.isTo).getMerged().toArray()
    : items.map(i => [i, 0] as const)

  // All main recipes
  const pickedRecipes = new Set<Recipe>()

  const pickedPile = solvedArray
    .map(([item, amount]) => {
      item.usability = amount
      const recipe = item.bestRecipe(amount)?.[0]
      if (recipe) {
        item.inputsAmount = recipe.inputs?.length ?? 0

        // Add links
        const inputDefs = toDefStacks(amount, recipe.inputs)
        inputDefs?.forEach((stack) => {
          const link = {
            weight: stack.amount ?? 1,
            source: target.isTo ? stack.it : item,
            target: target.isTo ? item : stack.it,
          }
          link.target.mainInputs.add(link)
          link.source.mainOutputs.add(link)
        })

        pickedRecipes.add(recipe)
      }

      return item
    })

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
