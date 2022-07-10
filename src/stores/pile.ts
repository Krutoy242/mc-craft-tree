import { acceptHMRUpdate, defineStore } from 'pinia'
import { Item } from '~/assets/items/Item'
import { Recipe } from '~/assets/items/Recipe'
import type { IngredientStack } from '~/assets/items/Stack'
import type { CsvRecipe } from 'E:/dev/mc-gatherer/src/api'
import { IngredientStore, Stack, Tree, loadDataCSV } from 'E:/dev/mc-gatherer/src/api'

const usePileStore = defineStore('pile', () => {
  // 𝑳𝒐𝒄𝒂𝒍𝒔
  let tree: Tree<Item>
  let ingredientStore: IngredientStore<Item>
  const baseRecipes = ref<CsvRecipe[]>()

  // Storages
  const allItems = ref<Item[]>()
  const allRecipes = ref<Recipe[]>()

  // Other
  const selectedItem = ref<Item>()

  function init() {
    if (!baseRecipes.value) {
      import('../assets/data_recipes.json').then(({ default: data }) => {
        baseRecipes.value = data
      })
    }

    if (!allItems.value) {
      import('../assets/data_items.csv?raw')
        .then(module => loadDataCSV(module.default))
        .then((data) => {
          tree = new Tree(() => new Item())
          ingredientStore = new IngredientStore(tree.getById)
          Promise.all(data.map(
            async b => tree
              .getBased(b.source, b.entry, String(b.meta), b.sNbt)
              .init(b),
          )).then((items) => {
            tree.lock()
            allItems.value = items
          })
        })
    }
  }

  computed(() => {
    if (!allItems.value || !baseRecipes.value)
      return

    Promise.all(baseRecipes.value.map(processRecipe))
      .then((recipes) => { allRecipes.value = recipes })
  })

  async function processRecipe(csvBase: CsvRecipe) {
    const { outputs, inputs, catalysts, ...base } = csvBase

    return new Recipe(base, ...[outputs, inputs, catalysts].map(p => p
      ?.map(ingrId => Stack.fromString(ingrId, ingredientStore.get)),
    ) as [IngredientStack[], IngredientStack[] | undefined, IngredientStack[] | undefined])
  }

  return {
    init, allItems, allRecipes, selectedItem,
  }
})
export default usePileStore

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(usePileStore, import.meta.hot))

