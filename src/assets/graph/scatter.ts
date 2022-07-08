import * as d3 from 'd3'

import type { Item } from '../items/Item'
import type { NodeDatum, SVGSelection } from '.'
import { makeGraph } from '.'

export function makeScatter(svg: SVGSelection, items: Item[]) {
  // Scatter functions
  const scaleRange = d3.scaleLog().domain([0.1, 1e12]).range([0, 10000])
  const scaleLog = scaleRange.base(10).nice()
  const scaleTap = scaleRange.base(100).nice()
  const getSX = (v: number) => scaleLog(v)
  const setSX = (v: number) => scaleLog.invert(v)

  const ghostMap = new Map<number, Item>()
  items.forEach((item) => {
    const n = scaleTap(item.complexity)
    if (!ghostMap.has(n)) {
      ghostMap.set(n, item)
      return ((item as any).isGhost = true)
    }
  })

  let globalScale = 1

  const selectors = makeGraph(items, svg, {
    zoom(e) {
      const newScale = 1 / e.transform.k
      if (globalScale !== newScale)
        globalScale = newScale
    },
    isGhost(d) {
      return !!d.isGhost
    },
    dragended(_d) {
      // TODO: Handle drag
      // link.from.recalculateField('cost')
      // updateNodeX(link.from as NodeDatum)
    },
    dragged(d, e) {
      d.x = e.x
      d.y = e.y
      d.complexity = d.cost = setSX(d.x ?? 0)
      d.d3node?.attr(
        'transform',
        `translate(${d.x},${d.y})scale(${globalScale})`,
      )
    },
  })

  selectors.container
    .append('g')
    .attr('class', 'x axis')
    .attr('transform', 'translate(0,-20)')
    .call(d3.axisTop(scaleLog).ticks(20, '.2s'))

  function updateNodeX(c: NodeDatum) {
    c.x = getSX(c.complexity)
    c.d3node?.attr('transform', `translate(${c.x},${c.y})`)
  }

  // Adjust starting positions
  const xObjs = new Map<number, number>()

  selectors.nodes.each((d) => {
    const x = d.x ?? 0
    const yStack = xObjs.get(x) ?? 0
    d.y = yStack * 20
    updateNodeX(d)
  })
}
