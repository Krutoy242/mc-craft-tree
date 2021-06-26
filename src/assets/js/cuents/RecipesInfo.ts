import { Recipe, Ways } from '../recipes/recipes'
import { LinksHolder } from '../recipes/LinksHolder'
import { Constituent } from './Constituent'
import * as _ from 'lodash'


function SORT_PURITY_FIRST(a:LinksHolder, b:LinksHolder) {
  return b.purity - a.purity || a.complexity - b.complexity
}

const epsilon = 0.000000000001
function SORT_COMPLEXY_AND_PURITY(a:LinksHolder, b:LinksHolder) {
  return  a.complexity / ((a.purity ** 1) * (1-epsilon) + epsilon)
        - b.complexity / ((b.purity ** 1) * (1-epsilon) + epsilon)
}

export class RecipesInfo {
  isLooped = false
  main?: Recipe
  mainHolder?: LinksHolder
  list = new Map<Recipe, LinksHolder>()
  private ways: {[key in Ways]: Set<Constituent>} = {
    requirments: new Set<Constituent>(),
    inputs: new Set<Constituent>(),
    outputs: new Set<Constituent>(),
    catalysts: new Set<Constituent>(),
  }

  getCuentsForWay(way:Ways, block:Set<Constituent>, onlyMain = false) {
    return (onlyMain ? (this.main?.requirments.map(cs=>cs.cuent) ?? []) : [...this.ways[way]])
      .filter(o=>!block.has(o))
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

  // static maxLog = 100
  // static log(a:LinksHolder, b:LinksHolder) {
  //   RecipesInfo.maxLog--
  //   if(RecipesInfo.maxLog<0) return
  //   console.log(...((_a,_b)=>[_a[0]+'\n'+_b[0], ..._a.slice(1), ..._b.slice(1)])(a.console(),b.console()))
  // }

  pickMain(c:Constituent): boolean {
    if(!this.list.size) return false // Has no recipes

    this.list.forEach(lh=>lh.calculate())

    const typles = [...this.list].filter(([, lh]) => lh.complexity > 0)

    if (!typles.length) {
      if (this.list.size > 0) this.isLooped = true
      return false
    }

    typles.sort(([, a], [, b]) =>
      SORT_COMPLEXY_AND_PURITY(a,b)
    )

    ;[[this.main, this.mainHolder]] = typles

    c.cost       = this.mainHolder.cost
    c.processing = this.mainHolder.processing
    c.complexity = this.mainHolder.complexity
    c.purity     = this.mainHolder.purity
    
    // if(c.id.startsWith('tcomplement:scorched_casting')) {
    //   RecipesInfo.maxLog--
    //   if(RecipesInfo.maxLog>=0) {
    //     console.group(c.display)
    //     typles.forEach(([,t])=>console.log(...t.console()))
    //     console.groupEnd()
    //   }
    // }

    return true
  }
}
