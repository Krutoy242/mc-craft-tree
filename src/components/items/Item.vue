<script setup lang="ts">
import type { Item } from '~/assets/items/Item'

defineProps<{ item: Item }>()
</script>

<template>
  <div class="flex">
    <ItemIcon :id="item.id" class="flex-none flex m-2" />
    <div>
      <MCFont :value="item.display" />
      <BaseID :value="item.id" />
      <MCString class="monospace font-light opacity-50" :value="item.tooltips.join('\n')" />
    </div>
  </div>
</template>
