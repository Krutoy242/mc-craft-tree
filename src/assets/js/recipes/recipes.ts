import ConstituentStack from '../cuents/ConstituentStack'
import ConstituentTree from '../cuents/ConstituentTree'
import { RawAdditionalsStore, RawCollection } from 'mc-gatherer'
import { NumLimits } from '../utils'
import Recipe from './Recipe'
import { CuentBase, idToCuentArgs } from '../cuents/ConstituentBase'

export type Ways = 'outputs' | 'inputs' | 'catalysts' | 'requirments'

export default class RecipesStore {
  map = new Map<string, Recipe>()
  count = 0
  info = {
    outputsAmount: new NumLimits(),
    inputsAmount: new NumLimits(),
    catalystsAmount: new NumLimits(),
  }

  private getCuent

  constructor(tree: ConstituentTree) {
    this.getCuent = (strItemId: string) => tree.pushBase(new CuentBase(idToCuentArgs(strItemId)))
  }

  private appendRecipe(recipe: Recipe) {
    this.map.set(recipe.id, recipe)
    this.count++
    this.info.outputsAmount.update(recipe.outputs.length)
    this.info.inputsAmount.update(recipe.inputs.length)
    this.info.catalystsAmount.update(recipe.catalysts.length)
  }

  async appendAdditionals(
    additionals: RawAdditionalsStore,
    progressCb?: (current: number, total: number) => Promise<void>
  ) {
    const ids_arr = Object.keys(additionals)

    const keysToArr = (collection: RawCollection = {}): ConstituentStack[] =>
      Object.entries(collection).map(([k, v]) => {
        const cuent = this.getCuent(ids_arr[parseInt(k)])
        return new ConstituentStack(cuent, v * cuent.volume)
      })

    const chunkSize = ids_arr.length / 300
    for (let i = 0; i < ids_arr.length; i++) {
      if (i % chunkSize == 0) await progressCb?.(i, ids_arr.length)

      const keyOut = ids_arr[i]
      const ads = additionals[keyOut]
      if (!ads.recipes) continue

      const mainCuent = this.getCuent(keyOut)

      for (const adsRecipe of ads.recipes) {
        const outputStacks =
          typeof adsRecipe.out === 'object'
            ? keysToArr(adsRecipe.out)
            : [new ConstituentStack(mainCuent, adsRecipe.out || 1)]

        const inputStacks = keysToArr(adsRecipe.ins)
        const catalStacks = adsRecipe.ctl ? keysToArr(adsRecipe.ctl) : []

        const recipe = new Recipe(outputStacks, inputStacks, catalStacks)
        this.appendRecipe(recipe)
      }
    }
    return this
  }
}
