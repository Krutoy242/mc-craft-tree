import * as d3 from 'd3'

function forceUpdate() {
  let next = 1
  return function (i: number) {
    const curr = Math.floor(20 * Math.log(i))
    if (curr !== next) {
      next = curr
      return true
    }
    return false
  }
}

export default (d3 as any).forceManyBodyReuse().update(forceUpdate)
