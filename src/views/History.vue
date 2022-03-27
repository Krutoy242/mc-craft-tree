<template>
  <div class="ma-0">
    <div>
      <history-entry v-for="(historyEntry, i) in history" :key="i" :history-entry="historyEntry" />
    </div>
  </div>
</template>

<script lang="ts">
import _ from 'lodash'
import { Vue, Component, Prop } from 'vue-property-decorator'
import { globalTree } from '../assets/js/cuents/ConstituentTree'
import { GlobalPile, GraphPile } from '../assets/js/cuents/Pile'
import HistoryEntry from '../components/HistoryEntry.vue'

export interface CuentHistorical {
  pos: number
  power: number
  width: number
}

export interface ModHistory {
  name: string
  from: number
  to: number
  list: CuentHistorical[]
}

@Component
export default class History extends Vue {
  components = { HistoryEntry }
  name = 'History'

  data() {
    return {
      history: {
        type: Object as () => ModHistory[],
        required: true,
        default: [],
      },
    }
  }

  @Prop({ default: {} }) pile?: GraphPile

  updateGraph(toQuery?: any): void {
    const q = toQuery ?? (this as any).$route.query
    const pile = globalTree.makePile(
      q.id ?? 'storagedrawers:upgrade_creative:1',
      q.isRightClick ?? false,
      (c) => c.usability > 0 && c.complexity > 0
    )
    // const pile = globalTree.getWholePile()

    const modMap: Record<string, CuentHistorical[]> = {}
    pile.list.forEach((c) => {
      ;(modMap[c.base.source] ??= []).push({
        pos: c.complexity,
        power: c.usability,
        width: c.steps,
      })
    })

    const newHistory: ModHistory[] = []
    Object.entries(modMap).forEach(([mod, ch_list]) =>
      newHistory.push({
        name: mod,
        from: _.minBy(ch_list, 'pos')!.pos,
        to: _.maxBy(ch_list, 'pos')!.pos,
        list: ch_list,
      })
    )

    newHistory.sort((a, b) => a.from - b.from)
    ;(this as any).history = newHistory
    console.log('history :>> ', newHistory)
  }

  beforeRouteUpdate(to: any, from: any, next: any) {
    this.updateGraph(to.query)
    next()
  }

  mounted() {
    this.updateGraph()
  }
}
</script>
