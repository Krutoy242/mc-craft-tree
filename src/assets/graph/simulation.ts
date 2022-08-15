import * as d3 from 'd3'
import { CurvedLinks, Links, SingleLinks } from './Links'
import type { GraphCallbacks, LinkDatum, NodeDatum, SVGSelection } from '.'
import { makeGraph } from '.'

let simulation: d3.Simulation<NodeDatum, LinkDatum> | undefined

type LinkStyle = (l: LinkDatum, deph: number) => void
export interface StyleCallbacks {
  defaultLink: (l: LinkDatum) => void
  inputLink: LinkStyle
  outputLink: LinkStyle
}

export function makeGraphTree(
  svg: SVGSelection,
  items: NodeDatum[],
  callbacks: GraphCallbacks = {},
) {
  let links: Links

  const moreCallbacks: GraphCallbacks = {
    ...callbacks,
    dragstarted(d) { simulation?.alphaTarget(0.3).restart(); callbacks.dragstarted?.(d) },
    dragended(d) { simulation?.alphaTarget(0); callbacks.dragended?.(d) },
    mouseover(d) { links.mouseover(d); links.ticked(); callbacks.mouseover?.(d) },
    mouseout(d) { links.mouseout(); links.ticked(); callbacks.mouseout?.(d) },
  }
  const selectors = makeGraph(items, svg, moreCallbacks)
  const { fX, fSize, fUsab, vizHeight, diffSize, fStroke } = selectors

  const linkContainer = selectors.container
    .insert('g', ':first-child')
    .attr('class', 'linksLayer')

  // Dispose previous
  simulation?.on('tick', null).stop()
  // selection.on(".drag", null);

  const opts = {
    showLinks      : items.length < 500,
    showCurvedLinks: items.length < 100,
    useReuse       : items.length > 500,
  }

  // ====================================================
  // Links
  // ====================================================
  // Connect graph nodes
  const graphLinks: LinkDatum[] = []
  for (const c of items) {
    for (const l of c.mainInputs)
      graphLinks.push(l)
  }

  // ====================================================
  // Layout
  // ====================================================
  simulation = d3
    .forceSimulation(items)
    // ! .force('charge', (opts.useReuse ? forceManyBodyReuse : d3.forceManyBody()).strength(-2000))
    .force('charge', d3.forceManyBody().strength(-2000))
    .force('x', d3.forceX(fX).strength(1))
    .force(
      'y',
      d3.forceY<NodeDatum>(vizHeight / 2).strength(d => fUsab(d) + 1),
    )
    .force(
      'collision',
      d3
        .forceCollide<NodeDatum>()
        .radius(fSize)
        .strength(0.75),
    )
    .force(
      'link',
      d3
        .forceLink(graphLinks)
        .distance(diffSize / 2)
        .strength(1),
    )
    .on('tick', ticked)

  function highlitedLink(l: LinkDatum, deph: number, weight: number) {
    l.d3node?.attr('stroke-width', (fStroke(weight) * 3) / (deph + 1) + 1)
  }
  const styleCallbacks: StyleCallbacks = {
    defaultLink: (l: LinkDatum) => {
      l.d3node?.attr('stroke-width', 1).attr('stroke', '#555')
    },
    inputLink: (l: LinkDatum, deph: number) => {
      highlitedLink(l, deph, l.weight)
      l.d3node?.attr('stroke', '#7f7')
    },
    outputLink: (l: LinkDatum, deph: number) => {
      highlitedLink(l, deph, 1 / l.weight)
      l.d3node?.attr('stroke', '#38f')
    },
  }

  const LinkType = opts.showLinks ? opts.showCurvedLinks ? CurvedLinks : Links : SingleLinks
  links = new LinkType(linkContainer, styleCallbacks, graphLinks)

  function ticked() {
    links?.ticked()
    selectors.nodes.attr('transform', d => `translate(${d.x},${d.y})`)
  }
  ticked()
}
