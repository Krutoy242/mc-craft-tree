<script setup lang="ts">
import _ from 'lodash'
import { scaleLog } from 'd3'
import type { Item } from '~/assets/items/Item'
import { getHue } from '~/assets/lib/hue'

const props = defineProps<{
  name: string
  items: Item[]
  offset: number
}>()

const emit = defineEmits<{
  (e: 'showitems', items: Item[]): void
}>()

const bar = computed(() => getBar(props.items))
const hue = computed(() => getHue(props.name))

const ctx = ref<CanvasRenderingContext2D>()
const canvas = ref<HTMLCanvasElement>()

interface BarItem {
  item: Item
  pos: number
  width: number
  hue: number
}

interface ModBar {
  from: number
  width: number
  items: BarItem[]
}

const scaleRange = scaleLog().domain([0.1, 1e3]).range([0, 1000])
const scale = scaleRange.base(2) // .nice()
const log = (v: number) => Math.max(0, scale(v))

function getBar(items: Item[]): ModBar {
  const complList = items.map(o => o.complexity)
  const from = log(Math.min(...complList))
  const width = log(Math.max(...complList)) - from

  const barItems: BarItem[] = items.map(it => ({
    item : it,
    pos  : log(it.complexity) - from,
    width: Math.max(3, log(it.usability) / 50),
    hue  : 1 / (1 + Math.log(it.popularity + 1)),
  }))

  const result = {
    from : from - log(props.offset),
    width: Math.max(100, width),
    items: barItems,
  }

  return result
}

onMounted(() => {
  nextTick(() => {
    const newCtx = canvas.value?.getContext('2d')
    if (newCtx)
      ctx.value = newCtx
    setCanvasSize()
    window.addEventListener('resize', setCanvasSize)
  })
})
onUnmounted(() => window.removeEventListener('resize', setCanvasSize))

onUpdated(() => setCanvasSize())

function setCanvasSize() {
  const c = canvas.value
  if (!c)
    return
  const rect = (c?.parentNode?.parentNode as any)?.getBoundingClientRect()
  c.width = rect.width - 2
  c.height = rect.height - 2

  drawGradient()
}

function drawGradient() {
  const h = canvas.value?.height ?? 1
  bar.value.items.forEach(async (b) => {
    if (!ctx.value)
      return

    const x1 = (b.pos - b.width) | 0
    const x2 = (b.pos + b.width) | 0

    // Create gradient
    const grd = ctx.value.createLinearGradient(x1, 0, x2, 0)
    genGradient(grd, b)

    // Fill with gradient
    ctx.value.globalCompositeOperation = 'screen'
    ctx.value.fillStyle = grd
    ctx.value.fillRect(x1, 0, x2 - x1, h)
  })
}

function genGradient(grd: CanvasGradient, bi: BarItem) {
  let i = 0.0
  const step = 0.1
  const alpha = 1
  const saturation = 1
  const value = 0.25
  const defColor = `hsla(${(44 * bi.hue) % 255}, ${(100 * saturation) | 0}%, ${(100 * value) | 0}%,`
  grd.addColorStop(0.5, `${defColor} ${1 * alpha})`)
  while (i < 0.5) {
    const a = Math.pow(i * 2.0, 0.3) / 2
    grd.addColorStop(a, `${defColor} ${i * 2 * alpha})`)
    grd.addColorStop(1.0 - a, `${defColor} ${i * 2 * alpha})`)
    i += step
  }
}

function mousemove(e: MouseEvent) {
  if (!bar.value)
    return

  const itemsAround = _(bar.value.items)
    .map(item => [Math.abs(e.offsetX - item.pos), item] as const)
    .sortBy(0)
    .filter(([dist]) => dist < 20)
    .map(([,i]) => i.item)
    .value()

  emit('showitems', itemsAround)
}
</script>

<template>
  <div
    :style="{ 'margin-left': `${bar.from}px`, 'width': `${bar.width}px` }"
    :color="`hsla(${hue}, 60%, 40%, 0.1)`"
    class="bar border-1 border-round-sm border-primary-900"
    @mousemove="mousemove"
  >
    <div class="absolute">
      <canvas ref="canvas" />
    </div>
    <span
      :style="{ color: `hsl(${hue}, 60%, 40%)` }"
      class="mx-2"
    >
      {{ name }}
    </span>
  </div>
</template>

<style scoped>
.bar {
height: '1.5rem'
}
</style>
