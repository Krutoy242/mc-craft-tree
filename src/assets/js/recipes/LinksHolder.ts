import { Constituent } from '../cuents/Constituent'
import { ConstituentStack } from '../cuents/ConstituentStack'
import { cutNum, UniqueKeys } from '../utils'
import { RecipeLink } from './RecipeLink'
import { processingCostFromInputAmount, floatCut, Recipe } from './recipes'
import numeral from 'numeral'


/**
* List of all links between 1 output and all requirments in single recipe
* One item can have many recipes and many LinksHolders
**/
export class LinksHolder {

  cost = 0.0
  processing = 0.0
  complexity = 0.0
  purity = 0.0
  steps = 0
  
  private recipesKeys = new Set<Recipe>()
  private catalystsKeys = new Set<Constituent>()

  constructor(
    public output: ConstituentStack,
    public inputs: RecipeLink[],
    public catalysts: RecipeLink[],
    private recipe: Recipe,
  ) {
  }

  // asString() { return `output:${this.output.cuent.asString()} (complexity:${this.complexity}, purity:${this.purity}, steps:${this.steps})`}
  asString() { return `${this.recipe.display()} (complexity:${cutNum(this.complexity)}, purity:${cutNum(this.purity)}, steps:${cutNum(this.steps)})`}
  console():string[] {
    const cls = this.recipe.console()
    return [cls[0] + `%c(${cutNum(this.complexity)},${numeral(this.purity).format('0.00')},${cutNum(this.steps)})`, ...cls.slice(1), 'background: #132; color: #444']
  }

  calculate() {
    const oldComplexity = this.complexity
    this.cost = processingCostFromInputAmount(this.inputs.length)
    this.processing = 0.0
    let newPurity = 0.0
    this.steps = 1

    const isDebug = this.output.cuent.id === 'tcomplement:scorched_casting:0'
    this.catalystsKeys.clear()
    const addCatal = (c:Constituent, processor = false) => {
      if(this.catalystsKeys.has(c)) return
      this.catalystsKeys.add(c)
      this.processing += processor ? c.complexity : c.processing
      if(isDebug) console.log('adding: ', processor ? c.complexity : c.processing, 'from:', c.display)
    }

    for (const {from, weight} of this.inputs) {
      this.cost += (from.cost /*+  from.steps */) * weight
      newPurity += from.purity ** (2 - 1 / (from.steps + 1))
      this.steps += from.steps
      // this.processing += from.steps
      // this.processing += from.processing
      from.recipes.mainHolder?.catalystsKeys.forEach(c=>addCatal(c))
    }

    for (const {from, weight} of this.catalysts) {
      // this.processing += from.complexity// + from.steps
      newPurity *= from.purity * 0.5 + 0.5
      addCatal(from, true)
    }

    // Recalculate steps
    // this.recipesKeys.clear()
    // this.recipesKeys.add(this.recipe)

    // for (const {from} of this.inputs) {
    //   from.recipes.mainHolder?.recipesKeys.forEach(k=>this.recipesKeys.add(k))
    // }

    // this.purity = floatCut(newPurity / (this.inputs.length || 1))
    // this.complexity = floatCut(this.cost + this.processing)
    this.purity = newPurity / (this.inputs.length || 1)
    this.complexity = this.cost + this.processing

    // this.steps = this.recipesKeys.size

    
    // if(this.output.cuent.id.startsWith('minecraft:diamond')) console.log([...this.recipesKeys.values()].map(r=>r.display()).join('\n'))

    return oldComplexity !== this.complexity
  }
}
