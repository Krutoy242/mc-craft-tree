<template>
  <div style="width: 100%" class="ma-1">
    <v-card
      :width="width + '%'"
      :style="{ 'margin-left': from + '%' }"
      :color="`hsla(${h}, 60%, 40%, 0.1)`"
    >
      <v-overlay absolute class="mt-2">
        <canvas ref="ctx"></canvas>
      </v-overlay>
      <span :style="{ color: `hsl(${h}, 60%, 40%)` }" class="text-no-wrap mx-2">
        {{ historyEntry.name }}
      </span>
    </v-card>
  </div>
</template>

<script lang="ts">
import * as d3 from 'd3'
import { CuentHistorical, ModHistory } from '../views/History.vue'
import { Vue, Component, Prop } from 'vue-property-decorator'

const scaleRange = d3.scaleLog().domain([0.1, 1e12]).range([0, 100])
const scaleLog = scaleRange.base(2) //.nice()
const getSX = (v: number) => Math.max(0, scaleLog(v))
const setSX = (v: number) => scaleLog.invert(v)

function drawGradient(
  ctx: CanvasRenderingContext2D | undefined,
  list: CuentHistorical[]
) {
  if (!ctx) return

  list.forEach(({ pos, power, width }) => {})
  // Create gradient
  var grd = ctx.createLinearGradient(0, 0, 200, 0)
  grd.addColorStop(0, 'red')
  grd.addColorStop(1, 'white')

  // Fill with gradient
  ctx.fillStyle = grd
  ctx.fillRect(10, 10, 150, 80)
}

@Component
export default class HistoryEntry extends Vue {
  @Prop({ default: {} }) historyEntry!: ModHistory

  private ctx?: CanvasRenderingContext2D
  private canvas?: HTMLCanvasElement

  get from() {
    return getSX(this.historyEntry.from)
  }

  get to() {
    return getSX(this.historyEntry.to)
  }

  get width() {
    return Math.max(1, this.to - this.from)
  }

  get h() {
    return Math.abs(((this.historyEntry.name ?? '') as any).hashCode()) % 256
  }

  created() {
    window.addEventListener('resize', this.setCanvasSize)
  }
  destroyed() {
    window.removeEventListener('resize', this.setCanvasSize)
  }
  setCanvasSize() {
    const c = this.canvas
    if (!c) return
    var rect = (c.parentNode as any).parentNode.getBoundingClientRect()
    c.width = rect.width
    c.height = rect.height

    // drawGradient(this.ctx, this.historyEntry.list)
  }

  mounted() {
    this.$nextTick(() => {
      console.log('REF>> ', this.$refs.ctx)
      this.canvas = this.$refs.ctx as HTMLCanvasElement
      const ctx = this.canvas.getContext('2d')
      if (ctx) this.ctx = ctx
      this.setCanvasSize()
    })
  }
}
</script>
