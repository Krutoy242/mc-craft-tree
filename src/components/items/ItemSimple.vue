<script setup lang="ts">
import type { Item } from '~/assets/items/Item'

defineProps<{ item?: Item }>()
</script>

<template>
  <div v-if="item" class="flex overflow-hidden" style="max-width: 18rem;">
    <ItemIcon :item="item" class="flex-none flex m-2" />
    <div>
      <MCFont :value="item.display" style="white-space: nowrap; margin-right: 3rem;" />
      <BaseID :value="item.id" />
      <!-- <MCString class="monospace font-light opacity-50" :value="item.tooltips.join('\n')" /> -->
    </div>
  </div>
</template>
