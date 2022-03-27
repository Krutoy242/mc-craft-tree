import * as d3 from 'd3'
import { Constituent } from './cuents/Constituent'
import { globalTree } from './cuents/ConstituentTree'
import { AnySelection, makeGraph, NodeDatum } from './graph'

export function makeScatter(svg: AnySelection) {
  // Scatter functions
  const scaleRange = d3.scaleLog().domain([0.1, 1e12]).range([0, 10000])
  const scaleLog = scaleRange.base(10).nice()
  const scaleTap = scaleRange.base(100).nice()

  const ghostMap = new Map<number, Constituent>()
  const pile = globalTree.makeFilteredPile((c) => {
    if (c.inputsAmount === 0) return true
    const n = scaleTap(c.complexity)
    if (!ghostMap.has(n)) {
      ghostMap.set(n, c)
      return ((c as any).isGhost = true)
    }
    return false
  })

  let globalScale = 1

  const selectors = makeGraph(pile, svg, {
    zoom(e) {
      const newScale = 1 / e.transform.k
      if (globalScale !== newScale) {
        globalScale = newScale
      }
    },
    isGhost(d, e) {
      return d.isGhost
    },
    dragended(d, e) {
      d.dive('outputs', (c) => {
        // TODO: Handle drag
        // link.from.recalculateField('cost')
        // updateNodeX(link.from as NodeDatum)
      })
    },
    dragged(d, e) {
      d.x = e.x
      d.y = e.y
      d.complexity = d.cost = setSX(d.x)
      d.d3node.attr('transform', `translate(${d.x},${d.y})scale(${globalScale})`)
    },
  })

  const getSX = (v: number) => scaleLog(v)
  const setSX = (v: number) => scaleLog.invert(v)

  selectors.container
    .append('g')
    .attr('class', 'x axis')
    .attr('transform', 'translate(0,-20)')
    .call(d3.axisTop(scaleLog).ticks(20, '.2s'))

  function updateNodeX(c: NodeDatum) {
    c.x = getSX(c.complexity)
    c.d3node.attr('transform', `translate(${c.x},${c.y})`)
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
