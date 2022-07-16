<script setup lang="ts">
import { storeToRefs } from 'pinia'
import usePileStore from '~/stores/pile'

const pile = usePileStore()
const { selectedRecipes } = storeToRefs(pile)

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
  <div class="flex flex-column">
    <div flex>
      <TabMenu :model="tabs" />
    </div>
    <div flex mg-y-auto>
      <router-view />
    </div>
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
