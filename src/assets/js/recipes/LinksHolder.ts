import numeral from 'numeral'

import Constituent from '../cuents/Constituent'
import ConstituentStack from '../cuents/ConstituentStack'
import { cutNum, limitedLog, UniqueKeys } from '../utils'

import Recipe from './Recipe'
import RecipeLink from './RecipeLink'

function floatCut(n: number) {
  return Math.round((n + Number.EPSILON) * 100000) / 100000
}

const CRAFTING_TABLE_COST = 50.0
export function processingCostFromInputAmount(x = 1) {
  const k = x - 1
  return Math.floor(
    Math.max(
      0,
      Math.pow(1.055, k + 100) -
        Math.pow(1.055, 101) +
        k * 25 +
        CRAFTING_TABLE_COST / 2
    )
  )
}

const IS_DEBUG = false
/**
 * List of all links between 1 output and all requirments in single recipe
 * One item can have many recipes and many LinksHolders
 **/
export default class LinksHolder {
  cost = 0.0
  processing = 0.0
  complexity = 0.0
  purity = 0.0
  steps = 0

  // private recipesKeys = new Set<Recipe>()
  private catalystsKeys = new Set<Constituent>()

  constructor(
    public output: ConstituentStack,
    public inputs: RecipeLink[],
    public catalysts: RecipeLink[],
    private recipe: Recipe
  ) {}

  // asString() { return `output:${this.output.cuent.asString()} (complexity:${this.complexity}, purity:${this.purity}, steps:${this.steps})`}
  asString() {
    return `${this.recipe.display()} (complexity:${cutNum(
      this.complexity
    )}, purity:${cutNum(this.purity)}, steps:${cutNum(this.steps)})`
  }
  console(): string[] {
    const cls = this.recipe.console()
    return [
      cls[0] +
        `%c(${cutNum(this.complexity)},${numeral(this.purity).format(
          '0.00'
        )},${cutNum(this.steps)})`,
      ...cls.slice(1),
      'background: #132; color: #444',
    ]
  }

  calculate() {
    const oldComplexity = this.complexity
    this.cost = 0.0
    this.processing = 0.0
    this.steps = 1
    let newPurity = 0.0
    this.catalystsKeys.clear()

    // IS_DEBUG = this.output.cuent.display === 'Desert Myrmex Resin Chunk'
    if (IS_DEBUG) limitedLog('> ', ...this.recipe.console())

    if (!this.isLooped()) {
      // newPurity = 1.0
      this.cost += processingCostFromInputAmount(this.inputs.length)
      for (const { from, weight } of this.inputs) {
        this.cost += from.cost /* +  from.steps */ * weight
        // newPurity += (from.purity ** (2 - 1 / (from.steps + 1)))// * 0.9 + 0.1
        newPurity += from.purity / (from.steps + 1)
        this.steps += from.steps
        from.recipes.mainHolder?.catalystsKeys.forEach((c) =>
          this.addCatalystKey(c)
        )
      }

      for (const { from } of this.catalysts) {
        newPurity += from.purity // * 0.9 + 0.1
        this.addCatalystKey(from, true)
      }
    }

    // Recalculate steps
    // this.recipesKeys.clear()
    // this.recipesKeys.add(this.recipe)

    // for (const {from} of this.inputs) {
    //   from.recipes.mainHolder?.recipesKeys.forEach(k=>this.recipesKeys.add(k))
    // }

    // this.purity = floatCut(newPurity / (this.inputs.length || 1))
    // this.complexity = floatCut(this.cost + this.processing)
    this.purity = newPurity / (this.inputs.length + this.catalysts.length || 1)
    this.complexity = this.cost + this.processing

    // this.steps = this.recipesKeys.size

    // if(this.output.cuent.id.startsWith('minecraft:diamond')) console.log([...this.recipesKeys.values()].map(r=>r.display()).join('\n'))

    return oldComplexity !== this.complexity
  }

  private isLooped(): boolean {
    return (
      this.inputs.some(({ from }) =>
        from.recipes.mainHolder?.catalystsKeys.has(this.output.cuent)
      ) || this.catalysts.some(({ from }) => this.output.cuent === from)
    )
  }

  private addCatalystKey(c: Constituent, processor = false): boolean {
    if (this.catalystsKeys.has(c)) return false
    this.catalystsKeys.add(c)
    // const valToAdd = processor ? c.complexity : c.processing
    const valToAdd = c.complexity
    this.processing += valToAdd
    if (IS_DEBUG) {
      const clo = c.console()
      limitedLog('adding: ', valToAdd + ' from: ' + clo[0], ...clo.slice(1))
    }
    return true
  }
}
