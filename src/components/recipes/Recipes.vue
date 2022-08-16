<script setup lang="ts">
import type { Recipe } from '~/assets/items/Recipe'

defineProps<{ recipes: Recipe[] }>()
</script>

<template>
  <div class="flex">
    <CRecipe
      v-for="rec in recipes"
      :key="rec.index"
      :recipe="rec"
      class="m-1 border-1 border-round-sm border-primary-900"
    />
  </div>
</template>

<style>
.selected-recipe {
  border-color: rgb(0, 119, 255) !important;
}
</style>
