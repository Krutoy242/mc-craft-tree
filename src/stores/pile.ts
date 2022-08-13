import { acceptHMRUpdate, defineStore } from 'pinia'
import type { BaseItem, CsvRecipe } from 'mc-gatherer/build/main/api'
import { IngredientStore, Stack, Tree } from 'mc-gatherer/build/main/api'
import loadDataCSV from 'mc-gatherer/build/main/api/csv-browser'
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

  watch([$$(oreDict), $$(baseItems)], () => {
    if (!oreDict || !baseItems) return

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
      tree.lock()
      allItems = items
    })
  })

  watch([$$(allItems), $$(baseRecipes)], () => {
    if (!allItems || !baseRecipes) return
    Promise.all(baseRecipes.map(processRecipe))
      .catch((err) => { throw err })
      .then((recipes: Recipe[]) => {
        for (const ingr of ingredientStore) {
          const p = tree.matchedBy(ingr)
          while (!p.next().done) {}// eslint-disable-line no-empty
        }

        pickedItems = pickItems(allItems, recipes)
      })
  })

  async function processRecipe(csvBase: CsvRecipe) {
    const { outputs, inputs, catalysts, ...base } = csvBase

    return new Recipe(base, ...[outputs, inputs, catalysts].map(p => p
      ?.map(ingrId => Stack.fromString(ingrId, ingredientStore.get)),
    ) as [IngredientStack[], IngredientStack[] | undefined, IngredientStack[] | undefined])
  }

  function selectRecipes(recipes: Recipe[]) {
    selectedRecipes = recipes
  }

  return {
    init,
    selectRecipes,
    pickedItems    : $$(pickedItems),
    selectedRecipes: $$(selectedRecipes),
  }
})
export default usePileStore

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(usePileStore, import.meta.hot))

