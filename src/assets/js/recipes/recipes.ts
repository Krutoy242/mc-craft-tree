import { Constituent } from '../cuents/Constituent'
import { ConstituentStack } from '../cuents/ConstituentStack'
import { CuentBase, CuentArgs, RawAdditionalsStore, RawCollection } from '../cuents/ConstituentBase'
import { globalTree } from '../cuents/ConstituentTree'
import { JEC_Types } from '../parse/jec_types'
import { RecipeLink } from './RecipeLink'
import { NumLimits, objToString } from '../utils'
import { LinksHolder } from './LinksHolder'

export type Ways = 'outputs' | 'inputs' | 'catalysts' | 'requirments'

const CRAFTING_TABLE_COST = 50.0
export function processingCostFromInputAmount(x = 1) {
  x--
  return Math.floor(Math.max(0, Math.pow(1.055, x + 100) - Math.pow(1.055, 101) + x * 25 + CRAFTING_TABLE_COST / 2))
}

export function floatCut(n: number) {
  return Math.round((n + Number.EPSILON) * 100000) / 100000
}

class RecipesStore {
  map = new Map<string, Recipe>()
  count = 0
  info = {
    outputsAmount: new NumLimits(),
    inputsAmount: new NumLimits(),
    catalystsAmount: new NumLimits(),
  }
}

export const recipesStore = new RecipesStore()

function appendRecipe(recipe: Recipe) {
  recipesStore.map.set(recipe.id, recipe)
  recipesStore.count++
  recipesStore.info.outputsAmount.update(recipe.outputs.length)
  recipesStore.info.inputsAmount.update(recipe.inputs.length)
  recipesStore.info.catalystsAmount.update(recipe.catalysts.length)
}

