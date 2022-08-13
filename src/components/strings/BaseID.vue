<script setup lang="ts">
import { getHue } from '~/assets/lib/hue'

const props = defineProps<{ value: string }>()

const base = computed(() => {
  const [source, entry, meta] = props.value
    .split(':') as [string, string, string]
  return { source, entry, meta }
})

const hue = computed(() => getHue(base.value.source))
</script>

<template>
  <div
    class="monospace bg-black-alpha-10 border-round-sm px-1 w-max"
    style="font-size: 75%;"
  >
    <span :style="{ color: `hsl(${hue}, 60%, 40%)` }">
      {{ base.source }}
    </span>:<span
      class="text-color-secondary"
    >{{ base.entry }}</span><div v-if="base.meta && base.meta !== '0'" class="inline-block">
      :<span class="text-primary-800">{{ base.meta }}</span>
    </div>
    <!-- <span v-if="rest.length">:{{ tail }}</span> -->
  </div>
</template>
