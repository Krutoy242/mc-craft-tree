import { LinksHolder, Recipe } from '../recipes/recipes'
import { RecipeLink } from '../recipes/RecipeLink'
import { UniqueKeys } from '../utils'
import { Constituent } from './Constituent'
import * as _ from 'lodash'

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

  isLooped = false

  mainInputLinks(): RecipeLink[] {
    return this.mainHolder?.inputs ?? []
  }

  mainCatalistLinks(): RecipeLink[] {
    return this.mainHolder?.catalysts ?? []
  }

  pushIfUnique(recipe: Recipe, linksHolder: LinksHolder): boolean {
    if ([...this.list.keys()].some(r => Recipe.match(recipe, r)))
      return false

    this.list.set(recipe, linksHolder)
    for (const way of ['inputs', 'outputs', 'catalysts'] as const) {
      for (const cs of recipe[way]) {
        this.ways[way].add(cs.cuent)
        if (way === 'inputs' || way === 'catalysts')
          this.ways.requirments.add(cs.cuent)
      }
    }
    return true
  }

  pickMain(c:Constituent): boolean {
    let isHoldersChanged = false
    for(const lh of this.list.values()) {
      isHoldersChanged ||= lh.calculate()
    }

    const typles = [...this.list].filter(([, lh]) => lh.cost > 0)

    if (!typles.length) {
      if (this.list.size > 0) this.isLooped = true
      return false
    }

    const oldMainHolder = this.mainHolder
    ;[[this.main, this.mainHolder]] = typles.sort(([, a], [, b]) => a.complexity - b.complexity)

    const sameMain = oldMainHolder === this.mainHolder
    if(oldMainHolder && !sameMain) {
      // Undo previous computations
      for (const link of oldMainHolder.catalysts) {
        link.from.popularity--
        _.remove(link.from.popList, o=>o.cuent===c)
      }
      for (const link of oldMainHolder.inputs) {
        link.from.outputsAmount--
        _.remove(link.from.outsList, o=>o.cuent===c)
      }
    }

    //--------------------------------------
    // When only complexity of recipe is changed
    if(sameMain && !isHoldersChanged) return true
    
    c.cost = this.mainHolder.cost
    c.processing = this.mainHolder.processing
    
    //--------------------------------------
    // When main recipe is changed
    if(sameMain) return true

    this.catalystsKeys.reset()
    this.recipesKeys.reset()
    this.recipesKeys.mergeKey(this.main.id, this.main)

    for (const link of this.mainHolder.catalysts) {
      this.catalystsKeys.mergeKey(link.from.id, link.from)
      link.from.popularity++
      link.from.popList.push(c.stack())
    }

    for (const link of this.mainHolder.inputs) {
      this.catalystsKeys.mergeChain(link.from.recipes.catalystsKeys)
      this.recipesKeys  .mergeChain(link.from.recipes.recipesKeys)
      link.from.outputsAmount++
      link.from.outsList.push(c.stack(this.main.outputs.find(cs=>cs.cuent===c)!.amount))
    }

    c.steps        = this.recipesKeys.count
    c.inputsAmount = this.mainHolder.inputs.length

    return true
  }
}
