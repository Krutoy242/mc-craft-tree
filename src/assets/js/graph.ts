import * as d3 from 'd3'
import { EnterElement, SimulationLinkDatum, SimulationNodeDatum } from 'd3'
import * as Vue from 'vue/types/umd'
import { CombinedVueInstance } from 'vue/types/vue'
import { Constituent } from './Constituent.js'
import { applyMouse } from './D3Events.js'
import forceManyBodyReuse from './lib/d3ForcManyBodyReuse.js'
import { RecipeLink } from './RecipeLink.js'
import { GraphPile } from './Types.js'


const vizWidth = window.innerWidth
const vizHeight = window.innerHeight

interface NodeDatum extends d3.SimulationNodeDatum, Constituent {
  isGhost: boolean
  d3node: d3.Selection<d3.BaseType, unknown, null, undefined>
}
interface LinkDatum extends d3.SimulationLinkDatum<NodeDatum>, RecipeLink {}

type AnySelection = d3.Selection<SVGGElement, unknown, HTMLElement, unknown>

let svg           : d3.Selection<d3.BaseType, unknown, HTMLElement, unknown>
let container     : AnySelection
let linkContainer : AnySelection
let nodeContainer : AnySelection
let axisContainer : AnySelection
let simulation    : d3.Simulation<NodeDatum, LinkDatum>


function init() {
  
  svg = d3.select('#viz')
  container = svg.append('g')

  axisContainer = container.append('g')
    .attr('class', 'x axis')
    .attr('transform', 'translate(0,-20)')

  linkContainer = container.append('g').attr('class', 'linksLayer')
  nodeContainer = container.append('g')
}


function linkArc(d) {
  const r = Math.hypot(d.target.x - d.source.x, d.target.y - d.source.y)
  return `
    M${d.source.x},${d.source.y}
    A${r},${r} 0 0,1 ${d.target.x},${d.target.y}
    `
}

function defaultFilter(): GraphPile {
  
  // If no selection provided, select everything, except items without inputs and outputs
  // If scattered, select only nodes without crafts
  if (!graphNodes) {
    if (!isScatter) {
      graphNodes = pile.list.filter(n => {
        if(!n.complexity) console.log('noComplexity :>> ', n)
        return n.inputsAmount > 0 || n.outputsAmount > 0
      })
    } else {
      graphNodes = pile.list.filter(n => {
        if (n.inputsAmount === 0) return true
        if (whitelist.includes(n.name)) {
          n.isGhost = true
          return true
        }
        return false
      })
    }
  }
}


