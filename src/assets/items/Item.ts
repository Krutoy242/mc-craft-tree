import type { Link } from './Link'
import type { Recipe } from './Recipe'
import type { BaseItem } from 'E:/dev/mc-gatherer/src/api'
import { getVolume } from 'E:/dev/mc-gatherer/src/api'

export interface Item extends BaseItem {}
export class Item {
  /** How many items you need to craft */
  private _usability = 0
  usability_s = '0?'

  public get usability() {
    return this._usability
  }

  public set usability(value) {
    const [volume, units] = getVolume(this)
    this._usability = value / volume
    this.usability_s = `${this._usability}${units}`
  }

  /** How many times used as catalyst */
  popularity = 0

  /** Number of items in main recipe */
  inputsAmount = 0

  /** How many items used this one as input */
  outputsAmount = 0

  recipes: Set<Recipe> | undefined

  private _mainRecipe: Recipe | undefined
  public get mainRecipe(): Recipe | undefined {
    return this._mainRecipe
  }

  private _mainRecipeAmount: number | undefined
  public get mainRecipeAmount(): number | undefined {
    return this._mainRecipeAmount
  }

  setMainRecipe(recipe: Recipe, amount?: number) {
    this._mainRecipe = recipe
    this._mainRecipeAmount = amount
  }

  mainInputs = new Set<Link<Item>>()
  mainOutputs = new Set<Link<Item>>()

  href!: string

  init(base: BaseItem) {
    Object.assign(this, base)
    this.href = getImagePath(this.id)
    return this
  }
}

const imagePath = 'https://github.com/Krutoy242/E2E-E-icons/raw/main/x32'

function getImagePath(id: string) {
  return `${imagePath}/${id.split(':', 3).join('__')}.png`
}