import { acceptHMRUpdate, defineStore } from 'pinia'
import _ from 'lodash'
import type { Ref } from 'vue'
import type { BaseItem, CsvRecipe } from 'mc-gatherer/api'
import { IngredientStore, Stack, Tree } from 'mc-gatherer/api'
import loadDataCSV from 'mc-gatherer/api/csv-browser'
import { Item } from '~/assets/items/Item'
import { pickItems } from '~/assets/items/Linker'
import { Recipe } from '~/assets/items/Recipe'
import type { IngredientStack } from '~/assets/items/Stack'

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
  let allRecipes = $shallowRef<Recipe[]>()
  let target = $shallowRef<{ item?: Item; isTo?: boolean }>({})

  function init() {
    if (!oreDict) {
      import('../assets/data_oredict.json').then(({ default: data }) => {
        oreDict = data
      })
    }

    if (!baseRecipes) {
      import('../assets/data_recipes.json').then(({ default: data }) => {
        baseRecipes = data as CsvRecipe[]
      })
    }

    if (!allItems) {
      import('../assets/data_items.csv?raw')
        .then(module => loadDataCSV(module.default))
        .then((data) => {
          baseItems = data
        })
    }
  }

  function watchAll(array: Ref<any>[], cb: () => void) {
    watch(array, (newValues) => {
      if (!newValues.every(Boolean)) return
      cb()
    })
  }

  watchAll([$$(oreDict), $$(baseItems)], () => {
    tree = new Tree(() => new Item())
    tree.addOreDict(oreDict)

    ingredientStore = new IngredientStore(tree.getById)
    Promise.all(baseItems.map(
      async (b) => {
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

  function selectRecipes(recipes: Recipe[], select?: Recipe) {
    selectedRecipes = recipes
    selectedRecipe = select
  }

  function resetTopItem() {
    pileTo('storagedrawers:upgrade_creative:1')
  }

  function pileToFrom(item: string | Item, isTo: boolean) {
    if (typeof item === 'string') {
      const found = allItems?.find(it => it.id === item) ?? _.maxBy(allItems, it => it.steps)
      if (!found) throw new Error('Cannot find target item')
      target = { item: found, isTo }
    }
    else {
      target = { item, isTo }
    }
  }

  function pileTo(item: string | Item) { pileToFrom(item, true) }
  function pileFrom(item: string | Item) { pileToFrom(item, false) }

  watchAll($$([target, allItems, allRecipes]), () => {
    pickedItems = pickItems(target as any, allItems, allRecipes)
  })

  watch($$(allItems), resetTopItem)

  return {
    init,
    selectRecipes,
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
    }),
  }
})
export default usePileStore

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(usePileStore, import.meta.hot))