export function makeGraph(
  pile: GraphPile, 
  vue: CombinedVueInstance<Vue,unknown,unknown,unknown,unknown>,
  cb: {
    click: ()=>void
  }
) {
  
  if (!container) init()

  const graphNodes = pile.list as NodeDatum[]


  // ====================================================
  // Math functions
  // ====================================================
  const minSize = 20
  const maxSize = Math.floor(graphNodes.length / 9)
  const diffSize = maxSize - minSize

  const nonLinear  = Math.sqrt
  const compFnc    = (c: NodeDatum) => nonLinear(pile.info.cLimits.importancy(c.complexity))
  const usabFnc    = (c: NodeDatum) => nonLinear(pile.info.uLimits.importancy(c.usability))
  const xFnc       = (d: NodeDatum) => vizWidth/2 + compFnc(d)*diffSize*20 - usabFnc(d)*diffSize*20
  const strokeWfnc = (c: LinkDatum) => nonLinear(nonLinear(c.weight))
  const sizeFnc    = (c: NodeDatum) => {
    const size = (compFnc(c) + usabFnc(c))/2 * maxSize + minSize
    const result = Math.max(minSize, Math.min(maxSize, size))
    return isNaN(result) ? 10 : result
  }


  // ====================================================
  // Nodes
  // ====================================================
  let nodeSelection = nodeContainer
    .selectAll('g')
    .data(graphNodes)
    .join(appendNode, updateNode)

  function appendNode(d3Selection: any) {
    return d3Selection.append('g')
      .style('cursor', (d: NodeDatum) => d.isGhost ? undefined : 'pointer')
      .attr('opacity', (d: NodeDatum) => d.isGhost ? 0.1 : 1)
      .call((s:any)=>s
        .append('circle')
        .append('svg')
        .append('image'))
  }

  function updateNode(update: any) {
    update
      .select('circle')
      .attr('r', sizeFnc)
      .attr('stroke-width', (d: NodeDatum) => usabFnc(d)*10 + 1)
      .attr('stroke', '#fff')
      .attr('fill', (d: NodeDatum) => {
        return d.inputsAmount === 0 ? 'rgba(67, 113, 165, 0.3)' :
          (d.outputsAmount === 0 ? 'rgba(0, 145, 7, 0.4)' :
            '#111')
      })

    update.select('svg')
      .attr('height', (d: NodeDatum) => sizeFnc(d) * 2 * 0.9)
      .attr('width',  (d: NodeDatum) => sizeFnc(d) * 2 * 0.9)
      .attr('x',      (d: NodeDatum) => - sizeFnc(d) * 0.9)
      .attr('y',      (d: NodeDatum) => - sizeFnc(d) * 0.9)
      .attr('viewBox',(d: NodeDatum) => d.viewBox)
      .select('image')
        .attr('xlink:href', require('@/assets/Spritesheet.png'))
        .attr('image-rendering', 'pixelated')

    return update
  }

  nodeSelection.each(function(d, i) {
    d.d3node = d3.select(this) // Current ONE node
  })

  // ====================================================
  // Events
  // ====================================================

  let globalScale = 1
  function nodeT(d) {
    if (isScatter)
      return `translate(${d.x},${d.y})scale(${globalScale})`
    else
      return `translate(${d.x},${d.y})`
  }

  function ticked() {
    if (linkSelection) {
      if (opts.showCurvedLinks) {
        linkSelection.attr('d', linkArc)
      } else {
        linkSelection
          .attr('x1', d => d.source.x)
          .attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x)
          .attr('y2', d => d.target.y)
      }
    }
    
    nodeSelection.attr('transform', nodeT)
  }
  ticked()

  // Zoom
  const zoom = d3.zoom()
    .scaleExtent([.01, 10])
    .on('zoom', function () {
      container.attr('transform', d3.event.transform)

      if (isScatter) {
        const newScale = 1 / d3.event.transform.k
        if (globalScale !== newScale) {
          globalScale = newScale
          ticked()
        }
      }
    })
  svg.call(zoom)


  // ====================================================
  // Node and links highliting
  // ====================================================

  function diveToList(targetNode, targetDeph=999999999, listName, style) {
    const isInput = listName === 'inputs'
    let maxDeph = 0
    
    targetNode.safeDive(listName, {
      afterDive: (link, deph) => {
        const currDeph = 1 + targetDeph - deph
        maxDeph = Math.max(maxDeph, currDeph)

        if (currDeph === targetDeph || targetDeph === 999999999){
          if (link.d3node) {
            if (style)
              style(link.d3node)
            else
              link.d3node
                .attr('stroke-width', strokeWfnc(link) * 3 / (deph) + 1)
                .attr('stroke', isInput ? '#7f7' : '#38f')
          }
        }
      }
    }, null, targetDeph)
    
    return maxDeph
  }

  function unhighliteLine(linkNode) {
    linkNode
      .attr('stroke-width', 1)
      .attr('stroke', '#555')
  }

  function resetLines(node){
    if (vue.selectedNode) {
      diveToList(node, null, 'inputs' , unhighliteLine)
      diveToList(node, null, 'outputs', unhighliteLine)
    }
  }

  let currIntervalID: NodeJS.Timeout

  function drawDive() {

    const inDeph = diveToList(vue.selectedNode, vue.selectedDeph, 'inputs')

    if (vue.selectedDeph > inDeph) {
      const targetDeph = vue.selectedDeph - inDeph
      if (targetDeph > diveToList(vue.selectedNode, targetDeph, 'outputs')) {
        clearInterval(currIntervalID)
      }
    }
    
    vue.selectedDeph += 1
  }

  // ====================================================
  // Node dragging
  // ====================================================

  applyMouse(nodeSelection, {
    click(d,e,rmb) { cb.click?.(d, rmb) },

    isGhost(d,e) { return (d as NodeDatum).isGhost },
    dragstarted(d,e) { simulation?.alphaTarget(0.3).restart() },
    dragended  (d,e) { simulation?.alphaTarget(0) },
    mouseover  (d,e) { 
      if (opts.showLinks) resetLines(vue.selectedNode)

      vue.selectedNode = d
      
      // Show new links
      if (opts.showLinks) {
        vue.selectedDeph = 1
        clearInterval(currIntervalID)
        currIntervalID = setInterval(drawDive, 100)
      } else {
        // If we have too many nodes, show only links over hovered node
        if (handleHover) handleHover(d)
      }
    },
    mouseout   (d,e) { 
      if (opts.showLinks) {
        resetLines(vue.selectedNode)

        vue.selectedDeph = 0
        clearInterval(currIntervalID)
      } 
    },
  })

  return nodeSelection
}