function fromId(id: string): CuentBase {
  const groups = id.match(/^(?<source>[^:{]+)(?::(?<entry>[^:{]+))?(?::(?<meta>[^:{]+))?(?<tag>\{.*\})?$/)?.groups ?? {}

  let args: CuentArgs

  if (groups.entry) {
    const switchers: { [key: string]: () => JEC_Types } = {
      placeholder: () => 'placeholder',
      fluid: () => 'fluidStack',
      liquid: () => 'fluidStack',
      default: () => 'itemStack',
    }
    args = {
      source: groups.source,
      entry: groups.entry,
      meta: parseInt(groups.meta) || 0,
      type: (switchers[groups.source] ?? switchers['default'])(),
    }
  } else {
    // Oredicts
    const oreAlias = Constituent.additionals[groups.source]
    if (!oreAlias?.item) {
      args = {
        type: 'oreDict',
        source: 'ore',
        entry: groups.source,
      }
    } else {
      const [source, entry] = oreAlias.item.split(':')
      args = {
        source,
        entry,
        meta: oreAlias.meta ?? 0,
        type: 'itemStack',
      }
    }
  }

  if (groups.tag) {
    try {
      args.nbt = objToString(eval(`(${groups.tag})`))
    } catch (error: any) {
      console.error('nbtEvaluationError :>> ', groups.tag, 'Error: ', error.message)
    }
  }

  return new CuentBase(args)
}

export function mergeDefaultAdditionals(
  additionals: RawAdditionalsStore,
  progressCb?: (current: number, total: number) => void
) {
  const ids_arr = Object.keys(additionals)
  function keysToArr(collection: RawCollection = {}) {
    return Object.entries(collection).map(([k, v]) => {
      const cuent = globalTree.pushBase(fromId(ids_arr[parseInt(k)]))
      return new ConstituentStack(cuent, v * cuent.volume)
    })
  }

  const chunkSize = ids_arr.length / 300
  for (let i = 0; i < ids_arr.length; i++) {
    if (i % chunkSize == 0) progressCb?.(i, ids_arr.length)

    const keyOut = ids_arr[i]
    const ads = additionals[keyOut]
    if (!ads.recipes) continue

    const mainCuent = globalTree.pushBase(fromId(keyOut))

    for (const adsRecipe of ads.recipes) {
      const outputStacks =
        typeof adsRecipe.out === 'object'
          ? keysToArr(adsRecipe.out)
          : [new ConstituentStack(mainCuent, adsRecipe.out || 1)]

      const inputStacks = keysToArr(adsRecipe.ins)
      const catalStacks = adsRecipe.ctl ? keysToArr(adsRecipe.ctl) : []

      const recipe = new Recipe(outputStacks, inputStacks, catalStacks)
      appendRecipe(recipe)
    }
  }
}

let recipesCount = 0

function nextId(): string {
  recipesCount++
  return String(recipesCount)
}

// export interface RecipeHolder {
//   outputs: any[]
//   inputs: any[]
//   catalysts: any[]
// }

// interface StacksHolder extends RecipeHolder {
//   outputs: ConstituentStack[]
//   inputs: ConstituentStack[]
//   catalysts: ConstituentStack[]
// }

export class Recipe {
  requirments: ConstituentStack[]
  id: string
  links = new Map<ConstituentStack, LinksHolder>()

  constructor(
    public outputs: ConstituentStack[],
    public inputs: ConstituentStack[],
    public catalysts: ConstituentStack[]
  ) {
    this.requirments = [...inputs, ...catalysts]

    this.id = nextId()

    outputs.forEach((outputStack) => {
      const inputLinks = inputs.map(
        (inputStack) =>
          new RecipeLink(inputStack.cuent, outputStack.cuent, inputStack.amount / outputStack.amount, this.id)
      )

      const catalLinks = catalysts.map(
        (catalStack) => new RecipeLink(catalStack.cuent, outputStack.cuent, catalStack.amount, this.id)
      )

      const linksHolder = new LinksHolder(outputStack, inputLinks, catalLinks, this)

      this.links.set(outputStack, linksHolder)
      outputStack.cuent.recipes.pushIfUnique(this, linksHolder)
    })
  }

  getCuentStackCost(cs: ConstituentStack) {
    return this.links.get(cs)?.complexity // / cs.amount
  }

  getLinksHolderFor(cs: ConstituentStack) {
    return this.links.get(cs)
  }

  static match(r1: Recipe, r2: Recipe) {
    if (r1 === r2) return true

    for (const name of ['outputs', 'inputs', 'catalysts'] as const) {
      const arr1 = r1[name]
      const arr2 = r2[name]
      if (arr1.length != arr2.length) return false

      const arr1_s = arr1.slice().sort(ConstituentStack.sort)
      const arr2_s = arr2.slice().sort(ConstituentStack.sort)

      if (!arr1_s.every((a, i) => a.match(arr2_s[i]))) {
        return false
      }
    }
    return true
  }

  hasRequirment(cuent: Constituent) {
    return this.inputs.some((cs) => cs.cuent === cuent) || this.catalysts.some((cs) => cs.cuent === cuent)
  }

  hasOutput(cuent: Constituent) {
    return this.outputs.some((cs) => cs.cuent === cuent)
  }

  display() {
    return (
      `[${this.inputs.map((cs) => cs.cuent.asString()).join(', ')}]` +
      `->[${this.catalysts.map((cs) => cs.cuent.asString()).join(', ')}]` +
      `->[${this.outputs.map((cs) => cs.cuent.asString()).join(', ')}]`
    )
  }

  console() {
    const cls = (['inputs', 'catalysts', 'outputs'] as const).map((s) => this[s].map((cs) => cs.cuent.console()))

    const head = cls.map((group) => group.map((cuent) => cuent[0]).join('+')).join('] %c➧%c [')
    const tail = cls
      .map((group, i) => (i ? ['color: #2f1', ''] : []).concat(group.map((cuent) => cuent.slice(1)).flat()))
      .flat(2)

    return ['[' + head + ']', ...tail]
  }
}
