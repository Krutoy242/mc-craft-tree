<script setup lang="ts">
import _ from 'lodash'
import type { Item } from '~/assets/items/Item'
import usePileStore from '~/stores/pile'

type ModBarTyple = [modName:string, items:Item[]]

// const modsList = shallowRef<ModBarTyple[]>()
const { pickedItems } = usePileStore()
const modsList = computed(() => pickedItems ? getModBars(pickedItems) : undefined)
const offset = ref<number>(0)
const shownItems = shallowRef<Item[]>()

function getModBars(items: Item[]): ModBarTyple[] {
  let minimum = Number.MAX_SAFE_INTEGER
  const result = _(items)
    .groupBy('source')
    .entries()
    .sortBy(([,list]) => {
      const min = Math.min(...list.map(o => o.complexity))
      minimum = Math.min(minimum, min)
      return min
    })
    .value()

  offset.value = minimum
  return result
}
</script>

<template>
  <div class="m-0 relative">
    <div class="absolute">
      <ModBar
        v-for="([name, items], i) in modsList"
        :key="i"
        :name="name"
        :items="items"
        :offset="offset"
        @showitems="(items) => shownItems = items"
      />
    </div>
    <div class="fixed">
      <ItemDetailed
        v-for="item in shownItems"
        :key="item.id"
        :item="item"
        class="m-2 bar border-1 border-round-sm border-primary-900 bg-primary-reverse"
      />
    </div>
  </div>
</template>
