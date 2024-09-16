<script setup lang="ts">
const props = defineProps({
  width: { default: 200 },
  height: { default: 50 },
  r: { default: 25 },
  offset: { default: '50%' },
  textid: { default: '' },
  color: { default: 'currentColor' },
  debug: { default: false },
})

const stroke = computed(() => props.debug ? 'gray' : 'none')
const vbox = computed(() => [0, 0, props.width, props.height].join(' '))
const d = computed(() => `M 0,${props.height} Q ${props.width / 2},${props.height - (props.r * 2)} ${props.width},${props.height}`)
const textId = computed(() => `vue-curve-text-${String(Math.random())}`)

onMounted(() => {
  const slots = useSlots()?.default?.()
  if (!slots)
    console.error('Slot content is not defined')
  else if (slots.length > 1)
    console.error('Slot content must be a textNode', slots)
  else if (typeof slots[0].children !== 'string')
    console.error('Slot content must be a textNode', slots[0])
})
</script>

<template>
  <svg
    :viewBox="vbox"
    :width="width"
    :height="height"
  >
    <g>
      <path
        :id="textId"
        :stroke="stroke"
        :d="d"
        fill="none"
      />
      <text>
        <textPath
          :xlink:href="`#${textId}`"
          :fill="color"
          :startOffset="offset"
          text-anchor="middle"
        >
          <slot />
        </textPath>
      </text>
    </g>
  </svg>
</template>
