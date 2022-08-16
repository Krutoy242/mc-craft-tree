<script setup lang="ts">
import { getHue } from '~/assets/lib/hue'

const props = defineProps<{ value: string }>()

const base = computed(() => {
  const [source, entry, meta, ...sNbt] = props.value
    .split(':') as [string, string, string, string]
  return { source, entry, meta, sNbt: sNbt.join(':') }
})

const hue = computed(() => getHue(base.value.source))
</script>

<template>
  <div
    v-tooltip="base.sNbt !== '{}' ? base.sNbt : undefined"
    class="monospace bg-black-alpha-10 border-round-sm px-1 w-max"
    style="font-size: 75%;"
  >
    <span :style="{ color: `hsl(${hue}, 60%, 40%)` }">
      {{ base.source }}
    </span>:<span
      class="text-color-secondary"
    >{{ base.entry }}</span><div v-if="base.meta && base.meta !== '0'" class="inline-block">
      :<span class="text-primary-800">{{ base.meta }}</span>
    </div><span
      v-if="base.sNbt"
    >:<span class="text-white-alpha-20"><span
      v-if="base.sNbt !== '{}'"
    >{…}</span><span v-else>{}</span></span></span>
    <!-- <span v-if="rest.length">:{{ tail }}</span> -->
  </div>
</template>

<style>
.p-tooltip-text {
  font-family: Consolas, Monaco, Lucida Console, Liberation Mono,
    DejaVu Sans Mono, Bitstream Vera Sans Mono, Courier New, monospace !important;
  font-size: small;
}
</style>
