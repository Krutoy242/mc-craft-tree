<script setup lang="ts">
import _ from 'lodash'
import { scaleLog } from 'd3'
import type { Item } from '~/assets/items/Item'
import { getHue } from '~/assets/lib/hue'
import usePileStore from '~/stores/pile'
import type { Recipe } from '~/assets/items/Recipe'

const props = defineProps<{
  name: string
  items: Item[]
  offset: number
}>()

const emit = defineEmits<{
  (e: 'showitems', items: Item[]): void
  (e: 'selectrecipes', recipes: Recipe[]): void
}>()

const { selectRecipes } = usePileStore()

const bar = computed(() => getBar(props.items))
const hue = computed(() => getHue(props.name))

const ctx = shallowRef<CanvasRenderingContext2D>()
const canvas = shallowRef<HTMLCanvasElement>()
let itemsAround = $shallowRef<Item[]>()
let itemsRecipes = $shallowRef<Recipe[]>()

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
const log_1 = (v: number) => scale(Math.max(0, v) + 0.1)

function getBar(items: Item[]): ModBar {
  const complList = items.map(o => o.complexity)
  const from = log_1(Math.min(...complList))
  const width = log_1(Math.max(...complList)) - from

  const barItems: BarItem[] = items.map(it => ({
    item : it,
    pos  : log_1(it.complexity) - from,
    width: Math.max(3, log_1(it.usability) / 50),
    hue  : 1 / (1 + Math.log(it.popularity + 1)),
  }))

  const result = {
    from : from - log_1(props.offset),
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
    const a = (i * 2.0) ** 0.3 / 2
    grd.addColorStop(a, `${defColor} ${i * 2 * alpha})`)
    grd.addColorStop(1.0 - a, `${defColor} ${i * 2 * alpha})`)
    i += step
  }
}

function getItemsAround(x: number): Item[] {
  if (!bar.value) return []

  return _(bar.value.items)
    .map(item => [Math.abs(x - item.pos), item] as const)
    .sortBy(0)
    .filter(([dist, i]) => dist < i.width)
    .map(([,i]) => i.item)
    .slice(0, 10)
    .value()
}

watch($$(itemsAround), () => emit('showitems', itemsAround))
function mousemove(e: MouseEvent) {
  itemsAround = getItemsAround(e.offsetX)
  itemsRecipes = itemsAround
    .map(i => i.mainRecipe)
    .filter((r): r is Recipe => Boolean(r))
}

function click(e: MouseEvent) {
  if (itemsRecipes.length) selectRecipes(itemsRecipes)
}
</script>

<template>
  <div
    :style="{ 'margin-left': `${bar.from}px`, 'width': `${bar.width}px`, 'cursor': `${itemsRecipes?.length ? 'pointer' : 'default'}` }"
    :color="`hsla(${hue}, 60%, 40%, 0.1)`"
    class="bar border-1 border-round-sm border-primary-900"
    @mousemove="mousemove"
    @click="click"
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
