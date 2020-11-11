
function makeScatter() {
  
  // Scatter functions
  const scaleLog = d3.scaleLog()
    .domain([0.1, 1e12])
    .range([0, 10000])
    .base(10)
    .nice()


  const getSX = (v: number) => scaleLog(v)
  const setSX = (v: number) => scaleLog.invert(v)
  
  // 3. Call the x axis in a group tag
  axisContainer.call(d3.axisTop(scaleLog).ticks(20, '.2s')) // Create an axis component with d3.axisBottom

  
  function updateNodeX(node) {
    node.x = getSX(node.complexity)
  }

  // Adjust starting positions
  const xObjs = {}
  graphNodes.forEach((node, i) => {
    updateNodeX(node)
    xObjs[node.x] = (xObjs[node.x] || 0) + 1
    node.y = xObjs[node.x] * 20
  })
  
  applyMouse(nodeSelection, {
    isGhost(d,e) { return (d as NodeDatum).isGhost },
    dragended(d,e) { 
      d.safeDive('outputs', {
        afterDive: link => {
          const node = link.from
          node.recalculateField('cost')
          updateNodeX(node)
        }
      })
      
      ticked()
    },
    dragged(d,e) {
      d.x = e.x
      d.y = e.y
      d.complexity = d.cost = setSX(d.x)
      d3.select(this).attr('transform', nodeT)
    },
  })
}
