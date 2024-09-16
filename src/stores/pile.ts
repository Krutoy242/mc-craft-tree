import type { BaseItem, CsvRecipe } from 'mc-gatherer/api'
import type { Ref } from 'vue'
import _ from 'lodash'
import loadDataCSV from 'mc-gatherer/api/csv-browser'
import { IngredientStore } from 'mc-gatherer/api/IngredientStore'
import { Stack } from 'mc-gatherer/api/Stack'
import { Tree } from 'mc-gatherer/api/Tree'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { Item } from '~/assets/items/Item'
import { pickItems } from '~/assets/items/Linker'
import { Recipe } from '~/assets/items/Recipe'
import type { IngredientStack } from '~/assets/items/Stack'
import { options } from './options'

// const sleep = (ms?: number) => new Promise(resolve => setTimeout(resolve, ms))

const usePileStore = defineStore('pile', () => {
  // 𝑳𝒐𝒄𝒂𝒍𝒔
  let tree: Tree<Item>
  let ingredientStore: IngredientStore<Item>
  let baseRecipes = $shallowRef<CsvRecipe[]>()
  let baseItems = $shallowRef<BaseItem[]>()
  let allItems = $shallowRef<Item[]>()
  let oreDict = $shallowRef<Record<string, string[]>>()
  let pickedItems = $shallowRef<Item[]>()
  let selectedRecipes = $shallowRef<Recipe[]>([])
  let selectedRecipe = $shallowRef<Recipe | undefined>()
  const selectedRecipeHistory = $shallowRef<[Recipe[], Recipe | undefined][]>([])
  let allRecipes = $shallowRef<Recipe[]>()
  let target = $shallowRef<{ item?: Item, isTo?: boolean } | undefined>()

  let initInProgress = 0
  let currentModpack = ''

  watch(options.app, (v) => {
    initModpack(v.modpack)
  })

  function initModpack(modpack: string) {
    if (!modpack || modpack === 'null')
      modpack = 'e2ee'
    if (currentModpack === modpack)
      return
    if (initInProgress !== 0)
      return
    initInProgress = 3
    currentModpack = modpack

    oreDict = undefined as any
    baseRecipes = undefined as any
    baseItems = undefined as any
    allItems = undefined as any
    target = undefined as any
    allRecipes = undefined as any

    import(`~/assets/data/${modpack}/oredict.json`).then(({ default: data }) => {
      initInProgress--
      oreDict = data
    })

    import(`~/assets/data/${modpack}/recipes.json`).then(({ default: data }) => {
      initInProgress--
      baseRecipes = data as CsvRecipe[]
    })

    import(`~/assets/data/${modpack}/items.csv?raw`)
      .then(module => loadDataCSV(module.default))
      .then((data) => {
        initInProgress--
        baseItems = data
      })
  }

  function watchAll(array: Ref<any>[], cb: () => void) {
    watch(array, (newValues) => {
      if (!newValues.every(Boolean))
        return
      cb()
    })
  }

  watchAll([$$(oreDict), $$(baseItems)], () => {
    tree = new Tree(() => new Item())
    tree.addOreDict(oreDict)

    ingredientStore = new IngredientStore(tree.getById)
    Promise.all(baseItems.map(
      async (b: BaseItem) => {
        // await sleep()
        return tree
          .getBased(b.source, b.entry, b.meta, b.sNbt)
          .init(b)
      },
    )).then((items) => {
      tree.locked = true
      allItems = items
    })
  })

  watchAll([$$(allItems), $$(baseRecipes)], () => {
    Promise.all(baseRecipes.map(processRecipe))
      .catch((err) => { throw err })
      .then((recipes: Recipe[]) => {
        for (const ingr of ingredientStore) {
          const p = tree.matchedBy(ingr)
          while (!p.next().done) {}// eslint-disable-line no-empty
        }
        allRecipes = recipes
      })
  })

  async function processRecipe(csvBase: CsvRecipe) {
    const { outputs, inputs, catalysts, ...base } = csvBase

    return new Recipe(base, ...[outputs, inputs, catalysts].map(p => p
      ?.map(ingrId => Stack.fromString(ingrId, ingredientStore.get)),
    ) as [IngredientStack[], IngredientStack[] | undefined, IngredientStack[] | undefined])
  }

  function selectRecipes(recipes: Recipe[], select?: Recipe, ignoreHistory?: boolean) {
    if (!ignoreHistory && selectedRecipes?.length)
      selectedRecipeHistory.push([selectedRecipes, selectedRecipe])
    selectedRecipes = recipes
    selectedRecipe = select
  }

  function selectPreviousRecipes() {
    if (!selectedRecipeHistory.length)
      return
    const [recipes, select] = selectedRecipeHistory.pop() as any
    selectRecipes(recipes, select, true)
  }

  function resetTopItem() {
    pileTo('storagedrawers:upgrade_creative:1')
  }

  function pileToFrom(item: string | Item | undefined, isTo: boolean) {
    if (typeof item === 'string') {
      const found = allItems?.find(it => it.id === item && it.purity > 0) ?? _.maxBy(allItems, it => it.steps)
      if (!found)
        return
      target = { item: found, isTo }
    }
    else {
      target = { item, isTo }
    }
  }

  function pileTo(item: string | Item | undefined) {
    pileToFrom(item, true)
  }

  function pileFrom(item: string | Item) {
    pileToFrom(item, false)
  }

  watchAll($$([target, allItems, allRecipes]), () => {
    pickedItems = pickItems(target as any, allItems, allRecipes)
  })

  watch($$(allItems), resetTopItem)

  return {
    initModpack,
    selectRecipes,
    selectPreviousRecipes,
    resetTopItem,
    pileTo,
    pileFrom,
    ...$$({
      pickedItems,
      selectedRecipes,
      selectedRecipe,
      target,
      allItems,
      allRecipes,
      selectedRecipeHistory,
    }),
  }
})
export default usePileStore

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(usePileStore, import.meta.hot))
