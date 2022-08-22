import * as d3 from 'd3'
import type { D3ZoomEvent } from 'd3'
import type { Link } from '../items/Link'
import type { Item } from '../items/Item'

export interface NodeDatum extends d3.SimulationNodeDatum, Item {

  isGhost?: boolean
  d3node?: d3.Selection<d3.BaseType, unknown, null, undefined>
}

export interface LinkDatum
  extends d3.SimulationLinkDatum<NodeDatum>,
  Link<NodeDatum> {
  source: NodeDatum
  target: NodeDatum
  d3node?: d3.Selection<d3.EnterElement, unknown, null, undefined>
}

export type SVGSelection = d3.Selection<SVGGElement, unknown, SVGGElement, unknown>

export interface GraphCallbacks {
  click?: (d: NodeDatum, isRight: boolean) => void
  zoom?: (e: D3ZoomEvent<any, any>) => void
  isGhost?: (d: NodeDatum, e?: any) => boolean
  dragstarted?: (d: NodeDatum, e?: any) => void
  dragended?: (d: NodeDatum, e?: any) => void
  dragged?: (d: NodeDatum, e?: any) => void
  mouseover?: (d: NodeDatum, e?: any) => void
  mouseout?: (d: NodeDatum, e?: any) => void
}

export function makeGraph(
  items: NodeDatum[],
  svg: SVGSelection,
  cb: GraphCallbacks,
) {
  svg.selectAll('*').remove()
  const container = svg.append('g')
  const graphNodes = items as NodeDatum[]

  // ====================================================
  // Math functions
  // ====================================================
  const minSize = 20
  const maxSize = Math.floor(graphNodes.length / 9)
  const diffSize = maxSize - minSize
  const vizWidth = svg.node()?.getBoundingClientRect().width ?? 400
  const vizHeight = svg.node()?.getBoundingClientRect().height ?? 200

  const getImportancy = (field: keyof NodeDatum) => {
    const r = items.map(i => i[field] as number)
    const min = Math.min(...r)
    const max = Math.max(1, ...r)
    return (v: number) => (v - min) / max
  }
  const importancyComp = getImportancy('complexity')
  const importancyUsab = getImportancy('usability')

  const fNonlinear = (x: number) => x ** 0.5
  const fStroke = (x: number) => fNonlinear(fNonlinear(x))
  const fComp = (c: NodeDatum) => fNonlinear(importancyComp(c.complexity))
  const fUsab = (c: NodeDatum) => fNonlinear(importancyUsab(c.usability))
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

  function appendNode(d3Selection: d3.Selection<d3.EnterElement, NodeDatum, SVGGElement, unknown>) {
    return updateNode(
      d3Selection
        .append('g')
        .style('cursor', d => (d.isGhost ? null : 'pointer'))
        .attr('opacity', d => (d.isGhost ? 0.1 : null))
        .call(s => s.append('circle'))
        .call(s => s/* .append('svg') */.append('image')),
    )
  }

  function updateNode(d3Selection: d3.Selection<any, NodeDatum, SVGGElement, unknown>) {
    d3Selection
      .select('circle')
      .attr('r', fSize)
      .attr('stroke-width', d => fUsab(d) * 10 + 1)
      .attr('stroke', d => d.popularity > 0 ? '#f90' : '#fff')
      .attr('fill', d =>
        d.inputsAmount === 0
          ? 'rgba(67, 113, 165, 0.3)'
          : d.outputsAmount === 0
            ? 'rgba(0, 145, 7, 0.4)'
            : '#111',
      )

    d3Selection
      // .select('svg')
      .select('image')
      .attr('x', d => -fSize(d) * 0.9)
      .attr('y', d => -fSize(d) * 0.9)
      // .attr('viewBox', d => d.viewBox ?? null)
      .attr('height', d => fSize(d) * 2 * 0.9)
      .attr('width', d => fSize(d) * 2 * 0.9)
      .attr('xlink:href', d => d.href)
      .attr('image-rendering', 'pixelated')

    return d3Selection
  }

  nodes.each(function (d) {
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
      cb.click?.(d, false)
    })
    .on('contextmenu', (e, d) => {
      e.preventDefault()
      cb.click?.(d, true)
    })
    .on('mouseover', (e, d) => {
      cb.mouseover?.(d, e)
    })
    .on('mouseout', (e, d) => cb.mouseout?.(d, e))
    .call(
      d3
        .drag<any, NodeDatum>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended),
    )

  function dragstarted(e: any, d: NodeDatum) {
    e.sourceEvent.stopPropagation()
    if (!e.active)
      cb.dragstarted?.(d, e)
    d.fx = d.x
    d.fy = d.y
  }

  function dragged(e: any, d: NodeDatum) {
    if (cb.isGhost?.(d, e))
      return
    cb.dragged?.(d, e)
    d.fx = e.x
    d.fy = e.y
  }

  function dragended(e: any, d: NodeDatum) {
    if (!e.active)
      cb.dragended?.(d, e)
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
