<template>
  <v-card
    max-width="400"
    outlined
  >
    <v-card-title class="subheading font-weight-bold">
      Outputs: 
      <div
        v-for="(outCS, i) in (recipe ? recipe.outputs : [])"
        :key="i"
        class="px-1 inline-block"
      >
        <tree-entry 
          :node="outCS.cuent"
          :amount="outCS.amount"
          dense
        />
        <div class="text--secondary text-caption d-flex justify-center ma-0">
          {{ recipe.getCuentStackCost(outCS) | numFormat('0.0a') }}
        </div>
      </div>
    </v-card-title>

    <v-divider></v-divider>

    <v-list>
      <v-list-item
        v-for="(listName, i) in ['Inputs','Catalysts']"
        :key="i"
      >
        <v-list-item-content v-if="list(listName).length>0">
          <v-divider v-if="i!=0"/>
          <v-list-item-title :class="i===0 ? 'green--text' : 'teal--text'">
            {{ listName }}:
          </v-list-item-title>
          <v-list-item-subtitle class="d-flex flex-wrap"> 
            <tree-entry 
              v-for="(cs, i) in list(listName)"
              :key="i"
              :node="cs.cuent"
              :amount="cs.amount"
              dense
            />
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </v-card>
</template>

<script>
export default {
  props: {
    recipe: {
      type: Object,
      default:()=>{}
    },
  },
  methods: {
    list(listName) {
      return this.recipe ? this.recipe[listName.toLowerCase()] : []
    }
  },
}
</script>