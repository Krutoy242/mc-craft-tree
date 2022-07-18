<script setup lang="ts">
import type { Item } from '~/assets/items/Item'
import type { Recipe } from '~/assets/items/Recipe'

const props = defineProps<{ recipe: Recipe }>()

const recipeLists = computed(() => {
  const names = ['OUT', 'INP', 'CTL']
  const { outputs, inputs, catalysts } = props.recipe

  return [outputs, inputs, catalysts].map((o, i) => ({
    name  : names[i],
    stacks: o?.map(s => ({
      amount: s.amount && s.amount,
      item  : s.it.matchedBy()[0] as Item,
    })) ?? [],
  }))
})
</script>

<template>
  <div class="max-w-16rem">
    <div
      v-for="(list, i) in recipeLists"
      :key="i"
    >
      <div
        v-if="list.stacks?.length"
        class="flex flex-wrap relative justify-content-center bg-alpha-10"
        :style="`background-color: hsla(${(3 - i) * 60}, 100%, 50%, 0.05)`"
      >
        <div
          class="absolute text-2xl"
          style="font-family: Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif;"
          :style="`color: hsla(${(3 - i) * 60}, 100%, 50%, 0.1)`"
        >
          {{ list.name }}
        </div>
        <ItemIcon
          v-for="(stack, j) in list.stacks"
          :key="j"
          :item="stack.item"
          :amount="stack.amount"
          class="m-1"
        />
      </div>
    </div>
  </div>
</template>
