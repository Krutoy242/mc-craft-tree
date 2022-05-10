<template>
  <v-card max-width="400" outlined>
    <v-card-title class="subheading font-weight-bold">
      Outputs:
      <div
        v-for="(outCS, i) in recipe ? recipe.outputs : []"
        :key="i"
        class="px-1 inline-block"
      >
        <tree-entry :node="outCS.cuent" :amount="outCS.amount" />
        <div class="text--secondary text-caption d-flex justify-center ma-0">
          <pured-value :purity="recipe.getLinksHolderFor(outCS).purity">
            {{ recipe.getCuentStackCost(outCS) | numFormat('0.0a') }}
          </pured-value>
        </div>
      </div>
    </v-card-title>

    <v-divider></v-divider>

    <v-list>
      <v-list-item>
        <v-list-item-content v-if="list('Inputs').length > 0">
          <v-list-item-title :class="'green--text'">Inputs:</v-list-item-title>
          <entry-tree-map :entry-list="list('Inputs')" />
        </v-list-item-content>
      </v-list-item>
    </v-list>

    <v-divider></v-divider>

    <v-list>
      <v-list-item>
        <v-list-item-content v-if="list('Catalysts').length > 0">
          <v-list-item-title :class="'teal--text'">
            Catalysts:
          </v-list-item-title>
          <v-list-item-subtitle class="d-flex flex-wrap">
            <tree-entry
              v-for="(cs, i) in list('Catalysts')"
              :key="i"
              :node="cs.cuent"
              :amount="cs.amount"
            />
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </v-card>
</template>

<script>
import EntryTreeMap from './EntryTreeMap.vue'
export default {
  components: { EntryTreeMap },
  props: {
    recipe: {
      type: Object,
      default: () => {},
    },
  },
  methods: {
    list(listName) {
      return this.recipe ? this.recipe[listName.toLowerCase()] : []
    },
  },
}
</script>
