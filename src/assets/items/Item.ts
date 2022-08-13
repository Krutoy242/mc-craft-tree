import { getVolume } from 'mc-gatherer/build/main/api'
import type { BaseItem, Solvable } from 'mc-gatherer/build/main/api'
import type { Link } from './Link'
import type { Recipe } from './Recipe'

export interface Item extends Omit<BaseItem, keyof Solvable<any>>, Solvable<Item> {}
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

  usedInRecipes = new Set<Recipe>()

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
    this.href = getImagePath(this)
    return this
  }

  // Purge all calculated values
  clear() {
    this._usability = 0
    this.usability_s = '0?'
    this.popularity = 0
    this.inputsAmount = 0
    this.outputsAmount = 0
    this.usedInRecipes.clear()
    this.recipes = undefined
    this._mainRecipeAmount = undefined
    this.mainInputs.clear()
    this.mainOutputs.clear()
  }
}

const imagePath = 'https://github.com/Krutoy242/mc-icons/raw/master/i/'

function getImagePath(item: Item) {
  return `${imagePath}${item.imgsrc}.png`
}
