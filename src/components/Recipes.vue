<template>
  <!-- <v-container fluid> -->
  <v-data-iterator
    :items="recipeInfoList"
    :page="page"
    :items-per-page="4"
    :hide-default-footer="recipeInfoList.length <= 4"
  >
    <template #default="{ items }">
      <v-row>
        <v-col v-for="recipeInfo in items" :key="recipeInfo.it.id">
          <recipe :recipe="recipeInfo.it" :class="recipeInfo.selected ? 'selected-recipe' : ''" />
        </v-col>
      </v-row>
    </template>
  </v-data-iterator>
  <!-- </v-container> -->
</template>

<script>
export default {
  props: {
    recipeInfoList: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      page: 1,
    }
  },
  watch: {
    cuent() {
      this.page = 1
    },
  },
}
</script>

<style>
.selected-recipe {
  border-color: rgb(0, 119, 255) !important;
}
</style>
