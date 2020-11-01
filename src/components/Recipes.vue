<template>
  <!-- <v-container fluid> -->
    <v-data-iterator
      :items="recipes"
      :page="page"
      :items-per-page="4"
      :hide-default-footer="recipes.length<=4"
    >

      <template #default="{items}">
        <v-row>
          <v-col
            v-for="recipe in items"
            :key="recipe.id"
          >
            <recipe :recipe="recipe" />
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
    recipes: {
      type: Array,
      default:()=>[]
    },
  },
  watch: {
    recipes(newValue, oldValue) {
      this.page = 1
    }
  },
}
</script>