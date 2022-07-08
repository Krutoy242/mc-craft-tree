<script setup lang="ts">
import type { Recipe } from '~/assets/items/Recipe'

defineProps<{ recipes: Recipe[] }>()
const page = ref(1)
</script>

<template>
  <!-- <v-container fluid> -->
  <v-data-iterator
    :items="recipes"
    :page="page"
    :items-per-page="4"
    :hide-default-footer="recipes.length <= 4"
  >
    <template #default="{ items }">
      <v-row>
        <v-col v-for="recipeInfo in items" :key="recipeInfo.it.id">
          <recipe
            :recipe="recipeInfo.it"
            :class="recipeInfo.selected ? 'selected-recipe' : ''"
          />
        </v-col>
      </v-row>
    </template>
  </v-data-iterator>
  <!-- </v-container> -->
</template>

<style>
.selected-recipe {
  border-color: rgb(0, 119, 255) !important;
}
</style>
