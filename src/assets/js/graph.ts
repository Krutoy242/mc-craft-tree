import * as d3 from 'd3'
import { D3ZoomEvent } from 'd3'
import { CombinedVueInstance } from 'vue/types/vue'

import Constituent from './cuents/Constituent.js'
import { GraphPile } from './cuents/Pile.js'
import RecipeLink from './recipes/RecipeLink.js'

export interface NodeDatum extends d3.SimulationNodeDatum, Constituent {
  x: number
  y: number
  isGhost: boolean
  d3node: d3.Selection<d3.BaseType, unknown, null, undefined>
}
export interface LinkDatum
  extends d3.SimulationLinkDatum<NodeDatum>,
    RecipeLink {
  source: NodeDatum
  target: NodeDatum
  d3node: d3.Selection<d3.EnterElement, unknown, null, undefined>
}

export type AnySelection = d3.Selection<any, unknown, any, unknown>

// let svg           : d3.Selection<d3.BaseType, unknown, HTMLElement, unknown>
// let container     : AnySelection
// let linkContainer : AnySelection
// let nodeContainer : AnySelection
// let axisContainer : AnySelection
// let simulation    : d3.Simulation<NodeDatum, LinkDatum>

let vue: CombinedVueInstance<
  Vue,
  unknown,
  unknown,
  unknown,
  Readonly<Record<any, any>>
>

type NavigDatumFnc = (d: NodeDatum, isRightClick: boolean) => void
let navig: NavigDatumFnc

export function initGraph(_vue: any, _navig: NavigDatumFnc) {
  vue = _vue
  navig = _navig
}

export function makeGraph(
  pile: GraphPile,
  svg: AnySelection,
  cb: {
    click?: (d: NodeDatum, isRight: boolean) => void
    zoom?: (e: D3ZoomEvent<any, any>) => void
    isGhost?: (d: NodeDatum, e: any) => boolean
    dragstarted?: (d: NodeDatum, e: any) => void
    dragended?: (d: NodeDatum, e: any) => void
    dragged?: (d: NodeDatum, e: any) => void
    mouseover?: (d: NodeDatum, e: any) => void
    mouseout?: (d: NodeDatum, e: any) => void
  }
) {
  svg.selectAll('*').remove()
  const container = svg.append('g')

  const graphNodes = pile.list as NodeDatum[]

  // ====================================================
  // Math functions
  // ====================================================
  const minSize = 20
  const maxSize = Math.floor(graphNodes.length / 9)
  const diffSize = maxSize - minSize
  const vizWidth = svg.node()?.getBoundingClientRect().width ?? 400
  const vizHeight = svg.node()?.getBoundingClientRect().height ?? 200

  const fNonlinear = Math.sqrt
  const fStroke = (c: LinkDatum) => fNonlinear(fNonlinear(c.weight))
  const fComp = (c: NodeDatum) =>
    fNonlinear(pile.info.cLimits.importancy(c.complexity))
  const fUsab = (c: NodeDatum) =>
    fNonlinear(pile.info.uLimits.importancy(c.usability))
  const fX = (d: NodeDatum) =>
    vizWidth / 2 + fComp(d) * diffSize * 20 - fUsab(d) * diffSize * 20
  const fSize = (c: NodeDatum) => {
    const size = ((fComp(c) + fUsab(c)) / 2) * maxSize + minSize
    const result = Math.max(minSize, Math.min(maxSize, size))
    return isNaN(result) ? 10 : result
  }

  // ====================================================
  // Nodes
  // ====================================================
  const nodes = container
    .append('g')
    .selectAll('g')
    .data(graphNodes)
    .join(appendNode, updateNode)

  function appendNode(d3Selection: any) {
    return updateNode(
      d3Selection
        .append('g')
        .style('cursor', (d: NodeDatum) => (d.isGhost ? undefined : 'pointer'))
        .attr('opacity', (d: NodeDatum) => (d.isGhost ? 0.1 : undefined))
        .call((s: any) => s.append('circle'))
        .call((s: any) => s.append('svg').append('image'))
    )
  }

  function updateNode(d3Selection: any) {
    d3Selection
      .select('circle')
      .attr('r', fSize)
      .attr('stroke-width', (d: NodeDatum) => fUsab(d) * 10 + 1)
      .attr('stroke', '#fff')
      .attr('fill', (d: NodeDatum) => {
        return d.inputsAmount === 0
          ? 'rgba(67, 113, 165, 0.3)'
          : d.outputsAmount === 0
          ? 'rgba(0, 145, 7, 0.4)'
          : '#111'
      })

    d3Selection
      .select('svg')
      .attr('height', (d: NodeDatum) => fSize(d) * 2 * 0.9)
      .attr('width', (d: NodeDatum) => fSize(d) * 2 * 0.9)
      .attr('x', (d: NodeDatum) => -fSize(d) * 0.9)
      .attr('y', (d: NodeDatum) => -fSize(d) * 0.9)
      .attr('viewBox', (d: NodeDatum) => d.viewBox)
      .select('image')
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      .attr('xlink:href', require('@/assets/spritesheet.png'))
      .attr('image-rendering', 'pixelated')

    return d3Selection
  }

  nodes.each(function (d, i) {
    d.d3node = d3.select(this) // Current ONE node
  })

  // ====================================================
  // Events
  // ====================================================

  // Zoom
  const zoom = d3
    .zoom()
    .scaleExtent([0.01, 10])
    .on('zoom', (e) => {
      container.attr('transform', e.transform)
      cb.zoom?.(e)
    })
  svg.call(zoom as any)

  // ====================================================
  // Node dragging
  // ====================================================
  nodes
    .on('click', (e, d) => {
      navig(d, false)
      cb.click?.(d, false)
    })
    .on('contextmenu', (e, d) => {
      navig(d, true)
      e.preventDefault()
      cb.click?.(d, true)
    })
    .on('mouseover', (e, d) => {
      ;(vue as any).selectedNode = d
      cb.mouseover?.(d, e)
    })
    .on('mouseout', (e, d) => cb.mouseout?.(d, e))
    .call(
      d3
        .drag<any, NodeDatum>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended)
    )

  function dragstarted(e: any, d: NodeDatum) {
    e.sourceEvent.stopPropagation()
    if (!e.active) cb.dragstarted?.(d, e)
    d.fx = d.x
    d.fy = d.y
  }

  function dragged(e: any, d: NodeDatum) {
    if (cb.isGhost?.(d, e)) return
    cb.dragged?.(d, e)
    d.fx = e.x
    d.fy = e.y
  }

  function dragended(e: any, d: NodeDatum) {
    if (!e.active) cb.dragended?.(d, e)
    d.fx = null
    d.fy = null
  }

  return {
    container,
    nodes,

    fNonlinear,
    fComp,
    fUsab,
    fX,
    fStroke,
    fSize,
    vizWidth,
    vizHeight,
    diffSize,
  }
}
