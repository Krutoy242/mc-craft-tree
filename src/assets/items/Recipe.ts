import type { IngredientStack } from './Stack'
import type { BaseRecipe } from 'E:/dev/mc-gatherer/src/api'

export interface Recipe extends BaseRecipe {}
export class Recipe {
  constructor(
    base: BaseRecipe,
    public outputs: IngredientStack[],
    public inputs?: IngredientStack[],
    public catalysts?: IngredientStack[],
  ) {
    Object.assign(this, base)
  }
}
