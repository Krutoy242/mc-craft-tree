<script setup lang="ts">
import type { Ref } from '@vue/reactivity'
import { storeToRefs } from 'pinia'
import type { Recipe } from './assets/items/Recipe'
import usePileStore from '~/stores/pile'

const pile = usePileStore()
const selectedRecipes = storeToRefs(pile).selectedRecipes as Ref<Recipe[]>

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

onMounted(() => pile.init())
onUpdated(() => pile.init())

let isSelectedRecipes = $ref(false)
watch(selectedRecipes, () => {
  isSelectedRecipes = !!selectedRecipes.value.length
})
</script>

<template>
  <div class="flex flex-column h-full">
    <div flex class="flex justify-content-between flex-wrap w-full surface-50">
      <TabMenu :model="tabs" />
      <Button
        class="p-button-raised p-button-text p-button-plain p-0 m-0"
        @click="(e) => pile.resetTopItem()"
      >
        <div class="flex shadow-6 align-items-center">
          <span class="w-min text-right text-primary">
            Target:
          </span>
          <Item v-if="pile.targetItem" :item="pile.targetItem" />
        </div>
      </Button>
    </div>

    <router-view class="h-full" />
    <!-- <div class="absolute bottom-0 bg-gray-900">
      <Footer />
    </div> -->

    <Dialog
      v-model:visible="isSelectedRecipes"
      header="Recipes"
      :base-z-index="1"
      :dismissable-mask="true"
      :modal="true"
      @hide="selectedRecipes = []"
    >
      <Recipes v-if="isSelectedRecipes" :recipes="selectedRecipes" />
    </Dialog>
  </div>
</template>
