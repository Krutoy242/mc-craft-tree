<script setup lang="ts">
import type { Recipe } from '~/assets/items/Recipe'

defineProps<{ recipes: Recipe[]; asTreeMap?: boolean }>()

// const responsiveOptions = ref(new Array(3).fill(0).map((_, i) => ({
//   breakpoint: `${250 * (i + 1) + 200}px`,
//   numVisible: i + 1,
//   numScroll : i + 1,
// })))
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
      v-for="rec in recipes"
      :key="rec.index"
      :recipe="rec"
      :as-tree-map="asTreeMap"
    />
  </div>
</template>

<style>
.selected-recipe {
  border-color: rgb(0, 119, 255) !important;
}
</style>
