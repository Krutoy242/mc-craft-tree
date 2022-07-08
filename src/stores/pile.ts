import { acceptHMRUpdate, defineStore } from 'pinia'
import { Item } from '~/assets/items/Item'
import { Recipe } from '~/assets/items/Recipe'
import { loadDataCSV } from 'E:/dev/mc-gatherer/src/api'

const usePileStore = defineStore('pile', () => {
  // Storages
  const allItems = ref<Item[]>()
  const allRecipes = ref<Recipe[]>()

  // Other
  const selectedItem = ref<Item>()

  function init() {
    if (!allRecipes.value) {
      import('../assets/data_recipes.json').then(({ default: data }) => {
        allRecipes.value = data.map(d => new Recipe(d))
      })
    }

    if (!allItems.value) {
      import('../assets/data_items.csv?raw')
        .then(module => loadDataCSV(module.default))
        .then((data) => {
          allItems.value = data.map(d => new Item(d))
        })
    }
  }

  computed(() => {
    if (!allItems.value || !allRecipes.value)
      return

    allRecipes.value.forEach((_rec) => {

    })
  })

  return {
    init, allItems, allRecipes, selectedItem,
  }
})
export default usePileStore

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(usePileStore, import.meta.hot))
