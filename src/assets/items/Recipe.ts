import type { Item } from './Item'
import type { IngredientStack } from './Stack'
import type { BaseRecipe, Stack } from 'E:/dev/mc-gatherer/src/api'

export interface Recipe extends BaseRecipe {}
export class Recipe {
  catalystsDef: Stack<Item>[] | undefined
  inputsDef: Stack<Item>[] | undefined

  constructor(
    base: BaseRecipe,
    public outputs: IngredientStack[],
    public inputs?: IngredientStack[],
    public catalysts?: IngredientStack[],
  ) {
    Object.assign(this, base)
  }
}
