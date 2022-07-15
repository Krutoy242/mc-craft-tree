import { acceptHMRUpdate, defineStore } from 'pinia'
import { Item } from '~/assets/items/Item'
import { pickItems } from '~/assets/items/Linker'
import { Recipe } from '~/assets/items/Recipe'
import type { IngredientStack } from '~/assets/items/Stack'
import type { BaseItem, CsvRecipe } from 'E:/dev/mc-gatherer/src/api'
import { IngredientStore, Stack, Tree } from 'E:/dev/mc-gatherer/src/api'
import loadDataCSV from 'E:/dev/mc-gatherer/src/api/csv-browser'

// const sleep = (ms?: number) => new Promise(resolve => setTimeout(resolve, ms))

const usePileStore = defineStore('pile', () => {
  // 𝑳𝒐𝒄𝒂𝒍𝒔
  let tree: Tree<Item>
  let ingredientStore: IngredientStore<Item>
  const baseRecipes = ref<CsvRecipe[]>()
  const baseItems = ref<BaseItem[]>()
  const allRecipes = ref<Recipe[]>()
  const allItems = ref<Item[]>()
  const oreDict = ref<Record<string, string[]>>()

  // Storages
  const pickedItems = ref<Item[]>()

  // Other
  const selectedItem = ref<Item>()

  function init() {
    if (!oreDict.value) {
      import('../assets/data_oredict.json').then(({ default: data }) => {
        oreDict.value = data
      })
    }

    if (!baseRecipes.value) {
      import('../assets/data_recipes.json').then(({ default: data }) => {
        baseRecipes.value = data as CsvRecipe[]
      })
    }

    if (!allItems.value) {
      import('../assets/data_items.csv?raw')
        .then(module => loadDataCSV(module.default))
        .then((data) => {
          baseItems.value = data
        })
    }
  }

  watch([oreDict, baseItems], ([newDict, newItems]) => {
    if (!newDict || !newItems)
      return

    tree = new Tree(() => new Item())
    tree.addOreDict(newDict)

    ingredientStore = new IngredientStore(tree.getById)
    Promise.all(newItems.map(
      async (b) => {
        // await sleep()
        return tree
          .getBased(b.source, b.entry, b.meta, b.sNbt)
          .init(b)
      },
    )).then((items) => {
      tree.lock()
      allItems.value = items
    })
  })

  watch([allItems, baseRecipes], ([newItems, newRecipes]) => {
    if (!newItems || !newRecipes)
      return

    const promises = newRecipes.map(processRecipe)

    Promise.all(promises)
      .catch((err) => { throw err })
      .then(onItemsOrRecipesChange)
  })

  function onItemsOrRecipesChange(recipes: Recipe[]) {
    if (!allItems.value)
      return

    for (const ingr of ingredientStore) {
      const p = tree.matchedBy(ingr)
      while (!p.next().done) {}// eslint-disable-line no-empty
    }

    pickedItems.value = pickItems(allItems.value, recipes)
    allRecipes.value = recipes
  }

  async function processRecipe(csvBase: CsvRecipe) {
    const { outputs, inputs, catalysts, ...base } = csvBase

    return new Recipe(base, ...[outputs, inputs, catalysts].map(p => p
      ?.map(ingrId => Stack.fromString(ingrId, ingredientStore.get)),
    ) as [IngredientStack[], IngredientStack[] | undefined, IngredientStack[] | undefined])
  }

  return {
    init,
    pickedItems,
    selectedItem,
  }
})
export default usePileStore

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(usePileStore, import.meta.hot))

