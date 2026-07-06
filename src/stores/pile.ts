import type { BaseItem, CsvRecipe } from 'mc-gatherer/api'
import type { Ref } from 'vue'
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
  const baseRecipes = shallowRef<CsvRecipe[]>()
  const baseItems = shallowRef<BaseItem[]>()
  const allItems = shallowRef<Item[]>()
  const oreDict = shallowRef<Record<string, string[]>>()
  const pickedItems = shallowRef<Item[]>()
  const selectedRecipes = shallowRef<Recipe[]>([])
  const selectedRecipe = shallowRef<Recipe | undefined>()
  const selectedRecipeHistory = shallowRef<[Recipe[], Recipe | undefined][]>([])
  const allRecipes = shallowRef<Recipe[]>()
  const target = shallowRef<{ item?: Item, isTo?: boolean } | undefined>()

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

    oreDict.value = undefined as any
    baseRecipes.value = undefined as any
    baseItems.value = undefined as any
    allItems.value = undefined as any
    target.value = undefined as any
    allRecipes.value = undefined as any

    import(`~/assets/data/${modpack}/oredict.json`).then(({ default: data }) => {
      initInProgress--
      oreDict.value = data
    })

    import(`~/assets/data/${modpack}/recipes.json`).then(({ default: data }) => {
      initInProgress--
      baseRecipes.value = data as CsvRecipe[]
    })

    import(`~/assets/data/${modpack}/items.csv?raw`)
      .then(module => loadDataCSV(module.default))
      .then((data) => {
        initInProgress--
        baseItems.value = data
      })
  }

  function watchAll(array: Ref<any>[], cb: () => void) {
    watch(array, (newValues) => {
      if (!newValues.every(Boolean))
        return
      cb()
    })
  }

  watchAll([oreDict, baseItems], () => {
    tree = new Tree(() => new Item())
    tree.addOreDict(oreDict.value)

    ingredientStore = new IngredientStore(tree.getById)
    Promise.all(baseItems.value.map(
      async (b: BaseItem) => {
        // await sleep()
        return tree
          .getBased(b.source, b.entry, b.meta, b.sNbt)
          .init(b)
      },
    )).then((items) => {
      tree.locked = true
      allItems.value = items
    })
  })

  watchAll([allItems, baseRecipes], () => {
    Promise.all(baseRecipes.value!.map(processRecipe))
      .catch((err) => { throw err })
      .then((recipes: Recipe[]) => {
        for (const ingr of ingredientStore) {
          const p = tree.matchedBy(ingr)
          while (!p.next().done) {}// eslint-disable-line no-empty
        }
        allRecipes.value = recipes
      })
  })

  async function processRecipe(csvBase: CsvRecipe) {
    const { outputs, inputs, catalysts, ...base } = csvBase

    return new Recipe(base, ...[outputs, inputs, catalysts].map(p => p
      ?.map(ingrId => Stack.fromString(ingrId, ingredientStore.get)),
    ) as [IngredientStack[], IngredientStack[] | undefined, IngredientStack[] | undefined])
  }

  function selectRecipes(recipes: Recipe[], select?: Recipe, ignoreHistory?: boolean) {
    if (!ignoreHistory && selectedRecipes.value?.length)
      selectedRecipeHistory.value.push([selectedRecipes.value, selectedRecipe.value])
    selectedRecipes.value = recipes
    selectedRecipe.value = select
  }

  function selectPreviousRecipes() {
    if (!selectedRecipeHistory.length)
      return
    const [recipes, select] = selectedRecipeHistory.value.pop() as any
    selectRecipes(recipes, select, true)
  }

  function resetTopItem() {
    pileTo('storagedrawers:upgrade_creative:1')
  }

  function pileToFrom(item: string | Item | undefined, isTo: boolean) {
    if (typeof item === 'string') {
      const found = allItems.value?.find(it => it.id === item && it.purity > 0) ?? (allItems.value?.length ? allItems.value.reduce((best, it) => it.steps > best.steps ? it : best) : undefined)
      if (!found)
        return
      target.value = { item: found, isTo }
    }
    else {
      target.value = { item, isTo }
    }
  }

  function pileTo(item: string | Item | undefined) {
    pileToFrom(item, true)
  }

  function pileFrom(item: string | Item) {
    pileToFrom(item, false)
  }

  watchAll([target, allItems, allRecipes], () => {
    pickedItems.value = pickItems(target.value as any, allItems.value, allRecipes.value)
  })

  watch(allItems, resetTopItem)

  return {
    initModpack,
    selectRecipes,
    selectPreviousRecipes,
    resetTopItem,
    pileTo,
    pileFrom,
    pickedItems,
    selectedRecipes,
    selectedRecipe,
    target,
    allItems,
    allRecipes,
    selectedRecipeHistory,
  }
})
export default usePileStore

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(usePileStore, import.meta.hot))
