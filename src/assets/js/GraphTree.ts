import { makeGraph } from "./graph";

export function makeGraphTree() {
  makeGraph()


  // Dispose previous
  if (simulation) {
    simulation.on('tick', null).stop()
    // selection.on(".drag", null);
    simulation = undefined
  }

  const opts = {
    showLinks:       graphNodes.length < 500,
    showCurvedLinks: graphNodes.length < 100,
    useReuse:        graphNodes.length > 500,
  }

  // ====================================================
  // Layout
  // ====================================================
  simulation = d3.forceSimulation(graphNodes)
    .force('charge', (opts.useReuse ? forceManyBodyReuse : d3.forceManyBody()).strength(-2000))
    .force('x', d3.forceX(xFnc).strength(1))
    .force('y', d3.forceY(vizHeight / 2).strength(d => usabFnc(d) + 1))
    .force('collision', d3.forceCollide().radius(sizeFnc).strength(0.75))
    .on('tick', ticked)

  // ====================================================
  // Links
  // ====================================================
  let handleHover
  let linkSelection

  // Connect graph nodes
  const graphLinks: LinkDatum[] = []
  for (let j = 0; j < graphNodes.length; j++) {
    const n = graphNodes[j]

    for (let i = 0; i < n.inputsAmount; i++) {
      const link = n.inputLinks[i]
      const source = graphNodes.findIndex(o => o.id === link.from.id)

      if (source > -1) {
        graphLinks.push({
          source: source,
          target: j,
          weight: link.weight,
          index: graphLinks.length,
        })
      }
    }
  }

  simulation
    .force('link', d3.forceLink(graphLinks).distance(diffSize/2).strength(1))

  linkContainer.selectAll('*').remove()
  

  if (opts.showLinks) {

    if (opts.showCurvedLinks) {
      linkSelection = 
        linkContainer
          .attr('fill', 'none')
          .selectAll('path')
          .data(graphLinks)
          .join('path')
          .attr('stroke-width', 1)
          .attr('stroke', '#555')
    } else {
      linkSelection = 
        linkContainer
          .attr('stroke', '#555')
          .attr('stroke-width', 1)
          .selectAll('line')
          .data(graphLinks)
          .join('line')
    }

    linkSelection.each(function(d3link, i) {
      const d3node = d3.select(this) // Current ONE node

      let foundLink = d3link.source.inputLinks.find(l => l.from === d3link.target)
      foundLink.d3node = d3node
      foundLink.flipped.d3node = d3node
    })
  }

  handleHover = overNode => {
    const filteredGraph = graphLinks.filter(l => l.target === overNode || l.source === overNode)

    linkSelection = linkContainer
      .attr('stroke-width', 3)
      .selectAll('line')
      .data(filteredGraph)
      .join('line')
      .attr('stroke', d => d.target === overNode ? '#7f7' : '#38f')
  }

}