import type { BaseRecipe, SolvableRecipe } from 'mc-gatherer/api'
import type { Item } from './Item'
import type { IngredientStack } from './Stack'

export interface Recipe extends BaseRecipe, SolvableRecipe<Item> {}
export class Recipe {
  constructor(
    base: BaseRecipe,
    public readonly outputs: IngredientStack[],
    public readonly inputs?: IngredientStack[],
    public readonly catalysts?: IngredientStack[],
  ) {
    Object.assign(this, base)
    this.requirments = [...(inputs ?? []), ...(catalysts ?? [])]
  }
}
