<script setup lang="ts">
import type { Ref } from '@vue/reactivity'
import { storeToRefs } from 'pinia'
import { options } from './stores/options'
import type { Recipe } from '~/assets/items/Recipe'
import type { Item } from '~/assets/items/Item'
import usePileStore from '~/stores/pile'

const pile = usePileStore()
const selectedRecipes = storeToRefs(pile).selectedRecipes as Ref<Recipe[]>
const selectedRecipe = storeToRefs(pile).selectedRecipe as Ref<Recipe>
const target = storeToRefs(pile).target as unknown as Ref<{ item?: Item; isTo?: boolean } | undefined>

const tabs = ref([
  {
    label: 'Graph',
    icon : 'pi pi-fw pi-home',
    to   : '/graph',
  },
  {
    label: 'Table',
    icon : 'pi pi-fw pi-table',
    to   : '/table',
  },
  {
    label: 'History',
    icon : 'pi pi-fw pi-list',
    to   : '/history',
  },
])

const init = () => pile.initModpack(options.app.modpack)
onMounted(init)
onUpdated(init)

let isSelectedRecipes = $ref(false)
watch(selectedRecipes, () => {
  isSelectedRecipes = !!selectedRecipes.value.length
})

const showRecipeOptions = $ref(false)
</script>

<template>
  <div class="flex flex-column h-full">
    <div class="flex justify-content-between flex-wrap w-full surface-50">
      <TabMenu :model="tabs" />
      <Button
        class="p-button-raised p-button-text p-button-plain p-0 m-0"
        @click="() => pile.resetTopItem()"
      >
        <div class="flex shadow-6 align-items-center">
          <span class="w-min text-right text-primary">
            Target:
          </span>
          <ItemSimple v-if="target?.item" :item="target.item" />
        </div>
      </Button>
      <Button
        class="p-button-raised p-button-text p-button-plain p-0 m-0"
        @click="() => target = {}"
      >
        <div class="flex shadow-6 align-items-center">
          <span class="w-min text-right text-primary">
            Show<br>everything
          </span>
        </div>
      </Button>
    </div>

    <router-view class="h-full" />
    <div class="fixed bottom-0 right-0 border-round bg-gray-900">
      <Dropdown
        v-model="options.app.modpack"
        :options="['e2ee', 'herodotus']"
        @change="() => init()"
      />
    </div>

    <!--
    ██████╗ ███████╗ ██████╗██╗██████╗ ███████╗███████╗
    ██╔══██╗██╔════╝██╔════╝██║██╔══██╗██╔════╝██╔════╝
    ██████╔╝█████╗  ██║     ██║██████╔╝█████╗  ███████╗
    ██╔══██╗██╔══╝  ██║     ██║██╔═══╝ ██╔══╝  ╚════██║
    ██║  ██║███████╗╚██████╗██║██║     ███████╗███████║
    ╚═╝  ╚═╝╚══════╝ ╚═════╝╚═╝╚═╝     ╚══════╝╚══════╝
    -->
    <Dialog
      v-model:visible="isSelectedRecipes"
      :base-z-index="1"
      dismissable-mask
      modal
      @hide="selectedRecipes = []"
    >
      <template #header>
        <div class="flex align-items-center">
          <Button
            icon="pi pi-cog"
            class="p-button-rounded p-button-plain p-button-xs"
            @click="showRecipeOptions = !showRecipeOptions"
          />
          <span class="text-lg font-bold mx-3">Recipes</span>
          <Button
            v-if="pile.selectedRecipeHistory?.length"
            icon="pi pi-arrow-circle-left"
            class="p-button-rounded p-button-plain p-button-xs"
            @click="pile.selectPreviousRecipes()"
          />
        </div>
      </template>

      <Recipes :recipes="selectedRecipes" :selected="selectedRecipe" :as-tree-map="options.recipe.treeMapView" />
    </Dialog>

    <Dialog v-model:visible="showRecipeOptions" position="topleft" dismissable-mask header="Recipe view options">
      <div class="field-checkbox">
        <InputSwitch v-model="options.recipe.treeMapView" input-id="treeMapView" />
        <label for="treeMapView">Tree Map view</label>
      </div>

      <div class="field-checkbox">
        <InputSwitch v-model="options.recipe.considerAmount" input-id="opt3" :disabled="!options.recipe.treeMapView" />
        <label for="opt3">Consider Amount</label>
      </div>

      <div class="field-checkbox">
        <InputSwitch v-model="options.recipe.complexity" input-id="opt1" />
        <label for="opt1">Show Complexity</label>
      </div>

      <div class="field-checkbox">
        <InputSwitch v-model="options.recipe.cost" input-id="opt2" />
        <label for="opt2">Show Cost</label>
      </div>
    </Dialog>
  </div>
</template>

<style scoped>
.option {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
}
</style>
