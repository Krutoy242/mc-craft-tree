import * as d3 from "d3";
import { add } from "numeral";
import { Constituent } from "./Constituent";
import { globalTree } from "./ConstituentTree";
import { AnySelection, LinkDatum, makeGraph, NodeDatum } from "./graph";
import { RecipeLink } from "./RecipeLink";

let simulation: d3.Simulation<NodeDatum, LinkDatum>
type LinkStyle = (l: LinkDatum, deph: number)=>void
interface StyleCallbacks {
  defaultLink: (l: LinkDatum)=>void,
  inputLink: LinkStyle,
  outputLink: LinkStyle,
}

function forceUpdate() {
  let next = 1
  return function (i:any, nodes:any) {
    let curr = Math.floor(20 * Math.log(i))
    if (curr !== next) {
      next = curr
      return true
    }
    return false
  }
}

//! const forceManyBodyReuse = (d3 as any).forceManyBodyReuse().update(forceUpdate)

export function makeGraphTree(
  svg: AnySelection,
  vue: { selectedNode: NodeDatum }
) {

  //  ❓❓❓ To filter or not to filter
  const pile = globalTree.makeFilteredPile(c => c.inputsAmount > 0 || c.outputsAmount > 0)
  const graphNodes = pile.list

  let links: CurvedLinks | StraightLinks
  
  const selectors = makeGraph(pile, svg, {
    dragstarted(d,e) { simulation?.alphaTarget(0.3).restart() },
    dragended  (d,e) { simulation?.alphaTarget(0) },
    mouseover  (d,e) { 
      links.mouseover(d)
      vue.selectedNode = d
    },
    mouseout   (d,e) { links.mouseout(d) },
  })
  const {fX, fSize, fUsab, vizHeight, diffSize, fStroke} = selectors

  const linkContainer = selectors.container
    .append('g').attr('class', 'linksLayer')

  // Dispose previous
  if (simulation) {
    simulation.on('tick', null).stop()
    // selection.on(".drag", null);
  }
  const opts = {
    showLinks:       graphNodes.length < 500,
    showCurvedLinks: graphNodes.length < 100,
    useReuse:        graphNodes.length > 500,
  }

  // ====================================================
  // Layout
  // ====================================================
  simulation = d3.forceSimulation(graphNodes as NodeDatum[])
    //! .force('charge', (opts.useReuse ? forceManyBodyReuse : d3.forceManyBody()).strength(-2000))
    .force('charge', d3.forceManyBody().strength(-2000))
    .force('x', d3.forceX(fX).strength(1))
    .force('y', d3.forceY(vizHeight / 2).strength(d => fUsab(d as any) + 1))
    .force('collision', d3.forceCollide().radius(fSize as any).strength(0.75))
    .on('tick', ticked) as any

  // ====================================================
  // Links
  // ====================================================

  // Connect graph nodes
  const graphLinks: LinkDatum[] = []
  for(const c of graphNodes) {
    for(const l of c.recipes.mainHolder?.inputs ?? []) {
      graphLinks.push({
        source: l.from,
        target: l.to,
        ...l as any
      })
    }
  }

  simulation
    .force('link', 
      d3.forceLink(graphLinks)
      .distance(diffSize/2)
      .strength(1)
    )

  function highlitedLink(l: LinkDatum, deph: number) {
    l.d3node.attr('stroke-width', fStroke(l) * 3 / (deph) + 1)
  }
  const styleCallbacks: StyleCallbacks = {
    defaultLink: (l: LinkDatum) => {
      l.d3node
        .attr('stroke-width', 1)
        .attr('stroke', '#555')
    },
    inputLink  : (l: LinkDatum, deph: number) => {
      highlitedLink(l, deph)
      l.d3node.attr('stroke', '#7f7')
    },
    outputLink : (l: LinkDatum, deph: number) => {
      highlitedLink(l, deph)
      l.d3node.attr('stroke', '#38f')
    },
  }
  
  if (opts.showLinks) {
    links = opts.showCurvedLinks
      ? new CurvedLinks  (linkContainer, graphLinks, styleCallbacks)
      : new StraightLinks(linkContainer, graphLinks, styleCallbacks)
  } else {
    links = new SingleLinks(linkContainer, graphLinks, styleCallbacks)
  }



  function ticked() {
    links?.ticked()
    selectors.nodes.attr('transform', d=>`translate(${d.x},${d.y})`)
  }
  ticked()
}

