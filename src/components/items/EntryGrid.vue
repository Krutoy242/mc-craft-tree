<script setup lang="ts">
import type { Identified } from 'mc-gatherer/api'
import type { Stack } from 'mc-gatherer/api/Stack'
import _ from 'lodash'

const props = defineProps<{ stacks: Stack<Identified>[] }>()
const { ceil, sqrt } = Math

function spliceInputs() {
  if (!props.stacks)
    return []

  const sliced = props.stacks
    .slice(0, 81)
    .sort((a, b) => a.it.id.localeCompare(b.it.id))
  if (sliced.length < props.stacks.length)
    sliced.push({ over: true })

  const totalItems = sliced.length
  const itemsInRow = ceil(totalItems / ceil(sqrt(totalItems / 2 + 1) - 1))
  return _.chunk(sliced, itemsInRow)
}
</script>

<template>
  <div>
    <v-tooltip
      v-if="stacks && stacks.length > 0"
      left
      transition="slide-x-transition"
    >
      <template #activator="{ on, attrs }">
        <v-card outlined v-bind="attrs" v-on="on">
          <slot />
        </v-card>
      </template>
      <!-- <v-card elevation="2" outlined shaped> -->
      <v-row v-for="(cuentStacks, i) in spliceInputs()" :key="i" no-gutters>
        <v-col v-for="(in_cuentStack, j) in cuentStacks" :key="j" no-gutters>
          <!-- <tree-entry
            v-if="!in_cuentStack.over"
            :node="in_cuentStack.cuent"
            :amount="in_cuentStack.amount"
          />
          <span v-else class="text-h3">...</span> -->
        </v-col>
      </v-row>
      <!-- </v-card> -->
    </v-tooltip>
    <slot v-else />
  </div>
</template>

<style scoped>
.v-tooltip__content {
  background-color: rgba(24, 24, 24, 0.9) !important;
}
.v-tooltip__content.menuable_content_active {
  opacity: 0.95 !important;
}
</style>
