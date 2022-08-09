import * as d3 from 'd3'
import type { StyleCallbacks } from './simulation'
import type { LinkDatum, NodeDatum, SVGSelection } from '.'

export class Links {
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
    // this.highliter.reset()
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
      ld.d3node = d3.select(this)
    })
  }
}

export class SingleLinks extends Links {
  public mouseover = (d: NodeDatum) => {
    this.init([...d.mainInputs, ...d.mainOutputs])
    this.highliter.highlite(d)
  }
}

export class CurvedLinks extends Links {
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

class Highliter {
  private timeoutID?: ReturnType<typeof setInterval>
  private currDeph = 0
  private outputIndex = 0
  private all: LinkDatum[] = []
  private instant = true

  constructor(private stylesCallbacks: StyleCallbacks) {}

  /** Begin animaton */
  highlite = (d: NodeDatum) => {
    this.reset()
    this.all = [...new Set([...d.mainInputs, ...d.mainOutputs])]
    this.outputIndex = d.mainInputs.size
    if (this.instant) {
      this.all.forEach(d => this.styleSingle(d))
    }
    else {
      this.all.forEach(d => this.stylesCallbacks.defaultLink(d))
      this.timeoutID = setInterval(this.nextStep, 5)
    }
  }

  /** Reset animation */
  reset = () => {
    this.currDeph = 0
    clearInterval(this.timeoutID)
  }

  private nextStep = () => {
    const currLink = this.all?.[this.currDeph]

    // No more links highlited - remove timeout
    if (!currLink) {
      clearInterval(this.timeoutID)
      return
    }

    this.styleSingle(currLink)
  }

  private styleSingle(currLink: LinkDatum) {
    const towardsOutputs = Number(this.currDeph >= this.outputIndex) as 0 | 1
    const styleFnc = ([this.stylesCallbacks.inputLink, this.stylesCallbacks.outputLink] as const)[towardsOutputs]
    styleFnc(currLink, this.currDeph)
    this.currDeph++
  }
}
