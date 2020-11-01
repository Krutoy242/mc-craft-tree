<template>
  <v-card
    elevation="2"
    outlined
    shaped
  >
    <v-row
      v-for="(cuentStacks, i) in spliceInputs()"
      :key="i" no-gutters
    >
      <v-col
        v-for="(in_cuentStack, j) in cuentStacks"
        :key="j" no-gutters
      >
        <tree-entry
          :node="in_cuentStack.cuent" 
          :amount="in_cuentStack.amount" 
          dense 
        />
        <span v-if="oversized" class="text-h4">...</span>
      </v-col>
    </v-row>
  </v-card>
</template>

<script>
export default {
  props: {
    cuentStackArray: {
      type: Array
    },
  },
  data() {
    return {
      oversized: Boolean
    }
  },
  methods: {
    spliceInputs() {
      if(!this.cuentStackArray) return []
      const sliced = this.cuentStackArray
        .slice(0, 81)
        .sort((a, b)=>a.cuent.id.localeCompare(b.cuent.id))
      this.oversized = sliced.length < this.cuentStackArray.length
      const totalItems = sliced.length
      const itemsInRow = Math.floor(totalItems / (Math.sqrt(totalItems) / 2))
      return  _.chunk(sliced, itemsInRow)
    }
  },
}
</script>

<style scoped>
/* .v-card {

} */
</style>