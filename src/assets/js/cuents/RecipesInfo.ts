import { LinksHolder, Recipe } from '../recipes/recipes'
import { RecipeLink } from '../recipes/RecipeLink'
import { UniqueKeys } from '../utils'
import { Constituent } from './Constituent'

export class RecipesInfo {
  main?: Recipe
  mainHolder?: LinksHolder
  private catalystsKeys = new UniqueKeys<string, Constituent>()
  private recipesKeys = new UniqueKeys<string, Recipe>()
  list = new Map<Recipe, LinksHolder>()
  ways = {
    requirments: new Set<Constituent>(),
    inputs: new Set<Constituent>(),
    outputs: new Set<Constituent>(),
    catalysts: new Set<Constituent>(),
  }

  // iterable: Recipe[] = []
  // iterableLinks: LinksHolder[] = []
  isLooped = false

  mainInputLinks(): RecipeLink[] {
    return this.mainHolder?.inputs ?? []
  }

  mainCatalistLinks(): RecipeLink[] {
    return this.mainHolder?.catalysts ?? []
  }

  catalystsChain() { return this.catalystsKeys.values() }
  recipesChain() { return this.recipesKeys.values() }

  pickMain(): boolean {
    const typles = [...this.list].filter(([, lh]) => lh.complexity > 0)
    if (typles.length) {
      [[this.main, this.mainHolder]] = typles.sort(([, a], [, b]) => a.complexity - b.complexity
      )
      //************************
      this.recipesKeys.mergeKey(this.main.id, this.main)

      for (const link of this.mainHolder.catalysts) {
        this.catalystsKeys.mergeKey(link.from.id, link.from)
      }

      for (const link of this.mainHolder.inputs) {
        this.catalystsKeys.mergeChain(link.from.recipes.catalystsKeys)
        this.recipesKeys.mergeChain(link.from.recipes.recipesKeys)
      }
      //************************
      return true
    }
    if (this.list.size > 0)
      this.isLooped = true
    return false
  }

  pushIfUnique(recipe: Recipe, linksHolder: LinksHolder): boolean {
    if ([...this.list.keys()].some(r => Recipe.match(recipe, r)))
      return false

    // this.iterable.push(recipe)
    // this.iterableLinks.push(linksHolder)
    this.list.set(recipe, linksHolder)
    for (const way of ['inputs', 'outputs', 'catalysts']) {
      //@ts-ignore
      for (const cs of recipe[way]) {
        //@ts-ignore
        this.ways[way].add(cs.cuent)
        if (way === 'inputs' || way === 'catalysts')
          this.ways.requirments.add(cs.cuent)
      }
    }
    return true
  }

  iterable(): [Recipe, LinksHolder, boolean][] {
    if (this.isLooped)
      return []
    if (this.main && this.mainHolder)
      return [[this.main, this.mainHolder, true]]
    return [...this.list.entries()].map(([r, lh], i) => [r, lh, i === this.list.size - 1])
  }
}
