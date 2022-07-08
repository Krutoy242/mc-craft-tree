<script setup lang="ts">
import { getHue } from '~/assets/lib/hue'

const props = defineProps({
  value: { type: String, required: true },
})

// const [source, entry, ...rest] = props.value
const [source, entry, meta] = props.value
  .split(':')
  .map(s => ref<string>(s))

const hue = computed(() => getHue(source.value))
// const tail = computed(() => rest.map(r => r.value).join(':'))
</script>

<template>
  <div
    class="monospace bg-black-alpha-10 border-round-sm px-1 w-max"
    style="font-size: 75%;"
  >
    <span :style="{ color: `hsl(${hue}, 60%, 40%)` }">
      {{ source }}
    </span>:<span
      class="text-color-secondary"
    >{{ entry }}</span><div v-if="meta && meta !== '0'" class="inline-block">
      :<span class="text-primary-800">{{ meta }}</span>
    </div>
    <!-- <span v-if="rest.length">:{{ tail }}</span> -->
  </div>
</template>
