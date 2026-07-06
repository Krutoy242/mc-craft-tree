<script setup lang="ts">
import type { Item } from '~/assets/items/Item'
import usePileStore from '~/stores/pile'

type ModBarTyple = [modName: string, items: Item[]]

// const modsList = shallowRef<ModBarTyple[]>()
const pickedItems = usePileStore().pickedItems as unknown as Item[]
const modsList = computed(() => pickedItems ? getModBars(pickedItems) : undefined)
const offset = ref<number>(0)
const shownItems = shallowRef<Item[]>()

const sourceBlacklist = [
  'placeholder',
]

function getModBars(items: Item[]): ModBarTyple[] {
  let minimum = Number.MAX_SAFE_INTEGER
  const grouped: Record<string, Item[]> = {}
  for (const item of items) {
    const key = item.source
    ;(grouped[key] ??= []).push(item)
  }
  const result = Object.entries(grouped)
    .filter(([source]) => !sourceBlacklist.includes(source))
    .sort(([, listA], [, listB]) => {
      const minA = Math.min(...listA.map(o => o.complexity))
      const minB = Math.min(...listB.map(o => o.complexity))
      minimum = Math.min(minimum, minA)
      return minA - minB
    })

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
      />
    </div>
  </div>
</template>
