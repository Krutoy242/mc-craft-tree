<script setup lang="ts">
import type { Item } from '~/assets/items/Item'

defineProps<{ item: Item }>()
</script>

<template>
  <div class="flex flex-column">
    <Item :item="item" />
    <div class="details flex monospace">
      <GearedNumber class="" :value="item.popularity" />
      <Hedgehog class="p-1" :value="item.inputsAmount" />
      <Hedgehog class="p-1" :value="-item.outputsAmount" />
      <EmoteNumber class="" :number="item.steps" />
      <BigNumber
        short
        :number="item.complexity"
        class="flex-none px-1 border-1 border-round-sm border-white-alpha-10 inline-block"
      />
    </div>
  </div>
</template>

<style scoped>
.details * {
  display: flex;
  flex: 1 1 auto;
  margin-bottom: 0.25rem;
  margin-right: 0.5rem;
  min-width: 2rem;
}
</style>
