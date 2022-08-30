<script setup lang="ts">
import type { Recipe } from '~/assets/items/Recipe'

const props = defineProps<{
  recipes: Recipe[]
  asTreeMap?: boolean
  selected?: Recipe
}>()

// const responsiveOptions = ref(new Array(3).fill(0).map((_, i) => ({
//   breakpoint: `${250 * (i + 1) + 200}px`,
//   numVisible: i + 1,
//   numScroll : i + 1,
// })))

const sorted = computed(() => props.recipes.slice().sort((a, b) => a.cost - b.cost))
</script>

<template>
  <!-- <Carousel
    :value="recipes"
    :num-visible="3"
    :num-scroll="3"
    :responsive-options="responsiveOptions"
  >
    <template #item="{ data }">
      <CRecipe
        :recipe="data"
        :as-tree-map="asTreeMap"
      />
    </template>
  </Carousel> -->
  <div class="flex">
    <CRecipe
      v-for="rec in sorted"
      :key="rec.index"
      :recipe="rec"
      :as-tree-map="asTreeMap"
      :class="{ 'selected-recipe': rec === selected }"
    />
  </div>
</template>

<style>
.selected-recipe {
  border-color: rgb(86, 151, 12) !important;
  border-width: 0.2rem;
}
</style>
