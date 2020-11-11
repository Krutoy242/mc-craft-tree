import * as d3 from "d3"

type datum = d3.SimulationNodeDatum

export function applyMouse(
  selection: any,
  cb: {
    isGhost?:     (d: datum, e: MouseEvent)=>boolean
    dragstarted?: (d: datum, e: MouseEvent)=>void
    dragended?:   (d: datum, e: MouseEvent)=>void
    dragged?:     (d: datum, e: MouseEvent)=>void
    mouseover?:   (d: datum, e: MouseEvent)=>void
    mouseout?:    (d: datum, e: MouseEvent)=>void
    click?:       (d: datum, e: MouseEvent, isRightclick:boolean)=>void
  }
) {
  selection.call(
    d3.drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended) as any
  )
    .on('mouseover',  (d: datum)=>cb.mouseover?.(d, (d3 as any).event))
    .on('mouseout',   (d: datum)=>cb.mouseout?.(d, (d3 as any).event))
    .on('click',      (d: datum)=>cb.click?.(d, (d3 as any).event, false))
    .on('contextmenu',(d: datum)=>{(d3 as any).event.preventDefault(); cb.click?.(d, (d3 as any).event, true)})
  
  function dragstarted(d: datum) {
    const e = (d3 as any).event
    e.sourceEvent.stopPropagation()
    if (!e.active) cb.dragstarted?.(d, e)
    d.fx = d.x
    d.fy = d.y
  }

  function dragged(d: datum) {
    const e = (d3 as any).event
    if (cb.isGhost?.(d, e)) return
    d.fx = e.x
    d.fy = e.y
  }

  function dragended(d: datum) {
    const e = (d3 as any).event
    if (!e.active) cb.dragended?.(d, e)
    d.fx = null
    d.fy = null
  }

}