class Highliter {
  private timeoutID?: number
  private current!: NodeDatum[]
  private all = new Set<LinkDatum>()
  private currDeph = 0
  private towardsOutputs = false

  constructor(private stylesCallbacks: StyleCallbacks) {}

  private nextStep(center: NodeDatum) {
    this.current ??= [center]
    this.currDeph++

    const newSet = new Set<NodeDatum>()
    for(const d of this.current) {

      for(const l of this.getLinksArray(d)) {
        if(!l.d3node || this.all.has(l)) continue
        newSet.add(l.from as NodeDatum)
        this.all.add(l)

        this.getStyleFnc()(l, this.currDeph)
      }
    }

    // No more links highlited - remove timeout
    if(!newSet.size) {
      if(!this.towardsOutputs) {
        this.towardsOutputs = true
        this.current = [center]
      }
      else {
        clearInterval(this.timeoutID)
      }
    } else {
      this.current = [...newSet.values()]
    }
    
  }

  private getLinksArray(d: NodeDatum) {
    return (this.towardsOutputs 
      ? d.recipes.mainHolder?.inputs
      : d.recipes.mainHolder?.outputs) as LinkDatum[] ?? []
  }

  private getStyleFnc() {
    return (this.towardsOutputs 
      ? this.stylesCallbacks.outputLink
      : this.stylesCallbacks.inputLink)
  }

  highlite(d: NodeDatum) {
    this.reset()
    this.timeoutID = setInterval(this.nextStep, 100, d) as unknown as number
  }

  reset() {
    this.currDeph = 0
    for(const l of this.all) {
      this.stylesCallbacks.defaultLink(l)
    }
    this.all.clear()
    clearInterval(this.timeoutID)
  }
}


class StraightLinks {
  sel!: d3.Selection<any, LinkDatum, any, any>
  highliter: Highliter

  constructor(
    protected linkContainer: AnySelection,
    protected graphLinks: LinkDatum[],
    stylesCallbacks: StyleCallbacks
  ) {
    this.init()
    this.highliter = new Highliter(stylesCallbacks)
  }

  protected init() {
    this.sel = this.linkContainer
      .attr('stroke', '#555')
      .attr('stroke-width', 1)
      .selectAll('line')
      .data(this.graphLinks)
      .join('line') as any
    this.createBackRefs()
  }

  protected createBackRefs() {
    this.sel.each(function(ld) {
      const d3node = d3.select(this) as any
      ld.d3node = d3node
      ;(ld.flipped as LinkDatum).d3node = d3node
    })
  }

  public ticked() {
    this.sel
      ?.attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y)
  }

  public mouseover(d: NodeDatum) {
    this.highliter.highlite(d)
  }

  public mouseout(d: NodeDatum) { 
    this.highliter.reset()
  }
}

class SingleLinks extends StraightLinks {
  protected init() {
    
  }

  public mouseover(d: NodeDatum) {
    const comboLinks = [
      ...d.recipes.mainHolder?.inputs??[],
      ...d.recipes.mainHolder?.outputs??[]
    ]
    this.sel = this.linkContainer
      .attr('stroke-width', 3)
      .selectAll('line')
      .data(comboLinks)
      .join('line') as any

    this.createBackRefs()
    super.mouseover(d)
  }
}

class CurvedLinks extends StraightLinks {


  protected init() {
    this.sel = this.linkContainer
      .attr('fill', 'none')
      .selectAll('path')
      .data(this.graphLinks)
      .join('path')
      .attr('stroke-width', 1)
      .attr('stroke', '#555')
    this.createBackRefs()
  }

  public ticked() {
    this.sel.attr('d', CurvedLinks.linkArc)
  }

  static linkArc(d: LinkDatum) {
    const r = Math.hypot(d.target.x - d.source.x, d.target.y - d.source.y)
    return `
      M${d.source.x},${d.source.y}
      A${r},${r} 0 0,1 ${d.target.x},${d.target.y}
      `
  }
}
