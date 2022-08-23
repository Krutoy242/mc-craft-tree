<script setup lang="ts">
import type { Item } from '~/assets/items/Item'
import type { Recipe } from '~/assets/items/Recipe'
import { useOptions } from '~/composables/options'

const props = defineProps<{ recipe?: Recipe; asTreeMap?: boolean }>()

const options = useOptions()

const recipeLists = computed(() => {
  const names = ['OUT', 'INP', 'CTL']
  const { outputs, inputs, catalysts } = props.recipe ?? {}

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
  <div
    v-if="recipe" :style="{
      'max-width': '350px',
      'background-color': '#0002',
    }" class="m-1"
  >
    <BigNumber v-if="options.recipe.complexity" :number="recipe.complexity" short />
    <BigNumber v-if="options.recipe.cost" :number="recipe.cost" short />
    <div class="m-1 border-1 border-round-sm border-primary-900">
      <div
        v-for="(list, i) in recipeLists"
        :key="i"
      >
        <div
          v-if="list.stacks?.length"
          class="flex flex-wrap relative justify-content-center bg-alpha-10"
          :style="`background-color: hsla(${(3 - i) * 60}, 100%, 50%, 0.05)`"
        >
          <!-- Background label -->
          <div
            class="absolute text-2xl"
            style="font-family: Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif;"
            :style="`color: hsla(${(3 - i) * 60}, 100%, 50%, 0.1)`"
          >
            {{ list.name }}
          </div>
          <!-- Icons -->
          <div v-if="asTreeMap && i === 1 && list.stacks.length > 1">
            <ItemIconMap :stacks="list.stacks" />
          </div>
          <ItemIcon
            v-for="(stack, j) in list.stacks"
            v-else
            :key="j"
            :item="stack.item"
            :amount="stack.amount"
            class="m-1"
          />
        </div>
      </div>
    </div>
  </div>
</template>
