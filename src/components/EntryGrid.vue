<template>
  <div>
    <v-tooltip 
      left 
      transition="slide-x-transition"
      v-if="cuentStackArray && cuentStackArray.length > 0"
    >
      <template #activator="{ on, attrs }">
        <v-card outlined v-bind="attrs" v-on="on">
          <slot/>
        </v-card>
      </template>
      <!-- <v-card elevation="2" outlined shaped> -->
        <v-row v-for="(cuentStacks, i) in spliceInputs()" :key="i" no-gutters>
          <v-col v-for="(in_cuentStack, j) in cuentStacks" :key="j" no-gutters>
            <tree-entry
              v-if="!in_cuentStack.over"
              :node="in_cuentStack.cuent"
              :amount="in_cuentStack.amount"
            />
            <span v-else class="text-h3"> ...</span>
          </v-col>
        </v-row>
      <!-- </v-card> -->
    </v-tooltip>
    <slot v-else/>
  </div>
</template>

<script>
import _ from 'lodash'
const { floor, ceil, sqrt } = Math

export default {
  props: {
    cuentStackArray: {
      type: Array
    }
  },
  data() {
    return {
      oversized: false
    }
  },
  methods: {
    spliceInputs() {
      if (!this.cuentStackArray) return []
      const sliced = this.cuentStackArray
        .slice(0, 81)
        .sort((a, b) => a.cuent.id.localeCompare(b.cuent.id))
      if (sliced.length < this.cuentStackArray.length) {
        this.oversized = true
        sliced.push({ over: true })
      }
      const totalItems = sliced.length
      const itemsInRow = ceil(totalItems / ceil(sqrt(totalItems / 2 + 1) - 1))
      return _.chunk(sliced, itemsInRow)
    }
  }
}
</script>

<style scoped>
.v-tooltip__content {
  background-color: rgba(24, 24, 24, 0.9) !important;
}
.v-tooltip__content.menuable_content_active {
  opacity: 0.95 !important;
}
</style>