import type { BaseItem } from 'mc-gatherer/api'
import type { Link } from './Link'
import type { Recipe } from './Recipe'
import Solvable from 'mc-gatherer/api/Solvable'
import { getVolume } from 'mc-gatherer/api/volume'

/* eslint-disable ts/no-unsafe-declaration-merging */
// @ts-expect-error Object.assign(this, base)
export interface Item extends BaseItem, Solvable<Item> {}
export class Item extends Solvable<Recipe> {
  /** How many items you need to craft */
  private _usability = 0
  usability_s = '0?'

  public get usability() {
    return this._usability
  }

  public set usability(value) {
    const [volume, units] = getVolume(this)
    this._usability = value / volume
    this.usability_s = `${this._usability}${units ?? ''}`
  }

  popList = new Set<Recipe>()

  /** How many times used as catalyst */
  public get popularity(): number {
    return this.popList.size
  }

  /** Number of items in main recipe */
  inputsAmount = 0

  /** How many items used this one as input */
  outputsAmount = 0

  usedInRecipes = new Set<Recipe>()
  mainInputs = new Set<Link<Item>>()
  mainOutputs = new Set<Link<Item>>()

  href!: string

  init(base: BaseItem) {
    const { purity, cost, processing, complexity, ...restBase } = base
    Object.assign(this, restBase)
    this.href = getImagePath(this)
    if (cost && !base.recipeIndexes.length)
      this.naturalCost = cost
    return this
  }

  // Purge all calculated values
  clear() {
    this._usability = 0
    this.usability_s = '0?'
    this.inputsAmount = 0
    this.outputsAmount = 0
    this.popList.clear()
    this.usedInRecipes.clear()
    this.recipes = undefined
    this.mainInputs.clear()
    this.mainOutputs.clear()
  }
}

function getImagePath(item: Item) {
  return `https://github.com/Krutoy242/mc-icons/raw/master/i/${item.imgsrc || 'placeholder/null'}.png`
}
