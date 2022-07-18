import * as d3 from 'd3'
import type { GraphCallbacks, LinkDatum, NodeDatum, SVGSelection } from '.'
import { makeGraph } from '.'

let simulation: d3.Simulation<NodeDatum, LinkDatum> | undefined

type LinkStyle = (l: LinkDatum, deph: number) => void
interface StyleCallbacks {
  defaultLink: (l: LinkDatum) => void
  inputLink: LinkStyle
  outputLink: LinkStyle
}

export function makeGraphTree(
  svg: SVGSelection,
  items: NodeDatum[],
  callbacks: GraphCallbacks = {},
) {
  let links: CurvedLinks | StraightLinks

  const moreCallbacks: GraphCallbacks = {
    ...callbacks,
    dragstarted(d) { simulation?.alphaTarget(0.3).restart(); callbacks.dragstarted?.(d) },
    dragended(d) { simulation?.alphaTarget(0); callbacks.dragended?.(d) },
    mouseover(d) { links.mouseover(d); callbacks.mouseover?.(d) },
    mouseout(d) { links.mouseout(); callbacks.mouseout?.(d) },
  }
  const selectors = makeGraph(items, svg, moreCallbacks)
  const { fX, fSize, fUsab, vizHeight, diffSize, fStroke } = selectors

  const linkContainer = selectors.container
    .append('g')
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

  function highlitedLink(l: LinkDatum, deph: number) {
    l.d3node?.attr('stroke-width', (fStroke(l) * 3) / deph + 1)
  }
  const styleCallbacks: StyleCallbacks = {
    defaultLink: (l: LinkDatum) => {
      l.d3node?.attr('stroke-width', 1).attr('stroke', '#555')
    },
    inputLink: (l: LinkDatum, deph: number) => {
      highlitedLink(l, deph)
      l.d3node?.attr('stroke', '#7f7')
    },
    outputLink: (l: LinkDatum, deph: number) => {
      highlitedLink(l, deph)
      l.d3node?.attr('stroke', '#38f')
    },
  }

  if (opts.showLinks) {
    links = opts.showCurvedLinks
      ? new CurvedLinks(linkContainer, styleCallbacks, graphLinks)
      : new StraightLinks(linkContainer, styleCallbacks, graphLinks)
  }
  else {
    links = new SingleLinks(linkContainer, styleCallbacks)
  }

  function ticked() {
    links?.ticked()
    selectors.nodes.attr('transform', d => `translate(${d.x},${d.y})`)
  }
  ticked()
}

class Highliter {
  private timeoutID?: number
  private current: NodeDatum[] = []
  private all = new Set<LinkDatum>()
  private currDeph = 0
  private towardsOutputs = false

  constructor(private stylesCallbacks: StyleCallbacks) {}

  highlite = (d: NodeDatum) => {
    this.reset()
    this.timeoutID = setInterval(this.nextStep, 100, d) as unknown as number
  }

  reset = () => {
    this.currDeph = 0
    for (const l of this.all)
      this.stylesCallbacks.defaultLink(l)

    this.all.clear()
    clearInterval(this.timeoutID)
  }

  private nextStep = (center: NodeDatum) => {
    if (!this.current.length)
      this.current.push(center)
    this.currDeph++

    const newSet = new Set<NodeDatum>()
    for (const d of this.current) {
      if (!d) continue
      for (const l of this.getLinksArray(d)) {
        if (!l.d3node || this.all.has(l)) continue
        newSet.add(l.source)
        this.all.add(l)

        this.getStyleFnc()(l, this.currDeph)
      }
    }

    // No more links highlited - remove timeout
    if (!newSet.size) {
      if (!this.towardsOutputs) {
        this.towardsOutputs = true
        this.current = [center]
      }
      else {
        clearInterval(this.timeoutID)
      }
    }
    else {
      this.current = [...newSet.values()]
    }
  }

  private getLinksArray = (d: NodeDatum): Set<LinkDatum> => {
    return this.towardsOutputs
      ? d.mainInputs
      : d.mainOutputs
  }

  private getStyleFnc = () => {
    return this.towardsOutputs
      ? this.stylesCallbacks.outputLink
      : this.stylesCallbacks.inputLink
  }
}

class StraightLinks {
  sel!: d3.Selection<any, LinkDatum, any, any>
  highliter: Highliter

  constructor(
    protected linkContainer: SVGSelection,
    stylesCallbacks: StyleCallbacks,
    graphLinks?: LinkDatum[],
  ) {
    if (graphLinks)
      this.init(graphLinks)
    this.highliter = new Highliter(stylesCallbacks)
  }

  public ticked = () => {
    this.sel
      ?.attr('x1', d => d.source?.x ?? 0)
      .attr('y1', d => d.source?.y ?? 0)
      .attr('x2', d => d.target?.x ?? 0)
      .attr('y2', d => d.target?.y ?? 0)
  }

  public mouseover = (d: NodeDatum) => {
    this.highliter.highlite(d)
  }

  public mouseout = () => {
    this.highliter.reset()
  }

  protected init = (links: LinkDatum[]) => {
    this.sel = this.linkContainer
      .attr('stroke', '#555')
      .attr('stroke-width', 1)
      .selectAll('line')
      .data(links)
      .join('line')
    this.createBackRefs()
  }

  protected createBackRefs = () => {
    this.sel.each(function (ld) {
      // eslint-disable-next-line @typescript-eslint/no-invalid-this
      const d3node = d3.select(this)
      ld.d3node = d3node
      // ;(ld.flipped as LinkDatum).d3node = d3node
    })
  }
}

class SingleLinks extends StraightLinks {
  public mouseover = (d: NodeDatum) => {
    const comboLinks = [
      ...(d.mainInputs),
      ...(d.mainOutputs),
    ]
    this.sel = this.linkContainer
      .attr('stroke-width', 3)
      .selectAll('line')
      .data(comboLinks)
      .join('line')

    this.createBackRefs()
    this.highliter.highlite(d)
  }
}

class CurvedLinks extends StraightLinks {
  static linkArc = (d: LinkDatum) => {
    const r = Math.hypot(d.target.x ?? 0 - (d.source.x ?? 0), d.target.y ?? 0 - (d.source.y ?? 0))
    return `
      M${d.source.x},${d.source.y}
      A${r},${r} 0 0,1 ${d.target.x},${d.target.y}
      `
  }

  public ticked = () => {
    this.sel.attr('d', CurvedLinks.linkArc)
  }

  protected init = (links: LinkDatum[]) => {
    this.sel = this.linkContainer
      .attr('fill', 'none')
      .selectAll('path')
      .data(links)
      .join('path')
      .attr('stroke-width', 1)
      .attr('stroke', '#555')
    this.createBackRefs()
  }
}
