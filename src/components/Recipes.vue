<template>
  <!-- <v-container fluid> -->
    <v-data-iterator
      :items="list"
      :page="page"
      :items-per-page="4"
      :hide-default-footer="list.length<=4"
    >

      <template #default="{items}">
        <v-row>
          <v-col
            v-for="recipe in items"
            :key="recipe.id"
          >
            <recipe :recipe="recipe" :class="recipe===cuent.recipes.main ? 'selected-recipe' : ''"/>
          </v-col>
        </v-row>
      </template>

    </v-data-iterator>
  <!-- </v-container> -->
</template>

<script>
export default {
  data () {
    return {
      page: 1
    }
  },
  props: {
    cuent: {
      type: Object,
      default:()=>{}
    },
  },
  watch: {
    cuent(newValue, oldValue) {
      this.page = 1
    }
  },
  computed: {
    list() {
      return this.cuent.getRecipes() 
    }
  },
}
</script>

<style>
  .selected-recipe {
    border-color: rgb(0, 119, 255) !important;
  }
</style>